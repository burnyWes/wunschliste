import { describe, expect, it } from 'vitest';
import { requireValid } from '../../domain/parsed';
import { parseWishDetails } from '../../domain/WishDetails';
import { Price } from '../../domain/Price';
import {
  BRAND_PREFIX,
  BRAND_PROBLEM_MESSAGES,
  DESCRIPTION_PROBLEM_MESSAGES,
  SAVED_ANNOUNCEMENT,
  WISH_CREATED_ANNOUNCEMENT,
  WISH_ACTION_ANNOUNCEMENTS,
  WISH_ACTION_LABELS,
  WISHLIST_CREATED_ANNOUNCEMENT,
  formatPrice,
  fulfilledNote,
  FINAL_DELETION_LABEL,
  giverNote,
  removedByOwnerNote,
  wishlistRemovedByOwnerMessage,
  wishRemovedByOwnerMessage,
  secretHint,
  secretNote,
  surpriseLine,
  LINK_PROBLEM_MESSAGES,
  NAME_FORM_PROBLEM_MESSAGES,
  NAME_PROBLEM_MESSAGES,
  PRICE_PROBLEM_MESSAGES,
  ratingLabel,
  ratingStars,
  wishDeletedAnnouncement,
  wishDeletionMessage,
  wishDetailsInputOf,
  wishlistDeletedAnnouncement,
  wishlistDeletionMessage,
} from './wishTexts';

describe('formatPrice', () => {
  it('shows euros with a comma and a non-breaking space before the sign', () => {
    expect(formatPrice(requireValid(Price.ofCents(4999)))).toBe('49,99 €');
  });

  it('groups thousands', () => {
    expect(formatPrice(requireValid(Price.ofCents(9999999)))).toBe('99.999,99 €');
  });
});

describe('ratings', () => {
  it.each([
    ['essential', 'unbedingt', '★★★'],
    ['wanted', 'gern', '★★'],
    ['nice', 'nett', '★'],
  ] as const)('names %s as %s with %s', (rating, label, stars) => {
    expect(ratingLabel(rating)).toBe(label);
    expect(ratingStars(rating)).toBe(stars);
  });
});

describe('problem messages', () => {
  it('explains every problem of the form', () => {
    expect(NAME_PROBLEM_MESSAGES).toEqual({
      missing: 'Bitte einen Namen eingeben.',
      tooLong: 'Der Name darf höchstens 100 Zeichen lang sein.',
    });
    expect(NAME_FORM_PROBLEM_MESSAGES).toEqual({
      ...NAME_PROBLEM_MESSAGES,
      taken: 'Diesen Namen gibt es schon.',
    });
    expect(BRAND_PROBLEM_MESSAGES).toEqual({
      tooLong: 'Die Marke darf höchstens 100 Zeichen lang sein.',
    });
    expect(LINK_PROBLEM_MESSAGES).toEqual({ invalid: 'Das ist keine gültige Webadresse.' });
    expect(DESCRIPTION_PROBLEM_MESSAGES).toEqual({
      tooLong: 'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
    });
    expect(PRICE_PROBLEM_MESSAGES).toEqual({
      invalidFormat: 'Bitte einen Betrag wie 49,99 eingeben.',
      notPositive: 'Der Preis muss größer als 0 sein.',
      tooHigh: 'Der Preis darf höchstens 99.999,99 € betragen.',
    });
  });
});

describe('deletion messages', () => {
  it.each([
    [0, '„Geburtstag“ wird gelöscht.'],
    [1, '„Geburtstag“ mit 1 Wunsch wird gelöscht.'],
    [5, '„Geburtstag“ mit 5 Wünschen wird gelöscht.'],
  ])('names a wishlist with %i wishes', (wishCount, message) => {
    expect(wishlistDeletionMessage('Geburtstag', wishCount)).toBe(message);
  });

  it('names the wish', () => {
    expect(wishDeletionMessage('Fahrradhelm')).toBe('„Fahrradhelm“ wird gelöscht.');
  });
});

describe('announcements', () => {
  it('reports each finished action', () => {
    expect(WISHLIST_CREATED_ANNOUNCEMENT).toBe('Wunschliste erstellt.');
    expect(WISH_CREATED_ANNOUNCEMENT).toBe('Wunsch erstellt.');
    expect(SAVED_ANNOUNCEMENT).toBe('Gespeichert.');
  });

  it('reports each change of the wish state', () => {
    expect(WISH_ACTION_ANNOUNCEMENTS).toEqual({
      gift: 'Als geschenkt markiert.',
      takeBackGift: 'Schenken zurückgenommen.',
      receive: 'Als erhalten markiert.',
      undoReceive: 'Wieder offen.',
      handOver: 'Übergabe vermerkt.',
      undoHandOver: 'Übergabe zurückgenommen.',
    });
  });

  it('names the deleted wishlist', () => {
    expect(wishlistDeletedAnnouncement('Geburtstag')).toBe('Wunschliste „Geburtstag“ gelöscht.');
  });

  it('names the deleted wish', () => {
    expect(wishDeletedAnnouncement('Fahrradhelm')).toBe('Wunsch „Fahrradhelm“ gelöscht.');
  });
});

describe('wish state', () => {
  it('names the button of each change', () => {
    expect(WISH_ACTION_LABELS).toEqual({
      gift: 'Schenken',
      takeBackGift: 'Schenken zurücknehmen',
      receive: 'Erhalten',
      undoReceive: 'Erhalten zurücknehmen',
      handOver: 'Übergeben',
      undoHandOver: 'Übergabe zurücknehmen',
    });
  });

  it('names the giver of a fulfilled wish', () => {
    expect(fulfilledNote('Ben')).toBe('Erfüllt – von Ben');
    expect(giverNote('Ben')).toBe('geschenkt von Ben');
  });

  it('leaves out an unknown giver', () => {
    expect(fulfilledNote(undefined)).toBe('Erfüllt');
  });

  it('names the creator of a secret wish', () => {
    expect(secretNote('Ben')).toBe('Geheim – von Ben');
    expect(secretNote(undefined)).toBe('Geheim');
  });

  it('explains what the owner sees of a secret wish', () => {
    expect(secretHint('Anna')).toBe('Anna sieht nur „Überraschung“.');
  });

  it.each([
    [1, '1 Überraschung'],
    [2, '2 Überraschungen'],
  ])('counts %i surprises', (count, line) => {
    expect(surpriseLine(count)).toBe(line);
  });
});

describe('removal by the owner', () => {
  it('names the owner who removed something', () => {
    expect(wishRemovedByOwnerMessage('Anna')).toBe('Anna hat diesen Wunsch entfernt.');
    expect(wishlistRemovedByOwnerMessage('Anna')).toBe('Anna hat diese Wunschliste entfernt.');
    expect(removedByOwnerNote('Anna')).toBe('von Anna entfernt');
  });

  it('speaks of the owner when her name is unknown', () => {
    expect(wishRemovedByOwnerMessage(undefined)).toBe('Die Besitzerin hat diesen Wunsch entfernt.');
    expect(wishlistRemovedByOwnerMessage(undefined)).toBe(
      'Die Besitzerin hat diese Wunschliste entfernt.',
    );
    expect(removedByOwnerNote(undefined)).toBe('von der Besitzerin entfernt');
  });

  it('names the final deletion', () => {
    expect(FINAL_DELETION_LABEL).toBe('Endgültig löschen');
  });
});

describe('wishDetailsInputOf', () => {
  it.each([
    {
      name: 'Fahrradhelm',
      brand: 'Uvex',
      link: 'https://amazon.de/helm',
      description: 'Größe M',
      price: '49,99',
      rating: 'essential' as const,
    },
    { name: 'Buch', brand: '', link: '', description: '', price: '12,00', rating: undefined },
  ])('fills the form so that saving it unchanged keeps $name', (input) => {
    const parsed = parseWishDetails(input);
    if (!parsed.ok) {
      throw new Error('Invalid test input');
    }

    expect(wishDetailsInputOf(parsed.details)).toEqual(input);
  });
});

describe('brand', () => {
  it('names the brand for screen readers', () => {
    expect(BRAND_PREFIX).toBe('Marke: ');
  });
});
