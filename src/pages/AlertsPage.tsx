import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { operationsApi } from "../services/journeyApi";
import { OperationalAlert } from "../types";
import { AlertSeverityBadge } from "../components/common/StatusBadge";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import { useRealtimeSubscription } from "../websocket/useRealtime";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  CheckCheck,
  Building,
  Clock,
  ArrowRight,
} from "lucide-react";

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  useRealtimeSubscription("*");

  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: operationsApi.getAlerts,
  });

  const filteredAlerts = alerts.filter((a) => {
    if (!showResolved && a.resolved) return false;
    if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
    return true;
  });

  const handleResolve = async (alertId: string) => {
    try {
      await operationsApi.resolveAlert(alertId);
      setToastMessage("Alert resolved and archived to operational incident log.");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    } catch (err: any) {
      alert(err.message || "Failed to resolve alert.");
    }
  };

  return (
    <PageContainer
      title="Hospital Operational Alerts & Incident Desk"
      subtitle="Triage critical operational warnings, queue bottlenecks, doctor absences, and emergency capacity limits"
    >
      <div className="space-y-6">
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Informational</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Show Resolved Historical Incidents</span>
          </label>
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
              ✓ No operational alerts match current filter criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border ${
                  alert.resolved
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : alert.severity === "CRITICAL"
                    ? "bg-rose-50/70 border-rose-200"
                    : alert.severity === "WARNING"
                    ? "bg-amber-50/70 border-amber-200"
                    : "bg-blue-50/70 border-blue-200"
                } shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertSeverityBadge severity={alert.severity} />
                    <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                    <span className="text-[10px] text-slate-500">• {alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700">{alert.description}</p>
                  {alert.actionRequired && (
                    <p className="text-[11px] font-semibold text-slate-900 mt-1">
                      Recommended Action: {alert.actionRequired}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.actionRoute && !alert.resolved && (
                    <Link
                      to={alert.actionRoute}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}

                  {!alert.resolved && (
                    <DoubleActionButton
                      onAction={() => handleResolve(alert.id)}
                      variant="secondary"
                      size="sm"
                      loadingText="Resolving..."
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Mark Resolved</span>
                    </DoubleActionButton>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
};
