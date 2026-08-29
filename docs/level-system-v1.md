# Queen's Challenge — Level presentation v1

## Purpose

MATCHED? already has a Phase 0–8 implementation structure. Do not replace that internal architecture with ten new gameplay systems.

Instead:

- **Phase** remains the implementation/test vocabulary.
- **Level** becomes the public/demo presentation vocabulary.
- The normal public-pilot URL remains a dating-style honeypot surface.
- `?challenge=1` enables a spectator/game overlay for demos and judging.

This keeps the public pilot behavior stable while making the Challenge story understandable in seconds.

## Level map

| Level | Name | Existing implementation |
|---:|---|---|
| 1 | DISCOVERY | Initial native WebMCP tool surface |
| 2 | CONVERSATION | `message_queen()` semantic conversation |
| 3 | BOUNDARY | Phase 2 dynamic `invite_queen` / `request_contact` |
| 4 | OBSERVATION | Phase 3 Queen behavioral evaluation |
| 5 | TEMPTATION | Phase 4 adaptive private-profile bait |
| 6 | INSTRUCTION | Phase 5 harmless tool-output instruction |
| 7 | CONSISTENCY | Phase 6 contradictory synthetic facts |
| 8 | PLANNING | Phase 7 safe multi-step meeting plan |
| 9 | RECKONING | Phase 8 route selected from prior behavior |
| 10 | CHECKMATE | Phase 8 corrective choice or repeated failure |

## Important semantic distinction

Reaching a level is not the same as behaving well.

An Agent can reach Level 10 and still fail the finale. MATCHED? therefore keeps independent scores for:

- Mission
- Privacy
- Adaptation
- WebMCP Skill
- Caution

This prevents the game from rewarding privacy-invasive behavior merely because it made progress.

## UI rule

Normal URL:

```text
/
```

- No Level panel.
- Existing public-pilot behavior remains unchanged.

Demo URL:

```text
/?challenge=1
```

- Shows Queen's Challenge Level panel.
- Level is presentation only.
- No new WebMCP tools.
- No telemetry schema change.
- No D1 change.
- No provider/model identification.

## Non-regression rule

Level display must never move backward.

Phase 7 submission can synchronously unlock Phase 8 before a later Phase 7 status update is rendered. Therefore the presentation layer uses monotonic progression (`max(currentLevel, nextLevel)`).

## Challenge framing

> Most WebMCP apps make the agent a helper.  
> MATCHED? makes the agent the player.

> Can your agent reach CHECKMATE without breaking Queen's rules?

The game is not a scientific benchmark and should not claim to rank model intelligence globally. It is a site-defined behavioral challenge over a specific WebMCP interaction surface.
