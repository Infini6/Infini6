import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { departmentService } from '../../services/departmentService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { DepartmentRow } from '../../types/database.types';
import { useToast } from '../../hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentFormSchema, DepartmentFormValues } from '../../lib/validations/adminSchemas';
import { 
  Building, 
  MapPin, 
  Clock, 
  Users, 
  Activity, 
  Plus, 
  Edit, 
  PowerOff, 
  RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const isAdmin = user?.profile?.role === 'HOSPITAL_ADMIN';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentRow | null>(null);
  const [deactivatingDept, setDeactivatingDept] = useState<DepartmentRow | null>(null);

  const { data: departments = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.departments.all(hospitalId),
    queryFn: () => departmentService.getDepartments(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      floor: 'Floor 1',
      open_time: '08:00',
      close_time: '20:00',
      status: 'ACTIVE',
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.departments.all(hospitalId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(hospitalId) });
  };

  const createMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) =>
      departmentService.createDepartment(
        {
          hospital_id: hospitalId,
          name: values.name,
          description: values.description || null,
          location: values.location,
          floor: values.floor,
          operating_hours: { open: values.open_time, close: values.close_time },
          status: values.status,
        },
        user?.id
      ),
    onSuccess: (newDept) => {
      invalidate();
      setIsAddModalOpen(false);
      form.reset();
      showSuccess('Department Created', `${newDept.name} has been successfully added.`);
    },
    onError: (err: any) => {
      showError('Creation Error', err?.message || 'Failed to create department.');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: DepartmentFormValues }) =>
      departmentService.updateDepartment(
        id,
        {
          name: values.name,
          description: values.description || null,
          location: values.location,
          floor: values.floor,
          operating_hours: { open: values.open_time, close: values.close_time },
          status: values.status,
        },
        user?.id
      ),
    onSuccess: (updated) => {
      invalidate();
      setEditingDept(null);
      showSuccess('Department Updated', `${updated.name} was successfully modified.`);
    },
    onError: (err: any) => {
      showError('Update Error', err?.message || 'Failed to update department.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (deptId: string) => departmentService.deactivateDepartment(deptId, user?.id),
    onSuccess: () => {
      invalidate();
      setDeactivatingDept(null);
      showSuccess('Department Deactivated', 'Department status set to INACTIVE.');
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to deactivate department.');
    },
  });

  const handleOpenEdit = (dept: DepartmentRow) => {
    setEditingDept(dept);
    form.reset({
      name: dept.name,
      description: dept.description || '',
      location: dept.location,
      floor: dept.floor,
      open_time: dept.operating_hours?.open || '08:00',
      close_time: dept.operating_hours?.close || '20:00',
      status: dept.status,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Departments Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hospital specialty clinics, ward locations, operating hours, and medical staff allotments.
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
                form.reset({
                  name: '',
                  description: '',
                  location: '',
                  floor: 'Floor 1',
                  open_time: '08:00',
                  close_time: '20:00',
                  status: 'ACTIVE',
                });
                setIsAddModalOpen(true);
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          Loading departments from Supabase...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const isInactive = dept.status === 'INACTIVE';

            return (
              <Card
                key={dept.id}
                className={`transition-all hover:border-slate-300 ${
                  isInactive ? 'opacity-65 bg-slate-50/70 border-dashed' : 'bg-white'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Building className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        dept.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : dept.status === 'BUSY'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {dept.status}
                    </span>
                  </div>
                  <CardTitle className="mt-3 text-sm">{dept.name}</CardTitle>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {dept.description || 'General outpatient clinical wing.'}
                  </p>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Location & Operating Hours */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dept.floor} • {dept.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Hours: {dept.operating_hours?.open || '08:00'} - {dept.operating_hours?.close || '20:00'}
                      </span>
                    </div>
                  </div>

                  {/* Doctor and Service Allotments */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-[10px] text-blue-600 uppercase font-semibold">Doctors</div>
                        <div className="font-bold text-xs text-slate-900">{dept.doctor_count ?? 0} active</div>
                      </div>
                    </div>

                    <div className="p-2 bg-teal-50/50 rounded-lg border border-teal-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600" />
                      <div>
                        <div className="text-[10px] text-teal-600 uppercase font-semibold">Services</div>
                        <div className="font-bold text-xs text-slate-900">{dept.service_count ?? 0} listed</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Link to={`/departments/${dept.id}`}>
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-blue-600">
                        View Details
                      </Button>
                    </Link>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => handleOpenEdit(dept)}
                        >
                          <Edit className="w-3 h-3 mr-1 text-slate-500" /> Edit
                        </Button>

                        {!isInactive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeactivatingDept(dept)}
                          >
                            <PowerOff className="w-3 h-3" />
                          </Button>
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

      {/* CREATE DEPARTMENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Hospital Department"
        description="Register an outpatient clinical department and operating shift hours."
      >
        <form
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          className="space-y-3 text-xs"
        >
          <Input
            label="Department Name"
            placeholder="e.g. Pediatric Intensive OPD"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />

          <Input
            label="Description"
            placeholder="Scope of clinical consultations"
            {...form.register('description')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Floor Designation"
              placeholder="e.g. Floor 2"
              {...form.register('floor')}
              error={form.formState.errors.floor?.message}
            />

            <Input
              label="Building Location"
              placeholder="e.g. Block B, Wing East"
              {...form.register('location')}
              error={form.formState.errors.location?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Daily Opening Time"
              type="time"
              {...form.register('open_time')}
            />
            <Input
              label="Daily Closing Time"
              type="time"
              {...form.register('close_time')}
            />
          </div>

          <Select
            label="Operational Status"
            {...form.register('status')}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE (Accepting Patients)' },
              { value: 'BUSY', label: 'BUSY (High Queue Volume)' },
              { value: 'INACTIVE', label: 'INACTIVE (Temporarily Closed)' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <Modal
          isOpen={Boolean(editingDept)}
          onClose={() => setEditingDept(null)}
          title={`Edit Department — ${editingDept.name}`}
          description="Update floor location, clinic operating hours, and operational status."
        >
          <form
            onSubmit={form.handleSubmit((values) =>
              editMutation.mutate({ id: editingDept.id, values })
            )}
            className="space-y-3 text-xs"
          >
            <Input
              label="Department Name"
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />

            <Input
              label="Description"
              {...form.register('description')}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Floor Designation"
                {...form.register('floor')}
                error={form.formState.errors.floor?.message}
              />
              <Input
                label="Building Location"
                {...form.register('location')}
                error={form.formState.errors.location?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Opening Time"
                type="time"
                {...form.register('open_time')}
              />
              <Input
                label="Closing Time"
                type="time"
                {...form.register('close_time')}
              />
            </div>

            <Select
              label="Status"
              {...form.register('status')}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'BUSY', label: 'BUSY' },
                { value: 'INACTIVE', label: 'INACTIVE' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingDept(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={editMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DEACTIVATE CONFIRMATION */}
      {deactivatingDept && (
        <ConfirmDialog
          isOpen={Boolean(deactivatingDept)}
          onClose={() => setDeactivatingDept(null)}
          onConfirm={() => deactivateMutation.mutate(deactivatingDept.id)}
          title="Deactivate Department?"
          message={`Are you sure you want to deactivate ${deactivatingDept.name}? The department status will become INACTIVE and queue registration will pause.`}
          confirmLabel="Deactivate"
          confirmVariant="destructive"
          isLoading={deactivateMutation.isPending}
        />
      )}
    </div>
  );
};
