import { describe, expect, it } from 'vitest';
import { parseWishDetails, type WishDetailsInput } from './WishDetails';

const emptyInput: WishDetailsInput = {
  name: '',
  brand: '',
  link: '',
  description: '',
  price: '',
  rating: undefined,
};

describe('parseWishDetails', () => {
  it('turns valid input into details', () => {
    const parsed = parseWishDetails({
      name: 'Fahrradhelm',
      brand: ' Uvex ',
      link: 'amazon.de/helm',
      description: 'Größe M',
      price: '49,99',
      rating: 'essential',
    });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.details.name.value).toBe('Fahrradhelm');
      expect(parsed.details.brand?.value).toBe('Uvex');
      expect(parsed.details.link?.href).toBe('https://amazon.de/helm');
      expect(parsed.details.description?.value).toBe('Größe M');
      expect(parsed.details.price?.cents).toBe(4999);
      expect(parsed.details.rating).toBe('essential');
    }
  });

  it('leaves out optional fields that are empty', () => {
    const parsed = parseWishDetails({ ...emptyInput, name: 'Buch' });

    expect(parsed.ok && parsed.details).toEqual(
      expect.objectContaining({
        brand: undefined,
        link: undefined,
        description: undefined,
        price: undefined,
        rating: undefined,
      }),
    );
  });

  it('reports every problem at once', () => {
    expect(parseWishDetails({ ...emptyInput, brand: 'a'.repeat(101), price: 'abc' })).toEqual({
      ok: false,
      problems: { name: 'missing', brand: 'tooLong', price: 'invalidFormat' },
    });
  });
});
