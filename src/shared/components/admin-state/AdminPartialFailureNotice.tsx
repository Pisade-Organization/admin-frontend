import AdminStateCard from '@/shared/components/admin-state/AdminStateCard';

type AdminPartialFailureNoticeProps = {
  description?: string;
};

export default function AdminPartialFailureNotice({
  description = 'Some sections could not be loaded. The rest of the page is still showing the latest successful data.',
}: AdminPartialFailureNoticeProps) {
  return (
    <AdminStateCard
      tone="warning"
      title="Some admin data is unavailable"
      description={description}
    />
  );
}
