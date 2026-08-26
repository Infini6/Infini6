import React from "react";
import { StaffRole } from "../../types";

export const RoleBadge: React.FC<{ role: StaffRole; className?: string }> = ({
  role,
  className = "",
}) => {
  switch (role) {
    case "HOSPITAL_ADMIN":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 ${className}`}
        >
          Hospital Admin
        </span>
      );
    case "DOCTOR":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${className}`}
        >
          Attending Doctor
        </span>
      );
    case "RECEPTION_STAFF":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 ${className}`}
        >
          Reception Staff
        </span>
      );
    case "QUEUE_OPERATOR":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 ${className}`}
        >
          Queue Operator
        </span>
      );
    case "DEPARTMENT_STAFF":
    default:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 ${className}`}
        >
          Clinical Staff
        </span>
      );
  }
};

