"use client";

import React from "react";

export default function CornerLines({ color = "#E7E4E0", ext = 20 }: { color?: string; ext?: number }) {
  const s = (style: React.CSSProperties): React.CSSProperties => ({
    position: "absolute", pointerEvents: "none", zIndex: 10, ...style,
  });
  // Gradient: transparent at tip → opaque → opaque → transparent at other tip
  const hGrad = `linear-gradient(to right, transparent 0px, ${color} ${ext}px, ${color} calc(100% - ${ext}px), transparent 100%)`;
  const vGrad = `linear-gradient(to bottom, transparent 0px, ${color} ${ext}px, ${color} calc(100% - ${ext}px), transparent 100%)`;
  return (
    <>
      {/* Top & bottom — extend horizontally beyond container at each end */}
      <span aria-hidden style={s({ top:    0, left: -ext, right: -ext, height: 1, background: hGrad })} />
      <span aria-hidden style={s({ bottom: 0, left: -ext, right: -ext, height: 1, background: hGrad })} />
      {/* Left & right — extend vertically beyond container at each end */}
      <span aria-hidden style={s({ left:  0, top: -ext, bottom: -ext, width: 1, background: vGrad })} />
      <span aria-hidden style={s({ right: 0, top: -ext, bottom: -ext, width: 1, background: vGrad })} />
    </>
  );
}
