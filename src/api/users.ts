import apiClient from "./client";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user";
  tenantId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: "admin" | "user";
}

export const getUsers = async (tenantId?: number): Promise<User[]> => {
  const params = tenantId ? { tenantId } : {};
  const response = await apiClient.get<User[]>("/users", { params });
  return response.data.map((user: any) => ({
    ...user,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt,
  }));
};

export const getUser = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
};

export const updateUser = async (
  id: number,
  userData: UpdateUserRequest
): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
