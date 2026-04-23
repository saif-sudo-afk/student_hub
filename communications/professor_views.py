from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from accounts.decorators import professor_required

from .forms import ProfessorAnnouncementForm
from .models import Announcement, AnnouncementStatus


def _professor_announcements(user):
    return Announcement.objects.filter(created_by=user).select_related("course")


@professor_required
def announcement_manage_list(request):
    announcements = _professor_announcements(request.user).order_by("-created_at")
    return render(
        request,
        "professor/announcements.html",
        {"announcements": announcements},
    )
    # FIX-PROF-5 done


@professor_required
def announcement_create(request):
    form = ProfessorAnnouncementForm(
        request.POST or None,
        request.FILES or None,
        user=request.user,
    )
    if request.method == "POST" and form.is_valid():
        announcement = form.save(commit=False)
        announcement.created_by = request.user
        announcement.save()
        messages.success(request, "Announcement created.")
        return redirect("professor_announcements:list")
    return render(
        request,
        "professor/announcement_form.html",
        {"form": form, "page_title": "New Announcement"},
    )


@professor_required
def announcement_edit(request, pk):
    announcement = get_object_or_404(_professor_announcements(request.user), pk=pk)
    form = ProfessorAnnouncementForm(
        request.POST or None,
        request.FILES or None,
        instance=announcement,
        user=request.user,
    )
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Announcement updated.")
        return redirect("professor_announcements:list")
    return render(
        request,
        "professor/announcement_form.html",
        {
            "form": form,
            "page_title": f"Edit {announcement.title}",
            "announcement": announcement,
        },
    )


@professor_required
@require_POST
def announcement_delete(request, pk):
    announcement = get_object_or_404(_professor_announcements(request.user), pk=pk)
    announcement.delete()
    messages.success(request, "Announcement deleted.")
    return redirect("professor_announcements:list")


@professor_required
@require_POST
def announcement_archive(request, pk):
    announcement = get_object_or_404(_professor_announcements(request.user), pk=pk)
    announcement.status = AnnouncementStatus.ARCHIVED
    announcement.save(update_fields=["status"])
    messages.success(request, "Announcement archived.")
    return redirect("professor_announcements:list")
