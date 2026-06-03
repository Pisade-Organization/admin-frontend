import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminPageErrorState, AdminStateCard } from '@/shared/components/admin-state';
import { getAdminShellUser, isAdminAuthError } from '@/shared/lib/adminApi';

function getSignInHref() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:4000';

  return `${backendUrl}/auth/google/signin?target=admin`;
}

export default async function Home() {
  try {
    const shellUser = await getAdminShellUser();

    if (shellUser) {
      redirect('/overview');
    }
  } catch (error) {
    if (!isAdminAuthError(error)) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
          <div className="w-full max-w-2xl">
            <AdminPageErrorState description="The admin shell could not verify the current session. Check backend connectivity and try again." />
          </div>
        </main>
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
      <div className="w-full max-w-2xl">
        <AdminStateCard
          tone="warning"
          title="Admin session required"
          description="This dashboard only renders for authenticated admin or manager sessions. Sign in first, then return to continue."
          action={
            <Link
              href={getSignInHref()}
              className="inline-flex rounded-2xl bg-deep-royal-indigo-500 px-4 py-3 text-label-3 text-white"
            >
              Continue with Google
            </Link>
          }
        />
      </div>
    </main>
  );
}
