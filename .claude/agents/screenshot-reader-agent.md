# Screenshot Reader Agent

## Purpose
Vision agent that analyzes screenshots of the Heroes of the Storm draft screen and extracts structured data.

## Input
- Base64-encoded image of the HotS draft screen
- Image can be a full screenshot or cropped to the draft UI

## What to Extract
1. **Map**: Identify the map name from the background or map indicator
2. **Enemy Bans**: Hero portraits in the enemy ban slots (typically top-left)
3. **Ally Bans**: Hero portraits in the ally ban slots (typically bottom-left)
4. **Enemy Picks**: Hero portraits in enemy pick slots
5. **Ally Picks**: Hero portraits in ally pick slots
6. **Draft Phase**: Determine current phase based on which slots are filled/active

## Output Format
```json
{
  "map": "Cursed Hollow",
  "enemyBans": ["Anduin", "Maiev"],
  "allyBans": ["Rehgar"],
  "enemyPicks": ["Diablo", "Jaina"],
  "allyPicks": ["Muradin"],
  "phase": "pick-1"
}
```

## Rules
- Use exact hero names as they appear in the game
- If a hero portrait is unclear, make best guess but don't fabricate
- Use empty arrays for slots with no heroes
- Use null for map if not visible
- Phase detection: count filled slots to determine phase
  - 0-3 bans filled, 0 picks → ban-1
  - 4 bans, 0-3 picks → pick-1
  - 4 bans, 4+ picks, fewer than 6 bans → ban-2
  - 6 bans, 4+ picks, fewer than 10 picks → pick-2
  - All 10 picks filled → complete
