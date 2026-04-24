from django.utils import timezone

from django import forms

from courses.models import Course

from .models import Announcement, AnnouncementScope, AnnouncementTargetRole


class ProfessorAnnouncementForm(forms.ModelForm):
    class Meta:
        model = Announcement
        fields = (
            "title",
            "content",
            "attachment",
            "scope",
            "course",
            "target_role",
            "publish_date",
            "expiry_date",
            "status",
            "priority",
            "send_notification",
        )
        widgets = {
            "content": forms.Textarea(attrs={"rows": 5}),
            "publish_date": forms.DateTimeInput(attrs={"type": "datetime-local"}),
            "expiry_date": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
        professor_profile = getattr(user, "professor_profile", None)
        self.fields["course"].queryset = Course.objects.none()
        if professor_profile is not None:
            self.fields["course"].queryset = Course.objects.filter(
                teaching_assignments__professor=professor_profile
            ).distinct()
        if not self.is_bound and not self.instance.pk:
            self.fields["publish_date"].initial = timezone.localtime(timezone.now()).strftime(
                "%Y-%m-%dT%H:%M"
            )

        available_scopes = [(AnnouncementScope.COURSE, "Course")]
        if user is not None and user.has_perm("communications.add_announcement"):
            available_scopes.insert(0, (AnnouncementScope.GLOBAL, "Global"))
            available_scopes.append((AnnouncementScope.ROLE, "Role"))
        self.fields["scope"].choices = available_scopes

    def clean(self):
        cleaned_data = super().clean()
        scope = cleaned_data.get("scope")
        course = cleaned_data.get("course")
        if scope == AnnouncementScope.COURSE and not course:
            raise forms.ValidationError("Select a course for course announcements.")
        if scope == AnnouncementScope.GLOBAL:
            cleaned_data["course"] = None
            cleaned_data["target_role"] = AnnouncementTargetRole.ALL
        if scope == AnnouncementScope.ROLE and cleaned_data.get("target_role") == AnnouncementTargetRole.ALL:
            raise forms.ValidationError("Select a specific role for role announcements.")
        return cleaned_data
