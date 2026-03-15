'use client'

type DeleteConfirmModalProps = {
  docName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmModal({ docName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <h3 className="modal-title">Delete document?</h3>
        <p className="modal-text">
          Are you sure you want to delete <strong>&ldquo;{docName}&rdquo;</strong>? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-delete" onClick={onConfirm}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 500;
          animation: overlayIn 0.15s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-card {
          background: var(--surface);
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: calc(100% - 32px);
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: cardIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(212, 114, 114, 0.1);
          color: var(--error, #D47272);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .modal-text {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .modal-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          min-width: 100px;
        }
        .modal-btn-cancel {
          background: var(--background);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        .modal-btn-cancel:hover {
          background: var(--border);
        }
        .modal-btn-delete {
          background: var(--error, #D47272);
          color: white;
        }
        .modal-btn-delete:hover {
          background: #c25757;
        }
      `}</style>
    </div>
  )
}
