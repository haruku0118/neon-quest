
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEON QUEST | Cyberpunk Action Game",
  description:
    "Play NEON QUEST, a neon-inspired 2D action platformer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
