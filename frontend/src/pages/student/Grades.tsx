import { Fragment, useState } from 'react';
import { BarChart2, MessageSquareMore } from 'lucide-react';

import { getStudentGrades } from '@/api/student';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';
import { formatGrade } from '@/utils/formatGrade';

export function StudentGradesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const gradesQuery = useApiQuery(['student-grades'], getStudentGrades);

  if (gradesQuery.isLoading || !gradesQuery.data) {
    return <Spinner label="Loading grades..." />;
  }

  const data = gradesQuery.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Overall Average"
          value={data.overall_average != null ? `${Math.round(data.overall_average)}%` : 'N/A'}
          icon={BarChart2}
          accentClassName="border-l-success"
        />
        <StatCard title="Total Graded" value={data.graded_count} icon={MessageSquareMore} accentClassName="border-l-primary-light" />
      </section>

      <Table headers={['Assignment', 'Course', 'Submitted', 'Grade', 'Feedback']}>
        {data.results.map((grade) => {
          const percentage = (grade.grade / grade.max_score) * 100;
          const tone = percentage >= 70 ? 'green' : percentage >= 50 ? 'amber' : 'red';
          return (
            <Fragment key={grade.id}>
              <tr className="transition hover:bg-surface">
                <td className="table-cell font-medium">{grade.assignment}</td>
                <td className="table-cell text-text-secondary">{grade.course}</td>
                <td className="table-cell text-text-secondary">{formatDate(grade.submitted_at)}</td>
                <td className="table-cell">
                  <Badge tone={tone}>{formatGrade(grade.grade, grade.max_score)}</Badge>
                </td>
                <td className="table-cell">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary-light"
                    onClick={() => setExpandedId((current) => (current === grade.id ? null : grade.id))}
                  >
                    View
                  </button>
                </td>
              </tr>
              {expandedId === grade.id ? (
                <tr>
                  <td className="table-cell bg-surface text-text-secondary" colSpan={5}>
                    {grade.feedback || 'No feedback available.'}
                  </td>
                </tr>
              ) : null}
            </Fragment>
          );
        })}
      </Table>
    </div>
  );
}
