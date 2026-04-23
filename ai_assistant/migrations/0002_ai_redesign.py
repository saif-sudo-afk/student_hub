# Generated manually for AI assistant redesign.

import django.db.models.deletion
from django.db import migrations, models


def backfill_ai_user_fields(apps, schema_editor):
    AIConversation = apps.get_model("ai_assistant", "AIConversation")
    AIQueryLog = apps.get_model("ai_assistant", "AIQueryLog")

    for conversation in AIConversation.objects.filter(user__isnull=True, student__isnull=False):
        student = conversation.student
        if student and student.user_id:
            conversation.user_id = student.user_id
            conversation.save(update_fields=["user"])

    for log in AIQueryLog.objects.filter(user__isnull=True, student__isnull=False):
        student = log.student
        if student and student.user_id:
            log.user_id = student.user_id
            log.save(update_fields=["user"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("ai_assistant", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="aiconversation",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="ai_conversations",
                to="accounts.user",
            ),
        ),
        migrations.AlterField(
            model_name="aiconversation",
            name="student",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="ai_conversations",
                to="accounts.studentprofile",
            ),
        ),
        migrations.AddField(
            model_name="aiquerylog",
            name="topic",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="aiquerylog",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="ai_query_logs",
                to="accounts.user",
            ),
        ),
        migrations.AlterField(
            model_name="aiquerylog",
            name="student",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="ai_query_logs",
                to="accounts.studentprofile",
            ),
        ),
        migrations.CreateModel(
            name="FieldOfStudyConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("field_of_study", models.CharField(max_length=100, unique=True)),
                ("topics", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.RunPython(backfill_ai_user_fields, migrations.RunPython.noop),
    ]
