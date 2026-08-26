import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentApi } from "../services/appointmentApi";
import { journeyApi } from "../services/journeyApi";
import { AppointmentStatusBadge } from "../components/common/StatusBadge";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import {
  CalendarCheck2,
  Clock,
  User,
  Phone,
  Building,
  Stethoscope,
  ArrowLeft,
  FileText,
  GitMerge,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Printer,
} from "lucide-react";

export const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => appointmentApi.getAppointmentById(id || ""),
    enabled: !!id,
  });

  const { data: journey } = useQuery({
    queryKey: ["journey", id],
    queryFn: () => journeyApi.getJourneyByAppointmentId(id || ""),
    enabled: !!id,
  });

  const handleCheckIn = async () => {
    if (!appointment) return;
    try {
      await appointmentApi.checkInPatient(appointment.id, "NORMAL", user?.name);
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["journey", id] });
    } catch (err: any) {
      alert(err.message || "Failed to check in.");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading appointment record from hospital server...
        </div>
      </PageContainer>
    );
  }

  if (!appointment) {
    return (
      <PageContainer>
        <div className="p-12 text-center">
          <p className="text-sm font-bold text-slate-800">Appointment Record Not Found</p>
          <button
            onClick={() => navigate("/appointments")}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Appointments
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Appointment ${appointment.referenceNumber}`}
      subtitle={`Outpatient clinical visit details for ${appointment.patientName}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/appointments")}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
          {appointment.status === "CONFIRMED" && (
            <DoubleActionButton
              onAction={handleCheckIn}
              variant="success"
              size="md"
              loadingText="Checking in..."
            >
              <UserCheck className="w-4 h-4 mr-1.5" />
              <span>Check In Patient</span>
            </DoubleActionButton>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl">
        {/* Status Strip */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-base font-bold text-slate-900">
                {appointment.patientName}
              </span>
              <AppointmentStatusBadge status={appointment.status} />
              {appointment.affectedByDoctorAbsence && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  ⚠ Doctor Absence
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              MRN: {appointment.patientMrn} • Ref: {appointment.referenceNumber} • Hospital: {appointment.hospitalId}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {appointment.queueToken && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Active Queue Token
                </span>
                <span className="text-2xl font-black font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  {appointment.queueToken}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clinical & Scheduling Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointment Specifications */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <CalendarCheck2 className="w-4 h-4 text-blue-600" />
              <span>Visit Information & Schedule</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Scheduled Date:</span>
                <strong className="text-slate-800">{appointment.appointmentDate}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Expected Time Window:</span>
                <strong className="text-blue-700">{appointment.expectedStartTime} – {appointment.expectedEndTime}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Recommended Arrival:</span>
                <strong className="text-amber-700">{appointment.recommendedArrivalTime}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Department:</span>
                <strong className="text-slate-800">{appointment.departmentName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Attending Doctor:</span>
                <strong className="text-slate-800">{appointment.doctorName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Clinical Service:</span>
                <strong className="text-slate-800">{appointment.serviceName}</strong>
              </div>
              {appointment.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Clinical Notes / Reason:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Patient Details & Journey Progress */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span>Patient Contact & Identity</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Full Name:</span>
                <strong className="text-slate-800">{appointment.patientName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Contact Number:</span>
                <strong className="text-slate-800">{appointment.patientPhone}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Priority Classification:</span>
                <span className="font-semibold text-slate-800">{appointment.priorityLevel}</span>
              </div>
              {appointment.checkedInAt && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Arrival Checked In At:</span>
                  <span className="font-bold text-emerald-700">{appointment.checkedInAt}</span>
                </div>
              )}
            </div>

            {journey && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <GitMerge className="w-3.5 h-3.5 text-blue-600" />
                    <span>Multi-Step Journey Flow</span>
                  </span>
                  <Link
                    to={`/journey/${appointment.id}`}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Open Journey Tracker →
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {journey.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                        step.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800"
                          : step.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-800 font-bold ring-1 ring-blue-300"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {step.status === "COMPLETED" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-[9px]">
                            {step.order}
                          </span>
                        )}
                        <span>{step.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{step.roomNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
