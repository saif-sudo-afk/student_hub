import uuid

from django.core.exceptions import ValidationError
from django.db import models


class AssignmentType(models.TextChoices):
    TP = "tp", "TP"
    TD = "td", "TD"
    HOMEWORK = "homework", "Homework"
    PROJECT = "project", "Project"


class SubmissionMode(models.TextChoices):
    INDIVIDUAL = "individual", "Individual"
    DUO = "duo", "Duo"
    GROUP = "group", "Group"


class SubmissionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    GRADED = "graded", "Graded"
    RETURNED = "returned", "Returned"
    ERROR = "error", "Error"


class Assignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="assignments"
    )
    created_by = models.ForeignKey(
        "accounts.ProfessorProfile",
        on_delete=models.PROTECT,
        related_name="assignments",
    )
    title = models.CharField(max_length=180)
    description = models.TextField()
    attachment = models.FileField(
        upload_to="assignments/attachments/", blank=True, null=True
    )  # FIX-ADMIN-5 done
    assignment_type = models.CharField(max_length=20, choices=AssignmentType.choices)
    submission_mode = models.CharField(max_length=20, choices=SubmissionMode.choices)
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=20)
    open_at = models.DateTimeField()
    due_at = models.DateTimeField()
    allow_late = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.due_at <= self.open_at:
            raise ValidationError("due_at must be after open_at.")

    def __str__(self):
        return f"{self.course.code} - {self.title}"


class StudyGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="groups"
    )
    name = models.CharField(max_length=120)
    leader = models.ForeignKey(
        "accounts.StudentProfile", on_delete=models.PROTECT, related_name="led_groups"
    )
    members = models.ManyToManyField(
        "accounts.StudentProfile",
        related_name="study_groups",
        blank=True,
    )  # FIX-ADMIN-6 done
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["assignment", "name"], name="uniq_group_name_per_assignment"
            )
        ]

    def __str__(self):
        return f"{self.assignment.title} - {self.name}"

class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        "accounts.StudentProfile",
        on_delete=models.CASCADE,
        related_name="individual_submissions",
        null=True,
        blank=True,
    )
    group = models.ForeignKey(
        StudyGroup,
        on_delete=models.CASCADE,
        related_name="submissions",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=SubmissionStatus.choices, default=SubmissionStatus.PENDING
    )
    content_text = models.TextField(blank=True)
    file = models.FileField(upload_to="submissions/", blank=True, null=True)
    is_deleted = models.BooleanField(default=False)  # FIX-ADMIN-7 done
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        "accounts.ProfessorProfile",
        on_delete=models.SET_NULL,
        related_name="graded_submissions",
        null=True,
        blank=True,
    )
    graded_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if bool(self.student) == bool(self.group):
            raise ValidationError("Submission must belong to exactly one owner: student or group.")
        if self.assignment.submission_mode == SubmissionMode.INDIVIDUAL and not self.student:
            raise ValidationError("Individual assignment requires a student submission owner.")
        if (
            self.assignment.submission_mode in [SubmissionMode.DUO, SubmissionMode.GROUP]
            and not self.group
        ):
            raise ValidationError("Duo/group assignment requires a group submission owner.")

    def __str__(self):
        return f"Submission<{self.assignment.title}>"
