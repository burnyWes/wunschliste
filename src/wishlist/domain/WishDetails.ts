import { Description, type DescriptionProblem } from './Description';
import { Name, type NameProblem } from './Name';
import { Price, type PriceProblem } from './Price';
import type { Rating } from './Rating';
import { WishLink, type WishLinkProblem } from './WishLink';

export type WishDetails = {
  name: Name;
  link?: WishLink;
  description?: Description;
  price?: Price;
  rating?: Rating;
};

export type WishDetailsInput = {
  name: string;
  link: string;
  description: string;
  price: string;
  rating: Rating | undefined;
};

export type WishDetailsProblems = {
  name?: NameProblem;
  link?: WishLinkProblem;
  description?: DescriptionProblem;
  price?: PriceProblem;
};

export type ParsedWishDetails =
  { ok: true; details: WishDetails } | { ok: false; problems: WishDetailsProblems };

export function parseWishDetails(input: WishDetailsInput): ParsedWishDetails {
  const name = Name.parse(input.name);
  const link = WishLink.parse(input.link);
  const description = Description.parse(input.description);
  const price = Price.parse(input.price);
  if (name.ok && link.ok && description.ok && price.ok) {
    return {
      ok: true,
      details: {
        name: name.value,
        link: link.value,
        description: description.value,
        price: price.value,
        rating: input.rating,
      },
    };
  }
  return {
    ok: false,
    problems: {
      ...(!name.ok && { name: name.problem }),
      ...(!link.ok && { link: link.problem }),
      ...(!description.ok && { description: description.problem }),
      ...(!price.ok && { price: price.problem }),
    },
  };
}
