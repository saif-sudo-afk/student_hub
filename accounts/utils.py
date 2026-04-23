import uuid

from .models import StudentProfile


def generate_student_number():
    while True:
        candidate = f"STU-{uuid.uuid4().hex[:10].upper()}"
        if not StudentProfile.objects.filter(student_number=candidate).exists():
            return candidate
