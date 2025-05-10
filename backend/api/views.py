from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import Note, Flashcard
from .serializers import NoteSerializer, FlashcardSerializer
from .ai_utils import (
    summarize_text, tag_text, extract_text_from_pdf, 
    mock_database, calculate_search_score, calculate_flashcard_score
)
import json
import uuid
from django.utils import timezone
from django.http import JsonResponse
import os
import pytesseract
from PIL import Image
import io

# Load initial mock data into database
def load_mock_data():
    # Check if we have notes already
    if Note.objects.count() == 0:
        # Load mock notes
        for note_data in mock_database["notes"]:
            note = Note(
                id=note_data["id"],
                title=note_data["title"],
                content=note_data["content"],
                summary=note_data["summary"],
                tags=note_data["tags"],
                created_at=note_data["created_at"],
                updated_at=note_data["updated_at"]
            )
            note.save()
            
    # Check if we have flashcards already
    if Flashcard.objects.count() == 0:
        # Load mock flashcards
        for card_data in mock_database["flashcards"]:
            card = Flashcard(
                id=card_data["id"],
                title=card_data["title"],
                question=card_data["question"],
                answer=card_data["answer"],
                tags=card_data["tags"],
                created_at=card_data["created_at"]
            )
            card.save()

# Try to load mock data when module is imported
try:
    load_mock_data()
except Exception as e:
    print(f"Error loading mock data: {e}")

# Health check endpoint
@api_view(['GET'])
def health_check(request):
    """API health check endpoint"""
    from .ai_utils import AI_MODEL
    return Response({
        "status": "healthy",
        "ai_model": AI_MODEL
    })

# Note viewset for CRUD operations
class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer

# Flashcard viewset for CRUD operations
class FlashcardViewSet(viewsets.ModelViewSet):
    queryset = Flashcard.objects.all()
    serializer_class = FlashcardSerializer

# Summarize text endpoint
@api_view(['POST'])
@parser_classes([JSONParser])
def summarize(request):
    """Summarize text using AI models"""
    text = request.data.get('text', '')
    ai_model = request.data.get('ai_model', None)
    
    if not text:
        return Response({"error": "No text provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = summarize_text(text, ai_model)
        return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Tag text endpoint
@api_view(['POST'])
@parser_classes([JSONParser])
def tag(request):
    """Extract tags from text using AI models"""
    text = request.data.get('text', '')
    ai_model = request.data.get('ai_model', None)
    
    if not text:
        return Response({"error": "No text provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = tag_text(text, ai_model)
        return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Search endpoint
@api_view(['GET'])
def search(request):
    """Search across notes and flashcards"""
    query = request.GET.get('q', '')
    
    if not query:
        return Response({"results": []})
    
    try:
        results = []
        query = query.lower()
        
        # Search notes from database
        notes = Note.objects.all()
        for note in notes:
            note_dict = {
                "id": note.id,
                "title": note.title,
                "content": note.content,
                "summary": note.summary,
                "tags": note.tags
            }
            score = calculate_search_score(note_dict, query)
            if score > 0:
                results.append({
                    "id": note.id,
                    "title": note.title,
                    "summary": note.summary,
                    "tags": note.tags,
                    "type": "note",
                    "matchScore": score
                })
        
        # Search flashcards from database
        flashcards = Flashcard.objects.all()
        for card in flashcards:
            card_dict = {
                "id": card.id,
                "title": card.title,
                "question": card.question,
                "answer": card.answer,
                "tags": card.tags
            }
            score = calculate_flashcard_score(card_dict, query)
            if score > 0:
                results.append({
                    "id": card.id,
                    "title": card.title,
                    "question": card.question,
                    "answer": card.answer,
                    "tags": card.tags,
                    "type": "flashcard",
                    "matchScore": score
                })
        
        # Sort results by match score (descending)
        results = sorted(results, key=lambda x: x["matchScore"], reverse=True)
        
        return Response({"results": results})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# File upload endpoint
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_file(request):
    """Upload and process files (PDF, TXT, MD, PNG, JPG)"""
    if 'file' not in request.FILES:
        return Response({"error": "No file part in the request"}, status=status.HTTP_400_BAD_REQUEST)
        
    file = request.FILES['file']
    
    if not file.name:
        return Response({"error": "No file selected"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        file_ext = file.name.split('.')[-1].lower()
        
        if file_ext == 'pdf':
            # Process PDF file
            text = extract_text_from_pdf(file)
        elif file_ext in ['txt', 'md']:
            # Process text file
            text = file.read().decode('utf-8')
        elif file_ext in ['png', 'jpg', 'jpeg']:
            # Process image file with OCR
            image = Image.open(io.BytesIO(file.read()))
            text = pytesseract.image_to_string(image)
            
            if not text or len(text.strip()) < 20:
                return Response(
                    {"error": "Could not extract sufficient text from image. Try a clearer image."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": "Unsupported file type. Please upload .txt, .md, .pdf, .png, or .jpg file"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return Response({"text": text})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Chatbot endpoint to generate flashcards, tags, summary
@api_view(['POST'])
@parser_classes([JSONParser])
def chatbot(request):
    """Process content with AI to generate tags, flashcards and summaries"""
    content = request.data.get('content', '')
    title = request.data.get('title', '')
    tags = request.data.get('tags', [])
    ai_model = request.data.get('ai_model', None)
    
    if not content:
        return Response({"error": "No content provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Generate tags if none provided
        if not tags:
            tag_result = tag_text(content, ai_model)
            tags = tag_result["tags"]
        
        # Generate summary
        summary_result = summarize_text(content, ai_model)
        summary = summary_result["summary"]
        model_used = summary_result["model_used"]
        
        # Generate simple flashcards from content
        flashcards = [
            {"question": f"What is {title} about?", "answer": summary, "tags": tags[:2]},
            {"question": f"Key concepts in {title}?", "answer": "See content for details", "tags": tags[:2]}
        ]
            
        return Response({
            "tags": tags, 
            "flashcards": flashcards, 
            "summary": summary,
            "model_used": model_used
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# New endpoint to generate flashcards from text
@api_view(['POST'])
@parser_classes([JSONParser])
def generate_flashcards(request):
    """Generate flashcards from text"""
    text = request.data.get('text', '')
    title = request.data.get('title', '')
    ai_model = request.data.get('ai_model', None)
    
    if not text:
        return Response({"error": "No text provided"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Import AI dependencies
        from .ai_utils import AI_MODEL, llama_api
        
        flashcards = []
        
        # If the text is very long, split it into chunks
        max_token_length = 1000  # Adjust based on model capacity
        text_chunks = []
        
        if len(text) > 2000:  # Roughly 500 tokens for English text
            # Split by paragraphs first
            paragraphs = [p for p in text.split('\n\n') if p.strip()]
            
            current_chunk = ""
            for paragraph in paragraphs:
                # If adding this paragraph exceeds our desired length, add current chunk to chunks and start a new one
                if len(current_chunk) + len(paragraph) > 2000:
                    if current_chunk:
                        text_chunks.append(current_chunk)
                    current_chunk = paragraph
                else:
                    current_chunk += "\n\n" + paragraph if current_chunk else paragraph
            
            # Add the last chunk if it contains text
            if current_chunk:
                text_chunks.append(current_chunk)
        else:
            text_chunks = [text]
        
        print(f"Processing {len(text_chunks)} text chunks")
        
        # Define a function to process each chunk with Llama API
        def process_chunk_with_llama(chunk_text):
            chunk_cards = []
            
            if AI_MODEL == 'llama' and llama_api is not None:
                # Create prompt for Llama with better instructions
                prompt = f"""Please create educational flashcards from the following text. Each flashcard should have a clear question on the front that tests a key concept, and a concise but complete answer on the back.

Text:
{chunk_text}

Create 3-5 high-quality flashcards in this exact format:
Q: [precise question about a key concept, term, or fact from the text]
A: [clear, concise answer that fully addresses the question]
---
"""
                
                try:
                    # Generate flashcards with Llama 3 API
                    response = llama_api(
                        prompt,
                        max_new_tokens=800,
                        do_sample=True,
                        top_p=0.9,
                        temperature=0.6,  # Slightly lower temperature for more precise answers
                    )
                    
                    # Handle response based on format
                    if isinstance(response, str):
                        result_text = response
                    else:
                        result_text = response[0]["generated_text"]
                    
                    # Extract flashcards from response
                    cards_text = result_text.split("---")
                    
                    for card_text in cards_text:
                        if "Q:" in card_text and "A:" in card_text:
                            parts = card_text.split("A:")
                            if len(parts) >= 2:  # Ensure we have both question and answer
                                question = parts[0].replace("Q:", "").strip()
                                answer = parts[1].strip()
                                
                                # Create flashcard if valid
                                if question and answer and len(question) > 5 and len(answer) > 5:
                                    # Get tags from the text
                                    card_tags = []
                                    if title:
                                        card_tags.append(title)
                                        
                                    chunk_cards.append({
                                        "question": question,
                                        "answer": answer,
                                        "tags": card_tags
                                    })
                except Exception as e:
                    print(f"Error generating flashcards with Llama API: {e}")
            
            return chunk_cards
        
        # Process each chunk
        for chunk in text_chunks:
            chunk_flashcards = process_chunk_with_llama(chunk)
            flashcards.extend(chunk_flashcards)
        
        # If no flashcards were generated with AI, use rule-based approach
        if not flashcards:
            # Simple rule-based flashcard generation as fallback
            paragraphs = [p for p in text.split('\n\n') if p.strip()]
            if len(paragraphs) < 2:
                paragraphs = [p for p in text.split('\n') if p.strip()]
            
            for i, paragraph in enumerate(paragraphs[:5]):  # Limit to first 5 paragraphs
                if len(paragraph.strip()) < 10:
                    continue
                    
                # Try to find a key term at the beginning of the paragraph
                sentences = paragraph.split('. ')
                
                if len(sentences) > 1:
                    first_sentence = sentences[0]
                    rest = '. '.join(sentences[1:])
                    
                    # Create a question from the first sentence
                    if ':' in first_sentence:
                        # If there's a colon, use the part before it as the term
                        parts = first_sentence.split(':', 1)
                        term = parts[0].strip()
                        definition = (parts[1] + '. ' + rest).strip()
                        question = f"What is {term}?"
                    else:
                        # Otherwise, make a "What is X?" question
                        words = first_sentence.split()
                        if len(words) > 3:
                            # Try to find a key noun phrase
                            term = f"What is {' '.join(words[:3])}?"
                            question = term
                            definition = paragraph
                        else:
                            question = f"Explain: {first_sentence}"
                            definition = rest
                    
                    # Create flashcard
                    flashcards.append({
                        "question": question,
                        "answer": definition,
                        "tags": [title] if title else []
                    })
                else:
                    # Short paragraph, just create a general question
                    flashcards.append({
                        "question": f"What is described by: '{paragraph[:30]}...'?",
                        "answer": paragraph,
                        "tags": [title] if title else []
                    })
        
        return Response({"flashcards": flashcards})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
