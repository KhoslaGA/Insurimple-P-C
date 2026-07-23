import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insurimple — Marketing",
  description:
    "Insurimple marketing module — compliance-native campaigns, sequences, and CASL consent for Canadian brokerages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // data-theme activates the tenant white-label palette (see tokens.css).
  return (
    <html lang="en" data-theme="klc" className="h-full">
      <body className="min-h-full bg-surface-page text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
