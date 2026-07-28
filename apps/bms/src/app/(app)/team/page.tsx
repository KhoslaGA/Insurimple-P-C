import { Badge, EmptyState } from "@insurimple/design-system";
import type { TeamRoster, MeProfile } from "@insurimple/contracts";
import { api, API_CONFIGURED } from "../../../lib/api";
import { DEMO_TEAM, DEMO_ME } from "../../../lib/demo-data";
import { TeamView } from "../../../components/TeamView";

export const dynamic = "force-dynamic";

/**
 * Team & roles — where the licence boundary is administered. Writes are gated
 * by `team.manage` in the database; this screen reflects that rather than
 * enforcing it, so a UI bug can never widen access.
 */
export default async function TeamPage() {
  const preview = !API_CONFIGURED;
  let roster: TeamRoster | null = null;
  let me: MeProfile | null = null;
  let problem: string | null = null;

  if (preview) {
    roster = DEMO_TEAM;
    me = DEMO_ME;
  } else {
    try {
      [roster, me] = await Promise.all([
        api<TeamRoster>("/team"),
        api<MeProfile>("/me"),
      ]);
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e);
    }
  }

  if (!roster) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <EmptyState title="Couldn’t load the team" description={`The API said: ${problem}.`} />
      </div>
    );
  }

  const canManage = !!me?.capabilities.includes("team.manage");

  return (
    <div className="mx-auto max-w-5xl px-8 py-6">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-1">Team &amp; roles</h1>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="text-small text-text-2">
          Licences on file and the roles they authorize. A grant anchored to a licence
          stops working the day that licence lapses.
        </p>
      </header>
      <TeamView roster={roster} canManage={canManage} preview={preview} />
    </div>
  );
}
