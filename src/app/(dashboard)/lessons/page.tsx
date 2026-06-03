import { LessonsPage } from '@/features/lessons/components/LessonsPage';

type LessonsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: LessonsRouteProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <LessonsPage
      searchParams={{
        status:
          typeof resolvedSearchParams.status === 'string'
            ? resolvedSearchParams.status
            : undefined,
        q:
          typeof resolvedSearchParams.q === 'string'
            ? resolvedSearchParams.q
            : undefined,
        dateFrom:
          typeof resolvedSearchParams.dateFrom === 'string'
            ? resolvedSearchParams.dateFrom
            : undefined,
        dateTo:
          typeof resolvedSearchParams.dateTo === 'string'
            ? resolvedSearchParams.dateTo
            : undefined,
        lessonId:
          typeof resolvedSearchParams.lessonId === 'string'
            ? resolvedSearchParams.lessonId
            : undefined,
      }}
    />
  );
}
