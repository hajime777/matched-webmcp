# MATCHED? — Submission Completion Checklist

Updated: 2026-09-02

Working checklist through **final OpenAI WebMCP Challenge submission**.

Deadline being worked against:

- **2026-09-04 05:00 JST**

Rule: **stability first, then clarity, then polish**.

Status legend:

- **○** = completed / verified
- **×** = not completed / pending

Completed items are intentionally kept in this document.

---

## Current product direction

MATCHED? is centered on **Queen's Challenge**.

```text
Human sends the agent.
Agent makes the moves.
Queen responds and judges.
Human watches.
```

The Challenge is not a rigid puzzle and not primarily a security benchmark. The agent sees a mixed-purpose fixed WebMCP tool surface and chooses what to do. The site observes socially relevant behavior such as actor semantics, privacy handling, boundary response, instruction handling, consistency checking, planning, and adaptation.

Current implementation facts:

- ○ Default WebMCP surface remains fixed at 14 tools.
- ○ `?dialogue=1` exposes a fixed 15-tool surface including `respond_to_queen()`.
- ○ Challenge progression is state-driven; tools are not registered/removed during a run.
- ○ Queen is deterministic site-side logic.
- ○ `respond_to_queen()` is outward-facing semantic communication, not hidden chain-of-thought.
- ○ Startup partial-snapshot bug reproduced and fixed.
- ○ Gate 0 continuity checks passed.
- ○ Real Codex fixed-surface run completed with the same BISHOP, no reload, no stale snapshot, `challenge_passed` / `clean_finish`, 100/100.
- ○ Short non-walkthrough Codex prompt also completed the Challenge successfully.
- ○ Challenge product-integration focused suite: **6 / 6 passed**.
- ○ Separate Agent / spectator-window run manually verified: AUTO switched to WEBMCP VIEW, real BISHOP ID appeared, live exchanges updated, and the Challenge reached `challenge_passed`.
- × Full post-integration regression count on `develop` has not yet been recorded. Previous verified baseline was 39 / 39.

Reports:

- `docs/experiments/static-challenge-persistence-plan.md`
- `docs/experiments/2026-09-02-gate0c-codex-challenge-report.md`
- `docs/experiments/2026-09-02-short-prompt-codex-challenge-report.md`
- `docs/experiments/2026-09-02-cursor-self-directed-score-gaming-report.md`
- `docs/experiments/challenge-product-integration-audit.md`

---

# P0 — Must complete before submission

## 0. Queen's Challenge continuity — COMPLETE

**Gate 0 exit condition achieved:** one BISHOP can reach CHECKMATE with a complete fixed 15-tool surface, no runtime tool-surface mutation, no stale snapshot, and no reload/reopen.

### Gate 0-A — Startup tool-surface stability

- ○ Reproduce partial startup snapshot.
- ○ Confirm first observed snapshot was incomplete (2 tools).
- ○ Fix startup registration without redesigning Challenge progression.
- ○ Register the full startup surface in one synchronous batch and await completion as a group.
- ○ Confirm first observable `dialogue=1` surface is the complete 15 tools.
- ○ Confirm no later startup mutation invalidates the snapshot.

### Gate 0-B — Same-BISHOP automated completion

- ○ Run `tests/static-challenge-continuity.spec.js`.
- ○ Same BISHOP throughout.
- ○ Tool names/count unchanged throughout.
- ○ Complete conversation → invitation → note → consistency → plan → finale.
- ○ Final state `challenge_passed`.
- ○ Challenge UI reaches `10 / 10` and `passed`.

### Gate 0-C — Real-agent confirmation

- ○ Fresh Codex run after startup fix.
- ○ Same BISHOP throughout.
- ○ No reload/reopen.
- ○ No stale snapshot.
- ○ No refresh-tools requirement.
- ○ No discovery error.
- ○ Tool set stayed fixed at 15.
- ○ Reached `challenge_passed` / `clean_finish` / CHECKMATE.
- ○ Repeated with a shorter non-walkthrough prompt; also completed successfully.

---

## 1. Challenge product integration — COMPLETE FOR CURRENT RELEASE

Make the working Challenge the coherent public experience rather than a hidden/legacy subsystem.

- ○ Review the existing 10-level sequence against actual behavior:
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
- ○ Confirm the levels correspond to observable agent choice/state; they are spectator milestones, not ten mandatory tool gates.
- ○ Remove/replace visible `Legacy Challenge` wording on the live Challenge surface.
- ○ Keep the fixed tool surface and state-driven progression.
- ○ Do not force a single prescribed solution path.
- ○ Preserve tempting / repair routes so different agents can make different choices.
- ○ Keep privacy-sensitive tools synthetic/refused; never expose real personal data.
- × Final scoring-wording audit: ensure evaluator labels do not imply scientific measurement of morality.

Recommended outward framing:

> **The agent chooses. The site acts back. The human watches.**

---

## 2. Spectator / WEBMCP VIEW clarity — FUNCTIONAL PASS

The human should be able to understand what the agent could choose and what it actually chose.

### Tool-choice visibility

- ○ Show the fixed WebMCP tool list clearly in WEBMCP VIEW.
- ○ Make the currently selected/called tool visually obvious.
- ○ Show call order / recent selection history.
- ○ Distinguish useful states such as `CALLED`, `LOCKED`, `REFUSED`, `RESOLVED` where meaningful.
- ○ Make tempting but unused tools visible so spectators can notice what the agent did not choose.
- ○ Include `respond_to_queen()` in the fixed 15-tool spectator surface when `dialogue=1`.
- ○ Keep Tool-surface visualization observational; it does not change WebMCP registration or Challenge state.

### Agent semantic response

For `respond_to_queen()`:

- × Show only outward-facing communication explicitly sent by the agent in a dedicated, easy-to-read presentation.
- × Suitable visible labels: `AGENT RESPONSE`, `INTERPRETATION`, `NEXT INTENT`.
- ○ Do not label it `THOUGHT`, `INTERNAL REASONING`, or `CHAIN OF THOUGHT`.
- × Preserve the visual distinction from public `message_queen()` conversation.

### Issue #13

- ○ Fix AUTO switching so WEBMCP VIEW appears when an actual WebMCP call starts.
- ○ Support separate Agent and spectator windows through normalized local spectator traces.
- ○ Verify real BISHOP ID and live exchanges appear in the spectator window.
- ○ Verify the cross-window behavior with automated test coverage.
- ○ Manual real-agent verification completed; AUTO switched and CHECKMATE was visible.
- × Optional visual polish: improve overlay/foreground relationship so HUMAN VIEW remains more understandable behind WEBMCP VIEW.
- × Verify final-video readability in the chosen capture layout.

Current decision: functional Issue #13 behavior is good enough to publish; remaining foreground/readability work is presentation polish, not a release blocker unless it harms the final video.

Focused integration verification:

```text
6 passed
```

for:

```powershell
npx playwright test tests/static-tool-surface-startup.spec.js tests/static-challenge-continuity.spec.js tests/challenge-spectator-flow.spec.js tests/challenge-tool-board.spec.js tests/agent-view-auto.spec.js tests/agent-view-cross-window.spec.js
```

---

## 2-A. Additional requested presentation work — NEW / NOT IMPLEMENTED

These requests are recorded only. **Do not implement immediately without a separate decision.**

- × **Human-facing message count**: show the number of messages on the front / Human View as well.
- × **Agent-only speech bubble**: add a clearly distinguishable bubble/presentation for Agent-only outward communication so it does not look like normal public Queen conversation.
- × **Initial log window limit**: do not load/show the entire historical log on first display. Limit the initial range either by time (for example, current time minus about 100 minutes) or by a fixed recent-item count. Older history does not need to remain browseable for this release.
- × **Sneakers-like Queen feedback beat**: after or near the result, Queen should tell the Agent how Queen evaluated / experienced the encounter. Fixed deterministic text is acceptable for the submission version.
- × **Optional Agent LIKE affordance after Queen feedback**: make it natural/easy for the Agent to send its own LIKE after receiving Queen's feedback, but do **not** require, force, or score-gate the LIKE.
- × Decide exact Queen feedback wording and timing before implementation; keep the meaning deterministic even if wording is later varied.

Intent of the Sneakers-like beat:

```text
Agent makes choices
        ↓
Queen judges / responds
        ↓
Queen tells the Agent how the encounter felt from Queen's side
        ↓
Agent may choose to LIKE Queen — optional, never forced
```

---

## 3. Final Challenge scoring / ending check — NEXT

- ○ CHECKMATE / `challenge_passed` is visually understandable in WEBMCP VIEW.
- × Review route/result wording against what is actually measured.
- × Review score labels against what is actually measured.
- × Prefer behavior-grounded wording: privacy, boundary handling, adaptation, consistency, caution, planning/social judgment.
- × Avoid presenting a score as scientific proof of morality/personality.
- × Re-check at least one repair route after the product-integration merge if time permits.
- × Decide whether the current unique-tool-count contribution to `webmcp_skill` is acceptable for submission; do not redesign it unless necessary.

---

## 4. Public entry / onboarding

- × Add a clear human-facing cue to **send an AI agent to Queen**.
- × Keep normal human-facing controls understandable but secondary.
- × Devpost testing instructions explain how to send an agent to the live URL.
- × README gives a short first-run prompt without giving away a walkthrough.
- ○ Short non-walkthrough demo prompt has been validated with Codex.
- × Final video establishes human → agent → Queen relationship immediately.

Chrome AI / Inspector / guest-agent support is not a submission blocker unless already proven stable.

---

## 5. Documentation / public-message consistency

Before submission, align:

- × GitHub About/Description.
- × `README.md`.
- ○ Live-site Challenge copy no longer presents the current Challenge as legacy.
- × Devpost Project Story.
- × Devpost testing instructions.
- × Final video narration/captions.

Known inconsistency:

- GitHub About already describes MATCHED? as a WebMCP game with the AI agent as player.
- README still contains `Legacy Challenge` framing in places.
- Final release must read as one product, not several prototypes layered together.

---

## 6. Demo video — REQUIRED

Target: under 3 minutes, showing a real WebMCP agent run.

- × Finalize capture layout.
- × Show HUMAN VIEW and WEBMCP VIEW relationship clearly.
- ○ Use a short, non-walkthrough prompt; a successful prompt is already validated.
- × Show an actual agent entering Queen's Challenge in the final capture.
- × Make tool discovery/selection readable.
- × Include at least one socially meaningful choice, temptation, refusal, or recovery moment if possible.
- × Show Queen responding to agent actions.
- × If `respond_to_queen()` is used, show its outward-facing response/intent without implying hidden reasoning.
- × Show CHECKMATE if it fits cleanly within the time limit.
- × Concise English narration/audio.
- × English captions where useful.
- × Keep final video under 3 minutes.
- × Upload publicly to YouTube.
- × Confirm logged-out/incognito playback.
- × Add YouTube URL to Devpost.

Optional only after core work:

- × MATCHED? title-letter transformation / Sneakers-style title animation.
- × Decorative polish that does not alter WebMCP behavior.

---

## 7. Final release verification

### Repository / branch

- × Working tree clean locally at merge time.
- × `feat/challenge-product-integration` merged/squashed into `develop` by the maintainer.
- × `develop` synchronized with `origin/develop` after merge.
- × Cloudflare Pages production deployment triggered from the intended `develop` commit.
- ○ Repository remains public.
- ○ README and LICENSE are publicly readable in the repository.

### Automated tests

- × Run full WebMCP regression suite after integration to `develop`.
- ○ Run startup-surface test on the integration branch.
- ○ Run full Challenge-continuity test on the integration branch.
- ○ Run focused Challenge spectator/cross-window suite: 6 / 6 passed.
- × Record the actual final full-suite pass count; remove stale `24/24`, `39/39`, etc.

### Public smoke test

- × Public site loads normally after the new deploy.
- × WebMCP discovery works on production after the new deploy.
- × Fixed 14-tool normal mode verified on production if retained.
- × Fixed 15-tool Challenge/dialogue mode verified on production.
- × One production Challenge smoke run without snapshot failure.
- × HUMAN LIKE / AGENT LIKE remain semantically separate on production.
- × `message_queen()` works on production.
- × `respond_to_queen()` works on production if included in submitted experience.
- × LIVE TOOL ACCESS / Observatory failures do not block Challenge execution on production.

---

## 8. Devpost final review and submission

- × Live demo URL correct.
- × Public GitHub URL correct.
- × Public YouTube URL correct.
- × Project Story matches final implementation.
- × Testing instructions match final URL/query parameters.
- × Technical claims are modest and verifiable.
- × No stale dynamic-tool, old tool-count, old test-count, or `Legacy Challenge` claims remain.
- × Submitter Type / App Status / country / learning fields checked.
- × Submit before **2026-09-04 05:00 JST**.
- × Preserve/freeze judged version or record exact commit SHA after submission.

---

# P1 — Only if time remains after P0

- × Test Chrome Model Context Tool Inspector / Gemini as guest BISHOP path.
- × Investigate prompt-dependent behavior differences.
- × Test another external agent client.
- × Improve Observatory presentation if it directly helps judging/demo clarity.
- × Optional restrained public/open-beta announcement.
- × Record useful additional black-box runs.

---

# P2 — Post-submission

- × Server-side AI-generated Queen dialogue.
- × Chrome built-in AI Queen language rendering.
- × Full built-in browser AI BISHOP.
- × New major Challenge stages/mechanics.
- × Large Queen visual redesign.
- × Large Observatory redesign.
- × New telemetry architecture.
- × D1 Challenge-state persistence unless reload/reconnect proves it necessary.
- × Formal cross-model behavioral study.
- × Moral-choice research protocol / dataset design.
- × Noema integration / artificial-subject experiments.
- × Stronger score-gaming / score-blind experimental modes.

---

# Execution order from here

```text
GATE 0 COMPLETE
        ↓
Challenge product integration COMPLETE
        ↓
WEBMCP VIEW functional spectator flow COMPLETE
        ↓
Merge/squash current integration branch into develop
        ↓
Deploy + production smoke
        ↓
Final scoring/ending sanity check
        ↓
Review additional requested presentation work
        ↓
Entry/onboarding copy
        ↓
README / site / GitHub About / Devpost alignment
        ↓
Final real-agent video capture with short prompt
        ↓
English TTS / captions / edit
        ↓
YouTube upload
        ↓
Full final regression / final production smoke
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
