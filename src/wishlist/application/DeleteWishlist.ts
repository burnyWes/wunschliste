import type { WishlistId } from '../domain/ids';
import type { WishlistRepository } from '../domain/WishlistRepository';
import type { WishRepository } from '../domain/WishRepository';

export class DeleteWishlist {
  constructor(
    private readonly wishlists: WishlistRepository,
    private readonly wishes: WishRepository,
  ) {}

  async execute(id: WishlistId): Promise<void> {
    await this.wishes.deleteAllOf(id);
    await this.wishlists.delete(id);
  }
}
