'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { getInitials } from '@/shared/lib/formatters';
import { normalizeAvatarSrc } from '@/shared/lib/avatar';

type AvatarProps = {
  src?: string | null;
  alt: string;
  name: string;
  sizeClassName: string;
  textClassName: string;
  className?: string;
};

export default function Avatar({
  src,
  alt,
  name,
  sizeClassName,
  textClassName,
  className = '',
}: AvatarProps) {
  const normalizedSrc = useMemo(() => normalizeAvatarSrc(src), [src]);
  const [hasError, setHasError] = useState(false);
  const shouldRenderImage = Boolean(normalizedSrc) && !hasError;

  if (shouldRenderImage) {
    return (
      <div className={`relative overflow-hidden rounded-full ${sizeClassName} ${className}`.trim()}>
        <Image
          src={normalizedSrc!}
          alt={alt}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={alt}
      className={`flex items-center justify-center rounded-full bg-deep-royal-indigo-50 text-deep-royal-indigo-500 ${sizeClassName} ${textClassName} ${className}`.trim()}
    >
      {getInitials(name)}
    </div>
  );
}
