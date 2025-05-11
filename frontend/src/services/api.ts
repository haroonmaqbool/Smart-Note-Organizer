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

// OpenRouter API Key
const OPENROUTER_API_KEY = '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';

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

// Search result interface for local search
export interface SearchResultItem {
  id: string;
  title: string;          // Front of flashcard
  summary?: string;       // Optional summary for notes
  tags: string[];         // Tags for filtering
  type: 'note' | 'flashcard';
  matchScore: number;     // Search result relevance score
  question?: string;      // For flashcards - front content
  answer?: string;        // For flashcards - back content
  match_info?: {
    title_match: boolean; // Indicates if title matched search query
    tag_match: boolean;   // Indicates if tags matched search query
  };
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

// Helper function to generate flashcards with OpenRouter API
async function generateFlashcardsWithOpenRouter(content: string, title?: string, tags?: string[]): Promise<ChatbotResponse | null> {
  try {
    console.log('Attempting OpenRouter API for flashcard generation');
    const systemPrompt = `You are a helpful assistant that creates flashcards from text content. 
Create 5-8 high-quality flashcards with questions and answers based on the content. 
Return ONLY a JSON object with the following format:
{
  "flashcards": [
    {"question": "Question text", "answer": "Answer text", "tags": ["tag1", "tag2"]}
  ],
  "tags": ["tag1", "tag2"],
  "summary": "Brief summary of the content",
  "model_used": "openrouter-llama3"
}`;

    const userPrompt = `Create flashcards from this content${title ? ' titled "' + title + '"' : ''}${tags && tags.length > 0 ? ' with tags: ' + tags.join(', ') : ''}:\n\n${content.substring(0, 3000)}`;

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "NoteNest",
      },
      body: JSON.stringify({
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "messages": [
          {
            "role": "system",
            "content": systemPrompt
          },
          {
            "role": "user",
            "content": userPrompt
          }
        ]
      })
    });

    if (openRouterResponse.ok) {
      const llmData = await openRouterResponse.json();
      if (llmData.choices && llmData.choices[0] && llmData.choices[0].message) {
        const content = llmData.choices[0].message.content;
        try {
          // Find JSON in the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const result = JSON.parse(jsonStr);
            
            // Validate the result structure
            if (result.flashcards && Array.isArray(result.flashcards) && 
                result.tags && Array.isArray(result.tags) && 
                typeof result.summary === 'string') {
              
              console.log('OpenRouter API successfully generated flashcards:', result);
              return {
                flashcards: result.flashcards,
                tags: result.tags,
                summary: result.summary,
                model_used: "openrouter-llama3"
              };
            }
          }
        } catch (jsonError) {
          console.warn('Error parsing OpenRouter response:', jsonError);
        }
      }
    }
    return null;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return null;
  }
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
      
      // Try OpenRouter API first for better tag generation
      try {
        console.log('Attempting OpenRouter API for tag generation');
        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "SmartNoteOrganizer",
          },
          body: JSON.stringify({
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "messages": [
              {
                "role": "system",
                "content": "You are a helpful tagging assistant. Extract 3-5 relevant tags from the text. Return only a JSON array of tags, nothing else."
              },
              {
                "role": "user",
                "content": `Extract 3-5 relevant keyword tags from this text: "${text.substring(0, 1000)}..."`
              }
            ]
          })
        });

        if (openRouterResponse.ok) {
          const llmData = await openRouterResponse.json();
          if (llmData.choices && llmData.choices[0] && llmData.choices[0].message) {
            const content = llmData.choices[0].message.content;
            try {
              // Try to extract JSON array from the response
              let tags;
              if (content.includes('[') && content.includes(']')) {
                const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
                tags = JSON.parse(jsonStr);
              } else {
                // If not in JSON format, try to extract as comma-separated list
                tags = content.split(/,|\n/).map(tag => 
                  tag.trim().replace(/^["']|["']$/g, '')
                    .replace(/^-\s*/, '') // Remove leading dash if present
                    .trim()
                ).filter(tag => tag.length > 0);
              }
              
              if (Array.isArray(tags) && tags.length > 0) {
                console.log('OpenRouter API successfully generated tags:', tags);
                return { 
                  data: { 
                    tags: tags.slice(0, 5), 
                    model_used: "openrouter-llama3" 
                  } 
                };
              }
            } catch (jsonError) {
              console.warn('Error parsing OpenRouter response:', jsonError);
            }
          }
        }
      } catch (openRouterError) {
        console.warn('OpenRouter API error, falling back to backend:', openRouterError);
      }
      
      // Fall back to backend API if OpenRouter fails
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
  
  // Chatbot function to generate tags, flashcards, and summary
  async chatbot(content: string, title?: string, tags?: string[], aiModel?: AIModel): 
    Promise<ApiResponse<ChatbotResponse>> {
    try {
      console.log('Sending chatbot request to backend...');
      
      // Try backend first
      try {
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

        if (response.ok) {
          const data = await response.json();
          return { data };
        }
        
        // If backend fails, don't throw yet - try OpenRouter
        console.warn('Backend chatbot failed with status:', response.status);
      } catch (backendError) {
        console.warn('Backend chatbot error, will try OpenRouter:', backendError);
      }
      
      // Try OpenRouter API as fallback
      const openRouterResult = await generateFlashcardsWithOpenRouter(content, title, tags);
      if (openRouterResult) {
        return { data: openRouterResult };
      }
      
      // If both backend and OpenRouter fail, fallback to a simple rule-based approach
      console.log('Falling back to simple rule-based flashcard generation');
      
      // Create basic flashcards from the content - extract sentences and make Q&A pairs
      const sentences = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .split(/[.!?]/)
        .filter(s => s.trim().length > 20 && s.trim().length < 200)
        .slice(0, 10); // Get up to 10 substantial sentences
      
      // Create simple flashcards
      const simpleTags = tags || [];
      const simpleFlashcards: Flashcard[] = sentences.map(sentence => {
        const trimmedSentence = sentence.trim();
        // Create a question by replacing key words or using "What/How/Why" templates
        let question = trimmedSentence;
        
        // Basic question transformation - replace key terms with blanks or create "what is" questions
        if (trimmedSentence.includes(" is ")) {
          const parts = trimmedSentence.split(" is ");
          question = `What is ${parts[0]}?`;
        } else if (trimmedSentence.includes(" are ")) {
          const parts = trimmedSentence.split(" are ");
          question = `What are ${parts[0]}?`;
        } else if (trimmedSentence.match(/\b(because|due to|as a result of)\b/i)) {
          question = `Why ${trimmedSentence.replace(/\b(because|due to|as a result of)\b.*/i, "?")}`;
        } else {
          // Default to "Explain" question
          question = `Explain: ${trimmedSentence}`;
        }
        
        return {
          question: question,
          answer: trimmedSentence,
          tags: simpleTags
        };
      });
      
      const fallbackResult: ChatbotResponse = {
        flashcards: simpleFlashcards,
        tags: simpleTags,
        summary: title || "Generated flashcards",
        model_used: "rule-based-fallback"
      };
      
      return { data: fallbackResult };
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