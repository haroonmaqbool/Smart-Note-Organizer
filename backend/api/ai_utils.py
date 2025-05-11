# AI utility stubs for Smart Note Organizer

# Simple summarization stub

def summarize_text(text, ai_model=None):
    """
    Generate a summary of the given text.
    This function can be enhanced with more sophisticated NLP techniques in production.
    """
    try:
        # Ensure text isn't too short
        if len(text) < 100:
            return {
                "summary": text,
                "model_used": ai_model or "rule-based"
            }
            
        # Split text into sentences
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Skip if too few sentences
        if len(sentences) <= 3:
            return {
                "summary": text,
                "model_used": ai_model or "rule-based"
            }
            
        # Basic rule-based approach for a stub implementation:
        # 1. Take the first sentence (often contains the main point)
        # 2. Add a key sentence from the middle
        # 3. Add the last sentence (often contains conclusion)
        
        first_sentence = sentences[0]
        middle_sentence = sentences[len(sentences) // 2]
        last_sentence = sentences[-1]
        
        # If text is very long, add a few more sentences
        additional_sentences = []
        if len(sentences) > 10:
            # Add every 3rd sentence from the first quarter
            quarter_point = len(sentences) // 4
            for i in range(1, quarter_point, 3):
                if i < len(sentences):
                    additional_sentences.append(sentences[i])
        
        # Combine the selected sentences
        summary_parts = [first_sentence] + additional_sentences + [middle_sentence, last_sentence]
        summary = " ".join(summary_parts)
        
        # Truncate if too long (about 500 chars)
        if len(summary) > 500:
            summary = summary[:497] + "..."
            
        return {
            "summary": summary,
            "model_used": ai_model or "rule-based-extraction"
        }
    except Exception as e:
        print(f"Error in summarize_text: {str(e)}")
        # Fallback to simple approach
        return {
            "summary": text[:200] + ("..." if len(text) > 200 else ""),
            "model_used": "fallback"
        }

# Simple tag extraction stub

def tag_text(text, ai_model=None):
    # Just return some dummy tags
    words = set(text.lower().replace('.', '').replace(',', '').split())
    tags = [w for w in words if len(w) > 4][:5]
    return {"tags": tags or ["note", "smart", "organizer"]}

# Simple PDF extraction stub

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

# AI model name stub
AI_MODEL = "openrouter-default"

# OpenRouter API is called directly from frontend
def openrouter_api(prompt, **kwargs):
    return None 