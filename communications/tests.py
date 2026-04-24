from datetime import timedelta

from django.contrib import admin
from django.test import Client, RequestFactory, TestCase
from django.urls import reverse
from django.utils import timezone

from academics.models import Major, Semester, TermType
from accounts.models import ProfessorProfile, StudentProfile, User, UserRole
from courses.models import Course, CourseMajor, TeachingAssignment

from .admin import AnnouncementAdmin
from .models import (
    Announcement,
    AnnouncementScope,
    AnnouncementStatus,
    CalendarEvent,
    EventType,
    EventVisibility,
)


class CommunicationAdminTests(TestCase):
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
            code="CS102",
            title="Algorithms",
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
            employee_code="EMP-2",
        )
        TeachingAssignment.objects.create(
            professor=self.professor_profile,
            course=self.course,
        )

        self.student_user = User.objects.create_user(
            email="student@example.com",
            password="testpass123",
            full_name="Student User",
            role=UserRole.STUDENT,
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            major=self.major,
            student_number="STU-2",
            current_semester=self.semester,
        )

    def test_announcement_admin_blocks_student_management_and_actions(self):
        announcement = Announcement.objects.create(
            title="Draft",
            content="Announcement body",
            scope=AnnouncementScope.GLOBAL,
            status=AnnouncementStatus.DRAFT,
            created_by=self.professor_user,
        )
        request = self.factory.post("/admin/")
        request.user = self.student_user
        model_admin = AnnouncementAdmin(Announcement, admin.site)

        self.assertFalse(model_admin.has_module_permission(request))
        self.assertFalse(model_admin.has_change_permission(request, announcement))

        professor_request = self.factory.post("/admin/")
        professor_request.user = self.professor_user
        model_admin.archive_selected(
            professor_request, Announcement.objects.filter(pk=announcement.pk)
        )
        announcement.refresh_from_db()
        self.assertEqual(announcement.status, AnnouncementStatus.ARCHIVED)

        model_admin.republish_selected(
            professor_request, Announcement.objects.filter(pk=announcement.pk)
        )
        announcement.refresh_from_db()
        self.assertEqual(announcement.status, AnnouncementStatus.PUBLISHED)
        self.assertIsNone(announcement.expiry_date)

    def test_calendar_list_filters_events_by_visibility(self):
        CalendarEvent.objects.create(
            title="Student Event",
            description="Visible to students",
            event_type=EventType.MEETING,
            start_at=timezone.now(),
            end_at=timezone.now() + timedelta(hours=2),
            scope="global",
            visibility=EventVisibility.STUDENTS,
            created_by=self.professor_user,
        )
        CalendarEvent.objects.create(
            title="Professor Event",
            description="Visible to professors",
            event_type=EventType.MEETING,
            start_at=timezone.now(),
            end_at=timezone.now() + timedelta(hours=2),
            scope="global",
            visibility=EventVisibility.PROFESSORS,
            created_by=self.professor_user,
        )

        self.client.force_login(self.student_user)
        response = self.client.get(reverse("communications:calendar_list"))

        self.assertContains(response, "Student Event")
        self.assertNotContains(response, "Professor Event")

    def test_professor_can_create_announcement_from_professor_interface(self):
        self.client.force_login(self.professor_user)
        response = self.client.post(
            reverse("professor_announcements:create"),
            {
                "title": "Course Notice",
                "content": "Read chapter 2.",
                "scope": AnnouncementScope.COURSE,
                "course": str(self.course.id),
                "publish_date": timezone.now().strftime("%Y-%m-%dT%H:%M"),
                "status": AnnouncementStatus.PUBLISHED,
                "priority": 1,
                "send_notification": "on",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            Announcement.objects.filter(
                created_by=self.professor_user,
                title="Course Notice",
            ).exists()
        )
