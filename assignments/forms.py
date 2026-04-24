from datetime import timedelta

from django import forms
from django.utils import timezone

from courses.models import Course

from .models import Assignment, AssignmentType, Submission, SubmissionMode


class AssignmentCreateForm(forms.ModelForm):
    due_date = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={"type": "datetime-local"})
    )
    max_score = forms.IntegerField(min_value=1)

    class Meta:
        model = Assignment
        fields = (
            "title",
            "description",
            "course",
            "max_score",
            "attachment",
            "is_published",
        )
        widgets = {
            "description": forms.Textarea(attrs={"rows": 5}),
        }

    def __init__(self, *args, professor_profile=None, **kwargs):
        super().__init__(*args, **kwargs)
        if professor_profile is not None:
            self.fields["course"].queryset = Course.objects.filter(
                teaching_assignments__professor=professor_profile
            ).distinct()
        if not self.is_bound:
            self.fields["due_date"].initial = timezone.localtime(
                timezone.now() + timedelta(days=7)
            ).strftime("%Y-%m-%dT%H:%M")

    def clean(self):
        cleaned_data = super().clean()
        due_date = cleaned_data.get("due_date")
        if due_date is not None:
            self.instance.due_at = due_date
            self.instance.open_at = timezone.now()
        return cleaned_data

    def save(self, commit=True):
        assignment = super().save(commit=False)
        assignment.due_at = self.cleaned_data["due_date"]
        assignment.open_at = timezone.now()
        assignment.assignment_type = AssignmentType.HOMEWORK
        assignment.submission_mode = SubmissionMode.INDIVIDUAL
        if commit:
            assignment.save()
        return assignment


class GradeSubmissionForm(forms.ModelForm):
    grade = forms.IntegerField(min_value=0)

    class Meta:
        model = Submission
        fields = ("feedback",)
        widgets = {
            "feedback": forms.Textarea(attrs={"rows": 2, "placeholder": "Return feedback"}),
        }

    def __init__(self, *args, assignment=None, **kwargs):
        self.assignment = assignment
        super().__init__(*args, **kwargs)
        if self.instance.pk and self.instance.score is not None:
            self.fields["grade"].initial = int(self.instance.score)

    def clean_grade(self):
        grade = self.cleaned_data["grade"]
        if self.assignment is not None and grade > int(self.assignment.max_score):
            raise forms.ValidationError(
                f"Grade must be less than or equal to {int(self.assignment.max_score)}."
            )
        return grade
