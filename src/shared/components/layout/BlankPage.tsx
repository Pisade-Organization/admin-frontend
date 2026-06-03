import type { ReactNode } from 'react';

export default function BlankPage({ children }: { children?: ReactNode }) {
  return (
    <div className="flex-1 overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}
