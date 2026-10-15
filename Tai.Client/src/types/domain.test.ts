import { describe, expect, it } from 'vitest';
import { ALL_BLOCKS, blockDisplayName, normalizeBlockCode } from './domain';

/**
 * The interface numbers the syllabus blocks by their position; the API codes them in roman
 * numerals; the bundled static catalogue still uses the ordinal. Anything that groups by
 * block has to reconcile the three or the statistics silently split in half.
 */
describe('normalizeBlockCode', () => {
  it.each([
    ['1', 'I'],
    ['2', 'II'],
    ['3', 'III'],
    ['4', 'IV'],
  ])('maps the ordinal %s to %s', (input, expected) => {
    expect(normalizeBlockCode(input)).toBe(expected);
  });

  it.each([
    ['I', 'I'],
    ['iii', 'III'],
    ['  iv  ', 'IV'],
  ])('normalises the roman code %s to %s', (input, expected) => {
    expect(normalizeBlockCode(input)).toBe(expected);
  });

  it('accepts a number as well as a string', () => {
    expect(normalizeBlockCode(2)).toBe('II');
  });

  it.each([null, undefined, '', '   ', 'all', 'ALL', 'todos'])(
    'treats %s as the whole syllabus',
    (input) => {
      expect(normalizeBlockCode(input)).toBe(ALL_BLOCKS);
    },
  );

  it('passes an unknown code through uppercased instead of guessing', () => {
    expect(normalizeBlockCode('ix')).toBe('IX');
  });
});

describe('blockDisplayName', () => {
  it('names the wildcard in full', () => {
    expect(blockDisplayName(ALL_BLOCKS)).toBe('Todo el temario');
  });

  it('resolves an ordinal to the block it means', () => {
    expect(blockDisplayName('2')).toBe('II · Tecnología básica');
  });

  it('falls back to the code when the block is unknown', () => {
    expect(blockDisplayName('IX')).toBe('IX');
  });
});
