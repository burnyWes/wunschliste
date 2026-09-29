export class Connectivity {
  isOnline = $state(navigator.onLine);

  follow(): () => void {
    const update = () => {
      this.isOnline = navigator.onLine;
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }
}
