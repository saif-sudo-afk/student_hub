from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render
from django.utils import timezone

from accounts.models import UserRole
from courses.views import _visible_courses

from .models import (
    Announcement,
    AnnouncementScope,
    AnnouncementStatus,
    CalendarEvent,
    EventVisibility,
)


def _event_visibility_filter(user):
    visibility_by_role = {
        UserRole.STUDENT: EventVisibility.STUDENTS,
        UserRole.PROFESSOR: EventVisibility.PROFESSORS,
        UserRole.ADMIN: EventVisibility.ADMINS,
    }
    role_visibility = visibility_by_role.get(getattr(user, "role", None))
    if not role_visibility:
        return Q(pk__isnull=True)
    return Q(visibility=EventVisibility.ALL) | Q(visibility=role_visibility)


@login_required
def announcement_list(request):
    now = timezone.now()
    base = Announcement.objects.filter(
        status=AnnouncementStatus.PUBLISHED,
        publish_date__lte=now,
    ).filter(
        Q(expiry_date__isnull=True) | Q(expiry_date__gt=now)
    ).select_related(
        "created_by", "course"
    ).prefetch_related(
        "target_audience__members"
    )
    if request.user.role == UserRole.STUDENT and hasattr(request.user, "student_profile"):
        profile = request.user.student_profile
        courses = _visible_courses(request.user)
        base = base.filter(
            Q(scope=AnnouncementScope.GLOBAL)
            | Q(scope=AnnouncementScope.COURSE, course__in=courses)
            | Q(scope=AnnouncementScope.GROUP, target_audience__members=profile)
        ).distinct()
    announcements = base.order_by("-priority", "-publish_date")
    return render(
        request, "communications/announcement_list.html", {"announcements": announcements}
    )


@login_required
def calendar_list(request):
    base = CalendarEvent.objects.filter(_event_visibility_filter(request.user)).select_related(
        "major", "course", "created_by"
    )
    if request.user.role == UserRole.STUDENT and hasattr(request.user, "student_profile"):
        profile = request.user.student_profile
        courses = _visible_courses(request.user)
        base = base.filter(
            Q(scope="global") | Q(major=profile.major) | Q(course__in=courses)
        ).distinct()
    events = base.order_by("start_at")
    return render(request, "communications/calendar_list.html", {"events": events})
