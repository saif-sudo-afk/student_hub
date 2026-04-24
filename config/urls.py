"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.contrib.auth import views as auth_views

from common.views import health

admin.site.site_header = "Student Hub Admin"
admin.site.site_title = "Student Hub Admin"
admin.site.index_title = "Platform control center"

urlpatterns = [
    path("health/", health, name="health"),
    path("api/", include("api.urls")),
    path("accounts/", include("accounts.urls")),
    path("server/professor/", include(("accounts.professor_urls", "professor"), namespace="professor")),
    path("courses/", include("courses.urls")),
    path("assignments/", include("assignments.urls")),
    path(
        "announcements/",
        include(
            ("communications.professor_urls", "professor_announcements"),
            namespace="professor_announcements",
        ),
    ),
    path("communication/", include("communications.urls")),
    path(
        "admin/password-reset/",
        auth_views.PasswordResetView.as_view(
            template_name="accounts/password_reset_form.html",
            email_template_name="accounts/password_reset_email.html",
            subject_template_name="accounts/password_reset_subject.txt",
            success_url="/admin/password-reset/done/",
        ),
        name="admin_password_reset",
    ),
    path(
        "admin/password-reset/done/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="accounts/password_reset_done.html"
        ),
        name="password_reset_done",
    ),
    path(
        "admin/reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="accounts/password_reset_confirm.html",
            success_url="/admin/reset/done/",
        ),
        name="password_reset_confirm",
    ),
    path(
        "admin/reset/done/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="accounts/password_reset_complete.html"
        ),
        name="password_reset_complete",
    ),
    path("admin/", admin.site.urls),
    re_path(
        r"^(?!api/|admin/|accounts/|server/professor/|courses/|assignments/|announcements/|communication/|health/|static/|media/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
