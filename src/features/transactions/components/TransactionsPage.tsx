import Link from 'next/link';
import AdminPagination from '@/shared/components/admin/AdminPagination';
import Typography from '@/shared/components/base/Typography';
import { fetchAdminApi } from '@/shared/lib/adminApi';
import {
  formatCurrency,
  formatDateTime,
  formatInteger,
} from '@/shared/lib/formatters';
import {
  buildTransactionsSearch,
  normalizeTransactionPage,
  normalizeTransactionStatus,
  normalizeTransactionType,
  transactionStatusOptions,
  transactionTypeOptions,
  type TransactionStatus,
  type TransactionType,
} from './transactions.helpers';

type FinanceStats = {
  revenueTotal: number;
  revenueThisMonth: number;
  pendingWithdrawals: number;
  totalWithdrawn: number;
};

type TransactionRecord = {
  id: string;
  type: Exclude<TransactionType, 'ALL'>;
  status: Exclude<TransactionStatus, 'ALL'>;
  amount: number;
  fee: number;
  walletId: string;
  wallet: {
    id: string;
  };
  reference: string | null;
  providerRef: string | null;
  createdAt: string;
  relatedTutor: {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  relatedStudent: {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
};

type TransactionsPayload = {
  transactions: TransactionRecord[];
  total: number;
  page: number;
  totalPages: number;
};

type TransactionsPageProps = {
  searchParams?: {
    type?: string;
    status?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  };
};

function getStatusTone(status: TransactionRecord['status']) {
  switch (status) {
    case 'SUCCESS':
      return 'bg-green-light text-green-normal';
    case 'FAILED':
      return 'bg-red-light text-red-normal';
    case 'PENDING':
    default:
      return 'bg-orange-light text-orange-normal';
  }
}

function buildTransactionsHref(searchParams: TransactionsPageProps['searchParams'], page: number) {
  const query = buildTransactionsSearch({
    type: searchParams?.type,
    status: searchParams?.status,
    q: searchParams?.q,
    dateFrom: searchParams?.dateFrom,
    dateTo: searchParams?.dateTo,
    page: String(page),
  });

  return query ? `/transactions?${query}` : '/transactions';
}

export async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const type = normalizeTransactionType(searchParams?.type);
  const status = normalizeTransactionStatus(searchParams?.status);
  const page = normalizeTransactionPage(searchParams?.page);
  const ledgerQuery = new URLSearchParams({
    type,
    status,
    limit: '25',
    page: String(page),
  });

  if (searchParams?.q?.trim()) {
    ledgerQuery.set('q', searchParams.q.trim());
  }

  if (searchParams?.dateFrom) {
    ledgerQuery.set('dateFrom', searchParams.dateFrom);
  }

  if (searchParams?.dateTo) {
    ledgerQuery.set('dateTo', searchParams.dateTo);
  }

  const [statsState, ledgerState] = await Promise.all([
    fetchAdminApi<FinanceStats>('/v1/admin/finance/stats')
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: Error) => ({
        data: null,
        error: error.message || 'Unable to load finance stats.',
      })),
    fetchAdminApi<TransactionsPayload>(
      `/v1/admin/finance/transactions?${ledgerQuery.toString()}`,
    )
      .then((data) => ({ data, error: null as string | null }))
      .catch((error: Error) => ({
        data: { transactions: [], total: 0, page, totalPages: 0 },
        error: error.message || 'Unable to load transactions.',
      })),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
              Transactions
            </Typography>
            <Typography variant={{ base: 'body-3' }} color="neutral-500">
              Review platform money movement and withdrawal exposure.
            </Typography>
          </div>
          <form
            action="/transactions"
            className="grid gap-3 lg:grid-cols-[1.1fr_repeat(4,minmax(0,1fr))_auto_auto]"
          >
            <input
              type="text"
              name="q"
              defaultValue={searchParams?.q ?? ''}
              placeholder="Search ref, wallet, tutor, or student"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <label className="flex items-center gap-2">
              <select
                name="type"
                defaultValue={type}
                className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700"
              >
                {transactionTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'ALL' ? 'All types' : option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <select
                name="status"
                defaultValue={status}
                className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700"
              >
                {transactionStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'ALL' ? 'All statuses' : option}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={searchParams?.dateFrom ?? ''}
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <input
              type="date"
              name="dateTo"
              defaultValue={searchParams?.dateTo ?? ''}
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-body-3 text-neutral-700 outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
            >
              Apply
            </button>
            <Link
              href="/transactions"
              className="rounded-2xl border border-neutral-100 px-4 py-3 text-center text-label-3 text-neutral-700"
            >
              Reset
            </Link>
          </form>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[24px] border border-blue-100 bg-blue-light p-5">
          <Typography variant={{ base: 'label-3' }} color="neutral-700">
            Revenue Total
          </Typography>
          <Typography variant={{ base: 'headline-4' }} color="neutral-900" className="mt-2">
            {formatCurrency(statsState.data?.revenueTotal)}
          </Typography>
        </div>
        <div className="rounded-[24px] border border-green-100 bg-green-light p-5">
          <Typography variant={{ base: 'label-3' }} color="neutral-700">
            Revenue This Month
          </Typography>
          <Typography variant={{ base: 'headline-4' }} color="neutral-900" className="mt-2">
            {formatCurrency(statsState.data?.revenueThisMonth)}
          </Typography>
        </div>
        <div className="rounded-[24px] border border-orange-100 bg-orange-light p-5">
          <Typography variant={{ base: 'label-3' }} color="neutral-700">
            Pending Withdrawals
          </Typography>
          <Typography variant={{ base: 'headline-4' }} color="neutral-900" className="mt-2">
            {formatCurrency(statsState.data?.pendingWithdrawals)}
          </Typography>
        </div>
        <div className="rounded-[24px] border border-violet-100 bg-electric-violet-50 p-5">
          <Typography variant={{ base: 'label-3' }} color="neutral-700">
            Withdrawn Total
          </Typography>
          <Typography variant={{ base: 'headline-4' }} color="neutral-900" className="mt-2">
            {formatCurrency(statsState.data?.totalWithdrawn)}
          </Typography>
        </div>
      </section>

      {statsState.error ? (
        <section className="rounded-[24px] border border-red-200 bg-red-light p-4">
          <Typography variant={{ base: 'body-3' }} color="red-normal">
            Finance stats failed to load: {statsState.error}
          </Typography>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-900">
            Ledger
          </Typography>
          <Typography variant={{ base: 'label-3' }} color="neutral-500">
            {formatInteger(ledgerState.data.total)} transactions
          </Typography>
        </div>

        <div className="mb-4 rounded-[20px] border border-orange-200 bg-orange-light p-4">
          <Typography variant={{ base: 'body-4' }} color="orange-normal">
            Pending withdrawals are visible here for review, but remain read-only until an audited admin payout workflow exists.
          </Typography>
        </div>

        {ledgerState.error ? (
          <div className="mb-4 rounded-[20px] border border-red-200 bg-red-light p-4">
            <Typography variant={{ base: 'body-3' }} color="red-normal">
              Transactions failed to load: {ledgerState.error}
            </Typography>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-50">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-label-4 text-neutral-500">Transaction</th>
                <th className="pb-3 text-label-4 text-neutral-500">Related</th>
                <th className="pb-3 text-label-4 text-neutral-500">Amount</th>
                <th className="pb-3 text-label-4 text-neutral-500">Status</th>
                <th className="pb-3 text-label-4 text-neutral-500">Reference</th>
                <th className="pb-3 text-label-4 text-neutral-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {ledgerState.data.transactions.length ? (
                ledgerState.data.transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="py-4">
                      <Typography variant={{ base: 'label-3' }} color="neutral-800">
                        {transaction.type}
                      </Typography>
                      <Typography variant={{ base: 'body-4' }} color="neutral-400">
                        {transaction.id}
                      </Typography>
                    </td>
                    <td className="py-4">
                      <Typography variant={{ base: 'body-3' }} color="neutral-600">
                        Wallet: {transaction.wallet.id}
                      </Typography>
                      {transaction.relatedTutor ? (
                        <Link
                          href={`/tutors?q=${encodeURIComponent(transaction.relatedTutor.email)}`}
                          className="mt-1 block text-body-4 text-deep-royal-indigo-500"
                        >
                          Tutor: {transaction.relatedTutor.fullName}
                        </Link>
                      ) : null}
                      {transaction.relatedStudent ? (
                        <Link
                          href={`/students?q=${encodeURIComponent(transaction.relatedStudent.email)}`}
                          className="mt-1 block text-body-4 text-deep-royal-indigo-500"
                        >
                          Student: {transaction.relatedStudent.fullName}
                        </Link>
                      ) : null}
                    </td>
                    <td className="py-4">
                      <Typography variant={{ base: 'label-3' }} color="neutral-800">
                        {formatCurrency(transaction.amount)}
                      </Typography>
                      <Typography variant={{ base: 'body-4' }} color="neutral-400">
                        Fee: {formatCurrency(transaction.fee)}
                      </Typography>
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-3 py-1 text-label-4 ${getStatusTone(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <Typography variant={{ base: 'body-3' }} color="neutral-600">
                        {transaction.reference ?? transaction.providerRef ?? '—'}
                      </Typography>
                      {transaction.reference && transaction.providerRef ? (
                        <Typography variant={{ base: 'body-4' }} color="neutral-400">
                          Provider: {transaction.providerRef}
                        </Typography>
                      ) : null}
                    </td>
                    <td className="py-4 text-body-3 text-neutral-600">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-body-3 text-neutral-500">
                    No transactions found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <AdminPagination
            page={ledgerState.data.page}
            totalPages={ledgerState.data.totalPages}
            buildHref={(nextPage) => buildTransactionsHref(searchParams, nextPage)}
          />
        </div>
      </section>
    </div>
  );
}
