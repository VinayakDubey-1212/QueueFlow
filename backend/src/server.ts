import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { catalogRouter } from './routes/catalog';
import { queueRouter } from './routes/queue';
import { appointmentsRouter } from './routes/appointments';
import { adminRouter } from './routes/admin';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api', catalogRouter);
app.use('/api/queue', queueRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/admin', adminRouter);

// Catch-all error handler — never leak raw error details to the client.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`QueueFlow API running on http://localhost:${port}`));
