import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Dojo KKI DPL Manager",
  description: "Sistem Manajemen Dojo Kushin Ryu M Karate-do Indonesia - Cabang DPL. Kelola iuran, absensi, pendaftaran, ujian sabuk, dan turnamen karate.",
  keywords: ["Dojo", "KKI", "Karate", "Kushin Ryu", "Manajemen Dojo", "Karate Indonesia"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
