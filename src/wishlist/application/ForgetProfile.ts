import type { ProfileStore } from '../domain/ProfileStore';

export class ForgetProfile {
  constructor(private readonly profileStore: ProfileStore) {}

  execute(): void {
    this.profileStore.forget();
  }
}
