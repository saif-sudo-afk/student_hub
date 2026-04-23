from django.test import Client, TestCase
from django.urls import reverse

from .admin import UserAdmin
from .models import ProfessorProfile, User, UserRole


class UserRoleSyncTests(TestCase):
    def test_raw_password_is_hashed_before_save(self):
        user = User(
            email="admin-save@example.com",
            full_name="Admin Save",
            role=UserRole.ADMIN,
            password="plain-password-123",
        )

        user.save()
        user.refresh_from_db()

        self.assertNotEqual(user.password, "plain-password-123")
        self.assertTrue(user.check_password("plain-password-123"))

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

    def test_professor_dashboard_redirects_to_professor_namespace(self):
        client = Client()
        user = User.objects.create_user(
            email="dashboard-prof@example.com",
            password="testpass123",
            full_name="Dashboard Professor",
            role=UserRole.PROFESSOR,
        )
        ProfessorProfile.objects.create(
            user=user,
            department="Engineering",
            employee_code="EMP-DASH",
        )

        client.force_login(user)
        response = client.get(reverse("accounts:dashboard"))

        self.assertRedirects(response, reverse("professor:dashboard"))
