import React, { useEffect, useState, useMemo } from 'react';
import { useQueueList } from '../../hooks/useQueue';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';
import { useSound } from '../../hooks/useSound';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { departmentService } from '../../services/departmentService';
import { doctorService } from '../../services/doctorService';
import { DOCTOR_STATUS_CONFIG } from '../../utils/constants';
import { 
  Building2, 
  Volume2, 
  VolumeX, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Maximize,
  CheckCircle,
  Stethoscope,
  Filter,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  Users,
  Timer,
  AlertTriangle
} from 'lucide-react';

export const LiveQueueBoardPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const { status: realtimeStatus, lastSyncTime, lastEvent, reconnect, simulateDisconnect } = useRealtime();
  const { playChime } = useSound();
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Fetch live queue entries
  const { data: queueEntries = [], refetch: refetchQueue } = useQueueList();

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all(hospitalId),
    queryFn: () => departmentService.getDepartments(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // Fetch doctors for doctor status section
  const { data: doctors = [] } = useQuery({
    queryKey: queryKeys.doctors.all(hospitalId),
    queryFn: () => doctorService.getDoctors(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // Keep live digital clock updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // When a token is CALLED via realtime, trigger audio chime
  useEffect(() => {
    if (lastEvent?.table === 'queue_entries') {
      const status = (lastEvent.new as any)?.status;
      if (status === 'CALLED' && audioEnabled) {
        playChime();
      }
    }
  }, [lastEvent, audioEnabled, playChime]);

  // Handle manual / test disconnect simulation
  const handleToggleSimulatedDisconnect = () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    simulateDisconnect(nextState);
  };

  const isLive = realtimeStatus === 'CONNECTED';

  // Toggle TV full screen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Filter queue entries by department
  const departmentFilteredQueue = useMemo(() => {
    if (selectedDepartment === 'ALL') return queueEntries;
    return queueEntries.filter((q) => q.appointment?.department_id === selectedDepartment);
  }, [queueEntries, selectedDepartment]);

  // Status breakdown
  const calledTokens = useMemo(() => 
    departmentFilteredQueue.filter((q) => q.status === 'CALLED'),
    [departmentFilteredQueue]
  );

  const inProgressTokens = useMemo(() => 
    departmentFilteredQueue.filter((q) => q.status === 'IN_PROGRESS'),
    [departmentFilteredQueue]
  );

  const waitingTokens = useMemo(() => 
    departmentFilteredQueue.filter((q) => q.status === 'WAITING').sort((a, b) => a.position - b.position),
    [departmentFilteredQueue]
  );

  // Next patient in line
  const nextPatient = waitingTokens.length > 0 ? waitingTokens[0] : null;

  // Filtered tokens for general list
  const displayQueueList = useMemo(() => {
    if (statusFilter === 'ACTIVE') {
      return departmentFilteredQueue.filter((q) => ['WAITING', 'CALLED', 'IN_PROGRESS'].includes(q.status));
    }
    if (statusFilter === 'WAITING') {
      return waitingTokens;
    }
    if (statusFilter === 'SERVING') {
      return [...calledTokens, ...inProgressTokens];
    }
    return departmentFilteredQueue;
  }, [departmentFilteredQueue, statusFilter, waitingTokens, calledTokens, inProgressTokens]);

  // Doctors filtered by selected department
  const filteredDoctors = useMemo(() => {
    if (selectedDepartment === 'ALL') return doctors;
    return doctors.filter((d) => d.department_id === selectedDepartment);
  }, [doctors, selectedDepartment]);

  // Average wait estimation
  const avgWaitTime = useMemo(() => {
    if (waitingTokens.length === 0) return 0;
    const sum = waitingTokens.reduce((acc, curr) => acc + (curr.estimated_wait || 15), 0);
    return Math.round(sum / waitingTokens.length);
  }, [waitingTokens]);

  const activeDepartmentName = useMemo(() => {
    if (selectedDepartment === 'ALL') return 'All Hospital Departments';
    const dept = departments.find((d) => d.id === selectedDepartment);
    return dept ? dept.name : 'All Hospital Departments';
  }, [selectedDepartment, departments]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans p-6 selection:bg-blue-600">
      {/* 1. DISCONNECTION BANNER - Never pretend stale data is live */}
      {!isLive && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-amber-950/90 to-red-950/90 border-2 border-red-500/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md">
              <WifiOff className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="text-base font-bold text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 inline" />
                Live updates temporarily unavailable.
              </div>
              <div className="text-xs text-red-300/90 font-mono mt-0.5">
                Last updated: <span className="font-semibold text-white">{lastSyncTime || currentTime}</span> • Reconnecting to live queue event bus...
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                reconnect();
                refetchQueue();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Reconnect Now
            </button>
            {isSimulatedOffline && (
              <button
                onClick={handleToggleSimulatedDisconnect}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
              >
                End Offline Test
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. KIOSK HEADER */}
      <header className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xl shadow-blue-600/30 p-2.5">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
                Smart Operations Board
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-semibold">
                {activeDepartmentName}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white mt-0.5">
              {user?.hospital?.name || 'Metropolitan General Hospital'}
            </h1>
          </div>
        </div>

        {/* Status, Filters, Sound and Screen Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* PROMINENT ● LIVE INDICATOR */}
          {isLive ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 font-black text-xs shadow-lg shadow-emerald-900/30 tracking-wider">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              ● LIVE
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border-2 border-red-500 text-red-400 font-black text-xs shadow-lg shadow-red-900/30 tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              OFFLINE
            </div>
          )}

          {/* Department Filter Selector */}
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Selector */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ACTIVE">Active (Wait + Serve)</option>
              <option value="WAITING">Waiting Only</option>
              <option value="SERVING">Serving Only</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={audioEnabled ? 'Announcement chimes active (Click to mute)' : 'Announcement chimes muted (Click to enable)'}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          {/* TV Fullscreen Button */}
          <button
            onClick={toggleFullScreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle TV Wall Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>

          {/* Offline Simulation Dev Tool */}
          <button
            onClick={handleToggleSimulatedDisconnect}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
              isSimulatedOffline 
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 hover:bg-amber-600/40' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Dev Simulation: Test disconnected state banner"
          >
            {isSimulatedOffline ? 'Resume Live' : 'Test Disconnect'}
          </button>

          {/* Live Digital Clock */}
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-base font-bold text-slate-200 tracking-wider">
              {currentTime}
            </span>
          </div>
        </div>
      </header>

      {/* 3. LIVE OPERATIONS METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Waiting Count
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {waitingTokens.length}
            </div>
            <div className="text-[10px] text-amber-400/90 font-medium">
              In queue line
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Currently Serving
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {calledTokens.length + inProgressTokens.length}
            </div>
            <div className="text-[10px] text-blue-400/90 font-medium">
              {calledTokens.length} Called • {inProgressTokens.length} In Room
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Estimated Wait
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ~{avgWaitTime} min
            </div>
            <div className="text-[10px] text-slate-500">
              Estimate based on current hospital conditions.
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Next Patient
            </div>
            <div className="text-xl font-black text-purple-300 font-mono truncate max-w-[140px]">
              {nextPatient ? nextPatient.queue_reference : 'None waiting'}
            </div>
            <div className="text-[10px] text-purple-400/90 font-medium truncate">
              {nextPatient ? nextPatient.appointment?.patient_name : 'Queue clear'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN LIVE DISPLAY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* LEFT 2 COLUMNS: NOW CALLING + CURRENTLY IN CONSULTATION + DOCTOR STATUS */}
        <div className="lg:col-span-2 space-y-6">
          {/* NOW CALLING SECTION */}
          <div className="rounded-3xl border-2 border-blue-500/60 bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-4 mb-6">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                Now Calling • Please Proceed to Room
              </div>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-bold border border-blue-500/30 animate-pulse">
                Audio Announcement Active
              </span>
            </div>

            {calledTokens.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <p className="text-lg font-medium text-slate-400">All called tokens have reported to consultation.</p>
                <p className="text-xs mt-1 text-slate-500">Upcoming patients will be summoned here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calledTokens.map((called) => (
                  <div
                    key={called.id}
                    className="p-6 rounded-2xl bg-blue-950/70 border-2 border-blue-400 shadow-xl shadow-blue-600/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs text-blue-300 uppercase tracking-widest font-bold">
                        Token Number
                      </div>
                      <div className="text-5xl font-black font-mono text-white tracking-tight my-2">
                        {called.queue_reference}
                      </div>
                      <div className="text-sm font-bold text-blue-100 truncate">
                        {called.appointment?.patient_name || 'Patient Token'}
                      </div>
                      <div className="text-xs text-blue-300/80 mt-0.5">
                        {called.appointment?.department?.name || 'General OPD'}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-blue-900/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">
                          Proceed To Room
                        </div>
                        <div className="text-base font-extrabold text-amber-300">
                          {called.appointment?.department?.location || 'Consultation Room'}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {called.appointment?.doctor?.profile?.name ? `Dr. ${called.appointment.doctor.profile.name}` : 'Attending Physician'}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                        <ArrowRight className="w-6 h-6 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CURRENTLY IN CONSULTATION */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                Currently In Consultation
              </div>
              <span className="text-slate-400 text-xs font-mono font-medium">
                {inProgressTokens.length} Active Sessions
              </span>
            </div>

            {inProgressTokens.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No patient consultations currently in progress.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inProgressTokens.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-2xl font-bold font-mono text-emerald-400">
                        {item.queue_reference}
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">
                        {item.appointment?.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.appointment?.department?.name} • {item.appointment?.department?.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-200">
                        {item.appointment?.doctor?.profile?.name || 'On-Duty Doctor'}
                      </div>
                      <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" /> In Progress
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DOCTOR STATUS BOARD */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-400" />
                Physician & Consultation Room Status
              </div>
              <span className="text-xs text-slate-500">
                {filteredDoctors.length} Doctors Listed
              </span>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No doctors registered in this department.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDoctors.map((doc) => {
                  const cfg = DOCTOR_STATUS_CONFIG[doc.status] || DOCTOR_STATUS_CONFIG.AVAILABLE;
                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          Dr. {doc.profile?.name || 'Specialist'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {doc.specialization}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {doc.department?.location || 'Room TBA'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : doc.status === 'BUSY'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : doc.status === 'ON_BREAK'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SPOTLIGHT NEXT PATIENT + UPCOMING QUEUE LIST */}
        <div className="space-y-6 flex flex-col">
          {/* NEXT PATIENT SPOTLIGHT CARD */}
          <div className="rounded-3xl border-2 border-purple-500/40 bg-gradient-to-b from-purple-950/30 to-slate-900 p-6 shadow-xl">
            <div className="text-xs text-purple-400 font-black uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Next Patient In Line</span>
              <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full text-purple-300 font-semibold border border-purple-500/30">
                Priority #1
              </span>
            </div>

            {nextPatient ? (
              <div>
                <div className="flex items-baseline justify-between">
                  <div className="font-mono text-4xl font-black text-white">
                    {nextPatient.queue_reference}
                  </div>
                  <div className="text-xs font-semibold text-purple-300 font-mono">
                    Est. ~{nextPatient.estimated_wait || 5} min
                  </div>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-200">
                  {nextPatient.appointment?.patient_name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {nextPatient.appointment?.department?.name} • {nextPatient.appointment?.department?.location}
                </div>
                <div className="mt-4 pt-3 border-t border-purple-900/40 text-[11px] text-purple-300/80">
                  Please be seated near the consultation room entrance.
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No patients currently in line for this selection.
              </div>
            )}
          </div>

          {/* UPCOMING QUEUE CARD */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                Upcoming Waiting Queue
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {waitingTokens.length} in queue
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {waitingTokens.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No upcoming patients waiting in queue.
                </div>
              ) : (
                waitingTokens.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border transition-colors ${
                      index === 0 
                        ? 'border-purple-500/50 bg-purple-950/20' 
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        index === 0 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{item.position}
                      </span>
                      <div>
                        <div className="font-mono font-bold text-base text-white">
                          {item.queue_reference}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                          {item.appointment?.department?.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400 font-mono">
                        ~{item.estimated_wait} min
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Kiosk Footer note */}
            <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Please watch the screen and listen for the audio chime when your token is called.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
