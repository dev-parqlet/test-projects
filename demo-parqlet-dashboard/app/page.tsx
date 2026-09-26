"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultLandingFor } from "./lib/callback-url";
import { useAuth } from "./components/auth/auth-provider";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    // Super admins have a dedicated aggregate overview; HOA roles use the
    // building dashboard.
    router.push(defaultLandingFor(user.role));
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