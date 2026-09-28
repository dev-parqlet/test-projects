"use client";

/**
 * /demo-home — the animated product demo.
 *
 * Standalone, belonging to neither product: no sidebar, no building, no
 * identity. It sits at the top level rather than inside `(hoa)` or
 * `(apartments)`, and the front door lets it through without asking which
 * product the visitor came for (see lib/demo/product-path.ts).
 *
 * Reached by typing the URL. Nothing links here on purpose - see
 * ./layout.tsx.
 *
 * ParqletDemo.jsx is VENDORED, kept byte-identical to the file it was
 * authored in so a newer version can be dropped straight over it. That is
 * why the "use client" directive lives here rather than at the top of it,
 * and why nothing in this project imports from inside it.
 *
 * Loaded with ssr:false. The component attaches a Shadow DOM in a layout
 * effect and reads `document` and `window` on mount, none of which exist
 * while rendering on the server, and it paints nothing until it has
 * measured its own width - so a server pass would buy an empty frame and
 * a hydration warning.
 */

import dynamic from "next/dynamic";

const ParqletDemo = dynamic(() => import("../components/demo/ParqletDemo"), {
  ssr: false,
  loading: () => <div style={{ aspectRatio: "1280 / 720", borderRadius: 28, background: "#222" }} />,
});

export default function DemoHomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#141414",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1280 }}>
        <ParqletDemo />
      </div>
    </main>
  );
}
