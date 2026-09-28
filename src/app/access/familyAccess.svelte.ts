import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { signInProblemOf, type SignInProblem } from './signInProblem';

export type AccessState =
  { status: 'checking' } | { status: 'signedOut' } | { status: 'signedIn'; email: string };

export type SignOutSteps = {
  before: () => Promise<void>;
  after: () => Promise<void>;
};

const AFTER_SIGN_OUT_TIME_LIMIT_MS = 3000;

function accessStateOf(user: User | null): AccessState {
  return user === null ? { status: 'signedOut' } : { status: 'signedIn', email: user.email ?? '' };
}

async function settledWithin(step: Promise<void>, timeLimitMs: number): Promise<void> {
  const timeLimit = new Promise<void>((resolve) => setTimeout(resolve, timeLimitMs));
  await Promise.race([step, timeLimit]).catch(() => undefined);
}

export class FamilyAccess {
  state = $state.raw<AccessState>({ status: 'checking' });

  readonly #auth: Auth;
  #signOutSteps: readonly SignOutSteps[] = [];

  constructor(auth: Auth) {
    this.#auth = auth;
  }

  follow(): () => void {
    return onAuthStateChanged(this.#auth, (user) => {
      this.state = accessStateOf(user);
    });
  }

  async signIn(email: string, password: string): Promise<SignInProblem | undefined> {
    try {
      await signInWithEmailAndPassword(this.#auth, email, password);
      return undefined;
    } catch (error) {
      return signInProblemOf(error);
    }
  }

  onSignOut(steps: SignOutSteps): () => void {
    this.#signOutSteps = [...this.#signOutSteps, steps];
    return () => {
      this.#signOutSteps = this.#signOutSteps.filter((registered) => registered !== steps);
    };
  }

  async signOut(): Promise<void> {
    const steps = this.#signOutSteps;
    try {
      await Promise.all(steps.map(({ before }) => before()));
    } finally {
      await signOut(this.#auth);
    }
    await Promise.all(
      steps.map(({ after }) => settledWithin(after(), AFTER_SIGN_OUT_TIME_LIMIT_MS)),
    );
  }
}
