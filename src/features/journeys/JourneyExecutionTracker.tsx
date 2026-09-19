import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { journeyService } from '../../services/journeyService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { JourneyRow, JourneyStepRow, JourneyStepStatus } from '../../types/database.types';
import { useToast } from '../../hooks/useToast';
import {
  CheckCircle2,
  Clock,
  Building,
  ArrowRight,
  Play,
  SkipForward,
  CheckCheck,
  AlertCircle,
  Sparkles,
  MapPin,
  Compass,
} from 'lucide-react';

export interface JourneyExecutionTrackerProps {
  appointmentId: string;
  journey?: (JourneyRow & { steps: JourneyStepRow[] }) | null;
  onRefresh?: () => void;
  canAdvance?: boolean;
}

export const JourneyExecutionTracker: React.FC<JourneyExecutionTrackerProps> = ({
  appointmentId,
  journey,
  onRefresh,
  canAdvance = true,
}) => {
  const { user } = useAuth();
  const actorId = user?.id;
  const actorRole = user?.profile?.role || 'HOSPITAL_STAFF';
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);

  const steps = (journey?.steps || []).sort((a, b) => a.step_order - b.step_order);
  const currentStepNumber = journey?.current_step || 1;
  const isJourneyCompleted = journey?.status === 'COMPLETED' || (steps.length > 0 && steps.every((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'));

  // Mutation to advance or update journey step
  const advanceMutation = useMutation({
    mutationFn: async ({ stepId, status }: { stepId: string; status: JourneyStepStatus }) => {
      setLoadingStepId(stepId);
      return journeyService.advanceStep(appointmentId, stepId, status, actorId, actorRole);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['journeys', 'appointment', appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      
      const stepName = data.updatedStep?.name || 'Step';
      if (variables.status === 'COMPLETED') {
        showSuccess('Step Completed', `${stepName} completed. Patient directed to next station.`);
      } else if (variables.status === 'IN_PROGRESS') {
        showSuccess('Step Started', `${stepName} is now in progress.`);
      } else if (variables.status === 'SKIPPED') {
        showSuccess('Step Skipped', `${stepName} marked as skipped.`);
      }
      if (onRefresh) onRefresh();
    },
    onError: (err: any) => {
      showError('Action Failed', err?.message || 'Failed to update care journey step.');
    },
    onSettled: () => {
      setLoadingStepId(null);
    },
  });

  const handleAdvance = (step: JourneyStepRow) => {
    advanceMutation.mutate({ stepId: step.id, status: 'COMPLETED' });
  };

  const handleStart = (step: JourneyStepRow) => {
    advanceMutation.mutate({ stepId: step.id, status: 'IN_PROGRESS' });
  };

  const handleSkip = (step: JourneyStepRow) => {
    advanceMutation.mutate({ stepId: step.id, status: 'SKIPPED' });
  };

  if (!journey || steps.length === 0) {
    return (
      <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
        <Compass className="w-6 h-6 mx-auto mb-2 text-slate-400" />
        <p className="font-semibold text-slate-700">Standard Direct OPD Consultation</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          No multi-stage pathway template configured for this appointment.
        </p>
      </div>
    );
  }

  // Active step object
  const activeStep = steps.find((s) => s.status === 'IN_PROGRESS') || steps.find((s) => s.step_order === currentStepNumber) || steps[0];

  return (
    <div className="space-y-4">
      {/* Current Operational Header Banner */}
      <div className={`p-4 rounded-xl border transition-all ${
        isJourneyCompleted 
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
          : 'bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border-blue-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0 ${
              isJourneyCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white'
            }`}>
              {isJourneyCompleted ? (
                <CheckCheck className="w-5 h-5" />
              ) : (
                <span className="text-sm font-mono">{activeStep?.step_order || 1}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-blue-200 text-blue-900">
                  {isJourneyCompleted ? 'Pathway Finished' : `Current Stage • Step ${activeStep?.step_order} of ${steps.length}`}
                </span>
                <Badge variant={isJourneyCompleted ? 'success' : 'default'} className="text-[10px]">
                  {journey.status}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                {isJourneyCompleted ? 'All Care Steps Completed Successfully' : activeStep?.name}
              </h4>
              {!isJourneyCompleted && activeStep && (
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span className="flex items-center gap-1 font-medium text-blue-700">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {activeStep.location}
                  </span>
                  <span>•</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Est. Duration: ~15 mins
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Operational Action Controls for Current Active Step */}
          {canAdvance && !isJourneyCompleted && activeStep && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {activeStep.status === 'PENDING' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStart(activeStep)}
                  isLoading={loadingStepId === activeStep.id}
                  className="text-xs border-blue-300 text-blue-800 hover:bg-blue-100/50"
                >
                  <Play className="w-3.5 h-3.5 mr-1 text-blue-600 fill-blue-600" />
                  Mark In Progress
                </Button>
              )}

              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAdvance(activeStep)}
                isLoading={loadingStepId === activeStep.id}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Advance Step &rarr;
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSkip(activeStep)}
                isLoading={loadingStepId === activeStep.id}
                className="text-xs text-slate-500 hover:text-slate-800"
                title="Skip this step if not required"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Complete Step-by-Step Pathway Timeline */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Care Pathway Stages ({steps.length})
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Supabase Realtime Tracked
          </span>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 my-1">
          {steps.map((step) => {
            const isDone = step.status === 'COMPLETED';
            const isInProg = step.status === 'IN_PROGRESS';
            const isSkipped = step.status === 'SKIPPED';
            const isPending = step.status === 'PENDING';
            const isLoading = loadingStepId === step.id;

            return (
              <div key={step.id} className="relative group">
                {/* Node icon marker */}
                <div
                  className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all ${
                    isDone
                      ? 'bg-emerald-500 ring-2 ring-emerald-100'
                      : isInProg
                      ? 'bg-blue-600 ring-4 ring-blue-100 animate-pulse'
                      : isSkipped
                      ? 'bg-slate-400'
                      : 'bg-slate-300'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isSkipped ? (
                    <span className="text-[9px] font-mono font-bold">-</span>
                  ) : (
                    <span className="text-[10px] font-bold">{step.step_order}</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h5
                        className={`text-xs font-bold ${
                          isInProg
                            ? 'text-blue-700'
                            : isDone
                            ? 'text-slate-800'
                            : isSkipped
                            ? 'text-slate-400 line-through'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.name}
                      </h5>

                      <span
                        className={`text-[9px] font-semibold px-2 py-0.2 rounded uppercase ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInProg
                            ? 'bg-blue-100 text-blue-800 font-bold border border-blue-200'
                            : isSkipped
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {step.location}
                      </span>
                    </div>
                  </div>

                  {/* Per-step quick action buttons for operational staff */}
                  {canAdvance && !isDone && !isSkipped && (
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      {isPending && (
                        <button
                          disabled={isLoading}
                          onClick={() => handleStart(step)}
                          className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          Start
                        </button>
                      )}
                      <button
                        disabled={isLoading}
                        onClick={() => handleAdvance(step)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors border border-blue-200"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
