import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import { PersonOwnsWishlists } from '../domain/personRules';
import { DeletePerson } from './DeletePerson';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { personNamed } from './fakes/personNamed';
import { wishlistNamed } from './fakes/wishlistNamed';

const ben = personIdOf('ben');

async function setUp() {
  const persons = new InMemoryPersonRepository();
  const wishlists = new InMemoryWishlistRepository();
  await persons.save(personNamed('Ben'));
  return { persons, wishlists, deletePerson: new DeletePerson(persons, wishlists) };
}

describe('DeletePerson', () => {
  it('deletes a person without wishlists', async () => {
    const { persons, deletePerson } = await setUp();

    await deletePerson.execute(ben);

    expect(await persons.get(ben)).toBeUndefined();
  });

  it('refuses to delete a person who owns wishlists and keeps the person', async () => {
    const { persons, wishlists, deletePerson } = await setUp();
    await wishlists.save(wishlistNamed('Ostern', 'easter', ben));

    await expect(deletePerson.execute(ben)).rejects.toThrow(PersonOwnsWishlists);
    expect(await persons.get(ben)).toBeDefined();
  });
});
