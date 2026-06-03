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

type StudentStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

type StudentRecord = {
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
};

type StudentsPayload = {
  students: StudentRecord[];
  total: number;
  page: number;
  totalPages: number;
};

type StudentsPageSearchParams = {
  status?: string;
  q?: string;
  page?: string;
  notice?: string;
  error?: string;
};

type StudentsPageProps = {
  searchParams?: StudentsPageSearchParams;
};

const PAGE_SIZE = 12;
const statusOptions: StudentStatus[] = [
  'ALL',
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
];

function normalizeStatus(value?: string): StudentStatus {
  return statusOptions.includes((value ?? 'ALL') as StudentStatus)
    ? (value as StudentStatus)
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

function buildStudentsPath(params: StudentsPageSearchParams) {
  const status = normalizeStatus(params.status);

  return buildAdminPath('/students', {
    status: status === 'ALL' ? null : status,
    q: params.q?.trim() || null,
    page: params.page && params.page !== '1' ? params.page : null,
    notice: params.notice,
    error: params.error,
  });
}

export async function StudentsPage({ searchParams = {} }: StudentsPageProps) {
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

  const data = await fetchAdminApi<StudentsPayload>(
    `/v1/admin/students?${apiParams.toString()}`,
  )
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: { students: [], total: 0, page, totalPages: 0 },
      error: error.message || 'Unable to load students.',
    }));

  async function updateStudentStatus(formData: FormData) {
    'use server';

    const userId = String(formData.get('userId') || '');
    const nextStatus = String(formData.get('status') || '');
    const returnTo = String(formData.get('returnTo') || '/students');

    if (!userId || !nextStatus) {
      redirect(appendQuery(returnTo, 'error', 'Missing student status update.'));
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

      redirect(appendQuery(returnTo, 'error', message));
    }

    revalidatePath('/students');
    redirect(
      appendQuery(
        returnTo,
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Typography
                variant={{ base: 'title-2', lg: 'title-1' }}
                color="neutral-900"
              >
                Students
              </Typography>
              <Typography variant={{ base: 'body-3' }} color="neutral-500">
                Monitor account health, activity, and wallet balance for paying users.
              </Typography>
            </div>
            <div className="rounded-[20px] bg-neutral-25 px-4 py-3">
              <Typography variant={{ base: 'label-4' }} color="neutral-500">
                Matching students
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

          <form action="/students" className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <input type="hidden" name="page" value="1" />
            <label className="flex flex-col gap-2">
              <span className="text-label-4 text-neutral-500">
                Search name or email
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search students"
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
                    {option === 'ALL' ? 'All' : option}
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
          text={`Students failed to load: ${data.error}`}
        />
      ) : null}

      {data.result.students.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.result.students.map((student) => {
              const returnTo = buildStudentsPath({
                status,
                q,
                page: String(page),
              });
              const detailHref = buildAdminPath(`/students/${student.id}`, {
                status: status === 'ALL' ? null : status,
                q: q || null,
                page: String(page),
              });
              const nextStatus =
                student.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
              const canUpdateStatus = student.status !== 'DEACTIVATED';

              return (
                <article
                  key={student.id}
                  className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={student.avatarUrl}
                        alt={student.fullName}
                        name={student.fullName}
                        sizeClassName="h-14 w-14"
                        textClassName="text-title-2"
                      />
                      <div>
                        <Typography
                          variant={{ base: 'title-2' }}
                          color="neutral-900"
                        >
                          {student.fullName}
                        </Typography>
                        <Typography variant={{ base: 'body-3' }} color="neutral-500">
                          {student.email}
                        </Typography>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-label-4 ${getStatusTone(student.status)}`}
                    >
                      {student.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-[20px] bg-neutral-25 p-4">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Wallet
                      </Typography>
                      <Typography
                        variant={{ base: 'title-2' }}
                        color="neutral-900"
                        className="mt-1"
                      >
                        {formatCurrency(student.walletBalance)}
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
                        {formatCompactNumber(student.totalLessons)}
                      </Typography>
                    </div>
                    <div className="rounded-[20px] bg-neutral-25 p-4">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Completed
                      </Typography>
                      <Typography
                        variant={{ base: 'title-2' }}
                        color="neutral-900"
                        className="mt-1"
                      >
                        {formatCompactNumber(student.completedLessons)}
                      </Typography>
                    </div>
                    <div className="rounded-[20px] bg-neutral-25 p-4">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Spend
                      </Typography>
                      <Typography
                        variant={{ base: 'title-2' }}
                        color="neutral-900"
                        className="mt-1"
                      >
                        {formatCurrency(student.totalSpent)}
                      </Typography>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                      <Typography variant={{ base: 'label-4' }} color="neutral-500">
                        Joined
                      </Typography>
                      <Typography variant={{ base: 'body-3' }} color="neutral-800">
                        {formatDate(student.joinedAt)}
                      </Typography>
                      <Typography variant={{ base: 'body-4' }} color="neutral-400">
                        Last lesson: {formatDate(student.lastLessonAt)}
                      </Typography>
                      <Link
                        href={detailHref}
                        className="inline-flex text-label-3 text-deep-royal-indigo-500"
                      >
                        View details
                      </Link>
                    </div>

                    {canUpdateStatus ? (
                      <form action={updateStudentStatus}>
                        <input type="hidden" name="userId" value={student.userId} />
                        <input type="hidden" name="status" value={nextStatus} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button
                          type="submit"
                          className="rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
                        >
                          {student.status === 'SUSPENDED'
                            ? 'Reactivate'
                            : 'Suspend'}
                        </button>
                      </form>
                    ) : (
                      <Typography variant={{ base: 'body-4' }} color="neutral-500">
                        No admin action defined for deactivated accounts.
                      </Typography>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <AdminPagination
            page={data.result.page}
            totalPages={data.result.totalPages}
            buildHref={(nextPage) =>
              buildStudentsPath({
                status,
                q,
                page: String(nextPage),
              })
            }
          />
        </>
      ) : data.error ? null : (
        <AdminEmptyState
          title="No students match the current filters."
          description="Try a different status or search term."
        />
      )}
    </div>
  );
}
