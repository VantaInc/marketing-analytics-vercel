import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vanta Auth",
  description: "Centralized authentication broker for Vanta internal apps.",
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
