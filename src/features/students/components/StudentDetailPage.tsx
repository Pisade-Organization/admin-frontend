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
  formatDateTime,
} from '@/shared/lib/formatters';

type StudentStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

type StudentDetail = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: Exclude<StudentStatus, 'ALL'>;
  walletBalance: number;
  joinedAt: string;
  totalLessons: number;
  completedLessons: number;
  totalSpent: number;
  lastLessonAt: string | null;
  recentLessons: Array<{
    id: string;
    status: string;
    scheduledAt: string;
    price: number;
    tutor: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
  }>;
};

type StudentDetailPageProps = {
  studentId: string;
  searchParams?: {
    status?: string;
    q?: string;
    page?: string;
    notice?: string;
    error?: string;
  };
};

const statusOptions: StudentStatus[] = [
  'ALL',
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
];

function normalizeStatus(value?: string): StudentStatus {
  const normalized = value?.trim();

  return normalized && statusOptions.includes(normalized as StudentStatus)
    ? (normalized as StudentStatus)
    : 'ALL';
}

function getStatusTone(status: Exclude<StudentStatus, 'ALL'>) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-light text-green-normal';
    case 'SUSPENDED':
      return 'bg-red-light text-red-normal';
    case 'DEACTIVATED':
    default:
      return 'bg-neutral-50 text-neutral-600';
  }
}

function buildStudentListPath(searchParams?: StudentDetailPageProps['searchParams']) {
  const status = normalizeStatus(searchParams?.status);

  return buildAdminPath('/students', {
    status: status === 'ALL' ? null : status,
    q: searchParams?.q?.trim() || null,
    page:
      searchParams?.page && searchParams.page !== '1'
        ? searchParams.page
        : null,
  });
}

function buildStudentDetailPath(
  studentId: string,
  searchParams?: StudentDetailPageProps['searchParams'],
) {
  const status = normalizeStatus(searchParams?.status);

  return buildAdminPath(`/students/${studentId}`, {
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

export async function StudentDetailPage({
  studentId,
  searchParams = {},
}: StudentDetailPageProps) {
  const flashMessage = getAdminFlashMessage(searchParams);
  const backHref = buildStudentListPath(searchParams);
  const returnTo = buildStudentDetailPath(studentId, searchParams);
  const q = searchParams.q?.trim() ?? '';
  const page = parsePage(searchParams.page);

  const data = await fetchAdminApi<StudentDetail>(
    `/v1/admin/students/${studentId}`,
  )
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: null,
      error: error.message || 'Unable to load student detail.',
    }));

  async function updateStudentStatus(formData: FormData) {
    'use server';

    const userId = String(formData.get('userId') || '');
    const nextStatus = String(formData.get('status') || '');
    const currentReturnTo = String(formData.get('returnTo') || returnTo);

    if (!userId || !nextStatus) {
      redirect(appendQuery(currentReturnTo, 'error', 'Missing student status update.'));
    }

    try {
      await fetchAdminApi(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Could not update student status.';

      redirect(appendQuery(currentReturnTo, 'error', message));
    }

    revalidatePath('/students');
    revalidatePath(`/students/${studentId}`);
    redirect(
      appendQuery(
        currentReturnTo,
        'notice',
        nextStatus === 'ACTIVE'
          ? 'Student reactivated.'
          : 'Student suspended.',
      ),
    );
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
              Back to students
            </Link>
            <Typography
              variant={{ base: 'title-2', lg: 'title-1' }}
              color="neutral-900"
              className="mt-2"
            >
              Student Detail
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-500">
              Review wallet, lesson history, and account state for this student.
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
            Student detail could not be loaded.
          </Typography>
          <Typography variant={{ base: 'body-3' }} color="rose-700" className="mt-2">
            {data.error || 'The requested student record is unavailable.'}
          </Typography>
        </div>
      ) : (
        <>
          <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar
                  src={data.result.avatarUrl}
                  alt={data.result.fullName}
                  name={data.result.fullName}
                  sizeClassName="h-20 w-20"
                  textClassName="text-title-1"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Typography variant={{ base: 'title-1' }} color="neutral-900">
                      {data.result.fullName}
                    </Typography>
                    <span
                      className={`rounded-full px-3 py-1 text-label-4 ${getStatusTone(data.result.status)}`}
                    >
                      {data.result.status}
                    </span>
                  </div>
                  <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
                    {data.result.email}
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-1">
                    Joined {formatDate(data.result.joinedAt)}
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-1">
                    Last lesson {formatDateTime(data.result.lastLessonAt)}
                  </Typography>
                </div>
              </div>

              {data.result.status !== 'DEACTIVATED' ? (
                <form action={updateStudentStatus} className="lg:min-w-[260px]">
                  <input type="hidden" name="userId" value={data.result.userId} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input
                    type="hidden"
                    name="status"
                    value={data.result.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
                  >
                    {data.result.status === 'SUSPENDED'
                      ? 'Reactivate student'
                      : 'Suspend student'}
                  </button>
                </form>
              ) : (
                <div className="rounded-[20px] bg-neutral-25 px-4 py-3 lg:min-w-[260px]">
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Admin action
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    No admin action is currently defined for deactivated accounts.
                  </Typography>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            <DetailStat
              label="Wallet"
              value={formatCurrency(data.result.walletBalance)}
            />
            <DetailStat
              label="Total lessons"
              value={formatCompactNumber(data.result.totalLessons)}
            />
            <DetailStat
              label="Completed"
              value={formatCompactNumber(data.result.completedLessons)}
            />
            <DetailStat
              label="Spend"
              value={formatCurrency(data.result.totalSpent)}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Typography variant={{ base: 'title-3' }} color="neutral-900">
                Account State
              </Typography>
              <div className="mt-4 space-y-3">
                <div>
                  <Typography variant={{ base: 'label-4' }} color="neutral-500">
                    Current status
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {data.result.status}
                  </Typography>
                </div>
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
                    Last lesson
                  </Typography>
                  <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
                    {formatDateTime(data.result.lastLessonAt)}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Typography variant={{ base: 'title-3' }} color="neutral-900">
                Recent Lessons
              </Typography>
              <div className="mt-4 grid gap-3">
                {data.result.recentLessons.length ? (
                  data.result.recentLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-[20px] border border-neutral-100 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <Typography variant={{ base: 'label-3' }} color="neutral-900">
                            {lesson.status}
                          </Typography>
                          <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-1">
                            {formatDateTime(lesson.scheduledAt)} · {formatCurrency(lesson.price)}
                          </Typography>
                        </div>
                        <Link
                          href={buildAdminPath(`/tutors/${lesson.tutor.id}`, {
                            status: searchParams.status || null,
                            q: searchParams.q || null,
                            page: searchParams.page || null,
                          })}
                          className="text-label-3 text-deep-royal-indigo-500"
                        >
                          View tutor
                        </Link>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar
                          src={lesson.tutor.avatarUrl}
                          alt={lesson.tutor.fullName}
                          name={lesson.tutor.fullName}
                          sizeClassName="h-10 w-10"
                          textClassName="text-label-2"
                        />
                        <div>
                          <Typography variant={{ base: 'body-3' }} color="neutral-900">
                            {lesson.tutor.fullName}
                          </Typography>
                          <Typography variant={{ base: 'body-4' }} color="neutral-500">
                            {lesson.tutor.email}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Typography variant={{ base: 'body-3' }} color="neutral-500">
                    No recent lesson history is available for this student.
                  </Typography>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
