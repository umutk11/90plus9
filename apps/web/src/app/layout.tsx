import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  description:
    "90+9, Türkiye Süper Lig oyuncularını tahmin ederek her gün tamamladığın 3×3 günlük grid oyunudur.",
  title: "90+9 — Günlük Süper Lig Grid Oyunu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
