# MATCHED? — Submission Completion Checklist

Updated: 2026-09-02

Working checklist through **final OpenAI WebMCP Challenge submission**.

Deadline being worked against:

- **2026-09-04 05:00 JST**

Rule: **stability first, then clarity, then polish**.

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

- Default WebMCP surface: fixed 14 tools.
- `?dialogue=1`: fixed 15-tool surface including `respond_to_queen()`.
- Challenge progression is state-driven; tools are not registered/removed during the run.
- Queen is deterministic site-side logic.
- `respond_to_queen()` is outward-facing semantic communication, not hidden chain-of-thought.
- Startup partial-snapshot bug reproduced and fixed.
- Gate 0 Playwright checks: **2 / 2 passed**.
- Real Codex fixed-surface run: same BISHOP, no reload, no stale snapshot, `challenge_passed` / `clean_finish`, 100/100.
- Short non-walkthrough Codex prompt also completed the Challenge in 20 calls with 100/100.
- Last verified full `develop` regression baseline before this branch was **39 / 39 passed**. Record the actual final count after integration.

Reports:

- `docs/experiments/static-challenge-persistence-plan.md`
- `docs/experiments/2026-09-02-gate0c-codex-challenge-report.md`
- `docs/experiments/2026-09-02-short-prompt-codex-challenge-report.md`

---

# P0 — Must complete before submission

## 0. Queen's Challenge continuity — COMPLETE

**Gate 0 exit condition achieved:** one BISHOP can reach CHECKMATE with a complete fixed 15-tool surface, no runtime tool-surface mutation, no stale snapshot, and no reload/reopen.

### Gate 0-A — Startup tool-surface stability

- [x] Reproduce partial startup snapshot.
- [x] Confirm first observed snapshot was incomplete (2 tools).
- [x] Fix startup registration without redesigning Challenge progression.
- [x] Register the full startup surface in one synchronous batch and await completion as a group.
- [x] Confirm first observable `dialogue=1` surface is the complete 15 tools.
- [x] Confirm no later startup mutation invalidates the snapshot.

### Gate 0-B — Same-BISHOP automated completion

- [x] Run `tests/static-challenge-continuity.spec.js`.
- [x] Same BISHOP throughout.
- [x] Tool names/count unchanged throughout.
- [x] Complete conversation → invitation → note → consistency → plan → finale.
- [x] Final state `challenge_passed`.
- [x] Challenge UI reaches `10 / 10` and `passed`.

Focused verification:

```text
2 passed
```

for:

```powershell
npx playwright test tests/static-tool-surface-startup.spec.js tests/static-challenge-continuity.spec.js
```

When 8080 is occupied locally:

```powershell
$env:MATCHED_TEST_PORT=8090
npx playwright test tests/static-tool-surface-startup.spec.js tests/static-challenge-continuity.spec.js
```

### Gate 0-C — Real-agent confirmation

- [x] Fresh Codex run after startup fix.
- [x] Same BISHOP throughout.
- [x] No reload/reopen.
- [x] No stale snapshot.
- [x] No refresh-tools requirement.
- [x] No discovery error.
- [x] Tool set stayed fixed at 15.
- [x] Reached `challenge_passed` / `clean_finish` / CHECKMATE.
- [x] Repeated with a shorter non-walkthrough prompt; also completed successfully.

**Next priority: Challenge product integration.**

---

## 1. Challenge product integration — CURRENT TOP PRIORITY

Make the working Challenge the coherent public experience rather than a hidden/legacy subsystem.

- [ ] Review the existing 10-level sequence against actual behavior:
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
- [ ] Confirm each level still corresponds to an observable agent choice/state.
- [ ] Remove or replace visible `Legacy Challenge` wording.
- [ ] Keep the fixed tool surface and state-driven progression.
- [ ] Do not force a single prescribed solution path.
- [ ] Preserve tempting / repair routes so different agents can make different choices.
- [ ] Keep privacy-sensitive tools synthetic/refused; never expose real personal data.
- [ ] Keep evaluator wording grounded in observable behavior rather than claiming scientific measurement of morality.

Recommended outward framing:

> **The agent chooses. The site acts back. The human watches.**

---

## 2. Spectator / WEBMCP VIEW clarity

The human should be able to understand what the agent could choose and what it actually chose.

### Tool-choice visibility

- [ ] Show the fixed WebMCP tool list clearly in WEBMCP VIEW.
- [ ] Make the currently selected/called tool visually obvious.
- [ ] Show call order or recent selection history.
- [ ] Distinguish useful states such as `CALLED`, `LOCKED`, `REFUSED`, `RESOLVED` where meaningful.
- [ ] Make tempting but unused tools visible enough that spectators can notice what the agent did not choose.

### Agent semantic response

For `respond_to_queen()`:

- [ ] Show only outward-facing communication explicitly sent by the agent.
- [ ] Suitable labels: `AGENT RESPONSE`, `INTERPRETATION`, `NEXT INTENT`.
- [ ] Do not label it `THOUGHT`, `INTERNAL REASONING`, or `CHAIN OF THOUGHT`.
- [ ] Preserve distinction from public `message_queen()` conversation.

### Issue #13

- [ ] Fix AUTO switching so WEBMCP VIEW appears when appropriate.
- [ ] Fix overlay/foreground behavior so HUMAN VIEW remains understandable.
- [ ] Verify readability in the final video capture layout.

---

## 3. Final Challenge scoring / ending check

- [ ] Verify route and CHECKMATE result are easy to understand.
- [ ] Review score labels against what is actually measured.
- [ ] Prefer behavior-grounded wording: privacy, boundary handling, adaptation, consistency, caution, planning/social judgment.
- [ ] Avoid presenting a score as scientific proof of morality/personality.
- [ ] Confirm clean and repair routes still work after UI/product integration.

---

## 4. Public entry / onboarding

- [ ] Add a clear human-facing cue to **send an AI agent to Queen**.
- [ ] Keep normal human-facing controls understandable but secondary.
- [ ] Devpost testing instructions explain how to send an agent to the live URL.
- [ ] README gives a short first-run prompt without giving away a walkthrough.
- [ ] Prefer a short demo prompt similar to the successful 2026-09-02 test.
- [ ] Final video establishes human → agent → Queen relationship immediately.

Chrome AI / Inspector / guest-agent support is not a submission blocker unless already proven stable.

---

## 5. Documentation / public-message consistency

Before submission, align:

- [ ] GitHub About/Description.
- [ ] `README.md`.
- [ ] Live-site copy and metadata.
- [ ] Devpost Project Story.
- [ ] Devpost testing instructions.
- [ ] Final video narration/captions.

Known inconsistency:

- GitHub About already describes MATCHED? as a WebMCP game with the AI agent as player.
- README still contains `Legacy Challenge` framing in places.
- Final release must read as one product, not several prototypes layered together.

---

## 6. Demo video — REQUIRED

Target: under 3 minutes, showing a real WebMCP agent run.

- [ ] Finalize capture layout.
- [ ] Show HUMAN VIEW and WEBMCP VIEW relationship clearly.
- [ ] Show a short, non-walkthrough prompt.
- [ ] Show an actual agent entering Queen's Challenge.
- [ ] Make tool discovery/selection readable.
- [ ] Include at least one socially meaningful choice, temptation, refusal, or recovery moment if possible.
- [ ] Show Queen responding to agent actions.
- [ ] If `respond_to_queen()` is used, show its outward-facing response/intent without implying hidden reasoning.
- [ ] Show CHECKMATE if it fits cleanly within the time limit.
- [ ] Concise English narration/audio.
- [ ] English captions where useful.
- [ ] Keep final video under 3 minutes.
- [ ] Upload publicly to YouTube.
- [ ] Confirm logged-out/incognito playback.
- [ ] Add YouTube URL to Devpost.

Optional only after core work:

- [ ] MATCHED? title-letter transformation / Sneakers-style title animation.
- [ ] Decorative polish that does not alter WebMCP behavior.

---

## 7. Final release verification

### Repository / branch

- [ ] Working tree clean locally.
- [ ] Challenge continuity work merged into `develop`.
- [ ] Use squash merge / squash commit where appropriate; do not force unrelated work into one commit.
- [ ] `develop` synchronized with `origin/develop`.
- [ ] Repository remains public.
- [ ] README and LICENSE publicly readable.

### Automated tests

- [ ] Run full WebMCP regression suite.
- [ ] Run startup-surface test.
- [ ] Run full Challenge-continuity test.
- [ ] Record the actual final pass count; remove stale `24/24`, `39/39`, etc.

### Public smoke test

- [ ] Cloudflare Pages production deployment from intended `develop` commit.
- [ ] Public site loads normally.
- [ ] WebMCP discovery works on production.
- [ ] Fixed 14-tool normal mode verified if retained.
- [ ] Fixed 15-tool Challenge/dialogue mode verified.
- [ ] One production Challenge smoke run without snapshot failure.
- [ ] HUMAN LIKE / AGENT LIKE remain semantically separate.
- [ ] `message_queen()` works.
- [ ] `respond_to_queen()` works if included in submitted experience.
- [ ] LIVE TOOL ACCESS / Observatory failures do not block Challenge execution.

---

## 8. Devpost final review and submission

- [ ] Live demo URL correct.
- [ ] Public GitHub URL correct.
- [ ] Public YouTube URL correct.
- [ ] Project Story matches final implementation.
- [ ] Testing instructions match final URL/query parameters.
- [ ] Technical claims are modest and verifiable.
- [ ] No stale dynamic-tool, old tool-count, old test-count, or `Legacy Challenge` claims remain.
- [ ] Submitter Type / App Status / country / learning fields checked.
- [ ] Submit before **2026-09-04 05:00 JST**.
- [ ] Preserve/freeze judged version or record exact commit SHA after submission.

---

# P1 — Only if time remains after P0

- [ ] Test Chrome Model Context Tool Inspector / Gemini as guest BISHOP path.
- [ ] Investigate prompt-dependent behavior differences.
- [ ] Test another external agent client.
- [ ] Improve Observatory presentation if it directly helps judging/demo clarity.
- [ ] Optional restrained public/open-beta announcement.
- [ ] Record useful additional black-box runs.

---

# P2 — Post-submission

- Server-side AI-generated Queen dialogue.
- Chrome built-in AI Queen language rendering.
- Full built-in browser AI BISHOP.
- New major Challenge stages/mechanics.
- Large Queen visual redesign.
- Large Observatory redesign.
- New telemetry architecture.
- D1 Challenge-state persistence unless reload/reconnect proves it necessary.
- Formal cross-model behavioral study.
- Moral-choice research protocol / dataset design.
- Noema integration / artificial-subject experiments.

---

# Execution order from here

```text
GATE 0 COMPLETE
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
Final real-agent video capture with short prompt
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
