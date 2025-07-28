export * from "./document";

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt: string;
}

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

export interface ChatSession {
  id: number;
  name: string;
  tenantId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  role: "user" | "assistant";
  sessionId: number;
  createdAt: string;
}
