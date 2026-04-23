import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { createProfessorAssignment, getProfessorAssignments, getProfessorCourses } from '@/api/professor';
import { FileUpload } from '@/components/common/FileUpload';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function ProfessorAssignmentsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState('20');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);

  const assignmentsQuery = useApiQuery(['professor-assignments'], getProfessorAssignments);
  const coursesQuery = useApiQuery(['professor-courses'], getProfessorCourses);
  const createMutation = useMutation({
    mutationFn: () =>
      createProfessorAssignment({
        title,
        description,
        course,
        due_date: dueDate,
        max_score: maxScore,
        attachment,
        is_published: isPublished,
      }),
    onSuccess: async () => {
      setTitle('');
      setDescription('');
      setCourse('');
      setDueDate('');
      setMaxScore('20');
      setAttachment(null);
      setIsPublished(true);
      await assignmentsQuery.refetch();
    },
  });

  if (assignmentsQuery.isLoading || coursesQuery.isLoading || !assignmentsQuery.data || !coursesQuery.data) {
    return <Spinner label="Loading assignments..." />;
  }

  return (
    <div className="space-y-6">
      <section className="section-shell">
        <h3>Create Assignment</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Title</label>
            <input className="form-input w-full" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Course</label>
            <select className="form-input w-full" value={course} onChange={(event) => setCourse(event.target.value)}>
              <option value="">Select a course</option>
              {coursesQuery.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea className="form-textarea w-full" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Due Date</label>
            <input type="datetime-local" className="form-input w-full" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Max Score</label>
            <input className="form-input w-full" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <FileUpload id="assignment-attachment" label="Attachment" onChange={setAttachment} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
            Publish immediately
          </label>
        </div>
        <button type="button" className="btn-primary mt-5" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
        </button>
      </section>

      <section className="section-shell">
        <h3>My Assignments</h3>
        <div className="mt-5">
          <Table headers={['Title', 'Course', 'Due Date', 'Status', 'Action']}>
            {assignmentsQuery.data.map((assignment) => (
              <tr key={assignment.id}>
                <td className="table-cell font-medium">{assignment.title}</td>
                <td className="table-cell text-text-secondary">{assignment.course_title}</td>
                <td className="table-cell text-text-secondary">{formatDate(assignment.due_at)}</td>
                <td className="table-cell text-text-secondary">{assignment.is_published ? 'Published' : 'Draft'}</td>
                <td className="table-cell">
                  <Link to={`/professor/assignments/${assignment.id}/submissions`} className="text-sm font-semibold text-primary-light">
                    View Submissions
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </section>
    </div>
  );
}
