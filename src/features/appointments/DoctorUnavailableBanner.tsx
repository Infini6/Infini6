import React from 'react';
import { AlertTriangle, Clock, RefreshCw, ChevronRight, CheckCircle2, UserX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DoctorDisruptionIncident } from '../../types/disruption.types';

export interface DoctorUnavailableBannerProps {
  incidents: DoctorDisruptionIncident[];
  pendingCount: number;
  resolvedCount: number;
  onOpenResolution: (incident?: DoctorDisruptionIncident) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DoctorUnavailableBanner: React.FC<DoctorUnavailableBannerProps> = ({
  incidents,
  pendingCount,
  resolvedCount,
  onOpenResolution,
  onRefresh,
  isRefreshing = false,
}) => {
  if (incidents.length === 0 && pendingCount === 0 && resolvedCount === 0) {
    return null;
  }

  // If all disruptions are resolved
  if (pendingCount === 0 && resolvedCount > 0) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-emerald-900">
                  Doctor Disruption Fully Resolved
                </h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Resolved: {resolvedCount}
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                All affected patient appointments have been successfully reassigned with zero schedule conflicts.
              </p>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isRefreshing}
              className="text-emerald-800 border-emerald-300 hover:bg-emerald-100 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Check Status
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Active Pending Disruptions
  const doctorNames = incidents.map((i) => `Dr. ${i.doctor.profile?.name || 'Physician'}`).join(', ');
  const firstIncident = incidents[0];

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 sm:p-5 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="relative p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                Action Required
              </span>
              <h3 className="text-base font-bold text-amber-950">
                Doctor Unavailable Alert
              </h3>
              {/* Prominent Pending vs Resolved Banner Metric */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  Pending: {pendingCount}
                </span>
                <span className="text-slate-400">•</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Resolved: {resolvedCount}
                </span>
              </div>
            </div>

            <p className="text-sm text-amber-900 leading-snug">
              <span className="font-semibold text-amber-950">{doctorNames}</span> is currently unavailable
              {firstIncident?.unavailablePeriod ? ` (${firstIncident.unavailablePeriod})` : ''}.
              {' '}{pendingCount} scheduled appointment{pendingCount === 1 ? '' : 's'} require immediate reassignment or rescheduling.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-amber-800/90 pt-0.5">
              <span className="inline-flex items-center gap-1">
                <UserX className="w-3.5 h-3.5 text-amber-700" />
                {incidents.length} Doctor{incidents.length === 1 ? '' : 's'} Affected
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Backend alternatives calculated & verified
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isRefreshing}
              className="bg-white/80 border-amber-300 text-amber-900 hover:bg-amber-100/60"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenResolution(firstIncident)}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm border-amber-700"
          >
            <span>Resolve Disruptions</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
