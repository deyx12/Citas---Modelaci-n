import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinica Belen - Portal de Citas",
  description: "Portal para agendar, consultar y administrar citas medicas"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
