import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminStateCard } from '@/shared/components/admin-state';
import MobileDashboardHeader from '@/shared/components/layout/MobileDashboardHeader';
import Sidebar, { type SidebarItem } from '@/shared/components/layout/Sidebar';
import { AdminApiError } from '@/shared/lib/adminApi';
import {
  getAdminShellUser,
  hasAdminSessionTokens,
  isAdminAuthError,
} from '@/shared/lib/adminApi';

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
  const hasSession = await hasAdminSessionTokens();
  const shellUser = await getAdminShellUser().catch((error) => {
    if (isAdminAuthError(error)) {
      redirect('/');
    }

    return error;
  });

  if (!shellUser && !hasSession) {
    redirect('/');
  }

  const shellError = shellUser instanceof Error ? shellUser : null;
  const resolvedShellUser = shellError ? null : shellUser;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <div className="flex min-h-screen flex-col md:flex-row">
        <MobileDashboardHeader items={navigationItems} user={resolvedShellUser} />
        <Sidebar items={navigationItems} />
        <main className="flex flex-1 flex-col p-4 md:min-h-screen md:p-8">
          {shellError ? (
            <div className="mb-4">
              <AdminStateCard
                tone="warning"
                title="Admin profile unavailable"
                description={
                  shellError instanceof AdminApiError
                    ? shellError.message
                    : 'The admin profile could not be verified, but the dashboard session is still present.'
                }
              />
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
