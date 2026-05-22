import { useEffect, useState } from 'react';
import { fetchStats } from '../api';
import type { Stats } from '../types';

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className={`stat-card${highlight ? ' stat-card--highlight' : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then(data => { if (!cancelled) setStats(data); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="panel-placeholder">Loading stats…</div>;
  if (error) return <div className="panel-error">Could not load stats: {error}</div>;
  if (!stats) return null;

  return (
    <section className="stats-panel">
      <StatCard label="Total Events" value={stats.total_events} />
      <StatCard label="Confirmed Trains" value={stats.confirmed_trains} highlight />
      <StatCard label="Non-Train Events" value={stats.confirmed_false_positives} />
      <StatCard label="Not Reviewed or Unknown" value={stats.unreviewed_suspected} />
      <StatCard label="Last 24 h" value={stats.suspected_last_24h} />
      <StatCard label="Last 7 Days" value={stats.suspected_last_7d} />
      <StatCard label="Avg dB" value={`${parseFloat(stats.avg_decibels).toFixed(1)} dB`} />
      <StatCard label="Max dB" value={`${parseFloat(stats.max_decibels).toFixed(1)} dB`} />
    </section>
  );
}
