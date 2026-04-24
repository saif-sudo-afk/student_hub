from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("communications", "0002_admin_interface_updates"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="announcement",
            name="last_updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="updated_announcements",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="announcement",
            name="target_role",
            field=models.CharField(
                choices=[
                    ("all", "All"),
                    ("students", "Students"),
                    ("professors", "Professors"),
                    ("admins", "Admins"),
                ],
                default="all",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="announcement",
            name="priority",
            field=models.IntegerField(
                choices=[(0, "Normal"), (1, "Important"), (2, "Urgent")],
                default=0,
            ),
        ),
        migrations.AlterField(
            model_name="announcement",
            name="scope",
            field=models.CharField(
                choices=[
                    ("global", "Global"),
                    ("course", "Course"),
                    ("role", "Role"),
                    ("group", "Group"),
                ],
                max_length=20,
            ),
        ),
    ]
