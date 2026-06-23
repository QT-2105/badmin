'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type BrandLogoProps = {
  clubName?: string | null;
  logoUrl?: string | null;
  className?: string;
  textClassName?: string;
};

export function BrandLogo({ clubName, logoUrl, className, textClassName }: BrandLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const label = (clubName || 'Badmin').trim();

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-xl bg-cyan-400 font-black text-slate-950',
        className
      )}
    >
      {logoUrl && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={label}
          className="h-full w-full object-cover object-center"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={cn('leading-none', textClassName)}>{label.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}
