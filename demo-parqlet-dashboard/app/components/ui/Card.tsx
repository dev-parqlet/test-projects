"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  style,
  onClick,
}: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: "var(--color-fill-white)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-12)",
        padding: 24,
        fontFamily: "var(--font-family-body)",
        cursor: onClick ? "pointer" : undefined,
        transition: "box-shadow 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </div>
  );
}
