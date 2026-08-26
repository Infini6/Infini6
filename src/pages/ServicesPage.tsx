import React, { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceApi, departmentApi } from "../services/hospitalApi";
import { Service } from "../types";
import { DoubleActionButton } from "../components/common/DoubleActionButton";
import {
  Layers,
  Clock,
  Building,
  CheckCheck,
  Edit2,
  FileText,
} from "lucide-react";

export const ServicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["services", selectedDept],
    queryFn: () =>
      serviceApi.getServices(selectedDept !== "ALL" ? selectedDept : undefined),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.getDepartments(),
  });

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await serviceApi.updateService(editingService.id, editingService);
      setToastMessage(`Updated clinical service ${editingService.name}.`);
      setEditingService(null);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (err: any) {
      alert(err.message || "Failed to update service.");
    }
  };

  return (
    <PageContainer
      title="Clinical Service Catalog"
      subtitle="Standardized medical procedures, consultation durations, requirements, and tariff schedule"
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-700">Filter by Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{svc.name}</h3>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {svc.code}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {svc.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">{svc.description}</p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <strong className="text-slate-800">{svc.departmentName}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Duration Standard:</span>
                    <strong className="text-blue-700">{svc.expectedDurationMinutes} minutes</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Requires Imaging/Lab:</span>
                    <span>{svc.requiresScan || svc.requiresLab ? "Yes" : "None"}</span>
                  </p>
                  {svc.preparationInstructions && (
                    <div className="pt-1 text-[11px] text-slate-500">
                      <strong>Prep:</strong> {svc.preparationInstructions}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setEditingService(svc)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Parameters</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Edit Service Parameters
            </h3>
            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Service Name</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Standard Expected Duration (min)</label>
                <input
                  type="number"
                  value={editingService.expectedDurationMinutes}
                  onChange={(e) => setEditingService({ ...editingService, expectedDurationMinutes: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Preparation Instructions</label>
                <input
                  type="text"
                  value={editingService.preparationInstructions || ""}
                  onChange={(e) => setEditingService({ ...editingService, preparationInstructions: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
