# AI utility stubs for Smart Note Organizer

# Simple summarization stub

def summarize_text(text, ai_model=None):
    return {
        "summary": text[:150] + ("..." if len(text) > 150 else ""),
        "model_used": ai_model or "rule-based"
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
    if query in note_dict.get("title", "").lower():
        score += 5
    if query in note_dict.get("content", "").lower():
        score += 3
    if query in note_dict.get("summary", "").lower():
        score += 2
    if any(query in tag.lower() for tag in note_dict.get("tags", [])):
        score += 1
    return score

def calculate_flashcard_score(card_dict, query):
    score = 0
    if query in card_dict.get("title", "").lower():
        score += 3
    if query in card_dict.get("question", "").lower():
        score += 2
    if query in card_dict.get("answer", "").lower():
        score += 2
    if any(query in tag.lower() for tag in card_dict.get("tags", [])):
        score += 1
    return score

# AI model name stub
AI_MODEL = "rule-based"

# Llama API stub (returns None)
def llama_api(prompt, **kwargs):
    return None 