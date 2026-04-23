from django.urls import path

from .views import assistant_page, clear_history

app_name = "ai_assistant"

urlpatterns = [
    path("", assistant_page, name="assistant"),
    path("clear/", clear_history, name="clear_history"),
]
