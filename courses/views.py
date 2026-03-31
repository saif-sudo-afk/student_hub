from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render

from accounts.models import UserRole

from .models import Course, StudyMaterial


def _visible_courses(user):
    if user.role == UserRole.ADMIN:
        return Course.objects.select_related("semester").all()
    if user.role == UserRole.PROFESSOR and hasattr(user, "professor_profile"):
        return Course.objects.filter(
            teaching_assignments__professor=user.professor_profile
        ).select_related("semester")
    if user.role == UserRole.STUDENT and hasattr(user, "student_profile"):
        profile = user.student_profile
        return (
            Course.objects.filter(
                Q(enrollments__student=profile) | Q(majors=profile.major)
            )
            .select_related("semester")
            .distinct()
        )
    return Course.objects.none()


@login_required
def course_list(request):
    courses = _visible_courses(request.user)
    return render(request, "courses/course_list.html", {"courses": courses})


@login_required
def material_list(request):
    courses = _visible_courses(request.user)
    materials = (
        StudyMaterial.objects.filter(course__in=courses, is_published=True)
        .select_related("course", "uploaded_by__user")
        .order_by("-created_at")
    )
    return render(request, "courses/material_list.html", {"materials": materials})
