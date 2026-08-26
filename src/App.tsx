import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { QueuePage } from "./pages/QueuePage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { AppointmentDetailPage } from "./pages/AppointmentDetailPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { PatientJourneyPage } from "./pages/PatientJourneyPage";
import { NavigationConfigPage } from "./pages/NavigationConfigPage";
import { JourneyConfigPage } from "./pages/JourneyConfigPage";
import { OperationsPage } from "./pages/OperationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/queue"
              element={
                <ProtectedRoute requiredPermission="QUEUE_VIEW">
                  <QueuePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments"
              element={
                <ProtectedRoute requiredPermission="APPOINTMENT_VIEW">
                  <AppointmentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments/:id"
              element={
                <ProtectedRoute requiredPermission="APPOINTMENT_VIEW">
                  <AppointmentDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctors"
              element={
                <ProtectedRoute requiredPermission="DOCTOR_VIEW">
                  <DoctorsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute requiredPermission="HOSPITAL_MANAGE">
                  <DepartmentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/services"
              element={
                <ProtectedRoute requiredPermission="HOSPITAL_MANAGE">
                  <ServicesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/journey"
              element={
                <ProtectedRoute requiredPermission="PATIENT_VIEW">
                  <PatientJourneyPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/journey/:appointmentId"
              element={
                <ProtectedRoute requiredPermission="PATIENT_VIEW">
                  <PatientJourneyPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/navigation"
              element={
                <ProtectedRoute requiredPermission="NAVIGATION_MANAGE">
                  <NavigationConfigPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/journey-config"
              element={
                <ProtectedRoute requiredRole="HOSPITAL_ADMIN">
                  <JourneyConfigPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/operations"
              element={
                <ProtectedRoute requiredPermission="QUEUE_VIEW">
                  <OperationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredPermission="ANALYTICS_VIEW">
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
