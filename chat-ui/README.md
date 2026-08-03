# AI Expense Tracker — Chat UI

A modern, streaming chat interface for an AI-powered expense tracker. The assistant can **add expenses**, **query expenses by date range**, and **generate interactive bar charts** of your spending — all from natural-language conversations.

This package (`chat-ui`) is the **frontend**. It talks to a sibling backend in `../server` over **Server-Sent Events (SSE)**.

---

## Project Highlights

- **Generative UI** — the AI doesn't just reply with text; it streams back structured tool results that the UI renders as rich components (e.g. bar charts).
- **Real-time streaming** — token-by-token AI replies and live tool-call events via SSE.
- **LangGraph-powered agent** — a stateful tool-calling agent on the backend (see `../server`).
- **Modern stack** — React 19, Vite 7, Tailwind CSS v4, TypeScript 5.9, Recharts, shadcn-style components.

---

## Architecture

```
┌────────────────────┐        SSE (POST /chat)        ┌────────────────────┐
│  chat-ui (React)   │  ───────────────────────────▶  │  server (Express)  │
│  Vite + Tailwind   │  ◀───────────────────────────  │  LangGraph + OpenAI│
│  Port: 5173        │   event-stream of:             │  Port: 4100        │
│                    │     - ai (text tokens)         │                    │
│                    │     - toolCall:start           │                    │
│                    │     - tool (chart / result)    │                    │
└────────────────────┘                                └──────────┬─────────┘
                                                                 │
                                                            ┌────▼─────┐
                                                            │ SQLite   │
                                                            │ expenses │
                                                            └──────────┘
```

### Streamed message types

The backend streams a discriminated union of messages that the frontend renders differently:

| Type             | Rendered as                                            |
| ---------------- | ------------------------------------------------------ |
| `ai`             | Chat bubble (appended token-by-token)                  |
| `toolCall:start` | "Using tool: …" status with arguments                  |
| `tool`           | Tool result; for `generate_expense_chart` → bar chart  |

### Backend tools

| Tool                     | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `add_expense`            | Insert a new expense `(title, amount, date)`       |
| `get_expenses`           | Fetch expenses between two dates                   |
| `generate_expense_chart` | Aggregate by `date` / `week` / `month` / `year`    |

---

## Tech Stack

**Frontend (`chat-ui`)**

- React 19 + TypeScript
- Vite 7 (with the React Compiler Babel plugin)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Recharts 2 — bar charts
- `@microsoft/fetch-event-source` — SSE client over POST
- `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority` — UI utilities

**Backend (`../server`)**

- Node.js + Express 5
- LangChain + LangGraph (`@langchain/langgraph`)
- `@langchain/openai` (model: `gpt-4o-mini`)
- `node:sqlite` for storage
- Zod for tool schemas

---

## Project Structure

```
chat-ui/
├── src/
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # React entry
│   ├── type.ts                  # StreamMessage discriminated union
│   ├── lib/
│   │   └── utils.ts             # cn() — clsx + tailwind-merge
│   └── componets/               # (typo preserved) UI components
│       ├── ChatContainer.tsx    # Layout, SSE wiring, message state
│       ├── ChatInput.tsx        # Auto-resizing textarea + submit
│       ├── ChatMessage.tsx      # Renders user / ai / tool messages
│       ├── ExpenseChart.tsx     # Recharts bar chart for tool output
│       └── ui/                  # shadcn-style primitives (chart, card)
├── public/
├── index.html
├── vite.config.ts
├── tsconfig*.json
└── package.json
```

---

## Prerequisites

- **Node.js 20+** (the backend uses `node:sqlite`, which needs Node 22.5+ for stable use — Node 22 LTS recommended)
- **npm** (or pnpm/yarn — backend declares `pnpm@10.33.0` as the package manager)
- An **OpenAI API key**

---

## Important Setup Steps

The chat UI is useless without the backend running. Start **both** the server and the UI.

### 1. Start the backend (`../server`)

```bash
cd ../server

# Create a .env with your OpenAI key
echo "OPENAI_API_KEY=sk-..." > .env

# Install deps (pnpm is declared, npm also works)
pnpm install     # or: npm install

# Run the API on http://localhost:4100
pnpm dev         # or: npm run dev
```

The server exposes `POST /chat` and writes back an SSE stream. It auto-initializes `expenses.db` (SQLite) on first run.

### 2. Start the chat UI (this package)

```bash
cd chat-ui

npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

> **Note**: the API URL is currently hard-coded to `http://localhost:4100/chat` in `src/componets/ChatContainer.tsx`. Change it there if you deploy elsewhere — or refactor it into a `VITE_API_URL` env var.

---

## Available Scripts

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start Vite dev server with HMR                |
| `npm run build`   | Type-check (`tsc -b`) and build for production|
| `npm run preview` | Preview the production build locally          |
| `npm run lint`    | Run ESLint over the project                   |

---

## Example Prompts to Try

Once both servers are running, try:

- `Add a $12.50 coffee expense.`
- `Add lunch for 24 dollars.`
- `How much did I spend between 2026-04-01 and 2026-04-30?`
- `Show me a bar chart of my expenses grouped by month.`
- `Visualize my spending this week.`

The third / fourth prompts will trigger the `generate_expense_chart` tool and render a Recharts bar chart inline in the conversation.

---

## How Streaming Works (Quick Tour)

1. `ChatInput` submits the user's text to `ChatContainer.submitQuery`.
2. `submitQuery` opens a `fetchEventSource` POST to `/chat` with `{ query }`.
3. The server runs the LangGraph agent with `streamMode: ['messages', 'custom']`.
4. Each chunk is wrapped into a `StreamMessage` and written as an SSE `data:` line.
5. `onmessage` in `ChatContainer` parses the chunk and updates React state:
   - `ai` chunks are appended to the last AI message (token-by-token).
   - `toolCall:start` and `tool` chunks are pushed as new entries.
6. `ChatMessage` switches on `message.type` and picks the right component, including `ExpenseChart` when the tool name is `generate_expense_chart`.

---

## Configuration Notes & Gotchas

- **Tailwind v4** is wired in via `@tailwindcss/vite`; there is no `tailwind.config.js`.
- **Path alias**: `@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`).
- **React Compiler** is enabled through `babel-plugin-react-compiler` in `vite.config.ts`.
- **Folder name typo**: `src/componets/` (instead of `components/`) — preserved for now to avoid a churny rename.
- **CORS** is enabled wide-open on the backend for local dev. Lock it down before deploying.
- **Thread ID** is hard-coded to `user-1` on the server (`thread_id: 'user-1'`); replace with a per-session ID for real multi-user usage.

---

## Roadmap / Ideas

- Move API URL into `VITE_API_URL`.
- Per-session `thread_id` and conversation history persistence.
- More chart types (line / pie) and category-based grouping.
- Edit / delete expense tools.
- Auth + per-user databases.

---

## License

Private / unlicensed — for learning and demo purposes.
