import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminPageErrorState } from '@/shared/components/admin-state';
import MobileDashboardHeader from '@/shared/components/layout/MobileDashboardHeader';
import Sidebar, { type SidebarItem } from '@/shared/components/layout/Sidebar';
import { AdminApiError } from '@/shared/lib/adminApi';
import { getAdminShellUser, isAdminAuthError } from '@/shared/lib/adminApi';

const navigationItems: SidebarItem[] = [
  { label: 'Overview', href: '/overview' },
  {
    label: 'Tutors & Students',
    children: [
      { label: 'Tutors', href: '/tutors' },
      { label: 'Students', href: '/students' },
    ],
  },
  { label: 'Applications', href: '/applications' },
  { label: 'Lessons', href: '/lessons' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Resolve Disputes', href: '/resolve-disputes' },
  { label: 'Settings', href: '/settings' },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const shellUser = await getAdminShellUser().catch((error) => {
    if (isAdminAuthError(error)) {
      redirect('/');
    }

    return error;
  });

  if (!shellUser) {
    redirect('/');
  }

  if (shellUser instanceof Error) {
    const description =
      shellUser instanceof AdminApiError
        ? shellUser.message
        : 'The admin shell could not verify the current session. Check backend connectivity and try again.';

    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
        <div className="w-full max-w-2xl">
          <AdminPageErrorState description={description} />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <div className="flex min-h-screen flex-col md:flex-row">
        <MobileDashboardHeader items={navigationItems} user={shellUser} />
        <Sidebar items={navigationItems} />
        <main className="flex flex-1 flex-col p-4 md:min-h-screen md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
