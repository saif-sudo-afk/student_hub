from django.contrib import admin

from .models import AIConversation, AIMessage, AIQueryLog


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "title", "updated_at")
    search_fields = ("student__user__email", "title")


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("conversation__student__user__email", "content")


@admin.register(AIQueryLog)
class AIQueryLogAdmin(admin.ModelAdmin):
    list_display = ("student", "intent", "status", "response_time_ms", "created_at")
    list_filter = ("status", "intent")
    search_fields = ("student__user__email", "query")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
    # FIX-ADMIN-3 done
