import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600 text-white px-3.5 py-2 text-xs font-semibold shadow-lg border border-amber-500 animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>Mode Offline — Data tersimpan lokal & sinkron saat kembali online</span>
    </div>
  );
};
