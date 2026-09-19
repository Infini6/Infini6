import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { DoctorDashboardView } from '../../features/doctor/DoctorDashboardView';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DepartmentWorkloadChart } from '../../features/dashboard/DepartmentWorkloadChart';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Stethoscope, 
  Activity, 
  UserX, 
  RefreshCw,
  TrendingUp,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDoctorDisruptions } from '../../hooks/useDoctorDisruptions';
import { DoctorUnavailableBanner } from '../../features/appointments/DoctorUnavailableBanner';
import { DisruptionResolutionModal } from '../../features/appointments/DisruptionResolutionModal';

export const DashboardPage: React.FC = () => {
  const { user, switchRole } = useAuth();

  // Doctor Disruption Hook (called unconditionally)
  const {
    incidents: disruptionIncidents,
    pendingCount: disruptionPendingCount,
    resolvedCount: disruptionResolvedCount,
    selectedIncident: activeDisruptionIncident,
    setSelectedIncident: setActiveDisruptionIncident,
    isResolutionModalOpen: isDisruptionModalOpen,
    openResolutionModal: openDisruptionModal,
    closeResolutionModal: closeDisruptionModal,
    rescheduleAppointment: handleDisruptionReschedule,
    isRescheduling: isDisruptionRescheduling,
    refetch: refetchDisruptions,
    isRefetching: isDisruptionsRefetching,
  } = useDoctorDisruptions();

  // If authenticated user is a DOCTOR, render dedicated DoctorDashboardView
  if (user?.profile?.role === 'DOCTOR') {
    return <DoctorDashboardView />;
  }

  const { data: stats, isLoading, isError, error, refetch, isFetching } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Synchronizing hospital metrics with Supabase...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          Failed to load dashboard metrics
        </div>
        <p className="text-xs text-rose-600">{(error as any)?.message || 'An unexpected error occurred.'}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs">
        No operational data found for this hospital.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">OPD Operations Command Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live queue throughput, doctor availability, and department workload monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Link to="/queue">
            <Button size="sm" className="text-xs gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Manage Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Prominent Doctor Unavailable Disruption Warning Banner */}
      <DoctorUnavailableBanner
        incidents={disruptionIncidents}
        pendingCount={disruptionPendingCount}
        resolvedCount={disruptionResolvedCount}
        onOpenResolution={openDisruptionModal}
        onRefresh={refetchDisruptions}
        isRefreshing={isDisruptionsRefetching}
      />

      {/* Role Switcher Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Simulate Portal Persona:</span>
          <button
            onClick={() => switchRole('HOSPITAL_ADMIN')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              user?.profile?.role === 'HOSPITAL_ADMIN'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hospital Admin (Current)
          </button>
          <button
            onClick={() => switchRole('HOSPITAL_STAFF')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
          >
            Hospital Staff
          </button>
          <button
            onClick={() => switchRole('DOCTOR')}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold transition-colors flex items-center gap-1"
          >
            <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
            Switch to Doctor Experience (Dr. Priya Sharma)
          </button>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Multi-tenant single hospital tenancy
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <Card className="hover:border-slate-300">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Today's Appointments
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {stats.todayAppointments}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Scheduled for today</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Waiting Patients */}
        <Card className="hover:border-amber-300 border-amber-100 bg-amber-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                Waiting Patients
              </div>
              <div className="text-2xl font-bold text-amber-900 mt-1">
                {stats.waitingPatients}
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">In waiting room / triage</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Queues */}
        <Card className="hover:border-slate-300">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Active Queues
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {stats.activeQueues}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Departments serving now</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Average Waiting Time */}
        <Card className="hover:border-slate-300">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Avg Waiting Time
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {stats.avgWaitingTimeMinutes} <span className="text-sm font-normal text-slate-500">mins</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Within target (&lt; 25m)
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Doctor & Consultation Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Available Doctors */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Available Doctors</div>
            <div className="text-lg font-bold text-slate-900">{stats.availableDoctors}</div>
          </div>
        </div>

        {/* Unavailable Doctors */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Unavailable / Break</div>
            <div className="text-lg font-bold text-slate-900">{stats.unavailableDoctors}</div>
          </div>
        </div>

        {/* Active Consultations */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">In Consultation</div>
            <div className="text-lg font-bold text-blue-600">{stats.activeConsultations}</div>
          </div>
        </div>

        {/* Completed Consultations & No-shows */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Completed / No-Show</div>
            <div className="text-lg font-bold text-slate-900">
              {stats.completedConsultations} <span className="text-xs font-normal text-rose-500">({stats.noShows} no-show)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Alerts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workload (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Department OPD Workload</CardTitle>
              <p className="text-xs text-slate-500">Live patient volume distribution across hospital departments.</p>
            </div>
            <Link to="/departments" className="text-xs text-blue-600 hover:underline font-medium">
              View Departments &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            {stats.departmentWorkload.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No department data recorded.</div>
            ) : (
              <DepartmentWorkloadChart data={stats.departmentWorkload} />
            )}
          </CardContent>
        </Card>

        {/* Operational Alerts Card (1 col) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Operational Alerts
              </CardTitle>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {stats.alerts.length} Active
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs ${
                  alert.type === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alert.type === 'WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>{alert.title}</span>
                  <span className="text-[10px] font-normal opacity-70">{alert.timestamp}</span>
                </div>
                <p className="opacity-90 leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Doctor Disruption Resolution Workbench Modal */}
      <DisruptionResolutionModal
        isOpen={isDisruptionModalOpen}
        onClose={closeDisruptionModal}
        incidents={disruptionIncidents}
        selectedIncident={activeDisruptionIncident}
        onSelectIncident={setActiveDisruptionIncident}
        onReschedule={handleDisruptionReschedule}
        isRescheduling={isDisruptionRescheduling}
      />
    </div>
  );
};
