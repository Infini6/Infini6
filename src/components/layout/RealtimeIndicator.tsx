import React from 'react';
import { useRealtime } from '../../hooks/useRealtime';
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const RealtimeIndicator: React.FC = () => {
  const { status, lastUpdatedTime, reconnect } = useRealtime();

  const isConnected = status === 'CONNECTED';

  const config = {
    CONNECTED: {
      label: '● LIVE',
      dot: 'bg-emerald-500 ring-4 ring-emerald-500/20',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      icon: <Wifi className="w-3 h-3 text-emerald-600" />,
      tooltip: `Realtime WebSocket active. Last updated: ${lastUpdatedTime}`,
    },
    RECONNECTING: {
      label: 'CONNECTING...',
      dot: 'bg-amber-500 animate-pulse',
      badge: 'bg-amber-50 text-amber-700 border-amber-300',
      icon: <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />,
      tooltip: 'Reconnecting to Supabase Realtime channel...',
    },
    DISCONNECTED: {
      label: 'DISCONNECTED',
      dot: 'bg-red-500',
      badge: 'bg-red-50 text-red-700 border-red-300',
      icon: <WifiOff className="w-3 h-3 text-red-500" />,
      tooltip: 'Live updates temporarily unavailable. Click to reconnect.',
    },
    ERROR: {
      label: 'ERROR',
      dot: 'bg-red-600 animate-bounce',
      badge: 'bg-red-50 text-red-700 border-red-300',
      icon: <AlertTriangle className="w-3 h-3 text-red-600" />,
      tooltip: 'Realtime connection error. Click to retry.',
    },
  }[status] || {
    label: 'DISCONNECTED',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-300',
    icon: <WifiOff className="w-3 h-3 text-red-500" />,
    tooltip: 'Live updates temporarily unavailable. Click to reconnect.',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all hover:opacity-90 select-none shadow-sm',
          config.badge
        )}
        onClick={!isConnected ? reconnect : undefined}
        title={config.tooltip}
      >
        <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />
        <span className="font-bold tracking-wider text-[11px]">{config.label}</span>
        {config.icon}
      </div>

      {isConnected ? (
        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          Last updated: {lastUpdatedTime}
        </span>
      ) : (
        <span className="text-[11px] text-red-600 font-medium hidden sm:inline flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 inline text-amber-500" />
          Live updates temporarily unavailable.
        </span>
      )}
    </div>
  );
};
