import { createContext } from 'svelte';
import type { FamilyAccess } from './familyAccess.svelte';

export const [useFamilyAccess, provideFamilyAccess] = createContext<FamilyAccess>();
