import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LustLashes",
  description: "Programari online pentru gene intr-un studio goth pink.",
  icons: {
    icon: "/lustlashes-hero.png",
    shortcut: "/lustlashes-hero.png",
    apple: "/lustlashes-hero.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
