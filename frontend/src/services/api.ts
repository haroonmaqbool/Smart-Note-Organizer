// API Base URL Configuration with better error handling and debugging
// We use different strategies based on environment:
// 1. In development: Use the proxy setup, but with better error handling
// 2. In production: Use the full backend URL

// Get environment variable - since TypeScript definitions for import.meta.env can be problematic,
// we'll use a simpler approach for this project
let envApiBaseUrl: string | undefined;
try {
  // @ts-ignore - Vite specific property
  envApiBaseUrl = import.meta.env?.VITE_API_BASE_URL;
} catch (e) {
  console.warn('Could not access import.meta.env', e);
}

// Check if we're in development mode
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// FIXME: Explicitly set the backend URL for development
export let API_BASE_URL = 'http://localhost:8000/api';

// Debug information to help troubleshoot connection issues
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using ${envApiBaseUrl ? 'environment variable' : 'direct URL'} for API URL`);

// Global connectivity state
export let isConnected = false;

// Flag to enable mock mode when backend is unavailable
export let mockModeEnabled = false;

// Sample mock data to use when backend is unavailable
const MOCK_DATA = {
  notes: [
    {
      id: "1",
      title: "Machine Learning Basics",
      content: "<p>Introduction to machine learning concepts including supervised and unsupervised learning.</p>",
      summary: "An overview of fundamental machine learning concepts and approaches.",
      tags: ["ML", "AI", "data science"],
      created_at: "2023-10-15T14:30:00.000Z",
      updated_at: "2023-10-15T15:45:00.000Z"
    },
    {
      id: "2",
      title: "Python Programming Tips",
      content: "<p>Useful Python programming techniques and best practices.</p>",
      summary: "A collection of advanced Python tips for better code quality.",
      tags: ["Python", "programming", "tips"],
      created_at: "2023-10-16T10:15:00.000Z",
      updated_at: "2023-10-16T11:30:00.000Z"
    }
  ],
  flashcards: [
    {
      id: "1",
      title: "Machine Learning",
      question: "What is supervised learning?",
      answer: "A type of machine learning where the model is trained on labeled data and learns to predict outputs based on inputs.",
      tags: ["ML", "AI"],
      created_at: "2023-10-15T16:00:00.000Z"
    },
    {
      id: "2",
      title: "Python",
      question: "What are list comprehensions in Python?",
      answer: "A concise way to create lists based on existing lists or iterables. Example: [x*2 for x in range(10)]",
      tags: ["Python", "programming"],
      created_at: "2023-10-16T12:00:00.000Z"
    }
  ]
};

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
export type AIModel = 'llama' | 'rule-based';

// Flashcard interface
export interface Flashcard {
  question: string;
  answer: string;
  tags: string[];
}

// OCR extracted flashcard interface
export interface ExtractedFlashcard {
  term: string;
  definition: string;
}

// Chatbot response interface
export interface ChatbotResponse {
  tags: string[];
  flashcards: Flashcard[];
  summary: string;
  model_used: string;
}

export const api = {
  // Enable mock mode when backend is unavailable
  enableMockMode() {
    mockModeEnabled = true;
    console.warn('API mock mode enabled - using simulated data');
  },
  
  // Disable mock mode
  disableMockMode() {
    mockModeEnabled = false;
    console.log('API mock mode disabled - using real backend');
  },
  
  // Check if mock mode is enabled
  isMockModeEnabled() {
    return mockModeEnabled;
  },
  
  // Check connectivity with the backend
  async checkConnection(): Promise<boolean> {
    try {
      console.log('Checking backend connectivity at:', `${API_BASE_URL}/ping/`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 second timeout
      
      const response = await fetch(`${API_BASE_URL}/ping/`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }).catch(error => {
        console.error('Fetch error during connectivity check:', error);
        return null; // Return null to indicate a network error
      });
      
      clearTimeout(timeoutId);
      
      if (response && response.ok) {
        const data = await response.json();
        isConnected = data.status === 'ok';
        console.log('Backend connectivity check result:', isConnected ? 'Connected' : 'Disconnected');
        
        // Disable mock mode if we're connected
        if (isConnected) {
          this.disableMockMode();
        }
        
        return isConnected;
      }
      
      console.warn('Backend connectivity check failed: server returned error or not found');
      isConnected = false;
      return false;
    } catch (error) {
      console.error('Backend connectivity check failed:', error);
      isConnected = false;
      return false;
    }
  },

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
  async healthCheck(): Promise<{ status: string, ai_model?: string, message?: string } | false> {
    try {
      console.log('Checking health at:', `${API_BASE_URL}/health/`);
      const response = await fetch(`${API_BASE_URL}/health/`, {
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
  },

  // OCR function to extract text from images
  async extractTextFromImage(imageFile: File): Promise<ApiResponse<{ text: string }>> {
    try {
      console.log('Extracting text from image:', imageFile.name);
      
      // For images, use the uploadFile endpoint but specify it's for OCR
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('ocr', 'true');

      const response = await fetch(`${API_BASE_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to extract text: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return { error: handleApiError(error, 'Failed to extract text from image') };
    }
  },

  // Generate flashcards from extracted text using the AI model
  async generateFlashcardsFromText(text: string, title?: string, aiModel?: AIModel): 
    Promise<ApiResponse<{ flashcards: Flashcard[] }>> {
    try {
      console.log('Generating flashcards from extracted text');
      const response = await fetch(`${API_BASE_URL}/generate-flashcards/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          title,
          ai_model: aiModel 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate flashcards: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Flashcard generation error:', error);
      return { error: handleApiError(error, 'Failed to generate flashcards from text') };
    }
  }
}; 