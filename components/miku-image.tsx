'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MikuMascot } from '@/components/miku-mascot';

type MikuImageProps = {
  className?: string;
  size?: number;
  priority?: boolean;
};

export function MikuImage({ className = '', size = 320, priority = false }: MikuImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <MikuMascot className={className} />;
  }

  return (
    <div className={`relative aspect-square ${className}`} style={{ width: size, maxWidth: '100%' }}>
      <Image
        src="/miku.png"
        alt="Hatsune Miku"
        fill
        priority={priority}
        className="object-contain drop-shadow-[0_20px_40px_rgba(57,197,187,0.25)]"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
