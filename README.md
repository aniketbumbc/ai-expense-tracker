# AI Expense Tracker

A full-stack, chat-driven expense tracker. Instead of forms and tables, you talk to an AI agent in natural language — it adds expenses, answers spending questions, and renders charts directly in the conversation.

> "Add $12 for lunch today" → expense saved
> "How much did I spend in July?" → agent queries the DB and answers
> "Show me a chart of my spending by month" → agent returns data the UI renders as a bar chart

## Project Highlights

- **Generative UI** — the AI doesn't just reply with text; it streams back structured tool results that the UI renders as rich components (e.g. bar charts).
- **Real-time streaming** — token-by-token AI replies and live tool-call events over Server-Sent Events (SSE).
- **LangGraph-powered agent** — a stateful, tool-calling agent (OpenAI `gpt-4o-mini`) with per-user conversation memory.
- **JWT auth** — register/login endpoints, hashed passwords (bcrypt), auth-scoped chat and data access.
- **Modern stack** — React 19, Vite 7, Tailwind CSS v4, TypeScript, Recharts on the frontend; Express 5, LangGraph, SQLite (`node:sqlite`) on the backend.

## Repository Layout

```
ai-expense-tracker/
├── chat-ui/   # React frontend — chat interface (Vite, Tailwind, Recharts)
└── server/    # Express backend — auth, LangGraph agent, SQLite storage
```

## Architecture

```
┌────────────────────┐        SSE (POST /chat)        ┌────────────────────┐
│  chat-ui (React)   │  ───────────────────────────▶  │  server (Express)  │
│  Vite + Tailwind   │  ◀───────────────────────────  │  LangGraph + OpenAI│
│  Port: 5173        │   event-stream of:              │  Port: 4100        │
│                    │     - ai (text tokens)           │                    │
│                    │     - toolCall:start             │                    │
│                    │     - tool (chart / result)      │                    │
└────────────────────┘                                 └──────────┬─────────┘
                                                                   │
                                                             ┌─────▼────┐
                                                             │ SQLite   │
                                                             │expenses.db│
                                                             └──────────┘
```

### Streamed message types

| Type             | Rendered as                                           |
| ----------------- | ------------------------------------------------------ |
| `ai`               | Chat bubble (appended token-by-token)                  |
| `toolCall:start`   | "Using tool: …" status with arguments                  |
| `tool`             | Tool result; for `generate_expense_chart` → bar chart  |

### Agent tools ([server/tools.ts](server/tools.ts))

| Tool                     | Purpose                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `add_expense`            | Insert a new expense `(title, amount, date)`                     |
| `get_expenses`           | Fetch expenses for the current user between two dates             |
| `generate_expense_chart` | Aggregate expenses by day/week/month/year for charting            |

Every tool is scoped to the authenticated user's `userId` — the model itself never sees or supplies a user ID.

## Getting Started

### Prerequisites

- Node.js with `pnpm`
- An OpenAI API key

### 1. Backend ([server/](server/))

```bash
cd server
pnpm install
```

Create a `.env` file:

```
OPENAI_API_KEY=your-key-here
JWT_SECRET=some-long-random-secret
JWT_EXPIRES_IN=30m
PORT=4100
```

```bash
pnpm dev   # starts on http://localhost:4100
```

SQLite tables (`users`, `expenses`) are created automatically on first run in `server/expenses.db`.

### 2. Frontend ([chat-ui/](chat-ui/))

```bash
cd chat-ui
pnpm install
pnpm dev   # starts on http://localhost:5173
```

The API base URL is configured in [chat-ui/src/lib/config.ts](chat-ui/src/lib/config.ts).

### 3. Use it

Open `http://localhost:5173`, register an account, and start chatting — e.g. "add $25 for groceries" or "chart my spending this month".

## API Overview ([server/server.ts](server/server.ts))

| Endpoint         | Method | Auth | Description                                  |
| ---------------- | ------ | ---- | --------------------------------------------- |
| `/register`      | POST   | –    | Create a user, returns a JWT                   |
| `/login`         | POST   | –    | Verify credentials, returns a JWT              |
| `/logout`        | POST   | –    | No-op (stateless JWT; client discards token)   |
| `/chat`          | POST   | JWT  | Streams agent responses via SSE                |
