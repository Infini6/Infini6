import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { StaffUser, StaffRole, Permission } from "../types";
import { LoginCredentials } from "./authTypes";
import { MOCK_STAFF_USERS } from "./mockStaff";
import { useQueryClient } from "@tanstack/react-query";
import { socketClient } from "../websocket/socket";

const AUTH_STORAGE_KEY = "smart_hospital_staff_auth";
const HOSPITAL_STORAGE_KEY = "smart_hospital_active_id";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentHospitalId, setCurrentHospitalId] = useState<string>(() => {
    return localStorage.getItem(HOSPITAL_STORAGE_KEY) || "hosp-001";
  });

  const queryClient = useQueryClient();

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user && parsed?.token) {
          setUser(parsed.user);
          setToken(parsed.token);
          socketClient.connect(parsed.token, parsed.user.hospitalId);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<StaffUser> => {
    setIsLoading(true);
    try {
      // Simulate API latency & validation
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Find staff by email or staffId, or fallback
      const found = MOCK_STAFF_USERS.find(
        (u) =>
          u.email.toLowerCase() === credentials.identifier.toLowerCase() ||
          u.staffId.toLowerCase() === credentials.identifier.toLowerCase()
      ) || MOCK_STAFF_USERS[0];

      const authUser: StaffUser = credentials.roleOverride
        ? {
            ...found,
            role: credentials.roleOverride,
            permissions: getPermissionsForRole(credentials.roleOverride),
          }
        : found;

      const generatedToken = `jwt-staff-${Date.now()}-${authUser.id}`;
      setUser(authUser);
      setToken(generatedToken);
      setCurrentHospitalId(authUser.hospitalId);

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: authUser, token: generatedToken })
      );
      localStorage.setItem(HOSPITAL_STORAGE_KEY, authUser.hospitalId);

      // Connect authenticated realtime socket
      socketClient.connect(generatedToken, authUser.hospitalId);

      return authUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Clear state
      setUser(null);
      setToken(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      
      // 2. Disconnect Realtime socket
      socketClient.disconnect();

      // 3. Invalidate/clear TanStack Query caches to prevent data leakage
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  const setHospitalId = useCallback((hospId: string) => {
    setCurrentHospitalId(hospId);
    localStorage.setItem(HOSPITAL_STORAGE_KEY, hospId);
    if (user) {
      setUser((prev) => prev ? { ...prev, hospitalId: hospId } : null);
    }
  }, [user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === "HOSPITAL_ADMIN") return true;
    return user.permissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((roles: StaffRole | StaffRole[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        token,
        login,
        logout,
        hasPermission,
        hasRole,
        currentHospitalId,
        setHospitalId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function getPermissionsForRole(role: StaffRole): Permission[] {
  switch (role) {
    case "HOSPITAL_ADMIN":
      return [
        "APPOINTMENT_VIEW",
        "APPOINTMENT_MANAGE",
        "QUEUE_VIEW",
        "QUEUE_MANAGE",
        "DOCTOR_VIEW",
        "DOCTOR_MANAGE",
        "PATIENT_VIEW",
        "HOSPITAL_MANAGE",
        "ANALYTICS_VIEW",
        "NAVIGATION_MANAGE",
        "JOURNEY_CONFIG",
      ];
    case "DOCTOR":
      return [
        "APPOINTMENT_VIEW",
        "QUEUE_VIEW",
        "QUEUE_MANAGE",
        "PATIENT_VIEW",
        "DOCTOR_VIEW",
      ];
    case "RECEPTION_STAFF":
      return [
        "APPOINTMENT_VIEW",
        "APPOINTMENT_MANAGE",
        "QUEUE_VIEW",
        "QUEUE_MANAGE",
        "PATIENT_VIEW",
      ];
    case "QUEUE_OPERATOR":
      return [
        "QUEUE_VIEW",
        "QUEUE_MANAGE",
        "APPOINTMENT_VIEW",
        "PATIENT_VIEW",
      ];
    case "DEPARTMENT_STAFF":
    default:
      return ["QUEUE_VIEW", "APPOINTMENT_VIEW", "PATIENT_VIEW"];
  }
}
