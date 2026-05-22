import { useState } from 'react';
import { patchDetection } from '../api';
import type { Detection } from '../types';

interface ReviewButtonsProps {
  detection: Detection;
  onUpdate: (updated: Detection) => void;
}

export default function ReviewButtons({ detection, onUpdate }: ReviewButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(value: boolean | null) {
    if (detection.is_confirmed_train === value) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await patchDetection(detection.id, value);
      onUpdate(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const val = detection.is_confirmed_train;

  return (
    <div className="review-buttons">
      <button
        className={`review-btn review-btn--confirm${val === true ? ' active' : ''}`}
        onClick={() => submit(true)}
        disabled={loading}
        title="Confirm as train"
      >
        ✓ Train
      </button>
      <button
        className={`review-btn review-btn--deny${val === false ? ' active' : ''}`}
        onClick={() => submit(false)}
        disabled={loading}
        title="Mark as not a train"
      >
        ✗ Not a Train
      </button>
      <button
        className={`review-btn review-btn--unknown${val === null ? ' active' : ''}`}
        onClick={() => submit(null)}
        disabled={loading}
        title="Reset to unknown"
      >
        ? Unknown
      </button>
      {error && <span className="review-error">{error}</span>}
    </div>
  );
}
