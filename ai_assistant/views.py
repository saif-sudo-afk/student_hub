import json
from datetime import date, timedelta

from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count, Q
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_POST

from accounts.decorators import admin_required, professor_required
from accounts.models import User, UserRole
from assignments.models import Submission
from courses.models import Course

from .models import AIConversation, AIMessage, AIQueryLog, MessageRole
from .services import (
    NAVIGATION_MAP,
    ADMIN_SYSTEM_PROMPT,
    ask_llm,
    categorize_topic,
    extract_external_references,
    get_system_prompt,
)


def _get_existing_or_new_conversation(user):
    student_profile = getattr(user, "student_profile", None)
    conversation = AIConversation.objects.filter(user=user).order_by("-updated_at").first()
    if conversation is None and student_profile is not None:
        conversation = (
            AIConversation.objects.filter(student=student_profile)
            .order_by("-updated_at")
            .first()
        )
        if conversation and conversation.user_id != user.id:
            conversation.user = user
            conversation.save(update_fields=["user"])
    if conversation is None:
        conversation = AIConversation.objects.create(
            user=user,
            student=student_profile,
            title="Student Hub Assistant",
        )
    return conversation


def _serialize_message(message):
    return {
        "id": str(message.id),
        "role": message.role,
        "content": message.content,
        "references": message.references_json,
        "created_at": message.created_at.isoformat(),
    }


def _build_history(conversation):
    return [
        {"role": msg.role, "content": msg.content}
        for msg in conversation.messages.order_by("created_at")
        if msg.role in {MessageRole.USER, MessageRole.ASSISTANT}
    ]  # FIX-AI-5 done


def _student_context_header(user):
    student_profile = user.student_profile
    course_names = list(
        student_profile.enrollments.select_related("course")
        .order_by("course__title")
        .values_list("course__title", flat=True)
    )
    return (
        f"Student name: {user.get_full_name()}. "
        f"Enrolled courses: {', '.join(course_names) if course_names else 'None'}. "
        f"Today's date: {date.today()}."
    )


def _professor_context_header(user):
    course_names = list(
        Course.objects.filter(teaching_assignments__professor=user.professor_profile)
        .order_by("title")
        .values_list("title", flat=True)
        .distinct()
    )
    return (
        f"Professor name: {user.get_full_name()}. "
        f"Teaching courses: {', '.join(course_names) if course_names else 'None'}. "
        f"Today's date: {date.today()}."
    )


def _full_system_prompt(user):
    if getattr(user, "role", None) == UserRole.STUDENT and hasattr(user, "student_profile"):
        context_header = _student_context_header(user)
    elif getattr(user, "role", None) == UserRole.PROFESSOR and hasattr(
        user, "professor_profile"
    ):
        context_header = _professor_context_header(user)
    else:
        context_header = f"User name: {user.get_full_name()}. Today's date: {date.today()}."
    return context_header + "\n\n" + get_system_prompt(user)


def _read_message_from_request(request):
    if (request.content_type or "").startswith("application/json"):
        try:
            payload = json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            payload = {}
        return (payload.get("message") or payload.get("query") or "").strip()
    return (request.POST.get("message") or request.POST.get("query") or "").strip()


def _save_query_log(user, query, elapsed_ms):
    student_profile = getattr(user, "student_profile", None)
    metadata = getattr(ask_llm, "last_metadata", {})
    return AIQueryLog.objects.create(
        user=user,
        student=student_profile,
        query=query,
        intent=metadata.get("intent", ""),
        response_time_ms=elapsed_ms,
        tokens_in=metadata.get("tokens_in", 0),
        tokens_out=metadata.get("tokens_out", 0),
        topic=categorize_topic(user, query),
        status=metadata.get("status", "ok"),
    )


def _process_chat_message(user, query):
    conversation = _get_existing_or_new_conversation(user)
    history = _build_history(conversation)
    history.append({"role": MessageRole.USER, "content": query})
    started = timezone.now()
    reply = ask_llm(history, _full_system_prompt(user))
    elapsed_ms = int((timezone.now() - started).total_seconds() * 1000)

    update_fields = ["updated_at"]
    if not conversation.title:
        conversation.title = query[:160]
        update_fields.insert(0, "title")

    AIMessage.objects.create(
        conversation=conversation,
        role=MessageRole.USER,
        content=query,
        references_json=[],
    )
    AIMessage.objects.create(
        conversation=conversation,
        role=MessageRole.ASSISTANT,
        content=reply,
        references_json=extract_external_references(reply),
    )
    conversation.save(update_fields=update_fields)
    _save_query_log(user, query, elapsed_ms)
    return conversation, reply


def _chat_context(user, shortcuts=None, suggestions=None):
    conversation = _get_existing_or_new_conversation(user)
    messages = list(conversation.messages.order_by("created_at"))
    quick_link_keys = ["assignments", "courses", "announcements", "materials", "profile"]
    return {
        "conversation": conversation,
        "conversation_messages": messages,
        "conversation_history": [_serialize_message(message) for message in messages],
        "conversation_history_json": json.dumps(
            [_serialize_message(message) for message in messages],
        ),
        "quick_links": [
            {"label": label.title(), "path": NAVIGATION_MAP[label]}
            for label in quick_link_keys
        ],
        "question_suggestions": suggestions or [],
        "shortcut_prompts": shortcuts or [],
    }


@login_required
def assistant_page(request):
    if request.user.role != UserRole.STUDENT or not hasattr(request.user, "student_profile"):
        return JsonResponse({"detail": "AI assistant is available for students only."}, status=403)

    if request.method == "POST":
        query = _read_message_from_request(request)
        if not query:
            return JsonResponse({"detail": "Message is required."}, status=400)
        conversation, reply = _process_chat_message(request.user, query)
        return JsonResponse({"reply": reply, "conversation_id": str(conversation.id)})

    context = _chat_context(
        request.user,
        suggestions=[
            "Explain the main idea behind my current course topics.",
            "Help me plan my study week around my assignments.",
            "Where can I find my course materials?",
            "What should I review before my next exam?",
        ],
    )
    return render(request, "ai_assistant/assistant.html", context)  # FIX-AI-6 done


@professor_required
def professor_assistant_page(request):
    if request.method == "POST":
        query = _read_message_from_request(request)
        if not query:
            return JsonResponse({"detail": "Message is required."}, status=400)
        conversation, reply = _process_chat_message(request.user, query)
        return JsonResponse({"reply": reply, "conversation_id": str(conversation.id)})

    context = _chat_context(
        request.user,
        shortcuts=[
            {
                "label": "Create assignment brief",
                "prompt": "Write a clear assignment brief for [topic]. Include: objectives, deliverables, deadline instructions, and grading criteria.",
            },
            {
                "label": "Generate exam questions",
                "prompt": "Generate 10 exam questions (mix of MCQ and short answer) for the topic: [topic]. Include an answer key.",
            },
            {
                "label": "Write student feedback",
                "prompt": "Write constructive feedback for a student who scored [score]/[max] on [assignment]. Tone: encouraging but honest.",
            },
            {
                "label": "Summarize class performance",
                "prompt": "Summarize the following grade data and identify students who may need extra support: [paste data].",
            },
        ],
    )
    return render(request, "professor/ai_assistant.html", context)  # FIX-AI-7 done


@login_required
@require_POST
def clear_history(request):
    conversation = _get_existing_or_new_conversation(request.user)
    conversation.messages.all().delete()
    return JsonResponse({"cleared": True})  # FIX-AI-6 done


def _admin_stats_payload():
    week_start = timezone.now() - timedelta(days=7)
    total_users = User.objects.count()
    active_students = User.objects.filter(role=UserRole.STUDENT, is_active=True).count()
    weekly_submissions = Submission.objects.filter(
        submitted_at__gte=week_start,
        is_deleted=False,
    )
    average_grade = (
        Submission.objects.filter(is_deleted=False)
        .exclude(score__isnull=True)
        .aggregate(avg=Avg("score"))["avg"]
    )
    most_active_courses = list(
        Course.objects.annotate(
            submission_count=Count(
                "assignments__submissions",
                filter=Q(
                    assignments__submissions__is_deleted=False,
                    assignments__submissions__submitted_at__gte=week_start,
                ),
            )
        )
        .filter(submission_count__gt=0)
        .order_by("-submission_count", "code")[:3]
    )
    raw_stats = {
        "total_users": total_users,
        "active_students": active_students,
        "submissions_this_week": weekly_submissions.count(),
        "average_grade": average_grade,
        "most_active_courses": most_active_courses,
    }
    stats_text = "\n".join(
        [
            f"Total users: {total_users}",
            f"Active students: {active_students}",
            f"Total submissions this week: {weekly_submissions.count()}",
            f"Average grade across platform: {average_grade if average_grade is not None else 'N/A'}",
            "Most active courses: "
            + (
                ", ".join(
                    f"{course.code} ({course.submission_count} submissions)"
                    for course in most_active_courses
                )
                if most_active_courses
                else "None"
            ),
        ]
    )
    return raw_stats, stats_text


@admin_required
def admin_ai_dashboard(request):
    raw_stats, stats_text = _admin_stats_payload()
    summary = ask_llm(
        [{"role": MessageRole.USER, "content": stats_text}],
        ADMIN_SYSTEM_PROMPT,
    )
    return render(
        request,
        "admin_panel/ai_dashboard.html",
        {
            "stats": raw_stats,
            "summary": summary,
            "most_active_courses": raw_stats["most_active_courses"],
        },
    )  # FIX-AI-8 done
