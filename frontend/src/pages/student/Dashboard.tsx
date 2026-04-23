import { BookOpen, CalendarClock, CheckCircle2, FileClock } from 'lucide-react';

import { useApiQuery } from '@/hooks/useApi';
import { getStudentDashboard } from '@/api/student';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { formatDate } from '@/utils/formatDate';
import { useAuthStore } from '@/store/authStore';

export function StudentDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const dashboardQuery = useApiQuery(['student-dashboard'], getStudentDashboard);

  if (dashboardQuery.isLoading || !dashboardQuery.data) {
    return <Spinner label="Loading dashboard..." />;
  }

  const data = dashboardQuery.data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <section className="rounded-card bg-accent px-6 py-5 text-primary">
        <div className="text-xl font-semibold">
          {greeting}, {user?.name ?? 'Student'}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Enrolled Courses" value={data.courses_count} icon={BookOpen} accentClassName="border-l-primary-light" />
        <StatCard title="Pending Assignments" value={data.pending_assignments} icon={FileClock} accentClassName="border-l-warning" />
        <StatCard
          title="Average Grade"
          value={data.average_grade != null ? `${Math.round(data.average_grade)}%` : 'N/A'}
          icon={CheckCircle2}
          accentClassName="border-l-success"
        />
        <StatCard title="Upcoming Deadlines" value={data.upcoming_deadlines_count} icon={CalendarClock} accentClassName="border-l-danger" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="section-shell">
          <h3>Upcoming Deadlines</h3>
          <div className="mt-5">
            <Table headers={['Assignment', 'Course', 'Due Date', 'Days Left']}>
              {data.deadlines.map((item) => {
                const tone = item.days_left > 7 ? 'green' : item.days_left >= 2 ? 'amber' : 'red';
                return (
                  <tr key={item.id} className="transition hover:bg-surface">
                    <td className="table-cell font-medium">{item.assignment}</td>
                    <td className="table-cell text-text-secondary">{item.course}</td>
                    <td className="table-cell text-text-secondary">{formatDate(item.due_at)}</td>
                    <td className="table-cell">
                      <Badge tone={tone}>{item.days_left} days</Badge>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>
        </div>

        <div className="section-shell">
          <h3>Announcements</h3>
          <div className="mt-5 space-y-4">
            {data.announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`rounded-lg border px-4 py-4 ${announcement.priority > 0 ? 'border-l-4 border-l-accent' : 'border-border'}`}
              >
                <div className="font-semibold">{announcement.title}</div>
                <p className="mt-2 line-clamp-3 text-sm text-text-secondary">{announcement.content}</p>
                <div className="mt-3 text-xs font-medium uppercase tracking-[0.05em] text-text-secondary">
                  {formatDate(announcement.publish_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <h3>Recent Courses</h3>
        <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
          {data.recent_courses.map((course) => (
            <div key={course.id} className="min-w-[280px] rounded-card border border-border bg-white p-5">
              <div className="text-sm font-semibold text-primary-light">{course.code}</div>
              <div className="mt-2 text-lg font-semibold">{course.title}</div>
              <div className="mt-1 text-sm text-text-secondary">{course.professor_name}</div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.05em] text-text-secondary">
                  <span>Progress</span>
                  <span>
                    {course.submitted_assignments}/{course.total_assignments}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-strong">
                  <div className="h-2 rounded-full bg-primary-light" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
