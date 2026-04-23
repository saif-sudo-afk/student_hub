import { Link } from 'react-router-dom';

import { getStudentCourses } from '@/api/student';
import { Spinner } from '@/components/common/Spinner';
import { useApiQuery } from '@/hooks/useApi';

export function StudentCoursesPage() {
  const coursesQuery = useApiQuery(['student-courses'], getStudentCourses);

  if (coursesQuery.isLoading || !coursesQuery.data) {
    return <Spinner label="Loading courses..." />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {coursesQuery.data.map((course) => (
        <Link key={course.id} to={`/student/courses/${course.id}`} className="app-card p-6 transition hover:-translate-y-1 hover:shadow-soft">
          <div className="text-sm font-semibold uppercase tracking-[0.05em] text-primary-light">{course.code}</div>
          <h3 className="mt-3">{course.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm text-text-secondary">{course.description || 'No description available.'}</p>
          <div className="mt-5 text-sm text-text-secondary">{course.professor_name}</div>
        </Link>
      ))}
    </div>
  );
}
