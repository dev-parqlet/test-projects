"use client";

import { useState, useEffect } from "react";

export function useWindowWidth() {
  const [width, setWidth] = useState(1280);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}