import type { ReactNode } from 'react';
import Typography from '@/shared/components/base/Typography';

type AdminStateCardProps = {
  title: string;
  description: string;
  tone?: 'neutral' | 'danger' | 'warning' | 'success';
  action?: ReactNode;
};

const toneClasses = {
  neutral: 'border-stone-200 bg-white',
  danger: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  success: 'border-emerald-200 bg-emerald-50',
} as const;

export default function AdminStateCard({
  title,
  description,
  tone = 'neutral',
  action,
}: AdminStateCardProps) {
  return (
    <section
      className={`rounded-[24px] border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${toneClasses[tone]}`}
    >
      <Typography variant="title-3" color="stone-950">
        {title}
      </Typography>
      <Typography variant="body-3" color="stone-600" className="mt-2 max-w-[56ch]">
        {description}
      </Typography>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
