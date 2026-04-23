from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied

from .models import UserRole


def professor_required(view_func):
    @login_required
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if (
            getattr(request.user, "role", None) != UserRole.PROFESSOR
            or not hasattr(request.user, "professor_profile")
        ):
            raise PermissionDenied("Professor access required.")
        return view_func(request, *args, **kwargs)

    return _wrapped_view


def admin_required(view_func):
    @login_required
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if getattr(request.user, "role", None) != UserRole.ADMIN:
            raise PermissionDenied("Admin access required.")
        return view_func(request, *args, **kwargs)

    return _wrapped_view
