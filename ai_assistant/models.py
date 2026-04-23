import uuid

from django.db import models


class MessageRole(models.TextChoices):
    USER = "user", "User"
    ASSISTANT = "assistant", "Assistant"
    SYSTEM = "system", "System"


class AIQueryStatus(models.TextChoices):
    OK = "ok", "OK"
    ERROR = "error", "Error"
    RATE_LIMITED = "rate_limited", "Rate Limited"


class AIConversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="ai_conversations",
        null=True,
        blank=True,
    )
    student = models.ForeignKey(
        "accounts.StudentProfile",
        on_delete=models.CASCADE,
        related_name="ai_conversations",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        actor = (
            self.user.email
            if self.user_id
            else self.student.user.email
            if self.student_id
            else "unknown"
        )
        return self.title or f"Conversation {actor}"


class AIMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        AIConversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=20, choices=MessageRole.choices)
    content = models.TextField()
    references_json = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role} @ {self.created_at}"


class AIQueryLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="ai_query_logs",
        null=True,
        blank=True,
    )
    student = models.ForeignKey(
        "accounts.StudentProfile",
        on_delete=models.CASCADE,
        related_name="ai_query_logs",
        null=True,
        blank=True,
    )
    query = models.TextField()
    intent = models.CharField(max_length=80, blank=True)
    response_time_ms = models.PositiveIntegerField(default=0)
    tokens_in = models.PositiveIntegerField(default=0)
    tokens_out = models.PositiveIntegerField(default=0)
    topic = models.CharField(max_length=100, blank=True, default="")
    status = models.CharField(max_length=20, choices=AIQueryStatus.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        actor = (
            self.user.email
            if self.user_id
            else self.student.user.email
            if self.student_id
            else "unknown"
        )
        return f"AIQueryLog<{actor}>"


class FieldOfStudyConfig(models.Model):
    field_of_study = models.CharField(max_length=100, unique=True)
    topics = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.field_of_study
    # FIX-AI-9 done
