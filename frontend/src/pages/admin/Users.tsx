import { useState } from 'react';

import { getAdminUsers } from '@/api/admin';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const usersQuery = useApiQuery(['admin-users', 'student', search], () => getAdminUsers({ role: 'student', search: search || undefined }));

  if (usersQuery.isError) {
    return (
      <ErrorState
        title="Students could not load"
        description="The admin students request failed. Check the backend logs if this keeps happening."
        onAction={() => usersQuery.refetch()}
      />
    );
  }

  if (usersQuery.isLoading || !usersQuery.data) {
    return <Spinner label="Loading students..." />;
  }

  return (
    <div className="space-y-6">
      <section className="section-shell">
        <input className="form-input" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
      </section>
      {usersQuery.data.length === 0 ? (
        <EmptyState title="No students" description="Student accounts will appear here after registration." />
      ) : (
        <Table headers={['Avatar', 'Name', 'Email', 'Role', 'Joined']}>
          {usersQuery.data.map((user) => (
            <tr key={user.id}>
              <td className="table-cell">
                <Avatar name={user.name} image={user.avatar} />
              </td>
              <td className="table-cell font-medium">{user.name}</td>
              <td className="table-cell text-text-secondary">{user.email}</td>
              <td className="table-cell capitalize">{user.role}</td>
              <td className="table-cell text-text-secondary">{formatDate(user.joined)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
