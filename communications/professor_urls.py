from django.urls import path

from .professor_views import (
    announcement_archive,
    announcement_create,
    announcement_delete,
    announcement_edit,
    announcement_manage_list,
)

urlpatterns = [
    path("", announcement_manage_list, name="list"),
    path("create/", announcement_create, name="create"),
    path("<uuid:pk>/edit/", announcement_edit, name="edit"),
    path("<uuid:pk>/delete/", announcement_delete, name="delete"),
    path("<uuid:pk>/archive/", announcement_archive, name="archive"),
]
