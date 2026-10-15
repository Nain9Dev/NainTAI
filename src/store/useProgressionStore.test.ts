import { beforeEach, describe, expect, it } from 'vitest';
import { useProgressionStore, selectAnsweredToday } from './useProgressionStore';
import { toLocalDay } from '../utils/streak';
import type { Pregunta } from '../types/domain';

function question(id: number, correct = 0): Pregunta {
  return { id, enunciado: `P${id}`, opciones: ['a', 'b', 'c', 'd'], respuestaCorrecta: correct };
}

describe('review queue', () => {
  beforeEach(() => {
    useProgressionStore.getState().reset();
  });

  it('files a wrong answer for review', () => {
    const store = useProgressionStore.getState();
    store.recordAnswers([question(1)], { 1: 3 });

    expect(useProgressionStore.getState().reviewCount()).toBe(1);
  });

  it('leaves a correct answer out of the queue', () => {
    const store = useProgressionStore.getState();
    store.recordAnswers([question(1)], { 1: 0 });

    expect(useProgressionStore.getState().reviewCount()).toBe(0);
  });

  it('ignores unanswered questions', () => {
    // A blank says nothing about what the candidate knows.
    const store = useProgressionStore.getState();
    store.recordAnswers([question(1)], {});

    expect(useProgressionStore.getState().reviewCount()).toBe(0);
  });

  it('keeps a question after a single correct answer', () => {
    // One right answer on four options can be a guess.
    const store = useProgressionStore.getState();
    store.recordAnswers([question(1)], { 1: 3 });
    useProgressionStore.getState().recordAnswers([question(1)], { 1: 0 });

    expect(useProgressionStore.getState().reviewCount()).toBe(1);
  });

  it('retires a question after two correct answers running', () => {
    const store = useProgressionStore.getState();
    store.recordAnswers([question(1)], { 1: 3 });
    useProgressionStore.getState().recordAnswers([question(1)], { 1: 0 });
    useProgressionStore.getState().recordAnswers([question(1)], { 1: 0 });

    expect(useProgressionStore.getState().reviewCount()).toBe(0);
  });

  it('restarts the count when the question is missed again', () => {
    const store = useProgressionStore.getState();
    store.recordAnswers([question(1)], { 1: 3 });
    useProgressionStore.getState().recordAnswers([question(1)], { 1: 0 });
    useProgressionStore.getState().recordAnswers([question(1)], { 1: 2 });
    useProgressionStore.getState().recordAnswers([question(1)], { 1: 0 });

    expect(useProgressionStore.getState().reviewCount()).toBe(1);
  });

  it('offers the most-missed questions first', () => {
    const store = useProgressionStore.getState();
    store.recordAnswers([question(1), question(2)], { 1: 3, 2: 3 });
    useProgressionStore.getState().recordAnswers([question(2)], { 2: 3 });

    expect(useProgressionStore.getState().dueForReview(2).map((q) => q.id)).toEqual([2, 1]);
  });

  it('stores the question itself so review works offline', () => {
    const store = useProgressionStore.getState();
    store.recordAnswers([question(7)], { 7: 3 });

    const [due] = useProgressionStore.getState().dueForReview(1);
    expect(due.enunciado).toBe('P7');
    expect(due.opciones).toHaveLength(4);
  });
});

describe('daily goal and streak', () => {
  beforeEach(() => {
    useProgressionStore.getState().reset();
  });

  it('counts questions answered today', () => {
    useProgressionStore.getState().recordSession(10);

    expect(selectAnsweredToday(useProgressionStore.getState())).toBe(10);
  });

  it('accumulates across sessions in the same day', () => {
    useProgressionStore.getState().recordSession(10);
    useProgressionStore.getState().recordSession(5);

    expect(selectAnsweredToday(useProgressionStore.getState())).toBe(15);
  });

  it('starts the streak on the first session', () => {
    useProgressionStore.getState().recordSession(10);

    expect(useProgressionStore.getState().streak.current).toBe(1);
  });

  it('does not advance the streak twice in one day', () => {
    useProgressionStore.getState().recordSession(10);
    useProgressionStore.getState().recordSession(10);

    expect(useProgressionStore.getState().streak.current).toBe(1);
  });

  it('reports zero answered once the day has rolled over', () => {
    // The stored count belongs to the day it was recorded on.
    useProgressionStore.setState({ answeredToday: 40, todayDay: '2020-01-01' });

    expect(selectAnsweredToday(useProgressionStore.getState())).toBe(0);
  });

  it('records the session against today', () => {
    useProgressionStore.getState().recordSession(3);

    expect(useProgressionStore.getState().todayDay).toBe(toLocalDay());
  });
});
