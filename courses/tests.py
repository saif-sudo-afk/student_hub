from datetime import timedelta

from django.contrib import admin
from django.test import RequestFactory, TestCase
from django.utils import timezone

from academics.models import Major, Semester, TermType
from accounts.models import StudentProfile, User, UserRole

from .admin import EnrollmentAdmin
from .models import Course, CourseMajor, Enrollment, EnrollmentStatus


class EnrollmentAutomationTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.major = Major.objects.create(name="Computer Science", code="CS")
        self.semester = Semester.objects.create(
            name="Spring 2026",
            year=2026,
            term=TermType.SPRING,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=90)).date(),
        )
        self.course = Course.objects.create(
            code="CS103",
            title="Data Structures",
            semester=self.semester,
        )
        CourseMajor.objects.create(course=self.course, major=self.major, is_core=True)

    def test_student_profile_creation_auto_enrolls_matching_course(self):
        student_user = User.objects.create_user(
            email="student@example.com",
            password="testpass123",
            full_name="Student User",
            role=UserRole.STUDENT,
        )
        profile = StudentProfile.objects.create(
            user=student_user,
            major=self.major,
            student_number="STU-3",
            current_semester=self.semester,
        )

        enrollment = Enrollment.objects.get(student=profile, course=self.course)
        self.assertEqual(enrollment.status, EnrollmentStatus.ACTIVE)

    def test_enrollment_admin_is_view_only(self):
        admin_user = User.objects.create_user(
            email="admin@example.com",
            password="testpass123",
            full_name="Admin User",
            role=UserRole.ADMIN,
        )
        request = self.factory.get("/admin/")
        request.user = admin_user
        model_admin = EnrollmentAdmin(Enrollment, admin.site)

        self.assertFalse(model_admin.has_add_permission(request))
        self.assertFalse(model_admin.has_change_permission(request))
        self.assertFalse(model_admin.has_delete_permission(request))
