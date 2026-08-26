import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketClient, ConnectionStatus } from "./socket";
import { WebSocketEventType, WebSocketEventPayload } from "./events";

export function useRealtimeStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(socketClient.getStatus());
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(socketClient.getLastHeartbeat());

  useEffect(() => {
    const unsub = socketClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setLastHeartbeat(socketClient.getLastHeartbeat());
    });

    const interval = setInterval(() => {
      setLastHeartbeat(socketClient.getLastHeartbeat());
    }, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  return { status, lastHeartbeat, isLive: status === "CONNECTED" };
}

export function useRealtimeSubscription<T = any>(
  event: WebSocketEventType | "*",
  callback?: (payload: WebSocketEventPayload<T>) => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = socketClient.on<T>(event, (payload) => {
      // Automatic TanStack query cache synchronization based on event type
      switch (payload.type) {
        case "QUEUE_UPDATED":
        case "PATIENT_CALLED":
        case "PATIENT_CHECKED_IN":
        case "CONSULTATION_STARTED":
        case "CONSULTATION_COMPLETED":
        case "PATIENT_SKIPPED":
        case "PATIENT_NO_SHOW":
          queryClient.invalidateQueries({ queryKey: ["queues"] });
          queryClient.invalidateQueries({ queryKey: ["operations"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          break;

        case "DOCTOR_AVAILABLE":
        case "DOCTOR_UNAVAILABLE":
          queryClient.invalidateQueries({ queryKey: ["doctors"] });
          queryClient.invalidateQueries({ queryKey: ["operations"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          break;

        case "APPOINTMENT_CREATED":
        case "APPOINTMENT_CANCELLED":
        case "APPOINTMENT_RESCHEDULED":
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
          break;

        case "JOURNEY_UPDATED":
          queryClient.invalidateQueries({ queryKey: ["journey"] });
          break;

        case "SYSTEM_ALERT_CREATED":
        case "HOSPITAL_STATUS_CHANGED":
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["operations"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          break;
      }

      if (callback) {
        callback(payload);
      }
    });

    return () => {
      unsub();
    };
  }, [event, callback, queryClient]);
}
