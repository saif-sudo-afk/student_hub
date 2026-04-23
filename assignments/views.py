import io
import os
import zipfile

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from accounts.decorators import professor_required
from accounts.models import UserRole
from courses.views import _visible_courses
from courses.views import _professor_courses

from .forms import AssignmentCreateForm, GradeSubmissionForm
from .models import Assignment, Submission, SubmissionStatus


@login_required
def assignment_list(request):
    courses = _visible_courses(request.user)
    queryset = Assignment.objects.filter(course__in=courses).select_related(
        "course", "created_by__user"
    )
    if request.user.role == UserRole.STUDENT:
        queryset = queryset.filter(is_published=True)
    assignments = queryset.order_by("due_at")
    return render(request, "assignments/assignment_list.html", {"assignments": assignments})


@professor_required
def create_assignment(request):
    professor_profile = request.user.professor_profile
    initial = {}
    course_id = request.GET.get("course")
    if course_id:
        initial["course"] = _professor_courses(request.user).filter(pk=course_id).first()

    form = AssignmentCreateForm(
        request.POST or None,
        request.FILES or None,
        professor_profile=professor_profile,
        initial=initial,
    )
    if request.method == "POST" and form.is_valid():
        assignment = form.save(commit=False)
        assignment.created_by = professor_profile
        assignment.save()
        messages.success(request, "Assignment created successfully.")
        return redirect("courses:course_detail", course_id=assignment.course_id)

    selected_course = initial.get("course")
    if request.method == "POST" and not selected_course:
        selected_course = form.fields["course"].queryset.filter(
            pk=request.POST.get("course")
        ).first()

    return render(
        request,
        "professor/create_assignment.html",
        {
            "form": form,
            "selected_course": selected_course,
        },
    )
    # FIX-PROF-2 done


def _submission_owner_name(submission):
    if submission.student_id:
        return submission.student.user.full_name
    if submission.group_id:
        return submission.group.name
    return "Unknown"


@professor_required
def submission_review(request, assignment_id):
    assignment = get_object_or_404(
        Assignment.objects.select_related("course").filter(
            course__teaching_assignments__professor=request.user.professor_profile
        ),
        pk=assignment_id,
    )
    submissions = Submission.objects.filter(
        assignment=assignment,
        is_deleted=False,
    ).select_related(
        "student__user",
        "group",
    ).order_by("-submitted_at")

    invalid_form = None
    invalid_submission_id = None

    if request.method == "POST":
        submission = get_object_or_404(submissions, pk=request.POST.get("submission_id"))
        form = GradeSubmissionForm(
            request.POST,
            instance=submission,
            assignment=assignment,
        )
        if form.is_valid():
            reviewed_submission = form.save(commit=False)
            reviewed_submission.score = form.cleaned_data["grade"]
            reviewed_submission.status = SubmissionStatus.RETURNED
            reviewed_submission.graded_by = request.user.professor_profile
            reviewed_submission.graded_at = timezone.now()
            reviewed_submission.save()
            messages.success(request, "Submission reviewed and returned.")
            return redirect("assignments:submission_review", assignment_id=assignment.id)
        invalid_form = form
        invalid_submission_id = submission.id

    submission_rows = []
    for submission in submissions:
        form = (
            invalid_form
            if invalid_submission_id == submission.id
            else GradeSubmissionForm(instance=submission, assignment=assignment)
        )
        submission_rows.append(
            {
                "submission": submission,
                "owner_name": _submission_owner_name(submission),
                "form": form,
            }
        )

    context = {
        "assignment": assignment,
        "submission_rows": submission_rows,
        "submission_count": submissions.count(),
        "pending_count": submissions.filter(status=SubmissionStatus.PENDING).count(),
    }
    return render(request, "professor/submission_review.html", context)
    # FIX-PROF-3 done


@professor_required
def download_all_submissions(request, assignment_id):
    assignment = get_object_or_404(
        Assignment.objects.filter(
            course__teaching_assignments__professor=request.user.professor_profile
        ),
        pk=assignment_id,
    )
    submissions = Submission.objects.filter(
        assignment=assignment,
        is_deleted=False,
        file__isnull=False,
    ).exclude(file="")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for submission in submissions:
            with submission.file.open("rb") as submission_file:
                filename = os.path.basename(submission.file.name)
                owner_name = _submission_owner_name(submission).replace(" ", "_")
                archive.writestr(f"{owner_name}_{filename}", submission_file.read())

    buffer.seek(0)
    response = StreamingHttpResponse(
        iter([buffer.getvalue()]),
        content_type="application/zip",
    )
    response["Content-Disposition"] = (
        f'attachment; filename="{assignment.course.code}_{assignment.title}_submissions.zip"'
    )
    return response
