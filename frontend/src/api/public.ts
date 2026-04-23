import { client } from '@/api/client';
import type { ApiListResponse, MajorOption, PublicStats } from '@/types';

export async function getPublicStats() {
  const response = await client.get<PublicStats>('/api/public/stats/');
  return response.data;
}

export async function getPublicMajors() {
  const response = await client.get<ApiListResponse<MajorOption>>('/api/public/majors/');
  return response.data.results;
}
