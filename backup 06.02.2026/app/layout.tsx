import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import Footer from "@/components/Footer";

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
      <body className={`${inter.className} antialiased bg-[#F5F5F7]`}>
        <AppLayout>
          
          {/* WICHTIG: pb-16 sorgt für Abstand unten, damit der Footer nichts verdeckt */}
          <div className="min-h-screen pb-16 relative">
            
            <main>
              {children}
            </main>

            <Footer />
            
          </div>

        </AppLayout>
      </body>
    </html>
  );
}