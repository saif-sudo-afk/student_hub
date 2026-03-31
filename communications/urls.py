from django.urls import path

from .views import announcement_list, calendar_list

app_name = "communications"

urlpatterns = [
    path("announcements/", announcement_list, name="announcement_list"),
    path("calendar/", calendar_list, name="calendar_list"),
]
