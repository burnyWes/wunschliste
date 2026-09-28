import type { WishId } from '../domain/ids';
import type { WishRepository } from '../domain/WishRepository';

export class DeleteWish {
  constructor(private readonly wishes: WishRepository) {}

  async execute(id: WishId): Promise<void> {
    await this.wishes.delete(id);
  }
}
