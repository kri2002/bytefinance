import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Importamos el wrapper que acabamos de crear
import LayoutWrapper from "@/components/layout/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ByteFinance",
  description: "Control financiero personal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Usamos el Wrapper para manejar la lógica de diseño */}
        <LayoutWrapper>
            {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}