import { StaffUser, StaffRole, Permission } from "../types";

export interface LoginCredentials {
  identifier: string; // email or staff ID
  password: string;
  hospitalId?: string;
  roleOverride?: StaffRole; // For demo/sandbox rapid switching
}

export interface AuthResponse {
  user: StaffUser;
  token: string;
  expiresIn: number;
}

export interface AuthContextType {
  user: StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<StaffUser>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: StaffRole | StaffRole[]) => boolean;
  currentHospitalId: string;
  setHospitalId: (hospitalId: string) => void;
}
