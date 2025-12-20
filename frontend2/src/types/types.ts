export type Role = "user" | "assistant";

export interface Source {
  id: string;
  title: string;
  page: number;
  url?: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;          // ISO string
  regenerated?: boolean;
  sources?: Source[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}
