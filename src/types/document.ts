export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "processed"
  | "embedded"
  | "in_use"
  | "error";

export interface Document {
  id: number;
  name: string;
  status: DocumentStatus;
  createdAt: string; // Use camelCase for consistency
  updatedAt: string;
}

export interface RAGResponse {
  answer: string;
  sources: string[];
}
