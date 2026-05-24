import { useCallback, useEffect, useState } from 'react';
import type { HeroMeta, MetaCache } from '../types';
import { syncMeta, getMetaByTier } from '../services/metaSync';
import { getMetaCache, getTimeSinceSync } from '../services/storage';

export function useMeta() {
  const [meta, setMeta] = useState<MetaCache | null>(getMetaCache);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(getTimeSinceSync);

  useEffect(() => {
    // Auto-sync on mount if cache is empty or expired
    syncMeta().then(cache => {
      setMeta(cache);
      setLastSync(getTimeSinceSync());
    });
  }, []);

  const forceSync = useCallback(async () => {
    setLoading(true);
    try {
      const cache = await syncMeta(true);
      setMeta(cache);
      setLastSync(getTimeSinceSync());
    } finally {
      setLoading(false);
    }
  }, []);

  const getTierList = useCallback((tier: HeroMeta['tier']) => {
    return getMetaByTier(tier);
  }, []);

  return {
    meta,
    loading,
    lastSync,
    forceSync,
    getTierList,
  };
}
