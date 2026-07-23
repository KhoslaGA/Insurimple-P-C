import { AppShell } from "../../components/AppShell";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Preview mode = no backend API configured (a keyless Vercel/preview deploy).
  const preview = !process.env.API_URL;
  return <AppShell preview={preview}>{children}</AppShell>;
}
