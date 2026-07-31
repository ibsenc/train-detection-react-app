interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ message, onConfirm, onCancel, loading }: ConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <p className="modal-message">{message}</p>
        <p className="modal-warning">This cannot be undone.</p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="modal-btn modal-btn--confirm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
