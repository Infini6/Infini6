import React from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Bell, CheckCheck, Clock, ShieldAlert } from "lucide-react";

export const NotificationsPage: React.FC = () => {
  const notifications = [
    {
      id: "n-1",
      title: "Doctor Absence Logged: Dr. Jonathan Hayes",
      body: "Marked UNAVAILABLE. 2 pending appointments flagged for staff reassignment.",
      time: "10 mins ago",
      type: "ALERT",
    },
    {
      id: "n-2",
      title: "Queue Delay Warning: Neurology",
      body: "Average wait time has exceeded 35 minutes threshold.",
      time: "25 mins ago",
      type: "WARNING",
    },
    {
      id: "n-3",
      title: "Patient Arrival Check-In: Robert Chen",
      body: "Assigned queue token C-21 in Cardiology. Ready for consultation call.",
      time: "42 mins ago",
      type: "INFO",
    },
    {
      id: "n-4",
      title: "Shift Handover Notice",
      body: "Morning shift roster successfully synced with Central Hospital Master DB.",
      time: "2 hours ago",
      type: "SYSTEM",
    },
  ];

  return (
    <PageContainer
      title="Staff Notification Center"
      subtitle="System dispatch logs, real-time alerts, and automated queue triggers"
    >
      <div className="space-y-4 max-w-4xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === "ALERT"
                    ? "bg-rose-100 text-rose-700"
                    : n.type === "WARNING"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
