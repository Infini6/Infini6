import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { RoleBadge } from '../../components/layout/RoleBadge';
import { User, Building, Mail, Phone, ShieldCheck, KeyRound } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Account & Credentials</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Your authenticated identity, assigned hospital tenant, and security role in the healthcare network.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-200">
              {user?.profile?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <CardTitle>{user?.profile?.name}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <RoleBadge role={user?.profile?.role} />
                <span className="text-xs text-slate-500">ID: {user?.id}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Official Email
              </span>
              <p className="font-semibold text-slate-900">{user?.email}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Contact
              </span>
              <p className="font-semibold text-slate-900">{user?.profile?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 font-bold text-blue-950 text-xs mb-1">
              <Building className="w-4 h-4 text-blue-600" />
              Assigned Hospital Facility
            </div>
            <p className="font-semibold text-blue-900 text-sm">{user?.hospital?.name}</p>
            <p className="text-[11px] text-blue-700 mt-0.5">{user?.hospital?.address}</p>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Supabase Row Level Security Enforcement
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Your session is cryptographically bound to Hospital ID{' '}
              <code className="font-mono font-bold">{user?.hospital?.id}</code>. Database RLS rules
              strictly prevent queries from accessing or modifying records belonging to any other hospital.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
