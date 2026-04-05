import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-modal">
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="cancel-btn">
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button onClick={onConfirm} className="confirm-btn">
            <Trash2 size={16} />
            <span>Discard & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
