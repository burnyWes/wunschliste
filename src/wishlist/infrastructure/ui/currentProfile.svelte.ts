import { createContext } from 'svelte';
import type { WatchCurrentPerson } from '../../application/WatchCurrentPerson';
import type { Person } from '../../domain/Person';
import type { Unsubscribe } from '../../domain/Unsubscribe';

export type ProfileState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'chosen'; me: Person };

export class CurrentProfile {
  state = $state.raw<ProfileState>({ status: 'loading' });

  readonly #watchCurrentPerson: WatchCurrentPerson;

  constructor(watchCurrentPerson: WatchCurrentPerson) {
    this.#watchCurrentPerson = watchCurrentPerson;
  }

  get me(): Person {
    if (this.state.status !== 'chosen') {
      throw new Error(`No profile is chosen, the profile is ${this.state.status}.`);
    }
    return this.state.me;
  }

  follow(): Unsubscribe {
    return this.#watchCurrentPerson.execute(
      (person) => {
        this.state = person ? { status: 'chosen', me: person } : { status: 'missing' };
      },
      () => {
        this.state = { status: 'failed' };
      },
    );
  }
}

export const [useCurrentProfile, provideCurrentProfile] = createContext<CurrentProfile>();
