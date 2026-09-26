'use client';

export function IcResidentDirectory({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <g transform="translate(2.25, 3.25)">
        <path
          d="M9.75 4.30556C9.75 3.36256 9.37072 2.45819 8.69558 1.7914C8.02045 1.1246 7.10478 0.75 6.15 0.75H0.75V14.0833H7.05C7.76608 14.0833 8.45284 14.3643 8.95919 14.8644C9.46554 15.3645 9.75 16.0428 9.75 16.75M9.75 4.30556V16.75M9.75 4.30556C9.75 3.36256 10.1293 2.45819 10.8044 1.7914C11.4795 1.1246 12.3952 0.75 13.35 0.75H18.75V14.0833H12.45C11.7339 14.0833 11.0472 14.3643 10.5408 14.8644C10.0345 15.3645 9.75 16.0428 9.75 16.75"
          stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}