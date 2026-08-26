import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { journeyApi } from "../services/journeyApi";
import { PatientJourney, JourneyStep } from "../types";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import { useRealtimeSubscription } from "../websocket/useRealtime";
import {
  GitMerge,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  User,
  Building,
  Navigation,
  CheckCheck,
} from "lucide-react";

export const PatientJourneyPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useRealtimeSubscription("*");

  const [selectedAptId, setSelectedAptId] = useState<string>(appointmentId || "apt-101");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: journeys = [], isLoading } = useQuery({
    queryKey: ["journeys"],
    queryFn: () => journeyApi.getAllActiveJourneys(),
  });

  const activeJourney = journeys.find((j) => j.appointmentId === selectedAptId) || journeys[0];

  const handleAdvanceStep = async (stepIndex: number) => {
    if (!activeJourney) return;
    try {
      await journeyApi.advanceJourneyStep(activeJourney.appointmentId, stepIndex, "COMPLETED");
      setToastMessage("Journey step marked completed! Next waypoint activated.");
      queryClient.invalidateQueries({ queryKey: ["journeys"] });
      queryClient.invalidateQueries({ queryKey: ["journey", selectedAptId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    } catch (err: any) {
      alert(err.message || "Failed to advance step.");
    }
  };

  return (
    <PageContainer
      title="Patient Multi-Step Journey & Navigation Flow"
      subtitle="Track patient progression through check-in, triage, clinical rooms, diagnostic labs, and discharge"
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

        {/* Patient Journey Selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-700">Active Patient Journey:</span>
            <select
              value={activeJourney?.appointmentId || ""}
              onChange={(e) => {
                setSelectedAptId(e.target.value);
                navigate(`/journey/${e.target.value}`);
              }}
              className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-900"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.appointmentId}>
                  {j.patientName} (MRN: {j.patientMrn}) - {j.status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Total Active Journeys: <strong>{journeys.length}</strong>
            </span>
          </div>
        </div>

        {activeJourney ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* JOURNEY STEP TIMELINE */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {activeJourney.patientName}
                    </h3>
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      MRN: {activeJourney.patientMrn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Service: {activeJourney.serviceName} • Location: {activeJourney.currentLocation}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                    {activeJourney.status}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Next: {activeJourney.nextDestination}
                  </p>
                </div>
              </div>

              {/* Step Sequence Cards */}
              <div className="space-y-4 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {activeJourney.steps.map((step, index) => {
                  const isCompleted = step.status === "COMPLETED";
                  const isCurrent = step.status === "IN_PROGRESS";

                  return (
                    <div
                      key={step.id}
                      className={`relative pl-10 transition ${
                        isCurrent ? "scale-[1.01]" : ""
                      }`}
                    >
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute left-2.5 top-3 w-4 h-4 rounded-full border-2 transform -translate-x-1/2 flex items-center justify-center text-[9px] font-bold ${
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : isCurrent
                            ? "bg-blue-600 border-blue-600 text-white animate-pulse"
                            : "bg-white border-slate-300 text-slate-500"
                        }`}
                      >
                        {isCompleted ? "✓" : step.order}
                      </div>

                      <div
                        className={`p-4 rounded-xl border ${
                          isCompleted
                            ? "bg-emerald-50/40 border-emerald-200 text-slate-800"
                            : isCurrent
                            ? "bg-blue-50/70 border-blue-300 text-slate-900 shadow-xs ring-2 ring-blue-500/20"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">
                              {step.order}. {step.name}
                            </h4>
                            <span className="text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                              {step.roomNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isCurrent
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                        </div>

                        {step.notes && (
                          <p className="text-xs text-slate-600 mb-3 bg-white/60 p-2 rounded border border-slate-200/60">
                            <strong>Patient Navigation Cue:</strong> {step.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                          <span className="text-[11px] text-slate-500">
                            {isCompleted
                              ? `Completed at ${step.completedAt}`
                              : isCurrent
                              ? `Currently active at ${step.location}`
                              : "Awaiting preceding step completion"}
                          </span>

                          {isCurrent && (
                            <DoubleActionButton
                              onAction={() => handleAdvanceStep(index)}
                              variant="success"
                              size="sm"
                              loadingText="Advancing..."
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              <span>Complete & Advance to Step {step.order + 1}</span>
                            </DoubleActionButton>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Turn-by-Turn Guidance Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span>Hospital Waypoint Guidance</span>
                </h3>

                <div className="space-y-3 mt-3 text-xs">
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">
                      Active Navigation Target
                    </span>
                    <p className="text-sm font-bold">
                      {activeJourney.steps.find((s) => s.status === "IN_PROGRESS")?.name ||
                        "Proceed to Main Exit"}
                    </p>
                    <p className="text-xs text-slate-300">
                      Destination Room:{" "}
                      <strong>
                        {activeJourney.steps.find((s) => s.status === "IN_PROGRESS")?.roomNumber ||
                          "Lobby"}
                      </strong>
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-blue-950">
                    <h5 className="font-bold text-xs">Patient Turn-by-Turn Path</h5>
                    <ol className="list-decimal list-inside text-xs space-y-1 text-blue-900">
                      <li>Enter through Outpatient Main Lobby</li>
                      <li>Take Elevator B to 2nd Floor</li>
                      <li>Turn right towards Suite 204</li>
                      <li>Check in at Consultation Counter 3</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link
                  to="/navigation"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Configure Hospital Navigation Nodes</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            No patient journeys found in the current system.
          </div>
        )}
      </div>
    </PageContainer>
  );
};
