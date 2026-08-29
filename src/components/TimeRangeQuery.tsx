import { useEffect, useState } from 'react';
import { deleteDetection, fetchDetections } from '../api';
import AudioButton from './AudioButton';
import ConfirmModal from './ConfirmModal';
import ReviewButtons from './ReviewButtons';
import type { Detection, DetectionsResponse } from '../types';

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(iso));
}

function statusLabel(d: Detection): string {
  if (d.label === 'train') return 'Idle Train';
  if (d.label === 'train_horn') return 'Train Horn';
  if (d.label === 'non_train') return 'Not a Train';
  return 'Unknown';
}

function statusClass(d: Detection): string {
  if (d.label === 'train') return 'status-confirmed';
  if (d.label === 'train_horn') return 'status-horn';
  if (d.label === 'non_train') return 'status-false';
  return 'status-suspected';
}

interface Props {
  start: string | undefined;
  end: string | undefined;
}

export default function TimeRangeQuery({ start, end }: Props) {
  const [results, setResults] = useState<DetectionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDetections({ start, end, limit: 200 })
      .then(data => { if (!cancelled) setResults(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [start, end]);

  const trains = results?.data.filter(d => d.is_suspected_train) ?? [];
  const confirmed = trains.filter(d => d.label === 'train' || d.label === 'train_horn');

  function handleReview(updated: Detection) {
    setResults(prev =>
      prev ? { ...prev, data: prev.data.map(d => d.id === updated.id ? updated : d) } : prev
    );
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    setDeletingId(pendingDeleteId);
    try {
      await deleteDetection(pendingDeleteId);
      setResults(prev =>
        prev ? { ...prev, data: prev.data.filter(d => d.id !== pendingDeleteId), total: prev.total - 1 } : prev
      );
      setPendingDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="query-panel card">
      <h2 className="section-title">Events</h2>

      {loading && <div className="panel-placeholder">Loading…</div>}
      {error && <div className="panel-error">{error}</div>}

      {!loading && !error && results && (
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
                  <div className="detection-row__actions">
                    <ReviewButtons detection={d} onUpdate={handleReview} />
                    <button
                      className="review-btn review-btn--delete"
                      onClick={() => setPendingDeleteId(d.id)}
                      disabled={deletingId === d.id}
                      title="Delete this event"
                    >
                      {deletingId === d.id ? 'Deleting…' : '🗑 Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="Are you sure you want to delete this event?"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
          loading={deletingId !== null}
        />
      )}
    </div>
  );
}
