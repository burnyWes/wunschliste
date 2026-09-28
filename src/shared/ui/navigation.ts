export function navigateTo(hash: string): void {
  if (location.hash !== hash) {
    location.replace(hash);
  }
}
