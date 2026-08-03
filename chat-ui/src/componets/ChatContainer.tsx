import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { QuickAddExpense } from './QuickAddExpense';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { API_BASE_URL } from '@/lib/config';
import { Moon, Sun } from 'lucide-react';
import type { StreamMessage } from '../types.ts';


export function ChatContainer() {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string>('');
  const { token, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [messages, setMessages] = useState<StreamMessage[]>(
    []
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  async function submitQuery(query: string){

    setMessages([...messages, { id: uuidv4(), type: 'user', payload: { text: query } }]);
    await fetchEventSource(`${API_BASE_URL}/chat`, {
      async onopen(res) {
        if (res.status === 401) {
          logout();
          throw new Error('Session expired');
        }
      },
      onmessage(ev) {
        const parsedData: StreamMessage = JSON.parse(ev.data);

        if(parsedData.type === 'ai') {
          setMessages((prev)=>{

            const lastMessage = prev[prev.length - 1];
            if(lastMessage && lastMessage.type === 'ai') {
              const cloneMessage =  [...prev ];
              cloneMessage[cloneMessage.length - 1] = {
                ...lastMessage,
                payload: {
                  text: lastMessage.payload.text + parsedData.payload.text,
                },
              };
              return cloneMessage;
            }else{
              return [
                ...prev,
                {
                  id: uuidv4(),
                  type: 'ai',
                  payload: { text: parsedData.payload.text || '' },
                },
              ]
            }
          })
        } else if(parsedData.type === 'tool') {
         
          setMessages((prev)=>{
            return[
              ...prev,
              {
                id: uuidv4(),
                type: 'tool',
                payload: parsedData.payload,
              },
            ]
          })
        } else if(parsedData.type === 'toolCall:start') {
          setMessages((prev)=>{
            return[
              ...prev,
              {
                id: uuidv4(),
                type: 'toolCall:start',
                payload:parsedData.payload
              },
            ]
          })
          //setMessages([...messages, parsedData]);
        }
      },
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
  });
  }

  // useEffect(() => {
  //   console.log("useEffect"query);
  //   submitQuery(query);
  // },[])


  

  const goHome = () => {
    setMessages([]);
    setQuery('');
  };

  const onSubmit = (userInput: string) => {
    console.log('user input', userInput);
    setQuery(userInput);
    submitQuery(userInput);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-xl w-full">
        <div className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-3 text-left rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                AI Expense Tracker
              </h1>
              <p className="text-xs text-muted-foreground">
                Powered by advanced AI
              </p>
            </div>
          </button>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-lg">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {user.username.charAt(0).toUpperCase() +
                    user.username.slice(1)}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-full bg-muted text-muted-foreground border border-border cursor-pointer hover:text-foreground hover:shadow-md hover:scale-105 active:scale-95 transition-all">
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5" />
              ) : (
                <Moon className="w-4.5 h-4.5" />
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground border border-border cursor-pointer hover:text-destructive hover:border-destructive/40 hover:shadow-md hover:scale-105 active:scale-95 transition-all">
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="w-full max-w-5xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-2xl mb-6 animate-pulse">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Track your spending, effortlessly
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Log expenses, pull up your spending history, and
                visualize where your money goes — just ask.
              </p>
              <QuickAddExpense onSubmit={onSubmit} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                {[
                  {
                    icon: '🧾',
                    title: 'View recent expenses',
                    desc: 'See what you spent this month',
                    prompt: 'Show me my expenses for this month',
                  },
                  {
                    icon: '📊',
                    title: 'Spending chart',
                    desc: 'Visualize expenses over time',
                    prompt:
                      'Show me a chart of my expenses this month grouped by week',
                  },
                  {
                    icon: '💰',
                    title: 'Monthly summary',
                    desc: 'How much have I spent so far?',
                    prompt: 'How much have I spent so far this month?',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSubmit(item.prompt)}
                    className="p-4 rounded-xl bg-muted/40 border border-border hover:border-purple-500/50 transition-all cursor-pointer group">
                    <div className="text-2xl mb-2">
                      {item.icon}
                    </div>
                    <div className="text-sm font-medium text-foreground group-hover:text-purple-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {/* Messages will be displayed here... */}
              {messages.map((message) => {
                return (
                  <div key={message.id}>
                    <ChatMessage message={message} />
                  </div>
                );
              })}

              <div ref={messageEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 w-full">
        <ChatInput onSubmit={onSubmit} />
      </div>
    </div>
  );
}