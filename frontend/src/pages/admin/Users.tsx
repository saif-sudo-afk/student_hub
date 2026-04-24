import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAdminUsers, updateAdminUser } from '@/api/admin';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const usersQuery = useApiQuery(['admin-users', 'student', search], () => getAdminUsers({ role: 'student', search: search || undefined }));
  const updateUser = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => updateAdminUser(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

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
        <Table headers={['Avatar', 'Name', 'Email', 'Status', 'Joined', 'Actions']}>
          {usersQuery.data.map((user) => (
            <tr key={user.id}>
              <td className="table-cell">
                <Avatar name={user.name} image={user.avatar} />
              </td>
              <td className="table-cell font-medium">{user.name}</td>
              <td className="table-cell text-text-secondary">{user.email}</td>
              <td className="table-cell capitalize">{user.is_active ? 'Active' : 'Inactive'}</td>
              <td className="table-cell text-text-secondary">{formatDate(user.joined)}</td>
              <td className="table-cell">
                <button type="button" className="btn-secondary" onClick={() => updateUser.mutate({ id: user.id, is_active: !user.is_active })}>
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
