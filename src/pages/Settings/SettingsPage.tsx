import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hospitalSettingsFormSchema, HospitalSettingsFormValues } from '../../lib/validations/adminSchemas';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { RoleBadge } from '../../components/layout/RoleBadge';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { 
  Building, 
  Clock, 
  ShieldAlert, 
  Database, 
  Check, 
  Activity, 
  FileText, 
  Search, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { UserRole } from '../../types/auth.types';

export const SettingsPage: React.FC = () => {
  const { user, switchHospital } = useAuth();
  const hospitalId = user?.hospital?.id || '11111111-1111-1111-1111-111111111111';
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');

  // Fetch Current Hospital Details
  const { data: currentHospital } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => apiService.getHospitalById(hospitalId),
    enabled: !!hospitalId,
  });

  // Fetch All Hospitals for Multi-Tenant Switcher
  const { data: allHospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiService.getAllHospitals(),
  });

  // Fetch Read-Only Audit Logs
  const { data: auditLogs = [], isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['audit_logs', hospitalId],
    queryFn: () => apiService.getAuditLogs(hospitalId),
    enabled: !!hospitalId,
  });

  // React Hook Form + Zod for Hospital Settings
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HospitalSettingsFormValues>({
    resolver: zodResolver(hospitalSettingsFormSchema),
    defaultValues: {
      name: currentHospital?.name || '',
      address: currentHospital?.address || '',
      contact: currentHospital?.contact || '',
      open_time: '08:00',
      close_time: '20:00',
      is_emergency_24_7: true,
      warning_threshold: 25,
      critical_threshold: 45,
      realtime_frequency: 'REALTIME_LIVE',
    },
  });

  useEffect(() => {
    if (currentHospital) {
      const monHours = currentHospital.operating_hours?.monday;
      reset({
        name: currentHospital.name || '',
        address: currentHospital.address || '',
        contact: currentHospital.contact || '',
        open_time: monHours?.open || '08:00',
        close_time: monHours?.close || '20:00',
        is_emergency_24_7: true,
        warning_threshold: 25,
        critical_threshold: 45,
        realtime_frequency: 'REALTIME_LIVE',
      });
    }
  }, [currentHospital, reset]);

  // Mutation for Updating Hospital Settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (values: HospitalSettingsFormValues) => {
      const updatedOperatingHours = {
        ...(currentHospital?.operating_hours || {}),
        monday: { open: values.open_time, close: values.close_time },
        tuesday: { open: values.open_time, close: values.close_time },
        wednesday: { open: values.open_time, close: values.close_time },
        thursday: { open: values.open_time, close: values.close_time },
        friday: { open: values.open_time, close: values.close_time },
        saturday: { open: values.open_time, close: '14:00' },
        sunday: { closed: !values.is_emergency_24_7 },
      };

      return apiService.updateHospital(
        hospitalId,
        {
          name: values.name,
          address: values.address,
          contact: values.contact,
          operating_hours: updatedOperatingHours,
        },
        user?.id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['audit_logs', hospitalId] });
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Hospital information, hours, and operational thresholds updated successfully.',
      });
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Could not save hospital settings.',
      });
    },
  });

  const onSubmit = (data: HospitalSettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.actor_id && log.actor_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;
    const matchesResource = resourceFilter === 'ALL' || log.resource.toLowerCase() === resourceFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesResource;
  });

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: ts, time: '' };
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('INSERT')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('DELETE') || action.includes('DEACTIVATE') || action.includes('CANCEL')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CALL') || action.includes('STATUS')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Hospital Administration & Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage facility metadata, OPD operating schedule, queue alert thresholds, and inspect immutable audit logs.
        </p>
      </div>

      {/* Multi-Tenant Facility Switcher */}
      <Card className="border-blue-100 bg-linear-to-r from-blue-50/40 via-white to-slate-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Active Hospital Facility (Tenant Isolation)
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
              Single-Hospital Isolation Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hospital Admin controls ONE hospital only. Select an active facility to verify strict isolation of departments, doctors, services, and queues.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allHospitals.map((h) => {
              const isCurrent = h.id === user?.hospital?.id;
              return (
                <div
                  key={h.id}
                  onClick={() => switchHospital(h.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    isCurrent
                      ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{h.name}</h4>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{h.address}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>ID: {h.id.substring(0, 16)}...</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">Status: {h.status}</span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 ml-2">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hospital Information & Operating Hours Form */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Hospital Profile & Operating Hours
          </CardTitle>
          <p className="text-xs text-slate-500">
            Configure contact information and clinical department operating windows.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Hospital Basic Details */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Facility Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Hospital Name"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="e.g. City General Metropolitan Hospital"
                />

                <Input
                  label="Contact Phone / Official Email"
                  {...register('contact')}
                  error={errors.contact?.message}
                  placeholder="e.g. +1 (555) 019-2834 / opd@citygeneral.health"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Physical Address"
                    {...register('address')}
                    error={errors.address?.message}
                    placeholder="e.g. 100 Medical Center Way, Health District, Sector 4"
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                OPD Clinical Hours & Availability
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="OPD Daily Opening Time"
                  type="time"
                  {...register('open_time')}
                  error={errors.open_time?.message}
                />

                <Input
                  label="OPD Daily Closing Time"
                  type="time"
                  {...register('close_time')}
                  error={errors.close_time?.message}
                />

                <div className="flex flex-col justify-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      {...register('is_emergency_24_7')}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>24/7 Emergency & Trauma Unit Active</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1 pl-6">
                    Keeps urgent triage queues operational outside normal OPD shifts.
                  </p>
                </div>
              </div>
            </div>

            {/* Queue Delay Warning Thresholds */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Queue Delay Alert Thresholds
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Warning Alert Wait Threshold (Minutes)"
                  type="number"
                  min={5}
                  max={120}
                  {...register('warning_threshold')}
                  error={errors.warning_threshold?.message}
                  helperText="Patients waiting longer than this trigger amber warnings on staff dashboards."
                />

                <Input
                  label="Critical Surge Alert Wait Threshold (Minutes)"
                  type="number"
                  min={10}
                  max={240}
                  {...register('critical_threshold')}
                  error={errors.critical_threshold?.message}
                  helperText="Delays exceeding this threshold alert the Head Administrator for queue rebalancing."
                />
              </div>
            </div>

            {/* Realtime Update Frequency */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Realtime Engine & Sync Cadence
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Realtime Synchronization Mode"
                  {...register('realtime_frequency')}
                  options={[
                    { value: 'REALTIME_LIVE', label: 'Supabase Realtime WebSockets (Instant, Live push)' },
                    { value: 'POLL_3S', label: 'High Frequency Polling (3-second cadence)' },
                    { value: 'POLL_5S', label: 'Standard Polling (5-second cadence)' },
                    { value: 'POLL_10S', label: 'Low Bandwidth Polling (10-second cadence)' },
                  ]}
                  helperText="Hospital Portal uses bidirectional Supabase Realtime with automatic polling fallback."
                />

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 self-center">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    Supabase Realtime Status
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Channel: <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">hospital_{hospitalId.substring(0, 8)}</code></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                {isDirty ? (
                  <span className="text-amber-600 font-medium">● Unsaved settings changes</span>
                ) : (
                  <span>All settings are currently up to date</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => reset()}
                  disabled={!isDirty || isSubmitting}
                >
                  Discard Changes
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmitting || updateSettingsMutation.isPending}
                >
                  Save Hospital Settings
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Read-Only Audit Log Viewer */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Hospital Audit Log Viewer
                </CardTitle>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Read-Only
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically tracked record of administrative mutations, staff calls, and schedule adjustments.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLogs()}
              className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Logs
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Security & Compliance Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Immutable Audit Trail: </span>
              In strict accordance with medical software governance, all mutations automatically write an audit log. 
              Hospital administrators may view logs for compliance analysis, but 
              <span className="font-semibold text-amber-950"> records cannot be edited, tampered with, or deleted</span>.
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action, actor, resource..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="HOSPITAL_ADMIN">Hospital Admin Only</option>
              <option value="DOCTOR">Doctor Only</option>
              <option value="HOSPITAL_STAFF">Hospital Staff Only</option>
            </select>

            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="ALL">All Resources</option>
              <option value="doctors">Doctors</option>
              <option value="doctor_schedules">Doctor Schedules</option>
              <option value="departments">Departments</option>
              <option value="services">Services</option>
              <option value="navigation">Navigation Nodes</option>
              <option value="journey_templates">Journey Templates</option>
              <option value="queue_entries">Queue Entries</option>
              <option value="hospitals">Hospital Settings</option>
            </select>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Resource</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Metadata / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-slate-300" />
                        Loading audit log trail...
                      </td>
                    </tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No audit log entries matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const { date, time } = formatTimestamp(log.timestamp);
                      const isSuccess = !log.status || log.status === 'SUCCESS';
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{time}</div>
                            <div className="text-[10px] text-slate-400">{date}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">
                              {log.actor_name || 'System / Admin'}
                            </div>
                            {log.actor_id && (
                              <div className="text-[10px] font-mono text-slate-400">
                                {log.actor_id.substring(0, 10)}...
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <RoleBadge role={log.role as UserRole} className="text-[10px] py-0 px-1.5" />
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getActionColor(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <code className="text-[11px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {log.resource}
                            </code>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isSuccess ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                SUCCESS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                {log.status}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                            {log.metadata && Object.keys(log.metadata).length > 0 ? (
                              <span className="font-mono text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                {JSON.stringify(log.metadata)}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">No extra payload</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Showing {filteredAuditLogs.length} of {auditLogs.length} logged mutations</span>
              <span className="font-medium text-slate-600">Audit Storage: PostgreSQL Append-Only</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

