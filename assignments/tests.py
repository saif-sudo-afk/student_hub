from datetime import timedelta

from django.contrib import admin
from django.test import RequestFactory, TestCase
from django.utils import timezone

from academics.models import Major, Semester, TermType
from accounts.models import ProfessorProfile, StudentProfile, User, UserRole
from courses.models import Course

from .admin import AssignmentAdmin, StudyGroupAdmin, SubmissionAdmin
from .models import Assignment, AssignmentType, StudyGroup, Submission, SubmissionMode


class AssignmentAdminTests(TestCase):
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
            code="CS101",
            title="Intro to CS",
            semester=self.semester,
        )

        self.professor_user = User.objects.create_user(
            email="prof@example.com",
            password="testpass123",
            full_name="Professor User",
            role=UserRole.PROFESSOR,
        )
        self.professor_user.refresh_from_db()
        self.professor_profile = ProfessorProfile.objects.create(
            user=self.professor_user,
            department="Engineering",
            employee_code="EMP-1",
        )

        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            password="testpass123",
            full_name="Admin User",
            role=UserRole.ADMIN,
        )
        self.admin_user.refresh_from_db()

        self.student_user = User.objects.create_user(
            email="student@example.com",
            password="testpass123",
            full_name="Student User",
            role=UserRole.STUDENT,
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            major=self.major,
            student_number="STU-1",
            current_semester=self.semester,
        )

        self.assignment = Assignment.objects.create(
            course=self.course,
            created_by=self.professor_profile,
            title="TP 1",
            description="First assignment",
            assignment_type=AssignmentType.TP,
            submission_mode=SubmissionMode.INDIVIDUAL,
            open_at=timezone.now(),
            due_at=timezone.now() + timedelta(days=7),
        )

    def test_assignment_admin_blocks_admin_role_mutations(self):
        model_admin = AssignmentAdmin(Assignment, admin.site)
        admin_request = self.factory.get("/admin/")
        admin_request.user = self.admin_user

        self.assertFalse(model_admin.has_add_permission(admin_request))
        self.assertFalse(model_admin.has_change_permission(admin_request, self.assignment))
        self.assertFalse(model_admin.has_delete_permission(admin_request, self.assignment))

    def test_study_group_admin_exposes_members_widget(self):
        self.assertIn("members", StudyGroupAdmin.filter_horizontal)

    def test_submission_admin_soft_delete_and_restore(self):
        study_group = StudyGroup.objects.create(
            assignment=self.assignment,
            name="Group 1",
            leader=self.student_profile,
        )
        study_group.members.add(self.student_profile)
        submission = Submission.objects.create(
            assignment=self.assignment,
            student=self.student_profile,
            status="pending",
        )
        model_admin = SubmissionAdmin(Submission, admin.site)
        request = self.factory.post("/admin/")
        request.user = self.admin_user

        self.assertFalse(model_admin.has_add_permission(request))
        model_admin.delete_queryset(request, Submission.objects.filter(pk=submission.pk))
        submission.refresh_from_db()
        self.assertTrue(submission.is_deleted)

        model_admin.restore_selected_submissions(request, Submission.objects.filter(pk=submission.pk))
        submission.refresh_from_db()
        self.assertFalse(submission.is_deleted)
