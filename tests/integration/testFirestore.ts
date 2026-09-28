import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase/firestore';
import { readFamilyRules } from '../familyAccount';

export const EMULATED_PROJECT_ID = 'demo-wunschliste';

export function startTestEnvironment(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: EMULATED_PROJECT_ID,
    firestore: { rules: readFamilyRules(), host: '127.0.0.1', port: 8080 },
  });
}

export function asModularFirestore(context: RulesTestContext): Firestore {
  // The compat instance works with the modular functions at runtime, as documented in
  // https://firebase.google.com/docs/rules/unit-tests#run_local_unit_tests_with_the_version_9_javascript_sdk
  return context.firestore() as unknown as Firestore;
}
