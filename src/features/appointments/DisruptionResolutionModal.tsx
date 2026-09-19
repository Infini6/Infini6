import React, { useState } from 'react';
import {
  AlertTriangle,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Building,
  Activity,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  DoctorDisruptionIncident,
  AffectedAppointmentItem,
  RescheduleActionPayload,
} from '../../types/disruption.types';
import { formatTime, formatDate } from '../../utils/formatters';

export interface DisruptionResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: DoctorDisruptionIncident[];
  selectedIncident: DoctorDisruptionIncident | null;
  onSelectIncident: (incident: DoctorDisruptionIncident) => void;
  onReschedule: (payload: RescheduleActionPayload) => Promise<any>;
  isRescheduling?: boolean;
}

export const DisruptionResolutionModal: React.FC<DisruptionResolutionModalProps> = ({
  isOpen,
  onClose,
  incidents,
  selectedIncident,
  onSelectIncident,
  onReschedule,
  isRescheduling = false,
}) => {
  const activeIncident = selectedIncident || incidents[0] || null;

  // Selected appointment inside the incident for detail & resolution action
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  // Active sub-tab: PENDING vs RESOLVED
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');

  // Custom alternative form selection state
  const [customDoctorId, setCustomDoctorId] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionPayload: RescheduleActionPayload | null;
    confirmVariant: 'primary' | 'destructive' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionPayload: null,
    confirmVariant: 'primary',
  });

  // Local state for tracking resolved items during this session
  const [sessionResolvedIds, setSessionResolvedIds] = useState<Record<string, {
    newDoctorName?: string;
    newDate?: string;
    newTime?: string;
    action: 'RESCHEDULED' | 'CANCELLED';
  }>>({});

  // Compute pending vs resolved items
  const allAffected = activeIncident?.affectedAppointments || [];
  const pendingAppointments = allAffected.filter(
    (a) => !sessionResolvedIds[a.id] && !a.isResolved
  );
  const resolvedAppointments = allAffected.filter(
    (a) => Boolean(sessionResolvedIds[a.id]) || a.isResolved
  );

  // Default select first pending appointment if none selected
  React.useEffect(() => {
    if (pendingAppointments.length > 0 && (!selectedApptId || !pendingAppointments.some(a => a.id === selectedApptId))) {
      setSelectedApptId(pendingAppointments[0].id);
    }
  }, [activeIncident, pendingAppointments, selectedApptId]);

  const activeAppt: AffectedAppointmentItem | undefined = allAffected.find(
    (a) => a.id === selectedApptId
  );
  const alternatives = activeAppt?.alternatives;

  // Initialize custom form fields when active appointment changes
  React.useEffect(() => {
    if (alternatives) {
      setCustomDoctorId(alternatives.recommendedDoctor?.id || '');
      setCustomDate(alternatives.recommendedDate || '');
      setCustomTime(alternatives.recommendedTime || '');
      setCancellationReason('');
    }
  }, [selectedApptId, alternatives]);

  // Handler: Confirm Recommended Alternative (1-Click flow)
  const handleConfirmRecommended = () => {
    if (!activeAppt || !alternatives || !alternatives.recommendedDoctor) return;

    const targetDoc = alternatives.recommendedDoctor;
    const date = alternatives.recommendedDate;
    const time = alternatives.recommendedTime;

    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Backend Recommended Alternative',
      message: `Are you sure you want to reassign appointment ${activeAppt.id.toUpperCase()} (Patient: ${activeAppt.patient_name || 'Anonymous'}) to Dr. ${targetDoc.profile?.name || 'Physician'} for ${formatDate(date)} at ${formatTime(time)}? The backend will perform multi-constraint verification including availability, department matching, and schedule conflict validation.`,
      confirmVariant: 'primary',
      actionPayload: {
        appointmentId: activeAppt.id,
        actionType: 'CONFIRM_ALTERNATIVE',
        targetDoctorId: targetDoc.id,
        targetDate: date,
        targetTime: time,
      },
    });
  };

  // Handler: Submit Custom Selected Alternative
  const handleConfirmCustom = () => {
    if (!activeAppt) return;
    if (!customDoctorId) {
      alert('Please select an alternative doctor.');
      return;
    }
    if (!customTime) {
      alert('Please select an alternative time slot.');
      return;
    }

    const docOption = alternatives?.alternativeDoctors.find((d) => d.doctor.id === customDoctorId);
    const docName = docOption?.doctor.profile?.name || 'Selected Specialist';

    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Reschedule With Selected Option',
      message: `Are you sure you want to reschedule appointment ${activeAppt.id.toUpperCase()} to Dr. ${docName} on ${formatDate(customDate)} at ${formatTime(customTime)}? Backend validation will prevent double-booking conflicts.`,
      confirmVariant: 'primary',
      actionPayload: {
        appointmentId: activeAppt.id,
        actionType: 'REASSIGN_DOCTOR',
        targetDoctorId: customDoctorId,
        targetDate: customDate,
        targetTime: customTime,
      },
    });
  };

  // Handler: Cancel Appointment
  const handleConfirmCancel = () => {
    if (!activeAppt) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Affected Appointment',
      message: `Are you sure you want to cancel appointment ${activeAppt.id.toUpperCase()}? This will also cancel any active queue entry and notify the clinical desk.`,
      confirmVariant: 'destructive',
      actionPayload: {
        appointmentId: activeAppt.id,
        actionType: 'CANCEL',
        cancellationReason: cancellationReason || 'Physician unavailable and appointment cancelled by authorized hospital staff.',
      },
    });
  };

  // Execute Reschedule after Dialog Confirmation
  const handleExecuteConfirmedAction = async () => {
    if (!confirmDialog.actionPayload) return;

    try {
      const payload = confirmDialog.actionPayload;
      const result = await onReschedule(payload);

      // Record in local session resolved state
      setSessionResolvedIds((prev) => ({
        ...prev,
        [payload.appointmentId]: {
          newDoctorName: payload.actionType === 'CANCEL' ? undefined : alternatives?.recommendedDoctor?.profile?.name,
          newDate: payload.targetDate,
          newTime: payload.targetTime,
          action: payload.actionType === 'CANCEL' ? 'CANCELLED' : 'RESCHEDULED',
        },
      }));

      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

      // Switch to next pending if available
      const remainingPending = pendingAppointments.filter((a) => a.id !== payload.appointmentId);
      if (remainingPending.length > 0) {
        setSelectedApptId(remainingPending[0].id);
      } else {
        setActiveTab('RESOLVED');
      }
    } catch (err) {
      // Error handled by hook toast
    }
  };

  if (!activeIncident) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Doctor Disruption Resolution Workbench"
        description="Review affected patient appointments and execute backend-validated reassignments or cancellations."
        maxWidthClass="max-w-5xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>All reassignments require server-side constraint & conflict verification</span>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Workbench
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Incident Selector Header (if multiple doctors unavailable) */}
          {incidents.length > 1 && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto">
              <span className="text-xs font-semibold text-slate-600 shrink-0 ml-1">
                Affected Doctors:
              </span>
              {incidents.map((inc) => (
                <button
                  key={inc.incidentId}
                  onClick={() => onSelectIncident(inc)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                    activeIncident.incidentId === inc.incidentId
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>Dr. {inc.doctor.profile?.name || 'Physician'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {inc.pendingCount}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Doctor Disruption Overview Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg border border-amber-300">
                  {activeIncident.doctor.profile?.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Dr. {activeIncident.doctor.profile?.name || 'Assigned Physician'}
                    </h3>
                    <Badge variant="warning" className="text-xs">
                      {activeIncident.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {activeIncident.department.name} (Floor {activeIncident.department.floor})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {activeIncident.unavailablePeriod}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending vs Resolved Counter Tabs */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab('PENDING')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'PENDING'
                      ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>Pending: {pendingAppointments.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('RESOLVED')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolved: {resolvedAppointments.length}</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT WORKBENCH */}
          {activeTab === 'PENDING' ? (
            pendingAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-emerald-950">All Disrupted Appointments Resolved!</h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto mt-1">
                  There are no more pending affected appointments for Dr. {activeIncident.doctor.profile?.name}. Switch to the Resolved tab to inspect the reassignments.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('RESOLVED')}
                  className="mt-4 border-emerald-300 text-emerald-900"
                >
                  View Resolved List ({resolvedAppointments.length})
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT COLUMN: Affected Appointments List */}
                <div className="lg:col-span-5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Affected Appointments ({pendingAppointments.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Select to resolve</span>
                  </div>

                  {pendingAppointments.map((appt) => {
                    const isSelected = appt.id === selectedApptId;
                    const startTime = appt.expected_start?.includes('T')
                      ? appt.expected_start.split('T')[1].substring(0, 5)
                      : '10:00';

                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedApptId(appt.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {appt.id.toUpperCase()}
                              </span>
                              <Badge
                                variant={
                                  appt.status === 'CHECKED_IN'
                                    ? 'success'
                                    : appt.status === 'CONFIRMED'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-[10px] py-0"
                              >
                                {appt.status}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-800 mt-1">
                              {appt.patient_name || 'Patient'}
                            </h4>
                          </div>

                          {appt.queue_entry && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                              Token {appt.queue_entry.queue_reference}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(appt.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatTime(startTime)}</span>
                          </div>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{appt.service?.name || 'General Consultation'}</span>
                          <span className="text-amber-700 font-medium">Action Pending &rarr;</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT COLUMN: Backend Provided Alternatives & Actions Panel */}
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-5">
                  {activeAppt && alternatives ? (
                    <>
                      {/* Active Appointment Target Summary */}
                      <div className="pb-3 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Resolving Appointment
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            Ref: {activeAppt.id.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <h4 className="text-sm font-bold text-slate-900">
                            {activeAppt.patient_name || 'Patient'}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {activeAppt.department?.name} • {activeAppt.service?.name}
                          </span>
                        </div>
                      </div>

                      {/* 1. BACKEND RECOMMENDED ALTERNATIVE (1-Click Action) */}
                      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="p-1 rounded bg-blue-600 text-white">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                            Backend Recommended Alternative
                          </h5>
                          <span className="ml-auto text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                            Zero Conflict Verified
                          </span>
                        </div>

                        {alternatives.recommendedDoctor ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                              <div className="p-2.5 rounded-lg bg-white/90 border border-blue-100">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                  Alternative Doctor
                                </span>
                                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Dr. {alternatives.recommendedDoctor.profile?.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {alternatives.recommendedDoctor.specialization}
                                </span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white/90 border border-blue-100">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                  Alternative Date
                                </span>
                                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                  <span>{formatDate(alternatives.recommendedDate)}</span>
                                </div>
                                <span className="text-[10px] text-blue-600 font-medium">Today</span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-white/90 border border-blue-100">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                  Alternative Time
                                </span>
                                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span>{formatTime(alternatives.recommendedTime)}</span>
                                </div>
                                <span className="text-[10px] text-slate-500">Conflict-Free</span>
                              </div>
                            </div>

                            <p className="text-xs text-blue-950/80 italic">
                              "{alternatives.reasonSummary}"
                            </p>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleConfirmRecommended}
                              isLoading={isRescheduling}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              Confirm Backend Recommended Alternative
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600">
                            No other specialist in {activeAppt.department?.name} is currently available for same-day reassignment. Please select an alternative date or cancel.
                          </p>
                        )}
                      </div>

                      {/* 2. CHOOSE ANOTHER DOCTOR / TIME / DATE */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3.5">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Or Choose Custom Options
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          {/* Choose Doctor */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Choose Another Doctor
                            </label>
                            <select
                              value={customDoctorId}
                              onChange={(e) => {
                                setCustomDoctorId(e.target.value);
                                const docEntry = alternatives.alternativeDoctors.find(
                                  (ad) => ad.doctor.id === e.target.value
                                );
                                if (docEntry && docEntry.availableSlots.length > 0) {
                                  setCustomTime(docEntry.availableSlots[0]);
                                }
                              }}
                              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                              {alternatives.alternativeDoctors.map((ad) => (
                                <option key={ad.doctor.id} value={ad.doctor.id}>
                                  Dr. {ad.doctor.profile?.name} ({ad.doctor.status})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Choose Alternative Date */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Choose Alternative Date
                            </label>
                            <select
                              value={customDate}
                              onChange={(e) => setCustomDate(e.target.value)}
                              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                              <option value={alternatives.recommendedDate}>
                                Today ({formatDate(alternatives.recommendedDate)})
                              </option>
                              {alternatives.alternativeDates.map((ad) => (
                                <option key={ad.date} value={ad.date}>
                                  {formatDate(ad.date)}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Choose Another Time */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Choose Time Slot
                            </label>
                            <select
                              value={customTime}
                              onChange={(e) => setCustomTime(e.target.value)}
                              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                              {(() => {
                                const selectedDocEntry = alternatives.alternativeDoctors.find(
                                  (ad) => ad.doctor.id === customDoctorId
                                );
                                const slots = selectedDocEntry?.availableSlots || [
                                  '09:30',
                                  '10:30',
                                  '11:30',
                                  '14:00',
                                  '15:00',
                                  '16:00',
                                ];
                                return slots.map((s) => (
                                  <option key={s} value={s}>
                                    {formatTime(s)} (Open)
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleConfirmCustom}
                          isLoading={isRescheduling}
                          className="w-full text-slate-800 border-slate-300 hover:bg-slate-100"
                        >
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          Reschedule With Custom Selection
                        </Button>
                      </div>

                      {/* 3. CANCEL IF PERMITTED */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Optional cancellation reason..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleConfirmCancel}
                          isLoading={isRescheduling}
                          className="shrink-0"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Cancel Appointment
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Select an appointment on the left to review alternatives.
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            /* RESOLVED APPOINTMENTS TAB */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Resolved Appointments ({resolvedAppointments.length})
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  Updated in database & audit log
                </span>
              </div>

              {resolvedAppointments.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-500">No appointments have been resolved yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {resolvedAppointments.map((appt) => {
                    const sessionInfo = sessionResolvedIds[appt.id];
                    return (
                      <div key={appt.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {appt.id.toUpperCase()}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {appt.patient_name}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {sessionInfo?.action === 'CANCELLED' ? (
                                <span className="text-red-600 font-medium">Cancelled by Staff</span>
                              ) : (
                                <span>
                                  Reassigned to Dr. {sessionInfo?.newDoctorName || 'Assigned Specialist'} on{' '}
                                  {formatDate(sessionInfo?.newDate || appt.appointment_date)} at{' '}
                                  {formatTime(sessionInfo?.newTime || '10:30')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge variant="success" className="text-xs">
                          {sessionInfo?.action || 'RESOLVED'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* MANDATORY CONFIRMATION DIALOG BEFORE RESCHEDULING */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteConfirmedAction}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmVariant === 'destructive' ? 'Yes, Cancel Appointment' : 'Yes, Confirm Reschedule'}
        confirmVariant={confirmDialog.confirmVariant}
        isLoading={isRescheduling}
      />
    </>
  );
};
