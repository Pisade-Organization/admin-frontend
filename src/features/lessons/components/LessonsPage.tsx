import Link from 'next/link';
import Typography from '@/shared/components/base/Typography';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import {
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
} from '@/shared/lib/formatters';

type LessonStatus =
  | 'ALL'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

type LessonSummary = {
  id: string;
  scheduledAt: string;
  endAt: string;
  timezone: string;
  duration: number;
  status: Exclude<LessonStatus, 'ALL'>;
  price: number;
  paymentIntentId: string | null;
  paidTxnId: string | null;
  meetLink: string | null;
  tutor: {
    user: {
      email: string;
      profile: {
        fullName: string | null;
        avatarUrl: string | null;
      } | null;
    };
  };
  student: {
    user: {
      email: string;
      profile: {
        fullName: string | null;
        avatarUrl: string | null;
      } | null;
    };
  };
  _count: {
    messages: number;
    materials: number;
  };
};

type LessonDetail = {
  id: string;
  scheduledAt: string;
  endAt: string;
  timezone: string;
  duration: number;
  status: Exclude<LessonStatus, 'ALL'>;
  price: number;
  paymentIntentId: string | null;
  paidTxnId: string | null;
  meetLink: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  rescheduledAt: string | null;
  rescheduledBy: string | null;
  tutor: LessonSummary['tutor'];
  student: LessonSummary['student'];
  materials: Array<{
    id: string;
    fileUrl: string;
    uploadedBy: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    content: string | null;
    type: string;
    createdAt: string;
    sender: {
      email: string;
      profile: {
        fullName: string | null;
      } | null;
    };
  }>;
  totals: {
    messageCount: number;
    materialCount: number;
  };
  paymentTransaction: null | {
    id: string;
    status: string;
    type: string;
    amount: number;
    fee: number;
    reference: string | null;
    providerRef: string | null;
    createdAt: string;
  };
};

type LessonsPayload = {
  lessons: LessonSummary[];
  total: number;
  page: number;
  totalPages: number;
};

type LessonsSearchParams = {
  status?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  lessonId?: string;
};

type LessonsPageProps = {
  searchParams?: LessonsSearchParams;
};

const statusOptions: LessonStatus[] = [
  'ALL',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
];

function normalizeStatus(value?: string): LessonStatus {
  return statusOptions.includes((value ?? 'ALL') as LessonStatus)
    ? (value as LessonStatus)
    : 'ALL';
}

function getStatusTone(status: Exclude<LessonStatus, 'ALL'>) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-blue-light text-blue-normal';
    case 'COMPLETED':
      return 'bg-green-light text-green-normal';
    case 'CANCELLED':
      return 'bg-red-light text-red-normal';
    case 'EXPIRED':
      return 'bg-neutral-50 text-neutral-600';
    case 'PENDING_PAYMENT':
    default:
      return 'bg-orange-light text-orange-normal';
  }
}

function getParticipantName(user: LessonSummary['tutor']['user']) {
  return user.profile?.fullName ?? user.email;
}

function buildLessonsPath(searchParams: LessonsSearchParams) {
  const params = new URLSearchParams();
  const status = normalizeStatus(searchParams.status);

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (searchParams.q?.trim()) {
    params.set('q', searchParams.q.trim());
  }

  if (searchParams.dateFrom) {
    params.set('dateFrom', searchParams.dateFrom);
  }

  if (searchParams.dateTo) {
    params.set('dateTo', searchParams.dateTo);
  }

  if (searchParams.lessonId) {
    params.set('lessonId', searchParams.lessonId);
  }

  const query = params.toString();
  return query ? `/lessons?${query}` : '/lessons';
}

async function getLessonsData(searchParams: LessonsSearchParams) {
  const params = new URLSearchParams();
  const status = normalizeStatus(searchParams.status);

  params.set('status', status);
  params.set('limit', '100');
  params.set('page', '1');

  if (searchParams.q?.trim()) {
    params.set('q', searchParams.q.trim());
  }

  if (searchParams.dateFrom) {
    params.set('dateFrom', searchParams.dateFrom);
  }

  if (searchParams.dateTo) {
    params.set('dateTo', searchParams.dateTo);
  }

  const [listResult, selectedLesson] = await Promise.all([
    fetchAdminApi<LessonsPayload>(`/v1/admin/lessons?${params.toString()}`)
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: Error) => ({
        data: { lessons: [], total: 0, page: 1, totalPages: 0 },
        error: error.message || 'Unable to load lessons.',
      })),
    searchParams.lessonId
      ? fetchAdminApi<LessonDetail>(`/v1/admin/lessons/${searchParams.lessonId}`)
          .then((data) => ({ data, error: null as string | null }))
          .catch((error: Error) => ({
            data: null,
            error: error.message || 'Unable to load lesson detail.',
          }))
      : Promise.resolve({ data: null, error: null as string | null }),
  ]);

  return {
    list: listResult.data,
    listError: listResult.error,
    selectedLesson: selectedLesson.data,
    selectedLessonError: selectedLesson.error,
    status,
  };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-neutral-25 p-4">
      <Typography variant={{ base: 'label-4' }} color="neutral-500">
        {label}
      </Typography>
      <Typography variant={{ base: 'body-3' }} color="neutral-800" className="mt-1">
        {value}
      </Typography>
    </div>
  );
}

export async function LessonsPage({ searchParams = {} }: LessonsPageProps) {
  const { list, listError, selectedLesson, selectedLessonError, status } =
    await getLessonsData(searchParams);
  const currentPath = buildLessonsPath(searchParams);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4">
          <div>
            <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
              Lessons
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
              Review scheduling, meeting readiness, payment references, and lesson-level message activity.
            </Typography>
          </div>

          <form action="/lessons" className="grid gap-3 lg:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))_auto_auto]">
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Search by lesson, tutor, or student"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? 'All statuses' : option}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="dateFrom"
              defaultValue={searchParams.dateFrom ?? ''}
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <input
              type="date"
              name="dateTo"
              defaultValue={searchParams.dateTo ?? ''}
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
            >
              Apply
            </button>
            <Link
              href="/lessons"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-center text-label-3 text-neutral-700"
            >
              Reset
            </Link>
          </form>
        </div>
      </section>

      {listError ? (
        <section className="rounded-[24px] border border-red-200 bg-red-light p-4">
          <Typography variant={{ base: 'body-3' }} color="red-normal">
            Lessons failed to load: {listError}
          </Typography>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
              Lesson Queue
            </Typography>
            <Typography variant={{ base: 'label-3' }} color="neutral-500">
              {formatCompactNumber(list.total)} lessons
            </Typography>
          </div>

          <div className="space-y-3">
            {list.lessons.length ? (
              list.lessons.map((lesson) => {
                const params = new URLSearchParams();

                if (status !== 'ALL') {
                  params.set('status', status);
                }

                if (searchParams.q?.trim()) {
                  params.set('q', searchParams.q.trim());
                }

                if (searchParams.dateFrom) {
                  params.set('dateFrom', searchParams.dateFrom);
                }

                if (searchParams.dateTo) {
                  params.set('dateTo', searchParams.dateTo);
                }

                params.set('lessonId', lesson.id);

                return (
                  <Link
                    key={lesson.id}
                    href={`/lessons?${params.toString()}`}
                    className={`block rounded-[22px] border p-4 transition-colors ${
                      searchParams.lessonId === lesson.id
                        ? 'border-deep-royal-indigo-200 bg-deep-royal-indigo-50'
                        : 'border-neutral-100 bg-neutral-25 hover:border-deep-royal-indigo-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Typography variant={{ base: 'title-3' }} color="neutral-900">
                          {getParticipantName(lesson.student.user)} with {getParticipantName(lesson.tutor.user)}
                        </Typography>
                        <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                          Lesson {lesson.id}
                        </Typography>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-label-4 ${getStatusTone(lesson.status)}`}>
                        {lesson.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-4">
                      <DetailRow label="Scheduled" value={formatDateTime(lesson.scheduledAt)} />
                      <DetailRow label="Price" value={formatCurrency(lesson.price)} />
                      <DetailRow
                        label="Messages"
                        value={formatCompactNumber(lesson._count.messages)}
                      />
                      <DetailRow
                        label="Materials"
                        value={formatCompactNumber(lesson._count.materials)}
                      />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-neutral-100 bg-neutral-25 p-8 text-center">
                <Typography variant={{ base: 'title-3' }} color="neutral-800">
                  No lessons found
                </Typography>
                <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
                  Adjust the status, date range, or participant search filters.
                </Typography>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
              Lesson Detail
            </Typography>
            {selectedLesson ? (
              <Link
                href={currentPath.replace(/([?&])lessonId=[^&]+&?/, '$1').replace(/[?&]$/, '') || '/lessons'}
                className="rounded-2xl border border-neutral-100 px-3 py-2 text-label-4 text-neutral-700"
              >
                Clear
              </Link>
            ) : null}
          </div>

          {selectedLessonError ? (
            <div className="mt-4 rounded-[20px] border border-red-200 bg-red-light p-4">
              <Typography variant={{ base: 'body-3' }} color="red-normal">
                Lesson detail failed to load: {selectedLessonError}
              </Typography>
            </div>
          ) : null}

          {selectedLesson ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[22px] bg-neutral-25 p-4">
                <Typography variant={{ base: 'title-3' }} color="neutral-900">
                  {getParticipantName(selectedLesson.student.user)} with{' '}
                  {getParticipantName(selectedLesson.tutor.user)}
                </Typography>
                <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                  {selectedLesson.student.user.email} · {selectedLesson.tutor.user.email}
                </Typography>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <DetailRow label="Scheduled" value={formatDateTime(selectedLesson.scheduledAt)} />
                <DetailRow label="Ends" value={formatDateTime(selectedLesson.endAt)} />
                <DetailRow label="Duration" value={`${selectedLesson.duration} minutes`} />
                <DetailRow label="Timezone" value={selectedLesson.timezone} />
                <DetailRow label="Status" value={selectedLesson.status} />
                <DetailRow label="Price" value={formatCurrency(selectedLesson.price)} />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <DetailRow
                  label="Meeting Link"
                  value={selectedLesson.meetLink ?? 'Not created yet'}
                />
                <DetailRow
                  label="Payment Intent"
                  value={selectedLesson.paymentIntentId ?? 'Not attached'}
                />
                <DetailRow
                  label="Messages"
                  value={formatCompactNumber(selectedLesson.totals.messageCount)}
                />
                <DetailRow
                  label="Materials"
                  value={formatCompactNumber(selectedLesson.totals.materialCount)}
                />
              </div>

              <div className="rounded-[22px] bg-neutral-25 p-4">
                <Typography variant={{ base: 'title-3' }} color="neutral-900">
                  Payment
                </Typography>
                {selectedLesson.paymentTransaction ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <DetailRow
                      label="Transaction"
                      value={selectedLesson.paymentTransaction.id}
                    />
                    <DetailRow
                      label="Status"
                      value={selectedLesson.paymentTransaction.status}
                    />
                    <DetailRow
                      label="Reference"
                      value={
                        selectedLesson.paymentTransaction.reference ??
                        selectedLesson.paymentTransaction.providerRef ??
                        '—'
                      }
                    />
                    <DetailRow
                      label="Created"
                      value={formatDateTime(selectedLesson.paymentTransaction.createdAt)}
                    />
                  </div>
                ) : (
                  <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-3">
                    No payment transaction is linked to this lesson yet.
                  </Typography>
                )}
              </div>

              {selectedLesson.cancelledAt || selectedLesson.rescheduledAt ? (
                <div className="rounded-[22px] bg-neutral-25 p-4">
                  <Typography variant={{ base: 'title-3' }} color="neutral-900">
                    Schedule Changes
                  </Typography>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <DetailRow
                      label="Cancelled"
                      value={formatDateTime(selectedLesson.cancelledAt)}
                    />
                    <DetailRow
                      label="Cancelled By"
                      value={selectedLesson.cancelledBy ?? '—'}
                    />
                    <DetailRow
                      label="Rescheduled"
                      value={formatDateTime(selectedLesson.rescheduledAt)}
                    />
                    <DetailRow
                      label="Rescheduled By"
                      value={selectedLesson.rescheduledBy ?? '—'}
                    />
                  </div>
                  {selectedLesson.cancelReason ? (
                    <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-3">
                      Reason: {selectedLesson.cancelReason}
                    </Typography>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-[22px] bg-neutral-25 p-4">
                <Typography variant={{ base: 'title-3' }} color="neutral-900">
                  Recent Messages
                </Typography>
                <div className="mt-3 space-y-3">
                  {selectedLesson.messages.length ? (
                    selectedLesson.messages.map((message) => (
                      <div key={message.id} className="rounded-[18px] bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <Typography variant={{ base: 'label-3' }} color="neutral-800">
                            {message.sender.profile?.fullName ?? message.sender.email}
                          </Typography>
                          <Typography variant={{ base: 'body-4' }} color="neutral-400">
                            {formatDateTime(message.createdAt)}
                          </Typography>
                        </div>
                        <Typography variant={{ base: 'body-3' }} color="neutral-600" className="mt-2">
                          {message.content ?? 'Sent an attachment'}
                        </Typography>
                      </div>
                    ))
                  ) : (
                    <Typography variant={{ base: 'body-3' }} color="neutral-500">
                      No lesson-linked messages were found.
                    </Typography>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] bg-neutral-25 p-4">
                <Typography variant={{ base: 'title-3' }} color="neutral-900">
                  Materials
                </Typography>
                <div className="mt-3 space-y-3">
                  {selectedLesson.materials.length ? (
                    selectedLesson.materials.map((material) => (
                      <a
                        key={material.id}
                        href={material.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-[18px] bg-white p-4"
                      >
                        <Typography variant={{ base: 'label-3' }} color="neutral-800">
                          {material.uploadedBy}
                        </Typography>
                        <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                          Uploaded {formatDateTime(material.createdAt)}
                        </Typography>
                      </a>
                    ))
                  ) : (
                    <Typography variant={{ base: 'body-3' }} color="neutral-500">
                      No materials uploaded for this lesson.
                    </Typography>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[22px] border border-dashed border-neutral-100 bg-neutral-25 p-8 text-center">
              <Typography variant={{ base: 'title-3' }} color="neutral-800">
                Select a lesson
              </Typography>
              <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
                Pick a lesson from the queue to inspect scheduling, payments, messages, and materials.
              </Typography>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
