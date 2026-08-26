export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "/api/v1";
  }

  private getAuthToken(): string | null {
    try {
      const stored = localStorage.getItem("smart_hospital_staff_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.token || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getHospitalId(): string {
    return localStorage.getItem("smart_hospital_active_id") || "hosp-001";
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const hospitalId = this.getHospitalId();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Hospital-Id": hospitalId,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const error: ApiError = {
          status: response.status,
          message: errorData.message || this.getDefaultErrorMessage(response.status),
          code: errorData.code,
          details: errorData.details,
        };

        if (response.status === 401) {
          // Token expired or invalid
          window.dispatchEvent(new CustomEvent("hospital-auth-expired"));
        }

        throw error;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.status) {
        throw err;
      }
      // Network or connection error
      throw {
        status: 0,
        message: "Unable to connect to hospital operations backend. Please check network connection.",
      } as ApiError;
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }
    return this.request<T>(url, { method: "GET" });
  }

  public post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return "Invalid request data.";
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have authorization to perform this clinical operation.";
      case 404:
        return "The requested record or resource was not found.";
      case 409:
        return "Operational conflict: this appointment or queue entry has been modified by another staff member.";
      case 422:
        return "Validation failed on hospital backend.";
      case 429:
        return "Too many requests. Please pause before sending another queue update.";
      case 500:
        return "Hospital backend server encountered an error. Please try again.";
      case 503:
        return "Hospital service is temporarily undergoing scheduled maintenance.";
      default:
        return "An unexpected error occurred.";
    }
  }
}

export const apiClient = new ApiClient();
