import { client } from '@/api/client';
import type { PublicStats } from '@/types';

export async function getPublicStats() {
  const response = await client.get<PublicStats>('/api/public/stats/');
  return response.data;
}
