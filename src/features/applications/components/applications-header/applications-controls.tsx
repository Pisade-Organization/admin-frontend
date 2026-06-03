import { formatSortLabel } from '../applications.data';
import { ApplicationSort } from '../applications.data';
import { TutorStatus } from '../applications.types';

type ApplicationsControlsProps = {
  query: string;
  sort: ApplicationSort;
  status: TutorStatus;
  statuses: TutorStatus[];
  formatStatusLabel: (status: TutorStatus) => string;
};

const sortOptions: ApplicationSort[] = [
  'newest',
  'oldest',
  'price_high',
  'price_low',
  'name_asc',
  'name_desc',
];

export default function ApplicationsControls({
  query,
  sort,
  status,
  statuses,
  formatStatusLabel,
}: ApplicationsControlsProps) {
  return (
    <div className="border-b border-neutral-50 bg-white px-3">
      <form action="/applications" className="flex items-center">
        <input type="hidden" name="q" value={query} />

        <label className="flex flex-1 items-center">
          <span className="mr-2 text-label-4 text-neutral-500">Sort by</span>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700 outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {formatSortLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 items-center">
          <span className="mr-2 text-label-4 text-neutral-500">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-body-3 text-neutral-700 outline-none"
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {formatStatusLabel(option)}
              </option>
            ))}
          </select>
        </label>
      </form>
    </div>
  );
}
