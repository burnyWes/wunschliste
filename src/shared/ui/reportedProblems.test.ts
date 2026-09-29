import { beforeEach, describe, expect, it } from 'vitest';
import { clearProblems, problemTexts, reportProblem } from './reportedProblems.svelte';

describe('reported problems', () => {
  beforeEach(() => clearProblems());

  it('keeps different problems in the order they arrived', () => {
    reportProblem('Die Daten konnten nicht geladen werden.');
    reportProblem('Eine Änderung konnte nicht gespeichert werden.');

    expect(problemTexts()).toEqual([
      'Die Daten konnten nicht geladen werden.',
      'Eine Änderung konnte nicht gespeichert werden.',
    ]);
  });

  it('shows a repeated problem only once', () => {
    reportProblem('Die Daten konnten nicht geladen werden.');
    reportProblem('Die Daten konnten nicht geladen werden.');

    expect(problemTexts()).toEqual(['Die Daten konnten nicht geladen werden.']);
  });

  it('forgets all problems when cleared', () => {
    reportProblem('Die Daten konnten nicht geladen werden.');

    clearProblems();

    expect(problemTexts()).toEqual([]);
  });
});
