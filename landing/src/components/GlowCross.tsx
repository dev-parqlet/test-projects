"use client";

export default function GlowCross() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <defs>
        <linearGradient id="gcV" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#C7E51F" stopOpacity="0"/>
          <stop offset="50%"  stopColor="#C7E51F" stopOpacity="1"/>
          <stop offset="100%" stopColor="#C7E51F" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="gcH" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%"   stopColor="#C7E51F" stopOpacity="0"/>
          <stop offset="50%"  stopColor="#C7E51F" stopOpacity="1"/>
          <stop offset="100%" stopColor="#C7E51F" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id="gcG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#C7E51F" stopOpacity="0.30"/>
          <stop offset="55%"  stopColor="#C7E51F" stopOpacity="0.06"/>
          <stop offset="100%" stopColor="#C7E51F" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Soft ambient halo */}
      <circle cx="44" cy="44" r="44" fill="url(#gcG)"/>
      {/* Vertical arm */}
      <rect x="43" y="0" width="2" height="88" rx="1" fill="url(#gcV)"/>
      {/* Horizontal arm */}
      <rect x="0" y="43" width="88" height="2" rx="1" fill="url(#gcH)"/>
    </svg>
  );
}
