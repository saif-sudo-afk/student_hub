import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { getProfessorAssignmentSubmissions, gradeProfessorSubmission } from '@/api/professor';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function ProfessorSubmissionReviewPage() {
  const { assignmentId = '' } = useParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const submissionsQuery = useApiQuery(
    ['professor-assignment-submissions', assignmentId],
    () => getProfessorAssignmentSubmissions(assignmentId),
    { enabled: Boolean(assignmentId) },
  );
  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, gradeValue, feedbackValue }: { submissionId: string; gradeValue: number; feedbackValue: string }) =>
      gradeProfessorSubmission(submissionId, gradeValue, feedbackValue),
    onSuccess: async () => {
      setEditingId(null);
      setGrade('');
      setFeedback('');
      await submissionsQuery.refetch();
    },
  });

  if (submissionsQuery.isLoading || !submissionsQuery.data) {
    return <Spinner label="Loading submissions..." />;
  }

  const data = submissionsQuery.data;

  return (
    <div className="space-y-6">
      <section className="section-shell flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>{data.assignment.title}</h2>
          <p className="mt-2 text-text-secondary">
            {data.assignment.course_title} • Due {formatDate(data.assignment.due_at)} • Max {data.assignment.max_score}
          </p>
        </div>
        <a href={`/assignments/${assignmentId}/submissions/download-all/`} className="btn-secondary gap-2">
          <Download className="h-4 w-4" />
          Download All
        </a>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Submissions" value={data.stats.total_submissions} icon={Download} accentClassName="border-l-primary-light" />
        <StatCard title="Graded" value={data.stats.graded} icon={Download} accentClassName="border-l-success" />
        <StatCard title="Pending" value={data.stats.pending} icon={Download} accentClassName="border-l-warning" />
        <StatCard title="Not Submitted" value={data.stats.not_submitted} icon={Download} accentClassName="border-l-danger" />
      </section>

      <Table headers={['Student Name', 'Submitted At', 'File', 'Grade', 'Feedback', 'Action']}>
        {data.results.map((submission) => (
          <>
            <tr key={submission.id}>
              <td className="table-cell font-medium">{submission.student_name}</td>
              <td className="table-cell text-text-secondary">{formatDate(submission.submitted_at)}</td>
              <td className="table-cell">
                {submission.file_url ? (
                  <a href={submission.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary-light">
                    Download
                  </a>
                ) : (
                  <span className="text-text-secondary">No file</span>
                )}
              </td>
              <td className="table-cell">{submission.grade ?? '—'}</td>
              <td className="table-cell text-text-secondary">{submission.feedback || 'No feedback'}</td>
              <td className="table-cell">
                <button
                  type="button"
                  className="text-sm font-semibold text-primary-light"
                  onClick={() => {
                    setEditingId(editingId === submission.id ? null : submission.id);
                    setGrade(submission.grade?.toString() ?? '');
                    setFeedback(submission.feedback);
                  }}
                >
                  Grade
                </button>
              </td>
            </tr>
            {editingId === submission.id ? (
              <tr>
                <td colSpan={6} className="table-cell bg-surface">
                  <div className="grid gap-4 md:grid-cols-[160px_1fr_auto]">
                    <input className="form-input" value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="Grade" />
                    <textarea className="form-textarea min-h-[80px]" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback" />
                    <button
                      type="button"
                      className="btn-primary self-start"
                      onClick={() =>
                        gradeMutation.mutate({
                          submissionId: submission.id,
                          gradeValue: Number(grade),
                          feedbackValue: feedback,
                        })
                      }
                    >
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}
          </>
        ))}
      </Table>
    </div>
  );
}
