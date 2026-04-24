from django.urls import path

from .professor_views import professor_dashboard, professor_stats

urlpatterns = [
    path("", professor_dashboard, name="dashboard"),
    path("dashboard/", professor_dashboard, name="dashboard_alias"),
    path("stats/", professor_stats, name="stats"),
]
