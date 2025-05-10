from django.db import models
from django.utils import timezone

class Note(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    summary = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Flashcard(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=255)
    question = models.TextField()
    answer = models.TextField()
    tags = models.JSONField(default=list)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='flashcards', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title
