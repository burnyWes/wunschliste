import type { WishId } from '../domain/ids';
import { WishNotFound } from '../domain/Wish';
import type { WishDetails } from '../domain/WishDetails';
import type { WishRepository } from '../domain/WishRepository';

export class EditWish {
  constructor(private readonly wishes: WishRepository) {}

  async execute(id: WishId, details: WishDetails): Promise<void> {
    const wish = await this.wishes.get(id);
    if (wish === undefined) {
      throw new WishNotFound(id);
    }
    await this.wishes.save(wish.edit(details));
  }
}
