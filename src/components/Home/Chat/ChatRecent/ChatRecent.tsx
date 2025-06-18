import React, {
  useEffect,
  useRef,
  useState,
  MouseEvent,
} from "react";
import {
  FiSearch,
  FiMenu,
  FiLogOut,
  FiUsers,
  FiUserPlus,
  FiSettings,
  FiPlus,
  FiMessageSquare,
  FiUser,
  FiArrowLeft,
  FiBell,
  FiLock,
  FiShield,
  FiHelpCircle,
  FiInfo,
  FiEdit2,
  FiMoreVertical,
  FiCamera,
  FiCheck,
  FiMoon,
  FiBookOpen,
  FiPhone,
} from "react-icons/fi";
import "./ChatRecent.scss";
import { token, decodeToken } from "../../../store/tokenContext";
import user from "../../../store/accountContext";
import socketService from "../../../../socket/Socket";
import { createPortal } from "react-dom";
import { useConversation } from "../../../../hook/ConversationContext";
import { useAuth } from "../../../../hook/AuthContext";
import { jwtDecode } from "jwt-decode";
import { FriendList } from '../FriendList/FriendList';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  avatar_url: string;
}

export interface Participant {
  id: number;
  conversation_id: number;
  user_id: number;
  type: string;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface Message {
  id: number;
  guid: string;
  conversation_id: number;
  sender_id: number;
  message_type: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  call_type: string;
  callStatus: string;
  status: string;
}

export interface Conversation {
  id: number;
  title: string;
  creator_id: number;
  channel_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  avatar_url: string;
  participants: Participant[];
  messages: Message[];
}

export interface ChatItem {
  id: string;
  image: string;
  name: string;
  msgTime?: string;
  content?: string;
}

export interface LastChat {
  msgTime: string;
  content: string;
  from: string;
}

export interface LastChatsResponse {
  data: [string[], LastChat[]];
}

export interface ChatRecentResponse {
  data: [ChatItem[], ChatItem[]];
}

export interface TypingEvent {
  otherId: string;
}

export interface ListOnlineEvent {
  listOnline: string[];
}

const DropdownMenu = ({
  isOpen,
  onClose,
  buttonRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) => {
  if (!isOpen) return null;

  const buttonRect = buttonRef.current?.getBoundingClientRect();
  const menuStyle = {
    position: "fixed" as const,
    top: buttonRect ? buttonRect.bottom + 5 : 0,
    right: buttonRect ? window.innerWidth - buttonRect.right : 0,
    zIndex: 9999,
  };

  return createPortal(
    <div
      className="dropdown-menu"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <ul>
        <li
          onClick={() => {
            console.log("Tạo nhóm mới clicked");
            onClose();
          }}
        >
          Tạo nhóm mới
        </li>
        <li
          onClick={() => {
            console.log("Thêm bạn mới clicked");
            onClose();
          }}
        >
          Thêm bạn mới
        </li>
        <li
          onClick={() => {
            console.log("Cài đặt clicked");
            onClose();
          }}
        >
          Cài đặt
        </li>
      </ul>
    </div>,
    document.body
  );
};

const NewMessageMenu = ({
  isOpen,
  onClose,
  onCreateGroup,
  onNewMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: () => void;
  onNewMessage: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="new-message-menu">
      <div className="menu-header">
        <h3>Tạo mới</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="menu-items">
        <button className="menu-item" onClick={onNewMessage}>
          <FiMessageSquare className="menu-icon" />
          <span>Tin nhắn mới</span>
        </button>
        <button className="menu-item" onClick={onCreateGroup}>
          <FiUsers className="menu-icon" />
          <span>Nhóm mới</span>
        </button>
      </div>
    </div>
  );
};

export interface ChatRecentProps {
  onSelectChat: (chatId: string) => void;
  onFriendSelect?: (friend: any, conversationId: string) => void;
  onGroupMembersSelect?: (friends: any[], groupName: string, conversationId: string) => void;
  onLogout?: () => void;
  onCreateGroup?: () => void;
  onAddFriend?: () => void;
  onSettings?: () => void;
  onAddAccount?: () => void;
  onContacts?: () => void;
  onMyStories?: () => void;
  onNightMode?: () => void;
  userInfo?: {
    name: string;
    avatar: string;
  };
}

const ChatRecent: React.FC<ChatRecentProps> = (props) => {
  const socket: any = socketService;
  const context = useConversation();
  const { logout } = useAuth();

  const [chatRecent, setChatRecent] = useState<ChatItem[]>([]);
  const [lastChatsId, setLastChatsId] = useState<string[]>([]);
  const [lastChatsObj, setLastChatsObj] = useState<LastChat[]>([]);
  const [userTyping, setUserTyping] = useState<string[]>([]);
  const [listOnline, setListOnline] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const itemRef = useRef<HTMLDivElement>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [isNewMessageMenuOpen, setIsNewMessageMenuOpen] = useState(false);
  const newMessageButtonRef = useRef<HTMLButtonElement>(null);
  const newMessageMenuRef = useRef<HTMLDivElement>(null);
  const chatRecentRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newName, setNewName] = useState(props.userInfo?.name || "");
  const [newAvatar, setNewAvatar] = useState(props.userInfo?.avatar || "");
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    avatar: string;
  }>({
    name: "",
    avatar: "",
  });

  // New Message and New Group states
  const [showNewMessageView, setShowNewMessageView] = useState(false);
  const [showNewGroupView, setShowNewGroupView] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Lấy user ID từ JWT token để đảm bảo tính nhất quán
  const getCurrentUserId = () => {
    try {
      if (token) {
        const decoded = jwtDecode(token) as any;
        return decoded?.sub || decoded?.id || user.id;
      }
      return user.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return user.id;
    }
  };

  // Fetch user info from API
  useEffect(() => {
    fetch('http://localhost:8080/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log('User data from API:', data); // Debug log
        if (data.statusCode === 200) {
          setUserInfo({
            name: `${data.data.firstName || ''} ${data.data.lastName || ''}`.trim(),
            avatar: data.data.avatar || data.data.avatarUrl || 'https://i.pravatar.cc/150?img=1',
          });
        }
      })
      .catch(err => {
        console.error('Error fetching user info:', err);
        setError('Failed to load user information');
      });
  }, []);

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside as unknown as EventListener
    );
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside as unknown as EventListener
      );
  }, []);

  useEffect(() => {
    // Fetch recent chats from API
    fetch('http://localhost:8080/conversations', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log('Conversations data:', data); // Debug log
        if (data.statusCode === 200) {
          // Kiểm tra xem data.data có phải là mảng không
          const conversations = Array.isArray(data.data) ? data.data : data.data.result || [];
          const formattedData: ChatItem[] = conversations.map((item: any) => {
            const isGroup = item.participants && item.participants.length > 2;
            let displayName = '';

            if (isGroup) {
              // Nếu là group, luôn lấy tên nhóm
              displayName = item.title || 'Nhóm mới';
            } else {
              // Nếu là 1-1, lấy participant khác user hiện tại
              let friend = null;
              if (item.participants && item.participants.length > 1) {
                friend = item.participants.find((p: any) => p.user && p.user.id !== getCurrentUserId());
                if (!friend) {
                  // Fallback: lấy participant đầu tiên có user
                  friend = item.participants.find((p: any) => p.user);
                }
              }
              if (friend && friend.user) {
                displayName = `${friend.user.firstName || ''} ${friend.user.lastName || ''}`.trim();
              } else {
                displayName = item.title || 'Unknown User';
              }
            }

            return {
              id: item.id.toString(),
              name: displayName,
              image: item.avatarUrl || item.avatar || 'https://i.pravatar.cc/150?img=1',
              content: item.lastMessage?.content || '',
              msgTime: item.lastMessage?.createdAt || item.updatedAt || '',
            };
          });
          console.log('Formatted conversations:', formattedData); // Debug log
          setChatRecent(formattedData);
    setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
        setIsLoading(false);
      });
  }, [refreshTrigger]);

  const fetchLastMessage = async () => {
    try {
      const response = await fetch(`http://localhost:8080/chats/getlastchats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch last messages");
      }

      const data: LastChatsResponse = await response.json();
      const [x, y] = data.data;
      setLastChatsId(x);
      setLastChatsObj(y);
    } catch (err) {
      console.error("Error fetching last messages:", err);
      // Continue with existing data
    }
  };

  useEffect(() => {
    const old = [...chatRecent];
    old.forEach((item) => {
      const index = lastChatsId.indexOf(item.id);
      if (lastChatsObj[index]) {
        item.msgTime = lastChatsObj[index].msgTime;
        item.content =
          lastChatsObj[index].from +
          ": " +
          lastChatsObj[index].content +
          ` (${item.msgTime})`;
      } else item.msgTime = "0";
    });
    old.sort(
      (a, b) =>
        new Date(b.msgTime ?? "0").getTime() -
        new Date(a.msgTime ?? "0").getTime()
    );
    setChatRecent([...old]);
  }, [lastChatsObj]);

  useEffect(() => {
    socketService.listen("loadLastMessage", (_msg: any) => {
      fetchLastMessage();
    });
  }, []);

  useEffect(() => {
    socketService.listen("listOnline", (data: ListOnlineEvent) => {
      setListOnline(data.listOnline);
    });
  }, []);

  useEffect(() => {
    socketService.listen("typing", (data: TypingEvent) => {
      const index = userTyping.indexOf(data.otherId);
      if (index === -1) {
        const updatedTyping = [...userTyping, data.otherId];
        setUserTyping(updatedTyping);
      }
    });

    socketService.listen("stopTyping", (data: TypingEvent) => {
      const index = userTyping.indexOf(data.otherId);
      if (index !== -1) {
        const updatedTyping = userTyping.filter((id) => id !== data.otherId);
        setUserTyping(updatedTyping);
      }
    });
  }, [userTyping]);

  useEffect(() => {
    const handleMouseEnter = () => {
      setShowNewMessageButton(true);
    };

    const handleMouseLeave = () => {
      setShowNewMessageButton(false);
    };

    const element = chatRecentRef.current;
    if (element) {
      element.addEventListener("mouseenter", handleMouseEnter);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        newMessageMenuRef.current &&
        !newMessageMenuRef.current.contains(event.target as Node) &&
        newMessageButtonRef.current &&
        !newMessageButtonRef.current.contains(event.target as Node)
      ) {
        setIsNewMessageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!context) return null;

  const { isShowRecent, setIsShowRecent } = context;

  const handleChatClick = (chatId: string) => {
    props.onSelectChat(chatId);
  };

  const filteredChats = chatRecent.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNightModeToggle = () => {
    setIsNightMode(!isNightMode);
    // TODO: Implement night mode logic
  };

  const handleNewMessageClick = () => {
    setIsNewMessageMenuOpen(!isNewMessageMenuOpen);
  };

  const handleNewMessage = () => {
    setShowNewMessageView(true);
    setIsNewMessageMenuOpen(false);
  };

  const handleNewGroup = () => {
    setShowNewGroupView(true);
    setIsNewMessageMenuOpen(false);
  };

  const handleBackToChatRecent = () => {
    setShowNewMessageView(false);
    setShowNewGroupView(false);
    setSelectedFriend(null);
  };

  const handleFriendSelect = async (friend: any) => {
    setSelectedFriend(friend);
    
    try {
      // Trước tiên, kiểm tra xem có conversation 1-1 đã tồn tại không
      const checkResponse = await fetch('http://localhost:8080/conversations', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (checkResponse.ok) {
        const conversationsData = await checkResponse.json();
        if (conversationsData.statusCode === 200) {
          const conversations = Array.isArray(conversationsData.data) ? conversationsData.data : conversationsData.data.result || [];
          
          // Tìm conversation 1-1 với bạn bè này
          const existingConversation = conversations.find((conv: any) => {
            return conv.participants && conv.participants.length === 2 && 
                   conv.participants.some((p: any) => p.user && p.user.id === friend.id);
          });

          if (existingConversation) {
            // Nếu đã có conversation, sử dụng conversation đó
            const conversationId = existingConversation.id.toString();
            
            if (props.onFriendSelect) {
              props.onFriendSelect(friend, conversationId);
            }
            
            props.onSelectChat(conversationId);
            handleBackToChatRecent();
            return;
          }
        }
      }

      // Nếu không có conversation, tạo mới
      const response = await fetch('http://localhost:8080/conversations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `${friend.firstName} ${friend.lastName}`,
          participants: [
            {
              userId: friend.id,
              type: 'MEMBER'
            }
          ]
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.statusCode === 201) {
        const conversationId = data.data.id.toString();
        
        // Gọi prop onFriendSelect để truyền thông tin bạn bè và conversationId
        if (props.onFriendSelect) {
          props.onFriendSelect(friend, conversationId);
        }
        
        // Trigger refresh conversations list
        setRefreshTrigger(prev => prev + 1);
        
        // Chọn conversation mới tạo
        props.onSelectChat(conversationId);
        handleBackToChatRecent();
      } else {
        console.error('Error creating conversation:', data);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Thêm hàm xử lý khi chọn thành viên cho group
  const handleGroupMembersSelect = async (friends: any[], groupName: string) => {
    try {
      // Tạo group conversation với nhiều thành viên
      const response = await fetch('http://localhost:8080/conversations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: groupName,
          participants: friends.map(friend => ({
            userId: friend.id,
            type: 'MEMBER'
          }))
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.statusCode === 201) {
        const conversationId = data.data.id.toString();
        
        // Gọi prop onGroupMembersSelect để truyền thông tin thành viên và conversationId
        if (props.onGroupMembersSelect) {
          props.onGroupMembersSelect(friends, groupName, conversationId);
        }
        
        // Trigger refresh conversations list
        setRefreshTrigger(prev => prev + 1);
        
        // Chọn conversation mới tạo
        props.onSelectChat(conversationId);
        handleBackToChatRecent();
      } else {
        console.error('Error creating group conversation:', data);
      }
    } catch (error) {
      console.error('Error creating group conversation:', error);
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    setIsDropdownOpen(false);
  };

  const handleBackToChat = () => {
    setShowSettings(false);
  };

  const handleEditProfileClick = () => {
    setShowEditProfile(true);
    setShowSettings(false);
  };

  const handleBackToSettings = () => {
    setShowEditProfile(false);
    setShowSettings(true);
  };

  const handleSaveProfile = () => {
    // TODO: Implement save profile logic
    console.log("Save profile:", { newName, newAvatar });
    setShowEditProfile(false);
    setShowSettings(true);
  };

  const handleGeneralSettingsClick = () => {
    console.log("General Settings clicked!");
    setShowGeneralSettings(true);
    setShowSettings(false);
  };

  const handleLogout = () => {
    logout();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // Nếu là hôm nay
    if (diffInDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    // Nếu là hôm qua
    if (diffInDays === 1) {
      return 'Hôm qua';
    }
    // Nếu trong tuần này
    if (diffInDays < 7) {
      return date.toLocaleDateString('vi-VN', { weekday: 'long' });
    }
    // Nếu trong năm nay
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    // Nếu khác năm
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // New Message View
  if (showNewMessageView) {
    return (
      <div className="chat-recent new-message-view">
        <FriendList 
          onBack={handleBackToChatRecent}
          onFriendSelect={handleFriendSelect}
          isNewMessageMode={true}
        />
      </div>
    );
  }

  // New Group View
  if (showNewGroupView) {
    return (
      <div className="chat-recent new-group-view">
        <FriendList 
          onBack={handleBackToChatRecent}
          onGroupMembersSelect={handleGroupMembersSelect}
          isNewGroupMode={true}
          minGroupMembers={3}
        />
      </div>
    );
  }

  if (showEditProfile) {
    return (
      <div className="chat-recent edit-profile-view">
        <div className="settings-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBackToSettings}>
              <FiArrowLeft />
            </button>
            <h3>Edit Profile</h3>
          </div>
        </div>
        <div className="edit-profile-content">
          <div className="avatar-section">
            <div className="avatar-container">
              <img src={newAvatar} alt={newName} />
              <div className="avatar-overlay">
                <FiCamera />
                <span>Change Photo</span>
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          </div>
        </div>
        <button className="new-message-button" onClick={handleSaveProfile}>
          <FiCheck />
        </button>
      </div>
    );
  }

  if (showGeneralSettings) {
    return (
      <div className="chat-recent general-settings-view">
        <div className="settings-header">
          <div className="header-left">
            <button className="back-button" onClick={() => {
              setShowGeneralSettings(false);
              setShowSettings(true);
            }}>
              <FiArrowLeft />
            </button>
            <h3>General Settings</h3>
          </div>
        </div>
        <div className="settings-content">
          <div className="settings-section">
            <h4>Font Size</h4>
            <div className="settings-item">
              <label>
                <input type="radio" name="fontSize" value="small" /> Small
              </label>
            </div>
            <div className="settings-item">
              <label>
                <input type="radio" name="fontSize" value="medium" defaultChecked /> Medium
              </label>
            </div>
            <div className="settings-item">
              <label>
                <input type="radio" name="fontSize" value="large" /> Large
              </label>
            </div>
          </div>
          <div className="settings-section">
            <h4>Time Format</h4>
            <div className="settings-item">
              <label>
                <input type="radio" name="timeFormat" value="12-hour" defaultChecked /> 12-hour
              </label>
            </div>
            <div className="settings-item">
              <label>
                <input type="radio" name="timeFormat" value="24-hour" /> 24-hour
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="chat-recent settings-view">
        <div className="settings-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBackToChat}>
              <FiArrowLeft />
            </button>
            <h3>Settings</h3>
          </div>
          <div className="header-right">
            <div className="edit-profile-wrapper">
              <button
                className="edit-profile-button"
                onClick={handleEditProfileClick}
                title="Edit Profile"
              >
                <FiEdit2 />
              </button>
            </div>
            <div className="more-options" ref={dropdownRef}>
              <button
                ref={buttonRef}
                className="more-button"
                onClick={handleDropdownToggle}
                type="button"
              >
              <FiMoreVertical />
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <ul>
                    <li onClick={handleLogout}>
                      <FiLogOut className="menu-icon" />
                      <span>Logout</span>
                    </li>
                  </ul>
                </div>
              )}

            </div>
          </div>
        </div>
        <div className="settings-content">
          <div className="settings-section account-section">
            <div className="user-avatar-large">
              <img src={userInfo.avatar} alt={userInfo.name} />
              <div className="user-status">
                <h3>{userInfo.name}</h3>
                <span>online</span>
              </div>
            </div>
            <div className="phone-section">
              <FiPhone className="icon" />
              <div className="phone-info">
                <span>+84 123 456 789</span>
                <span className="phone-label">Phone</span>
              </div>
            </div>
          </div>
          <div className="settings-section">
            <div className="settings-item" onClick={handleGeneralSettingsClick}>
              <FiSettings className="icon" />
              <span>General Settings</span>
            </div>
            <div className="settings-item">
              <FiBell className="icon" />
              <span>Notifications</span>
            </div>
            <div className="settings-item">
              <FiLock className="icon" />
              <span>Privacy</span>
            </div>
            <div className="settings-item">
              <FiShield className="icon" />
              <span>Security</span>
            </div>
          </div>
          <div className="settings-section help-about-section">
            <div className="settings-item">
              <FiHelpCircle className="icon" />
              <span>Help</span>
            </div>
            <div className="settings-item">
              <FiInfo className="icon" />
              <span>About</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="chat-recent">
        <div className="chat-recent__top-bar">
          <div className="more-options" ref={dropdownRef}>
            <button
              ref={buttonRef}
              className="more-button"
              onClick={handleDropdownToggle}
              type="button"
            >
              <FiMenu />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {userInfo && (
                  <div className="user-profile" onClick={handleSettingsClick}>
                    <div className="user-avatar">
                      <img src={userInfo.avatar} alt={userInfo.name} />
                    </div>
                    <div className="user-info">
                      <h4>{userInfo.name}</h4>
                    </div>
                  </div>
                )}
                <ul>
                  <li onClick={() => props.onCreateGroup && props.onCreateGroup()}>
                    <FiUsers className="menu-icon" />
                    <span>Tạo nhóm chat</span>
                  </li>
                  <li onClick={() => props.onAddFriend && props.onAddFriend()}>
                    <FiUserPlus className="menu-icon" />
                    <span>Thêm bạn</span>
                  </li>
                  <li onClick={handleSettingsClick}>
                    <FiSettings className="menu-icon" />
                    <span>Cài đặt</span>
                  </li>
                  <li
                    className="logout-item"
                    onClick={() => props.onLogout && props.onLogout()}
                  >
                    <FiLogOut className="menu-icon" />
                    <span>Đăng xuất</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled
            />
          </div>
        </div>
        <div className="chat-recent__loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-recent">
        <div className="chat-recent__top-bar">
          <div className="more-options" ref={dropdownRef}>
            <button
              ref={buttonRef}
              className="more-button"
              onClick={handleDropdownToggle}
              type="button"
            >
              <FiMenu />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {userInfo && (
                  <div className="user-profile" onClick={handleSettingsClick}>
                    <div className="user-avatar">
                      <img src={userInfo.avatar} alt={userInfo.name} />
                    </div>
                    <div className="user-info">
                      <h4>{userInfo.name}</h4>
                    </div>
                  </div>
                )}
                <ul>
                  <li onClick={() => props.onCreateGroup && props.onCreateGroup()}>
                    <FiUsers className="menu-icon" />
                    <span>Tạo nhóm chat</span>
                  </li>
                  <li onClick={() => props.onAddFriend && props.onAddFriend()}>
                    <FiUserPlus className="menu-icon" />
                    <span>Thêm bạn</span>
                  </li>
                  <li onClick={handleSettingsClick}>
                    <FiSettings className="menu-icon" />
                    <span>Cài đặt</span>
                  </li>
                  <li
                    className="logout-item"
                    onClick={() => props.onLogout && props.onLogout()}
                  >
                    <FiLogOut className="menu-icon" />
                    <span>Đăng xuất</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="chat-recent__error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={chatRecentRef} className="chat-recent">
      <div className="chat-recent__top-bar">
        <div className="more-options" ref={dropdownRef}>
          <button
            ref={buttonRef}
            className="more-button"
            onClick={handleDropdownToggle}
            type="button"
          >
            <FiMenu />
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              {userInfo && (
                <div className="user-profile" onClick={handleSettingsClick}>
                  <div className="user-avatar">
                    <img src={userInfo.avatar} alt={userInfo.name} />
                  </div>
                  <div className="user-info">
                    <h4>{userInfo.name}</h4>
                  </div>
                </div>
              )}
              <ul>
                <li onClick={() => props.onAddAccount?.()}>
                  <FiUserPlus className="menu-icon" />
                  <span>Add Account</span>
                </li>
                <li onClick={() => props.onContacts?.()}>
                  <FiUsers className="menu-icon" />
                  <span>Contacts</span>
                </li>
                <li onClick={() => props.onMyStories?.()}>
                  <FiBookOpen className="menu-icon" />
                  <span>My Stories</span>
                </li>
                <li onClick={() => props.onNightMode?.()}>
                  <FiMoon className="menu-icon" />
                  <span>Night Mode</span>
                </li>
                <li onClick={handleSettingsClick}>
                  <FiSettings className="menu-icon" />
                  <span>Settings</span>
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      </div>
      <div className="chat-recent__list" ref={itemRef}>
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách chat...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="chat-recent__empty">
            <p>Không tìm thấy cuộc trò chuyện nào</p>
          </div>
        ) : (
          filteredChats.map((item) => (
            <div
              key={item.id}
              className="recent-item"
              data-id={item.id}
              onClick={() => handleChatClick(item.id)}
            >
              <div className="recent-item__avatar">
                <img src={item.image} alt={item.name} />
                {listOnline.includes(item.id) && (
                  <span className="online-indicator"></span>
                )}
              </div>
              <div className="recent-item__content">
                <div className="recent-item__header">
                  <h4>{item.name}</h4>
                  {item.msgTime && (
                    <span className="time-badge">
                      {formatTime(item.msgTime)}
                    </span>
                  )}
                </div>
                <div className="recent-item__message">
                  {userTyping.includes(item.id) ? (
                    <span className="typing-indicator">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </span>
                  ) : (
                    <p>{item.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        ref={newMessageButtonRef}
        className="new-message-button"
        onClick={handleNewMessageClick}
        type="button"
      >
        <FiPlus />
      </button>

      {isNewMessageMenuOpen && (
        <div className="new-message-menu">
          <div className="menu-items">
            <button
              className="menu-item"
              onClick={handleNewMessage}
            >
              <FiUser className="menu-icon" />
              <span>New Message</span>
            </button>
            <button
              className="menu-item"
              onClick={handleNewGroup}
            >
              <FiUsers className="menu-icon" />
              <span>New Group</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRecent;
