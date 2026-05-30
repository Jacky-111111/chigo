import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChiGo",
    template: "%s | ChiGo",
  },
  description: "Find nearby meals and dining partners around CMU.",
};

export const viewport: Viewport = {
  themeColor: "#372E7D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
