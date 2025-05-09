// API Base URL Configuration with better error handling and debugging
// We use different strategies based on environment:
// 1. In development: Use the proxy setup, but with better error handling
// 2. In production: Use the full backend URL

// Check if we're in development mode
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Set the base API URL
let API_BASE_URL = '/api';

// In production, we need to specify the full backend URL
if (!isDevelopment) {
  // Use the same protocol and hostname, but backend port
  API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;
}

// Debug information to help troubleshoot connection issues
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);

// Helper function to handle API errors consistently
const handleApiError = (error: any, defaultMessage: string): string => {
  console.error(`API Error: ${defaultMessage}`, error);
  
  if (error instanceof Response) {
    return `Server error: ${error.status} ${error.statusText}`;
  }
  
  return error instanceof Error ? error.message : defaultMessage;
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Search result interface with different result types
export interface SearchResultItem {
  id: string;
  title: string;
  summary?: string;
  tags: string[];
  type: 'note' | 'flashcard';
  matchScore: number;
  question?: string;  // For flashcards
  answer?: string;    // For flashcards
}

// AI model options
export type AIModel = 'bart' | 'llama';

// Flashcard interface
export interface Flashcard {
  question: string;
  answer: string;
  tags: string[];
}

// Chatbot response interface
export interface ChatbotResponse {
  tags: string[];
  flashcards: Flashcard[];
  summary: string;
  model_used: string;
}

export const api = {
  async summarize(text: string, aiModel?: AIModel): Promise<ApiResponse<{ summary: string, model_used: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, ai_model: aiModel }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to summarize text: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: handleApiError(error, 'Failed to summarize text') };
    }
  },

  async tag(text: string, aiModel?: AIModel): Promise<ApiResponse<{ tags: string[], model_used: string }>> {
    try {
      console.log('Sending tag request to:', `${API_BASE_URL}/tag`);
      const response = await fetch(`${API_BASE_URL}/tag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, ai_model: aiModel }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to tag text: ${response.status}`);
      }

      const data = await response.json();
      console.log('Tag API response:', data);
      return { data };
    } catch (error) {
      return { error: handleApiError(error, 'Failed to tag text') };
    }
  },

  async uploadFile(file: File): Promise<ApiResponse<{ text: string }>> {
    try {
      console.log('Uploading file to:', `${API_BASE_URL}/upload`);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to upload file: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: handleApiError(error, 'Failed to upload file') };
    }
  },
  
  // Global search function that searches across tags, keywords, and summaries
  async globalSearch(query: string): Promise<ApiResponse<{ results: SearchResultItem[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to perform search');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Global search API error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  // Chatbot function to generate tags, flashcards, and summary
  async chatbot(content: string, title?: string, tags?: string[], aiModel?: AIModel): 
    Promise<ApiResponse<ChatbotResponse>> {
    try {
      console.log('Sending chatbot request to:', `${API_BASE_URL}/chatbot`);
      const response = await fetch(`${API_BASE_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          title, 
          tags, 
          ai_model: aiModel 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Chatbot failed: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Chatbot API error:', error);
      return { error: handleApiError(error, 'Failed to process content with chatbot') };
    }
  },
  
  // Health check endpoint to verify API is running
  async healthCheck(): Promise<{ status: string, ai_model: string } | false> {
    try {
      console.log('Checking health at:', `${API_BASE_URL}/health`);
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        return await response.json();
      }
      return false;
    } catch (error) {
      console.error('Health check API error:', error);
      return false;
    }
  }
}; 