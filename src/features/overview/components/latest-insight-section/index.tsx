import Typography from "@/shared/components/base/Typography";

type LatestInsight = {
  id: string;
  content: string;
};

const LATEST_INSIGHTS: LatestInsight[] = [
  {
    id: "middle-school-growth",
    content: "Middle School user base grew by 20%",
  },
  {
    id: "app-activity-growth",
    content: "Activity via App up by 12%",
  },
  {
    id: "language-lessons-growth",
    content: "Language lessons drive 10% booking growth.",
  },
  {
    id: "onboarding-step-two-dropoff",
    content: "Tutors dropping off at Onboarding Step 2 up 1.2%",
  },
];

type LatestInsightListItemProps = {
  insight: LatestInsight;
};

function LatestInsightListItem({ insight }: LatestInsightListItemProps) {
  return (
    <li>
      <Typography as="span" variant={{ base: "body-3" }} color="neutral-500">
        {insight.content}
      </Typography>
    </li>
  );
}

export default function LatestInsightSection() {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-white p-4 lg:p-5">
      {/* Header */}
      <Typography variant={{ base: "label-3", lg: "label-2" }} color="neutral-900">
        Latest Insight
      </Typography>

      {/* Divider */}
      <div className="w-full border-t border-netural-50" />

      {/* Lists of insights */}
      <ul className="list-disc space-y-1 pl-5 marker:text-neutral-500">
        {LATEST_INSIGHTS.map((insight) => (
          <LatestInsightListItem key={insight.id} insight={insight} />
        ))}
      </ul>
    </section>
  );
}
