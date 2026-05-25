import { useCallback, useEffect, useState } from 'react';
import type { MetaCache } from '../types';
import { syncMeta } from '../services/metaSync';
import { getMetaCache, getTimeSinceSync } from '../services/storage';

export function useMeta() {
  const [meta, setMeta] = useState<MetaCache | null>(getMetaCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState(getTimeSinceSync);
  const [currentMap, setCurrentMap] = useState<string | null>(null);
  const [currentRank, setCurrentRank] = useState<number | null>(null);

  // Initial load
  useEffect(() => {
    setLoading(true);
    syncMeta(null, null)
      .then(cache => {
        console.log('[useMeta] Loaded', cache.data.length, 'heroes');
        setMeta(cache);
        setLastSync(getTimeSinceSync());
      })
      .catch(err => {
        console.error('[useMeta] Error:', err);
        setError(err instanceof Error ? err.message : 'Sync failed');
      })
      .finally(() => setLoading(false));
  }, []);

  const doSync = useCallback(async (mapId: string | null, rank: number | null, force: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const cache = await syncMeta(mapId, rank, force);
      setMeta(cache);
      setLastSync(getTimeSinceSync());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const forceSync = useCallback(() => {
    doSync(currentMap, currentRank, true);
  }, [doSync, currentMap, currentRank]);

  const syncForMap = useCallback((mapId: string | null) => {
    setCurrentMap(mapId);
    doSync(mapId, currentRank, true);
  }, [doSync, currentRank]);

  const syncForRank = useCallback((rank: number | null) => {
    setCurrentRank(rank);
    doSync(currentMap, rank, true);
  }, [doSync, currentMap]);

  return { meta, loading, error, lastSync, currentMap, currentRank, forceSync, syncForMap, syncForRank };
}
