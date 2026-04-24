import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class AudienceScope(models.TextChoices):
    GLOBAL = "global", "Global"
    MAJOR = "major", "Major"
    COURSE = "course", "Course"


class AnnouncementScope(models.TextChoices):
    GLOBAL = "global", "Global"
    COURSE = "course", "Course"
    ROLE = "role", "Role"
    GROUP = "group", "Group"


class AnnouncementStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class AnnouncementPriority(models.IntegerChoices):
    NORMAL = 0, "Normal"
    IMPORTANT = 1, "Important"
    URGENT = 2, "Urgent"


class AnnouncementTargetRole(models.TextChoices):
    ALL = "all", "All"
    STUDENTS = "students", "Students"
    PROFESSORS = "professors", "Professors"
    ADMINS = "admins", "Admins"


class EventType(models.TextChoices):
    EXAM = "exam", "Exam"
    DEADLINE = "deadline", "Deadline"
    HOLIDAY = "holiday", "Holiday"
    MEETING = "meeting", "Meeting"
    OTHER = "other", "Other"


class EventVisibility(models.TextChoices):
    ALL = "all", "All"
    PROFESSORS = "professors", "Professors"
    STUDENTS = "students", "Students"
    ADMINS = "admins", "Admins"


class Announcement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="announcements",
        null=True,
    )
    last_updated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="updated_announcements",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    attachment = models.FileField(upload_to="announcements/", blank=True, null=True)
    scope = models.CharField(max_length=20, choices=AnnouncementScope.choices)
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="announcements",
        null=True,
        blank=True,
    )
    target_audience = models.ManyToManyField(
        "assignments.StudyGroup",
        related_name="announcements",
        blank=True,
    )
    target_role = models.CharField(
        max_length=20,
        choices=AnnouncementTargetRole.choices,
        default=AnnouncementTargetRole.ALL,
    )
    publish_date = models.DateTimeField(default=timezone.now)
    expiry_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AnnouncementStatus.choices,
        default=AnnouncementStatus.DRAFT,
    )
    priority = models.IntegerField(
        choices=AnnouncementPriority.choices,
        default=AnnouncementPriority.NORMAL,
    )
    send_notification = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.scope == AnnouncementScope.GLOBAL and self.course_id:
            raise ValidationError("Global announcement cannot target a specific course.")
        if self.scope == AnnouncementScope.COURSE and not self.course_id:
            raise ValidationError("Course-scoped announcement must target a course.")
        if self.scope == AnnouncementScope.ROLE and self.target_role == AnnouncementTargetRole.ALL:
            raise ValidationError("Role-scoped announcement must target a specific role.")
        if self.expiry_date and self.expiry_date <= self.publish_date:
            raise ValidationError("expiry_date must be after publish_date.")

    def __str__(self):
        return self.title
    # FIX-ADMIN-9 done


class CalendarEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="calendar_events"
    )
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    scope = models.CharField(max_length=20, choices=AudienceScope.choices)
    visibility = models.CharField(
        max_length=20,
        choices=EventVisibility.choices,
        default=EventVisibility.ALL,
    )  # FIX-ADMIN-11 done
    major = models.ForeignKey(
        "academics.Major",
        on_delete=models.CASCADE,
        related_name="calendar_events",
        null=True,
        blank=True,
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        related_name="calendar_events",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.end_at <= self.start_at:
            raise ValidationError("end_at must be after start_at.")
        if self.scope == AudienceScope.GLOBAL and (self.major_id or self.course_id):
            raise ValidationError("Global event cannot target a major or course.")
        if self.scope == AudienceScope.MAJOR and not self.major_id:
            raise ValidationError("Major-scoped event must target a major.")
        if self.scope == AudienceScope.COURSE and not self.course_id:
            raise ValidationError("Course-scoped event must target a course.")

    def __str__(self):
        return self.title
