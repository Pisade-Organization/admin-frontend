import { redirect } from 'next/navigation';
import AdminGoogleSignInButton from '@/app/AdminGoogleSignInButton';
import { AdminPageErrorState, AdminStateCard } from '@/shared/components/admin-state';
import {
  getAdminShellUser,
  hasAdminSessionTokens,
  isAdminAuthError,
} from '@/shared/lib/adminApi';

export default async function Home() {
  const hasSession = await hasAdminSessionTokens();

  try {
    const shellUser = await getAdminShellUser();

    if (shellUser || hasSession) {
      redirect('/overview');
    }
  } catch (error) {
    if (hasSession) {
      redirect('/overview');
    }

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
          action={<AdminGoogleSignInButton />}
        />
      </div>
    </main>
  );
}
