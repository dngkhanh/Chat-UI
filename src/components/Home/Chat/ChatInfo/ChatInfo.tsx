import React, { useState, useEffect } from 'react';
import { FiX, FiPhone, FiMail, FiBell } from 'react-icons/fi';
import './ChatInfo.scss';

interface ChatInfoProps {
  isOpen: boolean;
  onClose: () => void;
  chatInfo?: {
    id: number;
    name: string;
    avatar: string;
    type: string;
    participants?: any[];
    phoneNumber?: string;
    email?: string;
    notificationsEnabled?: boolean;
  };
}

const ChatInfo: React.FC<ChatInfoProps> = ({ isOpen, onClose, chatInfo }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(chatInfo?.notificationsEnabled ?? true);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Nếu không có chatInfo, hiển thị placeholder
  if (!chatInfo) {
    return (
      <div className="chat-info">
        <div className="chat-info__header">
          <button onClick={onClose} className="chat-info__close-button">
            <FiX />
          </button>
          <h3>Thông tin chat</h3>
        </div>
        
        <div className="chat-info__content">
          <div className="chat-info__placeholder">
            <div className="chat-info__avatar">
              <img src="https://i.pravatar.cc/150?img=1" alt="placeholder" />
            </div>
            <h4>Chưa chọn cuộc trò chuyện</h4>
            <p>Vui lòng chọn một cuộc trò chuyện để xem thông tin</p>
          </div>
        </div>
      </div>
    );
  }

  const handleNotificationToggle = () => {
    setNotificationsEnabled(prev => !prev);
    console.log("Notifications toggled to:", !notificationsEnabled);
  };

  const copyToClipboard = (text: string, type: 'phone' | 'email') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessage(`${type === 'phone' ? 'Số điện thoại' : 'Email'} đã sao chép!`);
      setTimeout(() => setCopiedMessage(null), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="chat-info">
      <div className="chat-info__header">
        <button onClick={onClose} className="chat-info__close-button">
          <FiX />
        </button>
        <h3>Channel Info</h3>
      </div>
      
      <div className="chat-info__content">
        <div className="chat-info__avatar">
          <img src={chatInfo?.avatar} alt={chatInfo?.name} />
        </div>
        
        {copiedMessage && <div className="copied-message">{copiedMessage}</div>}

        {chatInfo?.phoneNumber && (
          <div className="chat-info__item" onClick={() => copyToClipboard(chatInfo.phoneNumber!, 'phone')}>
            <div className="chat-info__icon"><FiPhone /></div>
            <div className="chat-info__text">
              <div className="chat-info__primary-text">{chatInfo.phoneNumber}</div>
              <div className="chat-info__secondary-text">Phone</div>
            </div>
          </div>
        )}
        {chatInfo?.email && (
          <div className="chat-info__item" onClick={() => copyToClipboard(chatInfo.email!, 'email')}>
            <div className="chat-info__icon"><FiMail /></div>
            <div className="chat-info__text">
              <div className="chat-info__primary-text">{chatInfo.email}</div>
              <div className="chat-info__secondary-text">Username</div>
            </div>
          </div>
        )}
        <div className="chat-info__item chat-info__item--toggle">
          <div className="chat-info__icon"><FiBell /></div>
          <div className="chat-info__text">
            <div className="chat-info__primary-text">Notifications</div>
          </div>
          <label className="chat-info__switch">
            <input type="checkbox" checked={notificationsEnabled} onChange={handleNotificationToggle} />
            <span className="chat-info__slider round"></span>
          </label>
        </div>

        {chatInfo?.type === 'GROUP' && chatInfo.participants && (
          <div className="chat-info__participants">
            <h4>Thành viên ({chatInfo.participants.length})</h4>
            <div className="participants-list">
              {chatInfo.participants.map((participant, index) => (
                <div key={index} className="participant-item">
                  <img src={participant.user.avatarUrl} alt={participant.user.firstName} />
                  <span>{participant.user.firstName} {participant.user.lastName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInfo; 