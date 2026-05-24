# Tier List Parser Skill

## Purpose
Parse and normalize tier list data from public HotS resources.

## Sources

### IcyVeins
- URL: https://www.icy-veins.com/heroes/heroes-of-the-storm-general-tier-list
- Format: HTML table with heroes grouped by tier (S/A/B/C/D)
- Parse: Hero name, tier, role, notes
- Selector hints: `.htl_ban_true`, tier sections with hero names

### HotsGG
- URL: https://www.hotsgg.com/tier-list
- Format: Visual tier list with hero portraits
- Parse: Hero name, tier ranking
- May need to correlate by hero name

### HeroesProfile
- URL: https://www.heroesprofile.com/Global/Hero
- Format: Sortable table with statistics
- Parse: Hero name, win rate, pick rate, ban rate
- Data: Most accurate win rates available

## Normalization Rules

1. **Hero names**: Normalize to canonical names (e.g., "ETC" → "E.T.C.", "KT" → "Kael'thas")
2. **Tier mapping**: 
   - If source uses numbers (1-5), map to S/A/B/C/D
   - If source uses different labels, map to nearest tier
3. **Win rate**: Express as percentage (e.g., 54.2)
4. **Strong maps**: Derive from win rate per map if available, otherwise use meta knowledge
5. **Conflicts**: When sources disagree on tier, average the ratings. Win rate from HeroesProfile takes priority.

## Output Schema
```typescript
interface HeroMeta {
  hero: string;       // Canonical hero name
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  winRate: number;     // Percentage
  role: HeroRole;
  strongMaps: string[];
  notes: string;       // Brief meta note
}
```

## Error Handling
- If a source returns 404 or times out, skip it
- If parse fails for a hero, skip that hero (don't break the whole parse)
- Always return at least the cached data if all parses fail
