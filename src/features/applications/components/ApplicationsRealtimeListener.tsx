'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_DEBOUNCE_MS = 500;

function getApplicationsStreamUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
    'http://localhost:4000';

  return `${baseUrl}/v1/admin/applications/stream`;
}

export default function ApplicationsRealtimeListener() {
  const router = useRouter();
  const refreshTimeoutRef = useRef<number | null>(null);

  const scheduleRefresh = useEffectEvent(() => {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      router.refresh();
      refreshTimeoutRef.current = null;
    }, REFRESH_DEBOUNCE_MS);
  });

  useEffect(() => {
    const eventSource = new EventSource(getApplicationsStreamUrl());

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };

        if (payload.type === 'applications.changed') {
          scheduleRefresh();
        }
      } catch {
        // Ignore malformed events and wait for the next update.
      }
    };

    return () => {
      eventSource.close();

      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleRefresh]);

  return null;
}
