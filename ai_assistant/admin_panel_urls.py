from django.urls import path

from .views import admin_ai_dashboard

urlpatterns = [
    path("ai/", admin_ai_dashboard, name="dashboard"),
]
