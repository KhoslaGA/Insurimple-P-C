import { QuoteWorkspace } from '@/components/QuoteWorkspace';
import { getDataSource } from '@/lib/data/source';

// TR.2 — the quote workspace opens on the party record. Party + prior policies come
// through the data-source seam: the mock spine by default, the live backend when
// INSURIMPLE_API_URL is set (Phase 2).
export default async function Home() {
  const source = getDataSource();
  const [household, { priorAuto, priorHome }] = await Promise.all([
    source.getHousehold(),
    source.getPriorPolicies(),
  ]);
  return <QuoteWorkspace household={household} priorAuto={priorAuto} priorHome={priorHome} />;
}
