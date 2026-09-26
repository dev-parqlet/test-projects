"use client";

import React from "react";
import { IcClose } from "../icons/IcClose";

export type ModalSize = "small" | "large";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
}

const sizeWidths: Record<ModalSize, string> = {
  small: "480px",
  large: "600px",
};

export function Modal({
  open,
  onClose,
  title,
  size = "large",
  children,
  className = "",
  hideHeader = false,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
      className={className}
    >
      <div
        style={{
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-20)",
          border: "1px solid var(--color-stroke-medium)",
          width: "100%",
          maxWidth: sizeWidths[size],
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-family-body)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
        }}
      >
        {!hideHeader && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 28px 20px",
              borderBottom: "1px solid var(--color-stroke-medium)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-body)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text-strong)",
                lineHeight: "var(--line-height-body)",
              }}
            >
              {title}
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: "var(--color-icon-strong)",
              }}
            >
              <IcClose color="var(--color-icon-strong)" />
            </button>
          </div>
        )}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "24px 28px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
