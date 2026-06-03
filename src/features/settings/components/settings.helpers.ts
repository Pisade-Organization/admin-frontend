export type SettingsSearchInput = {
  entity?: string;
  action?: string;
  actor?: string;
  page?: string;
};

export type DiscountFormInput = {
  code?: string;
  amount?: string;
  expiresAt?: string;
};

export function normalizeAuditValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed || 'ALL';
}

export function normalizeAuditPage(value?: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function buildSettingsSearch(input: SettingsSearchInput) {
  const params = new URLSearchParams();
  const entity = normalizeAuditValue(input.entity);
  const action = input.action?.trim();
  const actor = input.actor?.trim();

  if (entity !== 'ALL') {
    params.set('entity', entity);
  }

  if (action) {
    params.set('action', action);
  }

  if (actor) {
    params.set('actor', actor);
  }

  const page = normalizeAuditPage(input.page);

  if (page > 1) {
    params.set('page', String(page));
  }

  return params.toString();
}

export function parseSettingsFlash(
  searchParams?: Record<string, string | undefined>,
) {
  const message = searchParams?.discountMessage?.trim();

  if (!message) {
    return null;
  }

  return {
    tone: searchParams?.discountSuccess ? ('success' as const) : ('error' as const),
    message,
  };
}

export function validateDiscountForm(input: DiscountFormInput) {
  const errors: Record<string, string> = {};
  const code = input.code?.trim() ?? '';
  const amount = Number(input.amount ?? 0);
  const expiresAt = input.expiresAt?.trim() ?? '';

  if (!code) {
    errors.code = 'Code is required';
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!expiresAt) {
    errors.expiresAt = 'Expiry is required';
  }

  return errors;
}
