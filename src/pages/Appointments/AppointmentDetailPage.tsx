import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { APPOINTMENT_STATUS_CONFIG, QUEUE_STATUS_CONFIG } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatters';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Building, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  RefreshCw,
  Layers
} from 'lucide-react';
import { JourneyExecutionTracker } from '../../features/journeys/JourneyExecutionTracker';

export const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: apt, isLoading, refetch } = useQuery({
    queryKey: ['appointments', 'detail', id],
    queryFn: () => apiService.getAppointmentById(id || ''),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!apt) {
    return (
      <div className="space-y-4">
        <Link to="/appointments">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Appointments
          </Button>
        </Link>
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
          Appointment not found or not accessible under your hospital permissions.
        </div>
      </div>
    );
  }

  const statusConf = APPOINTMENT_STATUS_CONFIG[apt.status as keyof typeof APPOINTMENT_STATUS_CONFIG] || APPOINTMENT_STATUS_CONFIG.SCHEDULED;
  const qEntry = apt.queue_entry;
  const journey = apt.journey;
  const steps = journey?.steps || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/appointments">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Appointment Record
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConf.bg} ${statusConf.text}`}>
                {statusConf.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">ID: {apt.id}</p>
          </div>
        </div>

        {qEntry && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Queue Token:</span>
            <span className="px-3 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-sm tracking-wider">
              {qEntry.queue_reference}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Patient & Clinical Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Patient Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Patient Full Name</span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">{apt.patient_name || 'Verified Patient'}</p>
              </div>
              <div>
                <span className="text-slate-500">Contact Number</span>
                <p className="font-semibold text-slate-900 mt-0.5">{apt.patient_phone || '+1 (555) 000-0000'}</p>
              </div>
              <div>
                <span className="text-slate-500">Age & Gender</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {apt.patient_gender ? `${apt.patient_gender}, ${apt.patient_age} years` : 'Adult'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Appointment Date</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formatDate(apt.appointment_date)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Patient Care Journey & Realtime Interactive Execution Tracker */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Patient Care Journey (Smart Navigation Workflow)
            </h3>
            <JourneyExecutionTracker
              appointmentId={apt.id}
              journey={journey}
              onRefresh={refetch}
            />
          </div>
        </div>

        {/* Right 1 Col: Slot & Assignment Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Schedule & Arrival
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500">Consultation Slot</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {formatTime(apt.expected_start)} - {formatTime(apt.expected_end)}
                </p>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <span className="text-blue-700 font-medium">Recommended Arrival Time</span>
                <p className="font-bold text-blue-900 mt-0.5">
                  {formatTime(apt.recommended_arrival)}
                </p>
                <p className="text-[10px] text-blue-600 mt-1">Allows 15 mins for vitals check-in.</p>
              </div>

              <div>
                <span className="text-slate-500">Department</span>
                <p className="font-semibold text-slate-800 mt-0.5">{apt.department?.name}</p>
                <p className="text-[11px] text-slate-500">{apt.department?.location}</p>
              </div>

              <div>
                <span className="text-slate-500">Consulting Doctor</span>
                <p className="font-semibold text-slate-800 mt-0.5">{apt.doctor?.profile?.name || 'On Duty Physician'}</p>
                <p className="text-[11px] text-slate-500">{apt.doctor?.specialization}</p>
              </div>

              <div>
                <span className="text-slate-500">Clinical Service</span>
                <p className="font-semibold text-slate-800 mt-0.5">{apt.service?.name}</p>
                <p className="text-[11px] text-slate-500">{apt.service?.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
