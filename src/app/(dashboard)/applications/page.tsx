import { ApplicationsPage } from '@/features/applications/components/ApplicationsPage';

type ApplicationsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: ApplicationsRouteProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <ApplicationsPage
      searchParams={{
        q: typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined,
        sort: typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : undefined,
        status:
          typeof resolvedSearchParams.status === 'string'
            ? resolvedSearchParams.status
            : undefined,
        page: typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : undefined,
        success:
          typeof resolvedSearchParams.success === 'string'
            ? resolvedSearchParams.success
            : undefined,
        error:
          typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : undefined,
      }}
    />
  );
}
