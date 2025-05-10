const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { createWorker } = require('tesseract.js');
const natural = require('natural');
const { pipeline } = require('@xenova/transformers');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload .txt, .md, or .pdf file'));
    }
  }
});

// Set up NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

// Initialize summarization pipeline
let summarizer;
let llama_model;
let AI_MODEL = process.env.AI_MODEL || 'bart';

// Load models asynchronously
async function loadModels() {
  try {
    console.log("Loading BART summarization model...");
    summarizer = await pipeline('summarization', 'Xenova/bart-large-cnn');
    
    // Load Llama model if configured
    const LLAMA_MODEL_NAME = process.env.LLAMA_MODEL_NAME || 'Xenova/TinyLlama-1.1B-Chat-v1.0';
    if (AI_MODEL === 'llama') {
      try {
        console.log(`Loading Llama model: ${LLAMA_MODEL_NAME}`);
        llama_model = await pipeline('text-generation', LLAMA_MODEL_NAME);
        console.log("Llama model loaded successfully");
      } catch (e) {
        console.error(`Error loading Llama model: ${e.message}`);
        console.log("Falling back to BART model");
        AI_MODEL = 'bart';
      }
    }
    
    console.log(`Using AI model: ${AI_MODEL}`);
  } catch (error) {
    console.error("Error loading models:", error);
  }
}

// Start loading models
loadModels();

// Mock database
const mockDatabase = {
  notes: [
    {
      id: "note1",
      title: "Machine Learning Basics",
      content: "Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.",
      summary: "Introduction to machine learning concepts including supervised and unsupervised learning.",
      tags: ["ML", "AI", "data science"],
      createdAt: "2025-05-01T10:00:00Z",
      updatedAt: "2025-05-01T10:00:00Z"
    },
    {
      id: "note2",
      title: "Neural Networks",
      content: "Neural networks are computing systems with interconnected nodes that work much like neurons in the human brain. Using algorithms, they can recognize hidden patterns and correlations in raw data, cluster and classify it, and continuously learn and improve over time.",
      summary: "Deep dive into neural network architectures and training methods.",
      tags: ["deep learning", "ML", "neural networks"],
      createdAt: "2025-05-02T10:00:00Z",
      updatedAt: "2025-05-02T10:00:00Z"
    },
    {
      id: "note3",
      title: "Python for Data Science",
      content: "Python has become the standard language for data science due to its ease of use and powerful libraries like NumPy, Pandas, and Matplotlib. It allows for fast prototyping and has a vibrant community.",
      summary: "Overview of Python libraries and tools for data analysis and machine learning.",
      tags: ["Python", "data science", "programming"],
      createdAt: "2025-05-03T10:00:00Z",
      updatedAt: "2025-05-03T10:00:00Z"
    }
  ],
  flashcards: [
    {
      id: "flash1",
      title: "ML Algorithms",
      question: "What are the three main types of machine learning?",
      answer: "Supervised learning, unsupervised learning, and reinforcement learning",
      tags: ["ML", "algorithms"],
      createdAt: "2025-05-04T10:00:00Z"
    },
    {
      id: "flash2",
      title: "Python Data Libraries",
      question: "What are the primary Python libraries used for data manipulation?",
      answer: "NumPy and Pandas",
      tags: ["Python", "data science"],
      createdAt: "2025-05-05T10:00:00Z"
    }
  ]
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    ai_model: AI_MODEL
  });
});

// Generate response with Llama model
async function generateLlamaResponse(prompt, maxLength = 100) {
  if (!llama_model) {
    throw new Error("Llama model not available");
  }
  
  const result = await llama_model(prompt, {
    max_new_tokens: maxLength,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true
  });
  
  // Extract response and remove the prompt
  let response = result[0].generated_text;
  if (response.startsWith(prompt)) {
    response = response.substring(prompt.length).trim();
  }
  
  return response;
}

// Summarize text endpoint
app.post('/api/summarize', async (req, res) => {
  const { text, ai_model = AI_MODEL } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }
  
  try {
    if (ai_model === 'llama' && llama_model) {
      const prompt = `Please summarize the following text:\n\n${text}\n\nSummary:`;
      const summary = await generateLlamaResponse(prompt, Math.min(Math.floor(text.length / 2), 150));
      return res.json({ summary, model_used: "llama" });
    } else {
      // Use BART (default)
      if (!summarizer) {
        return res.status(503).json({ error: "Summarization model is still loading" });
      }
      
      const result = await summarizer(text, {
        max_length: 130,
        min_length: 30,
        do_sample: false
      });
      
      return res.json({ summary: result[0].summary_text, model_used: "bart" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Tag text endpoint
app.post('/api/tag', async (req, res) => {
  const { text, ai_model = AI_MODEL } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }
  
  try {
    if (ai_model === 'llama' && llama_model) {
      const prompt = `Extract relevant tags and keywords from this text. Return only a comma-separated list of tags:\n\n${text}\n\nTags:`;
      const tagsText = await generateLlamaResponse(prompt);
      // Clean and parse the response
      const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);
      return res.json({ tags, model_used: "llama" });
    } else {
      // Use natural NLP (default)
      const tfidf = new TfIdf();
      tfidf.addDocument(text);
      
      const tokens = tokenizer.tokenize(text);
      const uniqueTokens = [...new Set(tokens)];
      
      // Get top terms based on TF-IDF
      const tags = uniqueTokens
        .map(term => ({ term, score: tfidf.tfidf(term, 0) }))
        .filter(item => item.term.length > 2) // Filter out short terms
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.term);
      
      return res.json({ tags, model_used: "natural" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// New chatbot endpoint for processing content
app.post('/api/chatbot', async (req, res) => {
  const { content, title, tags, ai_model = AI_MODEL } = req.body;
  
  if (!content || content.length < 50) {
    return res.status(400).json({ error: "Not enough content to process" });
  }
  
  try {
    // Process in parallel for efficiency
    const [summaryResult, tagsResult] = await Promise.all([
      // Generate summary
      (async () => {
        if (ai_model === 'llama' && llama_model) {
          const prompt = `Please summarize the following text in 2-3 sentences:\n\n${content}\n\nSummary:`;
          return await generateLlamaResponse(prompt, 150);
        } else if (summarizer) {
          const result = await summarizer(content, {
            max_length: 130,
            min_length: 30,
            do_sample: false
          });
          return result[0].summary_text;
        }
        return "";
      })(),
      
      // Generate tags
      (async () => {
        if (ai_model === 'llama' && llama_model) {
          const prompt = `Extract 5-8 relevant tags and keywords from this text. Return only a comma-separated list of tags:\n\n${content}\n\nTags:`;
          const tagsText = await generateLlamaResponse(prompt);
          return tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
          const tfidf = new TfIdf();
          tfidf.addDocument(content);
          
          const tokens = tokenizer.tokenize(content);
          const uniqueTokens = [...new Set(tokens)];
          
          return uniqueTokens
            .map(term => ({ term, score: tfidf.tfidf(term, 0) }))
            .filter(item => item.term.length > 2)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(item => item.term);
        }
      })()
    ]);
    
    // Generate flashcards
    let flashcards = [];
    
    // Generate flashcards based on content
    if (ai_model === 'llama' && llama_model) {
      const prompt = `Create 3 flashcards based on this content. Format each flashcard as "Q: [question] A: [answer]". Make the questions test understanding of key concepts:\n\n${content}\n\nFlashcards:`;
      const flashcardsText = await generateLlamaResponse(prompt, 300);
      
      // Parse the flashcards from the text
      const cardMatches = flashcardsText.match(/Q:\s*(.*?)\s*A:\s*(.*?)(?=Q:|$)/gs);
      if (cardMatches) {
        flashcards = cardMatches.map(card => {
          const questionMatch = card.match(/Q:\s*(.*?)\s*A:/s);
          const answerMatch = card.match(/A:\s*(.*?)$/s);
          
          const question = questionMatch ? questionMatch[1].trim() : "";
          const answer = answerMatch ? answerMatch[1].trim() : "";
          
          return {
            question,
            answer,
            tags: tags.slice(0, 3) // Use the first few tags from the note
          };
        }).filter(card => card.question && card.answer);
      }
    } else {
      // Simple flashcard generation using key sentences
      const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
      
      // Select a few important sentences
      const keyTerms = tagsResult.slice(0, 3);
      const selectedSentences = sentences
        .filter(sentence => 
          keyTerms.some(term => 
            sentence.toLowerCase().includes(term.toLowerCase())
          )
        )
        .slice(0, 3);
      
      flashcards = selectedSentences.map(sentence => {
        // Create a question by replacing key terms with blanks or turning into a question
        let question = sentence.trim();
        const keyTerm = keyTerms.find(term => 
          sentence.toLowerCase().includes(term.toLowerCase())
        );
        
        if (keyTerm) {
          question = `What is meant by "${keyTerm}" in the context of ${title || "this topic"}?`;
        } else {
          question = `Explain the concept described in: "${sentence.substring(0, 50)}..."`;
        }
        
        return {
          question,
          answer: sentence.trim(),
          tags: tags.slice(0, 3)
        };
      });
    }
    
    return res.json({
      summary: summaryResult,
      tags: tagsResult.filter(tag => !tags.includes(tag)), // Filter out tags already in the note
      flashcards,
      model_used: ai_model
    });
    
  } catch (error) {
    console.error('Chatbot processing error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  
  if (!query) {
    return res.json({ results: [] });
  }
  
  try {
    const results = [];
    const queryLower = query.toLowerCase();
    
    // Search notes
    for (const note of mockDatabase.notes) {
      const score = calculateSearchScore(note, queryLower);
      if (score > 0) {
        results.push({
          id: note.id,
          title: note.title,
          summary: note.summary,
          tags: note.tags,
          type: "note",
          matchScore: score
        });
      }
    }
    
    // Search flashcards
    for (const card of mockDatabase.flashcards) {
      const score = calculateFlashcardScore(card, queryLower);
      if (score > 0) {
        results.push({
          id: card.id,
          title: card.title,
          question: card.question,
          answer: card.answer,
          tags: card.tags,
          type: "flashcard",
          matchScore: score
        });
      }
    }
    
    // Sort results by match score (descending)
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    return res.json({ results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

function calculateSearchScore(note, query) {
  let score = 0;
  
  // Check title match (highest weight)
  if (note.title.toLowerCase().includes(query)) {
    score += 0.4;
  }
  
  // Check tag matches
  if (note.tags.some(tag => tag.toLowerCase().includes(query))) {
    score += 0.25;
  }
  
  // Check content match
  if (note.content.toLowerCase().includes(query)) {
    score += 0.2;
  }
  
  // Check summary match
  if (note.summary.toLowerCase().includes(query)) {
    score += 0.15;
  }
  
  return score;
}

function calculateFlashcardScore(card, query) {
  let score = 0;
  
  // Check title match
  if (card.title.toLowerCase().includes(query)) {
    score += 0.3;
  }
  
  // Check question match (high weight)
  if (card.question.toLowerCase().includes(query)) {
    score += 0.4;
  }
  
  // Check answer match
  if (card.answer.toLowerCase().includes(query)) {
    score += 0.2;
  }
  
  // Check tag matches
  if (card.tags.some(tag => tag.toLowerCase().includes(query))) {
    score += 0.1;
  }
  
  return score;
}

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file part in the request" });
  }
  
  try {
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let text = '';
    
    if (fileExt === '.pdf') {
      // Process PDF file
      text = await extractTextFromPdf(req.file.buffer);
    } else if (fileExt === '.txt' || fileExt === '.md') {
      // Process text file
      text = req.file.buffer.toString('utf-8');
    }
    
    return res.json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

async function extractTextFromPdf(buffer) {
  try {
    // Basic text extraction from PDF
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    let text = '';
    
    // This is a simplified version - in a real app you'd need a more robust PDF text extraction
    // For OCR functionality, you would use Tesseract.js more extensively
    
    // For demonstration, we'll just indicate that OCR would be used here
    text = "PDF text extraction in JavaScript. For a complete implementation, you would need to use a PDF parsing library like pdf-parse or pdf.js, combined with Tesseract.js for OCR capabilities.";
    
    return text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "Error extracting text from PDF";
  }
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 