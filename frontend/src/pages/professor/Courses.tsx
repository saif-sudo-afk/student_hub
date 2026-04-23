import { Link } from 'react-router-dom';

import { getProfessorCourses } from '@/api/professor';
import { Spinner } from '@/components/common/Spinner';
import { useApiQuery } from '@/hooks/useApi';

export function ProfessorCoursesPage() {
  const coursesQuery = useApiQuery(['professor-courses'], getProfessorCourses);

  if (coursesQuery.isLoading || !coursesQuery.data) {
    return <Spinner label="Loading courses..." />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {coursesQuery.data.map((course) => (
        <Link key={course.id} to={`/professor/courses/${course.id}`} className="app-card p-6 transition hover:-translate-y-1 hover:shadow-soft">
          <div className="text-sm font-semibold uppercase tracking-[0.05em] text-primary-light">{course.code}</div>
          <h3 className="mt-3">{course.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm text-text-secondary">{course.description || 'No description provided.'}</p>
        </Link>
      ))}
    </div>
  );
}
