import React, { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../auth/useAuth";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import { Settings, Sliders, Volume2, Shield, Bell, CheckCheck } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAdvanceQueue, setAutoAdvanceQueue] = useState(false);
  const [fairnessWeight, setFairnessWeight] = useState("Balanced");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    setToastMessage("Hospital operational preferences saved successfully.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <PageContainer
      title="Hospital Operational & Station Settings"
      subtitle="Tune queue prioritization weights, audio call chimes, and multi-facility parameters"
    >
      <div className="max-w-3xl space-y-6">
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

        {/* Station Audio & Chimes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span>Station Audio & Display Chimes</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Queue Call Next Audio Chime</strong>
                <span className="text-slate-500">
                  Play acoustic 2-tone chime whenever station operator calls the next patient
                </span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Doctor Absence Instant Alert</strong>
                <span className="text-slate-500">
                  Display high-priority modal whenever attending doctor marks unavailability
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Queue Optimization Engine */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Smart Queue Algorithm Weightings</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Priority vs FIFO Balancing Profile:
              </label>
              <select
                value={fairnessWeight}
                onChange={(e) => setFairnessWeight(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800"
              >
                <option value="Balanced">Balanced (Standard Outpatient Clinic Mode)</option>
                <option value="UrgentFirst">Clinical Urgency Heavy (Fast Track Critical)</option>
                <option value="StrictFIFO">Strict Chronological FIFO (No Priority Bump)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <DoubleActionButton
            onAction={handleSaveSettings}
            variant="primary"
            size="md"
            loadingText="Saving..."
          >
            Save Operational Preferences
          </DoubleActionButton>
        </div>
      </div>
    </PageContainer>
  );
};
