export type TransactionType =
  | 'ALL'
  | 'PAYMENT'
  | 'REFUND'
  | 'TOPUP'
  | 'COMMISSION'
  | 'WITHDRAW';

export type TransactionStatus = 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED';

export type TransactionsSearchInput = {
  type?: string;
  status?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
};

export const transactionTypeOptions: TransactionType[] = [
  'ALL',
  'PAYMENT',
  'REFUND',
  'TOPUP',
  'COMMISSION',
  'WITHDRAW',
];

export const transactionStatusOptions: TransactionStatus[] = [
  'ALL',
  'PENDING',
  'SUCCESS',
  'FAILED',
];

export function normalizeTransactionType(value?: string): TransactionType {
  return transactionTypeOptions.includes((value ?? 'ALL') as TransactionType)
    ? (value as TransactionType)
    : 'ALL';
}

export function normalizeTransactionStatus(value?: string): TransactionStatus {
  return transactionStatusOptions.includes(
    (value ?? 'ALL') as TransactionStatus,
  )
    ? (value as TransactionStatus)
    : 'ALL';
}

export function normalizeTransactionPage(value?: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function buildTransactionsSearch(input: TransactionsSearchInput) {
  const params = new URLSearchParams();
  const type = normalizeTransactionType(input.type);
  const status = normalizeTransactionStatus(input.status);
  const q = input.q?.trim();

  if (type !== 'ALL') {
    params.set('type', type);
  }

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (q) {
    params.set('q', q);
  }

  if (input.dateFrom) {
    params.set('dateFrom', input.dateFrom);
  }

  if (input.dateTo) {
    params.set('dateTo', input.dateTo);
  }

  const page = normalizeTransactionPage(input.page);

  if (page > 1) {
    params.set('page', String(page));
  }

  return params.toString();
}
