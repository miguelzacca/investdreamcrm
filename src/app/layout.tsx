import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { MonitorSmartphone } from "lucide-react";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Invest Dream CRM",
  description: "CRM Premium para gestão de aluguéis anuais - Invest Dream",
  icons: {
    icon: '/image.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <div className="mobile-blocker">
          <MonitorSmartphone size={64} className="mb-6 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted text-base max-w-xs">
            O Invest Dream CRM foi projetado para oferecer a melhor experiência em telas maiores. Por favor, acesse através de um computador ou notebook.
          </p>
        </div>
        <div className="app-wrapper">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
