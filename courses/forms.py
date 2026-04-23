from django import forms
from django.core.exceptions import ValidationError

from .models import Course, CourseMaterial


ALLOWED_RESOURCE_EXTENSIONS = {".pdf", ".docx", ".pptx", ".png", ".jpg", ".jpeg", ".gif"}


class CourseDescriptionForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ("description",)
        widgets = {
            "description": forms.Textarea(
                attrs={"rows": 4, "placeholder": "Update the course description"}
            )
        }


class CourseMaterialUploadForm(forms.ModelForm):
    class Meta:
        model = CourseMaterial
        fields = ("title", "file")

    def clean_file(self):
        uploaded_file = self.cleaned_data["file"]
        filename = uploaded_file.name.lower()
        if not any(filename.endswith(extension) for extension in ALLOWED_RESOURCE_EXTENSIONS):
            raise ValidationError("Only PDF, DOCX, PPTX, and image files are allowed.")
        return uploaded_file
