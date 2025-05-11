# NoteNest - Smart Note Organizer

A modern web application for organizing notes, flashcards, and documents with AI-powered features.

## Netlify Deployment

This project is configured for deployment on Netlify with the following settings:

### Build Settings

- **Build command:** `npm run build:netlify`
- **Publish directory:** `dist`
- **Node version:** 18

### Environment Variables

The following environment variables need to be set in Netlify:

- `VITE_API_BASE_URL`: URL for your backend API
- `VITE_OPENROUTER_API_KEY`: Your OpenRouter API key
- `VITE_AI_MODEL`: The AI model to use (e.g., "meta-llama/llama-3.3-70b-instruct:free")

### Important Files

- `netlify.toml`: Contains build configuration
- `tsconfig.production.json`: TypeScript configuration for production builds
- `public/_redirects`: Routes all requests to index.html for SPA routing

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ``` 