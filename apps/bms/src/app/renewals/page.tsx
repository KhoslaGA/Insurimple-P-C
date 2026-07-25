import { RenewalQueue } from '@/components/RenewalQueue';
import { getDataSource } from '@/lib/data/source';

// TR.6 — the renewal queue: shop each renewal and record the outcome; the retention
// scorecard reflects saves vs losses. Rows come through the data-source seam (mock by
// default, live backend when INSURIMPLE_API_URL is set).
export default async function RenewalsPage() {
  const rows = await getDataSource().getRenewalRows();
  return <RenewalQueue initialRows={rows} />;
}
