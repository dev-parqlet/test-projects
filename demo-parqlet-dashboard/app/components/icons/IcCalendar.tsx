interface IcCalendarProps {
  color?: string;
}

export function IcCalendar({ color = "var(--color-text-weak)" }: IcCalendarProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M3 9h18" stroke={color} strokeWidth="1.5" />
      <path d="M8 2v4M16 2v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
