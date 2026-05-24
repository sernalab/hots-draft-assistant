# Draft Reasoning Skill

## Purpose
Heuristics and rules for optimal draft reasoning in Heroes of the Storm.

## Counter-Pick Rules

### Against Dive Compositions
- If enemy picks 2+ dive heroes (Illidan, Tracer, Genji, Zeratul, Kerrigan):
  - Recommend tanks with displacement: E.T.C. (Mosh Pit), Garrosh (Warlord's Challenge)
  - Recommend healers with burst heal: Uther, Rehgar (Ancestral Healing)
  - Avoid immobile backliners: Sgt. Hammer, Chromie (without escape)

### Against Poke Compositions
- If enemy picks 2+ poke heroes (Chromie, Li-Ming, Hanzo, Fenix):
  - Recommend dive to close distance: Tyrael, Anub'arak
  - Recommend sustain healers: Malfurion, Lúcio
  - Avoid low-mobility tanks: Stitches, Johanna

### Against AA-Heavy Compositions
- If enemy picks 2+ auto-attack heroes (Valla, Raynor, Zul'jin):
  - Recommend blinds: Cassia, Li Li, Johanna
  - Recommend attack speed slows: Arthas

### Against Burst/Mage Compositions
- If enemy picks 2+ burst mages (Jaina, Kael'thas, Kel'Thuzad):
  - Recommend spell armor: Anub'arak, Tyrael
  - Recommend Medivh for Force of Will

## Synergy Rules

### Known Ult Combos (Wombo Combos)
| Setup | Follow-up | Rating |
|-------|-----------|--------|
| Zarya (Graviton Surge) | Any AoE damage | S |
| E.T.C. (Mosh Pit) | Jaina / Kael'thas / any AoE | S |
| Diablo (Apocalypse) | Jaina (Ring of Frost) | A |
| Maiev (Warden's Cage) | Any AoE damage | A |
| Dehaka (Isolation) | Zeratul (Void Prison) | A |
| Tyrande (Starfall) | E.T.C. (Mosh Pit) | A |
| Garrosh (Warlord's Challenge) | Kael'thas (Pyroblast) | B |

### Role Synergies
- **Dive core**: Tyrael + Illidan/Greymane + Abathur (hat the diver)
- **Sustain core**: Johanna + Valla/Raynor + Malfurion (long teamfights)
- **Burst core**: E.T.C. + Jaina + Kael'thas (Mosh → delete team)
- **Split core**: Dehaka + Zagara + Falstad (global pressure)

## Map-Specific Draft Rules

### Short Objective Maps (Infernal Shrines, Volskaya)
- Prioritize burst damage and AoE
- CC-heavy compositions win objective fights
- Draft 2+ heroes with AoE abilities

### Long Objective Maps (Cursed Hollow, Battlefield of Eternity)
- Prioritize sustain damage and healing
- Global heroes provide rotational advantage
- Marathon healers (Malfurion, Lúcio) outperform burst healers

### Two-Lane Maps (Braxis Holdout, Hanamura)
- Must have a strong solo laner
- Double soak is less important
- Teamfight happens on one point

### Large Maps (Warhead Junction, Cursed Hollow)
- Global heroes gain massive value
- Split push strategies are viable
- Avoid compositions that need to group 5

## Composition Checklist
Before finalizing recommendations, verify:
- [ ] Team has a main tank
- [ ] Team has a healer
- [ ] Team has sufficient CC (at least 3/5 heroes with CC)
- [ ] Team has waveclear
- [ ] Team has a win condition (late-game carry or teamfight combo)
- [ ] Team can handle the map's specific requirements

## Warning Triggers
Issue a warning when:
- No tank picked by pick phase 2
- No healer picked by pick phase 2
- 3+ heroes have no CC
- All damage is physical or all magical (easily countered by armor)
- Team has no waveclear (will lose structure race)
