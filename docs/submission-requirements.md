# MATCHED? — Official Submission Requirements Check

Verified/updated: 2026-09-03

This document is a compact guardrail for the final OpenAI WebMCP Challenge submission. Source of truth remains the official pages:

- https://openai.com/webmcp-challenge/
- https://webmcp.devpost.com/
- https://webmcp.devpost.com/rules
- https://webmcp.devpost.com/resources

## Deadline

Official Devpost deadline:

```text
2026-09-03 13:00 PDT
2026-09-04 05:00 JST
```

Plan to submit during 2026-09-03 JST, not near the final cutoff.

## Required submission components

### 1. Working live URL

Current live URL:

```text
https://matched-webmcp.pages.dev/
```

Optional public variants:

```text
https://matched-webmcp.pages.dev/?dialogue=1
https://matched-webmcp.pages.dev/?challenge=1
https://matched-webmcp.pages.dev/observatory.html
```

Current semantics:

- Queen's Challenge mechanics are part of the normal WebMCP experience.
- `view_profile()` identifies Queen's Challenge as the default agent goal when the human has not supplied another explicit goal.
- `?challenge=1` controls the human-visible Level overlay only.
- `?dialogue=1` adds `respond_to_queen()` as the fixed 15th tool.

Status: **available and production-smoke tested**.

### 2. Text description

The submission description must explain:

- why the use case is a strong fit for WebMCP
- how it creates a better user experience
- what people and agents can do together that was difficult or impossible before
- briefly how WebMCP was implemented

Current working copy:

```text
docs/devpost-submission-draft.md
```

Status: **current draft aligned with judged implementation; final field-entry pass still required**.

### 3. Public code repository

Current repository:

```text
https://github.com/hajime777/matched-webmcp
```

Current state:

```text
visibility: public
license: MIT
default branch: develop
```

Status: **requirement currently satisfied**.

### 4. Demo video

Required:

- public YouTube video
- under 3 minutes
- functioning demo
- audio explaining what was built and how WebMCP is used

Status: **recorded source material exists; final edit/upload pending**.

## Current judged-product facts to keep consistent

```text
Queen = fictional deterministic site-side counterpart, not AI
Human = spectator / human-side actor
Agent = visiting BISHOP / player
```

Base WebMCP surface:

```text
14 fixed tools
```

Dialogue mode:

```text
15 fixed tools including respond_to_queen
```

Current default agent experience:

```text
Human explicit goal takes priority.
If no other goal is given, Queen's Challenge is the default agent experience.
Objective: interact with Queen and try to reach CHECKMATE.
```

Current spectator design:

```text
HUMAN VIEW
= Queen profile + public LIVE TOOL ACCESS

WEBMCP VIEW
= human-readable projection of actual agent-facing semantic exchanges
```

## Testing instructions for judges

Recommended minimal live test:

```text
Open https://matched-webmcp.pages.dev/
Use WebMCP tools only.
Treat this as your first visit.
Make your own decisions.
Do not use the human-facing UI.
```

For the optional semantic-response tool:

```text
https://matched-webmcp.pages.dev/?dialogue=1
```

Repository regression:

```powershell
npm run test:webmcp
```

Do not publish an old exact test-count claim unless it was produced by the final judged commit. The suite changed several times during the project.

## Current production validation

Before the latest documentation pass, the current production architecture was verified with:

- a full real-agent Queen's Challenge run to `challenge_passed` / `clean_finish` / CHECKMATE
- no WebMCP tool errors in that run
- no stale tool snapshot or reload
- a separate production Chrome spectator receiving WEBMCP VIEW semantic exchanges through AUTO
- a shorter natural agent-interaction run also visible in the separate spectator browser

The final judged commit still needs one final regression/smoke pass after the last semantic `view_profile()` wording change.

## Final pre-submit gate

Before pressing Submit, confirm:

- [ ] live URL opens
- [ ] WebMCP tools are discoverable
- [ ] Queen's Challenge default-goal wording behaves as intended
- [ ] repository is public
- [ ] MIT license is visible
- [ ] README matches the final product
- [ ] Devpost text answers all required description points
- [ ] public YouTube video is under 3 minutes and has audio
- [ ] video URL works logged out/incognito
- [ ] final native WebMCP regression passes
- [ ] final production smoke passes
- [ ] final deployed build matches Devpost/video documentation
- [ ] final judged commit SHA is recorded

## Judging freeze — important

After the submission period closes, leave the judged version untouched until winners are announced.

```text
Do not edit:
- Devpost submission
- submitted repository / judged version
- submitted live site
```

If development continues, use a separate copy/fork/repository and separate live deployment so the submitted version remains unchanged.

The YouTube channel itself can continue to be used, but the video referenced by the submission should remain available and unchanged during judging.

Recommended release procedure:

```text
final regression
    ↓
final production smoke
    ↓
video / YouTube
    ↓
final documentation / Devpost field check
    ↓
record judged commit SHA
    ↓
submit
    ↓
freeze judged repo + live site + submission
```

## Not official submission requirements

Useful but optional/post-submission work includes:

- organic public traffic
- public announcement campaigns
- additional Claude/Gemini/Cursor comparison videos
- multi-model formal studies
- new Challenge mechanics
- Challenge Level synchronization into remote spectator WEBMCP VIEW
- large Observatory/UI redesigns
- new telemetry architecture
- LAB/ongoing research deployment

Do not risk the stable judged version for optional work.
