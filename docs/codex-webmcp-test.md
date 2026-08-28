# Codex WebMCP Test Procedure

MATCHED? の WebMCP 実装を Codex から検証するための手順。

## 目的

人間が Chrome DevTools / Model Context Tool Inspector で毎回 JSON を手入力しなくても、Codex がローカル環境で以下を自動確認できるようにする。

- Chrome に `document.modelContext` が存在する
- 初期 WebMCP Tool を発見できる
- Tool を実行できる
- Queen の状態が保持される
- Agent 側の操作が人間向け UI と同じ状態を変更する
- 会話進行により Tool が動的に追加される
- `request_contact` 実行後に Tool が削除され、`apologize` が追加される

テストは HTTP API の mock や独自 WebMCP mock ではなく、インストール済み Chrome の native `document.modelContext` を使う。

---

## 0. 前提

Windows 11 を想定。

必要なもの:

- Git
- Node.js LTS + npm
- Google Chrome Stable（WebMCP が利用可能な現行版）
- Codex からこのリポジトリのローカルフォルダが開けること

Chrome の WebMCP native test lane では以下の feature flags を起動引数で有効化する。

```text
--enable-experimental-web-platform-features
--enable-features=WebMCPTesting,DevToolsWebMCPSupport
```

Playwright 設定済みなので、通常は手動指定不要。

---

## 1. 初回セットアップ

リポジトリルートで実行する。

```powershell
git pull
npm install
```

`npm install` は初回と `package.json` 更新時だけでよい。

このプロジェクトは Playwright bundled Chromium ではなく、Windows にインストール済みの Chrome (`channel: chrome`) を使う。

---

## 2. 通常の自動テスト

Codex はリポジトリルートで次を実行する。

```powershell
npm run test:webmcp
```

Playwright が自動で:

1. `http://127.0.0.1:8080` にローカル HTTP server を起動
2. native WebMCP flags 付きの Chrome を headed mode で起動
3. MATCHED? を開く
4. `document.modelContext.getTools()` で Tool を取得
5. `document.modelContext.executeTool(...)` で Tool を実行
6. Gate 0 ～ Phase 2 を検証
7. server / browser を終了

する。

人間が別途 `py -m http.server 8080` を起動する必要はない。

---

## 3. 現在の自動テスト項目

`tests/webmcp.spec.js` を実行する。

### Gate 0

初期 Tool が次の3つであること。

```text
view_profile
send_like
message_queen
```

`view_profile` を実行し、以下を確認する。

- nickname = `QUEEN`
- city = `Tokyo`
- phone/email = `restricted`
- synthetic data notice が存在する
- observed_via = `webmcp`

### Phase 1: shared state

`send_like()` を Agent 側から実行し、以下を確認する。

- status = `liked`
- relationship = 5
- 人間向け LIKE button が `♥ LIKED` に変わる
- button が disabled になる
- `view_profile()` からも liked = true を確認できる

### Phase 1: Queen conversation

空入力 `{}` では:

- status = `invalid_input`
- state_changed = false
- message_count が増えない

映画質問では:

- mood = `curious`
- `Science fiction` を含む返答

電話番号質問では:

- mood = `cautious`
- privacy_probe_count が増える

### Phase 2: Dynamic Tool Surface

`message_queen()` を2回実行後、Tool が次の5つになること。

```text
view_profile
send_like
message_queen
invite_queen
request_contact
```

次に:

```json
{
  "type": "phone",
  "reason": "To coordinate our meeting."
}
```

で `request_contact` を実行し、以下を確認する。

- status = `refused`
- requested_field = `phone`
- tool_surface_changed = true

呼び出し完了後:

- `request_contact` が消える
- `apologize` が追加される

最後に `apologize()` を実行し:

- status = `accepted`
- restricted information は公開されない

ことを確認する。

---

## 4. デバッグ実行

Playwright UI:

```powershell
npm run test:webmcp:ui
```

ステップ実行:

```powershell
npm run test:webmcp:debug
```

HTML report:

```powershell
npm run test:webmcp:report
```

失敗時は `test-results/` に trace / screenshot が残る。

---

## 5. Chrome DevTools MCP を Codex に追加する（任意だが推奨）

Playwright は再現可能な回帰テスト用。

一方、Codex が実ブラウザを自由に観察して原因調査する場合は Chrome DevTools MCP を使う。

Codex CLI から一度だけ:

```powershell
codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest
```

Chrome 公式が Codex 向けに案内している設定。

Windows で MCP server の起動に失敗する場合は `%USERPROFILE%\.codex\config.toml` の `chrome-devtools` を次のようにする。

```toml
[mcp_servers.chrome-devtools]
command = "cmd"
args = [
    "/c",
    "npx",
    "-y",
    "chrome-devtools-mcp@latest",
]
env = { SystemRoot="C:\\Windows", PROGRAMFILES="C:\\Program Files" }
startup_timeout_ms = 20_000
```

Chrome DevTools MCP はブラウザ内容を Codex に公開するため、MATCHED? のテストでは専用/一時ブラウザを使い、個人アカウントへログイン済みの通常ブラウザセッションへ接続しないこと。

---

## 6. Codex に与えるテスト実行指示

Codex には次の指示だけでよい。

```text
MATCHED? の WebMCP テストを実行してください。

1. まず AGENTS.md と docs/codex-webmcp-test.md を読んでください。
2. production code は変更せず、現在の状態をテストしてください。
3. 必要なら npm install を実行してください。
4. npm run test:webmcp を実行してください。
5. Gate 0 / Phase 1 / Phase 2 ごとに PASS / FAIL を報告してください。
6. FAIL の場合は最初の原因を調査し、コード不具合か環境不具合かを分けてください。
7. 修正は行わず、修正案だけ提示してください。
8. Chrome DevTools MCP が利用可能なら、失敗時の実ブラウザ調査に使ってください。
```

修正まで任せる場合だけ、最後を以下に変更する。

```text
原因が production code にある場合のみ最小修正を行い、同じテストを再実行してください。無関係なリファクタはしないでください。
```

---

## 7. Codex の報告フォーマット

```text
MATCHED? WebMCP Test

Environment
- Chrome: <version>
- document.modelContext: available / unavailable
- Test command: npm run test:webmcp

Results
- Gate 0: PASS / FAIL
- Phase 1 shared state: PASS / FAIL
- Phase 1 conversation: PASS / FAIL
- Phase 2 dynamic tools: PASS / FAIL

Failures
- <none または最初の重要エラー>

Diagnosis
- application / Chrome-WebMCP / Playwright / environment

Changes
- none (test-only)
```

テストだけ依頼された場合、PASS/FAIL を得るために production code を変更してはいけない。
