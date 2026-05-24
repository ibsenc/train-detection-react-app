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

  function handlePreset(preset: Preset) {
    setCustomError(null);
    if (preset === 'custom') {
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

  const showCustom = pendingCustom || value.preset === 'custom';
  const activePreset = pendingCustom ? 'custom' : value.preset;

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
