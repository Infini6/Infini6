import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { RealtimeEventPayload, queueRealtimeHandler } from './queueRealtime';
import { appointmentRealtimeHandler } from './appointmentRealtime';
import { doctorRealtimeHandler } from './doctorRealtime';
import { notificationRealtimeHandler } from './notificationRealtime';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';

export type RealtimeConnectionStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'ERROR';

export type { RealtimeEventPayload };

type StatusListener = (status: RealtimeConnectionStatus) => void;
type EventListener = (event: RealtimeEventPayload) => void;
type SyncTimeListener = (time: string) => void;

function formatTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private currentHospitalId: string | null = null;
  private connectionStatus: RealtimeConnectionStatus = 'DISCONNECTED';
  private lastUpdatedTime: string = formatTimestamp();
  private statusListeners: Set<StatusListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();
  private syncTimeListeners: Set<SyncTimeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isInitializing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('smart-hospital-realtime-bus');
        this.broadcastChannel.onmessage = (msgEvent) => {
          if (msgEvent.data && msgEvent.data.table) {
            this.handleIncomingBroadcast(msgEvent.data);
          }
        };
      } catch (e) {
        console.warn('[Realtime] BroadcastChannel unavailable:', e);
      }
    }
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.connectionStatus;
  }

  public getLastUpdatedTime(): string {
    return this.lastUpdatedTime;
  }

  // Alias for backward compatibility
  public getLastSyncTime(): string {
    return this.lastUpdatedTime;
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public subscribeSyncTime(listener: SyncTimeListener): () => void {
    this.syncTimeListeners.add(listener);
    listener(this.lastUpdatedTime);
    return () => {
      this.syncTimeListeners.delete(listener);
    };
  }

  public subscribeEvents(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private setStatus(newStatus: RealtimeConnectionStatus) {
    if (this.connectionStatus !== newStatus) {
      this.connectionStatus = newStatus;
      this.statusListeners.forEach((listener) => {
        try {
          listener(newStatus);
        } catch (err) {
          console.error('[Realtime] Status listener error:', err);
        }
      });
    }
  }

  public touchSyncTime() {
    this.lastUpdatedTime = formatTimestamp();
    this.syncTimeListeners.forEach((listener) => {
      try {
        listener(this.lastUpdatedTime);
      } catch (err) {
        console.error('[Realtime] SyncTime listener error:', err);
      }
    });
  }

  public simulateDisconnect(forceOffline: boolean) {
    if (forceOffline) {
      this.setStatus('DISCONNECTED');
    } else {
      this.setStatus('CONNECTED');
      this.touchSyncTime();
    }
  }

  /**
   * Initialize and authenticate Supabase Realtime channel for authorized hospital
   * Prevents duplicate subscriptions and isolates subscriptions per hospital
   */
  public async init(hospitalId: string) {
    if (!hospitalId) return;

    // Prevent duplicate subscription if already subscribed to same hospital
    if (this.currentHospitalId === hospitalId && this.channel && this.connectionStatus === 'CONNECTED') {
      return;
    }

    if (this.isInitializing) return;
    this.isInitializing = true;

    // Clean up any existing channel before opening new one
    this.disconnect();
    this.currentHospitalId = hospitalId;
    this.touchSyncTime();

    if (!isSupabaseConfigured) {
      // Offline / Local Demo Mode: Set CONNECTED so local multi-window sync works seamlessly
      this.setStatus('CONNECTED');
      this.isInitializing = false;
      return;
    }

    this.setStatus('RECONNECTING');

    try {
      // 1. Authenticate Supabase Realtime connection
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      // 2. Subscribe ONLY to data belonging to the authenticated user's authorized hospital
      const channelName = `hospital-${hospitalId}-realtime`;
      this.channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'queue_entries' },
          (payload) => this.routeEvent('queue_entries', payload, hospitalId)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments', filter: `hospital_id=eq.${hospitalId}` },
          (payload) => this.routeEvent('appointments', payload, hospitalId)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'doctors', filter: `hospital_id=eq.${hospitalId}` },
          (payload) => this.routeEvent('doctors', payload, hospitalId)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'doctor_schedules' },
          (payload) => this.routeEvent('doctor_schedules', payload, hospitalId)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'journeys' },
          (payload) => this.routeEvent('journeys', payload, hospitalId)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          (payload) => this.routeEvent('notifications', payload, hospitalId)
        )
        .subscribe((status, err) => {
          if (err) {
            console.warn('[Realtime] Subscription error:', err);
            this.setStatus('ERROR');
            return;
          }
          if (status === 'SUBSCRIBED') {
            this.setStatus('CONNECTED');
          } else if (status === 'TIMED_OUT') {
            this.setStatus('RECONNECTING');
          } else if (status === 'CLOSED') {
            this.setStatus('DISCONNECTED');
          }
        });
    } catch (err) {
      console.error('[Realtime] Init failure:', err);
      this.setStatus('ERROR');
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Route incoming Postgres change to domain handlers and notify UI listeners
   */
  private routeEvent(table: string, payload: any, hospitalId: string) {
    const eventPayload: RealtimeEventPayload = {
      table,
      eventType: payload.eventType || 'UPDATE',
      new: payload.new || {},
      old: payload.old || {},
      hospitalId,
    };

    this.touchSyncTime();

    // Invalidate ONLY affected queries via domain handlers
    switch (table) {
      case 'queue_entries':
        queueRealtimeHandler.handle(eventPayload, hospitalId);
        break;
      case 'appointments':
        appointmentRealtimeHandler.handle(eventPayload, hospitalId);
        break;
      case 'doctors':
      case 'doctor_schedules':
        doctorRealtimeHandler.handle(eventPayload, hospitalId);
        break;
      case 'journeys':
        queryClient.invalidateQueries({ queryKey: queryKeys.queue.all(hospitalId) });
        break;
      case 'notifications':
        notificationRealtimeHandler.handle(eventPayload, hospitalId);
        break;
      default:
        break;
    }

    // Broadcast to registered UI listeners
    this.eventListeners.forEach((listener) => {
      try {
        listener(eventPayload);
      } catch (err) {
        console.error('[Realtime] Listener error:', err);
      }
    });
  }

  /**
   * Handle incoming message from cross-tab BroadcastChannel
   */
  private handleIncomingBroadcast(payload: RealtimeEventPayload) {
    // Enforce hospital isolation: do NOT process events from another hospital
    if (payload.hospitalId && this.currentHospitalId && payload.hospitalId !== this.currentHospitalId) {
      return;
    }

    this.touchSyncTime();

    const hid = this.currentHospitalId || '';
    switch (payload.table) {
      case 'queue_entries':
        queueRealtimeHandler.handle(payload, hid);
        break;
      case 'appointments':
        appointmentRealtimeHandler.handle(payload, hid);
        break;
      case 'doctors':
      case 'doctor_schedules':
        doctorRealtimeHandler.handle(payload, hid);
        break;
      case 'journeys':
        queryClient.invalidateQueries({ queryKey: queryKeys.queue.all(hid) });
        break;
      case 'notifications':
        notificationRealtimeHandler.handle(payload, hid);
        break;
      default:
        break;
    }

    this.eventListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[Realtime] Broadcast listener error:', err);
      }
    });
  }

  /**
   * Broadcast a mutation across the local hospital bus for immediate multi-window sync
   */
  public broadcastLocalChange(
    table: string, 
    newRecord: Record<string, unknown>, 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE'
  ) {
    if (!this.currentHospitalId) return;
    this.touchSyncTime();

    const eventPayload: RealtimeEventPayload = {
      table,
      eventType,
      new: newRecord,
      old: {},
      hospitalId: this.currentHospitalId,
    };

    // Route locally
    this.routeEvent(table, eventPayload, this.currentHospitalId);

    // Send across browser windows
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(eventPayload);
      }
    } catch (e) {
      console.warn('[Realtime] Broadcast post failed:', e);
    }
  }

  /**
   * Clean up and unsubscribe
   */
  public disconnect() {
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {
        console.warn('[Realtime] Remove channel error:', e);
      }
      this.channel = null;
    }
    this.currentHospitalId = null;
    this.setStatus('DISCONNECTED');
  }
}

export const realtimeManager = new RealtimeManager();
