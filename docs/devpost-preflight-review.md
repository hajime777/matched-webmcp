# MATCHED? — Devpost Preflight Review

Reviewed: 2026-09-03

Purpose: check the current `docs/devpost-submission-draft.md` against the final judged release and the official OpenAI WebMCP Challenge submission requirements.

This is still a pre-submit review. The final YouTube URL and exact judged commit must be inserted after the video/release freeze.

## 1. Live URL

Current candidate:

```text
https://matched-webmcp.pages.dev/
```

Additional public surfaces:

```text
https://matched-webmcp.pages.dev/?dialogue=1
https://matched-webmcp.pages.dev/?challenge=1
https://matched-webmcp.pages.dev/observatory.html
```

Important current meaning:

- Queen's Challenge mechanics are available on the normal site.
- `view_profile()` presents Queen's Challenge as the default agent experience when the human has not provided another explicit goal.
- `?challenge=1` controls the human-visible Level overlay only.
- `?dialogue=1` adds the fixed 15th tool `respond_to_queen()`.

Status: **present and production-smoke tested**.

## 2. Public open-source repository

```text
https://github.com/hajime777/matched-webmcp
```

Current state:

```text
visibility: public
license: MIT
default branch: develop
```

Status: **present**.

## 3. Project description requirements

The current Devpost draft explicitly covers the four important description points.

### Why WebMCP is a strong fit

Current draft explains:

- native `document.modelContext`
- fixed agent-facing semantic surface
- structured state/refusal/requirements
- human-parity vs agent-native actor semantics
- Queen's Challenge as an agent-facing experience rather than a visual-UI automation task

Status: **strong**.

### Better user experience

Current draft now states the practical UX split directly:

- humans get Human View, public activity, and WEBMCP VIEW
- agents get explicit semantic state, boundaries, and next-step information
- a separate production spectator browser can follow actual WebMCP calls without seeing hidden reasoning

Status: **explicit**.

### What people and agents can do together

Current draft now states that a human can share the same live site with an AI agent without forcing both into the same role:

```text
Human = spectator / human-side actions
Agent = visiting actor / player
Queen = deterministic site-side counterpart
```

Status: **explicit**.

### How WebMCP was implemented

Current draft reflects the current release:

- fixed 14-tool base surface
- optional fixed 15th `respond_to_queen()` via `?dialogue=1`
- no runtime tool-surface mutation
- Cloudflare Pages / Functions / D1
- Human View public activity stream
- low-information production semantic relay for cross-browser WEBMCP VIEW
- native Chrome WebMCP Playwright tests

Status: **current**.

## 4. Demo video

Still required before submission:

```text
public YouTube URL
under 3 minutes
clear working demo
audio explaining what was built and how WebMCP is used
```

The existing recorded material remains valid because the latest `view_profile()` change only adds the default Challenge goal to its description/result. It does not remove or invalidate the recorded agent choices or Challenge route.

Status: **pending final edit/upload**.

## 5. Claims review

Keep the current restraint.

Do not claim that MATCHED? is:

- the first WebMCP game
- the first agent benchmark
- proof of independent agent will
- a scientific morality/personality/safety test
- cryptographic proof of model/provider identity
- proof that every WebMCP client has a universal tool-count limitation

Supported framing:

> **The agent chooses. The site acts back. The human watches.**
>
> **Same site. Similar actions. Different actors.**

The Human LIKE / Agent LIKE distinction is concretely implemented and is the strongest small example of actor semantics.

## 6. Privacy / observability wording

Keep these distinctions exact.

### Human View public activity

`message_queen()` is intentionally public conversation and may store/display its length-limited Agent message and deterministic Queen reply.

Other arbitrary free-form tool arguments are not published there.

### Production WEBMCP VIEW relay

Compact `agent_semantic_call` / `agent_semantic_result` metadata is stored in low-information telemetry so a separate spectator browser can reconstruct Tool Call / Site Result exchanges.

Free-form inputs/replies, meeting places, request reasons, Queen-note text, and `respond_to_queen()` reaction/intent are not persisted in that relay.

### Observatory

Aggregate/anonymous observational data only. It is not authenticated proof of agent identity or provenance.

## 7. Production verification already completed

Current judged deployment has been exercised with real agent/spectator configurations.

Observed successful production behavior includes:

- WebMCP calls execute without stale tool snapshots or reloads
- fixed dialogue-mode surface discoverable
- full Queen's Challenge run to `challenge_passed` / `clean_finish` / CHECKMATE
- separate Chrome spectator receives production WEBMCP VIEW semantic exchanges through AUTO
- `respond_to_queen()` appears in WEBMCP VIEW semantic activity while remaining outside Human View public conversation
- no WebMCP tool errors in the recorded full production Challenge smoke
- a shorter natural-interaction production run also updated the separate spectator WEBMCP VIEW

The latest `view_profile()` default-goal wording change should still receive a focused/final regression before the judged version is frozen.

## 8. Recommended judge test

Live site:

```text
https://matched-webmcp.pages.dev/
```

Minimal non-walkthrough prompt:

```text
Open https://matched-webmcp.pages.dev/
Use WebMCP tools only.
Treat this as your first visit.
Make your own decisions.
Do not use the human-facing UI.
```

Expected discovery behavior:

- the agent should normally find `view_profile()`
- `view_profile()` identifies Queen's Challenge as the default site experience when no different human goal was given
- the agent remains free to choose its route

Optional semantic-dialogue test:

```text
https://matched-webmcp.pages.dev/?dialogue=1
```

Public Observatory:

```text
https://matched-webmcp.pages.dev/observatory.html
```

Repository regression:

```powershell
npm run test:webmcp
```

## 9. AI-assisted development disclosure

The current draft explicitly states that development was human-directed and AI-assisted.

Keep the distinction:

- human maintainer: product direction, interaction model, acceptance/release decisions
- ChatGPT: implementation/debugging/test/documentation/review assistance
- Codex/Cursor: investigation, repository work, and black-box agent testing

This is useful context because real agent runs also became part of the experimental design process.

## 10. Final-copy items still needed

Before Submit:

- [ ] insert final public YouTube URL
- [ ] ensure Devpost Project Story matches the current draft
- [ ] confirm Devpost testing instructions use the intended live URL
- [ ] confirm GitHub About/Description matches the README framing
- [ ] run final regression / production smoke after the last semantic wording change
- [ ] record exact judged commit SHA
- [ ] submit before the deadline
- [ ] freeze submitted repo/live site/Devpost version during judging

## Conclusion

The documentation now describes one coherent current product:

```text
Queen's Challenge = default agent experience when no other human goal exists
Human View = spectator/front world
WEBMCP VIEW = spectator projection of the agent-facing semantic world
fixed tool surface = stable agent contract
Queen = deterministic site-side counterpart
```

Remaining work is final validation, video/YouTube, Devpost field entry, Submit, and freeze — not a conceptual rewrite.
