from django.contrib import admin

from .models import Course, CourseMajor, Enrollment, TeachingAssignment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "semester", "credits", "is_active")
    list_filter = ("semester", "is_active")
    search_fields = ("code", "title")
    autocomplete_fields = ("semester",)
    fields = ("code", "title", "description", "material", "credits", "semester", "is_active")
    # FIX-ADMIN-12 done


@admin.register(CourseMajor)
class CourseMajorAdmin(admin.ModelAdmin):
    list_display = ("course", "major", "is_core")
    list_filter = ("is_core", "major")
    search_fields = ("course__code", "major__code")


@admin.register(TeachingAssignment)
class TeachingAssignmentAdmin(admin.ModelAdmin):
    list_display = ("professor", "course", "is_primary", "assigned_at")
    list_filter = ("is_primary",)
    search_fields = ("professor__user__email", "course__code")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student_name", "course", "enrolled_at", "status")
    list_filter = ("semester", "status")
    search_fields = ("student__user__email", "course__code")
    readonly_fields = ("student", "course", "semester", "status", "enrolled_at")

    @admin.display(description="Student name")
    def student_name(self, obj):
        return obj.student.user.full_name

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
    # FIX-ADMIN-13 done

# FIX-ADMIN-14 done
