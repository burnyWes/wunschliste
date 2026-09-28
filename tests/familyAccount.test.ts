import { describe, expect, it } from 'vitest';
import { familyAccountUidFrom } from './familyAccount';

describe('familyAccountUidFrom', () => {
  it('reads the UID the rules grant access to', () => {
    expect(familyAccountUidFrom("return request.auth.uid == 'abc123';")).toBe('abc123');
  });

  it('refuses rules without a family account', () => {
    expect(() => familyAccountUidFrom('return request.auth != null;')).toThrow(/firestore.rules/);
  });
});
