import React from 'react';
interface AvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className = ''
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  return <div className={`relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : <span className="font-medium text-gray-500">{fallback}</span>}
    </div>;
}