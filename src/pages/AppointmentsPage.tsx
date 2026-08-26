import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentApi, AppointmentFilters } from "../services/appointmentApi";
import { departmentApi } from "../services/hospitalApi";
import { doctorApi } from "../services/doctorApi";
import { Appointment, AppointmentStatus } from "../types";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import { AppointmentStatusBadge } from "../components/common/StatusBadge";
import { useRealtimeSubscription } from "../websocket/useRealtime";
import {
  CalendarCheck2,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Clock,
  Building,
  Stethoscope,
  ChevronRight,
  ArrowRightLeft,
  AlertCircle,
  FileText,
  CheckCheck,
} from "lucide-react";

export const AppointmentsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useRealtimeSubscription("*");

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedDoctor, setSelectedDoctor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [selectedDate, setSelectedDate] = useState("2026-08-26");

  // Check-In Modal State
  const [checkInApt, setCheckInApt] = useState<Appointment | null>(null);
  const [priorityLevel, setPriorityLevel] = useState<"NORMAL" | "PRIORITY" | "ELDERLY">("NORMAL");

  // Reschedule Modal State
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("2026-08-27");
  const [rescheduleTime, setRescheduleTime] = useState("10:00 AM");
  const [rescheduleReason, setRescheduleReason] = useState("Patient requested slot modification");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filters: AppointmentFilters = {
    search: search || undefined,
    departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
    doctorId: selectedDoctor !== "ALL" ? selectedDoctor : undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
    date: selectedDate || undefined,
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", filters],
    queryFn: () => appointmentApi.getAppointments(filters),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.getDepartments(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors", selectedDept],
    queryFn: () =>
      doctorApi.getDoctors(selectedDept !== "ALL" ? { departmentId: selectedDept } : undefined),
  });

  const handleCheckInSubmit = async () => {
    if (!checkInApt) return;
    try {
      const res = await appointmentApi.checkInPatient(checkInApt.id, priorityLevel, user?.name);
      setToastMessage(
        `Checked in ${res.appointment.patientName}! Assigned Token: ${res.queueEntry.tokenNumber}`
      );
      setCheckInApt(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["queues"] });
    } catch (err: any) {
      alert(err.message || "Failed to check in appointment.");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleApt) return;
    try {
      await appointmentApi.reschedule(
        rescheduleApt.id,
        rescheduleDate,
        rescheduleTime,
        rescheduleReason,
        user?.name
      );
      setToastMessage(`Rescheduled appointment to ${rescheduleDate} at ${rescheduleTime}.`);
      setRescheduleApt(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (err: any) {
      alert(err.message || "Failed to reschedule.");
    }
  };

  return (
    <PageContainer
      title="Appointment & Patient Check-In Center"
      subtitle="Verify patient identities, initiate authorized kiosk/counter check-in, and manage scheduling"
    >
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Patient Name, MRN, Ref #, Doctor..."
                className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200/80 rounded-xl bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900 transition"
              />
            </div>

            {/* Department */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedDoctor("ALL");
                }}
                className="w-full py-2.5 px-3 text-xs border border-slate-200/80 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full py-2.5 px-3 text-xs border border-slate-200/80 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="ALL">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full py-2.5 px-3 text-xs border border-slate-200/80 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CALLED">Called</option>
                <option value="IN_CONSULTATION">In Consultation</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="NO_SHOW">No-Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Hospital Appointments ({appointments.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff view filtered by operational scope and hospital tenant
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Time & Window</th>
                  <th className="py-3.5 px-4">Patient Information</th>
                  <th className="py-3.5 px-4">Department & Doctor</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Queue Token</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                      No appointments matching current filters found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className={`hover:bg-indigo-50/30 transition group ${
                        apt.affectedByDoctorAbsence ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{apt.expectedStartTime}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Arrive: {apt.recommendedArrivalTime}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{apt.patientName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {apt.patientMrn} • {apt.patientPhone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{apt.departmentName}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Stethoscope className="w-3 h-3 text-slate-400" />
                          <span>{apt.doctorName}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium">{apt.serviceName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {apt.queueToken ? (
                          <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200/80">
                            {apt.queueToken}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not Checked In</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <AppointmentStatusBadge status={apt.status} />
                        {apt.affectedByDoctorAbsence && (
                          <span className="block text-[10px] font-bold text-rose-600 mt-0.5">
                            Doctor Unavailable
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Check In Button */}
                          {apt.status === "CONFIRMED" && (
                            <button
                              onClick={() => {
                                setCheckInApt(apt);
                                setPriorityLevel("NORMAL");
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Check In</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setRescheduleApt(apt);
                              setRescheduleDate(apt.appointmentDate);
                              setRescheduleTime(apt.expectedStartTime);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition"
                            title="Reschedule appointment"
                          >
                            Reschedule
                          </button>

                          <Link
                            to={`/appointments/${apt.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
                            title="View detailed record"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Check In Modal */}
      {checkInApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>Patient Arrival Check-In</span>
              </h3>
              <button
                onClick={() => setCheckInApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl mb-4 text-xs space-y-1 text-slate-700 border border-slate-100">
              <p><strong>Patient:</strong> {checkInApt.patientName} (MRN: {checkInApt.patientMrn})</p>
              <p><strong>Department:</strong> {checkInApt.departmentName}</p>
              <p><strong>Attending Doctor:</strong> {checkInApt.doctorName}</p>
              <p><strong>Service:</strong> {checkInApt.serviceName}</p>
              <p><strong>Scheduled Slot:</strong> {checkInApt.expectedStartTime} (Arrive by: {checkInApt.recommendedArrivalTime})</p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-semibold text-slate-700">
                Assign Priority / Assistance Level:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriorityLevel("NORMAL")}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    priorityLevel === "NORMAL"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-400/20"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityLevel("ELDERLY")}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    priorityLevel === "ELDERLY"
                      ? "bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-400/20"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Elderly Assist
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityLevel("PRIORITY")}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                    priorityLevel === "PRIORITY"
                      ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-400/20"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Clinical Urgent
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Upon confirmation, the backend queue engine will generate a smart token and notify the patient.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setCheckInApt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <DoubleActionButton
                onAction={handleCheckInSubmit}
                variant="success"
                size="md"
                loadingText="Validating & Check-In..."
              >
                Confirm Arrival Check-In
              </DoubleActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Reschedule Appointment</span>
              </h3>
              <button
                onClick={() => setRescheduleApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl mb-4 text-xs text-slate-700 space-y-1 border border-slate-100">
              <p><strong>Patient:</strong> {rescheduleApt.patientName}</p>
              <p><strong>Current Slot:</strong> {rescheduleApt.appointmentDate} at {rescheduleApt.expectedStartTime}</p>
              <p><strong>Doctor:</strong> {rescheduleApt.doctorName}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Appointment Date:
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Start Time Window:
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="09:00 AM">09:00 AM - 09:30 AM</option>
                  <option value="10:00 AM">10:00 AM - 10:30 AM</option>
                  <option value="11:30 AM">11:30 AM - 12:00 PM</option>
                  <option value="02:00 PM">02:00 PM - 02:30 PM</option>
                  <option value="03:30 PM">03:30 PM - 04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rescheduling:
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Doctor absence / Patient schedule request"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRescheduleApt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <DoubleActionButton
                onAction={handleRescheduleSubmit}
                variant="primary"
                size="md"
                loadingText="Updating Slot..."
              >
                Confirm Rescheduling
              </DoubleActionButton>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
