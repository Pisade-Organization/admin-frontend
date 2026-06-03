export type AdminFlashTone = 'success' | 'error';

export function appendQuery(url: string, key: string, value: string) {
  return `${url}${url.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;
}

export function parsePage(value?: string) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

export function buildAdminPath(
  pathname: string,
  params: Record<string, string | null | undefined>,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.trim()) {
      search.set(key, value.trim());
    }
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getAdminFlashMessage(searchParams?: {
  notice?: string;
  error?: string;
}): { tone: AdminFlashTone; text: string } | null {
  if (searchParams?.notice) {
    return {
      tone: 'success',
      text: searchParams.notice,
    };
  }

  if (searchParams?.error) {
    return {
      tone: 'error',
      text: searchParams.error,
    };
  }

  return null;
}
