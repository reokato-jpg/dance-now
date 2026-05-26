import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DANCE NOW | スタジオ予約",
  description: "ダンススタジオのレンタル予約 — DANCE NOW",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F0A1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
