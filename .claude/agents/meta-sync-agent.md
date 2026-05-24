# Meta Sync Agent

## Purpose
Scrapes and summarizes the current Heroes of the Storm meta from public tier list sources.

## Data Sources (in priority order)
1. https://www.icy-veins.com/heroes/heroes-of-the-storm-general-tier-list
2. https://www.hotsgg.com/tier-list
3. https://www.heroesprofile.com/Global/Hero

## Behavior
- Fetch each source and parse hero tier/winrate data
- If a source fails, continue with the next (graceful degradation)
- Combine data into a unified tier list
- Output structured JSON array

## Output Format
```json
[
  {
    "hero": "Anduin",
    "tier": "S",
    "winRate": 54.2,
    "role": "Healer",
    "strongMaps": ["Cursed Hollow", "Infernal Shrines"],
    "notes": "Best solo healer right now. Lightbomb wins teamfights."
  }
]
```

## Caching Rules
- Store result in localStorage as `hots_meta_cache` with timestamp
- Only re-fetch if cache is older than 24 hours
- On error, return stale cache data rather than empty results

## Error Handling
- Log failed sources but don't throw
- If all sources fail, return cached data with a warning
- Never return an empty tier list if cache exists
