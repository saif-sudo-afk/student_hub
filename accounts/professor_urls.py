from django.urls import path

from .professor_views import professor_dashboard, professor_stats
from ai_assistant.views import clear_history, professor_assistant_page

urlpatterns = [
    path("", professor_dashboard, name="dashboard"),
    path("dashboard/", professor_dashboard, name="dashboard_alias"),
    path("stats/", professor_stats, name="stats"),
    path("ai/", professor_assistant_page, name="assistant"),
    path("ai/clear/", clear_history, name="assistant_clear"),
]
