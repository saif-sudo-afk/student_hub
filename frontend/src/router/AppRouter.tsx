import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/common/AppLayout';
import { RoleGuard } from '@/router/RoleGuard';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/routes';

import { LandingPage } from '@/pages/Landing';
import { LoginPage } from '@/pages/Login';
import { StudentDashboardPage } from '@/pages/student/Dashboard';
import { StudentCoursesPage } from '@/pages/student/Courses';
import { StudentCourseDetailPage } from '@/pages/student/CourseDetail';
import { StudentAssignmentsPage } from '@/pages/student/Assignments';
import { StudentGradesPage } from '@/pages/student/Grades';
import { StudentAnnouncementsPage } from '@/pages/student/Announcements';
import { StudentAIAssistantPage } from '@/pages/student/AIAssistant';
import { ProfessorDashboardPage } from '@/pages/professor/Dashboard';
import { ProfessorCoursesPage } from '@/pages/professor/Courses';
import { ProfessorCourseDetailPage } from '@/pages/professor/CourseDetail';
import { ProfessorAssignmentsPage } from '@/pages/professor/Assignments';
import { ProfessorSubmissionReviewPage } from '@/pages/professor/SubmissionReview';
import { ProfessorStatsPage } from '@/pages/professor/Stats';
import { ProfessorAnnouncementsPage } from '@/pages/professor/Announcements';
import { ProfessorAIAssistantPage } from '@/pages/professor/AIAssistant';
import { AdminDashboardPage } from '@/pages/admin/Dashboard';
import { AdminUsersPage } from '@/pages/admin/Users';
import { AdminCoursesPage } from '@/pages/admin/Courses';
import { AdminAnnouncementsPage } from '@/pages/admin/Announcements';
import { AdminAILogsPage } from '@/pages/admin/AILogs';
import { AdminAIAnalyticsPage } from '@/pages/admin/AIAnalytics';

function RootRedirect() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return <LandingPage />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RoleGuard role="student" />}>
        <Route path="/student" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:courseId" element={<StudentCourseDetailPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="grades" element={<StudentGradesPage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
          <Route path="ai" element={<StudentAIAssistantPage />} />
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
          <Route path="ai" element={<ProfessorAIAssistantPage />} />
        </Route>
      </Route>

      <Route element={<RoleGuard role="admin" />}>
        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="ai-logs" element={<AdminAILogsPage />} />
          <Route path="ai-analytics" element={<AdminAIAnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
