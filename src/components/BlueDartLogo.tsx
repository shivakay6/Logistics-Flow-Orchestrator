import React from 'react';

export const BLUE_DART_LOGO_URL = '/blue_dart_logo_tight.svg';
export const BLUE_DART_AVATAR_URL = '/blue_dart_avatar.svg';

interface BlueDartLogoProps {
  id?: string;
  className?: string;
  variant?: 'full' | 'avatar' | 'mark' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  darkMode?: boolean;
}

export function BlueDartLogo({
  id,
  className = '',
  variant = 'full',
  size = 'md',
}: BlueDartLogoProps) {
  if (variant === 'avatar') {
    const avatarSizes = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    };

    return (
      <div 
        id={id}
        className={`inline-flex items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden p-1 shrink-0 select-none ${avatarSizes[size]} ${className}`}
        title="Blue Dart"
      >
        <img
          src={BLUE_DART_AVATAR_URL}
          alt="Blue Dart"
          className="w-full h-full object-contain select-none"
        />
      </div>
    );
  }

  const heightStyles = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };

  return (
    <div 
      id={id}
      className={`inline-flex items-center select-none ${heightStyles[size]} ${className}`}
      title="Blue Dart Express"
    >
      <img
        src={BLUE_DART_LOGO_URL}
        alt="Blue Dart Express"
        className="h-full w-auto object-contain select-none"
      />
    </div>
  );
}
