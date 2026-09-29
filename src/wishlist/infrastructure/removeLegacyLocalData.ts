const LEGACY_KEYS = ['wunschliste.wishlists', 'wunschliste.wishes'];

export function removeLegacyLocalData(storage: Pick<Storage, 'removeItem'>): void {
  for (const key of LEGACY_KEYS) {
    storage.removeItem(key);
  }
}
