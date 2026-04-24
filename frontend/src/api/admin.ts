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

export async function getAdminCourses() {
  const response = await client.get<ApiListResponse<CourseSummary>>('/api/admin/courses/');
  return response.data.results;
}

export async function getAdminAnnouncements() {
  const response = await client.get<ApiListResponse<AnnouncementSummary>>('/api/admin/announcements/');
  return response.data.results;
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
