import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SETOKU",
  description: "Constructor y jugador de sudokus con variantes",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
