import type { ReactNode } from 'react';
import AdminStateCard from '@/shared/components/admin-state/AdminStateCard';

type AdminEmptyStateProps = {
  title?: string;
  description: string;
  action?: ReactNode;
};

export default function AdminEmptyState({
  title = 'No records found',
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <AdminStateCard
      tone="neutral"
      title={title}
      description={description}
      action={action}
    />
  );
}
