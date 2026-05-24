import { useEffect, useState } from 'react';
import { fetchLatestConfirmed } from '../api';
import AudioButton from './AudioButton';
import type { Detection } from '../types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return remMinutes > 0 ? `${hours}h ${remMinutes}m ago` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h ago` : `${days}d ago`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function statusLabel(d: Detection): string {
  if (d.is_confirmed_train === true) return 'Confirmed';
  if (d.is_confirmed_train === false) return 'Not a Train';
  return 'Unknown';
}

function statusClass(d: Detection): string {
  if (d.is_confirmed_train === true) return 'status-confirmed';
  if (d.is_confirmed_train === false) return 'status-false';
  return 'status-suspected';
}

export default function LatestTrain() {
  const [detection, setDetection] = useState<Detection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLatestConfirmed()
      .then(data => { if (!cancelled) setDetection(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="latest-train card">
      <h2 className="section-title">Last Confirmed Train</h2>
      {loading && <p className="panel-placeholder">Loading…</p>}
      {(error || (!loading && !detection)) && (
        <p className="no-data">No detections found</p>
      )}
      {detection && (
        <div className="latest-train__content">
          <div className="latest-train__time">
            <span className="latest-train__ago">{timeAgo(detection.timestamp)}</span>
            <span className="latest-train__date">{formatDateTime(detection.timestamp)}</span>
          </div>
          <div className="latest-train__meta">
            <span className="chip">{Number(detection.decibels).toFixed(1)} dB</span>
            <span className="chip">{Number(detection.duration_seconds).toFixed(1)}s</span>
            {detection.source && <span className="chip">{detection.source}</span>}
            <span className={`status-badge ${statusClass(detection)}`}>
              {statusLabel(detection)}
            </span>
          </div>
          {detection.audio_url && (
            <div style={{ marginTop: '12px' }}>
              <AudioButton detectionId={detection.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
