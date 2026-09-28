import { familyAccountUidFrom, readFamilyRules } from '../tests/familyAccount';

export const PROJECT_ID = 'demo-wunschliste';

export const FAMILY = { email: 'familie@example.de', password: 'geheim-123' };

const AUTH_EMULATOR = 'http://127.0.0.1:9099';

export type Account = { uid: string; email: string; password: string };

export function familyAccountUid(): string {
  return familyAccountUidFrom(readFamilyRules());
}

async function requireSuccess(response: Response, action: string): Promise<void> {
  if (!response.ok) {
    throw new Error(`${action} failed: ${response.status} ${await response.text()}`);
  }
}

export async function resetAuth(): Promise<void> {
  const response = await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  });
  await requireSuccess(response, 'Resetting the auth emulator');
}

export async function createAccount({ uid, email, password }: Account): Promise<void> {
  const response = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: uid, email, password }),
    },
  );
  await requireSuccess(response, `Creating the account ${email}`);
}
