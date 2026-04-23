import { BarChart2, FileClock, FileText, Users } from 'lucide-react';

import { getProfessorStats } from '@/api/professor';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';

export function ProfessorStatsPage() {
  const statsQuery = useApiQuery(['professor-stats'], getProfessorStats);

  if (statsQuery.isLoading || !statsQuery.data) {
    return <Spinner label="Loading statistics..." />;
  }

  const data = statsQuery.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Submissions" value={data.total_submissions} icon={FileText} accentClassName="border-l-primary-light" />
        <StatCard title="Pending" value={data.pending_submissions} icon={FileClock} accentClassName="border-l-warning" />
        <StatCard title="Not Submitted" value={data.not_submitted_count} icon={Users} accentClassName="border-l-danger" />
        <StatCard
          title="Overall Avg Grade"
          value={data.overall_avg_grade != null ? `${Math.round(data.overall_avg_grade)}%` : 'N/A'}
          icon={BarChart2}
          accentClassName="border-l-success"
        />
      </section>

      <section className="section-shell">
        <h3>Assignment Performance</h3>
        <div className="mt-5">
          <Table headers={['Title', 'Course', 'Received', 'Pending', 'Average Grade']}>
            {data.assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="table-cell font-medium">{assignment.title}</td>
                <td className="table-cell text-text-secondary">{assignment.course}</td>
                <td className="table-cell">{assignment.submissions_received}</td>
                <td className="table-cell">{assignment.submissions_pending}</td>
                <td className="table-cell">{assignment.average_grade != null ? `${Math.round(assignment.average_grade)}%` : 'N/A'}</td>
              </tr>
            ))}
          </Table>
        </div>
      </section>

      <section className="section-shell">
        <h3>Students with Missing Submissions</h3>
        <div className="mt-5 space-y-3">
          {data.missing_students.map((student) => (
            <div key={student.student_number} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <div className="font-medium">{student.student_name}</div>
                <div className="text-sm text-text-secondary">{student.student_number}</div>
              </div>
              <div className="text-sm font-semibold text-danger">{student.missing_count} missing</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
