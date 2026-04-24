from django.urls import path

from .views import course_detail, course_list, material_list, public_course_detail

app_name = "courses"

urlpatterns = [
    path("", course_list, name="course_list"),
    path("materials/", material_list, name="material_list"),
    path("<uuid:course_id>/", public_course_detail, name="public_course_detail"),
    path("<uuid:course_id>/detail/", course_detail, name="course_detail"),
]
