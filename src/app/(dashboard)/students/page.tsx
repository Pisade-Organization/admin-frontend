import { StudentsPage } from '@/features/students/components/StudentsPage';

type StudentsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: StudentsRouteProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <StudentsPage
      searchParams={{
        status:
          typeof resolvedSearchParams.status === 'string'
            ? resolvedSearchParams.status
            : undefined,
        q:
          typeof resolvedSearchParams.q === 'string'
            ? resolvedSearchParams.q
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
