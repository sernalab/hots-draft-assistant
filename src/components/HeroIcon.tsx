import { useState } from 'react';
import type { Hero } from '../types';

interface HeroIconProps {
  hero: Hero;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

export function HeroIcon({ hero, size = 'md', className = '' }: HeroIconProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-md bg-bg-card flex items-center justify-center text-text-muted text-xs font-bold ${className}`}
        title={hero.name}
      >
        {hero.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={hero.icon}
      alt={hero.name}
      title={hero.name}
      className={`${sizeClasses[size]} rounded-md object-cover ${className}`}
      onError={() => setImgError(true)}
    />
  );
}
