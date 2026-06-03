'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (response: { type: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

type BackendGoogleAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: {
    role?: string;
  };
};

function getBackendUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to continue with Google right now.';
}

export default function AdminGoogleSignInButton() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGooglePopup = useCallback(() => {
    setErrorMessage(null);

    if (!clientId) {
      setErrorMessage('Google login is not configured.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setErrorMessage('Google login is not ready yet. Please try again.');
      return;
    }

    setIsLoading(true);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (response) => {
        try {
          if (response.error || !response.access_token) {
            throw new Error(
              response.error_description ||
                response.error ||
                'Google access token was not returned',
            );
          }

          const backendResponse = await fetch(
            `${getBackendUrl()}/auth/google/callback`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                googleToken: response.access_token,
                target: 'admin',
              }),
            },
          );

          if (!backendResponse.ok) {
            let message = 'Google sign-in failed';

            try {
              const payload = (await backendResponse.json()) as {
                error?: { message?: string | string[] };
              };
              const apiMessage = payload.error?.message;
              if (Array.isArray(apiMessage)) {
                message = apiMessage.join(', ');
              } else if (typeof apiMessage === 'string' && apiMessage.trim()) {
                message = apiMessage;
              }
            } catch {
              // Ignore invalid JSON and fall back to the generic message.
            }

            throw new Error(message);
          }

          const payload =
            (await backendResponse.json()) as {
              data?: BackendGoogleAuthResponse;
            };
          const data = payload.data;

          if (!data?.access_token || !data?.refresh_token) {
            throw new Error('Google sign-in response was incomplete');
          }

          const sessionResponse = await fetch('/auth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            }),
          });

          if (!sessionResponse.ok) {
            throw new Error('Failed to create admin session');
          }

          router.replace('/overview');
          router.refresh();
        } catch (error) {
          setErrorMessage(getErrorMessage(error));
        } finally {
          setIsLoading(false);
        }
      },
      error_callback: () => {
        setErrorMessage('Failed to open Google popup.');
        setIsLoading(false);
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  }, [clientId, router]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
        onReady={() => setIsScriptReady(true)}
        onError={() => {
          setIsScriptReady(false);
          setErrorMessage('Failed to load Google login.');
        }}
      />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGooglePopup}
          disabled={isLoading}
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white transition hover:bg-deep-royal-indigo-600 disabled:cursor-not-allowed disabled:bg-deep-royal-indigo-200"
        >
          <GoogleMark />
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {errorMessage ? (
          <p className="text-body-4 text-red-normal">{errorMessage}</p>
        ) : null}
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5a9.5 9.5 0 1 0 0 19c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.2-.2-1.7H12Z"
      />
      <path
        fill="#34A853"
        d="M2.5 7.6 5.7 10c.9-2.5 3.3-4.3 6.3-4.3 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5c-3.7 0-6.9 2.1-8.5 5.1Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.5c2.5 0 4.6-.8 6.2-2.3l-2.9-2.4c-.8.5-1.8.9-3.3.9-3.8 0-5.1-2.6-5.4-3.8l-3.2 2.5c1.6 3.1 4.8 5.1 8.6 5.1Z"
      />
      <path
        fill="#4285F4"
        d="M21.1 12.3c0-.6-.1-1.2-.2-1.7H12v3.9h5.4c-.3 1.2-1.2 2.2-2.3 2.9l2.9 2.4c1.7-1.6 3.1-4 3.1-7.5Z"
      />
    </svg>
  );
}
