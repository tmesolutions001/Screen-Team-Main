import { useSyncExternalStore } from 'react';

/** User preferences, persisted to localStorage and shared across components. */
export interface Settings {
  /** Play the correct/wrong answer sounds. */
  sfx: boolean;
}

const STORAGE_KEY = 'screen-team:settings';
const defaults: Settings = { sfx: true };

const load = (): Settings => {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return defaults;
  }
};

let current = load();
const listeners = new Set<() => void>();

export const getSettings = () => current;

export const updateSettings = (patch: Partial<Settings>) => {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage unavailable (private mode): the setting still applies for this session.
  }
  listeners.forEach((notify) => notify());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSettings = () => useSyncExternalStore(subscribe, getSettings);
