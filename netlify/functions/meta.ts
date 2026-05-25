import { getHeroStats } from '../../server/heroesprofile';

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const mapId = url.searchParams.get('map') || null;
  const rankParam = url.searchParams.get('rank');
  const rankTier = rankParam !== null ? parseInt(rankParam, 10) : null;

  try {
    const data = await getHeroStats(mapId, rankTier);
    return new Response(
      JSON.stringify({ ok: true, data, map: mapId, rank: rankTier }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, s-maxage=600',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[netlify/meta] Error:', message);
    return new Response(
      JSON.stringify({ ok: false, error: message, data: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/meta',
};
