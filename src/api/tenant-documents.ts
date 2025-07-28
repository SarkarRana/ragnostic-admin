import apiClient from "./client";

export interface TenantDocument {
  id: number;
  filename: string;
  fileSize: number;
  fileType: string;
  tenantId: number;
  status: "uploaded" | "processed" | "error";
  createdAt: string;
  updatedAt: string;
}

export const uploadDocument = async (
  file: File,
  tenantId: number
): Promise<TenantDocument> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenantId", tenantId.toString());

  const response = await apiClient.post<TenantDocument>(
    "/tenant-documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getTenantDocuments = async (
  tenantId: number
): Promise<TenantDocument[]> => {
  const response = await apiClient.get<TenantDocument[]>(`/tenant-documents`, {
    params: { tenantId },
  });

  return response.data.map((doc: any) => ({
    ...doc,
    createdAt: doc.created_at || doc.createdAt,
    updatedAt: doc.updated_at || doc.updatedAt,
  }));
};

export const getTenantDocument = async (
  id: number
): Promise<TenantDocument> => {
  const response = await apiClient.get<TenantDocument>(
    `/tenant-documents/${id}`
  );
  return response.data;
};

export const downloadDocument = async (id: number): Promise<Blob> => {
  const response = await apiClient.get<Blob>(
    `/tenant-documents/${id}/download`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};

export const deleteTenantDocument = async (id: number): Promise<void> => {
  await apiClient.delete(`/tenant-documents/${id}`);
};
