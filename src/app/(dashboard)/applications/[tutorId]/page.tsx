import { ApplicationDetailPage } from '@/features/applications/components/ApplicationDetailPage';

type ApplicationDetailRouteProps = {
  params: Promise<{ tutorId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({
  params,
  searchParams,
}: ApplicationDetailRouteProps) {
  const { tutorId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ApplicationDetailPage
      tutorId={tutorId}
      searchParams={{
        q:
          typeof resolvedSearchParams.q === 'string'
            ? resolvedSearchParams.q
            : undefined,
        sort:
          typeof resolvedSearchParams.sort === 'string'
            ? resolvedSearchParams.sort
            : undefined,
        status:
          typeof resolvedSearchParams.status === 'string'
            ? resolvedSearchParams.status
            : undefined,
        page:
          typeof resolvedSearchParams.page === 'string'
            ? resolvedSearchParams.page
            : undefined,
        notice:
          typeof resolvedSearchParams.notice === 'string'
            ? resolvedSearchParams.notice
            : undefined,
        error:
          typeof resolvedSearchParams.error === 'string'
            ? resolvedSearchParams.error
            : undefined,
      }}
    />
  );
}
