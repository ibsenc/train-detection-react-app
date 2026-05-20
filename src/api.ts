import type { Detection, DetectionsResponse, Stats } from './types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

export async function fetchStats(source?: string): Promise<Stats> {
  const params = new URLSearchParams();
  if (source) params.set('source', source);
  const qs = params.toString();
  const res = await fetch(`${BASE_URL}/api/detections/stats${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json() as Promise<Stats>;
}

export async function fetchLatest(confirmedOnly = false): Promise<Detection> {
  const res = await fetch(`${BASE_URL}/api/detections/latest?confirmed_only=${confirmedOnly}`);
  if (res.status === 404) throw new Error('No detections found');
  if (!res.ok) throw new Error('Failed to fetch latest detection');
  return res.json() as Promise<Detection>;
}

export interface FetchDetectionsParams {
  start?: string;
  end?: string;
  min_db?: number;
  confirmed_only?: boolean;
  source?: string;
  limit?: number;
  offset?: number;
}

export async function patchDetection(id: number, isConfirmedTrain: boolean | null): Promise<Detection> {
  const res = await fetch(`${BASE_URL}/api/detections/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_confirmed_train: isConfirmedTrain }),
  });
  if (res.status === 404) throw new Error('Detection not found');
  if (!res.ok) throw new Error('Failed to update detection');
  return res.json() as Promise<Detection>;
}

export async function fetchAudioUrl(id: number): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/detections/${id}/audio-url`);
  if (res.status === 404) throw new Error('No audio file for this detection');
  if (!res.ok) throw new Error('Failed to fetch audio URL');
  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function fetchDetections(params: FetchDetectionsParams = {}): Promise<DetectionsResponse> {
  const query = new URLSearchParams();
  if (params.start) query.set('start', params.start);
  if (params.end) query.set('end', params.end);
  if (params.min_db !== undefined) query.set('min_db', String(params.min_db));
  if (params.confirmed_only !== undefined) query.set('confirmed_only', String(params.confirmed_only));
  if (params.source) query.set('source', params.source);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  const res = await fetch(`${BASE_URL}/api/detections?${query}`);
  if (!res.ok) throw new Error('Failed to fetch detections');
  return res.json() as Promise<DetectionsResponse>;
}
