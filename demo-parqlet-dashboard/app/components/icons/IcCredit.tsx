interface IcCreditProps {
  color?: string;
}

export function IcCredit({ color = "var(--color-icon-strong)" }: IcCreditProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="7.25" stroke={color} strokeWidth="1.5" />
      <path
        d="M8.91309 6.42891C8.98419 6.57932 9.12554 6.68417 9.29004 6.70918L11.376 7.02657L9.84961 8.58223C9.73796 8.69597 9.68709 8.85659 9.71289 9.01387L10.0684 11.1818L8.24414 10.175C8.11284 10.1026 7.95683 10.0935 7.81934 10.1477L7.76172 10.175L5.93066 11.1809L6.28711 9.01387C6.31288 8.85663 6.26199 8.69595 6.15039 8.58223L4.62207 7.02559L6.70996 6.70918C6.87444 6.68415 7.01583 6.57932 7.08691 6.42891L8 4.49239L8.91309 6.42891Z"
        fill={color}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
