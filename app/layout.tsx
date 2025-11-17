import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life OS - Family Dashboard",
  description: "Shared task and reminder dashboard for your life",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}