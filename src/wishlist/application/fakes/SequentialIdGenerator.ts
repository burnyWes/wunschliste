import type { IdGenerator } from '../../domain/ids';

export class SequentialIdGenerator implements IdGenerator {
  #issuedIds = 0;

  next(): string {
    this.#issuedIds += 1;
    return `id-${this.#issuedIds}`;
  }
}
