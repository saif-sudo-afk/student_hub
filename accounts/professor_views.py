from django.db.models import Avg, Count, Q
from django.shortcuts import render
from django.utils import timezone

from accounts.decorators import professor_required
from assignments.models import Assignment, Submission, SubmissionStatus
from accounts.models import StudentProfile
from courses.models import Course, Enrollment, EnrollmentStatus


def _professor_courses(user):
    return Course.objects.filter(teaching_assignments__professor=user.professor_profile).distinct()


def _submission_owner_name(submission):
    if submission.student_id:
        return submission.student.user.full_name
    if submission.group_id:
        return submission.group.name
    return "Unknown"


@professor_required
def professor_dashboard(request):
    courses = _professor_courses(request.user)
    first_course = courses.first()
    recent_assignments = (
        Assignment.objects.filter(course__in=courses)
        .select_related("course")
        .annotate(
            submission_count=Count(
                "submissions",
                filter=Q(submissions__is_deleted=False),
            )
        )
        .order_by("-created_at")[:5]
    )
    recent_submissions = list(
        Submission.objects.filter(
            assignment__course__in=courses,
            is_deleted=False,
        )
        .select_related(
            "assignment__course",
            "student__user",
            "group",
        )
        .order_by("-submitted_at")[:5]
    )
    for submission in recent_submissions:
        submission.owner_name = _submission_owner_name(submission)

    context = {
        "courses_count": courses.count(),
        "pending_submissions": Submission.objects.filter(
            assignment__course__in=courses,
            is_deleted=False,
            status=SubmissionStatus.PENDING,
        ).count(),
        "enrolled_students": Enrollment.objects.filter(
            course__in=courses,
            status=EnrollmentStatus.ACTIVE,
        )
        .values("student")
        .distinct()
        .count(),
        "recent_assignments": recent_assignments,
        "recent_submissions": recent_submissions,
        "first_course": first_course,
    }
    return render(request, "professor/dashboard.html", context)
    # FIX-PROF-7 done


@professor_required
def professor_stats(request):
    courses = _professor_courses(request.user)
    assignments = (
        Assignment.objects.filter(course__in=courses)
        .select_related("course")
        .annotate(
            submissions_received=Count(
                "submissions",
                filter=Q(submissions__is_deleted=False),
            ),
            submissions_pending=Count(
                "submissions",
                filter=Q(
                    submissions__is_deleted=False,
                    submissions__status=SubmissionStatus.PENDING,
                ),
            ),
            average_grade=Avg(
                "submissions__score",
                filter=Q(submissions__is_deleted=False),
            ),
        )
        .order_by("due_at")
    )
    submissions = Submission.objects.filter(
        assignment__course__in=courses,
        is_deleted=False,
    )
    active_assignments = Assignment.objects.filter(
        course__in=courses,
        is_published=True,
        due_at__gte=timezone.now(),
    ).distinct()
    students = (
        StudentProfile.objects.filter(
            enrollments__course__in=courses,
            enrollments__status=EnrollmentStatus.ACTIVE,
        )
        .select_related("user")
        .distinct()
    )

    missing_submissions = []
    for student in students:
        missing_count = 0
        for assignment in active_assignments:
            has_submission = Submission.objects.filter(
                assignment=assignment,
                is_deleted=False,
            ).filter(Q(student=student) | Q(group__members=student)).exists()
            if not has_submission:
                missing_count += 1
        if missing_count:
            missing_submissions.append(
                {
                    "student": student,
                    "missing_count": missing_count,
                }
            )

    context = {
        "total_submissions": submissions.count(),
        "pending_submissions": submissions.filter(status=SubmissionStatus.PENDING).count(),
        "missing_students": missing_submissions,
        "overall_avg_grade": submissions.exclude(score__isnull=True).aggregate(avg=Avg("score"))[
            "avg"
        ],
        "assignment_stats": assignments,
        "not_submitted_count": len(missing_submissions),
    }
    return render(request, "professor/stats.html", context)
    # FIX-PROF-6 done
