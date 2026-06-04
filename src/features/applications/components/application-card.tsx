import Link from 'next/link';
import Avatar from '@/shared/components/base/Avatar';
import Typography from '@/shared/components/base/Typography';
import { Ellipsis, GraduationCap, Star, Users } from 'lucide-react';
import {
  formatCompactNumber,
  formatCurrency,
  formatStatusLabel,
  TutorApplicationCard,
} from './applications.data';
import { TutorStatus } from './applications.types';

type ApplicationCardProps = {
  application: TutorApplicationCard;
  currentUrl: string;
  detailHref: string;
  onUpdateStatus: (formData: FormData) => Promise<void>;
};

function StatusBadge({ status }: { status: TutorStatus }) {
  const toneByStatus: Record<TutorStatus, string> = {
    DRAFT: 'bg-neutral-100 text-neutral-700',
    REVIEWING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-rose-50 text-rose-700',
    SUSPENDED: 'bg-violet-50 text-violet-700',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${toneByStatus[status]}`}>
      {formatStatusLabel(status)}
    </span>
  );
}

function ActionButton({
  label,
  status,
  tutorId,
  currentUrl,
  onUpdateStatus,
  className,
}: {
  label: string;
  status: TutorStatus;
  tutorId: string;
  currentUrl: string;
  onUpdateStatus: (formData: FormData) => Promise<void>;
  className: string;
}) {
  return (
    <form action={onUpdateStatus} className="flex-1">
      <input type="hidden" name="tutorId" value={tutorId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="returnTo" value={currentUrl} />
      <button className={className} type="submit">
        {label}
      </button>
    </form>
  );
}

export default function ApplicationCard({
  application,
  currentUrl,
  detailHref,
  onUpdateStatus,
}: ApplicationCardProps) {
  const isProcessing = application.status === 'REVIEWING';
  const isApproved = application.status === 'APPROVED';

  return (
    <article className="flex flex-col gap-4 rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={detailHref}
          className="min-w-0 flex-1 rounded-[20px] transition hover:bg-neutral-25 focus:outline-none focus:ring-2 focus:ring-deep-royal-indigo-300"
        >
          <div className="flex items-center gap-4 p-1">
            <Avatar
              src={application.avatarUrl}
              alt={application.fullName}
              name={application.fullName}
              sizeClassName="h-16 w-16"
              textClassName="text-label-2"
            />

            <div className="flex min-w-0 flex-col gap-1">
              <Typography as="h3" variant={{ base: 'title-4', lg: 'title-3' }} color="neutral-800">
                {application.fullName}
              </Typography>
              <Typography variant={{ base: 'body-3' }} color="neutral-500">
                {application.subject}
              </Typography>
              <Typography variant={{ base: 'label-3' }} color="neutral-700">
                {formatCurrency(application.baseRate)} / lesson
              </Typography>
            </div>
          </div>
        </Link>

        {isApproved ? (
          <details className="relative">
            <summary className="flex list-none cursor-pointer items-center justify-center rounded-full border border-neutral-100 p-2 text-neutral-500 transition hover:bg-neutral-50">
              <Ellipsis className="h-5 w-5" />
            </summary>

            <div className="absolute right-0 top-12 z-10 flex min-w-44 flex-col rounded-2xl border border-neutral-100 bg-white p-2 shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
              <ActionButton
                label="Block tutor"
                status="SUSPENDED"
                tutorId={application.id}
                currentUrl={currentUrl}
                onUpdateStatus={onUpdateStatus}
                className="rounded-xl px-3 py-2 text-left text-body-3 text-neutral-700 transition hover:bg-neutral-50"
              />
              <ActionButton
                label="Restrict tutor"
                status="SUSPENDED"
                tutorId={application.id}
                currentUrl={currentUrl}
                onUpdateStatus={onUpdateStatus}
                className="rounded-xl px-3 py-2 text-left text-body-3 text-neutral-700 transition hover:bg-neutral-50"
              />
            </div>
          </details>
        ) : (
          <StatusBadge status={application.status} />
        )}
      </div>

      <Link
        href={detailHref}
        className="block rounded-[20px] transition hover:bg-neutral-25 focus:outline-none focus:ring-2 focus:ring-deep-royal-indigo-300"
      >
        <div className="grid grid-cols-3 gap-3 rounded-[20px] bg-neutral-25 p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <Star className="h-4 w-4" />
              <Typography variant={{ base: 'label-4' }} color="neutral-500">
                Rating
              </Typography>
            </div>
            <Typography variant={{ base: 'title-4' }} color="neutral-800">
              {application.avgRating.toFixed(1)}
            </Typography>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <Users className="h-4 w-4" />
              <Typography variant={{ base: 'label-4' }} color="neutral-500">
                Students
              </Typography>
            </div>
            <Typography variant={{ base: 'title-4' }} color="neutral-800">
              {formatCompactNumber(application.studentsCount)}
            </Typography>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <GraduationCap className="h-4 w-4" />
              <Typography variant={{ base: 'label-4' }} color="neutral-500">
                Lessons
              </Typography>
            </div>
            <Typography variant={{ base: 'title-4' }} color="neutral-800">
              {formatCompactNumber(application.lessonsCount)}
            </Typography>
          </div>
        </div>
      </Link>

      {isProcessing ? (
        <div className="flex gap-3">
          <ActionButton
            label="Reject"
            status="REJECTED"
            tutorId={application.id}
            currentUrl={currentUrl}
            onUpdateStatus={onUpdateStatus}
            className="w-full rounded-2xl border border-rose-200 px-4 py-3 text-label-3 text-rose-700 transition hover:bg-rose-50"
          />
          <ActionButton
            label="Approve"
            status="APPROVED"
            tutorId={application.id}
            currentUrl={currentUrl}
            onUpdateStatus={onUpdateStatus}
            className="w-full rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white transition hover:bg-deep-royal-indigo-600"
          />
        </div>
      ) : null}
    </article>
  );
}
