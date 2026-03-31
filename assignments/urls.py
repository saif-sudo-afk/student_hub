from django.urls import path

from .views import assignment_list

app_name = "assignments"

urlpatterns = [
    path("", assignment_list, name="assignment_list"),
]
