import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
import { token, decodeToken } from "../../../store/tokenContext";
import user from "../../../store/accountContext";
import { MessageDto, ConversationType, MessageType, CallType, CallStatus } from "../ChatBox/ChatBox";
import socketService from "../../../../socket/Socket";
import { FiPhone, FiVideo, FiPhoneOff, FiClock } from 'react-icons/fi';

const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg"];

interface InsertMessageProps {
  props: [MessageDto, number];
}

export function InsertMessage({ props }: InsertMessageProps) {
  const socket: any = socketService;
  const [msg, conversationId] = props;

  const [showOption, setShowOption] = useState<boolean>(false);
  const [showDate, setShowDate] = useState<boolean>(false);
  const content = (msg.content || "").split(" ");
  const contentRef = useRef<HTMLDivElement>(null);

  // Lấy user ID từ JWT token để đảm bảo tính nhất quán
  const getCurrentUserId = () => {
    try {
      if (token) {
        const decoded: any = jwtDecode(token);
        return decoded?.sub || decoded?.id || user.id;
      }
      return user.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return user.id;
    }
  };

  const currentUserId = getCurrentUserId();

  const onMouse = () => {
    setShowOption(!showOption);
  };

  const isDelete = () => {
    if (window.confirm("Are you sure you want to delete this message ?")) {
      fetch(`http://localhost:8080/chats/delete/${msg.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(() => {
        socketService.emit("delete_message", { otherId: conversationId });
        if (contentRef.current) {
          contentRef.current.innerHTML = "<b>Message has been delete</b>";
        }
        setShowOption(false);
      });
    }
  };

  // Hàm render tin nhắn cuộc gọi
  const renderCallMessage = () => {
    const isCallMessage = msg.messageType === MessageType.call;
    if (!isCallMessage) return null;

    const getCallIcon = () => {
      if (msg.callType === CallType.video) {
        return <FiVideo size={16} />;
      }
      return <FiPhone size={16} />;
    };

    const getCallStatusText = () => {
      switch (msg.callStatus) {
        case CallStatus.INVITED:
          return 'Cuộc gọi đến';
        case CallStatus.MISSED:
          return 'Cuộc gọi nhỡ';
        case CallStatus.ONGOING:
          return 'Cuộc gọi đang diễn ra';
        case CallStatus.ENDED:
          return 'Cuộc gọi đã kết thúc';
        default:
          return 'Cuộc gọi';
      }
    };

    const getCallStatusColor = () => {
      switch (msg.callStatus) {
        case CallStatus.MISSED:
          return '#f44336';
        case CallStatus.ENDED:
          return '#4caf50';
        case CallStatus.ONGOING:
          return '#2196f3';
        default:
          return '#666';
      }
    };

    return (
      <div className="call-message" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '20px',
        backgroundColor: msg.user?.id === currentUserId ? '#e3f2fd' : '#f5f5f5',
        border: `1px solid ${getCallStatusColor()}`,
        color: getCallStatusColor(),
        fontSize: '14px',
        fontWeight: 500
      }}>
        {getCallIcon()}
        <span>{getCallStatusText()}</span>
        {msg.callStatus === CallStatus.MISSED && <FiClock size={14} />}
      </div>
    );
  };

  return (
    <div
      className={
        msg.user?.id === currentUserId ? "message-right" : "message-left"
      }
    >
      <div className="transparent"></div>
      <div className="message-wrap">
        {showOption && msg.user?.id === currentUserId && (
          <div className="option-chat">
            <button onClick={isDelete}>D.Hard</button>
            <button onClick={() => setShowDate(!showDate)}>More</button>
          </div>
        )}
        <div className="wrap-option">
          {(msg.conversationType === ConversationType.GROUP || (msg.user?.id !== currentUserId)) && (
            <div className="user-coming" style={{ fontWeight: 600, color: '#1976d2', marginBottom: 2 }}>
              {msg.user?.firstName + " " + msg.user?.lastName}
            </div>
          )}
          <div
            className="user-content"
            onClick={onMouse}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.user?.id === currentUserId ? 'flex-end' : 'flex-start',
              gap: 2,
              minWidth: 0
            }}
          >
            {/* Hiển thị tin nhắn cuộc gọi hoặc tin nhắn thường */}
            {msg.messageType === MessageType.call ? (
              renderCallMessage()
            ) : (
              <i className="message-content" ref={contentRef} style={{ wordBreak: 'break-word', maxWidth: 320 }}>
                {content.map((item, index) => {
                  const isImage =
                    imageExtensions.some((ext) => item.endsWith("." + ext)) ||
                    item.startsWith("data:image") ||
                    item.startsWith("https://");
                  return isImage ? (
                    <a
                      href={item}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={index}
                    >
                      <img src={item} alt="content" />
                    </a>
                  ) : (
                    item + " "
                  );
                })}
              </i>
            )}
            <span
              className="message-time"
              style={{
                fontSize: '12px',
                color: '#bdbdbd',
                background: 'transparent',
                minWidth: 40,
                textAlign: 'right',
                opacity: 0.9,
                paddingRight: msg.user?.id === currentUserId ? 2 : 0,
                paddingLeft: msg.user?.id !== currentUserId ? 2 : 0,
                fontWeight: 500,
                letterSpacing: 0.2,
                marginTop: 2,
                zIndex: 2
              }}
            >
              {msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : ''}
            </span>
          </div>
          {showDate && (
            <div>
              <i
                style={{
                  color: "white",
                  background: "green",
                  fontSize: "12px",
                  borderRadius: "20px",
                  padding: "1px 3px",
                }}
              >
                {msg.createdAt?.toString()}
              </i>
            </div>
          )}
        </div>
        {showOption && msg.user?.id !== currentUserId && (
          <div className="option-chat">
            <button>Delete</button>
            <button onClick={() => setShowDate(!showDate)}>More</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InsertMessage;
