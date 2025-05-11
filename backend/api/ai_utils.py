# AI utilities for Smart Note Organizer
import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
API_KEY = os.getenv("OPENROUTER_API_KEY")
# Get AI model from environment variables, with fallback
AI_MODEL = os.getenv("AI_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

# Headers for OpenRouter API
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": os.getenv("API_REFERER", "https://notes.app"),
    "X-Title": "Smart Note Organizer",
}

def query_llama(prompt, system_prompt=None):
    """
    Query the LLaMA model via OpenRouter API with the given prompt.
    
    Args:
        prompt (str): The user prompt to send to the model
        system_prompt (str, optional): System prompt to guide the model's behavior
        
    Returns:
        str or None: The model's response, or None if the request failed
    """
    print(f"[DEBUG] Connecting to {AI_MODEL} via OpenRouter...")
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    messages.append({"role": "user", "content": prompt})
    
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers=HEADERS,
            data=json.dumps({
                "model": AI_MODEL,
                "messages": messages
            })
        )
        
        if response.status_code == 200:
            print("[DEBUG] Response received successfully.")
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            print(f"[ERROR] Failed with status code {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"[ERROR] Exception during API call: {str(e)}")
        return None

def summarize_text(text, ai_model=None):
    """
    Generate a summary of the given text using LLaMA 3.3 70B.
    Falls back to rule-based approach if the API call fails.
    """
    # Use the specified model or the default
    model = ai_model or AI_MODEL
    
    try:
        # Check if text is too short
        if len(text) < 100:
            return {
                "summary": text,
                "model_used": "direct-text" # Text is too short to summarize
            }
        
        # Call LLaMA to generate summary
        system_prompt = """You are an expert summarizer. Create a concise summary of the provided text that captures the key points and main ideas. Keep the summary under 300 words."""
        
        user_prompt = f"Please summarize the following text:\n\n{text[:4000]}"
        
        summary = query_llama(user_prompt, system_prompt)
        
        if summary:
            return {
                "summary": summary,
                "model_used": model
            }
        
        # If API call fails, fall back to rule-based approach
        return fallback_summarize(text)
    
    except Exception as e:
        print(f"Error in summarize_text: {str(e)}")
        return fallback_summarize(text)

def fallback_summarize(text):
    """Fallback rule-based summary when API call fails"""
    try:
        # Split text into sentences
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Skip if too few sentences
        if len(sentences) <= 3:
            return {
                "summary": text,
                "model_used": "rule-based"
            }
        
        # Basic rule-based approach
        first_sentence = sentences[0]
        middle_sentence = sentences[len(sentences) // 2]
        last_sentence = sentences[-1]
        
        # If text is very long, add a few more sentences
        additional_sentences = []
        if len(sentences) > 10:
            quarter_point = len(sentences) // 4
            for i in range(1, quarter_point, 3):
                if i < len(sentences):
                    additional_sentences.append(sentences[i])
        
        summary_parts = [first_sentence] + additional_sentences + [middle_sentence, last_sentence]
        summary = " ".join(summary_parts)
        
        # Truncate if too long
        if len(summary) > 500:
            summary = summary[:497] + "..."
            
        return {
            "summary": summary,
            "model_used": "rule-based-extraction"
        }
    except Exception as e:
        print(f"Error in fallback_summarize: {str(e)}")
        return {
            "summary": text[:200] + ("..." if len(text) > 200 else ""),
            "model_used": "fallback"
        }

def tag_text(text, ai_model=None):
    """
    Extract tags from the given text using LLaMA 3.3 70B.
    Falls back to rule-based approach if the API call fails.
    """
    # Use the specified model or the default
    model = ai_model or AI_MODEL
    
    try:
        # Call LLaMA to generate tags
        system_prompt = """You are an expert at extracting relevant tags from content. 
        Generate 5-8 specific, focused tags that accurately represent the key concepts in the text.
        Your response should be ONLY a JSON array of strings, nothing else.
        Example: ["machine learning", "neural networks", "data science", "python", "tensorflow"]"""
        
        user_prompt = f"Extract tags from this text:\n\n{text[:3000]}"
        
        tags_response = query_llama(user_prompt, system_prompt)
        
        if tags_response:
            try:
                # Try to parse the response as JSON
                if tags_response.strip().startswith('[') and tags_response.strip().endswith(']'):
                    tags = json.loads(tags_response)
                    if isinstance(tags, list) and len(tags) > 0:
                        return {
                            "tags": tags,
                            "model_used": model
                        }
                else:
                    # Try to extract array from response
                    json_match = tags_response.strip().find('[')
                    json_end = tags_response.strip().rfind(']')
                    if json_match >= 0 and json_end > json_match:
                        json_str = tags_response[json_match:json_end+1]
                        tags = json.loads(json_str)
                        if isinstance(tags, list) and len(tags) > 0:
                            return {
                                "tags": tags,
                                "model_used": model
                            }
            except Exception as e:
                print(f"Error parsing tags response: {str(e)}")
        
        # If API call fails or parsing fails, fall back to rule-based approach
        return fallback_tag(text)
    
    except Exception as e:
        print(f"Error in tag_text: {str(e)}")
        return fallback_tag(text)

def fallback_tag(text):
    """Fallback rule-based tagging when API call fails"""
    # Basic word frequency-based tagging
    import re
    from collections import Counter
    
    # Preprocess text
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())  # Find words with 4+ letters
    
    # Remove common stop words
    stop_words = {"about", "above", "after", "again", "against", "all", "am", "an", "and", 
                 "any", "are", "aren't", "as", "at", "be", "because", "been", "before", 
                 "being", "below", "between", "both", "but", "by", "can't", "cannot", 
                 "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", 
                 "don't", "down", "during", "each", "few", "for", "from", "further", "had", 
                 "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", 
                 "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", 
                 "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", 
                 "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", 
                 "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", 
                 "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", 
                 "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", 
                 "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", 
                 "than", "that", "that's", "the", "their", "theirs", "them", "themselves", 
                 "then", "there", "there's", "these", "they", "they'd", "they'll", 
                 "they're", "they've", "this", "those", "through", "to", "too", "under", 
                 "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", 
                 "we've", "were", "weren't", "what", "what's", "when", "when's", "where", 
                 "where's", "which", "while", "who", "who's", "whom", "why", "why's", 
                 "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", 
                 "you've", "your", "yours", "yourself", "yourselves"}
    
    filtered_words = [word for word in words if word not in stop_words]
    
    # Get most common words
    word_counts = Counter(filtered_words)
    tags = [word for word, count in word_counts.most_common(8) if count > 1]
    
    # Ensure we have at least some tags
    if len(tags) < 3:
        tags = [word for word, count in word_counts.most_common(5)]
    
    return {
        "tags": tags or ["note", "smart", "organizer"],
        "model_used": "rule-based-tags"
    }

# Extract text from PDF (stub)
def extract_text_from_pdf(file):
    # This should use PyPDF2 or similar in a real app
    return "PDF text extraction not implemented in stub."

# Mock database for initial data
mock_database = {
    "notes": [],
    "flashcards": []
}

# Simple search score (checks if query in title/content/summary/tags)
def calculate_search_score(note_dict, query):
    score = 0
    
    # Case-insensitive title match
    title = note_dict.get("title", "").lower()
    if query in title:
        score += 5
        # Give extra points for exact title matches
        if query == title:
            score += 3
    
    # Content and summary matching
    if query in note_dict.get("content", "").lower():
        score += 3
    if query in note_dict.get("summary", "").lower():
        score += 2
    
    # Tag matching
    for tag in note_dict.get("tags", []):
        tag_lower = tag.lower()
        if query == tag_lower:
            score += 3  # Exact tag match
        elif query in tag_lower:
            score += 1  # Partial tag match
    
    return score

def calculate_flashcard_score(card_dict, query):
    score = 0
    match_info = {"title_match": False, "tag_match": False}
    
    # Case-insensitive title match
    title = card_dict.get("title", "").lower()
    if query == title:
        score += 5  # Exact title match
        match_info["title_match"] = True
    elif query in title:
        score += 3  # Partial title match
        match_info["title_match"] = True
    
    # Question and answer matching
    if query in card_dict.get("question", "").lower():
        score += 2
    if query in card_dict.get("answer", "").lower():
        score += 2
    
    # Tag matching - both exact and partial matches
    for tag in card_dict.get("tags", []):
        tag_lower = tag.lower()
        if query == tag_lower:
            score += 3  # Exact tag match
            match_info["tag_match"] = True
        elif query in tag_lower:
            score += 1  # Partial tag match
            match_info["tag_match"] = True
    
    # Return both score and match info
    card_dict["match_info"] = match_info
    return score

# OpenRouter API is called directly from frontend
def openrouter_api(prompt, **kwargs):
    return None 