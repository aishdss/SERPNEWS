import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import { isSerpApiConfigured, fetchSerpApiNews } from './server/serpapi.js';
import { generateGenZTea, synthesizeSearchTopic, generateSpokenBriefing, createSynthesizedStoryHub } from './server/gemini.js';
import type { Category } from './src/types/news.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Status & Configuration info
  app.get('/api/status', (req, res) => {
    res.json(db.getStatus());
  });

  // Get Story Hubs (developing & long-term stories)
  app.get('/api/stories', (req, res) => {
    const category = (req.query.category as Category) || 'All';
    const search = (req.query.search as string) || '';
    const stories = db.getStories(category, search);
    res.json({ stories });
  });

  // Get Single Story Hub by ID
  app.get('/api/stories/:id', (req, res) => {
    const story = db.getStoryById(req.params.id);
    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }
    res.json({ story });
  });

  // Get News Articles
  app.get('/api/articles', (req, res) => {
    const category = (req.query.category as Category) || 'All';
    const search = (req.query.search as string) || '';
    const limit = Number(req.query.limit) || 40;

    // If few articles exist for this category and no search, auto-sync in background
    if (!search && isSerpApiConfigured()) {
      const currentCount = db.getArticles(category, '', 100).length;
      if (currentCount < 8) {
        db.syncWithSerpApi(category).catch(err => console.error(`Error auto-syncing ${category}:`, err));
      }
    }

    const articles = db.getArticles(category, search, limit);
    res.json({ articles });
  });

  // Generate / Refresh Gen Z "News Tea" mode for a story
  app.post('/api/stories/:id/tea', async (req, res) => {
    const story = db.getStoryById(req.params.id);
    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    const factsContext = `
Title: ${story.title}
Subtitle: ${story.subtitle}
What Happened: ${story.quickBrief.whatHappened}
Why It Matters: ${story.quickBrief.whyItMatters}
What's Next: ${story.quickBrief.whatsNext}
Timeline Milestone 1: ${story.timeline[0]?.title || ''} (${story.timeline[0]?.event || ''})
Latest Update: ${story.timeline[story.timeline.length - 1]?.title || ''} (${story.timeline[story.timeline.length - 1]?.event || ''})
What Initially Reported: ${story.howItChanged.initiallyReported}
What Later Confirmed: ${story.howItChanged.laterConfirmed}
`;

    const tea = await generateGenZTea(story.title, factsContext);
    if (tea) {
      story.teaMode = tea;
      db.addOrUpdateStory(story);
      res.json({ teaMode: tea });
    } else {
      res.json({ teaMode: story.teaMode });
    }
  });

  // On-demand SerpAPI sync
  app.post('/api/sync', async (req, res) => {
    const category = (req.body.category as Category) || 'All';
    const query = req.body.query as string | undefined;

    try {
      const result = await db.syncWithSerpApi(category, query);
      res.json({
        success: true,
        serpApiConfigured: isSerpApiConfigured(),
        ...result,
        status: db.getStatus(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Sync failed' });
    }
  });

  // Deep Search: returns existing stories/articles, or queries SerpAPI + Gemini to generate a StoryHub on demand
  app.post('/api/search', async (req, res) => {
    const query = (req.body.query as string || '').trim();
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    // 1. Check existing matches in database
    const matchingStories = db.getStories('All', query);
    const matchingArticles = db.getArticles('All', query);

    if (matchingStories.length > 0) {
      res.json({
        type: 'existing',
        stories: matchingStories,
        articles: matchingArticles,
      });
      return;
    }

    // 2. If no exact match and SerpAPI is active or Gemini is active, fetch live news for query
    let liveArticles = await fetchSerpApiNews(query, 'All');

    // If SerpAPI has no items or isn't configured, fall back to matching any articles
    if (liveArticles.length === 0 && matchingArticles.length > 0) {
      liveArticles = matchingArticles;
    }

    if (liveArticles.length > 0) {
      try {
        const fullStory = await createSynthesizedStoryHub(query, liveArticles, undefined, 'story-search');
        db.addOrUpdateStory(fullStory);

        res.json({
          type: 'generated',
          stories: [fullStory],
          articles: liveArticles,
        });
        return;
      } catch (synthErr) {
        console.error('Error synthesizing search story:', synthErr);
      }
    }

    res.json({
      type: 'empty',
      stories: [],
      articles: matchingArticles,
      message: `No developing stories found for "${query}". Try searching for Tech Antitrust, Semiconductor, Climate Treaty, or Moon Landing.`,
    });
  });

  // Audio flash briefing via Gemini TTS
  app.post('/api/audio-briefing', async (req, res) => {
    const text = req.body.text as string;
    if (!text) {
      res.status(400).json({ error: 'Text required' });
      return;
    }

    try {
      const audio = await generateSpokenBriefing(text);
      if (!audio) {
        res.status(500).json({ error: 'Audio generation failed' });
        return;
      }
      res.json({ audioBase64: audio.audioBase64, mimeType: audio.mimeType });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create the underlying HTTP server explicitly (instead of app.listen) so that
  // Vite's dev-mode WebSocket (used for HMR) can attach to the SAME server/port
  // that is actually exposed to the browser. Without this, Vite spins up its own
  // internal WebSocket listener on a different port, which isn't reachable through
  // proxies/tunnels — causing the browser console error:
  // "WebSocket closed without opened connection" / "WebSocket is closed before the
  // connection is established".
  const httpServer = http.createServer(app);

  // Setup Vite in Dev or static files in Production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Bind the WebSocket (HMR) server to our own http server instead of
        // letting Vite create (and listen on) a separate one of its own —
        // that's what caused the "WebSocket closed without opened connection"
        // browser error. `server.ws.server` is the current (non-deprecated)
        // home for this in Vite 6+ (`server.hmr.server` still works but logs
        // a deprecation warning). vite.config.ts's own `hmr` boolean (driven
        // by DISABLE_HMR) still controls whether HMR itself is on.
        ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SerpNews Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
