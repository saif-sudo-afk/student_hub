import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { getProfessorCourseDetail, uploadProfessorMaterial } from '@/api/professor';
import { FileUpload } from '@/components/common/FileUpload';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function ProfessorCourseDetailPage() {
  const { courseId = '' } = useParams();
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const detailQuery = useApiQuery(['professor-course-detail', courseId], () => getProfessorCourseDetail(courseId), {
    enabled: Boolean(courseId),
  });
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!materialFile) {
        throw new Error('Select a file before uploading.');
      }
      return uploadProfessorMaterial(courseId, materialTitle, materialFile);
    },
    onSuccess: async () => {
      setMaterialTitle('');
      setMaterialFile(null);
      await detailQuery.refetch();
    },
  });

  if (detailQuery.isLoading || !detailQuery.data) {
    return <Spinner label="Loading course detail..." />;
  }

  const course = detailQuery.data;

  return (
    <div className="space-y-6">
      <section className="section-shell">
        <div className="text-sm font-semibold uppercase tracking-[0.05em] text-primary-light">{course.code}</div>
        <h2 className="mt-2">{course.title}</h2>
        <p className="mt-3 text-text-secondary">{course.description || 'No description provided.'}</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="section-shell">
          <h3>Enrolled Students</h3>
          <div className="mt-5">
            <Table headers={['Name', 'Student ID', 'Enrollment Date', 'Status']}>
              {course.students.map((student) => (
                <tr key={student.id}>
                  <td className="table-cell font-medium">{student.name}</td>
                  <td className="table-cell text-text-secondary">{student.student_number}</td>
                  <td className="table-cell text-text-secondary">{formatDate(student.enrollment_date)}</td>
                  <td className="table-cell text-text-secondary">{student.status}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>

        <div className="section-shell">
          <h3>Upload Material</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="material-title">
                Title
              </label>
              <input
                id="material-title"
                className="form-input w-full"
                value={materialTitle}
                onChange={(event) => setMaterialTitle(event.target.value)}
              />
            </div>
            <FileUpload
              id="material-file"
              label="File"
              accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.gif"
              onChange={setMaterialFile}
            />
            <button type="button" className="btn-primary" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <h3>Resources</h3>
        <div className="mt-5 space-y-3">
          {course.materials.map((material) => (
            <div key={material.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <div className="font-medium">{material.title}</div>
                <div className="text-sm text-text-secondary">{formatDate(material.uploaded_at)}</div>
              </div>
              {material.url ? (
                <a href={material.url} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2">
                  Download
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <h3>Assignments</h3>
        <div className="mt-5">
          <Table headers={['Title', 'Due Date', 'Max Score', 'Submissions']}>
            {course.assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="table-cell font-medium">{assignment.title}</td>
                <td className="table-cell text-text-secondary">{formatDate(assignment.due_at)}</td>
                <td className="table-cell">{assignment.max_score}</td>
                <td className="table-cell">{assignment.submissions_count ?? 0}</td>
              </tr>
            ))}
          </Table>
        </div>
      </section>
    </div>
  );
}
