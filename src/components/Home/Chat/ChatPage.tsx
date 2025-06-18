import React, { useEffect, useState, useRef } from "react";
import ChatRecent from "./ChatRecent/ChatRecent";
import "./ChatPage.scss";
import { ChatBox } from "./ChatBox/ChatBox";
import ChatInfo from "./ChatInfo/ChatInfo";
import { FiMoreVertical, FiSearch, FiPhone, FiVideo } from 'react-icons/fi';
import { MessageType, CallType, ConversationType, ConversationVm } from "./ChatBox/ChatBox";
import VideoCall from "../Call/Call";
import { useNavigate } from 'react-router-dom';
import { FriendList } from './FriendList/FriendList';
import { ConversationProvider, useConversation } from "../../../hook/ConversationContext";
import { CallProvider } from "../../../hook/CallContext";
import { getConversationById } from "../../../api/Chat.api";

// Component con để xử lý logic với context
function ChatContent() {
  const [selectedChat, setSelectedChat] = useState<any>({
    id: 1,
    name: "John Doe",
    avatar: "https://i.pravatar.cc/150?img=1",
    type: "FRIEND"
  });
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showFriendList, setShowFriendList] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<ConversationVm | null>(null);
  const { setConversationId, setIsShowRecent } = useConversation();

  const [userInfo, setUserInfo] = useState({
    name: "Nguyễn Văn A",
    avatar: "https://i.pravatar.cc/150?img=1"
  });

  const userWidth: number = window.innerWidth;

  // Hàm xử lý khi chọn chat
  const handleSelectChat = async (chatId: string) => {
    console.log('Selected chat:', chatId);
    
    // Chuyển đổi chatId thành number
    const conversationId = parseInt(chatId);
    
    if (isNaN(conversationId)) {
      console.error('Invalid conversation ID:', chatId);
      return;
    }

    // Cập nhật conversationId trong context
    setConversationId(conversationId);
    setIsShowRecent(false); // Ẩn danh sách chat trên mobile

    try {
      // Lấy thông tin conversation sử dụng API
      const conversationData = await getConversationById(conversationId);
      
      if (conversationData && conversationData.data) {
        setConversationInfo(conversationData.data);
        
        // Cập nhật thông tin chat được chọn
        if (conversationData.data.type === ConversationType.GROUP) {
          setSelectedChat({
            id: conversationId,
            name: conversationData.data.title,
            avatar: "https://i.pravatar.cc/150?img=1", // Avatar mặc định cho group
            type: "GROUP"
          });
        } else {
          // Tìm thông tin người dùng khác trong cuộc trò chuyện
          const otherParticipant = conversationData.data.participants?.find(
            (p: any) => p.userId !== parseInt(localStorage.getItem('userId') || '0')
          );
          
          if (otherParticipant) {
            setSelectedChat({
              id: conversationId,
              name: `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`,
              avatar: otherParticipant.user.avatarUrl || "https://i.pravatar.cc/150?img=1",
              type: "FRIEND"
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversation info:', error);
      // Hiển thị thông báo lỗi nếu cần
    }
  };

  const handleVideoCall = () => {
    setIsVideoCall(true);
    setIsHeaderDropdownOpen(false);
  };

  const handleVoiceCall = () => {
    console.log('Voice call clicked');
    setIsHeaderDropdownOpen(false);
  };

  const handleSearch = () => {
    console.log('Search clicked');
    setIsHeaderDropdownOpen(false);
  };

  const handleOpenChatInfo = () => {
    setIsChatInfoOpen(!isChatInfoOpen);
    setIsHeaderDropdownOpen(false);
  };

  const handleToggleHeaderDropdown = () => {
    setIsHeaderDropdownOpen(!isHeaderDropdownOpen);
  };

  const handleAddAccount = () => {
    navigate('/login');
  };

  const handleContacts = () => {
    setShowFriendList(true);
  };

  const handleBack = () => {
    setShowFriendList(false);
  };

  const handleMyStories = () => {
    console.log('My Stories clicked');
    setIsHeaderDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target as Node)) {
        setIsHeaderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside as any);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as any);
    };
  }, []);

  return (
    <div className="chat">
      <div
        className="chat_recent"
        style={{
            display: userWidth <= 500 ? (true ? 'flex' : 'none') : 'flex',
          width: userWidth <= 500 ? '100%' : '333px'
        }}
      >
        {showFriendList ? (
          <FriendList onBack={handleBack} />
        ) : (
          <ChatRecent 
            userInfo={userInfo}
            onSelectChat={handleSelectChat}
            onLogout={() => {
              console.log('Logout clicked');
              // Add your logout logic here
            }}
            onCreateGroup={() => {
              console.log('Create group clicked');
              // Add your create group logic here
            }}
            onAddFriend={() => {
              console.log('Add friend clicked');
              // Add your add friend logic here
            }}
            onSettings={() => {
              console.log('Settings clicked');
              // Add your settings logic here
            }}
            onAddAccount={handleAddAccount}
            onContacts={handleContacts}
            onMyStories={handleMyStories}
          />
        )}
          {userWidth <= 500 && true && (
          <div
            className="show_recent"
              onClick={() => {}}
          >
            X
          </div>
        )}
      </div>
      <div
        className="chat_message"
        style={{
            display: userWidth <= 500 ? (true ? 'none' : 'flex') : 'flex',
          width: userWidth <= 500
                    ? (true ? 'none' : '100%')
                  : (isChatInfoOpen ? 'calc(100% - 600px)' : 'calc(100% - 300px)')
        }}
      >
        <div className="header">
          <div 
            className="chat-info"
            onClick={handleOpenChatInfo}
            style={{ cursor: 'pointer' }}
          >
            <div className="avatar">
              <img src={selectedChat?.avatar} alt="avatar" />
            </div>
            <div className="info">
              <div className="name">{selectedChat?.name}</div>
              <div className="status">Online</div>
            </div>
          </div>
          <div className="actions">
            <button onClick={handleSearch}>
              <FiSearch />
            </button>
            <button onClick={handleVoiceCall}>
              <FiPhone />
            </button>
            <button onClick={handleVideoCall}>
              <FiVideo />
            </button>
            <div className="more-options-header" ref={headerDropdownRef}>
              <button onClick={handleToggleHeaderDropdown}>
                <FiMoreVertical />
              </button>
              {isHeaderDropdownOpen && (
                <div className="dropdown-menu-header">
                  <ul>
                    <li onClick={handleOpenChatInfo}>Xem thông tin chat</li>
                    <li>Tùy chọn khác 1</li>
                    <li>Tùy chọn khác 2</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="messages-container">
          <ChatBox />
        </div>
      </div>
      <ChatInfo 
        isOpen={isChatInfoOpen}
        onClose={() => setIsChatInfoOpen(false)}
        chatInfo={selectedChat}
      />
      {isVideoCall && (
        <VideoCall onClose={() => setIsVideoCall(false)} />
      )}
    </div>
  );
}

export function Chat() {
  return (
    <ConversationProvider>
      <CallProvider>
        <ChatContent />
      </CallProvider>
    </ConversationProvider>
  );
}
