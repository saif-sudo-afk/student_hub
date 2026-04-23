from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import StudentProfile

from .models import CourseMajor, Enrollment, EnrollmentStatus


def sync_student_enrollments(student_profile):
    course_major_qs = (
        CourseMajor.objects.select_related("course", "course__semester")
        .filter(major=student_profile.major, course__is_active=True)
        .distinct()
    )
    if student_profile.current_semester_id:
        course_major_qs = course_major_qs.filter(course__semester=student_profile.current_semester)

    for course_major in course_major_qs:
        Enrollment.objects.get_or_create(
            student=student_profile,
            course=course_major.course,
            semester=course_major.course.semester,
            defaults={"status": EnrollmentStatus.ACTIVE},
        )


@receiver(post_save, sender=StudentProfile)
def create_enrollments_for_student_profile(sender, instance, **kwargs):
    sync_student_enrollments(instance)


@receiver(post_save, sender=CourseMajor)
def create_enrollments_for_course_major(sender, instance, **kwargs):
    if not instance.course.is_active:
        return
    profiles = StudentProfile.objects.filter(major=instance.major).select_related(
        "major", "current_semester"
    )
    for profile in profiles:
        if profile.current_semester_id and profile.current_semester_id != instance.course.semester_id:
            continue
        Enrollment.objects.get_or_create(
            student=profile,
            course=instance.course,
            semester=instance.course.semester,
            defaults={"status": EnrollmentStatus.ACTIVE},
        )
    # FIX-ADMIN-13 done
