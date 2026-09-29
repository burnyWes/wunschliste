import type { WishId } from '../domain/ids';
import type { Unsubscribe } from '../domain/Unsubscribe';
import type { Wish } from '../domain/Wish';
import type { WishRepository } from '../domain/WishRepository';

export class WatchWish {
  constructor(private readonly wishes: WishRepository) {}

  execute(
    id: WishId,
    onChange: (wish: Wish | undefined) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return this.wishes.watch(id, onChange, onFailure);
  }
}
