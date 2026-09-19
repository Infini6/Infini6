import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { HospitalLayout } from '../layouts/HospitalLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Pages
import { LoginPage } from '../pages/Auth/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { QueuePage } from '../pages/Queue/QueuePage';
import { LiveQueueBoardPage } from '../pages/Queue/LiveQueueBoardPage';
import { AppointmentsPage } from '../pages/Appointments/AppointmentsPage';
import { AppointmentDetailPage } from '../pages/Appointments/AppointmentDetailPage';
import { DoctorsPage } from '../pages/Doctors/DoctorsPage';
import { DoctorDetailPage } from '../pages/Doctors/DoctorDetailPage';
import { DepartmentsPage } from '../pages/Departments/DepartmentsPage';
import { DepartmentDetailPage } from '../pages/Departments/DepartmentDetailPage';
import { ServicesPage } from '../pages/Services/ServicesPage';
import { NavigationPage } from '../pages/Navigation/NavigationPage';
import { JourneyConfigPage } from '../pages/JourneyConfig/JourneyConfigPage';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { NotificationsPage } from '../pages/Notifications/NotificationsPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';
import { SettingsPage } from '../pages/Settings/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Standalone Live TV / Kiosk Display Board */}
      <Route element={<ProtectedRoute />}>
        <Route path="/queue/live" element={<LiveQueueBoardPage />} />
      </Route>

      {/* Authenticated Hospital Portal Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<HospitalLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/doctors/:id" element={<DoctorDetailPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/departments/:id" element={<DepartmentDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          
          {/* Admin & Staff Routes */}
          <Route
            element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'HOSPITAL_STAFF']} />}
          >
            <Route path="/journey-config" element={<JourneyConfigPage />} />
          </Route>

          {/* Admin Only Routes */}
          <Route
            element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']} />}
          >
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
