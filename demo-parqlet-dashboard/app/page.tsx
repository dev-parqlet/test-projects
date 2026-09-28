"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./components/auth/auth-provider";
import { pathForVariant, readVariant } from "./lib/demo/variants";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    // Straight to the product's own URL. `/` only ever exists to forward:
    // every real page in the demo lives under /condo or /apartment.
    router.push(pathForVariant(readVariant()));
  }, [user, loading, router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-family-body, sans-serif)",
      color: "var(--color-text-weak, #666)",
    }}>
      Loading…
    </div>
  );
}