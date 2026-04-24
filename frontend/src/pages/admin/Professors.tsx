import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createAdminUser, getAdminUsers } from '@/api/admin';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Spinner } from '@/components/common/Spinner';
import { Table } from '@/components/common/Table';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function AdminProfessorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department: '',
    employee_code: '',
    office: '',
  });
  const [error, setError] = useState('');
  const professorsQuery = useApiQuery(['admin-users', 'professor', search], () =>
    getAdminUsers({ role: 'professor', search: search || undefined }),
  );
  const createProfessor = useMutation({
    mutationFn: () =>
      createAdminUser({
        ...form,
        role: 'professor',
        password: form.password || 'ChangeMe123!',
      }),
    onSuccess: () => {
      setForm({ full_name: '', email: '', password: '', department: '', employee_code: '', office: '' });
      setError('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: () => setError('Professor could not be created. Check the email and required fields.'),
  });

  if (professorsQuery.isError) {
    return (
      <ErrorState
        title="Professors could not load"
        description="The admin professors request failed. Check the backend logs if this keeps happening."
        onAction={() => professorsQuery.refetch()}
      />
    );
  }

  if (professorsQuery.isLoading || !professorsQuery.data) {
    return <Spinner label="Loading professors..." />;
  }

  return (
    <div className="space-y-6">
      <section className="section-shell">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="form-input" placeholder="Full name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
          <input className="form-input" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="form-input" placeholder="Temporary password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <input className="form-input" placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          <input className="form-input" placeholder="Employee code" value={form.employee_code} onChange={(event) => setForm({ ...form, employee_code: event.target.value })} />
          <input className="form-input" placeholder="Office" value={form.office} onChange={(event) => setForm({ ...form, office: event.target.value })} />
        </div>
        {error ? <div className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div> : null}
        <button type="button" className="btn-primary mt-4" disabled={createProfessor.isPending} onClick={() => createProfessor.mutate()}>
          {createProfessor.isPending ? 'Creating...' : 'Add professor'}
        </button>
      </section>
      <section className="section-shell">
        <input className="form-input" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
      </section>
      {professorsQuery.data.length === 0 ? (
        <EmptyState title="No professors" description="Professor accounts will appear here once they are created." />
      ) : (
        <Table headers={['Avatar', 'Name', 'Email', 'Department', 'Office', 'Joined']}>
          {professorsQuery.data.map((professor) => (
            <tr key={professor.id}>
              <td className="table-cell">
                <Avatar name={professor.name} image={professor.avatar} />
              </td>
              <td className="table-cell font-medium">{professor.name}</td>
              <td className="table-cell text-text-secondary">{professor.email}</td>
              <td className="table-cell text-text-secondary">{professor.professor_profile?.department ?? 'General'}</td>
              <td className="table-cell text-text-secondary">{professor.professor_profile?.office ?? 'N/A'}</td>
              <td className="table-cell text-text-secondary">{formatDate(professor.joined)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
