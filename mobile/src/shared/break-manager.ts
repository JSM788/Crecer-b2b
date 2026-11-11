export interface BreakState {
  onBreak: boolean;
  startedAt?: string;
  totalBreakMinutes?: number;
}

let currentBreak: BreakState = {
  onBreak: false,
};

const listeners = new Set<(state: BreakState) => void>();

export function getBreakState(): BreakState {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem("salinas_break_state");
      if (stored) {
        currentBreak = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }
  return currentBreak;
}

export function startBreak(): BreakState {
  const now = new Date().toISOString();
  currentBreak = {
    onBreak: true,
    startedAt: now,
  };
  saveBreakState(currentBreak);
  notify();
  return currentBreak;
}

export function endBreak(): BreakState {
  const endedAt = new Date();
  let minutes = 0;
  if (currentBreak.startedAt) {
    const diffMs = endedAt.getTime() - new Date(currentBreak.startedAt).getTime();
    minutes = Math.max(1, Math.round(diffMs / 60000));
  }
  currentBreak = {
    onBreak: false,
    startedAt: undefined,
    totalBreakMinutes: (currentBreak.totalBreakMinutes ?? 0) + minutes,
  };
  saveBreakState(currentBreak);
  notify();
  return currentBreak;
}

export function resetBreak(): void {
  currentBreak = { onBreak: false };
  saveBreakState(currentBreak);
  notify();
}

function saveBreakState(state: BreakState) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("salinas_break_state", JSON.stringify(state));
    } catch {
      // Ignore
    }
  }
}

function notify() {
  listeners.forEach((listener) => listener(currentBreak));
}

export function subscribeBreak(listener: (state: BreakState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
