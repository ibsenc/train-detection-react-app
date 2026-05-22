import { useState } from 'react';
import { fetchAudioUrl } from '../api';

interface AudioButtonProps {
  detectionId: number;
}

export default function AudioButton({ detectionId }: AudioButtonProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (url) return; // already loaded
    setLoading(true);
    setError(null);
    try {
      const presigned = await fetchAudioUrl(detectionId);
      setUrl(presigned);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="audio-button-wrap">
      {!url && (
        <button
          className="audio-link"
          onClick={handleClick}
          disabled={loading}
          title="Load audio"
        >
          {loading ? '…' : '▶ Audio'}
        </button>
      )}
      {error && <span className="audio-error" title={error}>⚠ {error}</span>}
      {url && (
        <audio
          src={url}
          controls
          autoPlay
          className="audio-player"
        />
      )}
    </span>
  );
}
