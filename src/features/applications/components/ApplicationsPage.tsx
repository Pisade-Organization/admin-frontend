import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Typography from '@/shared/components/base/Typography';
import ApplicationsHeader from './applications-header/applications-header';
import ApplicationsControls from './applications-header/applications-controls';
import ApplicationsTabs from './applications-header/applications-tabs';
import ApplicationCard from './application-card';
import ApplicationsRealtimeListener from './ApplicationsRealtimeListener';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import {
  ApplicationsSearchParams,
  formatStatusLabel,
  getTutorApplications,
  parseApplicationSort,
  parseApplicationStatus,
} from './applications.data';
import {
  buildApplicationsHref,
  getApplicationsFlashMessage,
} from './applications.helpers';
import { TutorStatus } from './applications.types';

type ApplicationsPageProps = {
  searchParams: ApplicationsSearchParams;
};

// HI
const visibleStatuses: TutorStatus[] = ['REVIEWING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

function getStatusUpdatePath(tutorId: string, nextStatus: string) {
  if (nextStatus === 'APPROVED') {
    return `/v1/admin/tutors/${tutorId}/approve`;
  }

  return `/v1/admin/tutors/${tutorId}/status`;
}

function buildStatusHref(searchParams: ApplicationsSearchParams, nextStatus: TutorStatus) {
  return buildApplicationsHref(searchParams, {
    sort: parseApplicationSort(searchParams.sort),
    status: nextStatus,
    page: '1',
  });
}

function Banner({
  tone,
  text,
}: {
  tone: 'success' | 'error';
  text: string;
}) {
  const toneClassName =
    tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div className={`rounded-[20px] border p-4 ${toneClassName}`}>
      <Typography variant={{ base: 'body-3' }} color="inherit">
        {text}
      </Typography>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-2xl px-4 py-3 text-label-3 transition ${
          page <= 1
            ? 'pointer-events-none bg-neutral-50 text-neutral-300'
            : 'border border-neutral-100 text-neutral-700 hover:bg-neutral-50'
        }`}
      >
        Previous
      </Link>
      <Typography variant={{ base: 'label-3' }} color="neutral-600">
        Page {page} of {totalPages}
      </Typography>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-2xl px-4 py-3 text-label-3 transition ${
          page >= totalPages
            ? 'pointer-events-none bg-neutral-50 text-neutral-300'
            : 'bg-deep-royal-indigo-500 text-white hover:bg-deep-royal-indigo-600'
        }`}
      >
        Next
      </Link>
    </div>
  );
}

export async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const data = await getTutorApplications(searchParams);
  const query = searchParams.q?.trim() ?? '';
  const sort = parseApplicationSort(searchParams.sort);
  const status = parseApplicationStatus(searchParams.status);
  const currentUrl = buildApplicationsHref(searchParams, { sort, status });
  const countsByStatus = data?.countsByStatus ?? {};
  const statuses = data?.statuses?.length ? data.statuses : visibleStatuses;
  const flashMessage = getApplicationsFlashMessage(searchParams);

  async function updateTutorStatus(formData: FormData) {
    'use server';

    const tutorId = String(formData.get('tutorId') || '');
    const nextStatus = String(formData.get('status') || '');
    const returnTo = String(formData.get('returnTo') || '/applications');

    if (!tutorId || !nextStatus) {
      redirect(returnTo);
    }

    const path = getStatusUpdatePath(tutorId, nextStatus);
    const init =
      nextStatus === 'APPROVED'
        ? { method: 'PATCH' as const }
        : {
            method: 'PATCH' as const,
            body: JSON.stringify({ status: nextStatus }),
          };

    try {
      await fetchAdminApi(path, init);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Could not update tutor status';

      redirect(
        buildApplicationsHref(searchParams, {
          page: searchParams.page,
          q: searchParams.q,
          sort,
          status,
          error: encodeURIComponent(message),
        }),
      );
    }

    revalidatePath('/applications');

    const success =
      nextStatus === 'APPROVED'
        ? 'approved'
        : nextStatus === 'REJECTED'
          ? 'rejected'
          : 'suspended';

    // Follow-up: expose backend audit metadata here once the mutation endpoints return it.
    redirect(
      buildApplicationsHref(searchParams, {
        page: searchParams.page,
        q: searchParams.q,
        sort,
        status,
        success,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ApplicationsRealtimeListener />
      <ApplicationsHeader query={query} sort={sort} status={status} />
      {flashMessage ? <Banner tone={flashMessage.tone} text={flashMessage.text} /> : null}
      <div className="flex flex-col md:flex-row md:items-stretch md:justify-between">
        <div className="md:flex-1">
          <ApplicationsTabs
            activeStatus={status}
            countsByStatus={countsByStatus}
            buildHref={(nextStatus) => buildStatusHref(searchParams, nextStatus)}
          />
        </div>
        <div className="md:flex-1">
          <ApplicationsControls
            query={query}
            sort={sort}
            status={status}
            statuses={statuses}
            formatStatusLabel={formatStatusLabel}
          />
        </div>
      </div>

      {!data ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6">
          <Typography variant={{ base: 'title-4' }} color="rose-700">
            Applications could not be loaded.
          </Typography>
          <Typography variant={{ base: 'body-3' }} color="rose-700" className="mt-2">
            The request failed before any filtered results could be shown. Retry once the admin applications endpoint is available.
          </Typography>
        </div>
      ) : data.applications.length === 0 ? (
        <div className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Typography variant={{ base: 'title-4' }} color="neutral-800">
            No applications match the current filters.
          </Typography>
          <Typography variant={{ base: 'body-3' }} color="neutral-500" className="mt-2">
            Try a different search term, status, or sort order.
          </Typography>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {data.applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                currentUrl={currentUrl}
                onUpdateStatus={updateTutorStatus}
              />
            ))}
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            buildHref={(page) =>
              buildApplicationsHref(searchParams, {
                q: query,
                sort,
                status,
                page: String(page),
              })
            }
          />
        </>
      )}
    </div>
  );
}
