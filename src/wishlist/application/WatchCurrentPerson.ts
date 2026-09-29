import type { PersonId } from '../domain/ids';
import type { Person } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import type { ProfileStore } from '../domain/ProfileStore';
import type { Unsubscribe } from '../domain/Unsubscribe';

export class WatchCurrentPerson {
  constructor(
    private readonly persons: PersonRepository,
    private readonly profileStore: ProfileStore,
  ) {}

  execute(onChange: (person: Person | undefined) => void, onFailure: () => void): Unsubscribe {
    let chosenId: PersonId | undefined = this.profileStore.current();
    let knownPersons: readonly Person[] | undefined;
    const reportChosenPerson = () => {
      if (knownPersons !== undefined) {
        onChange(knownPersons.find((person) => person.id === chosenId));
      }
    };
    const stopWatchingProfile = this.profileStore.watch((id) => {
      chosenId = id;
      reportChosenPerson();
    });
    const stopWatchingPersons = this.persons.watchAll((persons) => {
      knownPersons = persons;
      reportChosenPerson();
    }, onFailure);
    return () => {
      stopWatchingProfile();
      stopWatchingPersons();
    };
  }
}
