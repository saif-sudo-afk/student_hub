import { getAdminAnnouncements } from '@/api/admin';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminAnnouncementsPage() {
  const announcementsQuery = useApiQuery(['admin-announcements'], getAdminAnnouncements);

  if (announcementsQuery.isError) {
    return (
      <ErrorState
        title="Announcements could not load"
        description="The admin announcements request failed. Check the backend logs if this keeps happening."
        onAction={() => announcementsQuery.refetch()}
      />
    );
  }

  if (announcementsQuery.isLoading || !announcementsQuery.data) {
    return <Spinner label="Loading announcements..." />;
  }

  if (announcementsQuery.data.length === 0) {
    return <EmptyState title="No announcements" description="Published announcements will appear here." />;
  }

  return (
    <Table headers={['Title', 'Scope', 'Target', 'Status', 'Priority', 'Created By', 'Updated By', 'Published', 'Updated']}>
      {announcementsQuery.data.map((announcement) => (
        <tr key={announcement.id}>
          <td className="table-cell font-medium">{announcement.title}</td>
          <td className="table-cell text-text-secondary">{announcement.scope}</td>
          <td className="table-cell text-text-secondary">{announcement.target_role}</td>
          <td className="table-cell text-text-secondary">{announcement.status}</td>
          <td className="table-cell">{announcement.priority}</td>
          <td className="table-cell text-text-secondary">{announcement.created_by ?? 'System'}</td>
          <td className="table-cell text-text-secondary">{announcement.last_updated_by ?? 'N/A'}</td>
          <td className="table-cell text-text-secondary">{formatDate(announcement.publish_date)}</td>
          <td className="table-cell text-text-secondary">{formatDate(announcement.updated_at)}</td>
        </tr>
      ))}
    </Table>
  );
}
