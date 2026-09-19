import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { journeyService } from '../../services/journeyService';
import { apiService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { JourneyTemplateRow, JourneyTemplateStepRow, NavigationLocationRow } from '../../types/database.types';
import { useToast } from '../../hooks/useToast';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Building, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  Edit3,
  Layers,
  Sparkles,
  Power,
  Search,
  Check,
  MapPin,
  Stethoscope,
  Activity,
  FileText
} from 'lucide-react';

export const JourneyConfigPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';
  const isAdmin = user?.profile?.role === 'HOSPITAL_ADMIN';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');

  // Step adding modal state
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepLocation, setNewStepLocation] = useState('');
  const [newStepNavId, setNewStepNavId] = useState('');
  const [newStepDuration, setNewStepDuration] = useState('15');

  // Step editing modal state
  const [editingStep, setEditingStep] = useState<JourneyTemplateStepRow | null>(null);

  // Template creation modal state
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateDeptId, setNewTemplateDeptId] = useState('');

  // Template edit modal state
  const [editingTemplate, setEditingTemplate] = useState<JourneyTemplateRow | null>(null);

  // Delete confirmations
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // 1. Fetch Journey Templates
  const { data: templates = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['journey_templates', hospitalId],
    queryFn: () => journeyService.getTemplates(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // 2. Fetch Navigation Locations to assign real physical rooms/counters
  const { data: navigationLocations = [] } = useQuery({
    queryKey: ['navigation', hospitalId],
    queryFn: () => apiService.getNavigationLocations(hospitalId),
    enabled: Boolean(hospitalId),
  });

  // 3. Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', { hospitalId }],
    queryFn: () => apiService.getDepartments(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const activeSteps = (activeTemplate?.steps || []).sort((a, b) => a.step_order - b.step_order);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['journey_templates', hospitalId] });
  };

  // --------------------------------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------------------------------

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      department_id?: string;
      steps: Array<{ name: string; location: string; expected_duration: number }>;
    }) =>
      journeyService.createTemplate(
        {
          hospital_id: hospitalId,
          name: payload.name,
          description: payload.description,
          department_id: payload.department_id,
          steps: payload.steps,
        },
        user?.id
      ),
    onSuccess: (newTpl) => {
      invalidate();
      setIsNewTemplateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateDeptId('');
      setSelectedTemplateId(newTpl.id);
      showSuccess('Care Pathway Created', `${newTpl.name} workflow template initialized in Supabase.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to create template.');
    },
  });

  // Edit Template Metadata Mutation
  const editTemplateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<JourneyTemplateRow> }) =>
      journeyService.updateTemplate(id, updates, user?.id),
    onSuccess: (updated) => {
      invalidate();
      setEditingTemplate(null);
      showSuccess('Pathway Updated', `${updated.name} settings saved.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to update template.');
    },
  });

  // Toggle Template Active/Inactive Status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      journeyService.toggleTemplateStatus(id, status, user?.id),
    onSuccess: (updated) => {
      invalidate();
      showSuccess('Status Updated', `Pathway is now ${updated.status}.`);
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to toggle status.');
    },
  });

  // Delete Template Mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => journeyService.deleteTemplate(id, user?.id),
    onSuccess: () => {
      invalidate();
      setDeletingTemplateId(null);
      setSelectedTemplateId('');
      showSuccess('Template Removed', 'Pathway template removed from hospital registry.');
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to delete template.');
    },
  });

  // Reorder / Update Steps Mutation
  const updateStepsMutation = useMutation({
    mutationFn: (updatedSteps: JourneyTemplateStepRow[]) =>
      journeyService.updateTemplateSteps(
        activeTemplate.id,
        updatedSteps.map((s, idx) => ({
          name: s.name,
          location: s.location,
          navigation_id: s.navigation_id,
          expected_duration: s.expected_duration,
          step_order: idx + 1,
        })),
        user?.id
      ),
    onSuccess: () => {
      invalidate();
      showSuccess('Workflow Updated', 'Care journey sequence and step order saved to Supabase.');
    },
    onError: (err: any) => {
      showError('Error', err?.message || 'Failed to update steps.');
    },
  });

  // --------------------------------------------------------------------------
  // WORKFLOW PRESETS (1-Click Generator for User Examples)
  // --------------------------------------------------------------------------
  const handleCreatePreset = (type: 'CONSULTATION' | 'CONSULTATION_SCAN' | 'LAB_TRIAGE') => {
    if (type === 'CONSULTATION') {
      createTemplateMutation.mutate({
        name: 'CONSULTATION',
        description: 'Standard outpatient physician consultation pathway',
        steps: [
          { name: 'Check-in & Registration', location: 'Main Hospital Building - Floor 1 - Counter C-1', expected_duration: 10 },
          { name: 'Department Triage Area', location: 'Clinical OPD Triage Desk', expected_duration: 10 },
          { name: 'Doctor Consultation', location: 'OPD Consultation Room', expected_duration: 20 },
          { name: 'Completed & Checkout', location: 'Main Atrium Desk', expected_duration: 5 },
        ],
      });
    } else if (type === 'CONSULTATION_SCAN') {
      createTemplateMutation.mutate({
        name: 'CONSULTATION + SCAN',
        description: 'Combined diagnostic imaging and specialist review workflow',
        steps: [
          { name: 'Check-in & Registration', location: 'Main Hospital Building - Floor 1 - Counter C-1', expected_duration: 10 },
          { name: 'Doctor Initial Assessment', location: 'OPD Consultation Room', expected_duration: 15 },
          { name: 'Radiology Reception', location: 'Radiology Reception Counter R-1', expected_duration: 10 },
          { name: 'Diagnostic Scan (Ultrasound / MRI)', location: 'Scan Suite 2', expected_duration: 30 },
          { name: 'Doctor Report Review', location: 'OPD Consultation Room', expected_duration: 15 },
          { name: 'Completed & Pharmacy', location: 'Central Outpatient Pharmacy Counter P-3', expected_duration: 10 },
        ],
      });
    } else if (type === 'LAB_TRIAGE') {
      createTemplateMutation.mutate({
        name: 'LABORATORY TRIAGE',
        description: 'Pathology diagnostic workup and phlebotomy pipeline',
        steps: [
          { name: 'Check-in & Token Generation', location: 'Main Hospital Building - Floor 1 - Counter C-1', expected_duration: 10 },
          { name: 'Phlebotomy Sample Collection', location: 'Automated Pathology & Blood Lab Phlebotomy Bay 3', expected_duration: 15 },
          { name: 'Diagnostic Lab Processing', location: 'Pathology Diagnostic Center', expected_duration: 45 },
          { name: 'Doctor Review & Prescription', location: 'OPD Consultation Room', expected_duration: 15 },
          { name: 'Completed & Pharmacy', location: 'Central Outpatient Pharmacy Counter P-3', expected_duration: 10 },
        ],
      });
    }
  };

  // Move Step Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const clone = [...activeSteps];
    const temp = clone[index];
    clone[index] = clone[index - 1];
    clone[index - 1] = temp;
    updateStepsMutation.mutate(clone);
  };

  // Move Step Down
  const handleMoveDown = (index: number) => {
    if (index === activeSteps.length - 1) return;
    const clone = [...activeSteps];
    const temp = clone[index];
    clone[index] = clone[index + 1];
    clone[index + 1] = temp;
    updateStepsMutation.mutate(clone);
  };

  // Add Step
  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName || !newStepLocation) return;
    const newStep: JourneyTemplateStepRow = {
      id: `ts-${Date.now()}`,
      template_id: activeTemplate.id,
      name: newStepName,
      location: newStepLocation,
      navigation_id: newStepNavId || null,
      step_order: activeSteps.length + 1,
      expected_duration: parseInt(newStepDuration, 10) || 15,
      created_at: new Date().toISOString(),
    };
    const clone = [...activeSteps, newStep];
    updateStepsMutation.mutate(clone);
    setIsAddStepModalOpen(false);
    setNewStepName('');
    setNewStepLocation('');
    setNewStepNavId('');
  };

  // Save Step Edit
  const handleSaveStepEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep) return;
    const clone = activeSteps.map((s) => (s.id === editingStep.id ? editingStep : s));
    updateStepsMutation.mutate(clone);
    setEditingStep(null);
  };

  // Remove Step
  const handleConfirmDeleteStep = () => {
    if (!deletingStepId) return;
    const clone = activeSteps.filter((s) => s.id !== deletingStepId);
    updateStepsMutation.mutate(clone);
    setDeletingStepId(null);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Care Journey Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create workflow templates, reorder clinical steps, assign physical navigation nodes, and activate pathways in Supabase.
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
            <Button size="sm" onClick={() => setIsNewTemplateModalOpen(true)} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Create Custom Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Quick Preset Library Banner */}
      {isAdmin && (
        <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Quick Workflow Presets
                </h4>
                <p className="text-xs text-blue-800">
                  Instantly initialize standardized multi-department clinical care templates.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreatePreset('CONSULTATION')}
                isLoading={createTemplateMutation.isPending}
                className="text-xs bg-white text-blue-900 border-blue-200 hover:bg-blue-100/50"
              >
                + Preset: CONSULTATION
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreatePreset('CONSULTATION_SCAN')}
                isLoading={createTemplateMutation.isPending}
                className="text-xs bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100/50"
              >
                + Preset: CONSULTATION + SCAN
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreatePreset('LAB_TRIAGE')}
                isLoading={createTemplateMutation.isPending}
                className="text-xs bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
              >
                + Preset: LAB TRIAGE
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          Loading care journey templates from Supabase...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Template Selector List (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Workflows ({templates.length})
              </h3>
              <span className="text-[11px] text-slate-400">Select to customize</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === (activeTemplate?.id || templates[0]?.id);
                const stepCount = tpl.steps?.length ?? 0;
                const isActive = tpl.status !== 'INACTIVE';

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{tpl.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {tpl.description || 'Standard care pathway.'}
                        </p>
                      </div>

                      <Badge
                        variant={isActive ? 'success' : 'secondary'}
                        className="text-[9px] uppercase px-1.5 py-0 shrink-0"
                      >
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                      <span className="font-semibold text-blue-700">
                        {stepCount} sequential step{stepCount === 1 ? '' : 's'}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString() : 'Supabase'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Template Workflow Builder (8 cols) */}
          <div className="md:col-span-8 space-y-4">
            {activeTemplate ? (
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <GitFork className="w-4 h-4 text-blue-600" />
                          {activeTemplate.name}
                        </CardTitle>
                        <Badge
                          variant={activeTemplate.status !== 'INACTIVE' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {activeTemplate.status || 'ACTIVE'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{activeTemplate.description}</p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        {/* Toggle Status */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: activeTemplate.id,
                              status: activeTemplate.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE',
                            })
                          }
                          className="text-xs h-8"
                          title="Activate or Deactivate this workflow template"
                        >
                          <Power className={`w-3.5 h-3.5 mr-1 ${activeTemplate.status !== 'INACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          {activeTemplate.status === 'INACTIVE' ? 'Activate' : 'Deactivate'}
                        </Button>

                        {/* Edit Template */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTemplate(activeTemplate)}
                          className="text-xs h-8"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Edit Info
                        </Button>

                        {/* Add Step */}
                        <Button
                          size="sm"
                          onClick={() => setIsAddStepModalOpen(true)}
                          className="text-xs gap-1 h-8 bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Step
                        </Button>

                        {/* Delete Template */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingTemplateId(activeTemplate.id)}
                          className="text-xs h-8 text-rose-600 hover:bg-rose-50"
                          title="Delete Workflow Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Sequential Clinical Stages ({activeSteps.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Reorder with arrows</span>
                  </div>

                  {activeSteps.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      No steps in this care workflow yet. Click "Add Step" to define the pathway.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeSteps.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between shadow-2xs group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-slate-900">{step.name}</h5>
                                {idx === 0 && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">
                                    INITIAL
                                  </span>
                                )}
                                {idx === activeSteps.length - 1 && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                    TERMINAL
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3 text-slate-400" />
                                {step.location}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {step.expected_duration} min
                            </span>

                            {isAdmin && (
                              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                                {/* Reorder Up */}
                                <button
                                  onClick={() => handleMoveUp(idx)}
                                  disabled={idx === 0 || updateStepsMutation.isPending}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded hover:bg-slate-100"
                                  title="Move Step Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                {/* Reorder Down */}
                                <button
                                  onClick={() => handleMoveDown(idx)}
                                  disabled={idx === activeSteps.length - 1 || updateStepsMutation.isPending}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded hover:bg-slate-100"
                                  title="Move Step Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Step */}
                                <button
                                  onClick={() => setEditingStep(step)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                                  title="Edit Step"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Step */}
                                <button
                                  onClick={() => setDeletingStepId(step.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                                  title="Remove Step"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
                    <span className="font-bold">Live Supabase Synchronization:</span> When patients check in for appointments associated with this template, steps advance automatically based on hospital clinician status updates.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                No templates configured. Create one above to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE WORKFLOW TEMPLATE MODAL */}
      <Modal
        isOpen={isNewTemplateModalOpen}
        onClose={() => setIsNewTemplateModalOpen(false)}
        title="Create New Care Pathway Workflow"
        description="Define a multi-step clinical process for your hospital facility."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTemplateMutation.mutate({
              name: newTemplateName,
              description: newTemplateDesc,
              department_id: newTemplateDeptId || undefined,
              steps: [
                { name: 'Check-in & Registration', location: 'Main Hospital Building - Floor 1 - Counter C-1', expected_duration: 10 },
                { name: 'Clinical Consultation', location: 'OPD Consultation Room', expected_duration: 20 },
                { name: 'Completed & Checkout', location: 'Main Reception', expected_duration: 5 },
              ],
            });
          }}
          className="space-y-3.5 text-xs"
        >
          <Input
            label="Workflow Template Name"
            placeholder="e.g. DAY SURGERY ADMISSION"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Associated Clinical Department (Optional)
            </label>
            <select
              value={newTemplateDeptId}
              onChange={(e) => setNewTemplateDeptId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
            >
              <option value="">General (All Hospital Departments)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (Floor {d.floor})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description / Clinical Intent
            </label>
            <textarea
              placeholder="Describe when this care pathway should be utilized..."
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              rows={3}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createTemplateMutation.isPending}>
              Create Workflow
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TEMPLATE MODAL */}
      {editingTemplate && (
        <Modal
          isOpen={Boolean(editingTemplate)}
          onClose={() => setEditingTemplate(null)}
          title={`Edit Workflow — ${editingTemplate.name}`}
          description="Update pathway description, department linkage, and status."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editTemplateMutation.mutate({
                id: editingTemplate.id,
                updates: {
                  name: editingTemplate.name,
                  description: editingTemplate.description,
                  department_id: editingTemplate.department_id,
                  status: editingTemplate.status,
                },
              });
            }}
            className="space-y-3.5 text-xs"
          >
            <Input
              label="Template Name"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Clinical Department
              </label>
              <select
                value={editingTemplate.department_id || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, department_id: e.target.value || null })}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
              >
                <option value="">General (Hospital-wide)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={editingTemplate.description || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                rows={3}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={editTemplateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD STEP MODAL WITH REAL NAVIGATION NODE PICKER */}
      <Modal
        isOpen={isAddStepModalOpen}
        onClose={() => setIsAddStepModalOpen(false)}
        title="Add Workflow Step"
        description="Insert a clinical or diagnostic phase and link it to physical hospital wayfinding coordinates."
      >
        <form onSubmit={handleAddStep} className="space-y-3.5 text-xs">
          <Input
            label="Step Name"
            placeholder="e.g. Targeted Ultrasound Scan"
            value={newStepName}
            onChange={(e) => setNewStepName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assign Location from Hospital Navigation Nodes
            </label>
            <select
              value={newStepNavId}
              onChange={(e) => {
                const navId = e.target.value;
                setNewStepNavId(navId);
                const loc = navigationLocations.find((n) => n.id === navId);
                if (loc) {
                  setNewStepLocation(`${loc.building} • ${loc.block} (${loc.floor}) - ${loc.name || loc.room}`);
                }
              }}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
            >
              <option value="">Select a mapped station...</option>
              {navigationLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.building} • {loc.block} ({loc.floor}) — {loc.name || loc.room} ({loc.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Custom Location Label
            </label>
            <input
              type="text"
              placeholder="e.g. Block B - Floor 2 - Scan Suite 2"
              value={newStepLocation}
              onChange={(e) => setNewStepLocation(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <Input
            label="Expected Duration (Minutes)"
            type="number"
            min="5"
            max="180"
            value={newStepDuration}
            onChange={(e) => setNewStepDuration(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddStepModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add Step
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT STEP MODAL */}
      {editingStep && (
        <Modal
          isOpen={Boolean(editingStep)}
          onClose={() => setEditingStep(null)}
          title={`Edit Step — ${editingStep.name}`}
          description="Update step designation and duration."
        >
          <form onSubmit={handleSaveStepEdit} className="space-y-3.5 text-xs">
            <Input
              label="Step Name"
              value={editingStep.name}
              onChange={(e) => setEditingStep({ ...editingStep, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assign Location from Hospital Navigation Nodes
              </label>
              <select
                value={editingStep.navigation_id || ''}
                onChange={(e) => {
                  const navId = e.target.value;
                  const loc = navigationLocations.find((n) => n.id === navId);
                  setEditingStep({
                    ...editingStep,
                    navigation_id: navId || null,
                    location: loc ? `${loc.building} • ${loc.block} (${loc.floor}) - ${loc.name || loc.room}` : editingStep.location,
                  });
                }}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
              >
                <option value="">Select a mapped station...</option>
                {navigationLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.building} • {loc.block} ({loc.floor}) — {loc.name || loc.room}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Location String"
              value={editingStep.location}
              onChange={(e) => setEditingStep({ ...editingStep, location: e.target.value })}
              required
            />

            <Input
              label="Expected Duration (Minutes)"
              type="number"
              value={editingStep.expected_duration}
              onChange={(e) => setEditingStep({ ...editingStep, expected_duration: parseInt(e.target.value, 10) || 15 })}
              required
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingStep(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Step
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM DELETE STEP */}
      <ConfirmDialog
        isOpen={Boolean(deletingStepId)}
        onClose={() => setDeletingStepId(null)}
        onConfirm={handleConfirmDeleteStep}
        title="Remove Workflow Step?"
        message="Are you sure you want to remove this step from the sequence? Appointments currently in progress will not be affected."
        confirmLabel="Remove Step"
        confirmVariant="destructive"
      />

      {/* CONFIRM DELETE TEMPLATE */}
      <ConfirmDialog
        isOpen={Boolean(deletingTemplateId)}
        onClose={() => setDeletingTemplateId(null)}
        onConfirm={() => deletingTemplateId && deleteTemplateMutation.mutate(deletingTemplateId)}
        title="Delete Care Workflow Template?"
        message="Are you sure you want to permanently delete this workflow template from Supabase?"
        confirmLabel="Delete Workflow"
        confirmVariant="destructive"
        isLoading={deleteTemplateMutation.isPending}
      />
    </div>
  );
};
