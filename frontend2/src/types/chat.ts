export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceDocuments?: SourceDocument[];
  timestamp: Date;
  isLoading?: boolean;
}

export interface SourceDocument {
  metadata: {
    source: string;
    page?: number;
    page_label?: string;
    [key: string]: any;
  };
  content: string;
}

export interface ChatRequest {
  query: string;
  user_id?: string;
  use_agent?: boolean;
}

export interface ChatResponse {
  answer: string;
  source_documents?: SourceDocument[];
  retrieval_scores?: number[] | null;
  trace_id?: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}