import React from "react";
import {
  AppointmentStatus,
  QueueStatus,
  DoctorAvailabilityStatus,
  AlertSeverity,
} from "../../types";

export const AppointmentStatusBadge: React.FC<{ status: AppointmentStatus }> = ({ status }) => {
  switch (status) {
    case "CONFIRMED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Confirmed
        </span>
      );
    case "CHECKED_IN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Checked In
        </span>
      );
    case "CALLED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Called
        </span>
      );
    case "IN_CONSULTATION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          In Consultation
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
          ✓ Completed
        </span>
      );
    case "DELAYED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
          ⚠ Delayed
        </span>
      );
    case "RESCHEDULED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200/80">
          Rescheduled
        </span>
      );
    case "NO_SHOW":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          ✕ No Show
        </span>
      );
    case "CANCELLED":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/80">
          Cancelled
        </span>
      );
  }
};

export const QueueStatusBadge: React.FC<{ status: QueueStatus }> = ({ status }) => {
  switch (status) {
    case "WAITING":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
          Waiting
        </span>
      );
    case "CALLED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          Called to Room
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          ● In Progress
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
          ✓ Completed
        </span>
      );
    case "SKIPPED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
          Skipped
        </span>
      );
    case "NO_SHOW":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          No-Show
        </span>
      );
    case "TRANSFERRED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/80">
          Transferred
        </span>
      );
    default:
      return null;
  }
};

export const DoctorAvailabilityBadge: React.FC<{ status: DoctorAvailabilityStatus }> = ({ status }) => {
  switch (status) {
    case "AVAILABLE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Available
        </span>
      );
    case "IN_CONSULTATION":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          ● In Consultation
        </span>
      );
    case "ON_BREAK":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          On Break
        </span>
      );
    case "UNAVAILABLE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Unavailable
        </span>
      );
    case "ON_LEAVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
          On Leave
        </span>
      );
  }
};

export const AlertSeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  switch (severity) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
          CRITICAL
        </span>
      );
    case "WARNING":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
          WARNING
        </span>
      );
    case "INFO":
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
          INFO
        </span>
      );
  }
};

