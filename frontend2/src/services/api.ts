// // src/services/api.ts
// import axios from "axios";
// import type { ChatRequest, ChatResponse } from "../types/chat";

// // Use environment variable or default to your AKS IP
// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://135.237.1.189";

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   timeout: 30000, // 30 seconds
// });

// export const chatAPI = {
//   sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
//     const response = await apiClient.post<ChatResponse>("/api/chat/", request);
//     return response.data;
//   },

//   checkHealth: async (): Promise<{ status: string; env: string }> => {
//     const response = await apiClient.get("/health");
//     return response.data;
//   },

//   reindexDocuments: async (): Promise<{ status: string }> => {
//     const response = await apiClient.post("/api/docs/reindex");
//     return response.data;
//   },
// };

// export default apiClient;

// src/services/api.ts
import axios from "axios";
import type { ChatRequest, ChatResponse } from "../types/chat";

// Use environment variable or default to relative path for ingress
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

export const chatAPI = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>("/api/chat/", request);
    return response.data;
  },

  checkHealth: async (): Promise<{ status: string; env: string }> => {
    const response = await apiClient.get("/api/health");
    return response.data;
  },

  reindexDocuments: async (): Promise<{ status: string }> => {
    const response = await apiClient.post("/api/docs/reindex");
    return response.data;
  },
};

export default apiClient;
