"use client";

import Image from "next/image";

export default function CarTopDown() {
  return (
    <Image
      src="/images/car-hero.png"
      alt=""
      width={80}
      height={80}
      className="w-[72px] h-auto"
      priority
    />
  );
}
