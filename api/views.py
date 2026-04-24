from decimal import Decimal

from django.db.models import Avg, Count, Q
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from academics.models import Major
from accounts.forms import StudentRegistrationForm
from accounts.models import ProfessorProfile, StudentProfile, User, UserRole
from assignments.forms import AssignmentCreateForm, GradeSubmissionForm
from assignments.models import Assignment, Submission, SubmissionStatus
from communications.forms import ProfessorAnnouncementForm
from communications.models import Announcement, AnnouncementScope, AnnouncementStatus
from courses.forms import CourseMaterialUploadForm
from courses.models import Course, CourseMaterial, Enrollment, EnrollmentStatus
from courses.views import _professor_courses


def require_role(user, *roles):
    if getattr(user, "role", None) == UserRole.ADMIN:
        return
    if getattr(user, "role", None) not in roles:
        raise PermissionDenied("You do not have access to this resource.")


def to_float(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def file_url(file_field):
    if not file_field:
        return None
    try:
        return file_field.url
    except ValueError:
        return None


def get_professor_name(course):
    teaching_assignment = course.teaching_assignments.select_related("professor__user").first()
    if not teaching_assignment:
        return "Unassigned"
    return teaching_assignment.professor.user.full_name


def serialize_user(user):
    student_profile = getattr(user, "student_profile", None)
    professor_profile = getattr(user, "professor_profile", None)
    return {
        "id": str(user.id),
        "name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "avatar": None,
        "joined": user.date_joined.isoformat(),
        "student_profile": {
            "id": str(student_profile.id),
            "student_number": student_profile.student_number,
            "major": student_profile.major.name if student_profile.major_id else "",
            "semester": student_profile.current_semester.name if student_profile.current_semester else None,
        }
        if student_profile
        else None,
        "professor_profile": {
            "id": str(professor_profile.id),
            "department": professor_profile.department,
            "employee_code": professor_profile.employee_code,
            "office": professor_profile.office,
        }
        if professor_profile
        else None,
    }


def serialize_auth_payload(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": serialize_user(user),
    }


def serialize_major(major):
    return {
        "id": str(major.id),
        "name": major.name,
        "code": major.code,
    }


def authenticate_api_user(email, password):
    normalized_email = (email or "").strip()
    if not normalized_email or not password:
        return None

    user = User.objects.filter(email__iexact=normalized_email).first()
    if user is None or not user.is_active:
        return None
    if not user.check_password(password):
        return None
    return user


def serialize_material_item(material):
    if isinstance(material, CourseMaterial):
        return {
            "id": str(material.id),
            "title": material.title,
            "url": file_url(material.file),
            "uploaded_at": material.uploaded_at.isoformat(),
            "uploaded_by": material.uploaded_by.full_name,
            "kind": "course_material",
        }
    return {
        "id": str(material.id),
        "title": material.title,
        "url": file_url(material.file) or material.external_url,
        "uploaded_at": material.created_at.isoformat(),
        "uploaded_by": material.uploaded_by.user.full_name,
        "kind": "study_material",
    }


def student_submission_for_assignment(student_profile, assignment):
    return (
        Submission.objects.filter(
            assignment=assignment,
            is_deleted=False,
        )
        .filter(Q(student=student_profile) | Q(group__members=student_profile))
        .order_by("-submitted_at")
        .first()
    )


def serialize_assignment(assignment, student_profile=None):
    submission = student_submission_for_assignment(student_profile, assignment) if student_profile else None
    return {
        "id": str(assignment.id),
        "title": assignment.title,
        "description": assignment.description,
        "course_id": str(assignment.course_id),
        "course_code": assignment.course.code,
        "course_title": assignment.course.title,
        "due_at": assignment.due_at.isoformat(),
        "open_at": assignment.open_at.isoformat(),
        "max_score": to_float(assignment.max_score),
        "is_published": assignment.is_published,
        "attachment_url": file_url(assignment.attachment),
        "submission_status": submission.status if submission else "not_submitted",
        "submitted_at": submission.submitted_at.isoformat() if submission else None,
        "grade": to_float(submission.score) if submission and submission.score is not None else None,
        "feedback": submission.feedback if submission else "",
        "submission_id": str(submission.id) if submission else None,
        "submissions_count": getattr(assignment, "submission_count", None),
    }


def serialize_announcement(announcement):
    publish_date = announcement.publish_date or announcement.created_at
    return {
        "id": str(announcement.id),
        "title": announcement.title,
        "content": announcement.content,
        "scope": announcement.scope,
        "status": announcement.status,
        "priority": announcement.priority,
        "publish_date": publish_date.isoformat() if publish_date else None,
        "expiry_date": announcement.expiry_date.isoformat() if announcement.expiry_date else None,
        "attachment_url": file_url(announcement.attachment),
        "course": {
            "id": str(announcement.course_id),
            "code": announcement.course.code,
            "title": announcement.course.title,
        }
        if announcement.course_id
        else None,
        "created_by": announcement.created_by.full_name if announcement.created_by_id else None,
        "created_at": announcement.created_at.isoformat() if announcement.created_at else None,
        "updated_at": announcement.updated_at.isoformat() if announcement.updated_at else None,
    }


def serialize_submission(submission):
    student_name = submission.student.user.full_name if submission.student_id else submission.group.name
    student_number = submission.student.student_number if submission.student_id else None
    return {
        "id": str(submission.id),
        "student_name": student_name,
        "student_number": student_number,
        "submitted_at": submission.submitted_at.isoformat(),
        "file_url": file_url(submission.file),
        "grade": to_float(submission.score) if submission.score is not None else None,
        "feedback": submission.feedback,
        "status": submission.status,
    }


def serialize_course(course):
    return {
        "id": str(course.id),
        "code": course.code,
        "title": course.title,
        "description": course.description,
        "credits": course.credits,
        "is_active": course.is_active,
        "semester": {
            "id": str(course.semester_id),
            "name": course.semester.name,
            "year": course.semester.year,
            "term": course.semester.term,
        },
        "professor_name": get_professor_name(course),
        "enrolled_count": getattr(course, "enrolled_count", None),
    }


def professor_accessible_courses(user):
    if user.role == UserRole.ADMIN:
        return Course.objects.all()
    return _professor_courses(user)


def professor_profile_for_write(user):
    if user.role == UserRole.PROFESSOR:
        return getattr(user, "professor_profile", None)
    return ProfessorProfile.objects.select_related("user").first()


def published_announcements_queryset():
    now = timezone.now()
    return Announcement.objects.filter(
        status=AnnouncementStatus.PUBLISHED,
        publish_date__lte=now,
    ).filter(
        Q(expiry_date__isnull=True) | Q(expiry_date__gt=now)
    ).select_related("created_by", "course")


def student_announcements_queryset(user):
    student_profile = getattr(user, "student_profile", None)
    if student_profile is None:
        return published_announcements_queryset().none()
    enrolled_courses = Course.objects.filter(enrollments__student=student_profile).distinct()
    return (
        published_announcements_queryset()
        .filter(
            Q(scope=AnnouncementScope.GLOBAL)
            | Q(scope=AnnouncementScope.COURSE, course__in=enrolled_courses)
            | Q(scope=AnnouncementScope.GROUP, target_audience__members=student_profile)
        )
        .distinct()
    )


def course_materials_for(course):
    materials = list(course.course_materials.select_related("uploaded_by").all())
    study_materials = list(course.materials.filter(is_published=True).select_related("uploaded_by__user"))
    if course.material:
        synthetic = {
            "id": f"{course.id}-core",
            "title": f"{course.title} core material",
            "url": file_url(course.material),
            "uploaded_at": course.updated_at.isoformat(),
            "uploaded_by": "Course record",
            "kind": "course_core",
        }
        serialized = [synthetic]
    else:
        serialized = []
    serialized.extend(serialize_material_item(material) for material in materials)
    serialized.extend(serialize_material_item(material) for material in study_materials)
    serialized.sort(key=lambda item: item["uploaded_at"], reverse=True)
    return serialized


def ensure_student_enrollment(user, course):
    profile = getattr(user, "student_profile", None)
    if user.role != UserRole.STUDENT or profile is None:
        return None
    if not course.majors.filter(pk=profile.major_id).exists():
        return None
    enrollment, _created = Enrollment.objects.get_or_create(
        student=profile,
        course=course,
        semester=course.semester,
        defaults={"status": EnrollmentStatus.ACTIVE},
    )
    return enrollment


@api_view(["POST"])
@permission_classes([AllowAny])
def auth_login(request):
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""
    user = authenticate_api_user(email, password)
    if user is None or not user.is_active:
        return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

    return Response(serialize_auth_payload(user))


@api_view(["POST"])
@permission_classes([AllowAny])
def auth_register_student(request):
    form = StudentRegistrationForm(
        {
            "full_name": (request.data.get("full_name") or "").strip(),
            "email": (request.data.get("email") or "").strip(),
            "major": request.data.get("major_id") or request.data.get("major"),
            "password1": request.data.get("password") or "",
            "password2": request.data.get("password_confirmation") or request.data.get("password") or "",
        }
    )
    if not form.is_valid():
        return Response(
            {
                "detail": "Registration failed.",
                "errors": form.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = form.save()
    except Exception:
        return Response(
            {"detail": "Registration failed while creating the student account."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.refresh_from_db()
    return Response(serialize_auth_payload(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def auth_logout(request):
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
    if "rest_framework_simplejwt.token_blacklist" in settings.INSTALLED_APPS:
        try:
            RefreshToken(refresh_token).blacklist()
        except Exception:
            pass
    return Response({"detail": "Logged out."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_me(request):
    return Response(serialize_user(request.user))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    require_role(request.user, UserRole.STUDENT)
    student_profile = getattr(request.user, "student_profile", None)
    if student_profile is None:
        return Response(
            {
                "courses_count": 0,
                "pending_assignments": 0,
                "average_grade": None,
                "upcoming_deadlines_count": 0,
                "deadlines": [],
                "announcements": [],
                "recent_courses": [],
            }
        )
    enrollments = Enrollment.objects.filter(student=student_profile).select_related("course__semester")
    courses = [enrollment.course for enrollment in enrollments]
    course_ids = [course.id for course in courses]
    assignments = (
        Assignment.objects.filter(course_id__in=course_ids, is_published=True)
        .select_related("course")
        .order_by("due_at")
    )
    submissions = Submission.objects.filter(student=student_profile).select_related("assignment__course")
    submitted_assignment_ids = set(submissions.values_list("assignment_id", flat=True))
    pending_assignments = [assignment for assignment in assignments if assignment.id not in submitted_assignment_ids]
    upcoming_deadlines = []
    for assignment in pending_assignments[:5]:
        days_left = max((assignment.due_at.date() - timezone.now().date()).days, 0)
        upcoming_deadlines.append(
            {
                "id": str(assignment.id),
                "assignment": assignment.title,
                "course": assignment.course.title,
                "due_at": assignment.due_at.isoformat(),
                "days_left": days_left,
            }
        )

    recent_courses = []
    for course in courses[:5]:
        course_assignments = [assignment for assignment in assignments if assignment.course_id == course.id]
        total_assignments = len(course_assignments)
        submitted_count = sum(1 for assignment in course_assignments if assignment.id in submitted_assignment_ids)
        recent_courses.append(
            {
                **serialize_course(course),
                "submitted_assignments": submitted_count,
                "total_assignments": total_assignments,
                "progress": (submitted_count / total_assignments * 100) if total_assignments else 0,
            }
        )

    average_grade = submissions.exclude(score__isnull=True).aggregate(avg=Avg("score"))["avg"]
    try:
        announcements = [
            serialize_announcement(item)
            for item in student_announcements_queryset(request.user).order_by("-priority", "-publish_date")[:5]
        ]
    except Exception:
        announcements = []
    return Response(
        {
            "courses_count": len(courses),
            "pending_assignments": len(pending_assignments),
            "average_grade": to_float(average_grade),
            "upcoming_deadlines_count": len(upcoming_deadlines),
            "deadlines": upcoming_deadlines,
            "announcements": announcements,
            "recent_courses": recent_courses,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_courses(request):
    require_role(request.user, UserRole.STUDENT)
    student_profile = getattr(request.user, "student_profile", None)
    if student_profile is None:
        return Response({"results": []})
    courses = (
        Course.objects.filter(
            Q(enrollments__student=student_profile)
            | Q(majors=student_profile.major)
        )
        .select_related("semester")
        .distinct()
    )
    return Response({"results": [serialize_course(course) for course in courses]})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_course_detail(request, course_id):
    require_role(request.user, UserRole.STUDENT)
    student_profile = getattr(request.user, "student_profile", None)
    if student_profile is None:
        return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
    course = (
        Course.objects.filter(id=course_id)
        .filter(
            Q(enrollments__student=student_profile)
            | Q(majors=student_profile.major)
        )
        .select_related("semester")
        .distinct()
        .first()
    )
    if course is None:
        raise PermissionDenied("Course not found.")
    ensure_student_enrollment(request.user, course)

    assignments = Assignment.objects.filter(course=course, is_published=True).select_related("course").order_by("due_at")
    announcements = student_announcements_queryset(request.user).filter(
        Q(scope=AnnouncementScope.GLOBAL) | Q(course=course)
    ).distinct().order_by("-priority", "-publish_date")
    return Response(
        {
            **serialize_course(course),
            "materials": course_materials_for(course),
            "assignments": [serialize_assignment(assignment, student_profile) for assignment in assignments],
            "announcements": [serialize_announcement(item) for item in announcements],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_assignments(request):
    require_role(request.user, UserRole.STUDENT)
    student_profile = getattr(request.user, "student_profile", None)
    if student_profile is None:
        return Response({"results": []})
    assignments = (
        Assignment.objects.filter(
            course__enrollments__student=student_profile,
            is_published=True,
        )
        .select_related("course")
        .distinct()
        .order_by("due_at")
    )
    return Response({"results": [serialize_assignment(assignment, student_profile) for assignment in assignments]})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def student_submit_assignment(request, assignment_id):
    require_role(request.user, UserRole.STUDENT)
    student_profile = getattr(request.user, "student_profile", None)
    if student_profile is None:
        return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
    assignment = Assignment.objects.filter(
        id=assignment_id,
        course__enrollments__student=student_profile,
        is_published=True,
    ).select_related("course").first()
    if assignment is None:
        raise PermissionDenied("Assignment not found.")
    upload = request.FILES.get("file")
    if upload is None:
        return Response({"detail": "File is required."}, status=status.HTTP_400_BAD_REQUEST)

    submission = Submission.objects.filter(
        assignment=assignment,
        student=student_profile,
        is_deleted=False,
    ).order_by("-submitted_at").first()
    if submission is None:
        submission = Submission(
            assignment=assignment,
            student=student_profile,
        )
    submission.file = upload
    submission.content_text = request.data.get("content_text", "")
    submission.status = SubmissionStatus.PENDING
    submission.is_deleted = False
    submission.save()
    return Response(serialize_submission(submission), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_grades(request):
    require_role(request.user, UserRole.STUDENT)
    student_profile = getattr(request.user, "student_profile", None)
    if student_profile is None:
        return Response({"overall_average": None, "graded_count": 0, "results": []})
    submissions = (
        Submission.objects.filter(
            student=student_profile,
            is_deleted=False,
        )
        .exclude(score__isnull=True)
        .select_related("assignment__course")
        .order_by("-graded_at", "-submitted_at")
    )
    overall_average = submissions.aggregate(avg=Avg("score"))["avg"]
    results = []
    for submission in submissions:
        results.append(
            {
                "id": str(submission.id),
                "assignment": submission.assignment.title,
                "course": submission.assignment.course.title,
                "submitted_at": submission.submitted_at.isoformat(),
                "grade": to_float(submission.score),
                "max_score": to_float(submission.assignment.max_score),
                "feedback": submission.feedback,
                "status": submission.status,
            }
        )
    return Response(
        {
            "overall_average": to_float(overall_average),
            "graded_count": len(results),
            "results": results,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_announcements(request):
    require_role(request.user, UserRole.STUDENT)
    announcements = student_announcements_queryset(request.user).order_by("-priority", "-publish_date")
    return Response({"results": [serialize_announcement(item) for item in announcements]})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def professor_dashboard(request):
    require_role(request.user, UserRole.PROFESSOR)
    courses = professor_accessible_courses(request.user)
    recent_assignments = []
    recent_submissions = []
    pending_submissions = 0
    try:
        recent_assignments = list(
            Assignment.objects.filter(course__in=courses)
            .select_related("course")
            .annotate(submission_count=Count("submissions"))
            .order_by("-created_at")[:5]
        )
        recent_submissions = list(
            Submission.objects.filter(assignment__course__in=courses, is_deleted=False)
            .select_related("assignment__course", "student__user", "group")
            .order_by("-submitted_at")[:5]
        )
        pending_submissions = Submission.objects.filter(
            assignment__course__in=courses,
            status=SubmissionStatus.PENDING,
        ).count()
    except Exception:
        recent_assignments = []
        recent_submissions = []
        pending_submissions = 0
    return Response(
        {
            "courses_count": courses.count(),
            "pending_submissions": pending_submissions,
            "enrolled_students": Enrollment.objects.filter(
                course__in=courses,
                status=EnrollmentStatus.ACTIVE,
            )
            .values("student")
            .distinct()
            .count(),
            "recent_assignments": [
                {
                    **serialize_assignment(assignment),
                    "submission_count": assignment.submission_count,
                }
                for assignment in recent_assignments
            ],
            "recent_submissions": [serialize_submission(submission) | {
                "assignment": submission.assignment.title,
                "course": submission.assignment.course.title,
            } for submission in recent_submissions],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def professor_courses(request):
    require_role(request.user, UserRole.PROFESSOR)
    courses = professor_accessible_courses(request.user)
    return Response({"results": [serialize_course(course) for course in courses]})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def professor_course_detail(request, course_id):
    require_role(request.user, UserRole.PROFESSOR)
    course = professor_accessible_courses(request.user).filter(id=course_id).select_related("semester").first()
    if course is None:
        raise PermissionDenied("Course not found.")
    assignments = Assignment.objects.filter(course=course).select_related("course").order_by("-created_at")
    students = Enrollment.objects.filter(course=course).select_related("student__user").order_by("student__user__full_name")
    return Response(
        {
            **serialize_course(course),
            "students": [
                {
                    "id": str(enrollment.student.id),
                    "name": enrollment.student.user.full_name,
                    "student_number": enrollment.student.student_number,
                    "enrollment_date": enrollment.enrolled_at.isoformat(),
                    "status": enrollment.status,
                }
                for enrollment in students
            ],
            "materials": course_materials_for(course),
            "assignments": [serialize_assignment(assignment) for assignment in assignments],
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def professor_upload_material(request, course_id):
    require_role(request.user, UserRole.PROFESSOR)
    course = professor_accessible_courses(request.user).filter(id=course_id).first()
    if course is None:
        raise PermissionDenied("Course not found.")
    form = CourseMaterialUploadForm(request.data, request.FILES)
    if not form.is_valid():
        raise ValidationError(form.errors)
    material = form.save(commit=False)
    material.course = course
    material.uploaded_by = request.user
    material.save()
    return Response(serialize_material_item(material), status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def professor_assignments(request):
    require_role(request.user, UserRole.PROFESSOR)
    if request.method == "GET":
        if request.user.role == UserRole.ADMIN:
            assignments = Assignment.objects.select_related("course").order_by("-created_at")
            return Response({"results": [serialize_assignment(assignment) for assignment in assignments]})
        if not hasattr(request.user, "professor_profile"):
            return Response({"results": []})
        assignments = (
            Assignment.objects.filter(created_by=request.user.professor_profile)
            .select_related("course")
            .order_by("-created_at")
        )
        return Response({"results": [serialize_assignment(assignment) for assignment in assignments]})

    write_profile = professor_profile_for_write(request.user)
    if write_profile is None:
        return Response(
            {"detail": "Create a professor account before creating assignments."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    form = AssignmentCreateForm(
        request.data,
        request.FILES,
        professor_profile=None if request.user.role == UserRole.ADMIN else write_profile,
    )
    if not form.is_valid():
        raise ValidationError(form.errors)
    assignment = form.save(commit=False)
    assignment.created_by = write_profile
    assignment.save()
    return Response(serialize_assignment(assignment), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def professor_assignment_submissions(request, assignment_id):
    require_role(request.user, UserRole.PROFESSOR)
    assignment = Assignment.objects.filter(
        id=assignment_id,
    ).select_related("course").first()
    if assignment is not None and request.user.role != UserRole.ADMIN:
        assignment = Assignment.objects.filter(
            id=assignment_id,
            course__teaching_assignments__professor=request.user.professor_profile,
        ).select_related("course").first()
    if assignment is None:
        raise PermissionDenied("Assignment not found.")
    submissions = Submission.objects.filter(
        assignment=assignment,
        is_deleted=False,
    ).select_related("student__user", "group").order_by("-submitted_at")
    total_students = Enrollment.objects.filter(course=assignment.course, status=EnrollmentStatus.ACTIVE).count()
    return Response(
        {
            "assignment": serialize_assignment(assignment),
            "stats": {
                "total_submissions": submissions.count(),
                "graded": submissions.filter(status__in=[SubmissionStatus.GRADED, SubmissionStatus.RETURNED]).count(),
                "pending": submissions.filter(status=SubmissionStatus.PENDING).count(),
                "not_submitted": max(total_students - submissions.count(), 0),
            },
            "results": [serialize_submission(submission) for submission in submissions],
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def professor_grade_submission(request, submission_id):
    require_role(request.user, UserRole.PROFESSOR)
    submission_queryset = Submission.objects.filter(id=submission_id, is_deleted=False)
    if request.user.role != UserRole.ADMIN:
        submission_queryset = submission_queryset.filter(
            assignment__course__teaching_assignments__professor=request.user.professor_profile,
        )
    submission = submission_queryset.select_related("assignment", "student__user", "group").first()
    if submission is None:
        raise PermissionDenied("Submission not found.")
    form = GradeSubmissionForm(request.data, instance=submission, assignment=submission.assignment)
    if not form.is_valid():
        raise ValidationError(form.errors)
    reviewed_submission = form.save(commit=False)
    reviewed_submission.score = form.cleaned_data["grade"]
    reviewed_submission.status = SubmissionStatus.RETURNED
    reviewed_submission.graded_by = professor_profile_for_write(request.user)
    reviewed_submission.graded_at = timezone.now()
    reviewed_submission.save()
    return Response(serialize_submission(reviewed_submission))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def professor_stats(request):
    require_role(request.user, UserRole.PROFESSOR)
    courses = professor_accessible_courses(request.user)
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
                    "student_name": student.user.full_name,
                    "student_number": student.student_number,
                    "missing_count": missing_count,
                }
            )
    return Response(
        {
            "total_submissions": submissions.count(),
            "pending_submissions": submissions.filter(status=SubmissionStatus.PENDING).count(),
            "not_submitted_count": len(missing_submissions),
            "overall_avg_grade": to_float(submissions.exclude(score__isnull=True).aggregate(avg=Avg("score"))["avg"]),
            "assignments": [
                {
                    "id": str(assignment.id),
                    "title": assignment.title,
                    "course": assignment.course.title,
                    "submissions_received": assignment.submissions_received,
                    "submissions_pending": assignment.submissions_pending,
                    "average_grade": to_float(assignment.average_grade),
                }
                for assignment in assignments
            ],
            "missing_students": missing_submissions,
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def professor_announcements(request):
    require_role(request.user, UserRole.PROFESSOR)
    if request.method == "GET":
        if request.user.role == UserRole.ADMIN:
            announcements = Announcement.objects.select_related("course", "created_by").order_by("-created_at")
            return Response({"results": [serialize_announcement(item) for item in announcements]})
        announcements = Announcement.objects.filter(created_by=request.user).select_related("course").order_by("-created_at")
        return Response({"results": [serialize_announcement(item) for item in announcements]})

    form = ProfessorAnnouncementForm(request.data, request.FILES, user=request.user)
    if not form.is_valid():
        raise ValidationError(form.errors)
    announcement = form.save(commit=False)
    announcement.created_by = request.user
    announcement.save()
    form.save_m2m()
    return Response(serialize_announcement(announcement), status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def professor_announcement_detail(request, announcement_id):
    require_role(request.user, UserRole.PROFESSOR)
    announcement_queryset = Announcement.objects.filter(id=announcement_id)
    if request.user.role != UserRole.ADMIN:
        announcement_queryset = announcement_queryset.filter(created_by=request.user)
    announcement = announcement_queryset.select_related("course").first()
    if announcement is None:
        raise PermissionDenied("Announcement not found.")

    if request.method == "DELETE":
        announcement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    for field in ["title", "content", "scope", "status"]:
        if field in request.data:
            setattr(announcement, field, request.data.get(field))
    if "priority" in request.data:
        announcement.priority = int(request.data.get("priority"))
    if "send_notification" in request.data:
        announcement.send_notification = str(request.data.get("send_notification")).lower() in {"1", "true", "yes", "on"}
    if "course" in request.data:
        course_id = request.data.get("course")
        announcement.course = professor_accessible_courses(request.user).filter(id=course_id).first() if course_id else None
    if "publish_date" in request.data:
        announcement.publish_date = parse_datetime(request.data.get("publish_date")) or announcement.publish_date
    if "expiry_date" in request.data:
        expiry_value = request.data.get("expiry_date")
        announcement.expiry_date = parse_datetime(expiry_value) if expiry_value else None
    if "attachment" in request.FILES:
        announcement.attachment = request.FILES["attachment"]
    announcement.full_clean()
    announcement.save()
    return Response(serialize_announcement(announcement))

@api_view(["GET"])
@permission_classes([AllowAny])
def public_stats(request):
    return Response(
        {
            "students_count": StudentProfile.objects.count(),
            "courses_count": Course.objects.count(),
            "professors_count": ProfessorProfile.objects.count(),
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def public_majors(request):
    majors = Major.objects.filter(is_active=True).order_by("name")
    return Response({"results": [serialize_major(major) for major in majors]})
