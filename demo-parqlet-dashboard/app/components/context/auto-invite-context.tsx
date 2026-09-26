/**
 * AutoInviteContext — thin wrapper using createSimpleContext factory.
 *
 * Phase 1.3 of the refactoring plan.
 */
"use client";

import { createSimpleContext } from "./createSimpleContext";

type AutoInviteValue = { autoInviteOn: boolean; setAutoInviteOn: (v: boolean) => void };

const { Context, useContextHook } = createSimpleContext<AutoInviteValue>({
  autoInviteOn: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAutoInviteOn: () => {},
});

export { Context as AutoInviteContext };
export { useContextHook as useAutoInvite };

// Provider: lives here so consumers don't need to import from two places
import { useState, ReactNode } from "react";

export function AutoInviteProvider({ children }: { children: ReactNode }) {
  const [autoInviteOn, setAutoInviteOn] = useState(false);
  return (
    <Context.Provider value={{ autoInviteOn, setAutoInviteOn }}>
      {children}
    </Context.Provider>
  );
}
