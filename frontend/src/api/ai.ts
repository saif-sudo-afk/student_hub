import { client } from '@/api/client';
import type { AIHistoryResponse } from '@/types';

export async function getAIHistory() {
  const response = await client.get<AIHistoryResponse>('/api/ai/history/');
  return response.data;
}

export async function sendAIMessage(message: string) {
  const response = await client.post<{ reply: string; conversation_id: string }>('/api/ai/chat/', {
    message,
  });
  return response.data;
}

export async function clearAIHistory() {
  await client.post('/api/ai/clear/');
}
