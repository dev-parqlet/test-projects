interface IcArrowUpProps {
  color?: string;
}

export function IcArrowUp({ color = "var(--color-text-strong)" }: IcArrowUpProps) {
  return (
    <svg width="9" height="13" viewBox="0 0 9 13" fill="none">
      <path d="M4.5 12V1M1 4.5L4.5 1 8 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}