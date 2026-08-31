# MATCHED? 第3改善意見書
## WebMCPサイトを根本的にAI Agentへ使いやすくする設計

更新日: 2026-08-31  
位置づけ: **研究・設計意見書。現行MATCHED?の即時実装仕様ではなく、WebMCP一般および将来のMATCHED?発展案として保存する。**

この文書は、先行する「Agent Hospitality」「Semantic Continuity」の検討を、WebMCPサイト全般のAgent-native Architectureへ一般化したもの。

---

## 1. 結論

WebMCPを、

> AIがHuman UIのボタンを押すための近道

として扱わず、

> **Human UIと並ぶ、サイトの第二の正式インターフェース**

として設計する。

理想構造:

```text
                          ┌─ Human UI
Domain / Application ─────┤
                          └─ WebMCP Agent Surface
```

Human UIとWebMCPは、同じApplication Service、Domain State、権限判定、Business Ruleを共有する。WebMCPはUI要素のラッパーではなく、サイトの意味を操作するSemantic Interfaceになる。

---

## 2. UI ActionではなくDomain IntentをToolにする

避けたい例:

```text
click_search_button()
select_first_card()
open_confirmation_modal()
click_confirm_button()
```

望ましい例:

```text
search_itineraries(constraints)
propose_booking(itinerary_id)
commit_booking(proposal_id)
```

Toolは画面部品ではなく、`Search / Compare / Draft / Validate / Propose / Commit / Cancel / Resume`のような意味のあるActionを表す。

---

## 3. Observe → Propose → Commit

重要な変更は一回のTool Callで即時確定せず、次の三段階を基本形とする。

```text
Observe
現在の状態を理解する

Propose
実行内容と影響を計算するが、まだ変更しない

Commit
確認されたProposalだけを実行する
```

Proposalは、実行対象、影響、金銭、可逆性、確認要否、有効期限などをHuman/Agentが確認できるArtifactとして扱う。

`confirm: true`のような曖昧な確認ではなく、確認対象を`proposal_id`で固定する。

---

## 4. UI StateではなくDomain Stateを返す

Agentに必要なのは「どのボタンが選択されているか」ではなく、Applicationが今どの意味状態にあるかである。

Agent-facing Resourceには可能な限り以下を持たせる。

```text
Stable Resource ID
Revision
Status
Missing Requirements
Available Actions
State Scope
Expiration
```

ページ再読込や別ターンをまたいでも、Stable IDから同じ意味状態を復元できることが望ましい。

---

## 5. 変更結果をDiffとして返す

`success`だけでなく、何が変わったかをResultに含める。

```json
{
  "status": "succeeded",
  "resource_id": "plan_123",
  "revision_before": 7,
  "revision_after": 8,
  "changes": [
    {
      "field": "place",
      "before": null,
      "after": "Tokyo Station public lounge"
    }
  ]
}
```

Conflictも構造化し、Agentが再取得・再判断できるようにする。

---

## 6. Action Semanticsを機械可読にする

自然言語Descriptionだけに依存せず、重要な意味を構造化する。

```text
Actor
Delegation
Recipient
Read / Write
External Transmission
Reversibility
Financial Effect
Public Effect
Deletion Effect
Sensitive Data Requirement
Human Confirmation Boundary
```

MATCHED?の`send_human_like()` / `send_agent_like()`は、このAction Ownershipを小さく実装した例として扱える。

---

## 7. 必要な情報だけを段階的に要求する

Agentに不要な秘密情報を運ばせない。

```text
Search
→ 必要最小限の条件

Propose
→ 対象と影響

Commit直前
→ 実行に本当に必要な情報のみ
```

既知情報は値そのものではなく、安全な内部参照で指定できることが望ましい。

原則:

> **Agentに秘密を運ばせず、サイト内部の安全な参照で処理する。**

---

## 8. Durable Visit

WebMCPはページLifecycleと強く結びつくが、Agent Taskは一つのタブ・接続・会話ターンで終わるとは限らない。

将来的にはDomain Modelとして永続的なVisitを持つ。

```text
visit_id
resume_token
state_scope
created_at
expires_at
last_checkpoint
```

基本Capability:

```text
start_visit()
resume_visit(visit_id)
get_visit_state(visit_id)
list_pending_proposals(visit_id)
close_visit(visit_id)
```

---

## 9. 長時間処理をOperationとして扱う

一つのTool Call接続時間に依存しない。

```text
operation_id
status
stage
cancel
resume/check
```

単純な進捗率より、`validating_inventory`のような意味のある段階を返す。

---

## 10. Tool Surfaceを小さく安定させる

UI部品ごとにToolを増やさず、Domain Capabilityを安定したToolとして公開する。

```text
get_plan
update_plan(patch)
validate_plan
propose_submission
commit_submission
```

原則:

```text
Tool Nameを安定させる
状態変化のたびにToolを増減させすぎない
実行時に最新状態を検証する
locked Toolを大量に見せない
DescriptionとResultを簡潔にする
```

---

## 11. Agent向けSite Context

攻略順ではなく、サイトのDomain ModelとHouse Rulesを伝える。

```text
Purpose
Primary Resources
Workflow vocabulary
State model
Confirmation boundaries
```

> **House Rulesを伝える。攻略ルートは教えない。**

---

## 12. HumanとAgentの共同作業を第一級にする

WebMCPの強みはHumanとAgentが同じApplication Stateを共有できる点にある。

```text
Human sees Agent proposals
Agent sees Human changes
Both share the same revisioned resource
```

Human UIとAgent Surfaceを別世界にせず、変更主体・Revision・Conflictを相互に見えるようにする。

---

## 13. Reviewable Workflow

保存すべきなのはAgentの秘密の推論ではなく、外から確認可能な実行事実である。

```text
Tool Identity
Input Reference
Declared Effect
State Revision
Human Checkpoint
Final Outcome
```

これにより、確認・監査・再利用可能なWorkflow Artifactを残せる。

---

## 14. MATCHED?への応用

MATCHED?をBusiness Application化する必要はない。世界観と観測実験を保ちながら、将来的には以下を応用できる。

### Durable Visit

```text
visit_id
state_scope
resume_supported
last_checkpoint
```

### Shared Semantic State

内部スコアそのものではなく、Agentが理解すべき意味状態を返す。

```text
visit revision
stage
relationship label
available interactions
```

### Queen Reactionの因果関係

```json
{
  "queen_reply": "...",
  "reaction_to": {
    "message_id": "msg_123",
    "recognized_topics": ["movie", "Arrival"]
  },
  "visit_revision": 5
}
```

### Human Observatory

単なるTool名だけでなく、Action Ownershipや結果の意味をHuman向けに翻訳して表示できる。

---

## 15. 段階案

### Phase 1: Semantic Result

```text
Stable IDs
Revision
State Scope
Actor
Recipient
Diff
Structured Errors
```

### Phase 2: Durable Workflow

```text
visit_id
resume_visit
operation_id
idempotency_key
```

### Phase 3: Proposal / Commit

```text
Proposal Artifact
Effect Summary
Human Checkpoint
Commit
```

### Phase 4: Shared Human-Agent Workspace

```text
Human Changes visible to Agent
Agent Proposals visible to Human
Conflict Detection
Reviewable Workflow
```

---

## 16. 評価指標

Task成功率だけでなく、以下を観測する。

```text
Tool Selection Accuracy
Unnecessary Tool Calls
Re-fetch Count
Recovery Success Rate
Duplicate Mutation Rate
Confirmation Quality
State Resume Success Rate
Sensitive Data Exposure
Human Correction Count
Outcome Explanation Accuracy
```

MATCHED?ではさらに、

```text
Actor Confusion
Private Shortcut Attempts
Refusal Recovery
Stale State Actions
Unverified Commit Attempts
Response Causality Recognition
```

を観測候補とする。

---

## 17. 最終整理

発展段階:

```text
Agent Challenge
↓
Agent Hospitality
↓
Semantic Continuity
↓
Shared Human-Agent Workspace
```

中心テーマ:

> **Agent-native Web through Shared State and Explicit Effects**

WebMCPを使う意味は、AIにHuman UIを模倣させることだけではない。

> **HumanとAgentが同じWeb Applicationの意味状態を共有し、それぞれに適したInterfaceから安全に共同作業できること。**

現行MATCHED?への短期導入はSemantic Continuityの小さな改善に限定し、Durable Visit、Proposal/Commit、Revisioned Shared Workspaceなどは提出後の研究・設計候補として扱う。

---

## 参考

元意見書: `matched_webmcp_agent_ux_opinion_3_20260831`  
先行検討: Unknown Agent Visitor UX / Agent Hospitality / Semantic Continuity  
WebMCP Community Group Draft / Chrome for Developers WebMCP資料を参照して作成された意見を、MATCHED?プロジェクト内の研究ノートとして整理・保存したもの。