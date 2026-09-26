import { BuildingFilterProvider } from "./components/context/building-filter-context";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <BuildingFilterProvider>{children}</BuildingFilterProvider>;
}
