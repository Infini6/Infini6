import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { queryKeys } from '../../query/queryKeys';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DOCTOR_STATUS_CONFIG } from '../../utils/constants';
import { ArrowLeft, Stethoscope, Building, Mail, Phone, Clock, Calendar, RefreshCw } from 'lucide-react';

export const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id || '';

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: queryKeys.doctors.all(hospitalId),
    queryFn: () => apiService.getDoctors(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const doctor = doctors.find((d) => d.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="space-y-4">
        <Link to="/doctors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Doctors
          </Button>
        </Link>
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
          Doctor profile not found.
        </div>
      </div>
    );
  }

  const statusConf = DOCTOR_STATUS_CONFIG[doctor.status] || DOCTOR_STATUS_CONFIG.AVAILABLE;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/doctors">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Doctor Profile & Roster</h2>
          <p className="text-xs text-slate-500">Clinical details and OPD schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Stethoscope className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">{doctor.profile?.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{doctor.specialization}</p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
              <span className={`w-2 h-2 rounded-full ${statusConf.dot}`} />
              {statusConf.label}
            </div>

            <div className="pt-4 border-t border-slate-100 text-left space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{doctor.profile?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{doctor.profile?.phone || 'On Hospital Pager'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{doctor.department?.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Operational Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Today's OPD Shift & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 font-medium">Shift Timings</span>
                <p className="font-bold text-slate-900 text-sm mt-1">08:30 AM - 04:30 PM</p>
                <p className="text-[10px] text-slate-400">Regular OPD Duty</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Consultation Room</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{doctor.department?.location}</p>
                <p className="text-[10px] text-slate-400">{doctor.department?.floor}</p>
              </div>
            </div>

            <div className="p-4 border border-blue-100 bg-blue-50/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                <Clock className="w-4 h-4 text-blue-600" />
                Scheduled Break Periods
              </div>
              <p className="text-blue-800 text-[11px]">
                12:30 PM - 01:15 PM (Lunch Break & Inpatient Ward Rounds)
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-slate-800 mb-2">Assigned Services:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Specialized Clinical Consultation & Diagnostics</li>
                <li>Emergency Triage Escalation</li>
                <li>Care Pathway Step Review & Electronic Prescription</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
