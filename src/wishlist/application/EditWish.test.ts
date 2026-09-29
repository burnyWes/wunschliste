import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { WishNotFound } from '../domain/Wish';
import { EditWish } from './EditWish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { wishNamed } from './fakes/wishNamed';

const tent = { name: requireValid(Name.parse('Zelt')) };

describe('EditWish', () => {
  it('saves the new details and keeps the gift state', async () => {
    const wishes = new InMemoryWishRepository();
    await wishes.save(wishNamed('Helm', { giverId: personIdOf('ben'), received: true }));

    await new EditWish(wishes).execute(wishIdOf('Helm'), tent);

    const edited = await wishes.get(wishIdOf('Helm'));
    expect(edited?.details).toBe(tent);
    expect(edited?.giverId).toBe('ben');
    expect(edited?.received).toBe(true);
  });

  it('refuses an unknown wish', async () => {
    await expect(
      new EditWish(new InMemoryWishRepository()).execute(wishIdOf('x'), tent),
    ).rejects.toThrow(WishNotFound);
  });
});
