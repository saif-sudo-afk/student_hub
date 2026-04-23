from django.db.models import Q
from django.utils import timezone

from assignments.models import Assignment
from communications.models import Announcement, AnnouncementScope, AnnouncementStatus, CalendarEvent, EventVisibility
from courses.models import Course, StudyMaterial


class Intent:
    FIND_COURSE = "find_course"
    FIND_MATERIAL = "find_material"
    EXPLAIN_EVENT = "explain_event"
    ASSIGNMENT_HELP = "assignment_help"
    NAVIGATION_HELP = "navigation_help"


def detect_intent(query: str) -> str:
    q = query.lower()
    if any(k in q for k in ["course", "module", "class"]):
        return Intent.FIND_COURSE
    if any(k in q for k in ["material", "pdf", "slides", "lesson", "document"]):
        return Intent.FIND_MATERIAL
    if any(k in q for k in ["event", "calendar", "deadline", "exam"]):
        return Intent.EXPLAIN_EVENT
    if any(k in q for k in ["assignment", "tp", "td", "homework", "project"]):
        return Intent.ASSIGNMENT_HELP
    return Intent.NAVIGATION_HELP


def _student_scoped_courses(student_profile):
    return Course.objects.filter(
        Q(enrollments__student=student_profile) | Q(majors=student_profile.major)
    ).distinct()


def build_guided_answer(student_profile, query: str):
    intent = detect_intent(query)
    references = []
    lines = []
    scoped_courses = _student_scoped_courses(student_profile)
    now = timezone.now()

    if intent == Intent.FIND_COURSE:
        courses = scoped_courses[:5]
        if courses:
            lines.append("Here are relevant courses for your profile:")
            for course in courses:
                lines.append(f"- {course.code}: {course.title}")
                references.append({"type": "course", "id": str(course.id), "code": course.code})
        else:
            lines.append("I could not find courses linked to your current major/enrollments yet.")

    elif intent == Intent.FIND_MATERIAL:
        materials = StudyMaterial.objects.filter(course__in=scoped_courses, is_published=True)[:5]
        if materials:
            lines.append("Here are study materials you can access:")
            for material in materials:
                lines.append(f"- {material.title} ({material.course.code})")
                references.append(
                    {"type": "material", "id": str(material.id), "course": material.course.code}
                )
        else:
            lines.append("No published materials found for your current scope.")

    elif intent == Intent.EXPLAIN_EVENT:
        events = CalendarEvent.objects.filter(
            Q(visibility=EventVisibility.ALL)
            | Q(visibility=EventVisibility.STUDENTS)
        ).filter(
            Q(scope="global") | Q(major=student_profile.major) | Q(course__in=scoped_courses)
        ).order_by("start_at")[:5]
        if events:
            lines.append("Upcoming academic events for you:")
            for event in events:
                lines.append(f"- {event.title} ({event.event_type})")
                references.append({"type": "event", "id": str(event.id)})
        else:
            lines.append("No upcoming events are currently available for your profile.")

    elif intent == Intent.ASSIGNMENT_HELP:
        assignments = Assignment.objects.filter(course__in=scoped_courses, is_published=True).order_by(
            "due_at"
        )[:5]
        if assignments:
            lines.append("Your relevant assignments:")
            for assignment in assignments:
                lines.append(
                    f"- {assignment.title} [{assignment.assignment_type.upper()}] due {assignment.due_at:%Y-%m-%d}"
                )
                references.append({"type": "assignment", "id": str(assignment.id)})
        else:
            lines.append("No published assignments found right now.")

    else:
        announcements = Announcement.objects.filter(
            status=AnnouncementStatus.PUBLISHED,
            publish_date__lte=now,
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gt=now)
        ).filter(
            Q(scope=AnnouncementScope.GLOBAL)
            | Q(scope=AnnouncementScope.COURSE, course__in=scoped_courses)
            | Q(
                scope=AnnouncementScope.GROUP,
                target_audience__members=student_profile,
            )
        ).distinct()[:3]
        lines.append("I can help you find courses, materials, events, and assignments.")
        lines.append("Try asking: 'show my materials' or 'what deadlines do I have?'")
        for ann in announcements:
            references.append({"type": "announcement", "id": str(ann.id), "title": ann.title})

    return intent, "\n".join(lines), references
