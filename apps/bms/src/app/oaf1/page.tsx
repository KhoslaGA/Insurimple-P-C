import { createRiskVersion, toOaf1Application } from '@insurimple/contracts';
import { Oaf1Preview } from '@/components/Oaf1Preview';
import { mockPriorAutoPolicy } from '@/lib/mock/household';

// The captured risk populating an OAF 1 application — no re-entry (TR.1 mapper, rendered).
export default function Oaf1Page() {
  const version = createRiskVersion('risk-auto-1', mockPriorAutoPolicy.risk, '2026-06-15T11:38:00.000Z');
  const oaf1 = toOaf1Application(version);
  return <Oaf1Preview oaf1={oaf1} />;
}
