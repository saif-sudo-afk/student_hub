import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { getAdminUsers, updateAdminUser } from '@/api/admin';
import { Avatar } from '@/components/common/Avatar';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const usersQuery = useApiQuery(['admin-users', roleFilter, search], () => getAdminUsers({ role: roleFilter || undefined, search: search || undefined }));
  const updateMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateAdminUser(userId, role),
    onSuccess: async () => {
      await usersQuery.refetch();
    },
  });

  if (usersQuery.isLoading || !usersQuery.data) {
    return <Spinner label="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      <section className="section-shell grid gap-4 md:grid-cols-[1fr_220px]">
        <input className="form-input" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="form-input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="professor">Professor</option>
          <option value="admin">Admin</option>
        </select>
      </section>
      <Table headers={['Avatar', 'Name', 'Email', 'Role', 'Joined', 'Actions']}>
        {usersQuery.data.map((user) => (
          <tr key={user.id}>
            <td className="table-cell">
              <Avatar name={user.name} image={user.avatar} />
            </td>
            <td className="table-cell font-medium">{user.name}</td>
            <td className="table-cell text-text-secondary">{user.email}</td>
            <td className="table-cell">
              <select
                className="form-input min-w-[140px]"
                value={user.role}
                onChange={(event) => updateMutation.mutate({ userId: user.id, role: event.target.value })}
              >
                <option value="student">student</option>
                <option value="professor">professor</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td className="table-cell text-text-secondary">{formatDate(user.joined)}</td>
            <td className="table-cell text-sm text-primary-light">Edit role</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
