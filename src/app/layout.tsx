import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PageTransitionOverlay } from "@/components/transitions/PageTransitionOverlay";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Invest Dream CRM",
  description: "CRM Premium para gestão de aluguéis anuais - Invest Dream",
  icons: {
    icon: "/image.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${plusJakarta.variable}`}>
        <div className="app-wrapper">
          <Providers>
            {children}
            {/* Cinematic sweep overlay lives here so it persists across routes */}
            <PageTransitionOverlay />
          </Providers>
        </div>
      </body>
    </html>
  );
}
