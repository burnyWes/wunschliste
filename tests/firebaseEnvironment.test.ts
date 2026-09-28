import { describe, expect, it } from 'vitest';
import { requireProductionFirebaseEnvironment } from '../build/firebaseEnvironment';

const COMPLETE_ENVIRONMENT = {
  VITE_FIREBASE_API_KEY: 'api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'wunschliste-familie.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'wunschliste-familie',
  VITE_FIREBASE_APP_ID: 'app-id',
};

describe('requireProductionFirebaseEnvironment', () => {
  it('accepts a complete configuration without emulators', () => {
    expect(() => requireProductionFirebaseEnvironment(COMPLETE_ENVIRONMENT)).not.toThrow();
  });

  it('names a missing variable and where to set it', () => {
    const incomplete = { ...COMPLETE_ENVIRONMENT, VITE_FIREBASE_APP_ID: undefined };

    expect(() => requireProductionFirebaseEnvironment(incomplete)).toThrow(
      /VITE_FIREBASE_APP_ID.*\.env\.local.*Actions variables/s,
    );
  });

  it('treats an empty value as missing', () => {
    expect(() =>
      requireProductionFirebaseEnvironment({ ...COMPLETE_ENVIRONMENT, VITE_FIREBASE_API_KEY: '' }),
    ).toThrow(/VITE_FIREBASE_API_KEY/);
  });

  it('refuses the emulators', () => {
    expect(() =>
      requireProductionFirebaseEnvironment({
        ...COMPLETE_ENVIRONMENT,
        VITE_FIREBASE_EMULATORS: 'true',
      }),
    ).toThrow('VITE_FIREBASE_EMULATORS must not be set for a production build');
  });
});
