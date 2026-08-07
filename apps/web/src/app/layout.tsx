import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  description: "Türkiye Süper Lig oyuncularını tahmin ettiğin 3×3 günlük grid oyunu.",
  title: "90+9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
