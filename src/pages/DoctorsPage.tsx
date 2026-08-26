import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorApi } from "../services/doctorApi";
import { departmentApi } from "../services/hospitalApi";
import { appointmentApi } from "../services/appointmentApi";
import { Doctor, DoctorAvailabilityStatus, Appointment } from "../types";
import { DoctorAvailabilityBadge } from "../components/common/StatusBadge";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import { useRealtimeSubscription } from "../websocket/useRealtime";
import {
  Stethoscope,
  Building,
  Clock,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  CheckCheck,
  RefreshCw,
} from "lucide-react";

export const DoctorsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useRealtimeSubscription("*");

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Status Change Modal State
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [newStatus, setNewStatus] = useState<DoctorAvailabilityStatus>("AVAILABLE");
  const [absenceReason, setAbsenceReason] = useState("");

  // Affected Appointments Workflow Modal State (Spec section 28-29)
  const [affectedWorkflowDoctor, setAffectedWorkflowDoctor] = useState<Doctor | null>(null);
  const [affectedAppointments, setAffectedAppointments] = useState<Appointment[]>([]);
  const [reassignModalApt, setReassignModalApt] = useState<Appointment | null>(null);
  const [selectedAltDoctorId, setSelectedAltDoctorId] = useState<string>("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors", selectedDept, selectedStatus],
    queryFn: () =>
      doctorApi.getDoctors({
        departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
        availability: selectedStatus !== "ALL" ? selectedStatus : undefined,
      }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.getDepartments(),
  });

  const filteredDoctors = doctors.filter((doc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.specialization.toLowerCase().includes(q) ||
      doc.departmentName.toLowerCase().includes(q) ||
      doc.roomNumber.toLowerCase().includes(q)
    );
  });

  // Open availability update modal
  const handleOpenStatusModal = (doc: Doctor) => {
    setActiveDoctor(doc);
    setNewStatus(doc.availability);
    setAbsenceReason(doc.unavailableReason || "");
  };

  // Submit availability status change
  const handleStatusSubmit = async () => {
    if (!activeDoctor) return;
    try {
      const res = await doctorApi.setAvailability(
        activeDoctor.id,
        newStatus,
        absenceReason || undefined,
        user?.name
      );

      setActiveDoctor(null);
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });

      if (
        (newStatus === "UNAVAILABLE" || newStatus === "ON_LEAVE") &&
        res.affectedAppointments.length > 0
      ) {
        // Trigger Doctor Unavailable Workflow
        setAffectedWorkflowDoctor(res.doctor);
        setAffectedAppointments(res.affectedAppointments);
      } else {
        setToastMessage(`Updated availability for ${res.doctor.name} to ${newStatus}.`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update availability.");
    }
  };

  // Reassign affected patient to alternative doctor
  const handleReassignSubmit = async () => {
    if (!reassignModalApt || !selectedAltDoctorId) return;
    try {
      const updated = await appointmentApi.reassignDoctor(
        reassignModalApt.id,
        selectedAltDoctorId,
        reassignModalApt.expectedStartTime,
        user?.name
      );

      setToastMessage(
        `Successfully reassigned ${updated.patientName} to ${updated.doctorName}. Patient notified!`
      );
      setReassignModalApt(null);

      // Refresh affected list
      if (affectedWorkflowDoctor) {
        const remaining = await doctorApi.getAffectedAppointments(affectedWorkflowDoctor.id);
        setAffectedAppointments(remaining);
      }
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    } catch (err: any) {
      alert(err.message || "Failed to reassign patient.");
    }
  };

  return (
    <PageContainer
      title="Doctor Management & Clinical Availability"
      subtitle="Monitor medical roster availability, manage consultation status, and resolve doctor unavailability workflows"
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

        {/* Doctor Absence Critical Banner if any doctor is unavailable */}
        {doctors.some((d) => d.availability === "UNAVAILABLE") && (
          <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  Active Doctor Absence Incident
                </h4>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Dr. Jonathan Hayes (Neurology) is marked unavailable. Review pending appointments and assign alternative doctors.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const unavailDoc = doctors.find((d) => d.availability === "UNAVAILABLE");
                if (unavailDoc) {
                  const affected = await doctorApi.getAffectedAppointments(unavailDoc.id);
                  setAffectedWorkflowDoctor(unavailDoc);
                  setAffectedAppointments(affected);
                }
              }}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition"
            >
              Review Affected Appointments
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors, specialty, room..."
              className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200/80 rounded-xl bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="py-2.5 px-3 text-xs border border-slate-200/80 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2.5 px-3 text-xs border border-slate-200/80 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">All Availability</option>
              <option value="AVAILABLE">Available</option>
              <option value="IN_CONSULTATION">In Consultation</option>
              <option value="ON_BREAK">On Break</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </div>

        {/* Doctor Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{doc.qualification}</p>
                  </div>
                  <DoctorAvailabilityBadge status={doc.availability} />
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <strong className="text-slate-800">{doc.departmentName}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Specialization:</span>
                    <span className="text-slate-800 truncate max-w-[150px]">{doc.specialization}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Consultation Room:</span>
                    <strong className="text-indigo-600">{doc.roomNumber}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Roster Hours:</span>
                    <span>{doc.workingHours}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center py-2.5 border-y border-slate-100 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Patients Served</span>
                    <span className="text-sm font-bold text-slate-900">{doc.patientsServedToday}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Avg Consult Time</span>
                    <span className="text-sm font-bold text-slate-900">{doc.avgConsultationMinutes} min</span>
                  </div>
                </div>

                {doc.statusMessage && (
                  <p className="text-[11px] font-medium text-indigo-700 bg-indigo-50/70 p-2.5 rounded-xl mb-4 border border-indigo-100/60">
                    {doc.statusMessage}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenStatusModal(doc)}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition text-center border border-slate-200/80"
                >
                  Update Status
                </button>
                {doc.availability === "UNAVAILABLE" && (
                  <button
                    onClick={async () => {
                      const affected = await doctorApi.getAffectedAppointments(doc.id);
                      setAffectedWorkflowDoctor(doc);
                      setAffectedAppointments(affected);
                    }}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition"
                  >
                    Affected ({doc.patientsWaitingCount})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Availability Update Modal */}
      {activeDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <span>Update Doctor Availability</span>
              </h3>
              <button
                onClick={() => setActiveDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl mb-4 text-xs text-slate-700 space-y-1 border border-slate-100">
              <p><strong>Doctor:</strong> {activeDoctor.name}</p>
              <p><strong>Department:</strong> {activeDoctor.departmentName} ({activeDoctor.roomNumber})</p>
              <p><strong>Current Status:</strong> {activeDoctor.availability}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select New Availability State:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["AVAILABLE", "IN_CONSULTATION", "ON_BREAK", "UNAVAILABLE", "ON_LEAVE"] as DoctorAvailabilityStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewStatus(st)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                          newStatus === st
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {(newStatus === "UNAVAILABLE" || newStatus === "ON_LEAVE" || newStatus === "ON_BREAK") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Absence Reason / Note:
                  </label>
                  <input
                    type="text"
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    placeholder="e.g. Emergency Surgical Call / Personal Leave / Clinical Break"
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  {newStatus === "UNAVAILABLE" && (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      ⚠ Marking unavailable will launch the Affected Appointments Reassignment workflow.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveDoctor(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <DoubleActionButton
                onAction={handleStatusSubmit}
                variant="primary"
                size="md"
                loadingText="Updating Availability..."
              >
                Confirm Availability
              </DoubleActionButton>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR UNAVAILABLE WORKFLOW MODAL (Spec section 28-29) */}
      {affectedWorkflowDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
                    ⚠ CLINICAL INCIDENT
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Doctor Unavailable Workflow
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>{affectedWorkflowDoctor.name}</strong> is unavailable today.
                  Affected scheduled patients: <strong>{affectedAppointments.length}</strong>
                </p>
              </div>
              <button
                onClick={() => setAffectedWorkflowDoctor(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Affected Patient Appointments
              </h4>

              {affectedAppointments.length === 0 ? (
                <div className="p-6 text-center text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs font-semibold">
                  ✓ All affected appointments for this doctor have been resolved and reassigned!
                </div>
              ) : (
                <div className="space-y-2">
                  {affectedAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {apt.patientName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {apt.patientMrn}
                          </span>
                          <span className="font-semibold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-lg">
                            {apt.expectedStartTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {apt.serviceName} • {apt.patientPhone}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setReassignModalApt(apt);
                            const alt = doctors.find(
                              (d) =>
                                d.departmentId === apt.departmentId &&
                                d.id !== apt.doctorId &&
                                d.availability !== "UNAVAILABLE"
                            );
                            setSelectedAltDoctorId(alt?.id || doctors[0]?.id || "");
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
                        >
                          Reassign Doctor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Reassignment operations are recorded in the audit log and dispatched via WebSocket.
              </p>
              <button
                onClick={() => setAffectedWorkflowDoctor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Specific Appointment Modal */}
      {reassignModalApt && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Select Alternative Doctor
              </h3>
              <button
                onClick={() => setReassignModalApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl mb-4 text-xs text-slate-700 space-y-1 border border-slate-100">
              <p><strong>Patient:</strong> {reassignModalApt.patientName} ({reassignModalApt.patientMrn})</p>
              <p><strong>Current Slot:</strong> {reassignModalApt.expectedStartTime} ({reassignModalApt.departmentName})</p>
              <p><strong>Original Doctor:</strong> {reassignModalApt.doctorName}</p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-semibold text-slate-700">
                Assign to Available Doctor:
              </label>
              <select
                value={selectedAltDoctorId}
                onChange={(e) => setSelectedAltDoctorId(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/70 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
              >
                {doctors
                  .filter((d) => d.id !== reassignModalApt.doctorId && d.availability !== "UNAVAILABLE")
                  .map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.departmentName} - {doc.roomNumber}) [{doc.availability}]
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setReassignModalApt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <DoubleActionButton
                onAction={handleReassignSubmit}
                variant="primary"
                size="md"
                loadingText="Reassigning..."
              >
                Confirm Reassignment
              </DoubleActionButton>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
