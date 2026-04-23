from datetime import timedelta

from django.contrib import admin
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, RequestFactory, TestCase
from django.urls import reverse
from django.utils import timezone

from academics.models import Major, Semester, TermType
from accounts.models import ProfessorProfile, StudentProfile, User, UserRole

from .admin import EnrollmentAdmin
from .models import Course, CourseMajor, CourseMaterial, Enrollment, EnrollmentStatus, TeachingAssignment


class EnrollmentAutomationTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.client = Client()
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
        self.professor_user = User.objects.create_user(
            email="prof@example.com",
            password="testpass123",
            full_name="Professor User",
            role=UserRole.PROFESSOR,
        )
        self.professor_profile = ProfessorProfile.objects.create(
            user=self.professor_user,
            department="Engineering",
            employee_code="EMP-COURSE",
        )
        TeachingAssignment.objects.create(
            professor=self.professor_profile,
            course=self.course,
        )

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

    def test_professor_course_detail_accepts_material_upload(self):
        self.client.force_login(self.professor_user)
        response = self.client.post(
            reverse("courses:course_detail", args=[self.course.id]),
            {
                "action": "upload_material",
                "material-title": "Lecture 1",
                "material-file": SimpleUploadedFile(
                    "lecture1.pdf",
                    b"pdf-bytes",
                    content_type="application/pdf",
                ),
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            CourseMaterial.objects.filter(course=self.course, title="Lecture 1").exists()
        )
