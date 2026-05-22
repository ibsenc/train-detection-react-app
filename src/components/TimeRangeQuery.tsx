import { useState } from 'react';
import { fetchDetections } from '../api';
import AudioButton from './AudioButton';
import ReviewButtons from './ReviewButtons';
import type { Detection, DetectionsResponse } from '../types';

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
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

const PRESETS = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Last 24h', hours: 24 },
  { label: 'Last 7 Days', hours: 168 },
  { label: 'Last 30 Days', hours: 720 },
];

export default function TimeRangeQuery() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [start, setStart] = useState(toLocalInput(yesterday));
  const [end, setEnd] = useState(toLocalInput(now));
  const [results, setResults] = useState<DetectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(hours: number) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
    setStart(toLocalInput(startDate));
    setEnd(toLocalInput(endDate));
    setResults(null);
  }

  async function handleQuery() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDetections({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        limit: 200,
      });
      setResults(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const trains = results?.data.filter(d => d.is_suspected_train) ?? [];
  const confirmed = trains.filter(d => d.is_confirmed_train === true);

  function handleReview(updated: Detection) {
    setResults(prev =>
      prev ? { ...prev, data: prev.data.map(d => d.id === updated.id ? updated : d) } : prev
    );
  }

  return (
    <div className="query-panel card">
      <h2 className="section-title">Query Time Range</h2>

      <div className="query-presets">
        {PRESETS.map(p => (
          <button key={p.label} className="preset-btn" onClick={() => applyPreset(p.hours)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="query-inputs">
        <label className="input-group">
          <span>From</span>
          <input
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </label>
        <label className="input-group">
          <span>To</span>
          <input
            type="datetime-local"
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </label>
        <button className="query-btn" onClick={handleQuery} disabled={loading}>
          {loading ? 'Querying…' : 'Query'}
        </button>
      </div>

      {error && <div className="panel-error">{error}</div>}

      {results && (
        <div className="query-results">
          <div className="query-summary">
            {trains.length === 0 ? (
              <p className="no-data">No trains detected in this period.</p>
            ) : (
              <p className="trains-found">
                <strong>{confirmed.length}</strong> train{confirmed.length !== 1 ? 's' : ''} confirmed
                <span className="trains-found__total"> ({results.total} total events)</span>
              </p>
            )}
          </div>

          {trains.length > 0 && (
            <div className="detection-list">
              {trains.map(d => (
                <div key={d.id} className="detection-row">
                  <div className="detection-row__main">
                    <span className="detection-time">{formatDateTime(d.timestamp)}</span>
                    <span className="chip">{Number(d.decibels).toFixed(1)} dB</span>
                    <span className="chip">{Number(d.duration_seconds).toFixed(1)}s</span>
                    {d.source && <span className="chip">{d.source}</span>}
                    <span className={`status-badge ${statusClass(d)}`}>{statusLabel(d)}</span>
                    {d.audio_url && <AudioButton detectionId={d.id} />}
                  </div>
                  <ReviewButtons detection={d} onUpdate={handleReview} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
