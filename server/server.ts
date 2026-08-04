import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDb } from './db.js';
import { createAgent } from './agent';
import { StreamMessage } from './types';
import { sendMail, verifyMailTransport } from './mailer';
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  generateResetToken,
  hashResetToken,
  type AuthedRequest,
} from './auth';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset requests, please try again later' },
});

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
const ALLOWED_ORIGINS = [
  'https://chat-ui-production-cb98.up.railway.app', // deployed frontend
];
const LOCALHOST_ORIGIN_RE = /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        LOCALHOST_ORIGIN_RE.test(origin) ||
        ALLOWED_ORIGINS.includes(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
const PORT = process.env.PORT || 4100;

// single shared db instance for auth routes (and passed into the agent factory)
const db = initDb(process.env.DB_PATH || './expenses.db');

// ---- auth routes ----

// Checks SMTP connectivity/credentials without sending an email — hit this
// after deploying to confirm EMAIL_USER/EMAIL_APP_PASSWORD are set correctly
// on that environment (e.g. Railway), since a bad Gmail app password
// otherwise only surfaces as a silent failure on /auth/forgot-password.
app.get('/health/mail', async (_req, res) => {
  try {
    await verifyMailTransport();
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Mail transport verification failed:', err?.code ?? err?.message ?? err);
    return res.status(503).json({ ok: false, error: 'mail transport unavailable' });
  }
});

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
    if (
      message.includes('users.email') ||
      message.includes('idx_users_email')
    ) {
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

app.post('/auth/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body ?? {};

  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  // Always respond the same way regardless of whether the email exists,
  // so this endpoint can't be used to discover registered accounts.
  const genericResponse = {
    message: 'If that email is registered, a reset link has been sent.',
  };

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
    | { id: number }
    | undefined;

  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  db.prepare(
    'UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?',
  ).run(tokenHash, expiresAt, user.id);

  const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;

  sendMail(
    email,
    'Reset your Expense Tracker password',
    `<p>Click the link below to reset your password. This link expires in 5 minutes.</p>
     <p><a href="${resetLink}">${resetLink}</a></p>
     <p>If you didn't request this, you can ignore this email.</p>`,
  ).catch((err) => {
    console.error(
      `Failed to send reset email to user ${user.id}:`,
      err?.code ?? err?.message ?? err,
    );
  });

  return res.json(genericResponse);
});

app.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body ?? {};

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword required' });
  }

  const tokenHash = hashResetToken(token);

  const user = db
    .prepare(
      'SELECT id, reset_token_expires_at FROM users WHERE reset_token_hash = ?',
    )
    .get(tokenHash) as
    | { id: number; reset_token_expires_at: string | null }
    | undefined;

  if (!user || !user.reset_token_expires_at) {
    return res.status(400).json({ error: 'invalid or expired reset link' });
  }

  if (new Date(user.reset_token_expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'invalid or expired reset link' });
  }

  const hash = await hashPassword(newPassword);

  db.prepare(
    'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ?',
  ).run(hash, user.id);

  return res.json({ message: 'password updated successfully' });
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
