import type { WishId } from '../domain/ids';
import { WishNotFound } from '../domain/Wish';
import type { WishRepository } from '../domain/WishRepository';

export class TakeBackGift {
  constructor(private readonly wishes: WishRepository) {}

  async execute(id: WishId): Promise<void> {
    const wish = await this.wishes.get(id);
    if (wish === undefined) {
      throw new WishNotFound(id);
    }
    await this.wishes.save(wish.takeBackGift());
  }
}
