import { StudentDetailPage } from '@/features/students/components/StudentDetailPage';

type StudentDetailRouteProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({
  params,
  searchParams,
}: StudentDetailRouteProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <StudentDetailPage
      studentId={resolvedParams.studentId}
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
