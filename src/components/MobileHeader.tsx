import React from 'react';
import { Search, MoreVertical, Camera } from 'lucide-react';
interface MobileHeaderProps {
  title: string;
  showSearch?: boolean;
  rightAction?: React.ReactNode;
}
export function MobileHeader({
  title,
  showSearch = true,
  rightAction
}: MobileHeaderProps) {
  return <div className="h-[60px] bg-[#008069] text-white flex items-center justify-between px-4 shadow-md z-50 sticky top-0">
      <h1 className="text-xl font-medium tracking-wide">{title}</h1>

      <div className="flex items-center gap-5">
        {rightAction}
        {showSearch && <Search className="w-6 h-6" />}
        <MoreVertical className="w-6 h-6" />
      </div>
    </div>;
}