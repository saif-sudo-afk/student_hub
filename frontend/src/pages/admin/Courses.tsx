import { getAdminCourses } from '@/api/admin';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';

export function AdminCoursesPage() {
  const coursesQuery = useApiQuery(['admin-courses'], getAdminCourses);

  if (coursesQuery.isLoading || !coursesQuery.data) {
    return <Spinner label="Loading courses..." />;
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
