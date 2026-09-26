import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./components/providers";
import { DevAuthSwitcher } from "./components/dev/DevAuthSwitcher";

export const metadata: Metadata = {
  title: "Parqlet HOA Platform",
  description: "...",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Set data-theme before first paint so there's no flash of the wrong
            theme — ThemeProvider reads this same value on mount to sync its
            own state. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("parqlet_theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="h-full">
        <Providers>{children}</Providers>
        <DevAuthSwitcher />
      </body>
    </html>
  );
}
