import { getAdminAnnouncements } from '@/api/admin';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminAnnouncementsPage() {
  const announcementsQuery = useApiQuery(['admin-announcements'], getAdminAnnouncements);

  if (announcementsQuery.isLoading || !announcementsQuery.data) {
    return <Spinner label="Loading announcements..." />;
  }

  return (
    <Table headers={['Title', 'Scope', 'Status', 'Priority', 'Created By', 'Published']}>
      {announcementsQuery.data.map((announcement) => (
        <tr key={announcement.id}>
          <td className="table-cell font-medium">{announcement.title}</td>
          <td className="table-cell text-text-secondary">{announcement.scope}</td>
          <td className="table-cell text-text-secondary">{announcement.status}</td>
          <td className="table-cell">{announcement.priority}</td>
          <td className="table-cell text-text-secondary">{announcement.created_by ?? 'System'}</td>
          <td className="table-cell text-text-secondary">{formatDate(announcement.publish_date)}</td>
        </tr>
      ))}
    </Table>
  );
}
