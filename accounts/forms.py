from django import forms
from django.contrib.auth.forms import AuthenticationForm

from academics.models import Major

from .models import StudentProfile, User, UserRole


class StudentRegistrationForm(forms.ModelForm):
    major = forms.ModelChoiceField(queryset=Major.objects.filter(is_active=True))
    student_number = forms.CharField(max_length=30)
    password1 = forms.CharField(widget=forms.PasswordInput)
    password2 = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ["full_name", "email"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs["class"] = "form-control"

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match.")
        if not Major.objects.filter(is_active=True).exists():
            raise forms.ValidationError(
                "No active major available yet. Contact the administrator."
            )
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = UserRole.STUDENT
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
            StudentProfile.objects.create(
                user=user,
                major=self.cleaned_data["major"],
                student_number=self.cleaned_data["student_number"],
            )
        return user


class EmailAuthenticationForm(AuthenticationForm):
    username = forms.EmailField(label="Email")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].widget.attrs["class"] = "form-control"
        self.fields["password"].widget.attrs["class"] = "form-control"
