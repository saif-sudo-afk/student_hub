from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render

from accounts.models import UserRole
from courses.views import _visible_courses

from .models import Announcement, CalendarEvent


@login_required
def announcement_list(request):
    base = Announcement.objects.filter(is_published=True).select_related(
        "posted_by", "major", "course"
    )
    if request.user.role == UserRole.STUDENT and hasattr(request.user, "student_profile"):
        profile = request.user.student_profile
        courses = _visible_courses(request.user)
        base = base.filter(
            Q(scope="global") | Q(major=profile.major) | Q(course__in=courses)
        ).distinct()
    announcements = base.order_by("-created_at")
    return render(
        request, "communications/announcement_list.html", {"announcements": announcements}
    )


@login_required
def calendar_list(request):
    base = CalendarEvent.objects.select_related("major", "course", "created_by")
    if request.user.role == UserRole.STUDENT and hasattr(request.user, "student_profile"):
        profile = request.user.student_profile
        courses = _visible_courses(request.user)
        base = base.filter(
            Q(scope="global") | Q(major=profile.major) | Q(course__in=courses)
        ).distinct()
    events = base.order_by("start_at")
    return render(request, "communications/calendar_list.html", {"events": events})
