"use client";

export function IcOverview({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9.5 4.5H5.33333C4.8731 4.5 4.5 4.8731 4.5 5.33333V11.1667C4.5 11.6269 4.8731 12 5.33333 12H9.5C9.96024 12 10.3333 11.6269 10.3333 11.1667V5.33333C10.3333 4.8731 9.96024 4.5 9.5 4.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.6667 4.5H14.5001C14.0398 4.5 13.6667 4.8731 13.6667 5.33333V7.83333C13.6667 8.29357 14.0398 8.66667 14.5001 8.66667H18.6667C19.127 8.66667 19.5001 8.29357 19.5001 7.83333V5.33333C19.5001 4.8731 19.127 4.5 18.6667 4.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.6667 12H14.5001C14.0398 12 13.6667 12.3731 13.6667 12.8333V18.6667C13.6667 19.1269 14.0398 19.5 14.5001 19.5H18.6667C19.127 19.5 19.5001 19.1269 19.5001 18.6667V12.8333C19.5001 12.3731 19.127 12 18.6667 12Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 15.3333H5.33333C4.8731 15.3333 4.5 15.7063 4.5 16.1666V18.6666C4.5 19.1268 4.8731 19.4999 5.33333 19.4999H9.5C9.96024 19.4999 10.3333 19.1268 10.3333 18.6666V16.1666C10.3333 15.7063 9.96024 15.3333 9.5 15.3333Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}