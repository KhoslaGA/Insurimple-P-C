import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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

/**
 * Clerk appearance mirrors the token layer (values = tokens.css; Clerk's
 * appearance API needs concrete colors, so these mirror --pine/--pine-deep/
 * --sand/--ink rather than var() refs). No Clerk default purple anywhere.
 */
const clerkAppearance = {
  variables: {
    colorPrimary: "#12796A",
    colorText: "#0C1B22",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#0C1B22",
    borderRadius: "8px",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    formButtonPrimary: "bg-accent hover:bg-accent-deep text-text-on-accent",
    card: "shadow-overlay rounded-card",
  },
};

// Clerk mounts only when a real publishable key is present. A keyless
// preview/first deploy renders without Clerk (no invalid-key init errors);
// set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (+ CLERK_SECRET_KEY) to turn on auth.
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const html = (
    <html lang="en" className={`${inter.variable} ${lora.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
  if (!publishableKey) return html;
  return (
    <ClerkProvider publishableKey={publishableKey} appearance={clerkAppearance}>
      {html}
    </ClerkProvider>
  );
}
