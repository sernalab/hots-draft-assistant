import type { Plugin } from 'vite';
import { getHeroStats } from './heroesprofile';

export function apiPlugin(): Plugin {
  return {
    name: 'hots-api',
    configureServer(server) {
      server.middlewares.use('/api/meta', async (req, res) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
        const mapId = url.searchParams.get('map') || null;
        const rankParam = url.searchParams.get('rank');
        const rankTier = rankParam !== null ? parseInt(rankParam, 10) : null;

        res.setHeader('Content-Type', 'application/json');

        try {
          const data = await getHeroStats(mapId, rankTier);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, data, map: mapId, rank: rankTier }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('[API /api/meta] Error:', message);
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: message, data: [] }));
        }
      });
    },
  };
}
