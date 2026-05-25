import type { MetaCache, UserPreferences } from '../types';

const KEYS = {
  META_CACHE: 'hots_meta_cache',
  USER_PREFS: 'hots_user_preferences',
  DRAFT_STATE: 'hots_draft_state',
} as const;

export function getMetaCache(): MetaCache | null {
  try {
    const raw = localStorage.getItem(KEYS.META_CACHE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetaCache;
    // Validate cache has new format (pickRate field exists on first entry)
    if (parsed.data?.length > 0 && parsed.data[0].pickRate === undefined) {
      localStorage.removeItem(KEYS.META_CACHE);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setMetaCache(cache: MetaCache): void {
  localStorage.setItem(KEYS.META_CACHE, JSON.stringify(cache));
}

export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(KEYS.USER_PREFS);
    if (!raw) return { heroPool: [], mainRole: null, playstyleNotes: '' };
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return { heroPool: [], mainRole: null, playstyleNotes: '' };
  }
}

export function setUserPreferences(prefs: UserPreferences): void {
  localStorage.setItem(KEYS.USER_PREFS, JSON.stringify(prefs));
}

export function getTimeSinceSync(): string {
  const cache = getMetaCache();
  if (!cache) return 'never';

  const diff = Date.now() - cache.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
