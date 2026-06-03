import { TransactionsPage } from '@/features/transactions/components/TransactionsPage';

type TransactionsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: TransactionsRouteProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <TransactionsPage
      searchParams={{
        type:
          typeof resolvedSearchParams.type === 'string'
            ? resolvedSearchParams.type
            : undefined,
      }}
    />
  );
}
