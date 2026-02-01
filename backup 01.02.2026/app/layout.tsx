import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Wir nutzen Inter statt localFont
import "./globals.css";
import AppLayout from "@/components/AppLayout";

// Lade die Inter-Schriftart
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coach App",
  description: "Digitaler Trainingsplaner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <script src="https://unpkg.com/@phosphor-icons/web" async></script>
      </head>
      {/* Hier nutzen wir inter.className statt der Geist-Variablen */}
      <body className={`${inter.className} antialiased bg-[#F5F5F7]`}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}