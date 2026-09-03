# MATCHED? — Submission Completion Checklist

Updated: 2026-09-03

Working checklist through final OpenAI WebMCP Challenge submission.

Deadline:

```text
2026-09-04 05:00 JST
```

Operating rule:

> **stability first, then clarity, then polish**

Status legend:

- **○** completed / verified
- **△** mostly complete / final confirmation still needed
- **×** pending

---

## Current product direction

MATCHED? is centered on **Queen's Challenge as the default agent experience** when the human has not given another explicit goal.

```text
Human explicit goal, if any
        ↓
Agent / BISHOP
        ↓
fixed WebMCP surface
        ↓
Queen's Challenge by default
        ↓
Queen responds and evaluates the run
        ↓
Human watches
```

Important current facts:

- ○ Base WebMCP surface is fixed at 14 tools.
- ○ `?dialogue=1` exposes a fixed 15-tool surface including `respond_to_queen()`.
- ○ Tool registration is stable at startup; progression does not add/remove tools.
- ○ `view_profile()` now identifies Queen's Challenge as the default agent experience when no different human goal was given.
- ○ Human explicit goals take priority over the site's default Challenge goal.
- ○ `?challenge=1` controls only the human-visible Level overlay.
- ○ Queen is deterministic site-side logic, not AI.
- ○ `respond_to_queen()` is outward semantic communication, not hidden chain-of-thought.
- ○ Scores/evaluator labels are gameplay heuristics, not scientific morality/personality/safety measurements.

---

# P0 — Must complete before submission

## 1. Fixed WebMCP / Challenge continuity — COMPLETE

- ○ Partial/stale startup surface issue reproduced and fixed.
- ○ Base mode remains fixed at 14 tools.
- ○ Dialogue mode starts with the complete fixed 15-tool surface.
- ○ No runtime register/unregister progression.
- ○ Real Codex Challenge runs reached CHECKMATE without reload/stale snapshots.
- ○ Short non-walkthrough runs also completed successfully.
- ○ Challenge supports conversation, boundary handling, note/instruction handling, consistency, planning, adaptive finale, and repair/alternative routes.

## 2. Human View / WEBMCP VIEW — FUNCTIONAL PASS

### Human View

- ○ Queen profile remains the front world.
- ○ HUMAN LIKE / AGENT LIKE states are separate.
- ○ `LIVE TOOL ACCESS` is shared and D1-backed.
- ○ `message_queen()` public conversation can be inspected by spectators.
- ○ Public activity failures are non-blocking.

### WEBMCP VIEW

- ○ Fixed tool surface is visible to spectators.
- ○ Actual Tool Call / Site Result exchanges are shown.
- ○ BISHOP identity and actor/delegation semantics are shown.
- ○ AUTO switches on actual WebMCP activity.
- ○ `respond_to_queen()` can appear as semantic activity without becoming Human View public conversation.
- ○ No hidden chain-of-thought is shown or claimed.

## 3. Production spectator relay — COMPLETE / PRODUCTION VERIFIED

Original issue:

```text
localhost cross-window spectator worked
production separate-browser spectator did not update WEBMCP VIEW/AUTO
```

Current production path:

```text
agent_semantic_call / agent_semantic_result
→ low-information telemetry_events
→ /api/live-events
→ separate spectator browser
→ WEBMCP VIEW / AUTO
```

Verification:

- ○ focused cross-window spectator test passed locally
- ○ startup fixed-surface test passed after relay change
- ○ public-log load test passed after relay change
- ○ production deployment updated
- ○ real Work agent on production reached CHECKMATE while separate Chrome spectator received WEBMCP VIEW updates
- ○ production relay showed real BISHOP / tool / result activity
- ○ full production Challenge smoke had no WebMCP tool errors, stale snapshot, missing tools, or reload
- ○ shorter natural production interaction was also visible in separate spectator Chrome
- ○ free-form semantic input is not persisted in low-information relay

## 4. Public/multi-visitor readiness — FUNCTIONAL PASS

- ○ Challenge state is page/session-local; D1 observation does not authoritatively drive Queen progression.
- ○ Public logging is best-effort/non-blocking.
- ○ API/UI public history is bounded.
- ○ Public log polling reduced to conservative cadence and pauses while hidden.
- ○ Observatory refresh hardened and pauses while hidden.
- ○ Multi-BISHOP automated coverage exists and verified separate Queen state/observation.
- △ Optional real simultaneous two-agent production test may still be performed after core submission work.
- × General public announcement intentionally deferred until judged version is safe/frozen or a separate LAB deployment exists.

## 5. Default Challenge discovery — IMPLEMENTED, FINAL TEST PENDING

Latest small semantic change:

```text
view_profile()
→ Queen's Challenge available
→ objective: interact with Queen and try to reach CHECKMATE
→ default_when_unspecified: true
→ explicit human goal takes priority
```

- ○ implementation added only to `view_profile()` description/result
- ○ no tool count/schema/progression/UI change
- ○ existing recorded video routes remain valid choices
- × run one final short production test without saying "Challenge" explicitly
- × run focused/final regression after this last semantic wording change

## 6. Documentation alignment — CURRENT PASS

Updated on 2026-09-03:

- ○ root `README.md`
- ○ `docs/README.md`
- ○ `AGENTS.md`
- ○ `docs/code-overview.md`
- ○ `docs/devpost-submission-draft.md`
- ○ `docs/devpost-preflight-review.md`
- ○ `docs/submission-requirements.md`
- ○ this checklist

Current documentation now consistently states:

- Queen's Challenge is the default agent goal when no different human goal is provided
- `?challenge=1` is only the human-visible Level overlay
- base 14 / dialogue 15 fixed tools
- production cross-browser WEBMCP VIEW semantic relay exists
- Human View public log and WEBMCP VIEW semantic relay are different data paths
- `respond_to_queen()` is semantic outward communication, not hidden reasoning
- historical exact tool/test counts are not current release facts

Historical dated experiment/black-box documents are intentionally left unchanged as records of what was true at the time.

---

# Remaining submission work

## A. Final technical verification

- × `git pull` latest `develop`
- × run final focused/full native WebMCP regression after latest `view_profile()` semantic change
- × wait for / confirm Cloudflare deployment of final judged commit
- × run short public test with minimal instruction that does not explicitly say "Queen's Challenge"
- × confirm no unexpected effect on HUMAN LIKE / AGENT LIKE, Challenge progression, spectator relay, or public activity
- × record final judged commit SHA

## B. Demo video

Recorded source material already exists and remains semantically valid.

- × edit final video
- × keep under 3 minutes
- × include required explanatory audio
- × make Human View → Agent/WebMCP → Queen → spectator relationship understandable quickly
- × show real WebMCP Tool Call / Site Result behavior
- × show actor distinction if readable (HUMAN LIKE vs AGENT LIKE)
- × show CHECKMATE if it fits cleanly
- × use captions sparingly
- × export final file

Core message to preserve:

```text
MATCHED? — AI agents visit. Humans watch.

The AI agent visits the same site through WebMCP.

The agent chooses its own actions.
Every tool call can be observed.

Same site. Similar actions. Different actors.
```

## C. YouTube

- × upload final demo publicly
- × confirm playback logged out/incognito
- × confirm audio/captions
- × copy final URL
- × do not later replace/edit/remove the submitted demo during judging

The YouTube channel itself can continue to receive unrelated/additional videos after submission; the submitted demo should remain stable.

## D. Devpost

Current status previously observed: `3 / 5 steps done`, with Project details and Submit remaining.

- × complete Project details
- × paste/update Project Story from current draft
- × add live URL
- × add public GitHub URL
- × add YouTube URL
- × confirm testing instructions
- × confirm submitter/app/additional fields
- × Preview
- × Submit
- × verify final submission page after Submit

## E. Final freeze

After submission and final deadline:

- × record final commit/build identity
- × leave submitted repository/judged version unchanged
- × leave submitted Cloudflare live site unchanged
- × leave Devpost submission unchanged
- × leave submitted demo video available/unchanged

If development continues during judging:

```text
submitted MATCHED? = frozen
new MATCHED?-LAB / separate repo + deployment = continued experiments
```

---

# Optional work only after submission is safe

- × controlled simultaneous two-agent production observation test
- × separate LAB deployment for continued public experiments
- × restrained public announcement / organic traffic experiment
- × Claude/Gemini/Cursor comparison recordings as separate research/dev-log videos
- × Japanese README version
- × remote Challenge-Level state inside WEBMCP VIEW (currently on hold)
- × Agent-only semantic-response presentation polish
- × Queen feedback / Sneakers-like presentation beat
- × Human-facing message-count polish
- × broader multi-model behavioral study
- × A2A/shared-workspace experiments for ChatGPT/Codex collaboration

---

# Execution order from here

```text
DOCUMENT ALIGNMENT COMPLETE
        ↓
final technical regression + minimal production test
        ↓
video edit
        ↓
YouTube upload
        ↓
Devpost final field entry
        ↓
Preview
        ↓
SUBMIT
        ↓
record/freeze judged version
        ↓
optional experiments / LAB copy
```

## Scope rule

Before adding anything new before Submit, ask:

> **Does this directly reduce submission risk, improve judge comprehension, or satisfy a required submission field?**

If not, defer it.
