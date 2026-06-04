type ApplicationsSearchParamsLike = {
  q?: string;
  sort?: string;
  status?: string;
  page?: string;
  success?: string;
  error?: string;
  notice?: string;
};

export type ApplicationsFlashMessage = {
  tone: 'success' | 'error';
  text: string;
};

const successMessageByKey = {
  approved: 'Tutor approved.',
  rejected: 'Application rejected.',
  suspended: 'Tutor suspended.',
} as const;

function normalizeParam(value?: string) {
  return value?.trim() || undefined;
}

export function buildApplicationsHref(
  searchParams: ApplicationsSearchParamsLike,
  overrides: Partial<ApplicationsSearchParamsLike>,
) {
  const params = new URLSearchParams();
  const q = normalizeParam(overrides.q ?? searchParams.q);
  const sort = normalizeParam(overrides.sort ?? searchParams.sort);
  const status = normalizeParam(overrides.status ?? searchParams.status);
  const page = normalizeParam(overrides.page ?? searchParams.page);
  const success = normalizeParam(overrides.success);
  const error = normalizeParam(overrides.error);

  if (q) {
    params.set('q', q);
  }

  if (sort) {
    params.set('sort', sort);
  }

  if (status) {
    params.set('status', status);
  }

  if (page) {
    params.set('page', page);
  }

  if (success) {
    params.set('success', success);
  }

  if (error) {
    params.set('error', error);
  }

  const queryString = params.toString();

  return queryString ? `/applications?${queryString}` : '/applications';
}

export function buildApplicationDetailHref(
  tutorId: string,
  searchParams: ApplicationsSearchParamsLike,
) {
  const params = new URLSearchParams();
  const q = normalizeParam(searchParams.q);
  const sort = normalizeParam(searchParams.sort);
  const status = normalizeParam(searchParams.status);
  const page = normalizeParam(searchParams.page);

  if (q) {
    params.set('q', q);
  }

  if (sort) {
    params.set('sort', sort);
  }

  if (status) {
    params.set('status', status);
  }

  if (page) {
    params.set('page', page);
  }

  const queryString = params.toString();
  return queryString
    ? `/applications/${tutorId}?${queryString}`
    : `/applications/${tutorId}`;
}

export function buildApplicationsReturnHref(
  searchParams: ApplicationsSearchParamsLike,
) {
  return buildApplicationsHref(searchParams, {
    success: undefined,
    error: undefined,
    notice: undefined,
  });
}

export function getApplicationsFlashMessage(
  searchParams: Pick<ApplicationsSearchParamsLike, 'success' | 'error'>,
): ApplicationsFlashMessage | null {
  const success = normalizeParam(searchParams.success);

  if (success && success in successMessageByKey) {
    return {
      tone: 'success',
      text: successMessageByKey[success as keyof typeof successMessageByKey],
    };
  }

  const error = normalizeParam(searchParams.error);

  if (error) {
    return {
      tone: 'error',
      text: decodeURIComponent(error),
    };
  }

  return null;
}
