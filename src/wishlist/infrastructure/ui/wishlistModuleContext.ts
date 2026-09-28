import { createContext } from 'svelte';
import type { WishlistModule } from '../createWishlistModule';

export const [useWishlistModule, provideWishlistModule] = createContext<WishlistModule>();
