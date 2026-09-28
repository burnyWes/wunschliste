import type { FirebaseOptions } from 'firebase/app';

export const firebaseOptions: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === 'true';
