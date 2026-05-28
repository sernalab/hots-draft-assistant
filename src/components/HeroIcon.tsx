import { useState } from 'react';
import type { Hero } from '../types';

interface HeroIconProps {
  hero: Hero;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
};

const sizeText = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
  '2xl': 'text-lg',
};

const roleGradients: Record<string, string> = {
  Tank: 'from-blue-600 to-blue-800',
  Bruiser: 'from-orange-600 to-orange-800',
  Healer: 'from-green-500 to-green-700',
  Support: 'from-teal-500 to-teal-700',
  'Melee Assassin': 'from-red-600 to-red-800',
  'Ranged Assassin': 'from-purple-600 to-purple-800',
};

export function HeroIcon({ hero, size = 'md', className = '' }: HeroIconProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    const gradient = roleGradients[hero.role] ?? 'from-gray-600 to-gray-800';
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br ${gradient} ring-1 ring-white/10 flex items-center justify-center text-white/90 ${sizeText[size]} font-bold shadow-sm ${className}`}
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
      className={`${sizeClasses[size]} rounded-lg object-cover ring-1 ring-white/10 ${className}`}
      onError={() => setImgError(true)}
    />
  );
}
