// Choose the appropriate API base URL based on the environment
// In development with Vite, we can use the proxy setup with relative URLs
// In production, we need the full URL
// We detect development mode by checking the URL (localhost in dev)
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment ? '/api' : 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const api = {
  async summarize(text: string): Promise<ApiResponse<{ summary: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to summarize text');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Summarize API error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async tag(text: string): Promise<ApiResponse<{ tags: string[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/tag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to tag text');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Tag API error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async uploadFile(file: File): Promise<ApiResponse<{ text: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('File upload API error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  // Health check endpoint to verify API is running
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Health check API error:', error);
      return false;
    }
  }
}; 