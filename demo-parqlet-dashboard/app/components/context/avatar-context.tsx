/**
 * AvatarContext — thin wrapper using createSimpleContext factory.
 *
 * Phase 1.3 of the refactoring plan.
 */
"use client";

import { createSimpleContext } from "./createSimpleContext";

type AvatarValue = { avatarUrl: string | null; setAvatarUrl: (v: string | null) => void };

const { Context, useContextHook } = createSimpleContext<AvatarValue>({
  avatarUrl: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAvatarUrl: () => {},
});

export { Context as AvatarContext };
export { useContextHook as useAvatar };

// Provider: lives here so consumers don't need to import from two places
import { useState, ReactNode } from "react";

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  return (
    <Context.Provider value={{ avatarUrl, setAvatarUrl }}>
      {children}
    </Context.Provider>
  );
}
