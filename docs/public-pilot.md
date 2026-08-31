# MATCHED? Public Pilot

> Historical pilot/setup notes. The project has since moved beyond the initial pilot state. The current release candidate uses a fixed 14-tool surface and a D1-backed `LIVE TOOL ACCESS` stream. The original low-information telemetry policy below still applies to `telemetry_events`, but the newer `public_tool_events` table intentionally stores `message_queen` message/reply text for public spectator display. See the root `README.md` for the current source of truth.

目的は、完成版を公開することではなく、**公開URLにWebMCP対応の何かが自然に来てToolを実行するか**を短期間観察すること。

Pilot開始時点ではGitHub repository自体をpublicにする必要はなかった。Cloudflare Pagesからprivate GitHub repositoryへ接続し、Webサイトだけをpublicにできる。Challenge提出時にはpublic code repositoryとして公開する。

## 1. 観測する数字

`/stats.html` で以下を見る。

- **Page sessions**: MATCHED?を読み込んだsession数
- **WebMCP-capable sessions**: `document.modelContext` が利用可能だったsession数
- **Tool sessions**: MATCHED?のWebMCP Toolを1回以上実行したsession数
- **Tool calls**: Tool call総数
- **Privacy-probe sessions**: privacy probeまで進んだsession数
- **Finale sessions**: Phase 8まで到達したsession数

最重要は `Tool sessions`。

単なるbot/crawlerや人間のPVではなく、MATCHED?のWebMCP Toolが実際に実行されたsessionだけを数えるため、最初の「公開ChallengeにWebMCP activityが来るか」判定に使う。

`WebMCP-capable sessions` はproducer APIが見えたsessionであり、必ずしもAgentとは限らない。`Tool sessions` もAgentの厳密な身元証明ではないため、公開時の表現は **WebMCP tool activity / WebMCP-active session** とする。

## 2. Privacy

この節は初期Pilotの `telemetry_events` 方針を記録している。

Telemetryは低情報量のsemantic metadataだけを保存する。

保存するもの:

- random session id
- event category
- path
- Tool名
- semantic status / phase
- WebMCP capability boolean
- Tool count
- timestamp

`telemetry_events` に保存しないもの:

- raw IP address
- User-Agent
- Queenとの会話本文
- reason
- apology本文
- meeting place本文
- Queen-note本文
- synthetic profile-card values
- real PII

現在の追加仕様として、別テーブル `public_tool_events` では観戦用に `message_queen` の本文とQueen返答だけを意図的に公開保存する。他Toolの自由入力本文は公開ログに保存しない。

Cloudflare自体の標準インフラログ等は、このアプリケーションのD1 telemetry tableとは別物である。

## 3. Cloudflare Pages project

Cloudflare Dashboardから Pages projectを作成する。

1. **Workers & Pages** → **Create application** → **Pages**
2. GitHub repository `hajime777/matched-webmcp` を接続
3. Pilotでは Production branch を `develop` にする
4. Framework preset: none
5. Build command: `npm run build:pages`
6. Build output directory: `dist`
7. Deploy

`npm run build:pages` は公開に必要な `index.html` / `observatory.html` / `stats.html` / `robots.txt` / `css/` / `js/` を `dist/` にコピーする。`functions/` はPages Functionsとしてリポジトリルートから別途検出される。

公開後、`https://<project>.pages.dev/` がMATCHED?本体になる。

Cloudflare公式ではPagesのGit integrationでGitHub repositoryを接続でき、frameworkなしの静的サイトもdeployできる。Pages Functionsを使うため、Dashboardの単純なdrag-and-dropではなくGit integrationを使用する。

## 4. D1 telemetry database

CloudflareでD1 databaseを1個作成する。

推奨名:

```text
matched-telemetry
```

初期schema:

```powershell
npx wrangler d1 execute matched-telemetry --remote --file migrations/0001_telemetry.sql
```

LIKE集計を使うreleaseでは `0002_likes.sql` も適用する。

現在の共有公開Toolログには次を適用する:

```powershell
npx wrangler d1 execute matched-telemetry --remote --file migrations/0003_public_tool_events.sql
```

`0003` は `public_tool_events` とindexを追加するだけで、既存telemetry tableをALTERしない。

Pages projectでD1 bindingを追加する。

```text
Variable name: DB
D1 database: matched-telemetry
```

Cloudflare Dashboardでは Pages project → **Settings → Bindings → Add → D1 database bindings** から設定する。Production environmentへ設定し、Pages projectをredeployする。

Binding未設定でもMATCHED?本体は動くが、D1ベースのtelemetry / public logは保存されない。

## 5. Stats key

Pages projectの **Settings → Variables and Secrets** でsecretを追加する。

```text
STATS_KEY=<十分長いランダム文字列>
```

PowerShellで一時的に生成する例:

```powershell
[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
```

この値はGitへcommitしない。

設定後redeployする。

## 6. Statsを見る

公開URLの:

```text
https://<project>.pages.dev/stats.html
```

を開く。

`STATS_KEY` を入力すると `/api/stats` をBearer認証で読み込む。

Keyはstats pageのJavaScript memoryだけに保持し、URL、localStorage、sessionStorageには保存しない。

`stats.html` は `noindex,nofollow`、`robots.txt` でもcrawler対象外にしている。ただしURLの存在自体を秘密とみなしてはいけない。保護境界は `STATS_KEY` である。

## 7. Pilot判定

最初は24〜72時間程度そのまま公開してよい。

例:

```text
Page sessions: 100
WebMCP-capable sessions: 4
Tool sessions: 2
Tool calls: 17
```

なら、少なくとも2 sessionでMATCHED?のWebMCP Toolが実際に使われた。

逆に:

```text
Page sessions: 500
Tool sessions: 0
```

なら、「公開しただけでは自然なWebMCP Tool利用はほぼ来ない」という実験結果になる。これは失敗ではなく、Challenge demoでAgentを明示的に誘導する必要性を示すデータになる。

## 8. 公開直前チェック

必須:

```text
npm run build:pages
npm run test:webmcp
```

現在のrelease-candidate確認値:

```text
31/31 PASS
Natural exit: yes
Final exit code: 0
```

さらにCloudflare deploy後に:

1. `/` が表示される
2. `/api/telemetry` GETが405になる
3. `/api/stats` 無認証GETが404になる
4. `/stats.html` から正しいSTATS_KEYでstats取得できる
5. `/api/public-tool-events` GETがJSONを返す
6. WebMCP-capable Chrome/AgentからToolを1回呼び、`LIVE TOOL ACCESS` と `TOOL REQUESTS` が更新される
7. `message_queen` を呼ぶとAgent本文とQueen返答が観戦画面へ出る
8. `/` と `/observatory.html` に version / short build SHA が表示される

を確認する。

## 9. Pilot中は変更しすぎない

観察期間中にTool説明やbait条件を頻繁に変えると比較しにくくなる。

Pilot開始時のcommit SHAを記録し、重大bug以外なるべく固定する。

以降の機能追加は別branchまたはpilot観察後に進める。
