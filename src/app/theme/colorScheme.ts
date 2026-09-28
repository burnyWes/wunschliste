export type ColorScheme = 'dark' | 'light' | 'inverted';

export const DEFAULT_COLOR_SCHEME: ColorScheme = 'dark';

export const COLOR_SCHEMES: readonly { value: ColorScheme; label: string }[] = [
  { value: 'dark', label: 'Dunkel' },
  { value: 'light', label: 'Hell' },
  { value: 'inverted', label: 'Invertiert' },
];

export function parseColorScheme(stored: string | null): ColorScheme {
  const knownScheme = COLOR_SCHEMES.find(({ value }) => value === stored);
  return knownScheme?.value ?? DEFAULT_COLOR_SCHEME;
}
