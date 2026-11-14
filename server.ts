import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

/**
 * Development and self-hosted static server only.
 * Cloudflare Pages serves the built SPA directly. Student progress is device-local;
 * there is intentionally no shared, unauthenticated student-data endpoint.
 */
async function startServer() {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'boilermaker-academy' });
  });

  app.all(['/api/progress', '/api/progress/reset'], (_req, res) => {
    res.status(410).json({ error: 'Shared progress API retired. Use device-local study mode.' });
  });

  app.use('/api/ai', (_req, res) => {
    res.status(503).json({ error: 'AI features are temporarily unavailable.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Boilermaker Academy server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
