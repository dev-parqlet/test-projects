import React from "react";

export function IcImport({ color }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke={color ?? "var(--color-icon-strong)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke={color ?? "var(--color-icon-strong)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}