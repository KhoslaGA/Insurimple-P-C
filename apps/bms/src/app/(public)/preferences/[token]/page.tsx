import { Badge, Button, Card } from "@insurimple/design-system";
import {
  getPreferenceState,
  verifyPreferenceToken,
} from "@insurimple/contracts/server";
import { updatePreferences } from "./actions";

export const dynamic = "force-dynamic";

const CLASS_LABEL: Record<string, string> = {
  express: "Express consent",
  implied_ebr: "Implied — existing business relationship",
  implied_inquiry: "Implied — recent inquiry",
  none: "No consent on file",
};

function Shell({
  themeKey,
  children,
}: {
  themeKey?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      data-theme={themeKey}
      className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-12"
    >
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

function Invalid({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <Card className="p-8 text-center">
        <h1 className="text-h1 font-medium text-fg">{title}</h1>
        <p className="mt-2 text-small text-fg-muted">{body}</p>
      </Card>
    </Shell>
  );
}

export default async function PreferenceCenter({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const verified = verifyPreferenceToken(token);
  if (!verified.valid) {
    return (
      <Invalid
        title="This link isn't valid"
        body={
          verified.reason === "expired"
            ? "This preference link has expired. Please use the link in a more recent message, or contact your broker."
            : "We couldn't verify this preference link. Please use the link exactly as it appeared in your message."
        }
      />
    );
  }

  const nowIso = new Date().toISOString();
  const state = getPreferenceState(
    verified.payload.t,
    verified.payload.p,
    verified.payload.c,
    nowIso,
  );
  if (!state) {
    return (
      <Invalid
        title="Preferences unavailable"
        body="We couldn't find the contact for this link."
      />
    );
  }

  const { tenant, party, channel, address, consent, sendability } = state;
  const subscribed = sendability.allowed;

  return (
    <Shell themeKey={tenant.themeKey}>
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-brand px-6 py-5">
          <div className="text-caption uppercase tracking-[0.08em] text-fg-on-accent/80">
            {tenant.name}
          </div>
          <h1 className="mt-0.5 text-h1 font-medium text-fg-on-accent">
            Email preferences
          </h1>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <div className="text-small text-fg-muted">Managing preferences for</div>
            <div className="text-body font-medium text-fg">{party.displayName}</div>
            <div className="text-small text-fg-subtle">{address}</div>
          </div>

          <div className="flex items-center justify-between rounded-control bg-surface-sunken px-4 py-3">
            <span className="text-small font-medium text-fg">
              Marketing {channel}
            </span>
            {subscribed ? (
              <Badge tone="success" dot>
                Subscribed
              </Badge>
            ) : (
              <Badge tone="neutral" dot>
                Unsubscribed
              </Badge>
            )}
          </div>

          <p className="text-small text-fg-muted">
            {subscribed ? (
              <>
                You&rsquo;re receiving marketing emails from {tenant.name}. Basis
                on file: <strong className="text-fg">{CLASS_LABEL[consent?.class ?? "none"]}</strong>
                {consent?.expiresAt ? ` (valid to ${consent.expiresAt})` : ""}.
              </>
            ) : (
              <>
                You&rsquo;re unsubscribed from {tenant.name}
                {" "}marketing emails and won&rsquo;t receive any campaigns or
                sequences. Service messages about your policies are unaffected.
              </>
            )}
          </p>

          {address ? (
            <form
              action={updatePreferences}
              className="border-t border-border pt-5"
            >
              <input type="hidden" name="token" value={token} />
              <input
                type="hidden"
                name="intent"
                value={subscribed ? "unsubscribe" : "subscribe"}
              />
              {subscribed ? (
                <Button variant="secondary" size="lg" type="submit" className="w-full">
                  Unsubscribe from all marketing
                </Button>
              ) : (
                <Button variant="primary" size="lg" type="submit" className="w-full">
                  Resubscribe to marketing emails
                </Button>
              )}
              <p className="mt-3 text-caption text-fg-subtle">
                Changes take effect immediately and are recorded for compliance.
              </p>
            </form>
          ) : (
            <p className="border-t border-border pt-5 text-small text-fg-muted">
              We don&rsquo;t have an email address on file for this contact, so
              there&rsquo;s nothing to manage here. Please contact your broker.
            </p>
          )}
        </div>
      </Card>

      <p className="mt-4 px-2 text-center text-caption text-fg-subtle">
        Sent by {tenant.name} · You received this because you have a relationship
        with our brokerage. This preference center is provided under CASL.
      </p>
    </Shell>
  );
}
