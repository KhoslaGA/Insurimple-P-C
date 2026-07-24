import { RenewalQueue } from '@/components/RenewalQueue';
import { mockRenewals } from '@/lib/mock/renewals';

// TR.6 — the renewal queue: shop each renewal and record the outcome; the retention
// scorecard reflects saves vs losses.
export default function RenewalsPage() {
  return <RenewalQueue initialRows={mockRenewals} />;
}
