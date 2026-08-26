import React from "react";
import { useRealtimeStatus } from "../../websocket/useRealtime";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export const ConnectionStatusBadge: React.FC = () => {
  const { status, lastHeartbeat } = useRealtimeStatus();

  if (status === "CONNECTED") {
    return (
      <div
        id="ws-status-badge"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
        title={`Authenticated WebSocket Live. Last sync: ${lastHeartbeat.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold tracking-wide">● LIVE</span>
      </div>
    );
  }

  if (status === "CONNECTING" || status === "RECONNECTING") {
    return (
      <div
        id="ws-status-badge"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
      >
        <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div
      id="ws-status-badge"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
      title={`Live updates temporarily paused. Last updated: ${lastHeartbeat.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
    >
      <WifiOff className="w-3 h-3 text-slate-400" />
      <span>Offline</span>
    </div>
  );
};
