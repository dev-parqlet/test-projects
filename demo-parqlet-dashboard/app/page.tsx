"use client";

/**
 * demo.parqlet.com — the front door.
 *
 * Lists every link we hand out. It used to forward straight into
 * whichever product was last opened, which was right while there were
 * two of them and a remembered choice was the whole decision. There are
 * six cuts now, and forwarding meant the one page that could show them
 * all was the one page nobody ever saw.
 *
 * Nothing here is gated: this IS the chooser, so wrapping it in one
 * would ask a visitor to pick a product before showing them the list of
 * products.
 */

import { DemoCutsIndex } from "./components/demo/DemoCutsIndex";

export default function RootPage() {
  return <DemoCutsIndex />;
}
