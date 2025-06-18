import React, { useState } from 'react';
import { FiX, FiMail, FiUser } from 'react-icons/fi';
import './AddFriendModal.scss';
import { Toast, ToastType } from './Toast';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (email: string) => Promise<void>;
  isLoading: boolean;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  onAddFriend,
  isLoading
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: ToastType;
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Email không hợp lệ');
      return;
    }

    setError('');
    await onAddFriend(email.trim());
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="add-friend-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h3>New Contact</h3>
            <button className="close-button" onClick={handleClose}>
              <FiX />
            </button>
          </div>

          {/* Content */}
          <div className="modal-content">
            <div className="icon-container">
              <FiUser className="user-icon" />
            </div>

            <form onSubmit={handleSubmit} className="email-form">
              <div className="input-group">
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Nhập email..."
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                    className={error ? 'error' : ''}
                  />
                </div>
                {error && <span className="error-message">{error}</span>}
              </div>

              <div className="button-group">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="add-button"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi lời mời'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={4000}
      />
    </>
  );
}; 