import { EmptyState } from "@insurimple/design-system";
import type { WorkQueues } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_QUEUES } from "../../../lib/demo-data";
import { WorkQueuesView } from "../../../components/WorkQueuesView";

export const dynamic = "force-dynamic";

/** Work queues — the CSR's day. Real tenant-scoped lists from GET /queues,
 *  or the seed snapshot in preview (no API configured). */
export default async function QueuesPage() {
  const preview = !API_CONFIGURED;
  let queues: WorkQueues | null = null;
  let problem: string | null = null;

  if (preview) {
    queues = DEMO_QUEUES;
  } else {
    try {
      queues = await api<WorkQueues>("/queues");
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (!queues) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <EmptyState
          title="Couldn’t load the queues"
          description={`The API said: ${problem}. Check that apps/api is running and your organization is linked to a tenant.`}
        />
      </div>
    );
  }

  return <WorkQueuesView queues={queues} preview={preview} />;
}
