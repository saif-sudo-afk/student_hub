from django.contrib import admin
from django.test import RequestFactory, TestCase

from accounts.models import User, UserRole

from .admin import AIQueryLogAdmin
from .models import AIQueryLog


class AIQueryLogAdminTests(TestCase):
    def test_ai_query_log_admin_is_read_only(self):
        user = User.objects.create_user(
            email="admin@example.com",
            password="testpass123",
            full_name="Admin User",
            role=UserRole.ADMIN,
        )
        request = RequestFactory().get("/admin/")
        request.user = user

        model_admin = AIQueryLogAdmin(AIQueryLog, admin.site)

        self.assertFalse(model_admin.has_add_permission(request))
        self.assertFalse(model_admin.has_change_permission(request))
        self.assertFalse(model_admin.has_delete_permission(request))
