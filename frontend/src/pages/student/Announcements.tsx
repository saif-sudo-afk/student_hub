import { getStudentAnnouncements } from '@/api/student';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function StudentAnnouncementsPage() {
  const announcementsQuery = useApiQuery(['student-announcements'], getStudentAnnouncements);

  if (announcementsQuery.isLoading || !announcementsQuery.data) {
    return <Spinner label="Loading announcements..." />;
  }

  return (
    <div className="space-y-4">
      {announcementsQuery.data.map((announcement) => (
        <div key={announcement.id} className="section-shell">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3>{announcement.title}</h3>
              <p className="mt-3 text-sm text-text-secondary">{announcement.content}</p>
            </div>
            <Badge tone={announcement.priority > 0 ? 'amber' : 'gray'}>{announcement.scope}</Badge>
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-[0.05em] text-text-secondary">
            {formatDate(announcement.publish_date)}
          </div>
        </div>
      ))}
    </div>
  );
}
