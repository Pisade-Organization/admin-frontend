import { ResolveDisputesPage } from '@/features/resolve-disputes/components/ResolveDisputesPage';

type ResolveDisputesRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({
  searchParams,
}: ResolveDisputesRouteProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <ResolveDisputesPage
      searchParams={{
        status:
          typeof resolvedSearchParams.status === 'string'
            ? resolvedSearchParams.status
            : undefined,
        confirmBlock:
          typeof resolvedSearchParams.confirmBlock === 'string'
            ? resolvedSearchParams.confirmBlock
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
