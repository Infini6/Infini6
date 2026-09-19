import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { ServiceRow } from '../../types/database.types';
import { useToast } from '../../hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceFormSchema, ServiceFormValues } from '../../lib/validations/adminSchemas';
import { 
  Activity, 
  Clock, 
  Plus, 
  RefreshCw, 
  Building, 
  Edit, 
  PowerOff,
  ClipboardList
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const isAdmin = user?.profile?.role === 'HOSPITAL_ADMIN';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [deactivatingService, setDeactivatingService] = useState<ServiceRow | null>(null);

  const { data: services = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.services.all(hospitalId),
    queryFn: () => apiService.getServices(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all(hospitalId),
    queryFn: () => apiService.getDepartments(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      department_id: '',
      expected_duration: 15,
      requirements: '',
      status: 'ACTIVE',
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.services.all(hospitalId) });
  };

  const createMutation = useMutation({
    mutationFn: (values: ServiceFormValues) =>
      apiService.createService(
        {
          name: values.name,
          department_id: values.department_id,
          expected_duration: values.expected_duration,
          requirements: values.requirements || null,
          description: null,
          status: values.status,
        },
        user?.id
      ),
    onSuccess: (newSrv) => {
      invalidate();
      setIsAddModalOpen(false);
      form.reset();
      showSuccess('Service Registered', `${newSrv.name} added to clinical catalog.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to create service.');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceFormValues }) =>
      apiService.updateService(
        id,
        {
          name: values.name,
          department_id: values.department_id,
          expected_duration: values.expected_duration,
          requirements: values.requirements || null,
          status: values.status,
        },
        user?.id
      ),
    onSuccess: (updated) => {
      invalidate();
      setEditingService(null);
      showSuccess('Service Updated', `${updated.name} configuration saved.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to update service.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (serviceId: string) => apiService.deactivateService(serviceId, user?.id),
    onSuccess: () => {
      invalidate();
      setDeactivatingService(null);
      showSuccess('Service Deactivated', 'Service status set to INACTIVE.');
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to deactivate service.');
    },
  });

  const handleOpenEdit = (srv: ServiceRow) => {
    setEditingService(srv);
    form.reset({
      name: srv.name,
      department_id: srv.department_id,
      expected_duration: srv.expected_duration,
      requirements: srv.requirements || '',
      status: srv.status,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Services Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure outpatient clinical procedures, estimated consultation durations, patient instructions, and availability.
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
                  department_id: departments[0]?.id || '',
                  expected_duration: 15,
                  requirements: '',
                  status: 'ACTIVE',
                });
                setIsAddModalOpen(true);
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Service
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          Loading clinical services from Supabase...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => {
            const isInactive = srv.status === 'INACTIVE';

            return (
              <Card
                key={srv.id}
                className={`transition-all hover:border-slate-300 ${
                  isInactive ? 'opacity-65 bg-slate-50/70 border-dashed' : 'bg-white'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {srv.expected_duration} min
                    </span>
                  </div>
                  <CardTitle className="mt-3 text-sm">{srv.name}</CardTitle>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    {srv.department?.name || 'Department'}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {srv.requirements ? (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[11px] text-amber-900">
                      <span className="font-semibold">Preparation:</span> {srv.requirements}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No special preparation instructions.</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        srv.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {srv.status}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => handleOpenEdit(srv)}
                        >
                          <Edit className="w-3 h-3 mr-1 text-slate-500" /> Edit
                        </Button>

                        {!isInactive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeactivatingService(srv)}
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

      {/* ADD SERVICE MODAL (RHF + ZOD) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Clinical Service"
        description="Configure expected durations and patient requirements. (Configuration values only — slot generation is backend managed)."
      >
        <form
          onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          className="space-y-3 text-xs"
        >
          <Input
            label="Service Name"
            placeholder="e.g. Fetal Doppler Consultation"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />

          <Select
            label="Assigned Clinical Department"
            {...form.register('department_id')}
            error={form.formState.errors.department_id?.message}
            options={[
              { value: '', label: 'Select Department...' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />

          <Input
            label="Expected Consultation Duration (Minutes)"
            type="number"
            min="5"
            max="180"
            placeholder="e.g. 15 for consult, 30 for scan"
            {...form.register('expected_duration')}
            error={form.formState.errors.expected_duration?.message}
          />

          <Input
            label="Patient Requirements / Instructions"
            placeholder="e.g. Drink 500ml water 30 mins prior, bring previous scans"
            {...form.register('requirements')}
          />

          <Select
            label="Service Operational Availability"
            {...form.register('status')}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE (Offered Today)' },
              { value: 'INACTIVE', label: 'INACTIVE (Suspended)' },
              { value: 'UNAVAILABLE', label: 'UNAVAILABLE (Equipment Maintenance)' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Register Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT SERVICE MODAL (RHF + ZOD) */}
      {editingService && (
        <Modal
          isOpen={Boolean(editingService)}
          onClose={() => setEditingService(null)}
          title={`Edit Service — ${editingService.name}`}
          description="Update procedure duration, requirements, or availability."
        >
          <form
            onSubmit={form.handleSubmit((values) =>
              editMutation.mutate({ id: editingService.id, values })
            )}
            className="space-y-3 text-xs"
          >
            <Input
              label="Service Name"
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />

            <Select
              label="Assigned Department"
              {...form.register('department_id')}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />

            <Input
              label="Expected Duration (Minutes)"
              type="number"
              min="5"
              max="180"
              {...form.register('expected_duration')}
              error={form.formState.errors.expected_duration?.message}
            />

            <Input
              label="Requirements"
              {...form.register('requirements')}
            />

            <Select
              label="Status"
              {...form.register('status')}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'INACTIVE', label: 'INACTIVE' },
                { value: 'UNAVAILABLE', label: 'UNAVAILABLE' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingService(null)}>
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
      {deactivatingService && (
        <ConfirmDialog
          isOpen={Boolean(deactivatingService)}
          onClose={() => setDeactivatingService(null)}
          onConfirm={() => deactivateMutation.mutate(deactivatingService.id)}
          title="Deactivate Service?"
          message={`Are you sure you want to deactivate ${deactivatingService.name}? Patients will not be able to book or be routed to this procedure.`}
          confirmLabel="Deactivate Service"
          confirmVariant="destructive"
          isLoading={deactivateMutation.isPending}
        />
      )}
    </div>
  );
};
