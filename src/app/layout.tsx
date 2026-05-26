import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "DANCE NOW | ダンスレッスン予約",
  description: "HIPHOP・JAZZ・K-POP・BALLET・HOUSE・CONTEMPORARYのレッスン予約",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F0A1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Calling headers() opts every page into dynamic rendering so Vercel
  // creates serverless lambdas for all routes (prevents "Unable to find
  // lambda for route" build errors with the @vercel/next adapter).
  await headers();
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
