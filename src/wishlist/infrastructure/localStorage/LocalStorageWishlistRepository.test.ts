import { beforeEach, describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { requireValid } from '../../domain/parsed';
import { Wishlist } from '../../domain/Wishlist';
import { LocalStorageWishlistRepository, WISHLISTS_KEY } from './LocalStorageWishlistRepository';
import { MapStorage, storageEventFor } from './testStorage';

function wishlistNamed(name: string, id = name): Wishlist {
  return Wishlist.create(wishlistIdOf(id), requireValid(Name.parse(name)));
}

function namesOf(wishlists: readonly Wishlist[]): string[] {
  return wishlists.map((wishlist) => wishlist.name.value);
}

describe('LocalStorageWishlistRepository', () => {
  let storage: MapStorage;
  let storageEvents: EventTarget;
  let repository: LocalStorageWishlistRepository;

  beforeEach(() => {
    storage = new MapStorage();
    storageEvents = new EventTarget();
    repository = new LocalStorageWishlistRepository(storage, storageEvents);
  });

  it('keeps a saved wishlist readable for another instance on the same storage', async () => {
    await repository.save(wishlistNamed('Geburtstag', 'b'));

    const otherInstance = new LocalStorageWishlistRepository(storage, new EventTarget());

    expect((await otherInstance.get(wishlistIdOf('b')))?.name.value).toBe('Geburtstag');
  });

  it('reports all wishlists at once and after each save and delete', async () => {
    const reports: string[][] = [];
    repository.watchAll((wishlists) => reports.push(namesOf(wishlists)));

    await repository.save(wishlistNamed('Geburtstag'));
    await repository.delete(wishlistIdOf('Geburtstag'));

    expect(reports).toEqual([[], ['Geburtstag'], []]);
  });

  it('reports a single wishlist and its removal', async () => {
    await repository.save(wishlistNamed('Geburtstag'));
    const reports: (string | undefined)[] = [];
    repository.watch(wishlistIdOf('Geburtstag'), (wishlist) => reports.push(wishlist?.name.value));

    await repository.delete(wishlistIdOf('Geburtstag'));

    expect(reports).toEqual(['Geburtstag', undefined]);
  });

  it('reports the freshly read state when another tab changes the storage', async () => {
    const reports: string[][] = [];
    repository.watchAll((wishlists) => reports.push(namesOf(wishlists)));
    const otherTab = new LocalStorageWishlistRepository(storage, new EventTarget());
    await otherTab.save(wishlistNamed('Weihnachten'));

    storageEvents.dispatchEvent(storageEventFor(WISHLISTS_KEY));
    storageEvents.dispatchEvent(storageEventFor(null));

    expect(reports).toEqual([[], ['Weihnachten'], ['Weihnachten']]);
  });

  it('ignores storage events for other keys', () => {
    const reports: string[][] = [];
    repository.watchAll((wishlists) => reports.push(namesOf(wishlists)));

    storageEvents.dispatchEvent(storageEventFor('wunschliste.colorScheme'));

    expect(reports).toHaveLength(1);
  });

  it('stops reporting after unsubscribing', async () => {
    const reports: string[][] = [];
    const unsubscribe = repository.watchAll((wishlists) => reports.push(namesOf(wishlists)));

    unsubscribe();
    await repository.save(wishlistNamed('Geburtstag'));
    storageEvents.dispatchEvent(storageEventFor(WISHLISTS_KEY));

    expect(reports).toHaveLength(1);
  });

  it('does not overwrite what another instance saved in between', async () => {
    const otherTab = new LocalStorageWishlistRepository(storage, new EventTarget());

    await repository.save(wishlistNamed('Geburtstag'));
    await otherTab.save(wishlistNamed('Weihnachten'));
    await repository.save(wishlistNamed('Ostern'));

    expect((await repository.get(wishlistIdOf('Weihnachten')))?.name.value).toBe('Weihnachten');
    expect((await otherTab.get(wishlistIdOf('Ostern')))?.name.value).toBe('Ostern');
  });

  it('reads invalid JSON as an empty collection', async () => {
    storage.setItem(WISHLISTS_KEY, '{kaputt');

    expect(await repository.get(wishlistIdOf('Geburtstag'))).toBeUndefined();
  });

  it('skips an entry with an empty name and keeps the others', () => {
    storage.setItem(
      WISHLISTS_KEY,
      JSON.stringify([{ id: 'a', name: '' }, { id: 'b', name: 'Geburtstag' }, { id: 'c' }]),
    );
    const reports: string[][] = [];

    repository.watchAll((wishlists) => reports.push(namesOf(wishlists)));

    expect(reports).toEqual([['Geburtstag']]);
  });
});
