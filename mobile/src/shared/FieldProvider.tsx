import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import * as Network from "expo-network";
import { randomUUID } from "expo-crypto";
import {
  guard,
  type Attachment,
  type Command,
  type Snapshot,
} from "../modules/visits/domain/field";
import { FieldApi, FieldError, type Invitation } from "./api";
import { setTimeZone } from "./format";

type State = {
  authenticated: boolean;
  loading: boolean;
  refreshing: boolean;
  ready: boolean;
  uncertain?: boolean;
  error?: string;
  loginEmail?: string;
  session?: Snapshot["session"];
  workday: Snapshot["workday"];
  visits: Snapshot["visits"];
  customers: Snapshot["customers"];
  agendaPage?: Snapshot["agendaPage"];
};
type Action =
  | Command
  | { type: "LOGIN"; email: string; password: string }
  | { type: "LOGOUT" };
type Context = {
  state: State;
  dispatch: (action: Action) => Promise<boolean>;
  retry: () => void;
  refresh: (reason?: "focus" | "event") => Promise<boolean>;
  loadMore: () => Promise<void>;
  evidence: (id: string) => Promise<Attachment | null>;
  invitation: (token: string) => Promise<Invitation>;
  acceptInvitation: (token: string, password: string) => Promise<void>;
};
const FieldContext = createContext<Context | undefined>(undefined);
const initial: State = {
  authenticated: false,
  loading: true,
  refreshing: false,
  ready: false,
  workday: { status: "not-started" },
  visits: [],
  customers: [],
};
export function FieldProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const api = useRef<FieldApi | undefined>(undefined);
  const snapshot = useRef<Snapshot | undefined>(undefined);
  const busy = useRef(false);
  const generation = useRef(0);
  const refreshFlight = useRef<Promise<boolean> | undefined>(undefined);
  const authenticated = useRef(false);
  const lastSuccess = useRef(0);
  authenticated.current = state.authenticated;
  const lastCommand = useRef<Command | undefined>(undefined);
  const client = useCallback(() =>
    (api.current ??= new FieldApi({
      web: Platform.OS === "web",
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      development: __DEV__,
      randomKey: randomUUID,
    })), []);
  const reset = useCallback(() => {
    generation.current++;
    refreshFlight.current = undefined;
    snapshot.current = undefined;
    lastCommand.current = undefined;
    authenticated.current = false;
    lastSuccess.current = 0;
    setState({...initial, loading: false});
  }, []);
  const fail = useCallback((error: unknown) => {
    if (error instanceof FieldError && error.code === "request_superseded") return;
    const code = error instanceof Error ? error.message : "request_failed";
    if (error instanceof FieldError && error.status === 401) reset();
    setState((s) =>
      error instanceof FieldError && error.status === 401
        ? { ...s, loading: false, refreshing: false, error: code }
        : {
            ...s,
            uncertain: api.current?.hasPending,
            loading: false,
            refreshing: false,
            error: code,
          },
    );
  }, [reset]);
  const refresh = useCallback((reason?: "focus" | "event"): Promise<boolean> => {
    if (refreshFlight.current) return refreshFlight.current;
    // Coalesce lifecycle bursts without scheduling periodic requests.
    if (reason && snapshot.current && Date.now() - lastSuccess.current < 1000) return Promise.resolve(true);
    if (busy.current && reason) return Promise.resolve(false);
    const epoch = generation.current;
    setState(s => ({...s, loading: !s.ready, refreshing: s.ready, error: undefined}));
    const flight = Promise.resolve().then(async () => {
      try {
        const current = await client().load();
        if (epoch !== generation.current) return false;
        snapshot.current = current;
        lastSuccess.current = Date.now();
        setTimeZone(current.session.timeZone);
        authenticated.current = true;
        setState(s => ({...s, ...current, authenticated: true, uncertain: client().hasPending, ready: true, loading: false, refreshing: false, error: undefined}));
        return true;
      } catch (error) {
        if (epoch === generation.current) fail(error);
        return false;
      } finally {
        if (epoch === generation.current) refreshFlight.current = undefined;
      }
    });
    refreshFlight.current = flight;
    return flight;
  }, [client, fail]);
  useEffect(() => {
    if (Platform.OS === "web") void refresh();
    else setState({...initial, loading: false});
  }, [refresh]);
  useEffect(() => {
    let previous = AppState.currentState;
    let connected: boolean | undefined;
    const foreground = AppState.addEventListener("change", next => {
      if (next === "active" && previous !== "active" && authenticated.current) void refresh("event");
      previous = next;
    });
    const network = Network.addNetworkStateListener(next => {
      const online = next.isConnected === true && next.isInternetReachable !== false;
      if (online && connected === false && authenticated.current && AppState.currentState === "active") void refresh("event");
      connected = online;
    });
    return () => {foreground.remove(); network.remove();};
  }, [refresh]);
  const dispatch = async (action: Action) => {
    if (busy.current) return false;
    busy.current = true;
    generation.current++;
    refreshFlight.current = undefined;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      if (action.type === "LOGIN") {
        reset();
        setState(s => ({...s, loading: true}));
        await client().login(action.email, action.password);
      } else if (action.type === "LOGOUT") {
        reset();
        await client().logout();
        return true;
      } else {
        if (!client().hasPending) {
          guard(snapshot.current, action);
          lastCommand.current = action;
        }
        await client().command(action);
        lastCommand.current = undefined;
      }
      return await refresh();
    } catch (error) {
      fail(error);
      return false;
    } finally {
      busy.current = false;
    }
  };
  return (
    <FieldContext.Provider
      value={{
        state,
        dispatch,
        refresh,
        loadMore: async () => {
          if (busy.current || refreshFlight.current) return;
          const epoch = generation.current;
          setState(s => ({...s, refreshing: true}));
          try {
            const current = await client().loadMore();
            if (epoch !== generation.current) return;
            snapshot.current = current;
            setState(s => ({...s, ...current, refreshing: false}));
          } catch (error) {if (epoch === generation.current) fail(error);}
        },
        retry: () => {
          if (lastCommand.current && client().hasPending) void dispatch(lastCommand.current);
        },
        evidence: async (id) => {
          try {
            return await client().evidence(id);
          } catch (error) {
            if (error instanceof FieldError && error.status === 401)
              fail(error);
            throw error;
          }
        },
        invitation: token => client().invitation(token),
        acceptInvitation: async (token, password) => {
          if (busy.current) throw new FieldError("request_in_progress");
          busy.current = true;
          try {
            const accepted = await client().acceptInvitation(token, password);
            reset();
            setState(s => ({...s, loginEmail: accepted.email}));
          } finally {busy.current = false;}
        },
      }}
    >
      {children}
    </FieldContext.Provider>
  );
}
export function useField() {
  const context = useContext(FieldContext);
  if (!context) throw new Error("useField requires FieldProvider");
  return context;
}
