import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Will's Ops Command",
  description: "Life OS dashboard for Will – health, tasks, and orders.",
  manifest: "/manifest.webmanifest",
  themeColor: "#020617",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Will's Ops Command"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
