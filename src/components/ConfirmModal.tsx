import React from 'react';

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
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          <button onClick={onConfirm} className="confirm-btn">Discard & Continue</button>
        </div>
      </div>
    </div>
  );
};
