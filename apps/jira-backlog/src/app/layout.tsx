import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jira Backlog",
  description: "Vercel Connect test app for Jira backlog access.",
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
