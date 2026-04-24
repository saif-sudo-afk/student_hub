from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.contrib.auth.models import Group, Permission, User as AuthUser
from django.contrib.admin.sites import NotRegistered
from django.db.models import Q

from .models import ProfessorProfile, StudentProfile, User, UserRole


for model in (AuthUser, Group, Permission):
    try:
        admin.site.unregister(model)
    except NotRegistered:
        pass

# FIX-ADMIN-2 done


class UserAdminCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm password", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("email", "full_name", "role", "is_active")

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords do not match.")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserAdminChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = (
            "email",
            "full_name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "password",
            "last_login",
            "date_joined",
        )

    def clean_password(self):
        return self.initial["password"]


class StudentProfileAdminForm(forms.ModelForm):
    class Meta:
        model = StudentProfile
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        queryset = User.objects.filter(role=UserRole.STUDENT)
        if self.instance.pk and self.instance.user_id:
            queryset = queryset.filter(
                Q(pk=self.instance.user_id) | Q(student_profile__isnull=True)
            )
        else:
            queryset = queryset.filter(student_profile__isnull=True)
        self.fields["user"].queryset = queryset.order_by("email")


class ProfessorProfileAdminForm(forms.ModelForm):
    class Meta:
        model = ProfessorProfile
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        queryset = User.objects.filter(role=UserRole.PROFESSOR)
        if self.instance.pk and self.instance.user_id:
            queryset = queryset.filter(
                Q(pk=self.instance.user_id) | Q(professor_profile__isnull=True)
            )
        else:
            queryset = queryset.filter(professor_profile__isnull=True)
        self.fields["user"].queryset = queryset.order_by("email")


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    extra = 0
    autocomplete_fields = ("major", "current_semester")


class ProfessorProfileInline(admin.StackedInline):
    model = ProfessorProfile
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserAdminChangeForm
    add_form = UserAdminCreationForm
    list_display = ("email", "full_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    ordering = ("email",)
    search_fields = ("email", "full_name")
    readonly_fields = ("last_login", "date_joined")
    filter_horizontal = ()
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "role")}),
        ("Access", {"fields": ("is_active",)}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )  # FIX-ADMIN-1 done
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "role",
                    "is_active",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    def get_inlines(self, request, obj):
        if obj is None:
            return []
        if obj.role == UserRole.STUDENT:
            return [StudentProfileInline]
        if obj.role == UserRole.PROFESSOR:
            return [ProfessorProfileInline]
        return []


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    form = StudentProfileAdminForm
    list_display = ("user", "major", "student_number", "current_semester")
    list_filter = ("major", "current_semester")
    search_fields = ("user__email", "user__full_name", "student_number")
    autocomplete_fields = ("user", "major", "current_semester")


@admin.register(ProfessorProfile)
class ProfessorProfileAdmin(admin.ModelAdmin):
    form = ProfessorProfileAdminForm
    list_display = ("user", "department", "employee_code")
    list_filter = ("department",)
    search_fields = ("user__email", "user__full_name", "employee_code")
    autocomplete_fields = ("user",)
