import Typography from '@/shared/components/base/Typography';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';

import HighlightHeaderSection from './HighlightSectionHeader';
import {
  formatCompactNumber,
  formatCurrency,
  formatInteger,
  getOverviewHighlights,
} from './highlightData';

type HighlightMetric = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
};

type HighlightMetricCardProps = {
  metric: HighlightMetric;
};

function HighlightMetricCard({ metric }: HighlightMetricCardProps) {
  const Icon = metric.icon;

  return (
    <div className="flex flex-col gap-0.5 lg:gap-2 lg:pr-2">
      <div className="flex items-center gap-1.5 lg:gap-2">
        <Typography variant={{ base: "headline-4", lg: "headline-3" }} color="neutral-800">
          {metric.value}
        </Typography>
        <Icon className={`h-5 w-5 lg:h-7 lg:w-7 ${metric.iconClassName}`} />
      </div>

      <Typography variant={{ base: "label-3" }} color="neutral-700">
        {metric.label}
      </Typography>
    </div>
  );
}

export default async function HighlightSection() {
  const highlights = await getOverviewHighlights();
  const activeUsersLabel =
    highlights.kind === 'success'
      ? `Active Users (${highlights.data.activeUsersWindowDays}d)`
      : 'Active Users';

  const metrics: HighlightMetric[] = [
    {
      label: 'Platform Revenue (MTD)',
      value:
        highlights.kind === 'success'
          ? formatCurrency(highlights.data.platformRevenue)
          : '—',
      icon: TrendingUp,
      iconClassName: 'text-green-normal',
    },
    {
      label: 'Total Bookings',
      value:
        highlights.kind === 'success'
          ? formatInteger(highlights.data.totalBookings)
          : '—',
      icon: TrendingUp,
      iconClassName: 'text-blue-normal',
    },
    {
      label: activeUsersLabel,
      value:
        highlights.kind === 'success'
          ? formatCompactNumber(highlights.data.activeUsers)
          : '—',
      icon: TrendingDown,
      iconClassName: 'text-orange-normal',
    },
  ];

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-white p-4 lg:gap-3 lg:px-6 lg:py-5">
      <HighlightHeaderSection />

      {highlights.kind === 'error' ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
          <Typography variant={{ base: 'body-3' }} color="amber-700">
            Highlights could not be loaded. This section still uses a public endpoint and needs a follow-up review.
          </Typography>
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-1 lg:gap-8">
        {metrics.map((metric) => (
          <HighlightMetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}
