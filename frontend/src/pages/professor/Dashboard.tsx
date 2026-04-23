import { BookOpen, ClipboardList, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getProfessorDashboard } from '@/api/professor';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function ProfessorDashboardPage() {
  const dashboardQuery = useApiQuery(['professor-dashboard'], getProfessorDashboard);

  if (dashboardQuery.isLoading || !dashboardQuery.data) {
    return <Spinner label="Loading dashboard..." />;
  }

  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="My Courses" value={data.courses_count} icon={BookOpen} accentClassName="border-l-primary-light" />
        <StatCard title="Pending Submissions" value={data.pending_submissions} icon={ClipboardList} accentClassName="border-l-warning" />
        <StatCard title="Total Students" value={data.enrolled_students} icon={Users} accentClassName="border-l-success" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/professor/assignments" className="section-shell text-center font-semibold text-primary-light">
          New Assignment
        </Link>
        <Link to="/professor/courses" className="section-shell text-center font-semibold text-primary-light">
          Upload Material
        </Link>
        <Link to="/professor/announcements" className="section-shell text-center font-semibold text-primary-light">
          Write Announcement
        </Link>
        <Link to="/professor/stats" className="section-shell text-center font-semibold text-primary-light">
          View Stats
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="section-shell">
          <h3>Recent Assignments</h3>
          <div className="mt-5">
            <Table headers={['Title', 'Course', 'Due Date', 'Submissions']}>
              {data.recent_assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="table-cell font-medium">{assignment.title}</td>
                  <td className="table-cell text-text-secondary">{assignment.course_title}</td>
                  <td className="table-cell text-text-secondary">{formatDate(assignment.due_at)}</td>
                  <td className="table-cell">{assignment.submission_count ?? 0}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
        <div className="section-shell">
          <h3>Recent Submissions</h3>
          <div className="mt-5">
            <Table headers={['Student', 'Assignment', 'Submitted At']}>
              {data.recent_submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="table-cell font-medium">{submission.student_name}</td>
                  <td className="table-cell text-text-secondary">{submission.assignment}</td>
                  <td className="table-cell text-text-secondary">{formatDate(submission.submitted_at)}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
