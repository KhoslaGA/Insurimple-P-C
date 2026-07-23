import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  CardBody,
  CardHeader,
  type Column,
  EmptyState,
  MetricCard,
  PageHeader,
  Table,
} from "@insurimple/design-system";
import {
  type Campaign,
  type CampaignStatus,
  getMarketingDashboard,
  isModuleEntitled,
  type Sequence,
} from "@insurimple/contracts";
import { getCurrentTenantId } from "@/lib/tenant";
import {
  IconCampaign,
  IconConsent,
  IconSegment,
  IconSequence,
} from "@/components/shell/icons";
import { ConsentDonut } from "./_components/consent-donut";
import { EngagementChart } from "./_components/engagement-chart";

const nf = new Intl.NumberFormat("en-CA");
const pct = (x: number) => `${Math.round(x * 100)}%`;

const STATUS_TONE: Record<CampaignStatus, BadgeTone> = {
  draft: "neutral",
  scheduled: "info",
  sending: "accent",
  sent: "success",
  paused: "warning",
};

const TRIGGER_LABEL: Record<Sequence["trigger"], string> = {
  new_client: "New client",
  renewal_t45: "Renewal T-45",
  policy_added: "Policy added",
  lead_intake: "Lead intake",
};

export default function MarketingDashboardPage() {
  const tenantId = getCurrentTenantId();

  // Entitlement is the commercial boundary — enforced server-side (invariant #4).
  if (!isModuleEntitled(tenantId, "marketing")) {
    return (
      <Card>
        <EmptyState
          icon={<IconCampaign />}
          title="Marketing isn't included in this plan"
          body="The marketing module lets your team run compliance-native campaigns, nurture sequences, and CASL consent tracking on your existing book. Add it to get started."
          action={<Button variant="primary">Add the marketing module</Button>}
        />
      </Card>
    );
  }

  const data = getMarketingDashboard(tenantId)!;

  const campaignColumns: Column<Campaign>[] = [
    {
      header: "Campaign",
      render: (c) => (
        <div>
          <div className="font-medium text-fg">{c.name}</div>
          <div className="text-caption text-fg-subtle">
            {c.channel.toUpperCase()}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      render: (c) => <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>,
    },
    { header: "Sent", align: "right", render: (c) => nf.format(c.stats.sent) },
    {
      header: "Delivered",
      align: "right",
      render: (c) => nf.format(c.stats.delivered),
    },
    {
      header: "Engaged",
      align: "right",
      render: (c) =>
        c.stats.delivered
          ? pct(c.stats.engaged / c.stats.delivered)
          : "—",
    },
  ];

  const sequenceColumns: Column<Sequence>[] = [
    {
      header: "Sequence",
      render: (s) => (
        <div>
          <div className="font-medium text-fg">{s.name}</div>
          <div className="text-caption text-fg-subtle">
            {TRIGGER_LABEL[s.trigger]} · {s.stepCount} steps
          </div>
        </div>
      ),
    },
    { header: "Active", align: "right", render: (s) => nf.format(s.active) },
    {
      header: "Done",
      align: "right",
      render: (s) => nf.format(s.completed),
    },
    {
      header: "Exited",
      align: "right",
      render: (s) => <span className="text-fg-muted">{nf.format(s.exited)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Marketing overview"
        description="Compliance-native campaigns on your book — every send resolves CASL consent first and lands as an activity on the party record."
        actions={
          <>
            <Button variant="secondary">View segments</Button>
            <Button variant="primary" icon={<IconCampaign />}>
              New campaign
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active campaigns"
          value={data.stats.activeCampaigns}
          delta={`+${data.stats.deltas.activeCampaigns}`}
          deltaTone="up"
          hint="vs last month"
          icon={<IconCampaign />}
        />
        <MetricCard
          label="Sent (30d)"
          value={nf.format(data.stats.sentLast30d)}
          delta={`+${data.stats.deltas.sentLast30d}%`}
          deltaTone="up"
          hint="vs prior 30d"
          icon={<IconSequence />}
        />
        <MetricCard
          label="Consent coverage"
          value={pct(data.stats.consentCoverage)}
          delta={`+${Math.round(data.stats.deltas.consentCoverage * 100)} pts`}
          deltaTone="up"
          hint="of marketable book"
          icon={<IconConsent />}
        />
        <MetricCard
          label="Suppressed"
          value={nf.format(data.stats.suppressedCount)}
          delta={`+${data.stats.deltas.suppressedCount}`}
          deltaTone="neutral"
          hint="new this month"
          icon={<IconSegment />}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Send engagement"
            subtitle="Sent, delivered, and engaged across the last 8 weeks"
          />
          <CardBody>
            <EngagementChart
              categories={data.engagementSeries.categories}
              sent={data.engagementSeries.sent}
              delivered={data.engagementSeries.delivered}
              engaged={data.engagementSeries.engaged}
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-4">
          <CardHeader
            title="Consent mix"
            subtitle="CASL basis across the book"
          />
          <CardBody>
            <ConsentDonut data={data.consentMix} />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Recent campaigns"
            action={<Button variant="ghost" size="sm">View all</Button>}
          />
          <Table
            columns={campaignColumns}
            rows={data.recentCampaigns}
            getRowKey={(c) => c.id}
          />
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Sequence health"
            subtitle="Enrollment and exit across active sequences"
          />
          <Table
            columns={sequenceColumns}
            rows={data.sequences}
            getRowKey={(s) => s.id}
          />
        </Card>
      </div>
    </div>
  );
}
