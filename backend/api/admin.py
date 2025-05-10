from django.contrib import admin
from .models import Note, Flashcard

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'created_at', 'updated_at')
    list_filter = ('tags',)
    search_fields = ('title', 'content', 'summary')

@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'question', 'created_at')
    list_filter = ('tags',)
    search_fields = ('title', 'question', 'answer')
