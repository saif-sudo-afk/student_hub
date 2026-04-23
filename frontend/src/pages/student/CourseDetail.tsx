import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { getStudentCourseDetail, submitAssignment } from '@/api/student';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';
import { formatGrade } from '@/utils/formatGrade';

const tabs = ['Assignments', 'Materials', 'Announcements'] as const;

export function StudentCourseDetailPage() {
  const { courseId = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Assignments');
  const detailQuery = useApiQuery(['student-course-detail', courseId], () => getStudentCourseDetail(courseId), {
    enabled: Boolean(courseId),
  });
  const submitMutation = useMutation({
    mutationFn: ({ assignmentId, file }: { assignmentId: string; file: File }) => submitAssignment(assignmentId, file),
    onSuccess: async () => {
      await detailQuery.refetch();
    },
  });

  const content = useMemo(() => detailQuery.data, [detailQuery.data]);

  if (detailQuery.isLoading || !content) {
    return <Spinner label="Loading course detail..." />;
  }

  return (
    <div className="space-y-6">
      <section className="section-shell">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.05em] text-primary-light">{content.code}</div>
            <h2 className="mt-2">{content.title}</h2>
            <p className="mt-3 max-w-3xl text-text-secondary">{content.description || 'No course description provided.'}</p>
          </div>
          <div className="grid gap-2 text-sm text-text-secondary">
            <div>Professor: {content.professor_name}</div>
            <div>Enrolled count: {content.enrolled_count ?? 'N/A'}</div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab ? 'bg-primary-light text-white' : 'bg-white text-text-secondary'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      {activeTab === 'Assignments' ? (
        <Table headers={['Title', 'Due Date', 'Status', 'Grade', 'Action']}>
          {content.assignments.map((assignment) => (
            <tr key={assignment.id} className="transition hover:bg-surface">
              <td className="table-cell font-medium">{assignment.title}</td>
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
                  <span className="text-sm text-text-secondary">View</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      ) : null}

      {activeTab === 'Materials' ? (
        <div className="space-y-4">
          {content.materials.map((material) => (
            <div key={material.id} className="section-shell flex items-center justify-between gap-4">
              <div>
                <h4>{material.title}</h4>
                <div className="mt-1 text-sm text-text-secondary">{formatDate(material.uploaded_at)}</div>
              </div>
              {material.url ? (
                <a href={material.url} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2">
                  Download
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === 'Announcements' ? (
        <div className="space-y-4">
          {content.announcements.map((announcement) => (
            <div key={announcement.id} className="section-shell">
              <div className="flex items-center justify-between gap-4">
                <h4>{announcement.title}</h4>
                <Badge tone={announcement.priority > 0 ? 'amber' : 'gray'}>{announcement.scope}</Badge>
              </div>
              <p className="mt-3 text-sm text-text-secondary">{announcement.content}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
