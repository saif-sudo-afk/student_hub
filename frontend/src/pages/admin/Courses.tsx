import { getAdminCourses } from '@/api/admin';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';

export function AdminCoursesPage() {
  const coursesQuery = useApiQuery(['admin-courses'], getAdminCourses);

  if (coursesQuery.isError) {
    return (
      <ErrorState
        title="Courses could not load"
        description="The admin courses request failed. Check the backend logs if this keeps happening."
        onAction={() => coursesQuery.refetch()}
      />
    );
  }

  if (coursesQuery.isLoading || !coursesQuery.data) {
    return <Spinner label="Loading courses..." />;
  }

  if (coursesQuery.data.length === 0) {
    return <EmptyState title="No courses" description="Courses will appear here once they are created." />;
  }

  return (
    <Table headers={['Code', 'Title', 'Professor', 'Semester', 'Status']}>
      {coursesQuery.data.map((course) => (
        <tr key={course.id}>
          <td className="table-cell font-medium">{course.code}</td>
          <td className="table-cell">{course.title}</td>
          <td className="table-cell text-text-secondary">{course.professor_name}</td>
          <td className="table-cell text-text-secondary">{course.semester.name}</td>
          <td className="table-cell text-text-secondary">{course.is_active ? 'Active' : 'Inactive'}</td>
        </tr>
      ))}
    </Table>
  );
}
