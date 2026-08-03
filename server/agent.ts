import { ChatOpenAI } from '@langchain/openai';
import { MessagesAnnotation } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { StreamMessage } from './types';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import type { DatabaseSync } from 'node:sqlite';
import { initTools } from './tools';
import { StateGraph } from '@langchain/langgraph';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import * as dotenv from 'dotenv';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is not set');
}

// ---- shared singletons (NOT per-user) ----

// One checkpointer across all users. thread_id (user-${id}) keeps each
// user's conversation separate within it. A fresh one per request would
// wipe memory every message.
const checkpointer = new MemorySaver();

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
  apiKey: openaiApiKey,
});

// ---- pure routing (no user scope) ----

const shouldContinue = async (
  state: typeof MessagesAnnotation.State,
  config: LangGraphRunnableConfig,
) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    const customMessage: StreamMessage = {
      type: 'toolCall:start',
      payload: {
        name: lastMessage.tool_calls[0].name,
        args: lastMessage.tool_calls[0].args,
      },
    };
    config.writer?.(customMessage);
    return 'tools';
  }
  return '__end__';
};

const shouldCallModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as ToolMessage;

  const messageContent = JSON.parse(lastMessage.content as string);

  if (messageContent.type === 'chart') {
    return '__end__';
  }
  return 'callModel';
};

// ---- per-user agent factory ----

export const createAgent = (db: DatabaseSync, userId: number) => {
  // tools are scoped to this user; the model never sees user_id
  const tools = initTools(db, userId);
  const toolNode = new ToolNode(tools);

  const callModel = async (
    state: typeof MessagesAnnotation.State,
    config: LangGraphRunnableConfig,
  ) => {
    const llmWithTools = llm.bindTools(tools);

    const response = await llmWithTools.invoke([
      {
        role: 'user',
        content: `You are a helpful assistant that can add expenses to the expense tracker. currenttime is ${new Date().toISOString()} 
      Call add_expense tool to add an expense to the database. call if needed get_expenses tool to get total amount of expenses from the database between two dates Show the total amount of expenses in the response. 
      Call generate_expense_chart tool only when user needs to visualize the expenses data
      Important:
      1. ONLY ANSWER EXPENSE AND MONEY RELATED QUESTION NEED TO ANSWERS.
      2. OTHER QUESTIONS SEND MESSAGE I AM ONLY EXPENSE AGENT. EXPENSE AND MONEY RELATED QUESTION ONLY.
      
      .
      `,
      },
      ...state.messages,
    ]);

    return {
      messages: [response],
    };
  };

  const graph = new StateGraph(MessagesAnnotation)
    .addNode('callModel', callModel)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'callModel')
    .addConditionalEdges('callModel', shouldContinue, {
      tools: 'tools',
      __end__: '__end__',
    })
    .addConditionalEdges('tools', shouldCallModel, {
      callModel: 'callModel',
      __end__: '__end__',
    });

  return graph.compile({ checkpointer });
};
