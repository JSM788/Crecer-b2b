import React, { createContext, useContext, useReducer } from "react";
import { createInitialState, demoReducer } from "@/modules/visits/domain/demo";
type DemoContextValue = {
  state: ReturnType<typeof createInitialState>;
  dispatch: React.Dispatch<Parameters<typeof demoReducer>[1]>;
};
const DemoContext = createContext<DemoContextValue | undefined>(undefined);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    createInitialState,
  );
  return (
    <DemoContext.Provider value={{ state, dispatch }}>
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo requires DemoProvider.");
  return context;
}
