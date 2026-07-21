import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { AppShell } from "../components/AppShell";
import "./globals.css";

// Inter for UI, Lora reserved for editorial moments (design-and-brand-brief §3).
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["-apple-system", "Segoe UI", "sans-serif"],
});
const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: "Insurimple",
  description: "Broker management for Canadian brokerages.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
