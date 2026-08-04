import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { createAgent } from './agent';
import { StreamMessage } from './types';
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  type AuthedRequest,
} from './auth';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173', // local dev
      'http://localhost:5174', // local dev (vite fallback port)
      'https://chat-ui-production-cb98.up.railway.app', // deployed frontend
    ],
    credentials: true,
  }),
);
const PORT = process.env.PORT || 4100;

// single shared db instance for auth routes (and passed into the agent factory)
const db = initDb('./expenses.db');

// ---- auth routes ----

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body ?? {};

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ error: 'username, password and email required' });
  }

  try {
    const hash = await hashPassword(password);
    const info = db
      .prepare(
        'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
      )
      .run(username, hash, email);

    const userId = Number(info.lastInsertRowid);
    const token = signToken(userId);
    return res
      .status(201)
      .json({ token, user: { id: userId, username, email } });
  } catch (err: any) {
    const message = String(err?.message);
    if (message.includes('users.username')) {
      return res.status(409).json({ error: 'username already taken' });
    }
    if (message.includes('users.email') || message.includes('idx_users_email')) {
      return res.status(409).json({ error: 'email already in use' });
    }
    console.error(err);
    return res.status(500).json({ error: 'could not register' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const row = db
    .prepare('SELECT id, password_hash, email FROM users WHERE username = ?')
    .get(username) as
    | { id: number; password_hash: string; email: string | null }
    | undefined;

  if (!row) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = signToken(row.id);
  return res.json({
    token,
    user: { id: row.id, username, email: row.email },
  });
});

// Stateless JWT: logout is a client-side token discard.
// Endpoint exists so the frontend has something to call.
app.post('/logout', (_req, res) => {
  return res.json({ ok: true });
});

// ---- chat (protected) ----

app.post('/chat', requireAuth, async (req: AuthedRequest, res) => {
  const { query } = req.body;
  const userId = req.userId!; // guaranteed by requireAuth
  console.log(query);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // per-request agent with tools scoped to this user
  const agent = createAgent(db, userId);

  const result = await agent.stream(
    {
      messages: [
        {
          role: 'user',
          content: `${query}`,
        },
      ],
    },

    {
      configurable: {
        thread_id: `user-${userId}`, // each user gets their own conversation memory
      },
      streamMode: ['messages', 'custom'],
    },
  );

  for await (const [eventType, chunk] of result) {
    let messsage: StreamMessage;
    if (eventType === 'custom') {
      console.log('custom message', chunk);
      messsage = chunk;
    } else if (eventType === 'messages') {
      if (chunk[0].content.length === 0 || chunk[0].content === '') continue;
      let messageType = chunk[0]?.type;
      if (messageType === 'ai') {
        messsage = { type: 'ai', payload: { text: chunk[0].content } };
      } else if (messageType === 'tool') {
        messsage = {
          type: 'tool',
          payload: {
            name: chunk[0].name,
            result: JSON.parse(chunk[0].content),
          },
        };
      }
    }

    res.write(`event:${eventType}\n`);
    res.write(`data:${JSON.stringify(messsage)}\n\n`);
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} Host: http://localhost:${PORT}`,
  );
});
