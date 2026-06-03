import type { ReactNode } from 'react';
import AdminStateCard from '@/shared/components/admin-state/AdminStateCard';

type AdminPageErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export default function AdminPageErrorState({
  title = 'Unable to load admin data',
  description = 'The request failed before this page could render reliable content. Refresh and try again.',
  action,
}: AdminPageErrorStateProps) {
  return (
    <AdminStateCard
      tone="danger"
      title={title}
      description={description}
      action={action}
    />
  );
}
