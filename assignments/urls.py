from django.urls import path

from .views import (
    assignment_list,
    create_assignment,
    download_all_submissions,
    submission_review,
)

app_name = "assignments"

urlpatterns = [
    path("", assignment_list, name="assignment_list"),
    path("create/", create_assignment, name="create_assignment"),
    path("<uuid:assignment_id>/submissions/", submission_review, name="submission_review"),
    path(
        "<uuid:assignment_id>/submissions/download-all/",
        download_all_submissions,
        name="download_all_submissions",
    ),
]
