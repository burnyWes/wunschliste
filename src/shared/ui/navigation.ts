export type HistoryEntryState = { entry: 'start' } | { entry: 'inApp'; cameFrom: string };

export type BackTarget = 'back' | 'fallback';

let stateOfReplacedEntry: HistoryEntryState | undefined;

function isHistoryEntryState(candidate: unknown): candidate is HistoryEntryState {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    'entry' in candidate &&
    (candidate.entry === 'start' ||
      (candidate.entry === 'inApp' &&
        'cameFrom' in candidate &&
        typeof candidate.cameFrom === 'string'))
  );
}

export function backTargetFor(historyState: unknown, parentPageKey: string): BackTarget {
  const cameFromParent =
    isHistoryEntryState(historyState) &&
    historyState.entry === 'inApp' &&
    historyState.cameFrom === parentPageKey;
  return cameFromParent ? 'back' : 'fallback';
}

export function isHistoryEntryMarked(): boolean {
  return history.state !== null;
}

export function markStartEntry(): void {
  history.replaceState({ entry: 'start' } satisfies HistoryEntryState, '');
}

export function markNewEntry(previousPageKey: string): void {
  const state = stateOfReplacedEntry ?? { entry: 'inApp', cameFrom: previousPageKey };
  stateOfReplacedEntry = undefined;
  history.replaceState(state satisfies HistoryEntryState, '');
}

export function replaceWith(hash: string): void {
  if (location.hash === hash) {
    return;
  }
  stateOfReplacedEntry = isHistoryEntryState(history.state) ? history.state : undefined;
  location.replace(hash);
}

export function goBack(parentPageKey: string): void {
  if (backTargetFor(history.state, parentPageKey) === 'back') {
    history.back();
  } else {
    replaceWith(parentPageKey);
  }
}
