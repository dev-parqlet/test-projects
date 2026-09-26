/**
 * createSimpleContext — factory for simple React context providers.
 *
 * Reduces boilerplate for contexts that only need a value + setter.
 * Each call produces a unique context + hook pair. The Provider is
 * a thin wrapper that you define per-context using the factory's hook.
 *
 * Usage:
 *   const { Context, useContextHook } = createSimpleContext<MyValue>(defaultValue);
 *
 *   // In your context file:
 *   export function MyProvider({ children }: { children: ReactNode }) {
 *     const [value, setValue] = useState(defaultValue);
 *     return <Context.Provider value={value}>{children}</Context.Provider>;
 *   }
 *   export const useMyContext = useContextHook; // thin wrapper
 *
 * Phase 1.3 of the refactoring plan.
 */
"use client";

import { createContext, useContext } from "react";

export function createSimpleContext<T>(defaultValue: T) {
  const Context = createContext<T>(defaultValue);

  function useContextHook(): T {
    return useContext(Context);
  }

  return { Context, useContextHook };
}
