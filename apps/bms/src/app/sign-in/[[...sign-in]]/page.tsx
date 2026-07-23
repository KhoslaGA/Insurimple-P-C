import { SignIn } from "@clerk/nextjs";

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-page">
      <div className="text-center">
        <div className="text-[28px] font-medium tracking-[-0.03em] text-text-1">insurimple</div>
        <p className="text-body text-text-2">Broker management for Canadian brokerages.</p>
      </div>
      {clerkConfigured ? (
        <SignIn />
      ) : (
        <p className="max-w-sm text-center text-small text-text-3">
          Sign-in isn’t configured on this deployment. Set the Clerk keys
          (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY) to enable
          authentication.
        </p>
      )}
    </main>
  );
}
