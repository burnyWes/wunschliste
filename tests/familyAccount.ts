import { readFileSync } from 'node:fs';

export const FAMILY_RULES_PATH = 'firestore.rules';

const FAMILY_ACCOUNT_UID_PATTERN = /request\.auth\.uid == '([^']+)'/;

export function familyAccountUidFrom(rules: string): string {
  const match = FAMILY_ACCOUNT_UID_PATTERN.exec(rules);
  if (match === null) {
    throw new Error(`No family account UID found in ${FAMILY_RULES_PATH}.`);
  }
  return match[1];
}

export function readFamilyRules(): string {
  return readFileSync(FAMILY_RULES_PATH, 'utf8');
}
