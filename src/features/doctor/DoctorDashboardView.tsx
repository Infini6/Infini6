import React, { useState } from 'react';
import { useDoctorDashboard } from '../../hooks/useDoctorDashboard';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { DoctorStatus, QueueStatus } from '../../types/database.types';
import { DOCTOR_STATUS_CONFIG, QUEUE_STATUS_CONFIG, APPOINTMENT_STATUS_CONFIG } from '../../utils/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  Stethoscope, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  PhoneCall, 
  Play, 
  CheckCheck, 
  SkipForward, 
  UserX, 
  AlertTriangle, 
  Bell, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Building2, 
  Layers, 
  ChevronRight,
  ShieldCheck,
  Coffee,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';

export const DoctorDashboardView: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { status: realtimeStatus, lastSyncTime, reconnect, simulateDisconnect } = useRealtime();

  const {
    doctor,
    isDoctorLoading,
    schedule,
    todayAppointments,
    isAppointmentsLoading,
    currentPatient,
    isCurrentPatientLoading,
    nextPatient,
    isNextPatientLoading,
    doctorQueue,
    isQueueLoading,
    notifications,
    unreadNotificationsCount,
    isActionProcessing,
    conflictError,
    performAction,
    updateAvailability,
    markNotificationRead,
    refetchAll,
  } = useDoctorDashboard();

  // Local UI states
  const [activeTab, setActiveTab] = useState<'roster' | 'queue' | 'schedule' | 'notifications'>('roster');
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<DoctorStatus>(doctor?.status || 'AVAILABLE');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [affectedWarning, setAffectedWarning] = useState<string | null>(null);

  const isLive = realtimeStatus === 'CONNECTED';

  // Handle status update
  const handleSaveAvailability = async () => {
    setIsUpdatingStatus(true);
    try {
      await updateAvailability(selectedStatus);
      setIsAvailabilityModalOpen(false);
    } catch (err: any) {
      // Handled in hook toast
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick action executor
  const handleExecuteAction = async (
    queueId: string,
    action: 'CALL' | 'START' | 'COMPLETE' | 'SKIP' | 'NO_SHOW'
  ) => {
    if (isActionProcessing) return;
    try {
      await performAction(queueId, action);
    } catch {
      // Hook will display conflict or error notification
    }
  };

  if (isDoctorLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading clinical workspace...</p>
      </div>
    );
  }

  const currentDoctorStatus = doctor?.status || 'AVAILABLE';
  const statusConfig = DOCTOR_STATUS_CONFIG[currentDoctorStatus] || DOCTOR_STATUS_CONFIG.AVAILABLE;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. DISCONNECTION / OFFLINE BANNER */}
      {!isLive && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 border-2 border-red-400 text-red-900 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 text-white rounded-xl">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Live updates temporarily unavailable.
              </div>
              <div className="text-xs text-red-700 font-mono mt-0.5">
                Last updated: <span className="font-bold">{lastSyncTime}</span> • Clinical actions will sync automatically upon reconnection.
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              reconnect();
              refetchAll();
            }}
            className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reconnect Now
          </Button>
        </div>
      )}

      {/* 2. CONCURRENT CONFLICT WARNING BANNER */}
      {conflictError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            {conflictError}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchAll()} className="text-xs">
            Refresh Latest
          </Button>
        </div>
      )}

      {/* 3. CLINICIAN HEADER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20 shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Dr. {doctor?.profile?.name || user?.profile?.name || 'Physician'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {doctor?.specialization || 'Clinical Specialist'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {doctor?.department?.name || 'Obstetrics & Gynecology'}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-600">
                  Room: {doctor?.department?.location || 'OPD-204'}
                </span>
                <span>•</span>
                <span className="text-slate-500">
                  Hospital: {user?.hospital?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Availability & Connection Status Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Realtime Status Pill */}
            {isLive ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                ● LIVE
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-300 text-red-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                OFFLINE
              </div>
            )}

            {/* Doctor Availability Pill / Switcher */}
            <button
              onClick={() => {
                setSelectedStatus(currentDoctorStatus);
                setIsAvailabilityModalOpen(true);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all hover:ring-2 hover:ring-blue-400/30 ${
                currentDoctorStatus === 'AVAILABLE'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : currentDoctorStatus === 'BUSY'
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : currentDoctorStatus === 'ON_BREAK'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
              <span>Status: {statusConfig.label}</span>
              <span className="text-[10px] text-slate-400 underline ml-1">Change</span>
            </button>

            {/* Quick Refresh */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchAll()}
              className="text-xs gap-1.5 p-2"
              title="Synchronize workspace"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Demo Role Switch Bar for quick multi-perspective evaluation */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Simulate Portal Persona:</span>
            <button
              onClick={() => switchRole('DOCTOR')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                user?.profile?.role === 'DOCTOR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Doctor (Current)
            </button>
            <button
              onClick={() => switchRole('HOSPITAL_STAFF')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
            >
              Hospital Staff
            </button>
            <button
              onClick={() => switchRole('HOSPITAL_ADMIN')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
            >
              Hospital Admin
            </button>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Data isolated to authorized doctor account & hospital RLS
          </div>
        </div>
      </div>

      {/* 4. CLINICAL COMMAND DECK: CURRENT PATIENT + NEXT PATIENT (TABLET-OPTIMIZED HERO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CURRENT PATIENT CARD (2 COLS) - PRIVACY PRESERVING */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-blue-500/40 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 shadow-md">
            <CardHeader className="pb-3 border-b border-blue-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                <CardTitle className="text-base text-blue-950 font-black tracking-tight">
                  CURRENT CONSULTATION
                </CardTitle>
              </div>
              {currentPatient && (
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  currentPatient.status === 'IN_PROGRESS'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                }`}>
                  {currentPatient.status === 'IN_PROGRESS' ? '● In Consultation' : '● Patient Called - Entering Room'}
                </span>
              )}
            </CardHeader>

            <CardContent className="p-6">
              {currentPatient ? (
                <div className="space-y-6">
                  {/* Privacy-Preserving Minimal Patient Display */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 p-5 rounded-2xl bg-white border border-blue-200/80 shadow-sm">
                    <div>
                      <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Active Queue Token
                      </div>
                      <div className="text-4xl sm:text-5xl font-black font-mono text-blue-600 mt-1 tracking-tight">
                        {currentPatient.queue_reference}
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-1">
                        Appointment Ref: <span className="font-semibold text-slate-700">{currentPatient.appointment_reference}</span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Clinical Procedure
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-1">
                        {currentPatient.service_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {currentPatient.department_name} • {currentPatient.room_location}
                      </div>
                    </div>
                  </div>

                  {/* Tablet-Optimized Large Touch Action Buttons */}
                  <div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                      Consultation State Actions
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* WHEN CALLED: START CONSULTATION */}
                      {currentPatient.status === 'CALLED' && (
                        <button
                          onClick={() => handleExecuteAction(currentPatient.queue_id, 'START')}
                          disabled={isActionProcessing}
                          className="col-span-2 sm:col-span-1 min-h-[56px] px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          START CONSULT
                        </button>
                      )}

                      {/* WHEN IN_PROGRESS: COMPLETE CONSULTATION */}
                      {currentPatient.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleExecuteAction(currentPatient.queue_id, 'COMPLETE')}
                          disabled={isActionProcessing}
                          className="col-span-2 sm:col-span-2 min-h-[56px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                        >
                          <CheckCheck className="w-5 h-5" />
                          COMPLETE CONSULTATION
                        </button>
                      )}

                      {/* SKIP PATIENT (Only valid if CALLED) */}
                      {currentPatient.status === 'CALLED' && (
                        <button
                          onClick={() => handleExecuteAction(currentPatient.queue_id, 'SKIP')}
                          disabled={isActionProcessing}
                          className="min-h-[56px] px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-300 disabled:opacity-50"
                        >
                          <SkipForward className="w-4 h-4 text-slate-500" />
                          SKIP PATIENT
                        </button>
                      )}

                      {/* NO-SHOW PATIENT (Only valid if CALLED) */}
                      {currentPatient.status === 'CALLED' && (
                        <button
                          onClick={() => handleExecuteAction(currentPatient.queue_id, 'NO_SHOW')}
                          disabled={isActionProcessing}
                          className="min-h-[56px] px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-200 disabled:opacity-50"
                        >
                          <UserX className="w-4 h-4 text-rose-500" />
                          MARK NO-SHOW
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-700">No Consultation Active</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Ready for the next patient? Call the next patient in line or select from your waiting appointments below.
                    </p>
                  </div>
                  {nextPatient && (
                    <Button
                      size="lg"
                      onClick={() => handleExecuteAction(nextPatient.id, 'CALL')}
                      disabled={isActionProcessing}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-6 py-4 rounded-2xl shadow-lg shadow-blue-600/20 gap-2"
                    >
                      <PhoneCall className="w-5 h-5" />
                      CALL NEXT PATIENT ({nextPatient.queue_reference})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NEXT PATIENT SPOTLIGHT CARD (1 COL) - SERVER AUTHORITATIVE */}
        <div className="space-y-4">
          <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-50/40 via-white to-slate-50 shadow-sm h-full flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 border-b border-purple-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-sm text-purple-950 font-black">
                    NEXT IN QUEUE
                  </CardTitle>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  Server Assigned #1
                </span>
              </CardHeader>

              <CardContent className="p-5">
                {nextPatient ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] uppercase font-bold text-slate-400">
                        Token Number
                      </div>
                      <div className="text-3xl font-black font-mono text-purple-700 mt-0.5">
                        {nextPatient.queue_reference}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-1 truncate">
                        {nextPatient.appointment?.service?.name || 'General Visit'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {nextPatient.appointment?.department?.name}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-purple-700 uppercase font-bold">
                          Est. Wait Time
                        </div>
                        <div className="text-base font-extrabold text-purple-900 font-mono">
                          ~{nextPatient.estimated_wait || 5} min
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Position #{nextPatient.position}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      Order determined by backend queue logic.
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No patients waiting in queue line.
                  </div>
                )}
              </CardContent>
            </div>

            {nextPatient && !currentPatient && (
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleExecuteAction(nextPatient.id, 'CALL')}
                  disabled={isActionProcessing}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4" />
                  CALL THIS PATIENT
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 5. WORKSPACE TABS & DRILL-DOWN SECTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x -mb-px flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-white border-slate-200 text-blue-600'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Today's Appointments
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">
              {todayAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x -mb-px flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-white border-slate-200 text-blue-600'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Doctor Queue Line
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold">
              {doctorQueue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x -mb-px flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-white border-slate-200 text-blue-600'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Duty Schedule & Hours
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors border-t border-x -mb-px flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-white border-slate-200 text-blue-600'
                : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            Clinical Alerts
            {unreadNotificationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: TODAY'S APPOINTMENTS ROSTER */}
        {activeTab === 'roster' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Appointment Schedule</h3>
                <p className="text-xs text-slate-500">Sorted by appointment start time and queue check-in status.</p>
              </div>
              <span className="text-xs text-slate-400">
                {todayAppointments.filter((a) => a.status === 'COMPLETED').length} of {todayAppointments.length} Completed
              </span>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No appointments booked for Dr. {doctor?.profile?.name || 'this doctor'} today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Appointment Ref</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Appt Status</th>
                      <th className="py-3 px-4">Queue Status</th>
                      <th className="py-3 px-4 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayAppointments.map((appt) => {
                      const apptStatusCfg = APPOINTMENT_STATUS_CONFIG[appt.status] || {
                        label: appt.status,
                        bg: 'bg-slate-100',
                        text: 'text-slate-700',
                      };
                      const qStatus = appt.queue_entry?.status;
                      const qStatusCfg = qStatus ? QUEUE_STATUS_CONFIG[qStatus] : null;

                      const apptTime = appt.expected_start
                        ? appt.expected_start.includes('T')
                          ? appt.expected_start.split('T')[1].substring(0, 5)
                          : appt.expected_start
                        : '09:00';
                      const apptRef = appt.id
                        ? `APT-${appt.id.replace('apt-', '').toUpperCase()}`
                        : 'APT-N/A';

                      return (
                        <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {apptTime}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                            {apptRef}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {appt.service?.name || 'Consultation'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {appt.department?.name || 'General OPD'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${apptStatusCfg.bg} ${apptStatusCfg.text}`}>
                              {apptStatusCfg.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {qStatusCfg ? (
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${qStatusCfg.bg} ${qStatusCfg.text}`}>
                                {appt.queue_entry?.queue_reference} ({qStatusCfg.label})
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Not Checked In</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {qStatus === 'WAITING' && (
                              <Button
                                size="sm"
                                onClick={() => appt.queue_entry && handleExecuteAction(appt.queue_entry.id, 'CALL')}
                                disabled={isActionProcessing || Boolean(currentPatient)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                Call
                              </Button>
                            )}
                            {qStatus === 'CALLED' && (
                              <Button
                                size="sm"
                                onClick={() => appt.queue_entry && handleExecuteAction(appt.queue_entry.id, 'START')}
                                disabled={isActionProcessing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                              >
                                <Play className="w-3.5 h-3.5" />
                                Start
                              </Button>
                            )}
                            {qStatus === 'IN_PROGRESS' && (
                              <Button
                                size="sm"
                                onClick={() => appt.queue_entry && handleExecuteAction(appt.queue_entry.id, 'COMPLETE')}
                                disabled={isActionProcessing}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Done
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCTOR QUEUE LINE */}
        {activeTab === 'queue' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Queue Line</h3>
                <p className="text-xs text-slate-500">Live order of patients assigned to this doctor's clinic.</p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {doctorQueue.filter((q) => q.status === 'WAITING').length} Patients Waiting
              </span>
            </div>

            {doctorQueue.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No active queue entries for this doctor.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {doctorQueue.map((item) => {
                  const cfg = QUEUE_STATUS_CONFIG[item.status] || QUEUE_STATUS_CONFIG.WAITING;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                        item.status === 'IN_PROGRESS'
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : item.status === 'CALLED'
                          ? 'border-blue-300 bg-blue-50/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-lg font-black text-slate-900">
                          {item.queue_reference}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium truncate">
                        {item.appointment?.service?.name || 'General Consultation'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Position #{item.position} • Est. ~{item.estimated_wait}m
                      </div>

                      {item.status === 'WAITING' && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecuteAction(item.id, 'CALL')}
                            disabled={isActionProcessing || Boolean(currentPatient)}
                            className="text-xs gap-1"
                          >
                            <PhoneCall className="w-3 h-3" />
                            Call Patient
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DUTY SCHEDULE & HOURS */}
        {activeTab === 'schedule' && (
          <div className="p-6 max-w-2xl">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900">Duty Hours & Break Configuration</h3>
              <p className="text-xs text-slate-500">Configured by hospital administrative operations.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">Working Days</div>
                  <div className="text-sm font-semibold text-blue-600 mt-0.5">
                    {schedule?.working_days ? schedule.working_days.join(', ') : 'Monday - Friday'}
                  </div>
                </div>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">Shift Working Hours</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {schedule?.start_time || '08:30'} - {schedule?.end_time || '16:30'}
                  </div>
                </div>
                <Clock className="w-5 h-5 text-slate-400" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">Scheduled Break Period</div>
                  <div className="text-sm font-mono font-bold text-amber-700 mt-0.5">
                    {schedule?.break_periods && schedule.break_periods[0]
                      ? `${schedule.break_periods[0].start} - ${schedule.break_periods[0].end}`
                      : '12:30 - 13:15 (Lunch Break)'}
                  </div>
                </div>
                <Coffee className="w-5 h-5 text-amber-600" />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">Current Doctor Availability</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {statusConfig.label}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStatus(currentDoctorStatus);
                    setIsAvailabilityModalOpen(true);
                  }}
                  className="text-xs"
                >
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLINICAL NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clinical Alerts & Notifications</h3>
                <p className="text-xs text-slate-500">Patient calls, queue shifts, schedule alerts, and hospital broadcasts.</p>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {unreadNotificationsCount} Unread
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No active notifications for Dr. {doctor?.profile?.name}.
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${
                      !n.read ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${
                        !n.read ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          {n.title}
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 inline-block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {!n.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markNotificationRead(n.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. AVAILABILITY UPDATE MODAL */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        title="Update Clinical Availability"
      >
        <div className="space-y-5">
          <p className="text-xs text-slate-600">
            Set your current operational status. When you mark yourself unavailable, on break, or on leave, patient appointments scheduled for today will be flagged for clinical triage coordination.
          </p>

          <div className="space-y-2.5">
            {(['AVAILABLE', 'BUSY', 'ON_BREAK', 'UNAVAILABLE', 'ON_LEAVE'] as DoctorStatus[]).map((st) => {
              const cfg = DOCTOR_STATUS_CONFIG[st];
              const isSelected = selectedStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cfg.label}</div>
                      <div className="text-[11px] text-slate-500">
                        {st === 'AVAILABLE' && 'Ready to receive patients in consultation room.'}
                        {st === 'BUSY' && 'Actively consulting or conducting procedure.'}
                        {st === 'ON_BREAK' && 'Temporary rest or meal break.'}
                        {st === 'UNAVAILABLE' && 'Off-duty or attending clinical emergency.'}
                        {st === 'ON_LEAVE' && 'Approved leave of absence.'}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                </button>
              );
            })}
          </div>

          {(selectedStatus === 'UNAVAILABLE' || selectedStatus === 'ON_BREAK' || selectedStatus === 'ON_LEAVE') && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Affected-Appointment Warning
              </div>
              <p className="text-[11px] text-amber-800">
                You have active appointments remaining today. Updating your status will trigger a real-time operational notification to Hospital Staff for potential slot reassignments.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAvailabilityModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAvailability}
              disabled={isUpdatingStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              {isUpdatingStatus ? 'Updating...' : 'Confirm Status Change'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
