import { client } from '@/api/client';
import type {
  AdminAISummaryData,
  AdminDashboardData,
  AnnouncementSummary,
  ApiListResponse,
  CourseSummary,
  UserSummary,
} from '@/types';

export interface AdminAIEntry {
  id: string;
  user_name: string | null;
  user_email: string | null;
  role: string | null;
  message_preview: string;
  topic: string;
  tokens_in: number;
  tokens_out: number;
  timestamp: string;
}

export async function getAdminDashboard() {
  const response = await client.get<AdminDashboardData>('/api/admin/dashboard/');
  return response.data;
}

export async function getAdminUsers(params?: { role?: string; search?: string }) {
  const response = await client.get<ApiListResponse<UserSummary>>('/api/admin/users/', { params });
  return response.data.results;
}

export interface AdminUserPayload {
  full_name: string;
  email: string;
  password?: string;
  role: 'student' | 'professor' | 'admin';
  is_active?: boolean;
  department?: string;
  employee_code?: string;
  office?: string;
  major_id?: string;
}

export async function createAdminUser(payload: AdminUserPayload) {
  const response = await client.post<UserSummary>('/api/admin/users/', payload);
  return response.data;
}

export async function updateAdminUser(userId: string, payload: Partial<AdminUserPayload>) {
  const response = await client.patch<UserSummary>(`/api/admin/users/${userId}/`, payload);
  return response.data;
}

export async function deleteAdminUser(userId: string) {
  await client.delete(`/api/admin/users/${userId}/`);
}

export async function getAdminCourses() {
  const response = await client.get<ApiListResponse<CourseSummary>>('/api/admin/courses/');
  return response.data.results;
}

export async function getAdminAnnouncements() {
  const response = await client.get<ApiListResponse<AnnouncementSummary>>('/api/admin/announcements/');
  return response.data.results;
}

export interface AdminAnnouncementPayload {
  title: string;
  content: string;
  scope: string;
  status: string;
  priority: number;
  send_notification?: boolean;
  publish_date?: string;
  expiry_date?: string;
  course_id?: string;
}

export async function createAdminAnnouncement(payload: AdminAnnouncementPayload) {
  const response = await client.post<AnnouncementSummary>('/api/admin/announcements/', payload);
  return response.data;
}

export async function updateAdminAnnouncement(announcementId: string, payload: Partial<AdminAnnouncementPayload>) {
  const response = await client.patch<AnnouncementSummary>(`/api/admin/announcements/${announcementId}/`, payload);
  return response.data;
}

export async function deleteAdminAnnouncement(announcementId: string) {
  await client.delete(`/api/admin/announcements/${announcementId}/`);
}

export async function getAdminAILogs(params?: {
  role?: string;
  topic?: string;
  date_from?: string;
  date_to?: string;
}) {
  const response = await client.get<ApiListResponse<AdminAIEntry>>('/api/admin/ai-logs/', { params });
  return response.data.results;
}

export async function getAdminAISummary() {
  const response = await client.get<AdminAISummaryData>('/api/admin/ai-summary/');
  return response.data;
}
