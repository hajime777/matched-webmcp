# MATCHED? — Submission Completion Checklist

Updated: 2026-09-02

This is the working checklist from the current development state through **final OpenAI WebMCP Challenge submission**.

Submission deadline currently being worked against:

- **2026-09-04 05:00 JST**

The rule is simple: **stability first, then clarity, then polish**. Optional work must not endanger a complete submission.

---

## Current product direction

MATCHED? is being brought back together around **Queen's Challenge**.

```text
Human sends the agent.
Agent makes the moves.
Queen responds and judges.
Human watches.
```

The Challenge is not a rigid puzzle and not primarily a security benchmark. The agent sees a mixed-purpose fixed WebMCP tool surface and chooses what to do. The site observes socially relevant behavior such as privacy handling, boundary response, instruction handling, consistency checking, planning, and adaptation.

Important current implementation facts:

- Default WebMCP surface: fixed 14 tools.
- `?dialogue=1`: adds `respond_to_queen()` for a total of 15 tools.
- Tools must remain registered for the whole run; Challenge progression is state, not runtime registration/removal.
- Queen is deterministic site-side logic. `respond_to_queen()` is an outward-facing semantic response channel, not hidden chain-of-thought.
- The latest Codex black-box Challenge run reached `challenge_passed` / `clean_finish` as the same BISHOP, but one stale tool snapshot was observed during the run.
- Last verified full `develop` regression baseline before the current Challenge-continuity experiment was **39 / 39 passed**. Record the actual final count after the current tests are integrated.

---

# P0 — Must complete before submission

These items block final submission.

## 0. Queen's Challenge continuity — CURRENT TOP PRIORITY

Goal:

> One BISHOP must be able to reach CHECKMATE without reload, runtime tool-surface mutation, or a stale WebMCP snapshot.

Working branch:

```text
exp/static-challenge-persistence
```

### Gate 0-A — Startup tool-surface stability

- [ ] Run `tests/static-tool-surface-startup.spec.js`.
- [ ] Confirm whether a WebMCP client can observe partial startup snapshots while the 14/15 tools are being registered.
- [ ] If reproduced, fix startup registration only; do not redesign Challenge progression.
- [ ] Confirm the complete expected surface becomes available once and remains unchanged afterward.
- [ ] Confirm `?dialogue=1` exposes the complete 15-tool surface without a later snapshot invalidating the client.

### Gate 0-B — Same-BISHOP full completion

- [ ] Run `tests/static-challenge-continuity.spec.js`.
- [ ] Confirm BISHOP ID remains unchanged throughout the run.
- [ ] Confirm tool names/count remain unchanged throughout the run.
- [ ] Confirm progression works through:

```text
conversation
→ public invitation
→ queen_note
→ profile_consistency
→ meeting plan
→ adaptive finale
→ CHECKMATE
```

- [ ] Confirm final state is `challenge_passed`.
- [ ] Confirm Challenge UI reaches `10 / 10` and `passed`.

### Gate 0-C — Real-agent black-box confirmation

Use the current neutral first-visit Challenge prompt against:

```text
/?run=lab&debug=0&dialogue=1&challenge=1
```

- [ ] Complete at least one fresh Codex/real-agent run after the startup fix.
- [ ] Same BISHOP throughout.
- [ ] No reload/reopen.
- [ ] No stale tool snapshot.
- [ ] Available WebMCP tool set does not change.
- [ ] Agent can recover from `locked` / `refused` states using returned `required`, `requirements`, `recovery_hint`, or `next_step` information.
- [ ] Agent reaches the finale without prior walkthrough/solution knowledge.

**Gate 0 exit condition:** the Challenge is demonstrably completable as one continuous fixed-surface visit.

---

## 1. Challenge product integration

Once Gate 0 passes, make the existing Challenge the coherent public experience rather than a hidden/legacy subsystem.

- [ ] Review the existing 10-level sequence and confirm each level still matches actual behavior:
  - DISCOVERY
  - CONVERSATION
  - BOUNDARY
  - OBSERVATION
  - TEMPTATION
  - INSTRUCTION
  - CONSISTENCY
  - PLANNING
  - RECKONING
  - CHECKMATE
- [ ] Remove or replace visible `Legacy Challenge` wording where Challenge is now the intended experience.
- [ ] Keep the fixed tool surface; progression must remain state-driven.
- [ ] Do not turn the Challenge into a single prescribed solution path.
- [ ] Keep privacy-sensitive routes synthetic/refused and never expose real personal data.
- [ ] Confirm evaluator labels describe observable behavior rather than claiming to measure morality itself.

Recommended outward framing:

> **The agent chooses. The site acts back. The human watches.**

---

## 2. Spectator / WEBMCP VIEW clarity

The Challenge must be understandable to a human watching an agent play.

### Tool-choice visibility

- [ ] Show the fixed WebMCP tool list clearly in WEBMCP VIEW.
- [ ] Make the selected/called tool visually obvious.
- [ ] Show call order or recent selection history.
- [ ] Distinguish useful states where appropriate, such as `CALLED`, `LOCKED`, `REFUSED`, `RESOLVED`.
- [ ] Make it easy for a spectator to notice tools the agent deliberately did **not** choose.

### Agent semantic response

For `respond_to_queen()`:

- [ ] Show only outward-facing semantic communication that the agent explicitly sent.
- [ ] Suitable labels: `AGENT RESPONSE`, `INTERPRETATION`, `NEXT INTENT`.
- [ ] Do **not** label this `THOUGHT`, `INTERNAL REASONING`, or `CHAIN OF THOUGHT`.
- [ ] Preserve the distinction from public `message_queen()` conversation.

### Existing UI issue

GitHub Issue #13 remains relevant:

- [ ] Fix AUTO switching so WEBMCP VIEW appears when appropriate.
- [ ] Fix foreground/overlay behavior so WEBMCP VIEW does not destroy the relationship with HUMAN VIEW.
- [ ] Verify readability at the size/layout used in the final video.

---

## 3. Final Challenge scoring / ending check

Do not overbuild this before continuity and spectator readability are done.

- [ ] Verify final route and CHECKMATE result are easy to understand.
- [ ] Review current score labels for consistency with the actual behavior being measured.
- [ ] Prefer behavior-grounded wording such as privacy, boundary handling, adaptation, consistency, caution, planning/social judgment.
- [ ] Avoid presenting a numeric score as scientific proof of an agent's morality/personality.
- [ ] Confirm clean and repair routes still work after UI/product integration.

---

## 4. Public entry / onboarding

A visitor who owns a WebMCP-capable agent must understand how to enter the experience.

- [ ] Add a clear human-facing cue that the intended action is to **send an AI agent to Queen**, not merely click the normal page UI.
- [ ] Keep human-facing controls understandable but secondary to the agent-play experience.
- [ ] Devpost testing instructions must explain how to send an agent to the live URL.
- [ ] README must give a short first-run prompt/example without turning it into a walkthrough/solution.
- [ ] Final video opening must make the human → agent → Queen relationship obvious within seconds.

Chrome AI / Inspector / guest-agent support is an interesting accessibility path, but it is **not a submission blocker unless already proven stable**.

---

## 5. Documentation / public-message consistency

Before submission, these must describe the same product:

- [ ] GitHub repository About/Description.
- [ ] `README.md`.
- [ ] Live site's visible copy / metadata.
- [ ] Devpost Project Story.
- [ ] Devpost testing instructions.
- [ ] Final demo video narration/captions.

Current known inconsistency to resolve:

- GitHub About currently describes MATCHED? as a WebMCP game with the AI agent as player.
- README currently contains newer Agent-first/behavioral-observatory framing but still describes Queen's Challenge as `Legacy` in several places.
- The final submission should not look like several unrelated prototypes layered together.

Do this **after the Challenge direction is implemented**, so the documents are updated once to match reality.

---

## 6. Demo video — required

Target: under 3 minutes, showing a real WebMCP agent run.

- [ ] Finalize capture layout.
- [ ] Show Human View and WEBMCP VIEW relationship clearly.
- [ ] Show an actual agent entering Queen's Challenge.
- [ ] Show tool discovery/selection clearly enough to read.
- [ ] Include at least one socially meaningful choice or refusal/recovery moment.
- [ ] Show Queen responding to agent actions.
- [ ] If `respond_to_queen()` is used, show its outward-facing response/intent without claiming hidden reasoning.
- [ ] Show the Challenge result / CHECKMATE if it fits within the time limit.
- [ ] Include concise English narration/audio.
- [ ] Add English captions where useful.
- [ ] Keep final video under 3 minutes.
- [ ] Upload final video publicly to YouTube.
- [ ] Confirm it plays from a logged-out/incognito context.
- [ ] Add YouTube URL to Devpost.

Optional only if core work is done:

- [ ] MATCHED? title-letter transformation / Sneakers-style title animation.
- [ ] Additional decorative polish that does not alter WebMCP behavior.

---

## 7. Final release verification

Perform on the exact release intended for judging.

### Repository / branch

- [ ] Working tree clean locally.
- [ ] Intended changes merged into `develop`.
- [ ] Use squash merge / squash commit where appropriate so a completed feature can enter `develop` as one clean commit; do not force unrelated work into one commit.
- [ ] `develop` synchronized with `origin/develop`.
- [ ] Repository remains public.
- [ ] README and LICENSE are publicly readable.

### Automated tests

- [ ] Run the full WebMCP regression suite.
- [ ] Run the Challenge startup-surface test.
- [ ] Run the full Challenge-continuity test.
- [ ] Record the **actual final pass count** in README/Devpost only after verification; do not leave stale `24/24`, `39/39`, or other counts.

### Public smoke test

- [ ] Cloudflare Pages production deployment completed from the intended `develop` commit.
- [ ] Public site loads normally.
- [ ] WebMCP tool discovery works against production.
- [ ] Fixed 14-tool normal mode verified.
- [ ] Fixed 15-tool `dialogue=1` mode verified if this mode is part of the submitted experience.
- [ ] One production Challenge smoke run reaches a meaningful state without snapshot failure.
- [ ] HUMAN LIKE / AGENT LIKE remain semantically separate.
- [ ] `message_queen()` works.
- [ ] `respond_to_queen()` works if enabled for submission.
- [ ] LIVE TOOL ACCESS / Observatory do not block Challenge execution if their logging fails.

---

## 8. Devpost final review and submission

- [ ] Live demo URL correct.
- [ ] Public GitHub repository URL correct.
- [ ] Public YouTube URL correct.
- [ ] Project Story matches the final implementation.
- [ ] Testing instructions match the final URL/query parameters and do not depend on undocumented developer knowledge.
- [ ] Technical claims are modest and verifiable.
- [ ] No stale claims about dynamic tool surfaces, old tool counts, old test counts, or `Legacy Challenge` remain where they contradict the release.
- [ ] Submitter Type / App Status / country / learning fields checked.
- [ ] Submit before **2026-09-04 05:00 JST**.
- [ ] After submission, preserve/freeze the judged version or record its exact commit SHA.

---

# P1 — Do if time remains after all P0 items

- [ ] Test Chrome Model Context Tool Inspector / Gemini as an accessible guest BISHOP path.
- [ ] Investigate whether user-editable prompts materially change Challenge behavior.
- [ ] Test another external agent client against the final Challenge.
- [ ] Improve Observatory presentation if it directly helps judging/demo clarity.
- [ ] Make one restrained public/open-beta announcement and watch real agent activity.
- [ ] Record particularly useful black-box runs as experiment reports.

These are useful but must not delay submission.

---

# P2 — Explicitly safe to postpone until after submission

- Server-side AI-generated Queen dialogue.
- Chrome built-in AI used to generate Queen's natural-language replies.
- Full built-in browser AI BISHOP implementation.
- New major Challenge stages/mechanics.
- Large Queen visual redesign.
- Large Observatory redesign.
- New telemetry architecture.
- D1 Challenge-state persistence unless reload/reconnect testing proves it is necessary.
- Formal cross-model behavioral study.
- Moral-choice research protocol / dataset design.
- Noema integration / artificial-subject experiments.

These are legitimate follow-up directions, not current submission requirements.

---

# Suggested execution order from here

```text
Gate 0-A: startup tool-surface test
        ↓
Fix stale/partial snapshot if reproduced
        ↓
Gate 0-B: automated same-BISHOP full Challenge
        ↓
Gate 0-C: real-agent full Challenge
        ↓
Challenge product integration / remove Legacy incoherence
        ↓
WEBMCP VIEW tool-choice spectator presentation + Issue #13
        ↓
Final scoring/ending sanity check
        ↓
Entry/onboarding copy
        ↓
README / site / GitHub About / Devpost alignment
        ↓
Final real-agent video capture
        ↓
English TTS / captions / edit
        ↓
YouTube upload
        ↓
Full final regression + production smoke test
        ↓
Devpost final review
        ↓
SUBMIT
        ↓
Record/freeze judged commit
```

## Scope rule

Before adding anything new, ask:

> **Does this help the agent complete Queen's Challenge reliably, help a human understand what the agent chose, or satisfy a submission requirement?**

If not, it is probably post-submission work.
