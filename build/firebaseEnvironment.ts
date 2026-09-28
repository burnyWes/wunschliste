const REQUIRED_VARIABLES = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export type FirebaseEnvironment = Record<string, string | undefined>;

export function requireProductionFirebaseEnvironment(environment: FirebaseEnvironment): void {
  const missing = REQUIRED_VARIABLES.filter((name) => !environment[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missing.join(', ')}. ` +
        'Set it in .env.local for local builds or as GitHub Actions variables for CI ' +
        '(see README, "Firebase einrichten").',
    );
  }
  if (environment.VITE_FIREBASE_EMULATORS) {
    throw new Error('VITE_FIREBASE_EMULATORS must not be set for a production build.');
  }
}
