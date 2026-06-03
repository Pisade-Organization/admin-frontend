import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Avatar from '@/shared/components/base/Avatar';
import Typography from '@/shared/components/base/Typography';
import AdminFlashBanner from '@/shared/components/admin/AdminFlashBanner';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import {
  appendQuery,
  buildAdminPath,
  getAdminFlashMessage,
  parsePage,
} from '@/shared/lib/adminPageState';
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
} from '@/shared/lib/formatters';

type TutorStatus =
  | 'ALL'
  | 'DRAFT'
  | 'REVIEWING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';
type TutorRanking = 'STARTER' | 'PRO' | 'MASTER';

type TutorDetail = {
  id: string;
  status: Exclude<TutorStatus, 'ALL'>;
  tutorRanking: TutorRanking;
  baseRate: number;
  joinedAt: string;
  bio: string | null;
  user: {
    email: string;
    profile: {
      fullName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  stats: {
    avgRating: number;
    studentsCount: number;
    lessonsCount: number;
  } | null;
  subjects: Array<{
    subject: {
      name: string;
    };
  }>;
  languages: Array<{
    language: {
      name: string;
    };
  }>;
  wallet: {
    balance: number;
  } | null;
  onboarding: {
    catchyHeadline: string | null;
    introduceYourself: string | null;
    teachingExperience: string | null;
    motivatePotentialStudents: string | null;
    lessonPrice: number;
    certifications: Array<{ id: string }>;
    diplomas: Array<{ id: string }>;
    availabilities: Array<{ id: string }>;
  } | null;
};

type TutorDetailPageProps = {
  tutorId: string;
  searchParams?: {
    status?: string;
    q?: string;
    page?: string;
    notice?: string;
    error?: string;
  };
};

const rankingOptions: TutorRanking[] = ['STARTER', 'PRO', 'MASTER'];
const statusOptions: TutorStatus[] = [
  'ALL',
  'REVIEWING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'DRAFT',
];

function normalizeStatus(value?: string): TutorStatus {
  const normalized = value?.trim();

  return normalized && statusOptions.includes(normalized as TutorStatus)
    ? (normalized as TutorStatus)
    : 'ALL';
}

function getStatusTone(status: Exclude<TutorStatus, 'ALL'>) {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-light text-green-normal';
    case 'REJECTED':
      return 'bg-red-light text-red-normal';
    case 'SUSPENDED':
      return 'bg-electric-violet-50 text-electric-violet-500';
    case 'REVIEWING':
      return 'bg-orange-light text-orange-normal';
    case 'DRAFT':
    default:
      return 'bg-neutral-50 text-neutral-600';
  }
}

function formatStatusLabel(status: Exclude<TutorStatus, 'ALL'>) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function buildTutorListPath(searchParams?: TutorDetailPageProps['searchParams']) {
  const status = normalizeStatus(searchParams?.status);

  return buildAdminPath('/tutors', {
    status: status === 'ALL' ? null : status,
    q: searchParams?.q?.trim() || null,
    page:
      searchParams?.page && searchParams.page !== '1'
        ? searchParams.page
        : null,
  });
}

function buildTutorDetailPath(
  tutorId: string,
  searchParams?: TutorDetailPageProps['searchParams'],
) {
  const status = normalizeStatus(searchParams?.status);

  return buildAdminPath(`/tutors/${tutorId}`, {
    status: status === 'ALL' ? null : status,
    q: searchParams?.q?.trim() || null,
    page:
      searchParams?.page && searchParams.page !== '1'
        ? searchParams.page
        : null,
  });
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-neutral-25 p-4">
      <Typography variant={{ base: 'label-4' }} color="neutral-500">
        {label}
      </Typography>
      <Typography variant={{ base: 'title-3' }} color="neutral-900" className="mt-1">
        {value}
      </Typography>
    </div>
  );
}

export async function TutorDetailPage({
  tutorId,
  searchParams = {},
}: TutorDetailPageProps) {
  const flashMessage = getAdminFlashMessage(searchParams);
  const backHref = buildTutorListPath(searchParams);
  const returnTo = buildTutorDetailPath(tutorId, searchParams);
  const q = searchParams.q?.trim() ?? '';
  const page = parsePage(searchParams.page);

  const data = await fetchAdminApi<TutorDetail>(`/v1/admin/tutors/${tutorId}`)
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: null,
      error: error.message || 'Unable to load tutor detail.',
    }));

  async function updateTutorStatus(formData: FormData) {
    'use server';

    const nextStatus = String(formData.get('status') || '');
    const currentReturnTo = String(formData.get('returnTo') || returnTo);

    if (!nextStatus) {
      redirect(appendQuery(currentReturnTo, 'error', 'Missing tutor status update.'));
    }

    try {
      await fetchAdminApi(`/v1/admin/tutors/${tutorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Could not update tutor status.';

      redirect(appendQuery(currentReturnTo, 'error', message));
    }

    revalidatePath('/tutors');
    revalidatePath(`/tutors/${tutorId}`);
    redirect(
      appendQuery(
        currentReturnTo,
        'notice',
        nextStatus === 'APPROVED'
          ? 'Tutor re-approved.'
          : 'Tutor suspended.',
      ),
    );
  }

  async function updateTutorRanking(formData: FormData) {
    'use server';

    const ranking = String(formData.get('ranking') || '');
    const currentReturnTo = String(formData.get('returnTo') || returnTo);

    if (!ranking) {
      redirect(appendQuery(currentReturnTo, 'error', 'Missing tutor ranking update.'));
    }

    try {
      await fetchAdminApi(`/v1/admin/tutors/${tutorId}/ranking`, {
        method: 'PATCH',
        body: JSON.stringify({ ranking }),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Could not update tutor ranking.';

      redirect(appendQuery(currentReturnTo, 'error', message));
    }

    revalidatePath('/tutors');
    revalidatePath(`/tutors/${tutorId}`);
    redirect(appendQuery(currentReturnTo, 'notice', 'Tutor ranking updated.'));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href={backHref}
              className="inline-flex text-label-3 text-deep-royal-indigo-500"
            >
              Back to tutors
            </Link>
            <Typography
              variant={{ base: 'title-2', lg: 'title-1' }}
              color="neutral-900"
              className="mt-2"
            >
              Tutor Detail
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-500">
              Review profile health, onboarding context, ranking, and payout exposure.
            </Typography>
          </div>
          <div className="rounded-[20px] bg-neutral-25 px-4 py-3">
            <Typography variant={{ base: 'label-4' }} color="neutral-500">
              Return context
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
              Status: {normalizeStatus(searchParams.status)} | Search: {q || 'None'} | Page: {page}
            </Typography>
          </div>
        </div>
      </div>

      {flashMessage ? (
        <AdminFlashBanner tone={flashMessage.tone} text={flashMessage.text} />
      ) : null}

      {data.error || !data.result ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <Typography variant={{ base: 'title-3' }} color="rose-700">
            Tutor detail could not be loaded.
          </Typography>
          <Typography variant={{ base: 'body-3' }} color="rose-700" className="mt-2">
            {data.error || 'The requested tutor record is unavailable.'}
          </Typography>
        </div>
      ) : (
        <>
          <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar
                  src={data.result.user.profile?.avatarUrl}
                  alt={data.result.user.profile?.fullName ?? data.result.user.email}
                  name={data.result.user.profile?.fullName ?? data.result.user.email}
                  sizeClassName="h-20 w-20"
                  textClassName="text-title-1"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Typography variant={{ base: 'title-1' }} color="neutral-900">
                      {data.result.user.profile?.fullName ?? data.result.user.email}
                    </Typography>
                    <span
                      className={`rounded-full px-3 py-1 text-label-4 ${getStatusTone(data.result.status)}`}
                    >
                      {formatStatusLabel(data.result.status)}
                    </span>
                  </div>
                  <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
                    {data.result.user.email}
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-1">
                    Subjects: {data.result.subjects.map(({ subject }) => subject.name).join(', ') || 'None set'}
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-1">
                    Languages: {data.result.languages.map(({ language }) => language.name).join(', ') || 'None set'}
                  </Typography>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-[320px]">
                <form action={updateTutorRanking} className="flex gap-2">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <select
                    name="ranking"
                    defaultValue={data.result.tutorRanking}
                    className="flex-1 rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700"
                  >
                    {rankingOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-2xl border border-neutral-100 px-4 py-3 text-label-3 text-neutral-700"
                  >
                    Save rank
                  </button>
                </form>
                <form action={updateTutorStatus}>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input
                    type="hidden"
                    name="status"
                    value={data.result.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED'}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
                  >
                    {data.result.status === 'SUSPENDED' ? 'Re-approve tutor' : 'Suspend tutor'}
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            <DetailStat
              label="Wallet"
              value={formatCurrency(data.result.wallet?.balance ?? 0)}
            />
            <DetailStat
              label="Rating"
              value={data.result.stats?.avgRating?.toFixed(1) ?? '0.0'}
            />
            <DetailStat
              label="Students"
              value={formatCompactNumber(data.result.stats?.studentsCount ?? 0)}
            />
            <DetailStat
              label="Lessons"
              value={formatCompactNumber(data.result.stats?.lessonsCount ?? 0)}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Typography variant={{ base: 'title-3' }} color="neutral-900">
                Profile Summary
              </Typography>
              <div className="mt-4 space-y-3">
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Joined
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {formatDate(data.result.joinedAt)}
                  </Typography>
                </div>
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Current rate
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {formatCurrency(data.result.baseRate)}
                  </Typography>
                </div>
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Bio
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {data.result.bio || 'No bio published yet.'}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Typography variant={{ base: 'title-3' }} color="neutral-900">
                Onboarding Context
              </Typography>
              <div className="mt-4 space-y-3">
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Headline
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {data.result.onboarding?.catchyHeadline || 'No onboarding headline.'}
                  </Typography>
                </div>
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Intro
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {data.result.onboarding?.introduceYourself || 'No onboarding introduction.'}
                  </Typography>
                </div>
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Teaching experience
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {data.result.onboarding?.teachingExperience || 'No teaching experience summary.'}
                  </Typography>
                </div>
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Motivation copy
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {data.result.onboarding?.motivatePotentialStudents || 'No motivation copy.'}
                  </Typography>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <DetailStat
              label="Onboarding lesson price"
              value={formatCurrency(data.result.onboarding?.lessonPrice ?? 0)}
            />
            <DetailStat
              label="Certifications"
              value={formatCompactNumber(data.result.onboarding?.certifications.length ?? 0)}
            />
            <DetailStat
              label="Diplomas / slots"
              value={`${data.result.onboarding?.diplomas.length ?? 0} / ${data.result.onboarding?.availabilities.length ?? 0}`}
            />
          </section>
        </>
      )}
    </div>
  );
}
