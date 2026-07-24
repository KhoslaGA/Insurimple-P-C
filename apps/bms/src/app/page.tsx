import { QuoteWorkspace } from '@/components/QuoteWorkspace';
import { mockHousehold, mockPriorAutoPolicy } from '@/lib/mock/household';

// TR.2 — the quote workspace opens on the party record. Party + prior policy come
// from the mock spine (stand-in for the NestJS party/policy layer).
export default function Home() {
  return <QuoteWorkspace household={mockHousehold} prior={mockPriorAutoPolicy} />;
}
