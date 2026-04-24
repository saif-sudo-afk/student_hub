import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/common/AppLayout';
import { RoleGuard } from '@/router/RoleGuard';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath, getDjangoAdminUrl } from '@/utils/routes';

import { LandingPage } from '@/pages/Landing';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { StudentDashboardPage } from '@/pages/student/Dashboard';
import { StudentCoursesPage } from '@/pages/student/Courses';
import { StudentCourseDetailPage } from '@/pages/student/CourseDetail';
import { StudentAssignmentsPage } from '@/pages/student/Assignments';
import { StudentGradesPage } from '@/pages/student/Grades';
import { StudentAnnouncementsPage } from '@/pages/student/Announcements';
import { ProfessorDashboardPage } from '@/pages/professor/Dashboard';
import { ProfessorCoursesPage } from '@/pages/professor/Courses';
import { ProfessorCourseDetailPage } from '@/pages/professor/CourseDetail';
import { ProfessorAssignmentsPage } from '@/pages/professor/Assignments';
import { ProfessorSubmissionReviewPage } from '@/pages/professor/SubmissionReview';
import { ProfessorStatsPage } from '@/pages/professor/Stats';
import { ProfessorAnnouncementsPage } from '@/pages/professor/Announcements';

function DjangoAdminRedirect() {
  useEffect(() => {
    window.location.replace(getDjangoAdminUrl());
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-text-secondary">
      Redirecting to Django admin...
    </div>
  );
}

function RootRedirect() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      return <DjangoAdminRedirect />;
    }
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return <LandingPage />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RoleGuard role="student" />}>
        <Route path="/student" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:courseId" element={<StudentCourseDetailPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="grades" element={<StudentGradesPage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
        </Route>
      </Route>

      <Route element={<RoleGuard role="professor" />}>
        <Route path="/professor" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ProfessorDashboardPage />} />
          <Route path="courses" element={<ProfessorCoursesPage />} />
          <Route path="courses/:courseId" element={<ProfessorCourseDetailPage />} />
          <Route path="assignments" element={<ProfessorAssignmentsPage />} />
          <Route path="assignments/:assignmentId/submissions" element={<ProfessorSubmissionReviewPage />} />
          <Route path="stats" element={<ProfessorStatsPage />} />
          <Route path="announcements" element={<ProfessorAnnouncementsPage />} />
        </Route>
      </Route>

      <Route path="/admin/*" element={<DjangoAdminRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
