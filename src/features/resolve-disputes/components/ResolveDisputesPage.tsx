import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Avatar from '@/shared/components/base/Avatar';
import Typography from '@/shared/components/base/Typography';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import { formatCompactNumber, formatDateTime } from '@/shared/lib/formatters';

type DisputeStatus = 'OPEN' | 'BLOCKED' | 'ALL';

type DisputeRecord = {
  id: string;
  reporter: {
    id: string;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'TUTOR' | 'ADMIN' | 'MANAGER';
    avatarUrl: string | null;
    tutorId: string | null;
  };
  reportedUser: {
    id: string;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'TUTOR' | 'ADMIN' | 'MANAGER';
    avatarUrl: string | null;
    tutorId: string | null;
  };
  reportedAt: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
  lessonId: string | null;
  status: 'OPEN' | 'BLOCKED';
};

type DisputesPayload = {
  disputes: DisputeRecord[];
  total: number;
  page: number;
  totalPages: number;
};

type ResolveDisputesSearchParams = {
  status?: string;
  confirmBlock?: string;
  notice?: string;
  error?: string;
};

type ResolveDisputesPageProps = {
  searchParams?: ResolveDisputesSearchParams;
};

const statusOptions: DisputeStatus[] = ['OPEN', 'BLOCKED', 'ALL'];

function normalizeStatus(value?: string): DisputeStatus {
  return statusOptions.includes((value ?? 'OPEN') as DisputeStatus)
    ? (value as DisputeStatus)
    : 'OPEN';
}

function buildPageHref(params: ResolveDisputesSearchParams) {
  const search = new URLSearchParams();
  const status = normalizeStatus(params.status);

  if (status !== 'OPEN') {
    search.set('status', status);
  }

  if (params.confirmBlock) {
    search.set('confirmBlock', params.confirmBlock);
  }

  if (params.notice) {
    search.set('notice', params.notice);
  }

  if (params.error) {
    search.set('error', params.error);
  }

  const query = search.toString();
  return query ? `/resolve-disputes?${query}` : '/resolve-disputes';
}

function buildStatusHref(status: DisputeStatus) {
  return status === 'OPEN'
    ? '/resolve-disputes'
    : `/resolve-disputes?status=${status}`;
}

function appendQuery(url: string, key: string, value: string) {
  return `${url}${url.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;
}

export async function ResolveDisputesPage({
  searchParams = {},
}: ResolveDisputesPageProps) {
  const status = normalizeStatus(searchParams.status);
  const data = await fetchAdminApi<DisputesPayload>(
    `/v1/admin/disputes?status=${status}&limit=100&page=1`,
  )
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: { disputes: [], total: 0, page: 1, totalPages: 0 },
      error: error.message || 'Unable to load dispute records.',
    }));

  async function resolveDispute(formData: FormData) {
    'use server';

    const disputeId = String(formData.get('disputeId') || '');
    const action = String(formData.get('action') || '');
    const returnStatus = normalizeStatus(String(formData.get('status') || 'OPEN'));
    const returnUrl = buildStatusHref(returnStatus);

    if (!disputeId || !action) {
      redirect(appendQuery(returnUrl, 'error', 'Missing dispute action'));
    }

    try {
      await fetchAdminApi(`/v1/admin/disputes/${disputeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update dispute.';
      redirect(appendQuery(returnUrl, 'error', message));
    }

    revalidatePath('/resolve-disputes');
    const notice =
      action === 'dismiss'
        ? 'Report dismissed.'
        : 'Reported user blocked for this conversation.';
    redirect(appendQuery(returnUrl, 'notice', notice));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
              Resolve Disputes
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
              Review reported chat conversations, inspect recent message context, and block or dismiss from the admin queue.
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = option === status;

              return (
                <Link
                  key={option}
                  href={buildStatusHref(option)}
                  className={`rounded-2xl px-4 py-3 text-label-3 transition-colors ${
                    isActive
                      ? 'bg-deep-royal-indigo-500 text-white'
                      : 'border border-neutral-100 text-neutral-700'
                  }`}
                >
                  {option === 'ALL' ? 'All records' : option}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {searchParams.notice ? (
        <div className="rounded-[24px] border border-green-200 bg-green-light p-4">
          <Typography variant={{ base: 'body-3' }} color="green-normal">
            {searchParams.notice}
          </Typography>
        </div>
      ) : null}

      {searchParams.error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-light p-4">
          <Typography variant={{ base: 'body-3' }} color="red-normal">
            {searchParams.error}
          </Typography>
        </div>
      ) : null}

      {data.error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-light p-4">
          <Typography variant={{ base: 'body-3' }} color="red-normal">
            Disputes failed to load: {data.error}
          </Typography>
        </div>
      ) : null}

      {data.result.disputes.length ? (
        <div className="grid gap-4">
          {data.result.disputes.map((dispute) => {
            const confirmHref = buildPageHref({
              status,
              confirmBlock: dispute.id,
            });
            const cancelConfirmHref = buildStatusHref(status);
            const isConfirmingBlock = searchParams.confirmBlock === dispute.id;

            return (
              <article
                key={dispute.id}
                className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid flex-1 gap-4 lg:grid-cols-2">
                    {[dispute.reporter, dispute.reportedUser].map((person, index) => (
                      <div key={person.id} className="rounded-[20px] bg-neutral-25 p-4">
                        <Typography variant={{ base: 'label-4' }} color="neutral-500">
                          {index === 0 ? 'Reporter' : 'Reported user'}
                        </Typography>
                        <div className="mt-3 flex items-center gap-3">
                          <Avatar
                            src={person.avatarUrl}
                            alt={person.fullName}
                            name={person.fullName}
                            sizeClassName="h-12 w-12"
                            textClassName="text-title-3"
                          />
                          <div>
                            <Typography variant={{ base: 'title-3' }} color="neutral-900">
                              {person.fullName}
                            </Typography>
                            <Typography variant={{ base: 'body-4' }} color="neutral-500">
                              {person.email}
                            </Typography>
                            <Typography variant={{ base: 'label-4' }} color="neutral-700">
                              {person.role}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`min-w-64 rounded-[20px] p-4 ${
                      dispute.status === 'BLOCKED'
                        ? 'bg-electric-violet-50'
                        : 'bg-orange-light'
                    }`}
                  >
                    <Typography
                      variant={{ base: 'label-4' }}
                      color={
                        dispute.status === 'BLOCKED'
                          ? 'electric-violet-500'
                          : 'orange-normal'
                      }
                    >
                      {dispute.status === 'BLOCKED' ? 'Blocked history' : 'Reported'}
                    </Typography>
                    <Typography variant={{ base: 'title-3' }} color="neutral-900" className="mt-2">
                      {formatDateTime(dispute.reportedAt ?? dispute.createdAt)}
                    </Typography>
                    <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                      Record created {formatDateTime(dispute.createdAt)}
                    </Typography>
                    <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                      {formatCompactNumber(dispute.messageCount)} linked messages
                    </Typography>
                    {dispute.lessonId ? (
                      <Typography variant={{ base: 'body-4' }} color="neutral-500" className="mt-1">
                        Related lesson {dispute.lessonId}
                      </Typography>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] bg-neutral-25 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <Typography variant={{ base: 'title-3' }} color="neutral-900">
                      Latest Message Context
                    </Typography>
                    <Typography variant={{ base: 'body-4' }} color="neutral-400">
                      {formatDateTime(dispute.lastMessageAt)}
                    </Typography>
                  </div>
                  <Typography variant={{ base: 'body-3' }} color="neutral-600" className="mt-3">
                    {dispute.lastMessagePreview ?? 'No recent message preview is available for this conversation.'}
                  </Typography>
                </div>

                {dispute.status === 'OPEN' ? (
                  <div className="mt-5 flex flex-col gap-3 lg:flex-row">
                    <form action={resolveDispute}>
                      <input type="hidden" name="disputeId" value={dispute.id} />
                      <input type="hidden" name="action" value="dismiss" />
                      <input type="hidden" name="status" value={status} />
                      <button
                        type="submit"
                        className="rounded-2xl border border-neutral-100 px-4 py-3 text-label-3 text-neutral-700"
                      >
                        Dismiss report
                      </button>
                    </form>

                    {isConfirmingBlock ? (
                      <div className="flex flex-col gap-3 rounded-[20px] border border-red-200 bg-red-light p-4 lg:flex-row lg:items-center">
                        <Typography variant={{ base: 'body-3' }} color="red-normal">
                          Confirm block for {dispute.reportedUser.fullName}. This clears the report and blocks the user for the reporter conversation.
                        </Typography>
                        <div className="flex gap-3">
                          <form action={resolveDispute}>
                            <input type="hidden" name="disputeId" value={dispute.id} />
                            <input
                              type="hidden"
                              name="action"
                              value="block_reported_user"
                            />
                            <input type="hidden" name="status" value={status} />
                            <button
                              type="submit"
                              className="rounded-2xl bg-red-normal px-4 py-3 text-label-3 text-white"
                            >
                              Confirm block
                            </button>
                          </form>
                          <Link
                            href={cancelConfirmHref}
                            className="rounded-2xl border border-red-200 px-4 py-3 text-label-3 text-red-normal"
                          >
                            Cancel
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={confirmHref}
                        className="rounded-2xl bg-red-normal px-4 py-3 text-center text-label-3 text-white"
                      >
                        Block reported user
                      </Link>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-neutral-100 bg-white p-10 text-center">
          <Typography variant={{ base: 'title-2' }} color="neutral-800">
            {status === 'BLOCKED' ? 'No blocked disputes' : 'No open disputes'}
          </Typography>
          <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
            {status === 'BLOCKED'
              ? 'There are no blocked conversation records in the current history view.'
              : 'There are no reported conversations waiting for review.'}
          </Typography>
        </div>
      )}
    </div>
  );
}
