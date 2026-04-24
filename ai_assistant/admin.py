from django import forms
from django.contrib import admin
from django.db import models

from .models import AIConversation, AIMessage, AIQueryLog, FieldOfStudyConfig


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "student", "title", "updated_at")
    search_fields = ("user__email", "student__user__email", "title")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("conversation__user__email", "conversation__student__user__email", "content")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AIQueryLog)
class AIQueryLogAdmin(admin.ModelAdmin):
    list_display = ("user", "student", "topic", "intent", "status", "response_time_ms", "created_at")
    list_filter = ("status", "intent", "topic")
    search_fields = ("user__email", "student__user__email", "query")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
    # FIX-ADMIN-3 done


@admin.register(FieldOfStudyConfig)
class FieldOfStudyConfigAdmin(admin.ModelAdmin):
    list_display = ("field_of_study", "updated_at")
    search_fields = ("field_of_study",)
    formfield_overrides = {
        models.JSONField: {
            "widget": forms.Textarea(
                attrs={
                    "rows": 8,
                    "cols": 80,
                }
            )
        }
    }
    # FIX-AI-9 done
