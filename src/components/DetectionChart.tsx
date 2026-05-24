import { useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fetchDetections } from '../api';
import AudioButton from './AudioButton';
import ReviewButtons from './ReviewButtons';
import type { Detection } from '../types';

interface ChartPoint {
  time: number;
  decibels: number;
  duration: number;
  id: number;
  source: string;
}

function formatXTick(ms: number, days: number): string {
  if (days <= 1) {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(ms));
  }
  if (days <= 7) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric' }).format(new Date(ms));
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(ms));
}

function generateTicks(startMs: number, endMs: number, days: number): number[] {
  const ticks: number[] = [];

  if (days <= 1) {
    // Every hour, anchored to local hour boundaries
    const d = new Date(startMs);
    d.setMinutes(0, 0, 0);
    let t = d.getTime();
    if (t < startMs) t += 60 * 60 * 1000;
    while (t <= endMs) { ticks.push(t); t += 60 * 60 * 1000; }
  } else if (days <= 7) {
    // Every 12 hours, anchored to local midnight → gives 12AM and 12PM ticks
    const d = new Date(startMs);
    d.setHours(0, 0, 0, 0);
    let t = d.getTime();
    const interval = 12 * 60 * 60 * 1000;
    while (t <= endMs) { if (t >= startMs) ticks.push(t); t += interval; }
  } else if (days <= 14) {
    // Every 24 hours, anchored to local midnight → one tick per day
    const d = new Date(startMs);
    d.setHours(0, 0, 0, 0);
    let t = d.getTime();
    const interval = 24 * 60 * 60 * 1000;
    while (t <= endMs) { if (t >= startMs) ticks.push(t); t += interval; }
  } else {
    // Every 2 days, anchored to local midnight
    const d = new Date(startMs);
    d.setHours(0, 0, 0, 0);
    let t = d.getTime();
    const interval = 48 * 60 * 60 * 1000;
    while (t <= endMs) { if (t >= startMs) ticks.push(t); t += interval; }
  }

  return ticks;
}

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
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
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

interface TooltipPayloadEntry {
  payload: ChartPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p>{new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(p.time))}</p>
      <p>{p.decibels.toFixed(1)} dB &middot; {p.duration.toFixed(1)}s</p>
      {p.source !== 'unknown' && <p className="tooltip-muted">{p.source}</p>}
      <p className="tooltip-muted" style={{ marginTop: 4 }}>Click to expand</p>
    </div>
  );
}

interface DetectionChartProps {
  start: string | undefined;
  end: string | undefined;
}

export default function DetectionChart({ start, end }: DetectionChartProps) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Detection | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelected(null);
    fetchDetections({ start, end, limit: 500 })
      .then(r => { if (!cancelled) setDetections(r.data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [start, end]);

  function handleDotClick(data: unknown) {
    const point = data as ChartPoint;
    const detection = detections.find(d => d.id === point.id) ?? null;
    setSelected(prev => prev?.id === detection?.id ? null : detection);
  }

  function handleReview(updated: Detection) {
    setDetections(prev => prev.map(d => d.id === updated.id ? updated : d));
    setSelected(updated);
  }

  const normal: ChartPoint[] = [];
  const suspected: ChartPoint[] = [];
  const confirmed: ChartPoint[] = [];
  const falsePositive: ChartPoint[] = [];

  for (const d of detections) {
    const db = Number(d.decibels);
    if (db < 60) continue;
    const point: ChartPoint = {
      time: new Date(d.timestamp).getTime(),
      decibels: Number(d.decibels),
      duration: Number(d.duration_seconds),
      id: d.id,
      source: d.source ?? 'unknown',
    };
    if (d.is_confirmed_train === true) confirmed.push(point);
    else if (d.is_confirmed_train === false) falsePositive.push(point);
    else if (d.is_suspected_train) suspected.push(point);
    else normal.push(point);
  }

  const endMs = end ? new Date(end).getTime() : Date.now();
  const startMs = start ? new Date(start).getTime() : undefined;
  const dataMinMs = detections.length > 0
    ? detections.reduce((min, d) => Math.min(min, new Date(d.timestamp).getTime()), Infinity)
    : undefined;
  const effectiveStartMs = startMs ?? dataMinMs;
  const rangeDays = effectiveStartMs !== undefined ? (endMs - effectiveStartMs) / (24 * 60 * 60 * 1000) : 365;
  const ticks = effectiveStartMs !== undefined ? generateTicks(effectiveStartMs, endMs, rangeDays) : undefined;
  const tickFormatter = (ms: number) => formatXTick(ms, rangeDays);

  return (
    <div className="chart-panel card">
      <div className="chart-panel__header">
        <h2 className="section-title">Event History</h2>
      </div>

      {loading && <div className="panel-placeholder">Loading chart…</div>}
      {error && <div className="panel-error">{error}</div>}

      {!loading && !error && (
        <>
          {detections.length === 0 ? (
            <p className="no-data">No events in this time range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[startMs ?? 'dataMin', endMs]}
                  ticks={ticks}
                  tickFormatter={tickFormatter}
                  scale="time"
                  name="Time"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  dataKey="decibels"
                  name="Decibels"
                  unit=" dB"
                  domain={[60, 'auto']}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                <ReferenceLine
                  y={65}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: '65 dB threshold', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
                />
                {normal.length > 0 && (
                  <Scatter name="Event" data={normal} fill="#475569" opacity={0.7} onClick={handleDotClick} />
                )}
                {suspected.length > 0 && (
                  <Scatter name="Unknown" data={suspected} fill="#f59e0b" opacity={0.9} onClick={handleDotClick} />
                )}
                {confirmed.length > 0 && (
                  <Scatter name="Confirmed Train" data={confirmed} fill="#4ade80" onClick={handleDotClick} />
                )}
                {falsePositive.length > 0 && (
                  <Scatter name="Not a Train" data={falsePositive} fill="#f87171" opacity={0.7} onClick={handleDotClick} />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {selected && (
            <div className="chart-detail">
              <div className="chart-detail__header">
                <span className="section-title" style={{ margin: 0 }}>Selected Event</span>
                <button className="chart-detail__close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
              </div>
              <div className="latest-train__time">
                <span className="latest-train__ago">{timeAgo(selected.timestamp)}</span>
                <span className="latest-train__date">{formatDateTime(selected.timestamp)}</span>
              </div>
              <div className="latest-train__meta">
                <span className="chip">{Number(selected.decibels).toFixed(1)} dB</span>
                <span className="chip">{Number(selected.duration_seconds).toFixed(1)}s</span>
                {selected.source && <span className="chip">{selected.source}</span>}
                <span className={`status-badge ${statusClass(selected)}`}>{statusLabel(selected)}</span>
                {selected.audio_url && <AudioButton detectionId={selected.id} />}
              </div>
              <ReviewButtons detection={selected} onUpdate={handleReview} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
