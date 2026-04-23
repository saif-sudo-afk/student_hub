from django.test import TestCase

from .admin import UserAdmin
from .models import User, UserRole


class UserRoleSyncTests(TestCase):
    def test_role_changes_sync_groups_and_staff_flags(self):
        user = User.objects.create_user(
            email="prof@example.com",
            password="testpass123",
            full_name="Professor Test",
            role=UserRole.PROFESSOR,
        )

        user.refresh_from_db()
        self.assertTrue(user.is_staff)
        self.assertEqual(
            list(user.groups.values_list("name", flat=True)),
            ["professors_group"],
        )

        user.role = UserRole.STUDENT
        user.save()
        user.refresh_from_db()

        self.assertFalse(user.is_staff)
        self.assertEqual(
            list(user.groups.values_list("name", flat=True)),
            ["students_group"],
        )

    def test_custom_user_admin_hides_manual_permission_fields(self):
        field_names = []
        for _, config in UserAdmin.fieldsets:
            field_names.extend(config["fields"])

        self.assertNotIn("groups", field_names)
        self.assertNotIn("user_permissions", field_names)
