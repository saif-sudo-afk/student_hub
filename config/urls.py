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

from common.views import health

admin.site.site_header = "Student Hub Admin"
admin.site.site_title = "Student Hub Admin"
admin.site.index_title = "Platform control center"
admin.site.index_template = "admin/index.html"
admin.site.login_template = "admin/login.html"

urlpatterns = [
    path("health/", health, name="health"),
    path("api/", include("api.urls")),
    path("accounts/", include("accounts.urls")),
    path("server/professor/", include(("accounts.professor_urls", "professor"), namespace="professor")),
    path("courses/", include("courses.urls")),
    path("assignments/", include("assignments.urls")),
    path("ai/", include("ai_assistant.urls")),
    path(
        "admin-panel/",
        include(("ai_assistant.admin_panel_urls", "admin_panel_ai"), namespace="admin_panel_ai"),
    ),
    path(
        "announcements/",
        include(
            ("communications.professor_urls", "professor_announcements"),
            namespace="professor_announcements",
        ),
    ),
    path("communication/", include("communications.urls")),
    path('django-admin/', admin.site.urls),
    re_path(
        r"^(?!api/|django-admin/|accounts/|server/professor/|courses/|assignments/|ai/|admin-panel/|announcements/|communication/|health/|static/|media/).*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
