from itertools import chain

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

from accounts.decorators import professor_required
from accounts.models import UserRole

from .forms import CourseDescriptionForm, CourseMaterialUploadForm
from .models import Course, CourseMaterial, EnrollmentStatus, StudyMaterial


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


def _professor_courses(user):
    if user.role == UserRole.PROFESSOR and hasattr(user, "professor_profile"):
        return Course.objects.filter(
            teaching_assignments__professor=user.professor_profile
        ).select_related("semester")
    return Course.objects.none()


@login_required
def course_list(request):
    courses = _visible_courses(request.user)
    return render(request, "courses/course_list.html", {"courses": courses})


@login_required
def material_list(request):
    courses = _visible_courses(request.user)
    study_materials = StudyMaterial.objects.filter(course__in=courses, is_published=True).select_related(
        "course", "uploaded_by__user"
    )
    uploaded_materials = CourseMaterial.objects.filter(course__in=courses).select_related(
        "course", "uploaded_by"
    )
    materials = sorted(
        chain(study_materials, uploaded_materials),
        key=lambda item: getattr(item, "uploaded_at", getattr(item, "created_at", None)),
        reverse=True,
    )
    return render(request, "courses/material_list.html", {"materials": materials})


@professor_required
def course_detail(request, course_id):
    course = get_object_or_404(
        _professor_courses(request.user).prefetch_related(
            "course_materials",
            "materials",
            "assignments",
            "enrollments__student__user",
        ),
        pk=course_id,
    )

    description_form = CourseDescriptionForm(instance=course, prefix="description")
    material_form = CourseMaterialUploadForm(prefix="material")

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "update_description":
            description_form = CourseDescriptionForm(
                request.POST,
                instance=course,
                prefix="description",
            )
            if description_form.is_valid():
                description_form.save()
                messages.success(request, "Course description updated.")
                return redirect("courses:course_detail", course_id=course.id)
        elif action == "upload_material":
            material_form = CourseMaterialUploadForm(
                request.POST,
                request.FILES,
                prefix="material",
            )
            if material_form.is_valid():
                material = material_form.save(commit=False)
                material.course = course
                material.uploaded_by = request.user
                material.save()
                messages.success(request, "Resource uploaded successfully.")
                return redirect("courses:course_detail", course_id=course.id)

    resources = []
    if course.material:
        resources.append(
            {
                "title": f"{course.title} core material",
                "url": course.material.url,
                "uploaded_at": course.updated_at,
                "uploaded_by_name": "Course record",
            }
        )
    for material in course.course_materials.all():
        resources.append(
            {
                "title": material.title,
                "url": material.file.url,
                "uploaded_at": material.uploaded_at,
                "uploaded_by_name": material.uploaded_by.full_name,
            }
        )
    for material in course.materials.filter(is_published=True):
        file_url = material.file.url if material.file else material.external_url
        resources.append(
            {
                "title": material.title,
                "url": file_url,
                "uploaded_at": material.created_at,
                "uploaded_by_name": material.uploaded_by.user.full_name,
            }
        )
    resources.sort(key=lambda item: item["uploaded_at"], reverse=True)

    enrolled_students = course.enrollments.select_related("student__user").order_by(
        "student__user__full_name"
    )

    context = {
        "course": course,
        "description_form": description_form,
        "material_form": material_form,
        "enrolled_students": enrolled_students,
        "resources": resources,
        "active_enrollment_status": EnrollmentStatus.ACTIVE,
        "recent_assignments": course.assignments.order_by("-created_at")[:5],
    }
    return render(request, "professor/course_detail.html", context)
    # FIX-PROF-1 done
    # FIX-PROF-4 done
