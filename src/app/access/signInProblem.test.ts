import { describe, expect, it } from 'vitest';
import { SIGN_IN_PROBLEM_MESSAGES, signInProblemOf, type SignInProblem } from './signInProblem';

function authError(code: string): Error {
  return Object.assign(new Error(`Firebase: Error (${code}).`), { code });
}

describe('signInProblemOf', () => {
  it.each<[string, SignInProblem]>([
    ['auth/invalid-credential', 'wrongCredentials'],
    ['auth/invalid-email', 'wrongCredentials'],
    ['auth/user-not-found', 'wrongCredentials'],
    ['auth/wrong-password', 'wrongCredentials'],
    ['auth/user-disabled', 'wrongCredentials'],
    ['auth/network-request-failed', 'offline'],
    ['auth/too-many-requests', 'tooManyAttempts'],
    ['auth/internal-error', 'unknown'],
  ])('treats %s as %s', (code, problem) => {
    expect(signInProblemOf(authError(code))).toBe(problem);
  });

  it('treats an error without a code as unknown', () => {
    expect(signInProblemOf(new Error('boom'))).toBe('unknown');
  });

  it('treats a code of the object prototype as unknown', () => {
    expect(signInProblemOf(authError('constructor'))).toBe('unknown');
  });

  it('treats a thrown value that is no object as unknown', () => {
    expect(signInProblemOf('boom')).toBe('unknown');
  });
});

describe('SIGN_IN_PROBLEM_MESSAGES', () => {
  it.each<[SignInProblem, string]>([
    ['wrongCredentials', 'E-Mail oder Passwort stimmt nicht.'],
    ['offline', 'Keine Verbindung. Bitte später erneut versuchen.'],
    ['tooManyAttempts', 'Zu viele Versuche. Bitte später erneut versuchen.'],
    ['unknown', 'Anmelden hat nicht geklappt. Bitte später erneut versuchen.'],
  ])('explains %s in German', (problem, message) => {
    expect(SIGN_IN_PROBLEM_MESSAGES[problem]).toBe(message);
  });
});
