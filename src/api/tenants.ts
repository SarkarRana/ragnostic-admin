import apiClient from "./client";

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  subdomain: string;
}

export interface UpdateTenantRequest {
  name?: string;
  status?: "active" | "inactive" | "pending";
}

export const createTenant = async (
  tenantData: CreateTenantRequest
): Promise<Tenant> => {
  const response = await apiClient.post<Tenant>("/tenants", tenantData);
  return response.data;
};

export const getTenants = async (): Promise<Tenant[]> => {
  const response = await apiClient.get<Tenant[]>("/tenants");
  return response.data.map((tenant: any) => ({
    ...tenant,
    createdAt: tenant.created_at || tenant.createdAt,
    updatedAt: tenant.updated_at || tenant.updatedAt,
  }));
};

export const getTenant = async (id: number): Promise<Tenant> => {
  const response = await apiClient.get<Tenant>(`/tenants/${id}`);
  return response.data;
};

export const updateTenant = async (
  id: number,
  tenantData: UpdateTenantRequest
): Promise<Tenant> => {
  const response = await apiClient.put<Tenant>(`/tenants/${id}`, tenantData);
  return response.data;
};

export const deleteTenant = async (id: number): Promise<void> => {
  await apiClient.delete(`/tenants/${id}`);
};
