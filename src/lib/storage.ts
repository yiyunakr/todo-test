import type { TaskState } from '../types/block';

const STORAGE_KEY = 'blockflow_v1';

export function loadState(): TaskState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TaskState;
  } catch {
    return null;
  }
}

export function saveState(state: TaskState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createDebouncedSaver(delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (state: { blocks: TaskState['blocks']; rootOrder: TaskState['rootOrder'] }) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveState({ blocks: state.blocks, rootOrder: state.rootOrder });
    }, delayMs);
  };
}
