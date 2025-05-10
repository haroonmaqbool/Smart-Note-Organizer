from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notes', views.NoteViewSet)
router.register(r'flashcards', views.FlashcardViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('health/', views.health_check, name='health_check'),
    path('ping/', views.ping, name='ping'),
    path('summarize/', views.summarize, name='summarize'),
    path('tag/', views.tag, name='tag'),
    path('search/', views.search, name='search'),
    path('upload/', views.upload_file, name='upload_file'),
    path('chatbot/', views.chatbot, name='chatbot'),
    path('generate-flashcards/', views.generate_flashcards, name='generate_flashcards'),
    path('import/', views.import_file, name='import_file'),
] 