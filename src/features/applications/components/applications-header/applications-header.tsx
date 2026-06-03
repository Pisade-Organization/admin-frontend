import Typography from '@/shared/components/base/Typography';
import { Search } from 'lucide-react';
import { ApplicationSort } from '../applications.data';
import { TutorStatus } from '../applications.types';

type ApplicationsHeaderProps = {
  query: string;
  sort: ApplicationSort;
  status: TutorStatus;
};

export default function ApplicationsHeader({
  query,
  sort,
  status,
}: ApplicationsHeaderProps) {
  return (
    <div className="flex h-[50px] items-center justify-between border-b border-neutral-50 bg-white px-4 md:h-[60px] md:px-6">
      <Typography variant={{ base: 'title-2', lg: 'title-1' }} color="neutral-800">
        Applications
      </Typography>

      <button
        type="button"
        aria-label="Search applications"
        className="md:hidden"
      >
        <Search className="h-5 w-5 text-neutral-400" />
      </button>

      <form
        action="/applications"
        className="hidden w-full max-w-md items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-4 py-3 md:flex"
      >
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="status" value={status} />
        <Search className="h-5 w-5 text-neutral-400" />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by tutor or subject..."
          className="w-full bg-transparent text-body-3 text-neutral-700 outline-none placeholder:text-neutral-400"
        />
      </form>
    </div>
  );
}
