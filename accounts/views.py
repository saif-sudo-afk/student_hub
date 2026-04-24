from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.db import transaction
from django.shortcuts import redirect, render
from django.urls import reverse_lazy

from .forms import EmailAuthenticationForm, StudentRegistrationForm
from .models import UserRole


class UserLoginView(LoginView):
    template_name = "accounts/login.html"
    authentication_form = EmailAuthenticationForm
    redirect_authenticated_user = True


class UserLogoutView(LogoutView):
    next_page = reverse_lazy("accounts:login")


def register_student(request):
    if request.user.is_authenticated:
        return redirect("accounts:dashboard")
    form = StudentRegistrationForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        with transaction.atomic():
            user = form.save()
        login(request, user)
        messages.success(request, "Your account has been created successfully.")
        return redirect("accounts:dashboard")
    return render(request, "accounts/register_student.html", {"form": form})


@login_required
def dashboard(request):
    if request.user.role == UserRole.PROFESSOR:
        return redirect("professor:dashboard")
    role_template_map = {
        UserRole.STUDENT: "accounts/dashboards/student_dashboard.html",
        UserRole.ADMIN: "accounts/dashboards/admin_dashboard.html",
    }
    template_name = role_template_map.get(
        request.user.role, "accounts/dashboards/student_dashboard.html"
    )
    return render(request, template_name)
