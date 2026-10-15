# ADR-0005 — The exam in progress lives in sessionStorage

- **Status:** Approved
- **Date:** 2026-09-08

## Context

The study store held the exam entirely in memory. A page reload — an accidental refresh, a
phone reclaiming memory from a background tab, a browser update — discarded the answer sheet,
the position and the clock. Twenty answered questions, gone.

The store also exposed `currentIndex`, `nextQuestion` and `prevQuestion` while the engine
rendered every question on one long page, so those actions were never called. There was no
timer at all, despite the countdown being one of the two things that make exam mode
different from study mode.

## Decision

Persist the exam to `sessionStorage`: mode, questions, answers, position, block, start and
finish timestamps, remaining seconds and the review flag.

`sessionStorage` rather than `localStorage`, because the two failure modes are not
symmetrical. Losing an exam to a reload is bad. Having an exam abandoned three days ago
reappear in a fresh tab is confusing in a different way, and there is no natural moment to
clear it.

The countdown is anchored to wall-clock time: each tick measures elapsed milliseconds rather
than assuming it fired on schedule. A backgrounded tab has its timers throttled, so a
tick-counting clock hands the candidate minutes they should not have.

## Consequences

- A reload mid-exam restores everything, clock included.
- The clock stays honest across tab switches, which is the whole point of exam mode.
- Closing the tab ends the exam, which matches what a candidate expects from "I closed it".
- The store now carries the full exam, so the engine renders one question at a time and the
  navigation actions are finally used.
- `finishedAt` is stamped when the exam closes, so the elapsed time on the results screen
  stays fixed instead of creeping upward while the candidate reads it.
