import { buildComparison } from '@insurimple/contracts';
import { Comparison } from '@/components/Comparison';
import { mockHousehold } from '@/lib/mock/household';
import { mockShopAndResults } from '@/lib/mock/shop';

// TR.5 — compare a shop's results (produced through the TR.4 adapters) and draft the
// client-facing summary through the drafter gate.
export default async function ComparePage() {
  const { shop, results } = await mockShopAndResults();
  const view = buildComparison(shop, results);
  const insuredName = `${mockHousehold.primaryContact.firstName} ${mockHousehold.primaryContact.lastName}`;
  return <Comparison shop={shop} results={results} view={view} insuredName={insuredName} />;
}
