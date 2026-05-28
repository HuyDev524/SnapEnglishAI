import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ModeBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null; // Don't show anything when online, or maybe show a brief success message
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-5xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Đang ở chế độ ngoại tuyến. Các tính năng AI có thể bị giới hạn.</span>
        </div>
      </div>
    </div>
  );
};

export default ModeBanner;
