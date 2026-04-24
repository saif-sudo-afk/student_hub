from django import forms
from django.contrib import admin
from django.db.models import Q

from accounts.models import UserRole

from .models import (
    Announcement,
    AnnouncementScope,
    AnnouncementStatus,
    AnnouncementTargetRole,
    CalendarEvent,
    EventVisibility,
)


def _is_student_role_user(user):
    return getattr(user, "role", None) == UserRole.STUDENT or user.groups.filter(
        name="students_group"
    ).exists()


def _role_visibility_filter(user):
    role = getattr(user, "role", None)
    visibility_by_role = {
        UserRole.STUDENT: EventVisibility.STUDENTS,
        UserRole.PROFESSOR: EventVisibility.PROFESSORS,
        UserRole.ADMIN: EventVisibility.ADMINS,
    }
    role_visibility = visibility_by_role.get(role)
    if not role_visibility:
        return Q(pk__isnull=True)
    return Q(visibility=EventVisibility.ALL) | Q(visibility=role_visibility)


class AnnouncementAdminForm(forms.ModelForm):
    class Meta:
        model = Announcement
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        scope = cleaned_data.get("scope")
        course = cleaned_data.get("course")
        groups = cleaned_data.get("target_audience")
        target_role = cleaned_data.get("target_role")
        if scope == AnnouncementScope.GLOBAL and (course or groups):
            raise forms.ValidationError(
                "Global announcements cannot target a course or study group."
            )
        if scope == AnnouncementScope.COURSE and not course:
            raise forms.ValidationError("Course announcements must target a course.")
        if scope == AnnouncementScope.ROLE and target_role == AnnouncementTargetRole.ALL:
            raise forms.ValidationError("Role announcements must target a specific role.")
        if scope == AnnouncementScope.GROUP and not groups:
            raise forms.ValidationError("Group announcements must target at least one study group.")
        return cleaned_data


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    form = AnnouncementAdminForm
    list_display = (
        "title",
        "status",
        "priority",
        "target_role",
        "publish_date",
        "expiry_date",
        "created_by",
        "last_updated_by",
    )
    list_filter = ("status", "scope", "priority", "send_notification")
    search_fields = ("title", "content", "created_by__email")
    autocomplete_fields = ("course", "created_by", "target_audience")
    fields = (
        "title",
        "content",
        "attachment",
        "scope",
        "course",
        "target_role",
        "target_audience",
        "publish_date",
        "expiry_date",
        "status",
        "priority",
        "send_notification",
        "created_by",
        "created_at",
        "last_updated_by",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at", "last_updated_by")
    actions = ("archive_selected", "republish_selected")

    @admin.action(description="Archive selected")
    def archive_selected(self, request, queryset):
        queryset.update(status=AnnouncementStatus.ARCHIVED, last_updated_by=request.user)

    @admin.action(description="Republish selected")
    def republish_selected(self, request, queryset):
        queryset.update(status=AnnouncementStatus.PUBLISHED, expiry_date=None, last_updated_by=request.user)

    def save_model(self, request, obj, form, change):
        if not obj.created_by_id:
            obj.created_by = request.user
        obj.last_updated_by = request.user
        super().save_model(request, obj, form, change)

    def has_module_permission(self, request):
        if _is_student_role_user(request.user):
            return False
        return super().has_module_permission(request)

    def has_add_permission(self, request):
        if _is_student_role_user(request.user):
            return False
        return super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        if _is_student_role_user(request.user):
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if _is_student_role_user(request.user):
            return False
        return super().has_delete_permission(request, obj)
    # FIX-ADMIN-8 done
    # FIX-ADMIN-10 done


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "event_type",
        "scope",
        "visibility",
        "start_at",
        "end_at",
        "created_by",
    )
    list_filter = ("event_type", "scope", "visibility")
    search_fields = ("title", "created_by__email")
    autocomplete_fields = ("created_by", "major", "course")

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.filter(_role_visibility_filter(request.user)).distinct()

    def has_add_permission(self, request):
        if getattr(request.user, "role", None) not in {UserRole.PROFESSOR, UserRole.ADMIN}:
            return False
        return super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        if getattr(request.user, "role", None) not in {UserRole.PROFESSOR, UserRole.ADMIN}:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if getattr(request.user, "role", None) not in {UserRole.PROFESSOR, UserRole.ADMIN}:
            return False
        return super().has_delete_permission(request, obj)
