import React from 'react';
import { FiPhone, FiVideo, FiX, FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import './call.scss';

const Call = ({ 
  isOpen, 
  callType = 'voice', 
  callStatus = 'calling', 
  callTarget, 
  onAccept, 
  onReject, 
  onEnd, 
  onClose 
}) => {
  if (!isOpen) return null;

  const getStatusText = () => {
    switch (callStatus) {
      case 'calling':
        return 'Đang gọi...';
      case 'incoming':
        return 'Cuộc gọi đến';
      case 'connected':
        return 'Đang kết nối';
      case 'ended':
        return 'Cuộc gọi kết thúc';
      default:
        return 'Đang xử lý...';
    }
  };

  const getCallIcon = () => {
    return callType === 'voice' ? <FiPhone size={24} /> : <FiVideo size={24} />;
  };

  return (
    <div className="call-overlay">
      <div className="call-modal">
        <div className="call-header">
          <h3>
            {getCallIcon()} 
            Cuộc gọi {callType === 'voice' ? 'thoại' : 'video'}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className="call-content">
          <div className="call-avatar">
            <img 
              src={callTarget?.avatar || '/user/friend.png'} 
              alt="avatar" 
            />
          </div>
          
          <div className="call-info">
            <h4>{callTarget?.name || 'Đang gọi...'}</h4>
            <p className="call-status">{getStatusText()}</p>
          </div>
          
          <div className="call-controls">
            {callStatus === 'incoming' && (
              <>
                <button 
                  className="control-btn accept-btn" 
                  onClick={onAccept}
                  title="Chấp nhận"
                >
                  <FiPhone size={20} />
                </button>
                <button 
                  className="control-btn reject-btn" 
                  onClick={onReject}
                  title="Từ chối"
                >
                  <FiX size={20} />
                </button>
              </>
            )}
            
            {callStatus === 'calling' && (
              <button 
                className="control-btn end-btn" 
                onClick={onEnd}
                title="Kết thúc"
              >
                <FiX size={20} />
              </button>
            )}
            
            {callStatus === 'connected' && (
              <>
                <button className="control-btn mic-btn" title="Tắt/bật mic">
                  <FiMic size={20} />
                </button>
                <button className="control-btn volume-btn" title="Tắt/bật loa">
                  <FiVolume2 size={20} />
                </button>
                <button 
                  className="control-btn end-btn" 
                  onClick={onEnd}
                  title="Kết thúc"
                >
                  <FiX size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Call; 