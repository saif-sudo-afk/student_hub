import uuid

from django.core.exceptions import ValidationError
from django.db import models


class EnrollmentStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    WITHDRAWN = "withdrawn", "Withdrawn"  # FIX-ADMIN-13 done


class MaterialType(models.TextChoices):
    PDF = "pdf", "PDF"
    SLIDES = "slides", "Slides"
    VIDEO = "video", "Video"
    LINK = "link", "Link"
    OTHER = "other", "Other"


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    material = models.FileField(
        upload_to="courses/materials/", blank=True, null=True
    )  # FIX-ADMIN-12 done
    credits = models.PositiveSmallIntegerField(default=1)
    semester = models.ForeignKey(
        "academics.Semester", on_delete=models.PROTECT, related_name="courses"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    majors = models.ManyToManyField(
        "academics.Major", through="CourseMajor", related_name="courses"
    )

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.title}"


class CourseMajor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="course_majors")
    major = models.ForeignKey(
        "academics.Major", on_delete=models.CASCADE, related_name="course_majors"
    )
    is_core = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["course", "major"], name="uniq_course_major")
        ]

    def __str__(self):
        return f"{self.course.code} <-> {self.major.code}"


class TeachingAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    professor = models.ForeignKey(
        "accounts.ProfessorProfile",
        on_delete=models.PROTECT,
        related_name="teaching_assignments",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="teaching_assignments"
    )
    is_primary = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["professor", "course"], name="uniq_professor_course_assignment"
            )
        ]

    def __str__(self):
        return f"{self.professor.user.full_name} -> {self.course.code}"


class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "accounts.StudentProfile", on_delete=models.CASCADE, related_name="enrollments"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    semester = models.ForeignKey(
        "academics.Semester", on_delete=models.PROTECT, related_name="enrollments"
    )
    status = models.CharField(
        max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.ACTIVE
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "course", "semester"], name="uniq_student_course_semester"
            )
        ]

    def __str__(self):
        return f"{self.student.user.email} - {self.course.code} ({self.semester})"


class StudyMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="materials")
    uploaded_by = models.ForeignKey(
        "accounts.ProfessorProfile", on_delete=models.PROTECT, related_name="materials"
    )
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    material_type = models.CharField(max_length=20, choices=MaterialType.choices)
    file = models.FileField(upload_to="materials/", blank=True, null=True)
    external_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.file and not self.external_url:
            raise ValidationError("Either file or external_url must be provided.")

    def __str__(self):
        return f"{self.course.code} - {self.title}"
