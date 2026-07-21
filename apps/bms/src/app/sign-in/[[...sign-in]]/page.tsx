import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-page">
      <div className="text-center">
        <div className="text-[28px] font-medium tracking-[-0.03em] text-text-1">insurimple</div>
        <p className="text-body text-text-2">Broker management for Canadian brokerages.</p>
      </div>
      <SignIn />
    </main>
  );
}
