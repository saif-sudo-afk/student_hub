from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver

from .models import User, UserRole

ROLE_GROUP_MAPPING = {
    UserRole.STUDENT: "students_group",
    UserRole.PROFESSOR: "professors_group",
    UserRole.ADMIN: "admins_group",
}  # FIX-ADMIN-1 done

ROLE_PERMISSION_CODENAMES = {
    UserRole.STUDENT: [
        "view_announcement",
        "view_assignment",
        "view_calendarevent",
        "view_course",
        "view_enrollment",
        "view_studymaterial",
        "view_studygroup",
        "view_submission",
    ],
    UserRole.ADMIN: [
        "add_announcement",
        "add_calendarevent",
        "add_course",
        "add_coursemajor",
        "add_professorprofile",
        "add_studentprofile",
        "add_teachingassignment",
        "add_user",
        "change_announcement",
        "change_calendarevent",
        "change_course",
        "change_coursemajor",
        "change_enrollment",
        "change_professorprofile",
        "change_studentprofile",
        "change_submission",
        "change_teachingassignment",
        "change_user",
        "delete_announcement",
        "delete_calendarevent",
        "delete_course",
        "delete_coursemajor",
        "delete_professorprofile",
        "delete_studentprofile",
        "delete_submission",
        "delete_teachingassignment",
        "delete_user",
        "view_announcement",
        "view_assignment",
        "view_calendarevent",
        "view_course",
        "view_coursematerial",
        "view_coursemajor",
        "view_enrollment",
        "view_fieldofstudyconfig",
        "view_professorprofile",
        "view_studentprofile",
        "view_studygroup",
        "view_submission",
        "view_teachingassignment",
        "view_user",
    ],
    UserRole.PROFESSOR: [
        "add_announcement",
        "add_assignment",
        "add_calendarevent",
        "add_course",
        "add_coursematerial",
        "add_studygroup",
        "change_announcement",
        "change_assignment",
        "change_calendarevent",
        "change_course",
        "change_coursematerial",
        "change_enrollment",
        "change_studygroup",
        "change_submission",
        "delete_announcement",
        "delete_assignment",
        "delete_calendarevent",
        "delete_course",
        "delete_coursematerial",
        "delete_studygroup",
        "view_announcement",
        "view_assignment",
        "view_calendarevent",
        "view_course",
        "view_coursematerial",
        "view_enrollment",
        "view_studymaterial",
        "view_studygroup",
        "view_submission",
    ],
}


def _ensure_group_permissions(group, role):
    if role == UserRole.ADMIN:
        group.permissions.set(Permission.objects.all())
        return

    permissions = Permission.objects.filter(
        codename__in=ROLE_PERMISSION_CODENAMES.get(role, [])
    )
    group.permissions.set(permissions)


def ensure_role_groups():
    groups = {}
    for role, name in ROLE_GROUP_MAPPING.items():
        group, _ = Group.objects.get_or_create(name=name)
        _ensure_group_permissions(group, role)
        groups[role] = group
    return groups


@receiver(post_migrate)
def ensure_role_groups_post_migrate(sender, **kwargs):
    ensure_role_groups()


@receiver(post_save, sender=User)
def sync_user_groups(sender, instance, created, **kwargs):
    groups = ensure_role_groups()
    target_group = groups.get(instance.role)
    if target_group:
        instance.groups.set([target_group])
    else:
        instance.groups.clear()

    desired_is_staff = instance.role in {UserRole.PROFESSOR, UserRole.ADMIN}
    if instance.is_staff != desired_is_staff:
        User.objects.filter(pk=instance.pk).update(is_staff=desired_is_staff)
        instance.is_staff = desired_is_staff
