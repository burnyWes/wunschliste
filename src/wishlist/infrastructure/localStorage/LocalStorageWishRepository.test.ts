import { beforeEach, describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf, type WishlistId } from '../../domain/ids';
import { parseWishDetails, type WishDetailsInput } from '../../domain/WishDetails';
import { Wish } from '../../domain/Wish';
import { LocalStorageWishRepository, WISHES_KEY } from './LocalStorageWishRepository';
import { MapStorage, storageEventFor } from './testStorage';

const birthday = wishlistIdOf('birthday');
const christmas = wishlistIdOf('christmas');

function wishNamed(name: string, wishlistId: WishlistId = birthday, id = name): Wish {
  const input: WishDetailsInput = { name, link: '', description: '', price: '', rating: undefined };
  const parsed = parseWishDetails(input);
  if (!parsed.ok) {
    throw new Error(`Invalid test wish ${name}`);
  }
  return Wish.create(wishIdOf(id), wishlistId, parsed.details);
}

function namesOf(wishes: readonly Wish[]): string[] {
  return wishes.map(({ details }) => details.name.value);
}

describe('LocalStorageWishRepository', () => {
  let storage: MapStorage;
  let storageEvents: EventTarget;
  let repository: LocalStorageWishRepository;

  beforeEach(() => {
    storage = new MapStorage();
    storageEvents = new EventTarget();
    repository = new LocalStorageWishRepository(storage, storageEvents);
  });

  it('restores every field for another instance on the same storage', async () => {
    const parsed = parseWishDetails({
      name: 'Fahrradhelm',
      link: 'amazon.de/helm',
      description: 'Größe M',
      price: '49,99',
      rating: 'essential',
    });
    if (!parsed.ok) {
      throw new Error('Invalid test wish');
    }
    await repository.save(Wish.create(wishIdOf('h'), birthday, parsed.details));

    const otherInstance = new LocalStorageWishRepository(storage, new EventTarget());
    const restored = await otherInstance.get(wishIdOf('h'));

    expect(restored?.wishlistId).toBe(birthday);
    expect(restored?.details.name.value).toBe('Fahrradhelm');
    expect(restored?.details.link?.href).toBe('https://amazon.de/helm');
    expect(restored?.details.description?.value).toBe('Größe M');
    expect(restored?.details.price?.cents).toBe(4999);
    expect(restored?.details.rating).toBe('essential');
    expect(restored?.gifted).toBe(false);
  });

  it('reports only the wishes of one wishlist, at once and after each save and delete', async () => {
    const reports: string[][] = [];
    repository.watchByWishlist(birthday, (wishes) => reports.push(namesOf(wishes)));

    await repository.save(wishNamed('Helm'));
    await repository.save(wishNamed('Schlitten', christmas));
    await repository.delete(wishIdOf('Helm'));

    expect(reports).toEqual([[], ['Helm'], ['Helm'], []]);
  });

  it('reports a single wish and its removal', async () => {
    await repository.save(wishNamed('Helm'));
    const reports: (string | undefined)[] = [];
    repository.watch(wishIdOf('Helm'), (wish) => reports.push(wish?.details.name.value));

    await repository.delete(wishIdOf('Helm'));

    expect(reports).toEqual(['Helm', undefined]);
  });

  it('reports the freshly read state when another tab changes the storage', async () => {
    const reports: string[][] = [];
    repository.watchByWishlist(birthday, (wishes) => reports.push(namesOf(wishes)));
    await new LocalStorageWishRepository(storage, new EventTarget()).save(wishNamed('Helm'));

    storageEvents.dispatchEvent(storageEventFor('wunschliste.wishlists'));
    storageEvents.dispatchEvent(storageEventFor(WISHES_KEY));

    expect(reports).toEqual([[], ['Helm']]);
  });

  it('does not overwrite what another instance saved in between', async () => {
    const otherTab = new LocalStorageWishRepository(storage, new EventTarget());

    await repository.save(wishNamed('Helm'));
    await otherTab.save(wishNamed('Buch'));
    await repository.save(wishNamed('Zelt'));

    expect(await otherTab.get(wishIdOf('Zelt'))).toBeDefined();
    expect(await repository.get(wishIdOf('Buch'))).toBeDefined();
  });

  it('skips records that break a rule and keeps the others', () => {
    const valid = { id: 'ok', wishlistId: 'birthday', name: 'Helm', gifted: false };
    storage.setItem(
      WISHES_KEY,
      JSON.stringify([
        valid,
        { ...valid, id: 'price', priceInCents: 0 },
        { ...valid, id: 'fraction', priceInCents: 1.5 },
        { ...valid, id: 'link', link: 'javascript:alert(1)' },
        { ...valid, id: 'rating', rating: 'sehr' },
        { ...valid, id: 'name', name: ' ' },
        { ...valid, id: 'gifted', gifted: 'ja' },
      ]),
    );
    const reports: string[][] = [];

    repository.watchByWishlist(birthday, (wishes) => reports.push(wishes.map(({ id }) => id)));

    expect(reports).toEqual([['ok']]);
  });
});
