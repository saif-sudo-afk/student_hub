from datetime import timedelta
from types import SimpleNamespace
from unittest import mock

from django.contrib import admin
from django.test import Client, RequestFactory, TestCase
from django.urls import reverse
from django.utils import timezone

from academics.models import Major, Semester, TermType
from accounts.models import StudentProfile, User, UserRole

from .admin import AIQueryLogAdmin
from .models import AIConversation, AIMessage, AIQueryLog, AIQueryStatus, FieldOfStudyConfig
from .services import (
    ADMIN_SYSTEM_PROMPT,
    PROFESSOR_SYSTEM_PROMPT,
    STUDENT_SYSTEM_PROMPT,
    ask_llm,
    get_system_prompt,
)


class FakeLLM:
    def __init__(self, replies=None, tokens_in=21, tokens_out=34):
        self.replies = replies or ["Assistant reply"]
        self.tokens_in = tokens_in
        self.tokens_out = tokens_out
        self.calls = []
        self.last_metadata = {
            "status": AIQueryStatus.OK,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "intent": "",
            "used_fallback": False,
        }

    def __call__(self, messages, system_prompt):
        self.calls.append({"messages": list(messages), "system_prompt": system_prompt})
        self.last_metadata = {
            "status": AIQueryStatus.OK,
            "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out,
            "intent": "",
            "used_fallback": False,
        }
        index = min(len(self.calls) - 1, len(self.replies) - 1)
        return self.replies[index]


class AIAssistantTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.factory = RequestFactory()
        self.major = Major.objects.create(name="Computer Science", code="CS")
        self.semester = Semester.objects.create(
            name="Spring 2026",
            year=2026,
            term=TermType.SPRING,
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=90)).date(),
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
            student_number="STU-AI-1",
            current_semester=self.semester,
        )
        self.professor_user = User.objects.create_user(
            email="professor@example.com",
            password="testpass123",
            full_name="Professor User",
            role=UserRole.PROFESSOR,
        )
        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            password="testpass123",
            full_name="Admin User",
            role=UserRole.ADMIN,
        )

    def test_ask_llm_uses_anthropic_client_and_records_tokens(self):
        response = SimpleNamespace(
            content=[SimpleNamespace(text="Structured answer")],
            usage=SimpleNamespace(input_tokens=18, output_tokens=27),
        )
        create_mock = mock.Mock(return_value=response)
        fake_client = SimpleNamespace(messages=SimpleNamespace(create=create_mock))
        fake_anthropic = SimpleNamespace(Anthropic=mock.Mock(return_value=fake_client))

        with mock.patch("ai_assistant.services.anthropic", fake_anthropic):
            reply = ask_llm(
                [{"role": "user", "content": "Summarize this"}],
                "System prompt",
            )

        self.assertEqual(reply, "Structured answer")
        self.assertEqual(ask_llm.last_metadata["tokens_in"], 18)
        self.assertEqual(ask_llm.last_metadata["tokens_out"], 27)
        create_mock.assert_called_once_with(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system="System prompt",
            messages=[{"role": "user", "content": "Summarize this"}],
        )

    def test_get_system_prompt_routes_by_role_and_appends_topics(self):
        FieldOfStudyConfig.objects.create(
            field_of_study=self.major.name,
            topics=["programming", "algorithms", "databases"],
        )

        student_prompt = get_system_prompt(self.student_user)

        self.assertTrue(student_prompt.startswith(STUDENT_SYSTEM_PROMPT.strip()))
        self.assertIn("Relevant topics for this student's field: programming, algorithms, databases.", student_prompt)
        self.assertEqual(get_system_prompt(self.professor_user), PROFESSOR_SYSTEM_PROMPT)
        self.assertEqual(get_system_prompt(self.admin_user), ADMIN_SYSTEM_PROMPT)

    def test_student_post_replays_full_conversation_history(self):
        fake_llm = FakeLLM(replies=["Assistant reply 1", "Assistant reply 2"])
        self.client.force_login(self.student_user)

        with mock.patch("ai_assistant.views.ask_llm", new=fake_llm):
            first_response = self.client.post(
                reverse("ai_assistant:assistant"),
                data='{"message":"First question"}',
                content_type="application/json",
            )
            second_response = self.client.post(
                reverse("ai_assistant:assistant"),
                data='{"message":"Second question"}',
                content_type="application/json",
            )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        payload = second_response.json()
        self.assertIn("reply", payload)
        self.assertIn("conversation_id", payload)
        self.assertEqual(AIConversation.objects.filter(user=self.student_user).count(), 1)
        self.assertEqual(AIMessage.objects.count(), 4)
        self.assertEqual(
            fake_llm.calls[1]["messages"],
            [
                {"role": "user", "content": "First question"},
                {"role": "assistant", "content": "Assistant reply 1"},
                {"role": "user", "content": "Second question"},
            ],
        )

    def test_student_post_logs_tokens_and_topic(self):
        FieldOfStudyConfig.objects.create(
            field_of_study=self.major.name,
            topics=["programming", "algorithms", "databases"],
        )
        fake_llm = FakeLLM(replies=["Algorithms explanation"], tokens_in=55, tokens_out=89)
        self.client.force_login(self.student_user)

        with mock.patch("ai_assistant.views.ask_llm", new=fake_llm):
            response = self.client.post(
                reverse("ai_assistant:assistant"),
                data='{"message":"Explain algorithms using an example"}',
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        log = AIQueryLog.objects.get(user=self.student_user)
        self.assertEqual(log.tokens_in, 55)
        self.assertEqual(log.tokens_out, 89)
        self.assertEqual(log.topic, "algorithms")
        self.assertEqual(log.status, AIQueryStatus.OK)

    def test_ai_query_log_admin_is_read_only(self):
        request = self.factory.get("/admin/")
        request.user = self.admin_user
        model_admin = AIQueryLogAdmin(AIQueryLog, admin.site)

        self.assertFalse(model_admin.has_add_permission(request))
        self.assertFalse(model_admin.has_change_permission(request))
        self.assertFalse(model_admin.has_delete_permission(request))
