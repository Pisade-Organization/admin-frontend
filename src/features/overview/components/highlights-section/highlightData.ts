export type OverviewHighlights = {
  platformRevenue: number;
  totalBookings: number;
  activeUsers: number;
  activeUsersWindowDays: number;
};

export type OverviewHighlightsResult =
  | { kind: 'success'; data: OverviewHighlights }
  | { kind: 'error'; data: null };

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

function getBackendBaseUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
}

export async function getOverviewHighlights(): Promise<OverviewHighlightsResult> {
  try {
    // Follow-up: confirm whether this public endpoint should remain unauthenticated.
    const response = await fetch(`${getBackendBaseUrl()}/v1/admin/overview/highlights`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { kind: 'error', data: null };
    }

    const payload = (await response.json()) as ApiResponse<OverviewHighlights>;
    return { kind: 'success', data: payload.data };
  } catch (error) {
    logAdminRequestFailure(
      'getOverviewHighlights',
      `${getBackendBaseUrl()}/v1/admin/overview/highlights`,
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        error,
      },
    );
    return { kind: 'error', data: null };
  }
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInteger(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  return new Intl.NumberFormat('en-US').format(value);
}
import { logAdminRequestFailure } from '@/shared/lib/adminApi';
