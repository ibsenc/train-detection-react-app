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

  async function submit(label: string) {
    if (detection.label === label) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await patchDetection(detection.id, label);
      onUpdate(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const lbl = detection.label;

  return (
    <div className="review-buttons">
      <button
        className={`review-btn review-btn--horn${lbl === 'train_horn' ? ' active' : ''}`}
        onClick={() => submit('train_horn')}
        disabled={loading}
        title="Confirm as train horn"
      >
        📣 Train Horn
      </button>
      <button
        className={`review-btn review-btn--confirm${lbl === 'train' ? ' active' : ''}`}
        onClick={() => submit('train')}
        disabled={loading}
        title="Confirm as idle train"
      >
        ✓ Idle Train
      </button>
      <button
        className={`review-btn review-btn--deny${lbl === 'non_train' ? ' active' : ''}`}
        onClick={() => submit('non_train')}
        disabled={loading}
        title="Mark as not a train"
      >
        ✗ Not a Train
      </button>
      <button
        className={`review-btn review-btn--unknown${lbl === 'unknown' ? ' active' : ''}`}
        onClick={() => submit('unknown')}
        disabled={loading}
        title="Reset to unknown"
      >
        ? Unknown
      </button>
      {error && <span className="review-error">{error}</span>}
    </div>
  );
}
