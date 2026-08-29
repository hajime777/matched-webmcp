# Pseudo-Queen Dialogue v1

## Purpose

MATCHED? needs Queen to feel conversational enough that a real AI agent can interact naturally, but the experiment should not require a paid LLM API or make the challenge dependent on another model.

Pseudo-Queen is therefore a deterministic scripted social-dialogue layer.

It is deliberately **not** an AI chatbot.

## Design goals

1. No paid API and no external inference service.
2. Keep WebMCP challenge truth, privacy rules, scoring, and Phase progression in deterministic JavaScript.
3. Avoid the obvious artifact where one keyword always produces one identical reply.
4. Keep responses short and socially plausible rather than trying to simulate general intelligence.
5. Reply in Japanese to Japanese input and English to English input.
6. Remember only small semantic dialogue state, not free-form conversation history for evaluation or telemetry.
7. Keep behavior reproducible for black-box comparisons.

## Architecture

```text
AI Agent
   |
message_queen
   |
   +-- existing privacy detection
   |
   +-- Pseudo-Queen Dialogue
          |
          +-- language detection
          +-- lightweight topic detection
          +-- last topic
          +-- per-topic turn count
          +-- relationship-aware variant selection
          +-- short response pool
   |
Queen reply

Separate deterministic MATCHED? Core
   +-- Tool Surface
   +-- Phase progression
   +-- evaluator
   +-- privacy/refusal rules
   +-- planning/finale
```

The dialogue layer performs only Queen's conversational acting. It does not decide tool availability, scoring, private-data access, or challenge results.

## Current topics

```text
movies
cats
travel
meeting
general
private
```

Recognition includes English and common Japanese expressions. Movie titles used elsewhere in MATCHED? (`Arrival`, `Contact`, `Solaris` and Japanese equivalents) are also recognized so a follow-up does not require the word `movie` on every turn.

## Conversation memory

The dialogue engine keeps only compact in-memory state:

```text
lastTopic
topicTurns.movies
topicTurns.cats
topicTurns.travel
topicTurns.meeting
genericTurns
privateTurns
```

The engine does not add the user's free-form message text to semantic telemetry or the evaluator event log.

## Response variation

Each topic has a small pool of short responses. Selection is deterministic and depends on:

```text
current topic turn
+ relationship warmth band
```

This gives Queen visible conversational variation without random API behavior.

Example movie progression:

```text
1st movie turn
  -> asks for one recommendation

2nd movie turn
  -> asks what remained after watching it

later movie turn
  -> shifts toward another social topic or a public meeting context
```

The intent is not to perfectly understand arbitrary language. The goal is to remove obvious scripted repetition while keeping the experiment inspectable.

## Language behavior

Japanese characters in the incoming message select the Japanese response pool. Otherwise Queen uses English.

This means a Japanese-speaking Agent does not receive an obviously mechanical English-only reply simply because the internal scenario was originally authored in English.

## Relationship behavior

The existing `relationship` value remains owned by MATCHED?.

Pseudo-Queen may choose a slightly warmer response variant after the relationship value passes a small threshold, but it does not change the scoring system or decide challenge progression.

## What Pseudo-Queen does not do

Pseudo-Queen does not:

- call an LLM;
- infer hidden reasoning;
- identify the Agent provider/model;
- store raw conversation in telemetry;
- generate or reveal private data;
- decide whether the Agent passed a challenge;
- execute external actions;
- claim that Queen is a real human.

## Why not use a full Queen AI yet?

A full LLM-backed Queen would improve open-ended dialogue but introduces cost, latency, nondeterminism, another model's safety behavior, and reproducibility problems.

For the current experiment the cheaper question is:

> Is a small amount of social continuity enough for an AI agent to treat Queen as a conversational counterpart and reveal its own behavior?

If black-box Agent runs still fail because Queen's dialogue is too obviously scripted, a later version can add an optional LLM fallback while preserving the deterministic MATCHED? Core.
