import Typography from '@/shared/components/base/Typography';

type AdminEmptyStateProps = {
  title: string;
  description?: string;
};

export default function AdminEmptyState({
  title,
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-neutral-100 bg-white p-10 text-center">
      <Typography variant={{ base: 'title-2' }} color="neutral-800">
        {title}
      </Typography>
      {description ? (
        <Typography
          variant={{ base: 'body-3' }}
          color="neutral-500"
          className="mt-2"
        >
          {description}
        </Typography>
      ) : null}
    </div>
  );
}
