import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  realtimeManager, 
  RealtimeConnectionStatus, 
  RealtimeEventPayload 
} from '../realtime/realtimeManager';
import { useAuth } from './AuthContext';

export type { RealtimeConnectionStatus, RealtimeEventPayload };

interface RealtimeAlert {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
}

interface RealtimeContextType {
  status: RealtimeConnectionStatus;
  isConnected: boolean;
  lastUpdatedTime: string;
  lastSyncTime: string; // Backward compatibility
  lastEvent: RealtimeEventPayload | null;
  alerts: RealtimeAlert[];
  dismissAlert: (id: string) => void;
  reconnect: () => void;
  simulateDisconnect: (forceOffline: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RealtimeConnectionStatus>(realtimeManager.getStatus());
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(realtimeManager.getLastUpdatedTime());
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const reconnect = useCallback(() => {
    if (user?.hospital?.id) {
      realtimeManager.init(user.hospital.id);
    }
  }, [user?.hospital?.id]);

  const simulateDisconnect = useCallback((forceOffline: boolean) => {
    realtimeManager.simulateDisconnect(forceOffline);
  }, []);

  useEffect(() => {
    // 1. Subscribe to status changes
    const unsubStatus = realtimeManager.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    // 2. Subscribe to timestamp changes
    const unsubSync = realtimeManager.subscribeSyncTime((time) => {
      setLastUpdatedTime(time);
    });

    // 3. Subscribe to domain events
    const unsubEvents = realtimeManager.subscribeEvents((event) => {
      setLastEvent(event);

      // Generate contextual notification
      if (event.table === 'queue_entries') {
        const ref = (event.new as any)?.queue_reference || 'Token';
        const st = (event.new as any)?.status;
        let message = '';
        let type: 'info' | 'success' | 'warning' = 'info';

        if (st === 'CALLED') {
          message = `Patient called: ${ref}`;
          type = 'warning';
        } else if (st === 'IN_PROGRESS') {
          message = `Consultation started for ${ref}`;
          type = 'info';
        } else if (st === 'COMPLETED') {
          message = `Consultation completed for ${ref}`;
          type = 'success';
        } else if (st === 'SKIPPED') {
          message = `Patient skipped: ${ref}`;
          type = 'warning';
        } else if (st === 'NO_SHOW') {
          message = `Marked No-Show: ${ref}`;
          type = 'warning';
        } else if (st === 'TRANSFERRED') {
          message = `Patient transferred: ${ref}`;
          type = 'info';
        } else if (st === 'WAITING') {
          message = `Queue updated: ${ref} checked in.`;
          type = 'info';
        }

        if (message) {
          const newAlert: RealtimeAlert = {
            id: `alert-${Date.now()}-${Math.random()}`,
            message,
            type,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          };
          setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
        }
      } else if (event.table === 'doctors') {
        const docName = (event.new as any)?.profile?.name || 'Doctor';
        const docStatus = (event.new as any)?.status;
        if (docStatus === 'UNAVAILABLE' || docStatus === 'ON_LEAVE' || docStatus === 'OFFLINE' || docStatus === 'ON_BREAK') {
          const newAlert: RealtimeAlert = {
            id: `alert-${Date.now()}-${Math.random()}`,
            message: `Doctor status update: Dr. ${docName} is ${docStatus.replace('_', ' ')}`,
            type: 'warning',
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
          };
          setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
        }
      } else if (event.table === 'notifications') {
        const title = (event.new as any)?.title || 'New Notification';
        const newAlert: RealtimeAlert = {
          id: `alert-${Date.now()}-${Math.random()}`,
          message: title,
          type: 'info',
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        };
        setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
      }
    });

    // 4. Initialize realtime for authorized hospital
    if (user?.hospital?.id) {
      realtimeManager.init(user.hospital.id);
    }

    // 5. Clean up listeners on unmount (prevents duplicate subscriptions)
    return () => {
      unsubStatus();
      unsubSync();
      unsubEvents();
    };
  }, [user?.hospital?.id]);

  return (
    <RealtimeContext.Provider
      value={{
        status,
        isConnected: status === 'CONNECTED',
        lastUpdatedTime,
        lastSyncTime: lastUpdatedTime,
        lastEvent,
        alerts,
        dismissAlert,
        reconnect,
        simulateDisconnect,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
