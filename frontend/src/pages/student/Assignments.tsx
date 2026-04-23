import { useMutation } from '@tanstack/react-query';

import { getStudentAssignments, submitAssignment } from '@/api/student';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';
import { formatGrade } from '@/utils/formatGrade';

export function StudentAssignmentsPage() {
  const assignmentsQuery = useApiQuery(['student-assignments'], getStudentAssignments);
  const submitMutation = useMutation({
    mutationFn: ({ assignmentId, file }: { assignmentId: string; file: File }) => submitAssignment(assignmentId, file),
    onSuccess: async () => {
      await assignmentsQuery.refetch();
    },
  });

  if (assignmentsQuery.isLoading || !assignmentsQuery.data) {
    return <Spinner label="Loading assignments..." />;
  }

  return (
    <Table headers={['Assignment', 'Course', 'Due Date', 'Status', 'Grade', 'Action']}>
      {assignmentsQuery.data.map((assignment) => (
        <tr key={assignment.id} className="transition hover:bg-surface">
          <td className="table-cell font-medium">{assignment.title}</td>
          <td className="table-cell text-text-secondary">{assignment.course_title}</td>
          <td className="table-cell text-text-secondary">{formatDate(assignment.due_at)}</td>
          <td className="table-cell">
            <Badge tone={assignment.submission_status === 'returned' ? 'green' : assignment.submission_status === 'pending' ? 'amber' : 'gray'}>
              {assignment.submission_status.replaceAll('_', ' ')}
            </Badge>
          </td>
          <td className="table-cell">{formatGrade(assignment.grade, assignment.max_score)}</td>
          <td className="table-cell">
            {assignment.submission_status === 'not_submitted' ? (
              <label className="btn-secondary cursor-pointer px-4 py-2">
                Submit
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      submitMutation.mutate({ assignmentId: assignment.id, file });
                    }
                  }}
                />
              </label>
            ) : (
              <span className="text-sm text-text-secondary">Submitted</span>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}
