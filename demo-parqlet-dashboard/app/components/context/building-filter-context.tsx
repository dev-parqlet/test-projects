/**
 * BuildingFilterContext — context for selected building filter.
 *
 * Phase 1.4 of the refactoring plan.
 */
"use client";

import { createSimpleContext } from "./createSimpleContext";

type BuildingFilterValue = {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  isAll: boolean;
};

const { Context, useContextHook } = createSimpleContext<BuildingFilterValue>({
  selectedIds: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSelectedIds: () => {},
  isAll: true,
});

export { Context as BuildingFilterContext };
export { useContextHook as useBuildingFilter };

// Provider: lives here so consumers don't need to import from two places
import { useState, ReactNode } from "react";

export function BuildingFilterProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <Context.Provider value={{ selectedIds, setSelectedIds, isAll: selectedIds.length === 0 }}>
      {children}
    </Context.Provider>
  );
}
