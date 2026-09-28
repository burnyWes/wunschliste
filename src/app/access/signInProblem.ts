export type SignInProblem = 'wrongCredentials' | 'offline' | 'tooManyAttempts' | 'unknown';

const PROBLEMS_BY_CODE: ReadonlyMap<unknown, SignInProblem> = new Map([
  ['auth/invalid-credential', 'wrongCredentials'],
  ['auth/invalid-email', 'wrongCredentials'],
  ['auth/user-not-found', 'wrongCredentials'],
  ['auth/wrong-password', 'wrongCredentials'],
  ['auth/user-disabled', 'wrongCredentials'],
  ['auth/network-request-failed', 'offline'],
  ['auth/too-many-requests', 'tooManyAttempts'],
]);

export const SIGN_IN_PROBLEM_MESSAGES: Readonly<Record<SignInProblem, string>> = {
  wrongCredentials: 'E-Mail oder Passwort stimmt nicht.',
  offline: 'Keine Verbindung. Bitte später erneut versuchen.',
  tooManyAttempts: 'Zu viele Versuche. Bitte später erneut versuchen.',
  unknown: 'Anmelden hat nicht geklappt. Bitte später erneut versuchen.',
};

function errorCodeOf(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
}

export function signInProblemOf(error: unknown): SignInProblem {
  return PROBLEMS_BY_CODE.get(errorCodeOf(error)) ?? 'unknown';
}
