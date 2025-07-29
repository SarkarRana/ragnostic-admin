import apiClient from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantId: number;
  role: "admin" | "user";
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    tenantId: number;
  };
}

export const login = async (
  credentials: LoginRequest
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    "/users/login",
    credentials
  );

  // Store the token in localStorage
  localStorage.setItem("authToken", response.data.token);
  localStorage.setItem("userData", JSON.stringify(response.data.user));

  return response.data;
};

export const register = async (
  userData: RegisterRequest
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    "/users/register",
    userData
  );
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userData");
};

export const getCurrentUser = (): {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantId: number;
} | null => {
  const userData = localStorage.getItem("userData");
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error("Error parsing user data", error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem("authToken") !== null;
};

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem("authToken");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    // exp is in seconds since epoch
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
};
