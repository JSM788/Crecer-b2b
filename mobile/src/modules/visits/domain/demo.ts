import { demoProfile, visitSeeds } from "../../../data/fixtures";

export type VisitResult = "attended" | "closed" | "unavailable";
export interface Visit {
  id: string;
  customerId: string;
  scheduledAt: string;
  status: "pending" | "active" | "completed";
  arrivedAt?: string;
  endedAt?: string;
  result?: VisitResult;
  observations?: string;
  photoAttached: boolean;
}
export interface DemoState {
  authenticated: boolean;
  workday: {
    status: "not-started" | "active" | "completed";
    startedAt?: string;
    endedAt?: string;
  };
  visits: Visit[];
  error?: string;
}
export type DemoAction =
  | { type: "LOGIN"; email: string; password: string }
  | { type: "LOGOUT" }
  | { type: "START_WORKDAY"; at: string }
  | { type: "ARRIVE"; visitId: string; at: string }
  | {
      type: "FINISH_VISIT";
      visitId: string;
      at: string;
      result?: VisitResult;
      observations: string;
      photoAttached: boolean;
    }
  | { type: "END_WORKDAY"; at: string }
  | { type: "RESET" }
  | { type: "CLEAR_ERROR" };

export function createInitialState(): DemoState {
  return {
    authenticated: false,
    workday: { status: "not-started" },
    visits: visitSeeds.map((visit) => ({
      ...visit,
      status: "pending",
      photoAttached: false,
    })),
  };
}

const reject = (state: DemoState, error: string): DemoState => ({
  ...state,
  error,
});

/** Pure demo transitions; device checks and production authorization require future adapters. */
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "RESET") return createInitialState();
  if (action.type === "CLEAR_ERROR") return { ...state, error: undefined };
  if (action.type === "LOGOUT")
    return { ...state, authenticated: false, error: undefined };
  if (action.type === "LOGIN") {
    if (
      action.email.trim().toLowerCase() !== demoProfile.email ||
      action.password !== demoProfile.password
    )
      return reject(state, "invalid_credentials");
    return { ...state, authenticated: true, error: undefined };
  }
  if (!state.authenticated) return reject(state, "authentication_required");
  if (action.type === "START_WORKDAY") {
    if (state.workday.status !== "not-started")
      return reject(state, "workday_already_started");
    return {
      ...state,
      workday: { status: "active", startedAt: action.at },
      error: undefined,
    };
  }
  if (state.workday.status !== "active")
    return reject(state, "active_workday_required");
  if (action.type === "END_WORKDAY") {
    if (state.visits.some((visit) => visit.status !== "completed"))
      return reject(state, "visits_remaining");
    return {
      ...state,
      workday: { ...state.workday, status: "completed", endedAt: action.at },
      error: undefined,
    };
  }
  const visit = state.visits.find((entry) => entry.id === action.visitId);
  if (!visit) return reject(state, "visit_not_found");
  if (action.type === "ARRIVE") {
    if (visit.status !== "pending") return reject(state, "visit_not_pending");
    if (state.visits.some((entry) => entry.status === "active"))
      return reject(state, "another_visit_active");
    return {
      ...state,
      visits: state.visits.map((entry) =>
        entry.id === visit.id
          ? { ...entry, status: "active", arrivedAt: action.at }
          : entry,
      ),
      error: undefined,
    };
  }
  if (visit.status !== "active") return reject(state, "active_visit_required");
  if (
    !action.result ||
    !["attended", "closed", "unavailable"].includes(action.result)
  )
    return reject(state, "visit_result_required");
  return {
    ...state,
    visits: state.visits.map((entry) =>
      entry.id === visit.id
        ? {
            ...entry,
            status: "completed",
            endedAt: action.at,
            result: action.result,
            observations: action.observations.trim(),
            photoAttached: action.photoAttached,
          }
        : entry,
    ),
    error: undefined,
  };
}
