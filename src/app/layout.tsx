import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "DANCE NOW | ダンスレッスン予約",
  description: "HIPHOP・JAZZ・K-POP・BALLET・HOUSE・CONTEMPORARYのレッスン予約",
  manifest: "/manifest.json",
  themeColor: "#0F0A1F",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
