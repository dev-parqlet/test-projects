/**
 * Root providers — wraps all context/TanStack providers.
 * "use client" is required because QueryProvider needs to be a client component.
 */
"use client";

import { QueryProvider } from "./QueryProvider";
import { AvatarProvider } from "../context/avatar-context";
import { AutoInviteProvider } from "../context/auto-invite-context";
import { BuildingFilterProvider } from "../context/building-filter-context";
import { ThemeProvider } from "../context/theme-context";
import { AuthProvider } from "../auth";
import { DemoGate } from "../demo/DemoGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // QueryProvider must wrap AuthProvider: AuthProvider now uses useQuery /
    // useQueryClient / useMutation and would throw "No QueryClient set" if
    // rendered outside the QueryClientProvider context.
    // DemoGate sits OUTSIDE the data providers on purpose: until the
    // visitor has picked HOA or Apartments there is no identity, so any
    // building-scoped query underneath would fire against the wrong
    // building and have to be thrown away a moment later.
    <ThemeProvider>
      <DemoGate>
      <QueryProvider>
        <AuthProvider>
          <BuildingFilterProvider>
            <AutoInviteProvider>
              <AvatarProvider>
                {children}
              </AvatarProvider>
            </AutoInviteProvider>
          </BuildingFilterProvider>
        </AuthProvider>
      </QueryProvider>
      </DemoGate>
    </ThemeProvider>
  );
}
