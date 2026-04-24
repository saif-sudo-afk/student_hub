import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import {
  createProfessorAnnouncement,
  deleteProfessorAnnouncement,
  getProfessorAnnouncements,
  getProfessorCourses,
  updateProfessorAnnouncement,
} from '@/api/professor';
import { Spinner } from '@/components/common/Spinner';
import { useApiQuery } from '@/hooks/useApi';
import { formatDate } from '@/utils/formatDate';

export function ProfessorAnnouncementsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState('course');
  const [courseId, setCourseId] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [status, setStatus] = useState('published');
  const [priority, setPriority] = useState('0');
  const [publishDate, setPublishDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const announcementsQuery = useApiQuery(['professor-announcements'], getProfessorAnnouncements);
  const coursesQuery = useApiQuery(['professor-courses'], getProfessorCourses);

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('scope', scope);
      formData.append('course', scope === 'course' ? courseId : '');
      formData.append('target_role', scope === 'role' ? targetRole : 'all');
      formData.append('status', status);
      formData.append('priority', priority);
      if (publishDate) formData.append('publish_date', publishDate);
      if (expiryDate) formData.append('expiry_date', expiryDate);
      if (attachment) formData.append('attachment', attachment);
      if (sendNotification) formData.append('send_notification', 'on');
      if (editingId) {
        return updateProfessorAnnouncement(editingId, formData);
      }
      return createProfessorAnnouncement(formData);
    },
    onSuccess: async () => {
      setEditingId(null);
      setTitle('');
      setContent('');
      setScope('course');
      setCourseId('');
      setTargetRole('all');
      setStatus('published');
      setPriority('0');
      setPublishDate('');
      setExpiryDate('');
      setSendNotification(false);
      setAttachment(null);
      await announcementsQuery.refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfessorAnnouncement,
    onSuccess: async () => {
      await announcementsQuery.refetch();
    },
  });

  const announcements = announcementsQuery.data ?? [];

  if (announcementsQuery.isLoading || coursesQuery.isLoading || !coursesQuery.data) {
    return <Spinner label="Loading announcements..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <section className="section-shell">
        <h3>{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
        <div className="mt-5 grid gap-4">
          <input className="form-input" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea className="form-textarea" placeholder="Content" value={content} onChange={(event) => setContent(event.target.value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <select className="form-input" value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="course">Course</option>
              <option value="role">Role</option>
              <option value="global">Global</option>
            </select>
            {scope === 'course' ? (
              <select className="form-input" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="">Select a course</option>
                {coursesQuery.data.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            ) : (
              <select className="form-input" value={targetRole} onChange={(event) => setTargetRole(event.target.value)}>
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="professors">Professors</option>
                <option value="admins">Admins</option>
              </select>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="datetime-local" className="form-input" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} />
            <input type="datetime-local" className="form-input" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select className="form-input" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="0">Normal</option>
              <option value="1">Important</option>
              <option value="2">Urgent</option>
            </select>
          </div>
          <input type="file" className="form-input h-auto py-2" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <input type="checkbox" checked={sendNotification} onChange={(event) => setSendNotification(event.target.checked)} />
            Send notification
          </label>
          <div className="flex gap-3">
            <button type="button" className="btn-primary" onClick={() => createMutation.mutate()}>
              {editingId ? 'Save Changes' : 'Create Announcement'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setTitle('');
                  setContent('');
                  setScope('course');
                  setCourseId('');
                  setTargetRole('all');
                  setStatus('published');
                  setPriority('0');
                  setPublishDate('');
                  setExpiryDate('');
                  setSendNotification(false);
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <h3>My Announcements</h3>
        <div className="mt-5 space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-lg border border-border px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{announcement.title}</div>
                  <p className="mt-2 text-sm text-text-secondary">{announcement.content}</p>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.05em] text-text-secondary">
                    {formatDate(announcement.publish_date)} • {announcement.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary-light"
                    onClick={() => {
                      setEditingId(announcement.id);
                      setTitle(announcement.title);
                      setContent(announcement.content);
                      setScope(announcement.scope);
                      setCourseId(announcement.course?.id ?? '');
                      setTargetRole(announcement.target_role);
                      setStatus(announcement.status);
                      setPriority(String(announcement.priority));
                      setPublishDate(announcement.publish_date ?? '');
                      setExpiryDate(announcement.expiry_date ?? '');
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="text-sm font-semibold text-danger" onClick={() => deleteMutation.mutate(announcement.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
