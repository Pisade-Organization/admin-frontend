import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Avatar from '@/shared/components/base/Avatar';
import Typography from '@/shared/components/base/Typography';
import AdminEmptyState from '@/shared/components/admin/AdminEmptyState';
import AdminFlashBanner from '@/shared/components/admin/AdminFlashBanner';
import AdminPagination from '@/shared/components/admin/AdminPagination';
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

type TutorRecord = {
  id: string;
  status: Exclude<TutorStatus, 'ALL'>;
  tutorRanking: TutorRanking;
  baseRate: number;
  joinedAt: string;
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
  wallet: {
    balance: number;
  } | null;
};

type TutorsPayload = {
  tutors: TutorRecord[];
  total: number;
  page: number;
  totalPages: number;
};

type TutorsPageSearchParams = {
  status?: string;
  q?: string;
  page?: string;
  notice?: string;
  error?: string;
};

type TutorsPageProps = {
  searchParams?: TutorsPageSearchParams;
};

const PAGE_SIZE = 12;

const statusOptions: TutorStatus[] = [
  'ALL',
  'REVIEWING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'DRAFT',
];

const rankingOptions: TutorRanking[] = ['STARTER', 'PRO', 'MASTER'];

function normalizeStatus(value?: string): TutorStatus {
  return statusOptions.includes((value ?? 'ALL') as TutorStatus)
    ? (value as TutorStatus)
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

function buildTutorsPath(params: TutorsPageSearchParams) {
  const status = normalizeStatus(params.status);

  return buildAdminPath('/tutors', {
    status: status === 'ALL' ? null : status,
    q: params.q?.trim() || null,
    page: params.page && params.page !== '1' ? params.page : null,
    notice: params.notice,
    error: params.error,
  });
}

export async function TutorsPage({ searchParams = {} }: TutorsPageProps) {
  const status = normalizeStatus(searchParams.status);
  const q = searchParams.q?.trim() ?? '';
  const page = parsePage(searchParams.page);
  const flashMessage = getAdminFlashMessage(searchParams);
  const apiParams = new URLSearchParams({
    status,
    limit: String(PAGE_SIZE),
    page: String(page),
  });

  if (q) {
    apiParams.set('q', q);
  }

  const data = await fetchAdminApi<TutorsPayload>(
    `/v1/admin/tutors?${apiParams.toString()}`,
  )
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: { tutors: [], total: 0, page, totalPages: 0 },
      error: error.message || 'Unable to load tutors.',
    }));

  async function updateTutorStatus(formData: FormData) {
    'use server';

    const tutorId = String(formData.get('tutorId') || '');
    const nextStatus = String(formData.get('status') || '');
    const returnTo = String(formData.get('returnTo') || '/tutors');

    if (!tutorId || !nextStatus) {
      redirect(appendQuery(returnTo, 'error', 'Missing tutor status update.'));
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

      redirect(appendQuery(returnTo, 'error', message));
    }

    revalidatePath('/tutors');
    revalidatePath('/applications');
    redirect(
      appendQuery(
        returnTo,
        'notice',
        nextStatus === 'APPROVED'
          ? 'Tutor re-approved.'
          : 'Tutor suspended.',
      ),
    );
  }

  async function updateTutorRanking(formData: FormData) {
    'use server';

    const tutorId = String(formData.get('tutorId') || '');
    const ranking = String(formData.get('ranking') || '');
    const returnTo = String(formData.get('returnTo') || '/tutors');

    if (!tutorId || !ranking) {
      redirect(appendQuery(returnTo, 'error', 'Missing tutor ranking update.'));
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

      redirect(appendQuery(returnTo, 'error', message));
    }

    revalidatePath('/tutors');
    redirect(appendQuery(returnTo, 'notice', 'Tutor ranking updated.'));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Typography
                variant={{ base: 'title-2', lg: 'title-1' }}
                color="neutral-900"
              >
                Tutors
              </Typography>
              <Typography variant={{ base: 'body-3' }} color="neutral-500">
                Review tutor health, ranking, approval state, and wallet exposure.
              </Typography>
            </div>
            <div className="rounded-[20px] bg-neutral-25 px-4 py-3">
              <Typography variant={{ base: 'label-4' }} color="neutral-500">
                Matching tutors
              </Typography>
              <Typography
                variant={{ base: 'title-3' }}
                color="neutral-900"
                className="mt-1"
              >
                {formatCompactNumber(data.result.total)}
              </Typography>
            </div>
          </div>

          <form action="/tutors" className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <input type="hidden" name="page" value="1" />
            <label className="flex flex-col gap-2">
              <span className="text-label-4 text-neutral-500">
                Search name, email, or subject
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search tutors"
                className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-label-4 text-neutral-500">Status</span>
              <select
                name="status"
                defaultValue={status}
                className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'ALL' ? 'All' : formatStatusLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white lg:self-end"
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      {flashMessage ? (
        <AdminFlashBanner tone={flashMessage.tone} text={flashMessage.text} />
      ) : null}

      {data.error ? (
        <AdminFlashBanner
          tone="error"
          text={`Tutors failed to load: ${data.error}`}
        />
      ) : null}

      {data.result.tutors.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.result.tutors.map((tutor) => {
              const fullName = tutor.user.profile?.fullName ?? tutor.user.email;
              const subject = tutor.subjects[0]?.subject.name ?? 'No subject set';
              const returnTo = buildTutorsPath({
                status,
                q,
                page: String(page),
              });
              const detailHref = buildAdminPath(`/tutors/${tutor.id}`, {
                status: status === 'ALL' ? null : status,
                q: q || null,
                page: String(page),
              });
              const nextStatus =
                tutor.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';

              return (
                <article
                  key={tutor.id}
                  className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={tutor.user.profile?.avatarUrl}
                        alt={fullName}
                        name={fullName}
                        sizeClassName="h-14 w-14"
                        textClassName="text-title-2"
                      />
                      <div>
                        <Typography
                          variant={{ base: 'title-2' }}
                          color="neutral-900"
                        >
                          {fullName}
                        </Typography>
                        <Typography variant={{ base: 'body-3' }} color="neutral-500">
                          {subject}
                        </Typography>
                        <Typography variant={{ base: 'body-4' }} color="neutral-400">
                          {tutor.user.email}
                        </Typography>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-label-4 ${getStatusTone(tutor.status)}`}
                    >
                      {formatStatusLabel(tutor.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-[20px] bg-neutral-25 p-4">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Rating
                      </Typography>
                      <Typography
                        variant={{ base: 'title-2' }}
                        color="neutral-900"
                        className="mt-1"
                      >
                        {tutor.stats?.avgRating?.toFixed(1) ?? '0.0'}
                      </Typography>
                    </div>
                    <div className="rounded-[20px] bg-neutral-25 p-4">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Students
                      </Typography>
                      <Typography
                        variant={{ base: 'title-2' }}
                        color="neutral-900"
                        className="mt-1"
                      >
                        {formatCompactNumber(tutor.stats?.studentsCount ?? 0)}
                      </Typography>
                    </div>
                    <div className="rounded-[20px] bg-neutral-25 p-4">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Lessons
                      </Typography>
                      <Typography
                        variant={{ base: 'title-2' }}
                        color="neutral-900"
                        className="mt-1"
                      >
                        {formatCompactNumber(tutor.stats?.lessonsCount ?? 0)}
                      </Typography>
                    </div>
                    <div className="rounded-[20px] bg-neutral-25 p-4">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Wallet
                      </Typography>
                      <Typography
                        variant={{ base: 'title-2' }}
                        color="neutral-900"
                        className="mt-1"
                      >
                        {formatCurrency(tutor.wallet?.balance ?? 0)}
                      </Typography>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Joined
                      </Typography>
                      <Typography variant={{ base: 'body-3' }} color="neutral-800">
                        {formatDate(tutor.joinedAt)}
                      </Typography>
                      <Link
                        href={detailHref}
                        className="inline-flex text-label-3 text-deep-royal-indigo-500"
                      >
                        View details
                      </Link>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row">
                      <form
                        action={updateTutorRanking}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="tutorId" value={tutor.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <select
                          name="ranking"
                          defaultValue={tutor.tutorRanking}
                          className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700"
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
                        <input type="hidden" name="tutorId" value={tutor.id} />
                        <input type="hidden" name="status" value={nextStatus} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button
                          type="submit"
                          className="rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
                        >
                          {tutor.status === 'SUSPENDED'
                            ? 'Re-approve'
                            : 'Suspend'}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <AdminPagination
            page={data.result.page}
            totalPages={data.result.totalPages}
            buildHref={(nextPage) =>
              buildTutorsPath({
                status,
                q,
                page: String(nextPage),
              })
            }
          />
        </>
      ) : data.error ? null : (
        <AdminEmptyState
          title="No tutors match the current filters."
          description="Try a different status or search term."
        />
      )}
    </div>
  );
}
