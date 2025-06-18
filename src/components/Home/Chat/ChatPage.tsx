import React, { useEffect, useState, useRef } from "react";
import ChatRecent from "./ChatRecent/ChatRecent";
import "./ChatPage.scss";
import { ChatBox } from "./ChatBox/ChatBox";
import ChatInfo from "./ChatInfo/ChatInfo";
import { FiMoreVertical, FiSearch, FiPhone, FiVideo, FiMessageCircle } from 'react-icons/fi';
import { MessageType, CallType, ConversationType, ConversationVm } from "./ChatBox/ChatBox";
import VideoCall from "../Call/Call";
import { useNavigate } from 'react-router-dom';
import { FriendList } from './FriendList/FriendList';
import { ConversationProvider, useConversation } from "../../../hook/ConversationContext";
import { CallProvider } from "../../../hook/CallContext";
import { getConversationById } from "../../../api/Chat.api";
import socketService from "../../../socket/Socket";
import user from "../../../components/store/accountContext";
import Call from './Call/Call';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';

// Component con để xử lý logic với context
function ChatContent() {
  const [selectedChat, setSelectedChat] = useState<{
    id: number;
    name: string;
    avatar: string;
    type: string;
  } | null>(null);
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isVoiceCall, setIsVoiceCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'connected' | 'ended'>('idle');
  const [callTarget, setCallTarget] = useState<any>(null);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [showFriendList, setShowFriendList] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const { setConversationId, setIsShowRecent } = useConversation();
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

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
            avatar: "/user/friend.png", // Avatar mặc định cho group
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
              avatar: otherParticipant.user.avatarUrl || otherParticipant.user.avatar || "/user/friend.png",
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
    console.log('handleVoiceCall called!');
    console.log('selectedChat:', selectedChat);
    console.log('socketService status:', socketService?.status());
    
    if (!selectedChat) return;
    
    // Bắt đầu cuộc gọi thoại
    setCallTarget(selectedChat);
    setCallStatus('calling');
    setIsVoiceCall(true);
    
    // Gửi tín hiệu gọi qua socket
    if (socketService) {
      console.log('Emitting callUser:', {
        conversationId: selectedChat.id,
        callType: 'VOICE',
        user: {
          id: user.id,
          first_name: userInfo.name.split(' ')[0] || userInfo.name,
          last_name: userInfo.name.split(' ').slice(1).join(' ') || '',
          email: user.email
        },
        callerInfomation: {
          id: user.id,
          first_name: userInfo.name.split(' ')[0] || userInfo.name,
          last_name: userInfo.name.split(' ').slice(1).join(' ') || '',
          email: user.email
        }
      });
      
      socketService.emit('callUser', {
        conversationId: selectedChat.id,
        callType: 'VOICE',
        user: {
          id: user.id,
          first_name: userInfo.name.split(' ')[0] || userInfo.name,
          last_name: userInfo.name.split(' ').slice(1).join(' ') || '',
          email: user.email
        },
        callerInfomation: {
          id: user.id,
          first_name: userInfo.name.split(' ')[0] || userInfo.name,
          last_name: userInfo.name.split(' ').slice(1).join(' ') || '',
          email: user.email
        }
      });
      
      // Lưu tin nhắn cuộc gọi vào database
      socketService.emit('sendMessage', {
        conversationId: selectedChat.id,
        messageType: 'CALL',
        callType: 'VOICE',
        callStatus: 'INVITED',
        content: 'Cuộc gọi thoại',
        timestamp: new Date()
      });
      
      // Thêm emit tới conversation để đảm bảo user khác nhận được
      socketService.emit('joinConversation', { conversationId: selectedChat.id });
    }
    
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

  // Thêm hàm xử lý khi chọn bạn bè để tạo conversation mới
  const handleFriendSelect = async (friend: any, conversationId: string) => {
    setSelectedFriend(friend);
    
    // Cập nhật selectedChat với thông tin bạn bè được chọn
    setSelectedChat({
      id: parseInt(conversationId),
      name: `${friend.firstName} ${friend.lastName}`,
      avatar: friend.avatarUrl || friend.avatar || "/user/friend.png",
      type: "FRIEND"
    });
    
    // Fetch thông tin conversation mới tạo
    try {
      const conversationData = await getConversationById(parseInt(conversationId));
      if (conversationData && conversationData.data) {
        setConversationInfo(conversationData.data);
      }
    } catch (error) {
      console.error('Error fetching new conversation info:', error);
    }
  };

  // Thêm hàm xử lý khi chọn thành viên cho group
  const handleGroupMembersSelect = async (friends: any[], conversationId: string) => {
    // Cập nhật selectedChat với thông tin group
    setSelectedChat({
      id: parseInt(conversationId),
      name: `Nhóm ${friends.length + 1} người`,
      avatar: "/user/friend.png", // Avatar mặc định cho group
      type: "GROUP"
    });
    
    // Fetch thông tin conversation mới tạo
    try {
      const conversationData = await getConversationById(parseInt(conversationId));
      if (conversationData && conversationData.data) {
        setConversationInfo(conversationData.data);
      }
    } catch (error) {
      console.error('Error fetching new group conversation info:', error);
    }
  };

  const handleMyStories = () => {
    console.log('My Stories clicked');
    setIsHeaderDropdownOpen(false);
  };

  // Xử lý các sự kiện call từ socket
  useEffect(() => {
    if (!socketService) return;
    
    console.log('Setting up call event listeners...');
    
    // Lắng nghe cuộc gọi đến
    socketService.listen('openCall', (data: any) => {
      console.log('Received openCall:', data);
      setCallTarget(data.callerInfomation);
      setCallStatus('incoming');
      setIsVoiceCall(true);
    });
    
    // Lắng nghe cuộc gọi được chấp nhận
    socketService.listen('callAccepted', (data: any) => {
      console.log('Call accepted:', data);
      setCallStatus('connected');
    });
    
    // Lắng nghe cuộc gọi bị từ chối
    socketService.listen('refuseCall', (data: any) => {
      console.log('Call refused:', data);
      setCallStatus('ended');
      setTimeout(() => {
        setIsVoiceCall(false);
        setCallStatus('idle');
      }, 2000);
    });
    
    // Lắng nghe cuộc gọi kết thúc
    socketService.listen('closeCall', (data: any) => {
      console.log('Call closed:', data);
      setCallStatus('ended');
      setTimeout(() => {
        setIsVoiceCall(false);
        setCallStatus('idle');
      }, 2000);
    });
    
    // Lắng nghe cuộc gọi bị từ bỏ
    socketService.listen('giveUpCall', (data: any) => {
      console.log('Call given up:', data);
      setCallStatus('ended');
      setTimeout(() => {
        setIsVoiceCall(false);
        setCallStatus('idle');
      }, 2000);
    });
    
    // Lắng nghe lỗi cuộc gọi
    socketService.listen('callError', (data: any) => {
      console.log('Call error:', data);
      setCallStatus('ended');
      setTimeout(() => {
        setIsVoiceCall(false);
        setCallStatus('idle');
      }, 2000);
    });
    
    // Lắng nghe sự kiện join conversation để đảm bảo kết nối
    socketService.listen('userJoinedConversation', (data: any) => {
      console.log('User joined conversation:', data);
    });
    
    return () => {
      socketService.offListener('openCall');
      socketService.offListener('callAccepted');
      socketService.offListener('refuseCall');
      socketService.offListener('closeCall');
      socketService.offListener('giveUpCall');
      socketService.offListener('callError');
      socketService.offListener('userJoinedConversation');
    };
  }, [socketService]);
  
  // Hàm xử lý chấp nhận cuộc gọi
  const handleAcceptCall = () => {
    if (socketService && callTarget) {
      socketService.emit('answerCall', {
        conversationId: selectedChat?.id,
        callType: 'VOICE'
      });
      
      // Cập nhật trạng thái cuộc gọi thành ONGOING
      socketService.emit('sendMessage', {
        conversationId: selectedChat?.id,
        messageType: 'CALL',
        callType: 'VOICE',
        callStatus: 'ONGOING',
        content: 'Cuộc gọi đã được chấp nhận',
        timestamp: new Date()
      });
      
      setCallStatus('connected');
    }
  };
  
  // Hàm xử lý từ chối cuộc gọi
  const handleRejectCall = () => {
    if (socketService && callTarget) {
      socketService.emit('refuseCall', {
        conversationId: selectedChat?.id,
        callType: 'VOICE'
      });
      
      // Cập nhật trạng thái cuộc gọi thành MISSED
      socketService.emit('sendMessage', {
        conversationId: selectedChat?.id,
        messageType: 'CALL',
        callType: 'VOICE',
        callStatus: 'MISSED',
        content: 'Cuộc gọi bị từ chối',
        timestamp: new Date()
      });
      
      setCallStatus('ended');
      setTimeout(() => {
        setIsVoiceCall(false);
        setCallStatus('idle');
      }, 2000);
    }
  };
  
  // Hàm xử lý kết thúc cuộc gọi
  const handleEndCall = () => {
    if (socketService && callTarget) {
      socketService.emit('closeCall', {
        conversationId: selectedChat?.id,
        callType: 'VOICE'
      });
      
      // Cập nhật trạng thái cuộc gọi thành ENDED
      socketService.emit('sendMessage', {
        conversationId: selectedChat?.id,
        messageType: 'CALL',
        callType: 'VOICE',
        callStatus: 'ENDED',
        content: 'Cuộc gọi đã kết thúc',
        timestamp: new Date()
      });
      
      setCallStatus('ended');
      setTimeout(() => {
        setIsVoiceCall(false);
        setCallStatus('idle');
      }, 2000);
    }
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
            onFriendSelect={handleFriendSelect}
            onGroupMembersSelect={handleGroupMembersSelect}
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
        {selectedChat && (
          <div className="header">
            <div 
              className="chat-info"
              onClick={handleOpenChatInfo}
              style={{ cursor: selectedChat ? 'pointer' : 'default' }}
            >
              <div className="avatar">
                <img src={selectedChat?.avatar || "/user/friend.png"} alt="avatar" />
              </div>
              <div className="info">
                <div className="name">{selectedChat?.name || "Chọn một cuộc trò chuyện"}</div>
                <div className="status">{selectedChat ? "Online" : ""}</div>
              </div>
            </div>
            <div className="actions">
              <button onClick={handleSearch} disabled={!selectedChat}>
                <FiSearch />
              </button>
              <button onClick={handleVoiceCall} disabled={!selectedChat}>
                <FiPhone />
              </button>
              <button onClick={handleVideoCall} disabled={!selectedChat}>
                <FiVideo />
              </button>
              <div className="more-options-header" ref={headerDropdownRef}>
                <button onClick={handleToggleHeaderDropdown} disabled={!selectedChat}>
                  <FiMoreVertical />
                </button>
                {isHeaderDropdownOpen && selectedChat && (
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
        )}
        <div className="messages-container">
          {selectedChat ? (
            <ChatBox />
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <div className="no-chat-icon">
                  <FiMessageCircle size={64} />
                </div>
                <h3>Chào mừng bạn đến với Chat</h3>
                <p>Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <ChatInfo 
        isOpen={isChatInfoOpen}
        onClose={() => setIsChatInfoOpen(false)}
        chatInfo={selectedChat || undefined}
      />
      {isVideoCall && (
        <VideoCall onClose={() => setIsVideoCall(false)} />
      )}
      {isVoiceCall && (
        <Call 
          isOpen={isVoiceCall}
          callType="voice"
          callStatus={callStatus}
          callTarget={callTarget}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEnd={handleEndCall}
          onClose={() => {
            setIsVoiceCall(false);
            setCallStatus('idle');
          }}
        />
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
