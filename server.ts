import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getCollinsDefinition,
  validateCollinsWord,
  generateValidatedLadder,
  getCollinsApiKey,
  getDisqualifiedWordsSet,
  disqualifyWord
} from './src/server/collinsService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Prevent caching headers for all dictionary endpoints per Collins API terms
  const setNoCache = (res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Collins API Status
  const handleStatus = (req: express.Request, res: express.Response) => {
    setNoCache(res);
    const hasKey = Boolean(getCollinsApiKey());
    res.json({
      status: 'ok',
      provider: 'Collins English Dictionary API',
      apiKeyConfigured: hasKey,
      mode: hasKey ? 'live_collins_api' : 'offline_fallback',
    });
  };
  app.get('/api/status', handleStatus);
  app.get('/api/dictionary/status', handleStatus);

  // Collins Dictionary Definition lookup
  const handleDefinition = async (req: express.Request, res: express.Response) => {
    setNoCache(res);
    const word = (req.query.word as string) || req.body?.word;
    if (!word || typeof word !== 'string') {
      res.status(400).json({ error: 'A valid "word" query parameter is required.' });
      return;
    }
    const result = await getCollinsDefinition(word);
    res.status(result.found ? 200 : 404).json(result);
  };
  app.get('/api/definition', handleDefinition);
  app.get('/api/dictionary/definition', handleDefinition);

  // Collins Dictionary Word validation
  const handleValidate = async (req: express.Request, res: express.Response) => {
    setNoCache(res);
    const word = (req.query.word as string) || req.body?.word;
    if (!word || typeof word !== 'string') {
      res.status(400).json({ error: 'A valid "word" query parameter is required.' });
      return;
    }
    const result = await validateCollinsWord(word);
    res.status(200).json(result);
  };
  app.get('/api/validate', handleValidate);
  app.get('/api/dictionary/validate', handleValidate);

  // Collins Validated Solvable Ladder Generation
  const handleLadderGenerate = async (req: express.Request, res: express.Response) => {
    setNoCache(res);
    const length = parseInt((req.query.length as string) || req.body?.length, 10) || 4;
    const minSteps = parseInt((req.query.minSteps as string) || req.body?.minSteps, 10) || 4;
    const maxSteps = parseInt((req.query.maxSteps as string) || req.body?.maxSteps, 10) || 7;
    const ladder = await generateValidatedLadder(length, minSteps, maxSteps);
    if (!ladder) {
      res.status(500).json({ error: 'Unable to generate validated Collins ladder matching constraints.' });
      return;
    }
    res.status(200).json(ladder);
  };
  app.get('/api/ladder/generate', handleLadderGenerate);
  app.get('/api/dictionary/ladder/generate', handleLadderGenerate);

  // Disqualified words management (blocked from all puzzle generations)
  app.get('/api/dictionary/disqualified', (req, res) => {
    setNoCache(res);
    res.json({ disqualified: Array.from(getDisqualifiedWordsSet()) });
  });

  app.post('/api/dictionary/disqualify', (req, res) => {
    setNoCache(res);
    const word = req.body?.word;
    if (word && typeof word === 'string') {
      disqualifyWord(word);
      res.json({ success: true, word: word.toUpperCase() });
    } else {
      res.status(400).json({ error: 'Word parameter required' });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
