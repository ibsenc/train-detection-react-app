export interface Detection {
  id: number;
  timestamp: string;
  decibels: number;
  duration_seconds: number;
  source: string | null;
  audio_url: string | null;
  is_suspected_train: boolean;
  is_confirmed_train: boolean | null;
  created_at: string;
}

export interface DetectionsResponse {
  total: number;
  limit: number;
  offset: number;
  data: Detection[];
}

export interface Stats {
  total_events: number;
  suspected_trains: number;
  confirmed_trains: number;
  confirmed_false_positives: number;
  unreviewed_suspected: number;
  last_suspected_at: string | null;
  last_confirmed_at: string | null;
  avg_decibels: string;
  max_decibels: string;
  avg_duration_seconds: string;
}
