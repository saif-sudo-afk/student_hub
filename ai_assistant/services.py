import re

try:
    import anthropic
except ImportError:  # pragma: no cover - handled through fallback
    anthropic = None

from .models import AIQueryStatus, FieldOfStudyConfig


class Intent:
    NAVIGATION_HELP = "navigation_help"
    # FIX-AI-1 done


NAVIGATION_MAP = {
    "grades": "/assignments/",
    "grade": "/assignments/",
    "assignments": "/assignments/",
    "assignment": "/assignments/",
    "courses": "/courses/",
    "course": "/courses/",
    "profile": "/accounts/dashboard/",
    "announcements": "/communication/announcements/",
    "announcement": "/communication/announcements/",
    "materials": "/courses/materials/",
    "material": "/courses/materials/",
}  # FIX-AI-2 done


STUDENT_SYSTEM_PROMPT = """
You are an AI academic assistant for Student Hub, an LMS platform.
You help students with: understanding course materials, clarifying concepts,
preparing for exams, navigating the platform, and managing their academic workload.
Always be encouraging and clear. If a student asks about grades, assignments,
or platform navigation, give direct helpful answers. Do not make up data you don't have.
If you don't know something specific about their account, guide them to the right page.
Respond in the same language the student uses.
"""

PROFESSOR_SYSTEM_PROMPT = """
You are an AI teaching assistant for Student Hub, an LMS platform.
You help professors with: writing assignment briefs, generating exam questions,
drafting student feedback, summarizing class performance, and navigating the platform.
Be professional and efficient. When asked to generate exam questions or feedback,
produce structured, ready-to-use text. Do not access student personal data unless provided.
"""

ADMIN_SYSTEM_PROMPT = """
You are an AI analytics assistant for Student Hub, an LMS platform.
You help administrators by summarizing platform activity, explaining usage patterns,
and generating concise reports from data provided to you.
Always respond in structured, concise summaries. Do not answer questions outside
platform analytics and administration.
"""


def build_navigation_help(query: str) -> str:
    lowered_query = (query or "").lower()
    for noun, path in NAVIGATION_MAP.items():
        if noun in lowered_query:
            return f"You can find {noun} at {path}."
    return "You can navigate Student Hub from /accounts/dashboard/."


def _field_of_study_for_user(user) -> str:
    student_profile = getattr(user, "student_profile", None)
    if student_profile and getattr(student_profile, "major", None):
        return student_profile.major.name
    return ""


def get_field_topics_for_user(user) -> list[str]:
    field_of_study = _field_of_study_for_user(user)
    if not field_of_study:
        return []
    config = FieldOfStudyConfig.objects.filter(field_of_study__iexact=field_of_study).first()
    if not config:
        return []
    return [str(topic) for topic in config.topics]


def get_system_prompt(user) -> str:
    role = getattr(user, "role", "student")
    if role == "professor":
        return PROFESSOR_SYSTEM_PROMPT
    if role == "admin":
        return ADMIN_SYSTEM_PROMPT

    prompt = STUDENT_SYSTEM_PROMPT
    topics = get_field_topics_for_user(user)
    if topics:
        prompt = (
            prompt.strip()
            + "\n\nRelevant topics for this student's field: "
            + ", ".join(topics)
            + "."
        )
    return prompt  # FIX-AI-4 done


def ask_llm(messages: list[dict], system_prompt: str) -> str:
    try:
        if anthropic is None:
            raise RuntimeError("Anthropic SDK is not installed.")

        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        reply = "\n".join(
            block.text for block in response.content if hasattr(block, "text")
        ).strip()
        ask_llm.last_metadata = {
            "status": AIQueryStatus.OK,
            "tokens_in": getattr(response.usage, "input_tokens", 0),
            "tokens_out": getattr(response.usage, "output_tokens", 0),
            "intent": "",
            "used_fallback": False,
        }  # FIX-AI-11 done
        return reply
    except Exception as exc:  # FIX-AI-3 done
        query = messages[-1]["content"] if messages else ""
        lowered_error = str(exc).lower()
        status = (
            AIQueryStatus.RATE_LIMITED
            if "rate" in lowered_error and "limit" in lowered_error
            else AIQueryStatus.ERROR
        )
        ask_llm.last_metadata = {
            "status": status,
            "tokens_in": 0,
            "tokens_out": 0,
            "intent": Intent.NAVIGATION_HELP,
            "used_fallback": True,
            "error": str(exc),
        }
        return build_navigation_help(query)


ask_llm.last_metadata = {
    "status": AIQueryStatus.OK,
    "tokens_in": 0,
    "tokens_out": 0,
    "intent": "",
    "used_fallback": False,
}


EXTERNAL_URL_PATTERN = re.compile(r"https?://(?!student-hub)[^\s]+", re.IGNORECASE)


def categorize_topic(user, message: str) -> str:
    lowered_message = (message or "").lower()
    for topic in get_field_topics_for_user(user):
        if topic.lower() in lowered_message:
            return topic
    return "general"  # FIX-AI-10 done


def extract_external_references(reply: str) -> list[dict]:
    references = []
    for match in EXTERNAL_URL_PATTERN.finditer(reply or ""):
        raw_url = match.group(0).rstrip(").,]")
        prefix = (reply[max(0, match.start() - 80):match.start()]).strip()
        title = prefix.splitlines()[-1].strip(" -:") if prefix else raw_url
        references.append({"title": title or raw_url, "url": raw_url})
    return references  # FIX-AI-12 done
