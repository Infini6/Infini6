import React, { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentApi, serviceApi } from "../services/hospitalApi";
import {
  FileCheck2,
  GitMerge,
  Plus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

export const JourneyConfigPage: React.FC = () => {
  const [selectedServiceId, setSelectedServiceId] = useState("svc-card-01");

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => serviceApi.getServices(),
  });

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const defaultTemplates = [
    {
      id: "tmpl-1",
      name: "Outpatient General Consultation Standard Flow",
      steps: [
        { order: 1, name: "Arrival & Kiosk Check-In", est: 5, room: "Ground Lobby Kiosk" },
        { order: 2, name: "Nurse Station Vitals & Triage", est: 10, room: "Triage Station 2" },
        { order: 3, name: "Doctor Clinical Examination", est: 20, room: "Consultation Suite 204" },
        { order: 4, name: "Pharmacy & Medication Dispense", est: 15, room: "Outpatient Pharmacy" },
      ],
    },
    {
      id: "tmpl-2",
      name: "Specialized Cardiology Diagnostic Pathway",
      steps: [
        { order: 1, name: "Arrival & Kiosk Check-In", est: 5, room: "Kiosk 1" },
        { order: 2, name: "ECG & Vital Measurement", est: 15, room: "ECG Lab 202" },
        { order: 3, name: "Cardiologist Consultation", est: 25, room: "Room 204" },
        { order: 4, name: "Echocardiogram (if indicated)", est: 30, room: "Echo Suite 206" },
        { order: 5, name: "Discharge & Prescription", est: 10, room: "Discharge Desk" },
      ],
    },
  ];

  return (
    <PageContainer
      title="Patient Journey Workflow Templates"
      subtitle="Standardize clinical pathways, mandatory check-in steps, and diagnostic sequences for each medical specialty"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-700">Select Clinical Service Pathway:</span>
          <select
            value={selectedService?.id || ""}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.departmentName})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {defaultTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{tmpl.name}</h3>
                  <span className="text-xs text-slate-500">Auto-instantiated upon check-in</span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {tmpl.steps.length} Steps
                </span>
              </div>

              <div className="space-y-2">
                {tmpl.steps.map((st) => (
                  <div
                    key={st.order}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {st.order}
                      </span>
                      <div>
                        <strong className="text-slate-900">{st.name}</strong>
                        <p className="text-[11px] text-slate-500">{st.room}</p>
                      </div>
                    </div>
                    <span className="text-slate-600 font-mono text-[11px]">~{st.est} min</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Expected Turnaround: ~60 min</span>
                <button className="text-blue-600 font-semibold hover:underline">
                  Customize Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
