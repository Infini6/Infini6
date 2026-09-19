import React, { useState, useEffect } from 'react';
import { useQueueList, useQueueActions } from '../../hooks/useQueue';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { apiService } from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { QUEUE_STATUS_CONFIG } from '../../utils/constants';
import { formatTime, formatWaitTime, formatDate } from '../../utils/formatters';
import { AppointmentRow, QueueStatus } from '../../types/database.types';
import { 
  Users, 
  PhoneCall, 
  Play, 
  CheckCircle, 
  SkipForward, 
  UserX, 
  Search, 
  Monitor, 
  RefreshCw,
  Clock,
  ArrowRightLeft,
  UserCheck,
  AlertCircle,
  Sparkles,
  Stethoscope,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const QueuePage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const { showSuccess, showError, showInfo } = useToast();
  const { lastEvent, status: realtimeStatus } = useRealtime();

  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);

  // Check-In Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInSearch, setCheckInSearch] = useState('');
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Transfer Modal State
  const [transferTarget, setTransferTarget] = useState<{
    queueId: string;
    token: string;
    patientName?: string;
  } | null>(null);
  const [transferDeptId, setTransferDeptId] = useState('');
  const [transferDocId, setTransferDocId] = useState('');

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'SKIP' | 'NO_SHOW' | 'COMPLETE';
    queueId: string;
    token: string;
    patientName?: string;
  } | null>(null);

  // Fetch departments & doctors for filtering
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all(hospitalId),
    queryFn: () => apiService.getDepartments(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: queryKeys.doctors.all(hospitalId),
    queryFn: () => apiService.getDoctors(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // Fetch scheduled appointments available for check-in
  const { data: checkInAppointments = [], refetch: refetchCheckIns } = useQuery({
    queryKey: ['appointments_for_checkin', hospitalId],
    queryFn: () =>
      apiService.getAppointments(hospitalId, {
        tab: 'TODAY',
      }),
    enabled: Boolean(hospitalId),
  });

  const {
    data: queueEntries = [],
    isLoading,
    refetch,
    isFetching,
  } = useQueueList({
    departmentId: selectedDept || undefined,
    doctorId: selectedDoctor || undefined,
    status: (selectedStatus as any) || undefined,
    searchQuery: searchQuery || undefined,
  });

  const {
    callNext,
    callNextGlobal,
    checkIn,
    startConsultation,
    completeConsultation,
    skipPatient,
    markNoShow,
    transferPatient,
    isProcessing,
    callNextLoading,
    invalidate,
  } = useQueueActions();

  // Conflict Detection: Listen for concurrent modifications by other staff/doctors
  useEffect(() => {
    if (lastEvent?.table === 'queue_entries') {
      const updatedStatus = (lastEvent.new as any)?.status;
      const token = (lastEvent.new as any)?.queue_reference;
      if (token && updatedStatus) {
        setConflictNotice(`This queue has changed (${token} is now ${updatedStatus}). The latest information has been loaded.`);
        const timer = setTimeout(() => setConflictNotice(null), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastEvent]);

  // Derived Staff Dashboard Metrics
  const waitingPatients = queueEntries.filter((q) => q.status === 'WAITING');
  const calledPatients = queueEntries.filter((q) => q.status === 'CALLED');
  const inProgressPatients = queueEntries.filter((q) => q.status === 'IN_PROGRESS');
  const completedPatients = queueEntries.filter((q) => q.status === 'COMPLETED');
  const noShowPatients = queueEntries.filter((q) => q.status === 'NO_SHOW');

  const currentlyServing = calledPatients[0] || inProgressPatients[0] || null;
  const nextInLine = waitingPatients.sort((a, b) => a.position - b.position)[0] || null;
  const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;

  // Global Call Next handler with double-action prevention
  const handleCallNextGlobal = async () => {
    if (isProcessing) return;
    try {
      await callNextGlobal({
        departmentId: selectedDept || undefined,
        doctorId: selectedDoctor || undefined,
      });
      showSuccess('Patient Called', 'The next waiting patient has been dispatched to room/counter.');
    } catch (err: any) {
      showError('Call Next Error', err?.message || 'Could not call next patient.');
    }
  };

  // Specific Call Next handler
  const handleCallSpecific = async (queueId: string) => {
    if (isProcessing) return;
    try {
      await callNext(queueId);
      showSuccess('Patient Called', 'Patient token set to CALLED status.');
    } catch (err: any) {
      showError('Action Failed', err?.message || 'Failed to call patient.');
    }
  };

  // Check-In handler
  const handleCheckInPatient = async (aptId: string) => {
    if (checkingInId || isProcessing) return;
    setCheckingInId(aptId);
    try {
      const newEntry = await checkIn(aptId);
      showSuccess(
        'Check-In Complete',
        `Issued Token ${newEntry.queue_reference} at Queue Position #${newEntry.position}.`
      );
      refetchCheckIns();
    } catch (err: any) {
      showError('Check-In Failed', err?.message || 'Unable to check in patient.');
    } finally {
      setCheckingInId(null);
    }
  };

  // Transfer handler
  const handleConfirmTransfer = async () => {
    if (!transferTarget || !transferDeptId || isProcessing) return;
    try {
      await transferPatient({
        queueId: transferTarget.queueId,
        targetDepartmentId: transferDeptId,
        targetDoctorId: transferDocId || undefined,
      });
      showSuccess('Patient Transferred', `Token ${transferTarget.token} has been transferred successfully.`);
      setTransferTarget(null);
      setTransferDeptId('');
      setTransferDocId('');
    } catch (err: any) {
      showError('Transfer Failed', err?.message || 'Failed to transfer patient.');
    }
  };

  // Confirm dialog execution
  const handleConfirmAction = async () => {
    if (!confirmAction || isProcessing) return;
    try {
      if (confirmAction.type === 'SKIP') {
        await skipPatient(confirmAction.queueId);
        showInfo('Patient Skipped', `Token ${confirmAction.token} has been moved down in queue.`);
      } else if (confirmAction.type === 'NO_SHOW') {
        await markNoShow(confirmAction.queueId);
        showInfo('Marked No-Show', `Token ${confirmAction.token} marked as No-Show.`);
      } else if (confirmAction.type === 'COMPLETE') {
        await completeConsultation(confirmAction.queueId);
        showSuccess('Consultation Completed', `Consultation finished for ${confirmAction.token}.`);
      }
    } catch (err: any) {
      showError('Action Error', err?.message || 'State transition failed.');
    } finally {
      setConfirmAction(null);
    }
  };

  // Filter eligible appointments for check-in
  const eligibleCheckIns = checkInAppointments.filter((apt) => {
    const isScheduled = apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED';
    if (!isScheduled) return false;
    if (!checkInSearch) return true;
    const q = checkInSearch.toLowerCase();
    return (
      apt.id.toLowerCase().includes(q) ||
      (apt.patient_name && apt.patient_name.toLowerCase().includes(q)) ||
      (apt.patient_phone && apt.patient_phone.toLowerCase().includes(q)) ||
      (apt.department?.name && apt.department.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Staff Queue Operations</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
              Smart Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Check in arriving patients, dispatch queue calls, monitor active rooms, and manage patient flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching || isProcessing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCheckInModalOpen(true)}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            <UserCheck className="w-4 h-4" />
            Patient Check-In
          </Button>

          <Link to="/queue/live" target="_blank">
            <Button size="sm" variant="secondary" className="text-xs gap-1.5 bg-slate-800 text-white hover:bg-slate-900">
              <Monitor className="w-3.5 h-3.5" />
              Live TV Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Concurrent Conflict Notification Banner */}
      {conflictNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{conflictNotice}</span>
          </div>
          <button
            onClick={() => setConflictNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Development Realtime Multi-User Testing Controls */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Radio className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
          <span>
            <strong>Realtime Multi-Tab Sync:</strong> Open this window as <em>Hospital Staff</em> and another window as <em>Doctor</em>. Mutations immediately broadcast and update both screens without manual refresh.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Simulate Role:</span>
          <Button
            size="sm"
            variant={user?.profile?.role === 'HOSPITAL_STAFF' ? 'primary' : 'outline'}
            onClick={() => switchRole('HOSPITAL_STAFF')}
            className="text-[11px] h-7 px-2.5"
          >
            Staff
          </Button>
          <Button
            size="sm"
            variant={user?.profile?.role === 'DOCTOR' ? 'primary' : 'outline'}
            onClick={() => switchRole('DOCTOR')}
            className="text-[11px] h-7 px-2.5"
          >
            Doctor
          </Button>
        </div>
      </div>

      {/* Staff Command Deck: 8 KPI Operations Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Waiting */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Waiting</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{waitingPatients.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In triage line</div>
        </div>

        {/* Currently Serving */}
        <div className="p-3 bg-white rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs lg:col-span-2">
          <div className="text-[10px] uppercase font-bold text-blue-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Currently Serving
          </div>
          {currentlyServing ? (
            <div className="mt-1">
              <span className="font-mono font-extrabold text-lg text-slate-900">
                {currentlyServing.queue_reference}
              </span>
              <span className="text-xs text-slate-600 ml-2 truncate inline-block max-w-[120px]">
                {currentlyServing.appointment?.department?.name?.split('(')[0]}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-1 italic">No token called</div>
          )}
          <div className="text-[10px] text-slate-500 mt-0.5">
            {currentlyServing?.appointment?.doctor?.profile?.name || 'Waiting for call'}
          </div>
        </div>

        {/* Next Patient */}
        <div className="p-3 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs lg:col-span-2">
          <div className="text-[10px] uppercase font-bold text-amber-700">Next In Line</div>
          {nextInLine ? (
            <div className="mt-1">
              <span className="font-mono font-extrabold text-lg text-slate-900">
                {nextInLine.queue_reference}
              </span>
              <span className="text-xs text-slate-600 ml-2 truncate inline-block max-w-[120px]">
                Pos #{nextInLine.position} • ~{nextInLine.estimated_wait}m
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-1 italic">Queue clear</div>
          )}
          <div className="text-[10px] text-slate-500 mt-0.5">
            {nextInLine?.appointment?.patient_name || 'No waiting patients'}
          </div>
        </div>

        {/* Active Consultations */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Consulting</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{inProgressPatients.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In rooms</div>
        </div>

        {/* Completed Today */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Completed</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{completedPatients.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Today</div>
        </div>

        {/* No-Shows / Delays */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">No-Shows</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{noShowPatients.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {availableDoctors} docs online
          </div>
        </div>
      </div>

      {/* Primary Global "CALL NEXT" Command Bar */}
      <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="font-bold text-sm text-white">Central OPD Call Dispatcher</h3>
          </div>
          <p className="text-xs text-slate-400">
            Authoritatively dispatches the earliest waiting patient in queue. Next position calculated by database logic.
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={handleCallNextGlobal}
          disabled={callNextLoading || isProcessing || waitingPatients.length === 0}
          className="w-full sm:w-auto font-bold bg-blue-600 hover:bg-blue-500 text-white px-6 h-11 text-sm shadow-lg shadow-blue-600/30 gap-2 shrink-0 select-none"
        >
          <PhoneCall className={`w-4 h-4 ${callNextLoading ? 'animate-bounce' : ''}`} />
          {callNextLoading ? 'Dispatching Next...' : 'CALL NEXT PATIENT'}
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Search Token / Patient</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. OB-101, Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Department Filter */}
        <Select
          label="Department"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          options={[
            { value: '', label: 'All Departments' },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        {/* Doctor Filter */}
        <Select
          label="Consulting Doctor"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          options={[
            { value: '', label: 'All Doctors' },
            ...doctors.map((d) => ({
              value: d.id,
              label: `${d.profile?.name || d.specialization} (${d.status})`,
            })),
          ]}
        />

        {/* Status Filter */}
        <Select
          label="Queue Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'WAITING', label: 'Waiting in Triage' },
            { value: 'CALLED', label: 'Called (Proceeding)' },
            { value: 'IN_PROGRESS', label: 'In Consultation' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'SKIPPED', label: 'Skipped' },
            { value: 'NO_SHOW', label: 'No-Show' },
            { value: 'TRANSFERRED', label: 'Transferred' },
          ]}
        />
      </div>

      {/* Queue Operations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Queue Ref / Token</TableHead>
              <TableHead>Appointment Ref</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Doctor & Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Smart Schedule & Wait Time</TableHead>
              <TableHead className="text-right">Operational Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                  Loading real-time queue from Supabase...
                </TableCell>
              </TableRow>
            ) : queueEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                  No queue entries matching filter criteria. Arriving patients can be checked in above.
                </TableCell>
              </TableRow>
            ) : (
              queueEntries.map((entry) => {
                const apt = entry.appointment;
                const statusConf = QUEUE_STATUS_CONFIG[entry.status as QueueStatus] || QUEUE_STATUS_CONFIG.WAITING;

                return (
                  <TableRow key={entry.id} className="hover:bg-slate-50/80">
                    {/* Token Reference & Position */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          #{entry.position}
                        </span>
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {entry.queue_reference}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Check-in: {formatTime(entry.called_at || apt?.created_at || new Date().toISOString())}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Appointment Ref & Privacy-Preserved Patient Label */}
                    <TableCell>
                      <div className="font-mono text-xs text-slate-800 font-semibold">
                        {apt?.id ? apt.id.substring(0, 13) + '...' : 'apt-ref'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {apt?.patient_name ? apt.patient_name : 'Patient ' + entry.id.substring(0, 6)}
                        {apt?.patient_gender && ` • ${apt.patient_gender}`}
                      </div>
                    </TableCell>

                    {/* Department */}
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">
                        {apt?.department?.name || 'General OPD'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                        {apt?.service?.name || 'Consultation'}
                      </div>
                    </TableCell>

                    {/* Doctor & Location */}
                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {apt?.doctor?.profile?.name || 'On-Duty Clinician'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {apt?.department?.location || 'Floor 1'}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                      >
                        {statusConf.label}
                      </span>
                    </TableCell>

                    {/* Smart Expected Time Display */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800">
                          EXPECTED: {apt?.expected_start ? formatTime(apt.expected_start) : '10:00 AM'} -{' '}
                          {apt?.expected_end ? formatTime(apt.expected_end) : '10:30 AM'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-blue-700 font-medium">
                          <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>ESTIMATED WAIT: {formatWaitTime(entry.estimated_wait)}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 italic">
                          Estimate based on current hospital conditions.
                        </div>
                      </div>
                    </TableCell>

                    {/* Operational Action Buttons */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WAITING -> CALLED */}
                        {entry.status === 'WAITING' && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs h-7 px-2.5 bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleCallSpecific(entry.id)}
                            disabled={isProcessing}
                            title="Call Patient to Counter/Room"
                          >
                            <PhoneCall className="w-3 h-3 mr-1" />
                            Call Patient
                          </Button>
                        )}

                        {/* CALLED -> IN_PROGRESS */}
                        {entry.status === 'CALLED' && (
                          <Button
                            size="sm"
                            variant="success"
                            className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => startConsultation(entry.id)}
                            disabled={isProcessing}
                            title="Start Consultation in Room"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start Consult
                          </Button>
                        )}

                        {/* IN_PROGRESS -> COMPLETE */}
                        {entry.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            variant="success"
                            className="text-xs h-7 px-2.5 bg-teal-600 hover:bg-teal-700"
                            onClick={() =>
                              setConfirmAction({
                                type: 'COMPLETE',
                                queueId: entry.id,
                                token: entry.queue_reference,
                                patientName: apt?.patient_name,
                              })
                            }
                            disabled={isProcessing}
                            title="Complete Consultation"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}

                        {/* Transfer (In-Progress or Waiting) */}
                        {(entry.status === 'WAITING' || entry.status === 'IN_PROGRESS') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2 text-slate-600 hover:bg-slate-100"
                            onClick={() =>
                              setTransferTarget({
                                queueId: entry.id,
                                token: entry.queue_reference,
                                patientName: apt?.patient_name,
                              })
                            }
                            disabled={isProcessing}
                            title="Transfer patient to another clinic or scanner"
                          >
                            <ArrowRightLeft className="w-3 h-3 mr-1" />
                            Transfer
                          </Button>
                        )}

                        {/* Skip (Waiting or Called) */}
                        {(entry.status === 'WAITING' || entry.status === 'CALLED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() =>
                              setConfirmAction({
                                type: 'SKIP',
                                queueId: entry.id,
                                token: entry.queue_reference,
                                patientName: apt?.patient_name,
                              })
                            }
                            disabled={isProcessing}
                            title="Skip Patient (Temporarily unavailable)"
                          >
                            <SkipForward className="w-3 h-3" />
                          </Button>
                        )}

                        {/* No Show (Called) */}
                        {entry.status === 'CALLED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2 text-rose-600 hover:bg-rose-50 border-rose-200"
                            onClick={() =>
                              setConfirmAction({
                                type: 'NO_SHOW',
                                queueId: entry.id,
                                token: entry.queue_reference,
                                patientName: apt?.patient_name,
                              })
                            }
                            disabled={isProcessing}
                            title="Mark as No-Show"
                          >
                            <UserX className="w-3 h-3" />
                          </Button>
                        )}

                        {/* View Details */}
                        {apt?.id && (
                          <Link to={`/appointments/${apt.id}`}>
                            <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-slate-500">
                              Details
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Patient Check-In Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title="Patient Arrival & Queue Check-In"
        description="Verify booking and issue authoritative queue token. Queue position is assigned by hospital triage rules."
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Server-Authoritative Ordering:</strong> Staff cannot arbitrarily set queue positions. The server assigns the sequential position based on clinic arrival order and triage rules.
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Appointment Ref, Patient Name, or Phone..."
              value={checkInSearch}
              onChange={(e) => setCheckInSearch(e.target.value)}
              className="pl-9 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="border border-slate-200 rounded-lg max-h-80 overflow-y-auto divide-y divide-slate-100">
            {eligibleCheckIns.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No unchecked-in appointments found matching criteria.
              </div>
            ) : (
              eligibleCheckIns.map((apt) => (
                <div key={apt.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {apt.patient_name || 'Patient ' + apt.id.substring(0, 6)}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                        {apt.id.substring(0, 10)}...
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {apt.department?.name} • {apt.doctor?.profile?.name || 'On Duty Doctor'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Slot: {formatTime(apt.expected_start)} - {formatTime(apt.expected_end)}</span>
                      <span>•</span>
                      <span>Service: {apt.service?.name || 'Consultation'}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleCheckInPatient(apt.id)}
                    disabled={checkingInId === apt.id || isProcessing}
                    isLoading={checkingInId === apt.id}
                    className="text-xs shrink-0 bg-blue-600 hover:bg-blue-700"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Check In
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsCheckInModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Patient Transfer Modal */}
      {transferTarget && (
        <Modal
          isOpen={Boolean(transferTarget)}
          onClose={() => setTransferTarget(null)}
          title={`Transfer Patient Token: ${transferTarget.token}`}
          description="Route this patient to another specialty clinic, radiology suite, or secondary physician."
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              Patient: <strong>{transferTarget.patientName || 'Outpatient'}</strong> (Token: {transferTarget.token})
            </div>

            <Select
              label="Target Department"
              value={transferDeptId}
              onChange={(e) => setTransferDeptId(e.target.value)}
              options={[
                { value: '', label: 'Select Target Department...' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.location})`,
                })),
              ]}
            />

            <Select
              label="Target Doctor (Optional)"
              value={transferDocId}
              onChange={(e) => setTransferDocId(e.target.value)}
              options={[
                { value: '', label: 'First Available On-Duty Doctor' },
                ...doctors
                  .filter((d) => !transferDeptId || d.department_id === transferDeptId)
                  .map((d) => ({
                    value: d.id,
                    label: `${d.profile?.name || d.specialization} (${d.status})`,
                  })),
              ]}
            />

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setTransferTarget(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleConfirmTransfer}
                disabled={!transferDeptId || isProcessing}
                isLoading={isProcessing}
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Destructive Action Confirmation Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={Boolean(confirmAction)}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title={
            confirmAction.type === 'SKIP'
              ? 'Skip Patient Token?'
              : confirmAction.type === 'NO_SHOW'
              ? 'Mark Patient as No-Show?'
              : 'Complete Consultation?'
          }
          message={
            confirmAction.type === 'SKIP'
              ? `Are you sure you want to skip token ${confirmAction.token} (${confirmAction.patientName || 'Patient'})? The token will be moved down in queue.`
              : confirmAction.type === 'NO_SHOW'
              ? `Are you sure you want to mark token ${confirmAction.token} (${confirmAction.patientName || 'Patient'}) as No-Show? This patient did not report when called.`
              : `Confirm completion of consultation for token ${confirmAction.token}? Next care journey step or pharmacy will be activated.`
          }
          confirmLabel={
            confirmAction.type === 'SKIP'
              ? 'Skip Token'
              : confirmAction.type === 'NO_SHOW'
              ? 'Confirm No-Show'
              : 'Complete'
          }
          confirmVariant={confirmAction.type === 'COMPLETE' ? 'primary' : 'destructive'}
          isLoading={isProcessing}
        />
      )}
    </div>
  );
};
