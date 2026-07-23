"use client";

// Route-level error boundary for the public preference center: a login-less
// visitor must never see a raw stack trace.
export default function PreferenceError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-border bg-surface-card p-8 text-center">
        <h1 className="text-h1 font-medium text-fg">Something went wrong</h1>
        <p className="mt-2 text-small text-fg-muted">
          We couldn&rsquo;t load your preferences right now. Please try the link
          again in a moment, or contact your broker.
        </p>
      </div>
    </main>
  );
}
