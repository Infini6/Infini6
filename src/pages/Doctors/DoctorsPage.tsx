import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { doctorService } from '../../services/doctorService';
import { apiService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { DOCTOR_STATUS_CONFIG } from '../../utils/constants';
import { DoctorStatus, DoctorRow } from '../../types/database.types';
import { useToast } from '../../hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  doctorFormSchema, 
  DoctorFormValues, 
  doctorScheduleFormSchema, 
  DoctorScheduleFormValues 
} from '../../lib/validations/adminSchemas';
import { 
  Stethoscope, 
  Building, 
  RefreshCw, 
  Plus, 
  Edit, 
  Calendar, 
  UserX, 
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const isAdmin = user?.profile?.role === 'HOSPITAL_ADMIN';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  // Dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRow | null>(null);
  const [schedulingDoctor, setSchedulingDoctor] = useState<DoctorRow | null>(null);
  const [deactivatingDoctor, setDeactivatingDoctor] = useState<DoctorRow | null>(null);

  // Queries
  const { data: doctors = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.doctors.all(hospitalId),
    queryFn: () => doctorService.getDoctors(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all(hospitalId),
    queryFn: () => apiService.getDepartments(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const { data: services = [] } = useQuery({
    queryKey: queryKeys.services.all(hospitalId),
    queryFn: () => apiService.getServices(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // React Hook Form for Doctor Add/Edit
  const doctorForm = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      department_id: '',
      specialization: '',
      status: 'AVAILABLE',
    },
  });

  // React Hook Form for Schedule Configuration
  const scheduleForm = useForm<DoctorScheduleFormValues>({
    resolver: zodResolver(doctorScheduleFormSchema),
    defaultValues: {
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_time: '08:30',
      end_time: '16:30',
      break_start: '12:30',
      break_end: '13:15',
      availability_status: 'AVAILABLE',
    },
  });

  // Invalidate helper
  const invalidateDoctors = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });
  };

  // Add Doctor Mutation
  const addDoctorMutation = useMutation({
    mutationFn: (values: DoctorFormValues) =>
      doctorService.createDoctor(
        {
          ...values,
          hospital_id: hospitalId,
        },
        user?.id
      ),
    onSuccess: (newDoc) => {
      invalidateDoctors();
      setIsAddModalOpen(false);
      doctorForm.reset();
      showSuccess('Doctor Registered', `${newDoc.profile?.name || 'Doctor'} has been added to the hospital directory.`);
    },
    onError: (err: any) => {
      showError('Registration Failed', err?.message || 'Could not add doctor.');
    },
  });

  // Edit Doctor Mutation
  const editDoctorMutation = useMutation({
    mutationFn: ({ id, values, services }: { id: string; values: DoctorFormValues; services: string[] }) =>
      doctorService.updateDoctor(
        id,
        {
          ...values,
          assigned_services: services,
        },
        user?.id
      ),
    onSuccess: (updated) => {
      invalidateDoctors();
      setEditingDoctor(null);
      showSuccess('Doctor Profile Updated', `${updated.profile?.name} was updated successfully.`);
    },
    onError: (err: any) => {
      showError('Update Failed', err?.message || 'Could not update doctor profile.');
    },
  });

  // Save Schedule Mutation
  const saveScheduleMutation = useMutation({
    mutationFn: ({ doctorId, values }: { doctorId: string; values: DoctorScheduleFormValues }) =>
      doctorService.saveDoctorSchedule(
        doctorId,
        {
          date: new Date().toISOString().split('T')[0],
          working_days: values.working_days,
          start_time: values.start_time,
          end_time: values.end_time,
          break_periods: values.break_start && values.break_end
            ? [{ start: values.break_start, end: values.break_end, reason: 'Shift Break' }]
            : [],
          availability_status: values.availability_status,
        },
        user?.id
      ),
    onSuccess: () => {
      invalidateDoctors();
      setSchedulingDoctor(null);
      showSuccess('Shift Schedule Configured', 'Doctor OPD hours and break periods were updated.');
    },
    onError: (err: any) => {
      showError('Schedule Error', err?.message || 'Failed to save schedule.');
    },
  });

  // Quick Availability Mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: ({ doctorId, status }: { doctorId: string; status: DoctorStatus }) =>
      doctorService.updateDoctorStatus(doctorId, status, user?.id),
    onSuccess: (doc) => {
      invalidateDoctors();
      showSuccess('Availability Changed', `${doc.profile?.name} is now marked as ${doc.status.replace('_', ' ')}.`);
    },
    onError: (err: any) => {
      showError('Status Error', err?.message || 'Failed to update availability.');
    },
  });

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: (doctorId: string) => doctorService.deactivateDoctor(doctorId, user?.id),
    onSuccess: (doc) => {
      invalidateDoctors();
      setDeactivatingDoctor(null);
      showSuccess('Doctor Deactivated', `${doc.profile?.name || 'Doctor'} has been marked inactive / off-duty.`);
    },
    onError: (err: any) => {
      showError('Deactivation Error', err?.message || 'Failed to deactivate doctor.');
    },
  });

  // Open Edit Modal with prefilled values
  const handleOpenEdit = (doc: DoctorRow) => {
    setEditingDoctor(doc);
    doctorForm.reset({
      name: doc.profile?.name || '',
      email: doc.profile?.email || '',
      phone: doc.profile?.phone || '',
      department_id: doc.department_id,
      specialization: doc.specialization,
      status: doc.status,
    });
  };

  // Open Schedule Modal
  const handleOpenSchedule = (doc: DoctorRow) => {
    setSchedulingDoctor(doc);
    scheduleForm.reset({
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_time: '08:30',
      end_time: '16:30',
      break_start: '12:30',
      break_end: '13:15',
      availability_status: doc.status === 'ON_LEAVE' ? 'ON_LEAVE' : 'AVAILABLE',
    });
  };

  const [selectedAssignedServices, setSelectedAssignedServices] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Doctor & Duty Roster Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer clinician credentials, departmental assignments, working hours, and real-time availability.
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
            Refresh
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => {
                doctorForm.reset({
                  name: '',
                  email: '',
                  phone: '',
                  department_id: departments[0]?.id || '',
                  specialization: '',
                  status: 'AVAILABLE',
                });
                setIsAddModalOpen(true);
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Doctor
            </Button>
          )}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          Loading doctor directory from Supabase...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => {
            const statusConf = DOCTOR_STATUS_CONFIG[doctor.status] || DOCTOR_STATUS_CONFIG.AVAILABLE;
            const isInactive = doctor.status === 'OFFLINE';

            return (
              <Card
                key={doctor.id}
                className={`transition-all hover:shadow-sm ${
                  isInactive ? 'opacity-65 bg-slate-50/70 border-dashed border-slate-300' : 'bg-white'
                }`}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {doctor.profile?.name || 'Doctor'}
                          </h3>
                          <p className="text-xs text-slate-500">{doctor.specialization}</p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConf.badge} ${statusConf.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                        {statusConf.label}
                      </span>
                    </div>

                    {/* Department & Contact */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {doctor.department?.name || 'Unassigned Department'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-5">
                        Floor: {doctor.department?.floor || 'Floor 1'} • Location: {doctor.department?.location || 'OPD'}
                      </div>
                      <div className="text-[11px] text-slate-500 pl-5">
                        Contact: {doctor.profile?.email}
                      </div>
                    </div>
                  </div>

                  {/* Availability Dropdown Switcher */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Availability Status:
                      </label>
                      <select
                        value={doctor.status}
                        onChange={(e) =>
                          updateAvailabilityMutation.mutate({
                            doctorId: doctor.id,
                            status: e.target.value as DoctorStatus,
                          })
                        }
                        disabled={updateAvailabilityMutation.isPending}
                        className="h-7 text-xs border border-slate-200 rounded px-2 py-0 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="AVAILABLE">AVAILABLE (On Duty)</option>
                        <option value="BUSY">BUSY (In Consult)</option>
                        <option value="ON_BREAK">ON BREAK</option>
                        <option value="UNAVAILABLE">UNAVAILABLE</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                        <option value="OFFLINE">OFFLINE (Inactive)</option>
                      </select>
                    </div>

                    {/* Action Bar for Admin */}
                    {isAdmin && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/60">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => handleOpenSchedule(doctor)}
                            title="Configure Schedule & Shifts"
                          >
                            <Clock className="w-3 h-3 mr-1 text-slate-500" /> Schedule
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              setSelectedAssignedServices(doctor.assigned_services || []);
                              handleOpenEdit(doctor);
                            }}
                            title="Edit Doctor Profile"
                          >
                            <Edit className="w-3 h-3 mr-1 text-slate-500" /> Edit
                          </Button>
                        </div>

                        {!isInactive ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeactivatingDoctor(doctor)}
                            title="Deactivate Doctor"
                          >
                            <UserX className="w-3.5 h-3.5 mr-1" /> Deactivate
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Deactivated</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ADD DOCTOR MODAL (React Hook Form + Zod) */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Doctor"
        description="Add a licensed medical clinician to your hospital's operational registry."
      >
        <form
          onSubmit={doctorForm.handleSubmit((values) => addDoctorMutation.mutate(values))}
          className="space-y-3 text-xs"
        >
          <Input
            label="Full Doctor Name (with Title)"
            placeholder="e.g. Dr. Jennifer Adams"
            {...doctorForm.register('name')}
            error={doctorForm.formState.errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Official Email"
              type="email"
              placeholder="dr.adams@hospital.org"
              {...doctorForm.register('email')}
              error={doctorForm.formState.errors.email?.message}
            />

            <Input
              label="Contact Phone"
              placeholder="+1 (555) 019-8821"
              {...doctorForm.register('phone')}
              error={doctorForm.formState.errors.phone?.message}
            />
          </div>

          <Select
            label="Primary Department Assignment"
            {...doctorForm.register('department_id')}
            error={doctorForm.formState.errors.department_id?.message}
            options={[
              { value: '', label: 'Select Clinical Department...' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />

          <Input
            label="Specialization"
            placeholder="e.g. Senior Pediatrician / Fetal Medicine"
            {...doctorForm.register('specialization')}
            error={doctorForm.formState.errors.specialization?.message}
          />

          <Select
            label="Initial Availability Status"
            {...doctorForm.register('status')}
            options={[
              { value: 'AVAILABLE', label: 'AVAILABLE (On Duty)' },
              { value: 'ON_BREAK', label: 'ON BREAK' },
              { value: 'UNAVAILABLE', label: 'UNAVAILABLE' },
              { value: 'ON_LEAVE', label: 'ON LEAVE' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={addDoctorMutation.isPending}>
              Register Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* EDIT DOCTOR MODAL (React Hook Form + Zod) */}
      {/* ------------------------------------------------------------------ */}
      {editingDoctor && (
        <Modal
          isOpen={Boolean(editingDoctor)}
          onClose={() => setEditingDoctor(null)}
          title={`Edit Doctor Profile — ${editingDoctor.profile?.name}`}
          description="Update department assignment, clinical services, and contact details."
        >
          <form
            onSubmit={doctorForm.handleSubmit((values) =>
              editDoctorMutation.mutate({
                id: editingDoctor.id,
                values,
                services: selectedAssignedServices,
              })
            )}
            className="space-y-3 text-xs"
          >
            <Input
              label="Doctor Name"
              {...doctorForm.register('name')}
              error={doctorForm.formState.errors.name?.message}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email"
                type="email"
                {...doctorForm.register('email')}
                error={doctorForm.formState.errors.email?.message}
              />
              <Input
                label="Phone"
                {...doctorForm.register('phone')}
                error={doctorForm.formState.errors.phone?.message}
              />
            </div>

            <Select
              label="Assigned Department"
              {...doctorForm.register('department_id')}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />

            <Input
              label="Specialization"
              {...doctorForm.register('specialization')}
              error={doctorForm.formState.errors.specialization?.message}
            />

            {/* Service Assignment Checklist */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Authorized Clinical Services
              </label>
              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2.5 space-y-1.5 bg-slate-50/50">
                {services.map((srv) => {
                  const isChecked = selectedAssignedServices.includes(srv.id);
                  return (
                    <label key={srv.id} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignedServices([...selectedAssignedServices, srv.id]);
                          } else {
                            setSelectedAssignedServices(selectedAssignedServices.filter((id) => id !== srv.id));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold">{srv.name}</span>
                      <span className="text-slate-400">({srv.expected_duration} min)</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingDoctor(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={editDoctorMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCHEDULE CONFIGURATION MODAL (React Hook Form + Zod) */}
      {/* ------------------------------------------------------------------ */}
      {schedulingDoctor && (
        <Modal
          isOpen={Boolean(schedulingDoctor)}
          onClose={() => setSchedulingDoctor(null)}
          title={`Configure Shift Schedule — ${schedulingDoctor.profile?.name}`}
          description="Define weekly roster, consultation shift windows, break periods, and leave availability."
        >
          <form
            onSubmit={scheduleForm.handleSubmit((values) =>
              saveScheduleMutation.mutate({
                doctorId: schedulingDoctor.id,
                values,
              })
            )}
            className="space-y-3.5 text-xs"
          >
            {/* Working Days Checkboxes */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Working Days in Week
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_DAYS.map((day) => {
                  const currentDays = scheduleForm.watch('working_days') || [];
                  const isChecked = currentDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => {
                        if (isChecked) {
                          scheduleForm.setValue(
                            'working_days',
                            currentDays.filter((d) => d !== day)
                          );
                        } else {
                          scheduleForm.setValue('working_days', [...currentDays, day]);
                        }
                      }}
                      className={`p-1.5 rounded text-[11px] font-semibold border transition-all text-center ${
                        isChecked
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
              {scheduleForm.formState.errors.working_days && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {scheduleForm.formState.errors.working_days.message}
                </p>
              )}
            </div>

            {/* Shift Start & End Times */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Shift Start Time"
                type="time"
                {...scheduleForm.register('start_time')}
                error={scheduleForm.formState.errors.start_time?.message}
              />

              <Input
                label="Shift End Time"
                type="time"
                {...scheduleForm.register('end_time')}
                error={scheduleForm.formState.errors.end_time?.message}
              />
            </div>

            {/* Breaks */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Scheduled Break / Ward Rounds
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Break Starts"
                  type="time"
                  {...scheduleForm.register('break_start')}
                />
                <Input
                  label="Break Ends"
                  type="time"
                  {...scheduleForm.register('break_end')}
                />
              </div>
            </div>

            <Select
              label="Current Duty & Leave State"
              {...scheduleForm.register('availability_status')}
              options={[
                { value: 'AVAILABLE', label: 'AVAILABLE (Active Duty)' },
                { value: 'UNAVAILABLE', label: 'UNAVAILABLE (Temporary Block)' },
                { value: 'ON_LEAVE', label: 'ON LEAVE (Vacation / Sick Leave)' },
                { value: 'EMERGENCY_DUTY', label: 'EMERGENCY DUTY (Priority)' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setSchedulingDoctor(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={saveScheduleMutation.isPending}>
                Save Schedule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DEACTIVATE CONFIRMATION DIALOG */}
      {/* ------------------------------------------------------------------ */}
      {deactivatingDoctor && (
        <ConfirmDialog
          isOpen={Boolean(deactivatingDoctor)}
          onClose={() => setDeactivatingDoctor(null)}
          onConfirm={() => deactivateMutation.mutate(deactivatingDoctor.id)}
          title="Deactivate Doctor Roster?"
          message={`Are you sure you want to deactivate ${deactivatingDoctor.profile?.name}? The doctor will be set to OFFLINE and removed from active OPD scheduling.`}
          confirmLabel="Deactivate Doctor"
          confirmVariant="destructive"
          isLoading={deactivateMutation.isPending}
        />
      )}
    </div>
  );
};
