from django.contrib import admin

from accounts.models import UserRole

from .models import Assignment, StudyGroup, Submission


def _is_admin_role_user(user):
    role = getattr(user, "role", None)
    return user.is_superuser or role == UserRole.ADMIN or (
        user.is_staff and role != UserRole.PROFESSOR
    )


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "course",
        "assignment_type",
        "submission_mode",
        "due_at",
        "is_published",
    )
    list_filter = ("assignment_type", "submission_mode", "is_published")
    search_fields = ("title", "course__code")
    autocomplete_fields = ("course", "created_by")
    fields = (
        "course",
        "created_by",
        "title",
        "description",
        "attachment",
        "assignment_type",
        "submission_mode",
        "max_score",
        "open_at",
        "due_at",
        "allow_late",
        "is_published",
    )

    def has_add_permission(self, request):
        if _is_admin_role_user(request.user):
            return False
        return super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        if _is_admin_role_user(request.user):
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if _is_admin_role_user(request.user):
            return False
        return super().has_delete_permission(request, obj)
    # FIX-ADMIN-4 done


@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "assignment", "leader", "created_at")
    search_fields = ("name", "assignment__title", "leader__user__email")
    autocomplete_fields = ("assignment", "leader")
    filter_horizontal = ("members",)  # FIX-ADMIN-6 done

    def has_add_permission(self, request):
        if _is_admin_role_user(request.user):
            return False
        return super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        if _is_admin_role_user(request.user):
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if _is_admin_role_user(request.user):
            return False
        return super().has_delete_permission(request, obj)


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "assignment",
        "student",
        "group",
        "status",
        "is_deleted",
        "submitted_at",
    )
    list_filter = ("status", "is_deleted")
    search_fields = ("assignment__title", "student__user__email", "group__name")
    readonly_fields = (
        "assignment",
        "student",
        "group",
        "content_text",
        "file",
        "submitted_at",
        "score",
        "feedback",
        "graded_by",
        "graded_at",
    )
    fields = (
        "assignment",
        "student",
        "group",
        "status",
        "is_deleted",
        "content_text",
        "file",
        "submitted_at",
        "score",
        "feedback",
        "graded_by",
        "graded_at",
    )
    actions = ("restore_selected_submissions",)

    @admin.action(description="Restore selected submissions")
    def restore_selected_submissions(self, request, queryset):
        queryset.update(is_deleted=False)

    def has_add_permission(self, request):
        return False

    def delete_model(self, request, obj):
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted"])

    def delete_queryset(self, request, queryset):
        queryset.update(is_deleted=True)
    # FIX-ADMIN-7 done
