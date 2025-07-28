import apiClient from "./client";
import { jwtDecode } from "jwt-decode";

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

interface DecodedToken {
  exp: number;
  sub: string;
  [key: string]: any;
}

export const login = async (
  credentials: LoginRequest
): Promise<AuthResponse> => {
  // Use 'unknown' type for the response as we need to handle different formats
  interface BackendResponse {
    token: string;
    user: {
      id: number;
      name?: string;
      firstName?: string;
      lastName?: string;
      email: string;
      role: string;
      tenantId: number;
      [key: string]: unknown;
    };
  }

  const response = await apiClient.post<BackendResponse>(
    "/users/login",
    credentials
  );

  // Handle potential name field from backend instead of firstName/lastName
  const userData = { ...response.data.user };
  if (userData.name && !userData.firstName) {
    // Backend is returning 'name' instead of firstName/lastName
    // Split the name field as a temporary workaround
    const nameParts = userData.name.split(' ');
    userData.firstName = nameParts[0] || '';
    userData.lastName = nameParts.slice(1).join(' ') || '';
    delete userData.name; // Remove the name property
  }

  // Create a properly typed user object
  const user: AuthResponse['user'] = {
    id: userData.id,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email,
    role: userData.role,
    tenantId: userData.tenantId
  };

  // Store the token in localStorage
  localStorage.setItem("authToken", response.data.token);
  localStorage.setItem("userData", JSON.stringify(user));

  return {
    token: response.data.token,
    user
  };
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
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    return decoded.exp > currentTime;
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
};
