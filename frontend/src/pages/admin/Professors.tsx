import { useState } from 'react';

import { getAdminUsers } from '@/api/admin';
import { Avatar } from '@/components/common/Avatar';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminProfessorsPage() {
  const [search, setSearch] = useState('');
  const professorsQuery = useApiQuery(['admin-users', 'professor', search], () =>
    getAdminUsers({ role: 'professor', search: search || undefined }),
  );

  if (professorsQuery.isLoading || !professorsQuery.data) {
    return <Spinner label="Loading professors..." />;
  }

  return (
    <div className="space-y-6">
      <section className="section-shell">
        <input className="form-input" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
      </section>
      <Table headers={['Avatar', 'Name', 'Email', 'Role', 'Joined']}>
        {professorsQuery.data.map((professor) => (
          <tr key={professor.id}>
            <td className="table-cell">
              <Avatar name={professor.name} image={professor.avatar} />
            </td>
            <td className="table-cell font-medium">{professor.name}</td>
            <td className="table-cell text-text-secondary">{professor.email}</td>
            <td className="table-cell capitalize">{professor.role}</td>
            <td className="table-cell text-text-secondary">{formatDate(professor.joined)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
