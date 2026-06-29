import type { Metadata } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import { ToastViewport } from "@/components/ui/toast-viewport";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Micro Commerce",
  description: "Next.js ve Django ile hazırlanmış sade ve premium alışveriş deneyimi.",
  applicationName: "Micro Commerce",
  keywords: ["e-ticaret", "next.js mağaza", "django mağaza", "minimal alışveriş sepeti"],
  openGraph: {
    title: "Micro Commerce",
    description: "Next.js ve Django ile hazırlanmış sade ve premium alışveriş deneyimi.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Micro Commerce",
    description: "Next.js ve Django ile hazırlanmış sade ve premium alışveriş deneyimi.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrainsMono.variable} ${dmSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
