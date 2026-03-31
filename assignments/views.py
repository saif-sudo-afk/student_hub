from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render

from accounts.models import UserRole
from courses.views import _visible_courses

from .models import Assignment


@login_required
def assignment_list(request):
    courses = _visible_courses(request.user)
    queryset = Assignment.objects.filter(course__in=courses).select_related(
        "course", "created_by__user"
    )
    if request.user.role == UserRole.STUDENT:
        queryset = queryset.filter(is_published=True)
    assignments = queryset.order_by("due_at")
    return render(request, "assignments/assignment_list.html", {"assignments": assignments})
