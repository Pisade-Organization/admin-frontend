import Link from 'next/link';
import Typography from '@/shared/components/base/Typography';

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export default function AdminPagination({
  page,
  totalPages,
  buildHref,
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-2xl px-4 py-3 text-label-3 transition ${
          page <= 1
            ? 'pointer-events-none bg-neutral-50 text-neutral-300'
            : 'border border-neutral-100 text-neutral-700 hover:bg-neutral-50'
        }`}
      >
        Previous
      </Link>
      <Typography variant={{ base: 'label-3' }} color="neutral-600">
        Page {page} of {totalPages}
      </Typography>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-2xl px-4 py-3 text-label-3 transition ${
          page >= totalPages
            ? 'pointer-events-none bg-neutral-50 text-neutral-300'
            : 'bg-deep-royal-indigo-500 text-white hover:bg-deep-royal-indigo-600'
        }`}
      >
        Next
      </Link>
    </div>
  );
}
