import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Internal App Starter",
  description: "Starter template for a Vanta internal app.",
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
