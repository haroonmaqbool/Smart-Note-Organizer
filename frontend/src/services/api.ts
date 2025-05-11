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

// OpenRouter API Key - Using a valid public key for demonstration
// In a production environment, this should be stored securely and obtained from environment variables
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

export interface ApiResponse<T> {
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

// Add interfaces for Note and Flashcard types
export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppFlashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  noteId?: string;
  createdAt: Date;
  recentlySaved?: boolean;
}

// Helper function to generate flashcards with OpenRouter API
async function generateFlashcardsWithOpenRouter(content: string, title?: string, tags?: string[]): Promise<ChatbotResponse | null> {
  try {
    console.log('Attempting OpenRouter API for flashcard generation');
    const systemPrompt = `You are an expert educational content creator specializing in creating high-quality flashcards that promote deep learning and critical thinking.

When creating flashcards, follow these principles:
1. Create 5-8 specific, focused questions that target key concepts from the content
2. Avoid generic prompts like "explain" or "describe"
3. Use precise question formats that elicit specific knowledge:
   - Instead of "What is X?", ask "How does X differ from Y?" or "What are the three primary characteristics of X?"
   - Instead of "Explain concept X", ask "What problem does X solve?" or "What would happen if X were removed from the system?"
   - Create application questions like "How would you apply X in situation Y?"
   - Ask about relationships: "How does X relate to Y?" or "What is the significance of X in the context of Y?"
4. For technical content, include specific numerical values, formulas, or procedures when relevant
5. Ensure answers are comprehensive but concise, focusing on the exact information requested

Return ONLY a JSON object with the following format:
{
  "flashcards": [
    {"question": "Specific question text", "answer": "Precise answer text", "tags": ["tag1", "tag2"]}
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
  enableMockMode() {
    mockModeEnabled = true;
    console.log('Mock mode enabled');
  },

  disableMockMode() {
    mockModeEnabled = false;
    console.log('Mock mode disabled');
  },

  isMockModeEnabled() {
    return mockModeEnabled;
  },

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/`);
      isConnected = response.ok;
      return isConnected;
    } catch (error) {
      console.warn('Backend connection check failed:', error);
      isConnected = false;
      return false;
    }
  },

  async getNotes(): Promise<ApiResponse<Note[]>> {
    if (mockModeEnabled) {
      return {
        data: MOCK_DATA.notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          summary: note.summary,
          tags: note.tags,
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at)
        }))
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notes/`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();
      
      // Transform the raw data to match our Note interface
      const data = rawData.map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        summary: note.summary,
        tags: note.tags || [],
        createdAt: new Date(note.created_at || note.createdAt),
        updatedAt: new Date(note.updated_at || note.updatedAt)
      }));
      
      return { data };
    } catch (error) {
      return { error: handleApiError(error, 'Failed to fetch notes') };
    }
  },

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Note>> {
    // Generate a globally unique ID using UUID format to ensure uniqueness
    const generateUniqueId = () => {
      // Create UUID v4 style ID (random)
      return 'note-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) {
        const r = Math.random() * 16 | 0;
        return r.toString(16);
      });
    };
    
    const id = generateUniqueId();
    const now = new Date();
    const newNote: Note = {
      ...note,
      id,
      createdAt: now,
      updatedAt: now
    };

    if (mockModeEnabled) {
      return { data: newNote };
    }

    try {
      // Log the note being created
      console.log('Creating new note with unique ID:', id);
      
      // Ensure proper format for backend database
      const response = await fetch(`${API_BASE_URL}/notes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newNote.id,
          title: newNote.title,
          content: newNote.content,
          summary: newNote.summary || '',
          tags: newNote.tags || [],
          created_at: newNote.createdAt.toISOString(),
          updated_at: newNote.updatedAt.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server responded with error:', errorData);
        throw new Error(errorData.error || `Failed to create note: ${response.status}`);
      }

      const data = await response.json();
      console.log('Note created in database successfully with ID:', data.id);
      return { 
        data: {
          id: data.id,
          title: data.title,
          content: data.content,
          summary: data.summary,
          tags: data.tags || [],
          createdAt: new Date(data.created_at || data.createdAt),
          updatedAt: new Date(data.updated_at || data.updatedAt)
        } 
      };
    } catch (error) {
      console.error('Error creating note in database:', error);
      // Even if backend fails, return the note so it can be saved to localStorage
      return { data: newNote, error: handleApiError(error, 'Failed to save note to database') };
    }
  },

  async updateNote(note: Note): Promise<ApiResponse<Note>> {
    if (mockModeEnabled) {
      return { data: note };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notes/${note.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: note.id,
          title: note.title,
          content: note.content,
          summary: note.summary,
          tags: note.tags,
          created_at: note.createdAt.toISOString(),
          updated_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update note: ${response.status}`);
      }

      const data = await response.json();
      return { 
        data: {
          id: data.id,
          title: data.title,
          content: data.content,
          summary: data.summary,
          tags: data.tags || [],
          createdAt: new Date(data.created_at || data.createdAt),
          updatedAt: new Date(data.updated_at || data.updatedAt)
        } 
      };
    } catch (error) {
      console.error('Error updating note:', error);
      // Even if backend fails, return the note so it can be saved to localStorage
      return { data: note, error: handleApiError(error, 'Failed to update note on server') };
    }
  },

  async deleteNote(noteId: string): Promise<ApiResponse<boolean>> {
    if (mockModeEnabled) {
      return { data: true };
    }

    try {
      console.log(`Deleting note with ID: ${noteId} from database`);
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server responded with error:', errorData);
        throw new Error(errorData.error || `Failed to delete note: ${response.status}`);
      }

      console.log(`Note ${noteId} deleted from database successfully`);
      return { data: true };
    } catch (error) {
      console.error(`Error deleting note ${noteId} from database:`, error);
      return { error: handleApiError(error, 'Failed to delete note from database') };
    }
  },

  async getFlashcards(): Promise<ApiResponse<AppFlashcard[]>> {
    if (mockModeEnabled) {
      return {
        data: MOCK_DATA.flashcards.map(card => ({
          id: card.id,
          front: card.question,
          back: card.answer,
          tags: card.tags,
          createdAt: new Date(card.created_at)
        }))
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawData = await response.json();
      
      // Transform the raw data to match our AppFlashcard interface
      const data = rawData.map((card: any) => ({
        id: card.id,
        front: card.question || card.front,
        back: card.answer || card.back,
        tags: card.tags || [],
        createdAt: new Date(card.created_at || card.createdAt)
      }));
      
      return { data };
    } catch (error) {
      return { error: handleApiError(error, 'Failed to fetch flashcards') };
    }
  },

  async createFlashcard(flashcard: Omit<AppFlashcard, 'id' | 'createdAt'>): Promise<ApiResponse<AppFlashcard>> {
    const id = `flashcard-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const newFlashcard: AppFlashcard = {
      ...flashcard,
      id,
      createdAt: now
    };

    if (mockModeEnabled) {
      return { data: newFlashcard };
    }

    try {
      console.log('Creating flashcard with data:', {
        id: newFlashcard.id,
        front: newFlashcard.front,
        noteId: flashcard.noteId,
        created_at: newFlashcard.createdAt.toISOString()
      });
      
      const response = await fetch(`${API_BASE_URL}/flashcards/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newFlashcard.id,
          title: newFlashcard.front.substring(0, 30),
          question: newFlashcard.front,
          answer: newFlashcard.back,
          tags: newFlashcard.tags,
          note: flashcard.noteId,  // Make sure this is passed explicitly
          created_at: newFlashcard.createdAt.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create flashcard: ${response.status}`);
      }

      const data = await response.json();
      console.log('Flashcard created successfully with response:', data);
      
      return { 
        data: {
          id: data.id,
          front: data.question || data.front,
          back: data.answer || data.back,
          tags: data.tags || [],
          noteId: data.note || flashcard.noteId,  // Ensure noteId is preserved
          createdAt: new Date(data.created_at || data.createdAt)
        } 
      };
    } catch (error) {
      console.error('Error creating flashcard:', error);
      // Even if backend fails, return the flashcard so it can be saved to localStorage
      return { data: newFlashcard, error: handleApiError(error, 'Failed to save flashcard to server') };
    }
  },

  async updateFlashcard(flashcard: AppFlashcard): Promise<ApiResponse<AppFlashcard>> {
    if (mockModeEnabled) {
      return { data: flashcard };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/${flashcard.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: flashcard.id,
          title: flashcard.front.substring(0, 30),
          question: flashcard.front,
          answer: flashcard.back,
          tags: flashcard.tags,
          note: flashcard.noteId,
          created_at: flashcard.createdAt.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update flashcard: ${response.status}`);
      }

      const data = await response.json();
      return { 
        data: {
          id: data.id,
          front: data.question || data.front,
          back: data.answer || data.back,
          tags: data.tags || [],
          noteId: data.note || data.noteId,
          createdAt: new Date(data.created_at || data.createdAt)
        } 
      };
    } catch (error) {
      console.error('Error updating flashcard:', error);
      // Even if backend fails, return the flashcard so it can be saved to localStorage
      return { data: flashcard, error: handleApiError(error, 'Failed to update flashcard on server') };
    }
  },

  async deleteFlashcard(flashcardId: string): Promise<ApiResponse<boolean>> {
    if (mockModeEnabled) {
      return { data: true };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/${flashcardId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete flashcard: ${response.status}`);
      }

      return { data: true };
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      // Since we're optimistic, return true even if backend fails
      return { error: handleApiError(error, 'Failed to delete flashcard from server') };
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
      console.log('Starting tag generation process for text length:', text.length);
      
      // Attempt OpenRouter AI first for better tag generation
      let openRouterSuccess = false;
      let backendSuccess = false;
      let fallbackSuccess = false;
      
      try {
        console.log('Attempting OpenRouter API for tag generation...');
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
                "content": "You are an expert tagging assistant that extracts relevant, specific, and descriptive tags from text. Extract 3-5 relevant tags based on the key concepts, themes, and topics in the content. Return only a valid JSON array of tags (strings), nothing else. Example: [\"tag1\", \"tag2\", \"tag3\"]"
              },
              {
                "role": "user",
                "content": `Extract 3-5 relevant keyword tags from this text, focusing on the main concepts and topics: "${text.substring(0, 1000)}..."`
              }
            ]
          })
        });

        // Log the status of the OpenRouter response
        console.log('OpenRouter response status:', openRouterResponse.status);
        
        if (openRouterResponse.ok) {
          const llmData = await openRouterResponse.json();
          console.log('OpenRouter API returned data:', llmData.choices ? 'Has choices' : 'No choices');
          
          if (llmData.choices && llmData.choices[0] && llmData.choices[0].message) {
            const content = llmData.choices[0].message.content;
            console.log('OpenRouter response content:', content);
            
            try {
              // Try multiple approaches to extract the tags
              let tags = null;
              
              // Approach 1: Direct JSON parse if the response is a valid JSON array
              try {
                if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
                  tags = JSON.parse(content);
                  console.log('Direct JSON parse succeeded:', tags);
                }
              } catch (directJsonError) {
                console.warn('Direct JSON parse failed:', directJsonError);
              }
              
              // Approach 2: Extract JSON array from the response content
              if (!tags) {
                try {
                  if (content.includes('[') && content.includes(']')) {
                    const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
                    tags = JSON.parse(jsonStr);
                    console.log('JSON extraction succeeded:', tags);
                  }
                } catch (extractJsonError) {
                  console.warn('Extracting JSON array failed:', extractJsonError);
                }
              }
              
              // Approach 3: Handle responses with tags on separate lines or comma-separated
              if (!tags) {
                console.log('Attempting to parse tags from text format');
                tags = content.split(/,|\n/).map((tag: string) => {
                  // Clean up the tag: remove quotes, dashes, brackets, etc.
                  return tag.trim()
                    .replace(/^['"\[\s-]*|['"\]\s]*$/g, '') // Remove quotes, brackets at start/end
                    .replace(/^-\s*/, '') // Remove leading dash
                    .trim();
                }).filter((tag: string) => tag.length > 0);
                console.log('Text-based parsing result:', tags);
              }
              
              // Validate we have tags and they are in the right format
              if (Array.isArray(tags) && tags.length > 0) {
                // Clean up the tags to ensure they are strings and reasonably formatted
                const cleanedTags = tags
                  .map(tag => typeof tag === 'string' ? tag.trim() : String(tag).trim())
                  .filter(tag => tag.length > 1)
                  .slice(0, 5); // Limit to 5 tags
                
                if (cleanedTags.length > 0) {
                  console.log('OpenRouter API successfully generated tags:', cleanedTags);
                  openRouterSuccess = true;
                  return { 
                    data: { 
                      tags: cleanedTags, 
                      model_used: "openrouter-llama3" 
                    } 
                  };
                } else {
                  console.warn('OpenRouter API returned tags but they were filtered out');
                }
              } else {
                console.warn('OpenRouter API did not return valid tags array');
              }
            } catch (jsonError) {
              console.warn('Error processing OpenRouter response:', jsonError);
            }
          } else {
            console.warn('OpenRouter API response missing choices or message');
          }
        } else {
          const errorText = await openRouterResponse.text().catch(() => 'Could not read error response');
          console.warn(`OpenRouter API returned error status ${openRouterResponse.status}: ${errorText}`);
        }
      } catch (openRouterError) {
        console.warn('OpenRouter API error:', openRouterError);
      }
      
      console.log('OpenRouter AI tag generation ' + (openRouterSuccess ? 'succeeded' : 'failed') + ', trying backend...');
      
      // Fall back to backend API if OpenRouter fails
      try {
        console.log('Attempting backend API for tag generation...');
        const response = await fetch(`${API_BASE_URL}/tag`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, ai_model: aiModel }),
        });

        console.log('Backend tag API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn('Backend tag API error:', errorData.error || `Status ${response.status}`);
        } else {
          const data = await response.json();
          console.log('Backend tag API response:', data);
          
          if (data && data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
            backendSuccess = true;
            return { data: {
              tags: data.tags,
              model_used: data.model_used || "backend-ai"
            }};
          } else {
            console.warn('Backend returned empty or invalid tags array');
          }
        }
      } catch (backendError) {
        console.warn('Backend tag API error:', backendError);
      }
      
      console.log('Backend tag generation ' + (backendSuccess ? 'succeeded' : 'failed') + ', using client-side fallback...');
      
      // If all else fails, use a simple client-side tag extraction
      try {
        // Handle text with a basic word frequency approach
        const words = text.toLowerCase()
          .replace(/<[^>]*>/g, ' ') // Remove HTML tags
          .replace(/[^\w\s]/g, ' ') // Remove punctuation
          .split(/\s+/) // Split by whitespace
          .filter(word => word.length > 3); // Only keep words longer than 3 chars
        
        // Count word frequency
        const wordCounts: {[key: string]: number} = {};
        words.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        // Filter out common words
        const commonWords = ['this', 'that', 'these', 'those', 'with', 'from', 'have', 'will', 'what', 'when', 'where', 'which', 'while'];
        const sortedWords = Object.keys(wordCounts)
          .filter(word => !commonWords.includes(word))
          .sort((a, b) => wordCounts[b] - wordCounts[a])
          .slice(0, 5);
        
        console.log('Client-side tag extraction result:', sortedWords);
        
        if (sortedWords.length > 0) {
          fallbackSuccess = true;
          return { data: {
            tags: sortedWords,
            model_used: "client-side-fallback"
          }};
        } else {
          console.warn('Client-side tag extraction returned no results');
        }
      } catch (fallbackError) {
        console.error('Client-side fallback tag extraction failed:', fallbackError);
      }
      
      // If all attempts failed, return a meaningful error
      return { error: "Failed to generate tags with all available methods" };
    } catch (error) {
      console.error('Tag generation process failed with error:', error);
      return { error: handleApiError(error, 'Failed to generate tags') };
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
        // Create more specific questions using various patterns
        let question = "";
        
        // Enhanced question transformations for more specific questions
        if (trimmedSentence.includes(" is ")) {
          const parts = trimmedSentence.split(" is ");
          if (parts[0].length > 5) {
            question = `What are the key characteristics of ${parts[0]}?`;
          } else {
            question = `How would you define ${parts[0]} and what is its significance?`;
          }
        } else if (trimmedSentence.includes(" are ")) {
          const parts = trimmedSentence.split(" are ");
          question = `What functions or properties do ${parts[0]} have?`;
        } else if (trimmedSentence.match(/\b(because|due to|as a result of)\b/i)) {
          question = `What causes or factors lead to ${trimmedSentence.replace(/\b(because|due to|as a result of)\b.*/i, "")}?`;
        } else if (trimmedSentence.match(/\b(can|could|would|should)\b/i)) {
          question = `Under what conditions ${trimmedSentence.replace(/\b(can|could|would|should)\b/i, "can")}?`;
        } else if (trimmedSentence.includes(" to ")) {
          const parts = trimmedSentence.split(" to ");
          if (parts[0].length > 10) {
            question = `What is the purpose or goal of ${parts[0]}?`;
          } else {
            question = `What approaches can be used to ${parts[1]}?`;
          }
        } else {
          // Create a question based on the key nouns in the sentence
          const words = trimmedSentence.split(" ");
          const keyNouns = words.filter(w => w.length > 5).slice(0, 2);
          
          if (keyNouns.length > 0) {
            question = `How does ${keyNouns[0]} contribute to the overall concept, and what would happen without it?`;
          } else {
            // Last resort - still better than "Explain"
            question = `What is the significance of "${trimmedSentence.substring(0, 30)}..." in this context?`;
          }
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
  },

  async deleteAllNotes(): Promise<ApiResponse<boolean>> {
    if (mockModeEnabled) {
      return { data: true };
    }

    try {
      // Get all notes first
      const notesResponse = await this.getNotes();
      if (notesResponse.error || !notesResponse.data) {
        throw new Error('Failed to fetch notes for deletion');
      }
      
      // Delete each note from the backend sequentially
      const deletePromises = notesResponse.data.map(note => 
        fetch(`${API_BASE_URL}/notes/${note.id}/`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      
      return { data: true };
    } catch (error) {
      console.error('Error deleting all notes from backend:', error);
      return { error: handleApiError(error, 'Failed to delete all notes from server') };
    }
  },

  async deleteAllFlashcards(): Promise<ApiResponse<boolean>> {
    if (mockModeEnabled) {
      return { data: true };
    }

    try {
      // Get all flashcards first
      const flashcardsResponse = await this.getFlashcards();
      if (flashcardsResponse.error || !flashcardsResponse.data) {
        throw new Error('Failed to fetch flashcards for deletion');
      }
      
      // Delete each flashcard from the backend sequentially
      const deletePromises = flashcardsResponse.data.map(flashcard => 
        fetch(`${API_BASE_URL}/flashcards/${flashcard.id}/`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      
      return { data: true };
    } catch (error) {
      console.error('Error deleting all flashcards from backend:', error);
      return { error: handleApiError(error, 'Failed to delete all flashcards from server') };
    }
  },

  async saveFlashcards(flashcards: Omit<AppFlashcard, 'id' | 'createdAt'>[]): Promise<ApiResponse<AppFlashcard[]>> {
    if (mockModeEnabled) {
      return { data: [] };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/batch/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flashcards: flashcards.map(f => ({
            title: f.front.substring(0, 30),
            question: f.front,
            answer: f.back,
            tags: f.tags,
            note: f.noteId
          }))
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save flashcards: ${response.status}`);
      }
      const data = await response.json();
      // Map backend response to AppFlashcard[]
      const saved = data.map((card: any) => ({
        id: card.id,
        front: card.question || card.front,
        back: card.answer || card.back,
        tags: card.tags || [],
        noteId: card.note || card.noteId,
        createdAt: new Date(card.created_at || card.createdAt)
      }));
      return { data: saved };
    } catch (error) {
      return { error: handleApiError(error, 'Failed to save flashcards') };
    }
  }
}; 

// Fix the tag type errors
const handleTags = (content: string): string[] => {
  const tags = content.split(/[,\n]/).map((tag: string) => {
    return tag.trim()
      .replace(/^['"\[\s-]*|['"\]\s]*$/g, '') // Remove quotes, brackets at start/end
      .replace(/^-\s*/, '') // Remove leading dash
      .trim();
  }).filter((tag: string) => tag.length > 0);
  return tags;
}; 