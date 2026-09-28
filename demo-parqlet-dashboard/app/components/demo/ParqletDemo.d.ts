import type { CSSProperties, ReactElement } from "react";

/**
 * Types for the vendored ParqletDemo.jsx.
 *
 * The component is plain JS and kept byte-identical to the file it was
 * authored in, so a newer version can be dropped straight over it. Left
 * untyped, TypeScript infers its props from the destructuring in its
 * signature and decides `className` and `style` are REQUIRED, because they
 * are the two without a default - so `<ParqletDemo />`, the documented way
 * to use it, does not compile. This states the real contract instead of
 * editing the file to suit the compiler.
 */
export interface ParqletDemoProps {
  /** App Store link used by the final CTA. */
  appStoreUrl?: string;
  /** "Book a demo" link used by the final CTA. */
  demoUrl?: string;
  /** Start playing on mount. Default true. */
  autoPlay?: boolean;
  /** Loop forever. Default true. */
  loop?: boolean;
  /** Inject Rubik + Inter from Google Fonts. Default true. */
  loadFonts?: boolean;
  /** Corner radius of the stage, px. Default 28. */
  rounded?: number;
  /** Start time, ms. Default 0. */
  startAt?: number;
  className?: string;
  style?: CSSProperties;
}

export default function ParqletDemo(props?: ParqletDemoProps): ReactElement;
