import AdminStateCard from '@/shared/components/admin-state/AdminStateCard';

type AdminMutationNoticeProps = {
  tone: 'success' | 'danger';
  title: string;
  description: string;
};

export default function AdminMutationNotice({
  tone,
  title,
  description,
}: AdminMutationNoticeProps) {
  return (
    <AdminStateCard tone={tone} title={title} description={description} />
  );
}
