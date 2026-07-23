import type { BookMetrics, HouseholdDetail, TxnState } from "@insurimple/contracts";

const TERMINAL: TxnState[] = ["completed", "rejected"];

const titleCase = (s: string) =>
  s ? s.replace(/(^|_)([a-z])/g, (_, p, c) => (p ? " " : "") + c.toUpperCase()) : s;

function tally(pairs: string[]): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const p of pairs) m.set(p, (m.get(p) ?? 0) + 1);
  return [...m.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Compute the tenant book metrics from full household details. Used for the
 * preview dashboard (no backend); the real /metrics endpoint returns the same
 * shape from SQL aggregates.
 */
export function computeMetrics(households: HouseholdDetail[]): BookMetrics {
  const policies = households.flatMap((h) => h.policies.map((p) => ({ ...p, _acct: h })));
  const inForce = policies.filter((p) => p.status === "in_force");
  const txns = households.flatMap((h) => h.service_summary);

  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 3600 * 1000);
  const renewals90d = inForce.filter((p) => {
    if (!p.expiry_date) return false;
    const d = new Date(`${p.expiry_date.slice(0, 10)}T00:00:00`);
    return d >= now && d <= in90;
  }).length;

  const carrier = new Map<string, number>();
  for (const p of inForce) {
    const key = p.carrier_name ?? "Unassigned";
    carrier.set(key, (carrier.get(key) ?? 0) + Number(p.annual_premium ?? 0));
  }

  const pipeMap = new Map<TxnState, number>();
  for (const t of txns) pipeMap.set(t.state, (pipeMap.get(t.state) ?? 0) + 1);

  return {
    book_size: households.length,
    prospects: households.filter((h) => h.header.status === "prospect").length,
    policies_in_force: inForce.length,
    premium_in_force: inForce.reduce((s, p) => s + Number(p.annual_premium ?? 0), 0),
    active_transactions: txns.filter((t) => !TERMINAL.includes(t.state)).length,
    renewals_90d: renewals90d,
    by_status: tally(households.map((h) => titleCase(h.header.status))),
    by_source: tally(households.map((h) => h.header.source ?? "Unknown")),
    premium_by_carrier: [...carrier.entries()]
      .map(([label, value]) => ({ label, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value),
    pipeline: [...pipeMap.entries()].map(([state, value]) => ({ state, value })),
  };
}
