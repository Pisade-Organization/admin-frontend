import Typography from '@/shared/components/base/Typography';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import {
  formatCompactNumber,
  formatCurrency,
  formatInteger,
} from '@/shared/lib/formatters';
import HighlightSection from './highlights-section';
import { getCollectionState } from './overview.helpers';

type AdminStats = {
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
  pendingReviews: number;
  approvedTutors: number;
  activeLessonsToday: number;
  revenueThisMonth: number;
  revenueTotal: number;
};

type RevenuePoint = {
  date: string;
  amount: number;
};

type LessonChartPoint = {
  date: string;
  CONFIRMED: number;
  COMPLETED: number;
  CANCELLED: number;
};

async function getOverviewData() {
  const [stats, revenueChart, lessonsChart] = await Promise.all([
    fetchAdminApi<AdminStats>('/v1/admin/stats').catch(() => null),
    fetchAdminApi<RevenuePoint[]>('/v1/admin/stats/revenue-chart').catch(() => null),
    fetchAdminApi<LessonChartPoint[]>('/v1/admin/stats/lessons-chart').catch(() => null),
  ]);

  return { stats, revenueChart, lessonsChart };
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-[24px] border p-5 ${tone}`}>
      <Typography variant={{ base: 'label-3' }} color="neutral-700">
        {label}
      </Typography>
      <Typography
        variant={{ base: 'headline-4', lg: 'headline-3' }}
        color="neutral-900"
        className="mt-2"
      >
        {value}
      </Typography>
    </div>
  );
}

export async function OverviewPage() {
  const { stats, revenueChart, lessonsChart } = await getOverviewData();
  const revenueState = getCollectionState(revenueChart);
  const lessonsState = getCollectionState(lessonsChart);
  const recentRevenue = revenueState.data.slice(-6);
  const latestLessons = lessonsState.data.slice(-7);

  const insights = stats
    ? [
        `${formatInteger(stats.pendingReviews)} tutor applications are waiting for review.`,
        `${formatInteger(stats.activeLessonsToday)} lessons are scheduled for today.`,
        `${formatInteger(stats.approvedTutors)} tutors are currently approved and bookable.`,
      ]
    : [];

  return (
    <div className="flex flex-col gap-4 bg-neutral-25 p-4">
      <HighlightSection />

      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={formatInteger(stats?.totalUsers)}
          tone="border-blue-100 bg-blue-light"
        />
        <StatCard
          label="Students"
          value={formatInteger(stats?.totalStudents)}
          tone="border-green-100 bg-green-light"
        />
        <StatCard
          label="Tutors"
          value={formatInteger(stats?.totalTutors)}
          tone="border-violet-100 bg-electric-violet-50"
        />
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(stats?.revenueThisMonth)}
          tone="border-orange-100 bg-orange-light"
        />
      </section>

      {!stats ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
          <Typography variant={{ base: 'body-3' }} color="amber-700">
            Admin stats could not be loaded. User counts, revenue summaries, and insight cards may be incomplete.
          </Typography>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
                Revenue Trend
              </Typography>
              <Typography variant={{ base: 'body-3' }} color="neutral-500">
                Last 30 days of commission revenue. Follow-up: confirm whether this window is the final product definition.
              </Typography>
            </div>
            <Typography variant={{ base: 'label-2' }} color="electric-violet-500">
              {formatCurrency(stats?.revenueTotal)} total
            </Typography>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {revenueState.kind === 'success' ? (
              recentRevenue.map((point) => (
                <div
                  key={point.date}
                  className="rounded-[20px] border border-neutral-50 bg-neutral-25 p-4"
                >
                  <Typography variant={{ base: 'label-3' }} color="neutral-800">
                    {point.date}
                  </Typography>
                  <Typography
                    variant={{ base: 'headline-5' }}
                    color="deep-royal-indigo-500"
                    className="mt-2"
                  >
                    {formatCurrency(point.amount)}
                  </Typography>
                </div>
              ))
            ) : revenueState.kind === 'empty' ? (
              <Typography variant={{ base: 'body-3' }} color="neutral-500">
                No commission revenue was recorded in the current chart window.
              </Typography>
            ) : (
              <Typography variant={{ base: 'body-3' }} color="amber-700">
                Revenue data could not be loaded.
              </Typography>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
            Latest Insight
          </Typography>
          <div className="mt-4 space-y-3">
            {stats ? (
              insights.map((insight) => (
                <div key={insight} className="rounded-[20px] bg-neutral-25 p-4">
                  <Typography variant={{ base: 'body-3' }} color="neutral-600">
                    {insight}
                  </Typography>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                <Typography variant={{ base: 'body-3' }} color="amber-700">
                  Latest insights are unavailable because the admin stats request failed.
                </Typography>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
              Lesson Flow
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-500">
              Booking outcomes across the last 7 days. Follow-up: confirm the final lesson flow window definition.
            </Typography>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-50">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-label-4 text-neutral-500">Day</th>
                <th className="pb-3 text-label-4 text-neutral-500">Confirmed</th>
                <th className="pb-3 text-label-4 text-neutral-500">Completed</th>
                <th className="pb-3 text-label-4 text-neutral-500">Cancelled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {lessonsState.kind === 'success' ? (
                latestLessons.map((point) => (
                  <tr key={point.date}>
                    <td className="py-3 text-body-3 text-neutral-800">{point.date}</td>
                    <td className="py-3 text-body-3 text-blue-normal">
                      {formatCompactNumber(point.CONFIRMED)}
                    </td>
                    <td className="py-3 text-body-3 text-green-normal">
                      {formatCompactNumber(point.COMPLETED)}
                    </td>
                    <td className="py-3 text-body-3 text-red-normal">
                      {formatCompactNumber(point.CANCELLED)}
                    </td>
                  </tr>
                ))
              ) : lessonsState.kind === 'empty' ? (
                <tr>
                  <td colSpan={4} className="py-4 text-body-3 text-neutral-500">
                    No lesson flow records were returned for this window.
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-body-3 text-amber-700">
                    Lesson trend data could not be loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
