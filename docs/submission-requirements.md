# MATCHED? — Official Submission Requirements Check

Verified: 2026-08-30

This document is a compact guardrail for the final OpenAI WebMCP Challenge submission. It summarizes the current official OpenAI / Devpost requirements that matter directly to MATCHED?.

Source of truth remains the official pages:

- https://openai.com/webmcp-challenge/
- https://webmcp.devpost.com/
- https://webmcp.devpost.com/rules
- https://webmcp.devpost.com/resources

## Deadline

Official Devpost deadline:

```text
2026-09-03 13:00 PDT
2026-09-04 05:00 JST
```

Do not plan around a later local-time interpretation.

## Required submission components

### 1. Working live URL

Judges must be able to access the project using:

- ChatGPT's in-app browser, or
- Google Chrome with WebMCP enabled.

MATCHED? current live URL:

```text
https://matched-webmcp.pages.dev/
```

Status: **available**.

### 2. Text description

The submission description must explain:

- why the use case is a strong fit for WebMCP
- how it creates a better user experience
- what people and agents can do together that was difficult or impossible before
- briefly how WebMCP was implemented

MATCHED? current draft:

```text
docs/devpost-submission-draft.md
```

Status: **draft exists; final review still required**.

### 3. Public code repository

The submission must provide a public code repository containing the necessary source code, assets, and instructions required for the project to function.

The repository must include an open-source license.

MATCHED? current repository:

```text
https://github.com/hajime777/matched-webmcp
```

Current state:

```text
visibility: public
license: MIT
default branch: develop
```

Status: **requirement currently satisfied**.

### 4. Demo video

A demo video is required.

Current official requirement:

- public YouTube video
- under 3 minutes
- clear functioning demo
- audio explaining what was built and how WebMCP is used

Status: **in progress outside this workstream**.

## MATCHED? testing instructions

Judges should not need to rebuild the project from scratch.

Public surfaces:

```text
Main game
https://matched-webmcp.pages.dev/

Challenge overlay
https://matched-webmcp.pages.dev/?challenge=1

Queen's Observatory
https://matched-webmcp.pages.dev/observatory.html
```

Repository test command:

```powershell
npm run test:webmcp
```

Current documented regression baseline:

```text
24 / 24 passed
```

The baseline does not replace the final pre-submission regression run.

## Final pre-submit gate

Before pressing Submit, confirm all of the following:

- [ ] live URL opens
- [ ] judges can discover the WebMCP surface
- [ ] repository is public
- [ ] MIT license is visible
- [ ] README contains usable project/testing instructions
- [ ] Devpost text answers all four required description points
- [ ] public YouTube video is under 3 minutes and includes audio
- [ ] video URL works without special permission
- [ ] final native WebMCP regression passes
- [ ] final deployed version matches the version described in Devpost/video

## Judging freeze — important

The official Devpost resources explicitly warn entrants not to modify submission materials after the submission period closes.

After the deadline, leave the judged version untouched until winners are announced:

```text
Do not edit:
- Devpost submission
- submitted repository / judged branch
- live submitted site
```

If development must continue during judging, work in a separate fork/copy/branch and do not alter the submitted live/judged version.

Recommended MATCHED? release procedure:

```text
final regression
    ↓
final deployment
    ↓
record release commit SHA
    ↓
verify Devpost links
    ↓
submit
    ↓
freeze judged version
```

## What is not an official requirement

The following may improve the project but should not be confused with submission requirements:

- WebMCP Directory freshness
- organic public-agent traffic
- community announcements
- additional model comparisons
- new challenge mechanics
- large Observatory changes
- additional telemetry architecture

Do not risk the stable submission to complete optional work.
