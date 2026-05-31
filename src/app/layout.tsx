import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "STUDIO RENTAL | スタジオ予約",
  description: "ダンススクールマイセルフ スタジオレンタル予約",
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
