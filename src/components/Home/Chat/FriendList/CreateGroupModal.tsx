import React from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiUser } from 'react-icons/fi';
import './CreateGroupModal.scss';

interface Friend {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName: string;
  onGroupNameChange: (name: string) => void;
  isCreating: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  onGroupNameChange,
  isCreating
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Tạo nhóm mới</h3>
          <button onClick={onClose} className="close-btn">
            <FiX />
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Tên nhóm:</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
              placeholder="Nhập tên nhóm..."
              maxLength={50}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button 
            onClick={onClose}
            className="cancel-btn"
            disabled={isCreating}
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm}
            className="confirm-btn"
            disabled={isCreating || !groupName.trim()}
          >
            {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}; 