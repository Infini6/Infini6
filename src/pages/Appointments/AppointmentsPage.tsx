import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { APPOINTMENT_STATUS_CONFIG } from '../../utils/constants';
import { formatTime, formatDate } from '../../utils/formatters';
import { AppointmentRow } from '../../types/database.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentActionSchema, AppointmentActionValues } from '../../lib/validations/adminSchemas';
import { 
  Search, 
  Calendar, 
  RefreshCw, 
  Eye, 
  Filter, 
  Clock,
  ShieldAlert,
  Sliders,
  CalendarCheck,
  UserCheck,
  Building,
  Ban,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDoctorDisruptions } from '../../hooks/useDoctorDisruptions';
import { DoctorUnavailableBanner } from '../../features/appointments/DoctorUnavailableBanner';
import { DisruptionResolutionModal } from '../../features/appointments/DisruptionResolutionModal';

type AppointmentTab = 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW' | 'ALL';

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<AppointmentTab>('TODAY');

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Modal State
  const [activeAppointment, setActiveAppointment] = useState<AppointmentRow | null>(null);
  const [activeAction, setActiveAction] = useState<'RESCHEDULE' | 'REASSIGN_DOCTOR' | 'CHANGE_DEPARTMENT' | 'CANCEL' | 'ADD_NOTES'>('RESCHEDULE');

  // Doctor Disruption Management
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

  // Dropdown data
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

  const { data: services = [] } = useQuery({
    queryKey: queryKeys.services.all(hospitalId),
    queryFn: () => apiService.getServices(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // Appointments Query with Server / Repository filtering
  const { data: appointments = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['appointments', hospitalId, { tab: activeTab, selectedDept, selectedDoctor, selectedService, dateFilter, searchQuery }],
    queryFn: () =>
      apiService.getAppointments(hospitalId, {
        tab: activeTab,
        departmentId: selectedDept || undefined,
        doctorId: selectedDoctor || undefined,
        serviceId: selectedService || undefined,
        date: dateFilter || undefined,
        search: searchQuery || undefined,
      }),
    enabled: Boolean(hospitalId),
  });

  // Action Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentActionValues>({
    resolver: zodResolver(appointmentActionSchema),
    defaultValues: {
      action_type: 'RESCHEDULE',
    },
  });

  const openActionModal = (apt: AppointmentRow, defaultAction: 'RESCHEDULE' | 'REASSIGN_DOCTOR' | 'CHANGE_DEPARTMENT' | 'CANCEL' | 'ADD_NOTES') => {
    setActiveAppointment(apt);
    setActiveAction(defaultAction);
    reset({
      action_type: defaultAction,
      new_date: apt.appointment_date,
      new_start_time: apt.expected_start ? new Date(apt.expected_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00',
      new_end_time: apt.expected_end ? new Date(apt.expected_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:30',
      doctor_id: apt.doctor_id || '',
      department_id: apt.department_id || '',
      cancellation_reason: '',
      notes: apt.notes || '',
    });
  };

  // Appointment Mutation
  const appointmentMutation = useMutation({
    mutationFn: async (values: AppointmentActionValues) => {
      if (!activeAppointment) throw new Error('No appointment selected');

      const updates: Partial<AppointmentRow> = {};

      if (values.action_type === 'RESCHEDULE') {
        const d = values.new_date || activeAppointment.appointment_date;
        const st = values.new_start_time || '09:00';
        const et = values.new_end_time || '09:30';
        updates.appointment_date = d;
        updates.expected_start = `${d}T${st}:00.000Z`;
        updates.expected_end = `${d}T${et}:00.000Z`;
        updates.status = 'CONFIRMED';
      } else if (values.action_type === 'REASSIGN_DOCTOR') {
        updates.doctor_id = values.doctor_id || null;
      } else if (values.action_type === 'CHANGE_DEPARTMENT') {
        updates.department_id = values.department_id || activeAppointment.department_id;
      } else if (values.action_type === 'CANCEL') {
        updates.status = 'CANCELLED';
        updates.notes = values.cancellation_reason ? `Cancellation Reason: ${values.cancellation_reason}` : activeAppointment.notes;
      } else if (values.action_type === 'ADD_NOTES') {
        updates.notes = values.notes;
      }

      return apiService.updateAppointment(activeAppointment.id, updates, user?.id);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setActiveAppointment(null);
      showSuccess('Appointment Updated', `Appointment record ${updated.id.substring(0, 8)} updated.`);
    },
    onError: (err: any) => {
      showError('Action Failed', err?.message || 'Could not update appointment.');
    },
  });

  const onActionSubmit = (data: AppointmentActionValues) => {
    appointmentMutation.mutate({ ...data, action_type: activeAction });
  };

  const TABS: { key: AppointmentTab; label: string; count?: number }[] = [
    { key: 'TODAY', label: "Today's Appointments" },
    { key: 'UPCOMING', label: 'Upcoming' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'RESCHEDULED', label: 'Rescheduled' },
    { key: 'NO_SHOW', label: 'No-Show' },
    { key: 'ALL', label: 'All Records' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Appointments Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational appointment bookings, clinician room assignments, and schedule adjustments.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          Refresh
        </Button>
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

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Search Patient / Doctor</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name..."
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
          label="Doctor"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          options={[
            { value: '', label: 'All Doctors' },
            ...doctors.map((d) => ({
              value: d.id,
              label: d.profile?.name || d.specialization,
            })),
          ]}
        />

        {/* Service Filter */}
        <Select
          label="Clinical Service"
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          options={[
            { value: '', label: 'All Services' },
            ...services.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />

        {/* Date Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Specific Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Slot</TableHead>
              <TableHead>Patient Identifier</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Clinical Service</TableHead>
              <TableHead>Arrival Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                  Loading filtered appointments from Supabase...
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  No appointments found for "{TABS.find((t) => t.key === activeTab)?.label}".
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((apt) => {
                const conf = APPOINTMENT_STATUS_CONFIG[apt.status] || APPOINTMENT_STATUS_CONFIG.SCHEDULED;

                return (
                  <TableRow key={apt.id} className="hover:bg-slate-50/80">
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900">
                        {formatDate(apt.appointment_date)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatTime(apt.expected_start)} - {formatTime(apt.expected_end)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900">
                        {apt.patient_name || 'Patient ' + apt.id.substring(0, 6)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {apt.patient_gender ? `${apt.patient_gender}, ${apt.patient_age}y` : 'Patient'} • {apt.patient_phone || 'Verified'}
                      </div>
                      {apt.notes && (
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block max-w-xs truncate">
                          Note: {apt.notes}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {apt.department?.name || 'Department'}
                      </div>
                      <div className="text-[10px] text-slate-400">{apt.department?.location}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {apt.doctor?.profile?.name || 'On-Duty Roster'}
                      </div>
                      <div className="text-[10px] text-slate-400">{apt.doctor?.specialization}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-slate-700 font-medium">
                        {apt.service?.name || 'Standard Consultation'}
                      </div>
                      <div className="text-[10px] text-slate-400">{apt.service?.expected_duration || 15} mins</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-slate-700">
                        {formatTime(apt.recommended_arrival)}
                      </div>
                      <div className="text-[10px] text-slate-400">15m pre-arrival</div>
                    </TableCell>

                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${conf.bg} ${conf.text}`}>
                        {conf.label}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openActionModal(apt, 'RESCHEDULE')}
                          className="text-xs h-7 px-2"
                          title="Manage / Reschedule / Reassign"
                        >
                          <Sliders className="w-3 h-3 mr-1" />
                          Manage
                        </Button>
                        <Link to={`/appointments/${apt.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Patient Privacy Notice:</strong> Patient diagnostic notes and clinical histories are protected under strict hospital governance and not rendered on this operational roster. Direct patient chat is not permitted.
        </span>
      </div>

      {/* Appointment Actions Modal */}
      {activeAppointment && (
        <Modal
          isOpen={Boolean(activeAppointment)}
          onClose={() => setActiveAppointment(null)}
          title={`Manage Appointment: ${activeAppointment.patient_name || activeAppointment.id.substring(0, 8)}`}
        >
          <div className="space-y-4">
            {/* Quick action selection tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveAction('RESCHEDULE')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                  activeAction === 'RESCHEDULE' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Reschedule
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('REASSIGN_DOCTOR')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                  activeAction === 'REASSIGN_DOCTOR' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Reassign Doc
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('CHANGE_DEPARTMENT')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                  activeAction === 'CHANGE_DEPARTMENT' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Change Dept
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('ADD_NOTES')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                  activeAction === 'ADD_NOTES' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Notes
              </button>

              <button
                type="button"
                onClick={() => setActiveAction('CANCEL')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                  activeAction === 'CANCEL' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>

            {/* Action Form */}
            <form onSubmit={handleSubmit(onActionSubmit)} className="space-y-4 pt-2">
              {activeAction === 'RESCHEDULE' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-900">
                    Rescheduling moves the patient's consultation to a new date and time slot.
                  </div>
                  <Input
                    label="New Appointment Date"
                    type="date"
                    {...register('new_date')}
                    error={errors.new_date?.message}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Slot Start Time"
                      type="time"
                      {...register('new_start_time')}
                      error={errors.new_start_time?.message}
                    />
                    <Input
                      label="Slot End Time"
                      type="time"
                      {...register('new_end_time')}
                      error={errors.new_end_time?.message}
                    />
                  </div>
                </div>
              )}

              {activeAction === 'REASSIGN_DOCTOR' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    Select a physician to reassign this consultation.
                  </div>
                  <Select
                    label="Assign Doctor"
                    {...register('doctor_id')}
                    options={[
                      { value: '', label: 'Unassigned / OPD Triage Pool' },
                      ...doctors.map((d) => ({
                        value: d.id,
                        label: `${d.profile?.name || 'Doctor'} (${d.specialization}) - ${d.status}`,
                      })),
                    ]}
                  />
                </div>
              )}

              {activeAction === 'CHANGE_DEPARTMENT' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    Re-route this appointment to an alternate clinical department.
                  </div>
                  <Select
                    label="Target Department"
                    {...register('department_id')}
                    options={departments.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.location})`,
                    }))}
                  />
                </div>
              )}

              {activeAction === 'ADD_NOTES' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    Operational or coordination notes visible to clinical staff.
                  </div>
                  <Input
                    label="Internal Clinical / Staff Notes"
                    {...register('notes')}
                    placeholder="e.g. Patient requires wheelchair assistance upon arrival."
                  />
                </div>
              )}

              {activeAction === 'CANCEL' && (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    Warning: Cancelling this appointment will remove it from active queue rosters.
                  </div>
                  <Input
                    label="Cancellation Reason"
                    {...register('cancellation_reason')}
                    placeholder="e.g. Patient called to cancel / doctor emergency unavailability"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveAppointment(null)}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant={activeAction === 'CANCEL' ? 'destructive' : 'primary'}
                  isLoading={isSubmitting || appointmentMutation.isPending}
                >
                  {activeAction === 'CANCEL' ? 'Confirm Cancellation' : 'Apply Changes'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

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

