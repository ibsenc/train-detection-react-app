import { useState } from 'react';

export type Preset = '24h' | '3d' | '7d' | '14d' | '30d' | 'all' | 'custom';

export interface TimeRange {
  preset: Preset;
  start: string | undefined;
  end: string | undefined;
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function makePresetRange(preset: Exclude<Preset, 'custom'>): TimeRange {
  const now = new Date();
  if (preset === 'all') return { preset, start: undefined, end: undefined };
  const hoursMap: Record<Exclude<Preset, 'all' | 'custom'>, number> = {
    '24h': 24, '3d': 72, '7d': 168, '14d': 336, '30d': 720,
  };
  return {
    preset,
    start: new Date(now.getTime() - hoursMap[preset] * 60 * 60 * 1000).toISOString(),
    end: now.toISOString(),
  };
}

function shiftRange(range: TimeRange, direction: 'prev' | 'next'): TimeRange {
  if (range.preset === 'all' || !range.start || !range.end) return range;
  const s = new Date(range.start).getTime();
  const e = new Date(range.end).getTime();
  const delta = (direction === 'prev' ? -1 : 1) * (e - s);
  return {
    preset: 'custom',
    start: new Date(s + delta).toISOString(),
    end: new Date(e + delta).toISOString(),
  };
}

function formatPeriodLabel(start: string | undefined, end: string | undefined, preset: Preset): string {
  if (preset === 'all' || !start) return 'All Time';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const durationMs = e.getTime() - s.getTime();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  const dateOnly = (d: Date) =>
    new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  const withTime = (d: Date) =>
    new Intl.DateTimeFormat(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(d);

  if (durationMs < threeDays) {
    return `${withTime(s)} – ${withTime(e)}`;
  }
  const sYear = s.getFullYear();
  const eYear = e.getFullYear();
  return sYear === eYear
    ? `${dateOnly(s)} – ${dateOnly(e)}, ${eYear}`
    : `${dateOnly(s)}, ${sYear} – ${dateOnly(e)}, ${eYear}`;
}

const PRESETS: { label: string; preset: Preset }[] = [
  { label: '24h', preset: '24h' },
  { label: '3 Days', preset: '3d' },
  { label: '7 Days', preset: '7d' },
  { label: '14 Days', preset: '14d' },
  { label: '30 Days', preset: '30d' },
  { label: 'All Time', preset: 'all' },
  { label: 'Custom', preset: 'custom' },
];

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export default function GlobalTimeRange({ value, onChange }: Props) {
  const now = new Date();
  const [customStart, setCustomStart] = useState(
    toLocalInput(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
  );
  const [customEnd, setCustomEnd] = useState(toLocalInput(now));
  const [customError, setCustomError] = useState<string | null>(null);
  const [pendingCustom, setPendingCustom] = useState(value.preset === 'custom');
  const [displayPreset, setDisplayPreset] = useState<Preset>(value.preset);

  function handlePreset(preset: Preset) {
    setCustomError(null);
    setDisplayPreset(preset);
    if (preset === 'custom') {
      // Pre-fill inputs with the current range if available
      if (value.start) setCustomStart(toLocalInput(new Date(value.start)));
      if (value.end) setCustomEnd(toLocalInput(new Date(value.end)));
      setPendingCustom(true);
      // Don't call onChange yet — wait for Apply
    } else {
      setPendingCustom(false);
      onChange(makePresetRange(preset));
    }
  }

  function handleApply() {
    if (!customStart || !customEnd) {
      setCustomError('Both start and end times are required.');
      return;
    }
    const startMs = new Date(customStart).getTime();
    const endMs = new Date(customEnd).getTime();
    if (isNaN(startMs) || isNaN(endMs)) {
      setCustomError('Invalid date value.');
      return;
    }
    if (startMs >= endMs) {
      setCustomError('Start time must be earlier than end time.');
      return;
    }
    setCustomError(null);
    setPendingCustom(false);
    onChange({
      preset: 'custom',
      start: new Date(customStart).toISOString(),
      end: new Date(customEnd).toISOString(),
    });
  }

  const showCustom = pendingCustom;
  const activePreset = pendingCustom ? 'custom' : displayPreset;

  function handleShift(direction: 'prev' | 'next') {
    setPendingCustom(false);
    setCustomError(null);
    onChange(shiftRange(value, direction));
    // displayPreset intentionally not updated — keep the original preset highlighted
  }

  const canNav = value.preset !== 'all';
  const atPresent = !value.end || new Date(value.end).getTime() >= Date.now() - 60_000;

  return (
    <div className="global-time-range">
      <div className="global-time-range__presets">
        {PRESETS.map(p => (
          <button
            key={p.preset}
            className={`range-btn${activePreset === p.preset ? ' active' : ''}`}
            onClick={() => handlePreset(p.preset)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="global-time-range__nav">
        <button
          className="nav-btn"
          onClick={() => handleShift('prev')}
          disabled={!canNav}
          title="Previous period"
        >
          ← Prev
        </button>
        <span className="nav-period-label">
          {formatPeriodLabel(value.start, value.end, value.preset)}
        </span>
        <button
          className="nav-btn"
          onClick={() => handleShift('next')}
          disabled={!canNav || atPresent}
          title="Next period"
        >
          Next →
        </button>
      </div>

      {showCustom && (
        <div className="global-time-range__custom">
          <label className="input-group">
            <span>From</span>
            <input
              type="datetime-local"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
            />
          </label>
          <label className="input-group">
            <span>To</span>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
            />
          </label>
          <button className="query-btn" onClick={handleApply}>Apply</button>
          {customError && <p className="custom-time-error">{customError}</p>}
        </div>
      )}
    </div>
  );
}
