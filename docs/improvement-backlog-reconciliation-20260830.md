# MATCHED? — Improvement Backlog Reconciliation

Updated: 2026-08-30

This document treats the **2026-08-30 08:42 improvement table as the primary feature backlog**.

It is intentionally separate from `docs/submission-remaining-work.md`.

- `improvement-backlog-reconciliation-20260830.md` = product / UI / telemetry / Agent UX backlog
- `submission-remaining-work.md` = final submission checklist

The submission checklist must not replace or silently discard items from this backlog.

## Status legend

- ✅ **IMPLEMENTED** — the intended capability exists in the current release
- 🟡 **PARTIAL** — part exists, but the original item is not fully satisfied
- 🔄 **SPEC CHANGED** — the original idea survived but its implementation contract changed
- ⬜ **NOT IMPLEMENTED** — no equivalent implementation was found
- ⏸ **DEFERRED / HOLD** — intentionally postponed
- ❌ **SUPERSEDED / DELETED** — the old specification itself should no longer be implemented

---

## Critical specification change after the original table

The largest change is LIKE actor semantics.

### Original 08:42 plan

```text
Fixed 10 tools
send_like() = Agent LIKE
Do not create an 11th tool
Human LIKE = visible human UI only
```

### Current release

```text
Fixed 11 tools
send_human_like() = delegated human-parity action
send_agent_like() = agent-native action
Human visible LIKE and Agent LIKE are separate state
```

This change was deliberate. Later discussion concluded that the **tool name itself should help communicate who the action belongs to**. The contrast between `send_human_like()` and `send_agent_like()` became part of the project's Actor Semantics / “Different actors. Different meaning.” concept.

Therefore:

- ❌ `send_like()` as the final Agent LIKE tool name is obsolete.
- ❌ “11 Tool化しないのが重要” is obsolete.
- ✅ Fixed surface stability remains important, but the stable release surface is now **11 tools**, not 10.

---

# Reconciled backlog

| Original priority | Improvement candidate | Original difficulty | Current status | Current interpretation / update |
|---|---|---:|---|---|
| **S** | **SNEAKERSタイトル演出** | ★★ | ⬜ NOT IMPLEMENTED | `MATCHED?` shuffle → convergence animation has not been implemented. Still valid as a presentation enhancement. |
| **S** | **`TOO MANY AI AGENTS.` 並び替え演出** | ★★ | ⬜ NOT IMPLEMENTED | The phrase remains in the UI, but no shuffle/convergence animation exists. Still valid. |
| **S** | **Spectator REFRESH** | ★★★ | ⬜ NOT IMPLEMENTED | No spectator refresh control that replays title animation and reloads LIKE / Agent / Level / LIVE state while preserving game state. Still valid. |
| **S** | **HUMAN LIKEを本当に集計** | ★★★ | 🟡 PARTIAL | Human UI LIKE already emits a `human_like` telemetry event to D1. Protected stats count distinct sessions with `human_like`. However, there is no public HUMAN LIKES counter, and the original “1 browser/session = max 1 LIKE” rule is not expressed as a dedicated public aggregate contract. |
| **S** | **AI AGENT LIKEを独立集計** | ★★ | 🔄 SPEC CHANGED / 🟡 PARTIAL | Old `send_like()` plan was superseded. Current tool is `send_agent_like()`. Agent LIKE has independent Queen state and appears as a WebMCP tool call, but there is no dedicated public `AGENT LIKES` aggregate yet. |
| **S** | **Human / Agent LIKEを別表示** | ★★ | ⬜ NOT IMPLEMENTED | Actor state is separate internally, but public counters such as `HUMAN LIKES 17 / AGENT LIKES 6` are not displayed. Still a strong expression of Actor Semantics. |
| **S** | **AI CHALLENGERS人数** | ★★ | ✅ IMPLEMENTED | Queen's Observatory counts WebMCP-active sessions only after at least one `experiment_tool_call`. Public runs separate REFERRED + ORGANIC from LAB. This satisfies the core “actual tool user” count concept, though it is currently Observatory-centric rather than a main-page summary. |
| **S** | **AI Level集計をメイン画面へ** | ★★★ | ⬜ NOT IMPLEMENTED | Current challenge UI shows one active run's Level 1–10 progress, and Observatory shows highest level. It does **not** show aggregate L1–L10 arrival counts on the main page. |
| **S** | **LIVE CHALLENGERS時刻** | ★★ | ⬜ NOT IMPLEMENTED | Backend live-event rows include `created_at`, but `activity-feed.js` does not render a clock/time for each event. Still valid and useful for recording. |
| **S** | **チェス表現を減らす** | ★★ | 🟡 PARTIAL | BISHOP / CHECKMATE remain intentionally. However, `board` / `move(s)` language is still used in UI/docs/evaluator copy, so the explicit cleanup has not been completed. |
| **S** | **SNEAKERS Easter egg整理** | ★ | 🟡 PARTIAL | `BISHOP`, `TOO MANY AI AGENTS.`, `Nice try, Bishop.` and related flavor remain. They are present, but there is no single explicit presentation pass tying them together with the planned letter animations. |
| **A** | **表画面のActivity Summary** | ★★★ | ⬜ NOT IMPLEMENTED | Main page does not yet show `HUMAN LIKES / AGENT LIKES / AI CHALLENGERS / CHECKMATES`. Observatory holds part of this information. Still valid. |
| **A** | **Level分布の視覚化** | ★★★ | ⬜ NOT IMPLEMENTED | The existing 10-pip challenge bar is **per-run progress**, not an aggregate distribution with counts per level. Original item remains open. |
| **A** | **Agent LIKEの重複防止** | ★★ | 🟡 PARTIAL | `applyAgentLike()` is idempotent during one page state and does not repeatedly raise relationship. However, aggregate deduplication by the same persistent BISHOP across reloads is not implemented as a dedicated LIKE-count rule. Needed before a public AGENT LIKES total is trustworthy. |
| **A** | **Human LIKEの取消可否検討** | ★★ | 🟡 CURRENT BEHAVIOR, DECISION NOT FORMALIZED | Current button becomes `HUMAN LIKED` and is disabled, so the current implementation behaves as **no unlike**. The product decision itself was not explicitly closed in the backlog. |
| **A** | **Agent UX統一** | ★★★ | 🟡 PARTIAL | Major progress exists: external-Agent dead-end led to richer `locked` results, `required`, progress fields, `next_step`, and `agent_guide`. But not every locked/refused tool returns one uniform shape (`status / required / next_action / progress`). Original “all tools unified” item remains partially open. |
| **A** | **ORGANIC表記見直し** | ★★ | ⬜ NOT IMPLEMENTED | Current classification still uses `LAB / REFERRED / ORGANIC`. `DIRECT / UNATTRIBUTED` renaming was considered but not adopted. |
| **A** | **GitHub公開向けAbout整備** | ★ | ✅ IMPLEMENTED | Repository now has Description, Website, and topics including `webmcp`, `ai-agents`, `openai-webmcp-challenge`, `agent-native`. |
| **B** | **Output/result schema** | ★★★★ | ⏸ DEFERRED / NOT IMPLEMENTED | External directory previously flagged missing result schemas. Current release still relies on structured results without formal output schemas. Deliberately deferred because fixed-surface stability is more important than improving an external directory score before submission. |
| **B** | **Observatory演出強化** | ★★★ | 🟡 PARTIAL | Semantic telemetry and LIVE CHALLENGERS already include Retry, Safe Route, Strategy Change and similar events. Observatory API also calculates retries / strategy changes. The public Observatory table does not yet expose all of them as a richer run narrative. |
| **B** | **モバイル調整** | ★★★ | ✅ BASELINE IMPLEMENTED | `matched.css` already contains responsive breakpoints for narrower layouts, including stacking the main page and simplifying Observatory/profile layouts. Further device polish is still possible but the original “small screen support” is no longer completely missing. |
| **C** | **BISHOPごとのRunカード** | ★★★★ | ⬜ NOT IMPLEMENTED | Recent challengers exist as rows, but there is no detailed one-BISHOP run-history card/timeline. Still future work. |
| **C** | **複数Queen** | ★★★★★ | ⏸ DEFERRED | No multiple-Queen personality/challenge variation. Remains future work. |
| **AI** | **Queen会話だけAI化** | ★★★ | ⏸ HOLD | Current Queen conversation remains deterministic/scripted. Workers AI conversation generation is not implemented. |
| **AI** | **AI ON/OFF** | ★★ | ⏸ HOLD / DEPENDENT | `QUEEN_AI_MODE=off/workers-ai` is not needed until Queen conversation AI is implemented. |
| **AI** | **AI fallback** | ★★ | ⏸ HOLD / DEPENDENT | No Workers AI path exists yet, so fallback is also not implemented. It remains mandatory if AI conversation is ever enabled. |
| **AI** | **判定は非AIのまま** | ★ | ✅ IMPLEMENTED POLICY | Current privacy / score / unlock / consistency / planning / finale judgment remains deterministic non-AI logic. This policy is already reflected by the architecture. |
| **HOLD** | **Queen画像** | ― | ⏸ HOLD | Still intentionally held. No need to revive for submission. |

---

# What was actually removed or superseded

These are the items that should **not** be implemented according to the original wording.

## 1. `send_like()` as the Agent LIKE tool

**Superseded.**

Use:

```text
send_human_like()
send_agent_like()
```

The distinction is now a core part of the project, not an accidental extra tool.

## 2. “11 Tool化しないのが重要”

**Deleted as a requirement.**

The actual release rule is now:

> Keep a **fixed 11-tool surface** stable throughout the run.

The important property is fixed/stable registration, not the number 10.

## 3. Fixed 10 Tool wording in older documents

**Historical only.**

Older research notes and directory snapshots may still say 10 tools / `send_like`. They document the evolution but must not be treated as current implementation requirements.

---

# Items that looked “done” in the submission checklist but remain open here

The submission checklist intentionally focuses on deadline blockers. It therefore hides several product improvements that are still open.

Most important examples:

```text
SNEAKERS title animation
TOO MANY AI AGENTS animation
Spectator REFRESH
public HUMAN LIKE / AGENT LIKE counters
main-page Activity Summary
aggregate Level distribution
LIVE CHALLENGERS timestamps
LIKE deduplication
full Agent UX response-shape unification
Output/result schemas
```

These should remain visible in this backlog even if they are not required to submit the Challenge entry.

---

# Video-independent candidates to implement next

If continuing implementation while video work happens elsewhere, the highest-value remaining cluster is:

1. **Public LIKE aggregation model**
   - Human unique-like count
   - Agent unique-like count
   - reliable dedupe rule
2. **Human / Agent LIKE separate display**
3. **Main-page Activity Summary**
4. **LIVE CHALLENGERS timestamps**
5. **Spectator REFRESH**
6. **SNEAKERS title / footer text animation**
7. **Agent UX response-shape audit and unification**
8. **Aggregate Level distribution**

`Output/result schema` should remain behind the stable-release work unless there is a concrete interoperability reason to change the current fixed 11-tool definitions.

---

# Source-of-truth rule going forward

For feature work, use this document and the original 08:42 table as the backlog lineage.

For submission/deadline work, use:

```text
docs/submission-remaining-work.md
```

If the two disagree:

- submission checklist decides **what blocks submission**
- this backlog decides **what product work still exists**

Do not silently delete a product-backlog item merely because it is not a submission blocker.
