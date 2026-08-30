# MATCHED? — Submission Remaining Work

Updated: 2026-08-30

This is a **remaining-work checklist, not a commitment to complete every item**.

The purpose is to separate work that is required for submission from work that would merely improve presentation or polish. Optional items may be skipped if they threaten the schedule or distract from the core WebMCP concept.

## Current state

Already completed:

- Public live site: `https://matched-webmcp.pages.dev/`
- Public GitHub repository: `https://github.com/hajime777/matched-webmcp`
- Repository verified from an incognito browser
- MIT license present
- GitHub About description, Website, and repository topics configured
- Fixed 11-tool WebMCP surface
- `send_human_like()` / `send_agent_like()` actor split implemented
- Public Work black-box test completed
- Multi-turn Queen conversation verified
- Release regression baseline: **24 / 24 passed**
- Devpost project created and major text fields filled
- Community WebMCP directory discovery observed
- Initial developer-facing code overview added: `docs/code-overview.md`

Submission deadline currently being worked against:

- **2026-09-04 05:00 JST**

---

## P0 — Required before final submission

These are the items that should block final submission if incomplete.

### 1. Demo video

- [ ] Perform a short video-production test first
- [ ] Decide final capture layout
- [ ] Record real WebMCP interaction
- [ ] Include a visible HUMAN LIKE action by the human
- [ ] Show `send_human_like()` and/or clearly explain delegated human-side action
- [ ] Show `send_agent_like()` as a distinct agent-native action
- [ ] Show at least one `message_queen()` interaction and Queen response
- [ ] Include English narration/audio
- [ ] Add English captions where useful
- [ ] Keep final video under 3 minutes
- [ ] Upload final video to public YouTube
- [ ] Add YouTube URL to Devpost

Recommended conceptual center of the demo:

> **Different actors. Different meaning.**

Supporting line:

> **The agent is the player. The site acts back. The human watches.**

### 2. Final Devpost check

- [ ] Confirm live URL is correct
- [ ] Confirm public repository URL is correct
- [ ] Confirm video URL works without special permissions
- [ ] Re-read Project Story after final video is complete
- [ ] Confirm testing instructions still match the release
- [ ] Confirm Submitter Type / App Status / country / learning fields remain correct
- [ ] Submit before deadline

### 3. Final release verification

Immediately before submission:

- [ ] `git status` is clean
- [ ] `develop` is synchronized with `origin/develop`
- [ ] Run `npm run test:webmcp`
- [ ] Confirm **24 / 24** passes
- [ ] Check public site loads normally
- [ ] Check WebMCP tool discovery on the release version
- [ ] Check both LIKE actions still preserve separate actor state
- [ ] Check `message_queen()` still works
- [ ] Check repository remains public
- [ ] Check README and LICENSE are publicly readable

The existing 24/24 result is the current baseline. This section intentionally remains unchecked because it is a **final pre-submission verification**, not a statement that regression coverage has never been run.

---

## P1 — Recommended if time permits

These can improve the submission, but should not delay P0 work.

### Demo/UI polish

- [ ] Improve UI specifically for video readability
- [ ] Make HUMAN LIKE / AGENT LIKE distinction visually obvious
- [ ] Make LIVE CHALLENGERS readable in captured video
- [ ] Reduce unnecessary visual clutter during the demo
- [ ] Decide whether to show Work or Codex as the agent client in the final recording
- [ ] Use editing/crops/zoom so tool names are readable

### Submission copy polish

- [ ] Give Devpost opening paragraphs one final pass
- [ ] Keep `Agent evaluation` as a supporting capability, not the core novelty claim
- [ ] Keep `The site acts back.` prominent
- [ ] Keep `Different actors. Different meaning.` prominent
- [ ] Avoid first/world-first/unique claims that cannot be proved
- [ ] Keep agent autonomy language explicitly forward-looking and modest

### Repository presentation

- [x] Improve GitHub About description
- [x] Add repository topics (`webmcp`, `ai-agents`, `openai-webmcp-challenge`, `agent-native`)
- [x] Add the live site to the GitHub Website field
- [x] Add an initial developer-facing code overview
- [ ] Ensure important design docs remain easy to find from README

---

## P2 — Optional experiments / publicity

These are **not required for submission**.

### Public pilot / external traffic

- [ ] Continue observing whether the public site gets organic traffic
- [ ] Record baseline before any public announcement
- [ ] Optionally make one restrained public announcement
- [ ] Possible venue: Reddit `r/webmcp`
- [ ] Possible venue: OpenAI Developer Community
- [ ] Observe whether page views / WebMCP-capable sessions / tool calls change afterward

The purpose is observation, not promotion for its own sake.

### Additional agent testing

- [ ] Another Work run against the final UI
- [ ] Another Codex run against the final UI
- [ ] Optional comparison with other agent clients
- [ ] Optional full challenge completion on the final release build

Do not put unrelated model-comparison material into the main Challenge demo unless it clearly strengthens the WebMCP story.

### Additional documentation

- [x] Add a concise developer-facing code overview
- [ ] Record any meaningful final black-box test
- [ ] Record any interesting public-agent visit if one occurs
- [ ] Update design notes only if the implementation or conclusion actually changes

---

## P3 — Explicitly safe to skip

These ideas may be interesting, but are not necessary for the Challenge submission.

- New major challenge mechanics
- Large Queen redesign
- Additional dynamic tool experiments
- New telemetry architecture
- AI-generated Queen feature work
- Workers AI integration
- Large Observatory redesign
- Traffic-growth work
- Broad community engagement
- Gemini / Claude comparison inside the main demo
- Any feature that risks destabilizing the fixed 11-tool release

---

## Suggested order from here

```text
Video-production test
        ↓
Small UI changes only if the test exposes a real readability problem
        ↓
Final demo capture
        ↓
English TTS / captions / edit
        ↓
YouTube public upload
        ↓
Final 24/24 regression + public smoke test
        ↓
Devpost final review
        ↓
Submit
        ↓
Freeze the judged version
```

## Scope rule

When choosing whether to do another task, use this test:

> **Does this make the WebMCP idea easier to understand, make the demo more trustworthy, or satisfy a submission requirement?**

If not, it is probably safe to postpone until after submission.

MATCHED? should reach the deadline as a coherent finished experiment rather than as a larger but less stable project.
