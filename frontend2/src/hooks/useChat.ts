import { useState, useCallback } from 'react';
import { Message, ChatRequest } from '../types/chat';
import { chatAPI } from '../services/api';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, useAgent: boolean = false) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Add loading assistant message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      const request: ChatRequest = {
        query: content.trim(),
        user_id: 'frontend-user',
        use_agent: useAgent,
      };

      const response = await chatAPI.sendMessage(request);

      // Replace loading message with actual response
      const assistantMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: response.answer,
        sourceDocuments: response.source_documents || undefined,
        timestamp: new Date(),
        isLoading: false,
      };

      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id ? assistantMessage : msg
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to send message');
      
      // Remove loading message on error
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};