import React from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ message, onConfirm, onCancel}) {
    return (
        <div className="modal-overlay">
            <div className="confirm-modal">
                <p>{message}</p>
                <div className="buttons">
                    <button onClick={() => onConfirm(true)}>Yes</button>
                    <button onClick={() => onConfirm(false)}>No</button>
                </div>
            </div>
        </div>
    );
}