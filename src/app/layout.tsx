import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Botfy ClinicOps - Console Administrativo",
  description: "Console administrativo para gestão do sistema Botfy ClinicOps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
