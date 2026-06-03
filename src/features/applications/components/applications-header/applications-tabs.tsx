import Link from 'next/link';
import { TutorStatus } from '../applications.types';
import { formatCompactNumber, formatStatusLabel } from '../applications.data';

type ApplicationsTabsProps = {
  activeStatus: TutorStatus;
  countsByStatus: Record<string, number>;
  buildHref: (status: TutorStatus) => string;
};

const tabStatuses: TutorStatus[] = ['REVIEWING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export default function ApplicationsTabs({
  activeStatus,
  countsByStatus,
  buildHref,
}: ApplicationsTabsProps) {
  const formatTabCount = (value: number) => formatCompactNumber(value).toLowerCase();

  return (
    <div className="overflow-x-auto border-b border-neutral-50 bg-white">
      <div className="flex min-w-max items-center">
        {tabStatuses.map((status) => {
          const isActive = status === activeStatus;

          return (
            <Link
              key={status}
              href={buildHref(status)}
              className={`px-3 py-3 transition ${
                isActive ? 'border-b-2 border-electric-violet-400' : ''
              }`}
            >
              <span
                className={isActive ? 'text-label-3 text-electric-violet-400' : 'text-body-3 text-neutral-500'}
              >
                {formatStatusLabel(status)} ({formatTabCount(countsByStatus[status] ?? 0)})
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
