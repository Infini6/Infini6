import React from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../auth/useAuth";
import { RoleBadge } from "../components/common/RoleBadge";
import { User, ShieldCheck, Mail, Building, Key, Award } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <PageContainer
      title="Hospital Staff Credentials & Profile"
      subtitle="Authorized identity credentials, active departmental role, and access rights"
    >
      <div className="max-w-3xl space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
            {user?.name.charAt(0)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              {user && <RoleBadge role={user.role} />}
            </div>
            <p className="text-xs text-slate-500 font-mono mb-2">Staff ID: {user?.staffId}</p>
            <p className="text-xs text-slate-600">
              {user?.departmentName || "Central Administration"} • {user?.hospitalName}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Assigned Operational Permissions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {user?.permissions.map((perm) => (
              <div
                key={perm}
                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-mono font-medium text-slate-800">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
