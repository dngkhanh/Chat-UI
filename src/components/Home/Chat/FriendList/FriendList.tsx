import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiArrowLeft, FiSearch, FiUser, FiPlus, FiUserPlus, FiMail, FiX, FiUsers } from 'react-icons/fi';
import './FriendList.scss';
import './CreateGroupModal.scss';
import { token } from '../../../store/tokenContext';
import { AddFriendModal } from './AddFriendModal';
import { CreateGroupModal } from './CreateGroupModal';
import { Toast, ToastType } from './Toast';

// Polyfill for atob if not available in browser
const atob = (str: string) => {
  try {
    return window.atob(str);
  } catch {
    return Buffer.from(str, 'base64').toString('binary');
  }
};

interface Friend {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface FriendRequest {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  created_at: string;
  requester: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface FriendListProps {
  onBack: () => void;
  onFriendSelect?: (friend: Friend) => void;
  onGroupMembersSelect?: (friends: Friend[], groupName: string) => void;
  isNewMessageMode?: boolean;
  isNewGroupMode?: boolean;
  minGroupMembers?: number;
}

export const FriendList: React.FC<FriendListProps> = ({ 
  onBack, 
  onFriendSelect, 
  onGroupMembersSelect, 
  isNewMessageMode = false, 
  isNewGroupMode = false, 
  minGroupMembers = 2 
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFriendMenu, setShowAddFriendMenu] = useState(false);
  const [showRequestsMenu, setShowRequestsMenu] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState<number | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: ToastType;
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // State cho New Group mode
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Fetch friends
  const fetchFriends = async () => {
    try {
      const response = await fetch(`http://localhost:8080/friends/accepted`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw `HTTP error! status: ${response.status}`;
      }

      const data = await response.json();
      console.log('Friends data:', data);
      
      // Lấy current user ID từ token
      const currentUserId = JSON.parse(atob(token.split('.')[1])).id;
      
      // Xử lý dữ liệu để lấy thông tin bạn bè thực sự
      const processedFriends = data.data?.result?.map((friend: any) => {
        // Nếu current user là requester, thì receiver là bạn bè
        if (friend.requesterId === currentUserId) {
          return {
            id: friend.receiver.id,
            firstName: friend.receiver.firstName,
            lastName: friend.receiver.lastName,
            email: friend.receiver.email,
            isActive: friend.receiver.isActive,
          };
        }
        // Nếu current user là receiver, thì requester là bạn bè
        else {
          return {
            id: friend.requester.id,
            firstName: friend.requester.firstName,
            lastName: friend.requester.lastName,
            email: friend.requester.email,
            isActive: friend.requester.isActive,
          };
        }
      }) || [];
      
      setFriends(processedFriends);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Không thể tải danh sách bạn bè');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    try {
      const response = await fetch(`http://localhost:8080/friends/requested`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw `HTTP error! status: ${response.status}`;
      }

      const data = await response.json();
      console.log('Friend requests data:', data);
      setFriendRequests(data.data?.result || []);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    }
  };

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

  // Add friend by email
  const handleAddFriendByEmail = async (email: string) => {
    setIsAddingFriend(true);
    try {
      const response = await fetch(`http://localhost:8080/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.statusCode === 201) {
        showToast('Đã gửi lời mời kết bạn thành công!', 'success');
        // Refresh friend requests to show the new pending request
        await fetchFriendRequests();
        setShowAddFriendModal(false);
      } else {
        const errorMessage = data.message || 'Không thể gửi lời mời kết bạn';
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      console.error('Error adding friend:', err);
      showToast('Có lỗi xảy ra khi gửi lời mời kết bạn', 'error');
    } finally {
      setIsAddingFriend(false);
    }
  };

  // Handle friend request (accept/reject)
  const handleFriendRequest = async (requestId: number, accept: boolean) => {
    setIsProcessingRequest(requestId);
    try {
      const endpoint = accept ? 'accept' : 'reject';
      const response = await fetch(`http://localhost:8080/friends/${requestId}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const action = accept ? 'chấp nhận' : 'từ chối';
        showToast(`Đã ${action} lời mời kết bạn thành công!`, 'success');
        
        // Refresh both friend requests and friends list
        await fetchFriendRequests();
        await fetchFriends();
      } else {
        const errorMessage = data.message || 'Không thể xử lý lời mời kết bạn';
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      console.error('Error handling friend request:', err);
      showToast('Có lỗi xảy ra khi xử lý lời mời kết bạn', 'error');
    } finally {
      setIsProcessingRequest(null);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const filteredFriends = friends.filter(friend =>
    `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequests = friendRequests.filter(request => request.status === 'PENDING');

  const handleAddFriend = () => {
    setShowAddFriendMenu(!showAddFriendMenu);
    setShowRequestsMenu(false);
  };

  const handleShowRequests = () => {
    setShowRequestsMenu(!showRequestsMenu);
    setShowAddFriendMenu(false);
  };

  const handleOpenAddFriendModal = () => {
    setShowAddFriendModal(true);
    setShowAddFriendMenu(false);
  };

  // Hàm xử lý cho New Group mode
  const handleFriendToggle = (friend: Friend) => {
    if (isNewGroupMode) {
      setSelectedFriends(prev => {
        const isSelected = prev.find(f => f.id === friend.id);
        if (isSelected) {
          return prev.filter(f => f.id !== friend.id);
        } else {
          return [...prev, friend];
        }
      });
    }
  };

  const handleCreateGroup = () => {
    if (selectedFriends.length >= minGroupMembers) {
      setShowCreateGroupModal(true);
    }
  };

  const handleConfirmCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast('Vui lòng nhập tên nhóm', 'error');
      return;
    }

    setIsCreatingGroup(true);
    try {
      if (onGroupMembersSelect) {
        onGroupMembersSelect(selectedFriends, groupName);
      }
      setShowCreateGroupModal(false);
      setGroupName('');
      setSelectedFriends([]);
    } catch (error) {
      console.error('Error creating group:', error);
      showToast('Có lỗi xảy ra khi tạo nhóm', 'error');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCancelCreateGroup = () => {
    setShowCreateGroupModal(false);
    setGroupName('');
    setSelectedFriends([]);
  };

  if (isLoading) {
    return (
      <div className="friend-list">
        <div className="friend-list__header">
          <button onClick={onBack} className="back-button">
            <FiArrowLeft />
          </button>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="friend-list__loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách bạn bè...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-list">
      {/* Header with back button and search */}
      <div className="friend-list__header">
        <button onClick={onBack} className="back-button">
          <FiArrowLeft />
        </button>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Friends list */}
      <div className="friend-list__content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {filteredFriends.length === 0 ? (
          <div className="empty-state">
            <FiUser className="empty-icon" />
            <p>Chưa có bạn bè nào</p>
            <span>Bắt đầu kết bạn để trò chuyện</span>
          </div>
        ) : (
          <div className="friends-list">
            {filteredFriends.map(friend => {
              const isSelected = selectedFriends.find(f => f.id === friend.id);
              return (
                <div 
                  key={friend.id} 
                  className={`friend-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (isNewMessageMode && onFriendSelect) {
                      onFriendSelect(friend);
                    } else if (isNewGroupMode) {
                      handleFriendToggle(friend);
                    }
                  }}
                  style={{ cursor: (isNewMessageMode || isNewGroupMode) ? 'pointer' : 'default' }}
                >
                  {isNewGroupMode && (
                    <div className="friend-checkbox">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleFriendToggle(friend)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="friend-avatar">
                    <FiUser />
                  </div>
                  <div className="friend-info">
                    <h4>{friend.firstName} {friend.lastName}</h4>
                    <p>{friend.email}</p>
                  </div>
                  <div className="friend-status">
                    <div className={`status-dot ${friend.isActive ? 'online' : 'offline'}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Group Info */}
        {isNewGroupMode && (
          <div className="new-group-info">
            <div className="selection-info">
              <p>Đã chọn {selectedFriends.length} bạn bè</p>
              <p className="min-requirement">
                {selectedFriends.length >= minGroupMembers 
                  ? '✓ Đủ điều kiện tạo nhóm' 
                  : `Cần ít nhất ${minGroupMembers} bạn bè để tạo nhóm`
                }
              </p>
            </div>
            {selectedFriends.length > 0 && (
              <div className="selected-friends">
                <h5>Bạn bè đã chọn:</h5>
                <div className="selected-list">
                  {selectedFriends.map(friend => (
                    <div key={friend.id} className="selected-friend">
                      <span>{friend.firstName} {friend.lastName}</span>
                      <button 
                        onClick={() => handleFriendToggle(friend)}
                        className="remove-friend"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedFriends.length >= minGroupMembers && (
              <button 
                className="create-group-btn"
                onClick={handleCreateGroup}
              >
                <FiUsers />
                Tạo nhóm mới
              </button>
            )}
          </div>
        )}

        {/* Add Friend Menu */}
        {showAddFriendMenu && (
          <div className="add-friend-menu">
            <div className="menu-items">
              <button 
                className="menu-item" 
                onClick={handleOpenAddFriendModal}
                disabled={isAddingFriend}
              >
                <FiMail className="menu-icon" />
                <span>Thêm bằng email</span>
              </button>
              <button className="menu-item" onClick={handleShowRequests}>
                <FiUserPlus className="menu-icon" />
                <span>Lời mời kết bạn ({pendingRequests.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Friend Requests Menu */}
        {showRequestsMenu && (
          <div className="friend-requests-menu">
            <div className="menu-items">
              {pendingRequests.length === 0 ? (
                <div className="no-requests">
                  <p>Không có lời mời kết bạn nào</p>
                </div>
              ) : (
                pendingRequests.map(request => (
                  <div key={request.id} className="request-item">
                    <div className="user-info">
                      <div className="avatar">
                        <FiUser />
                      </div>
                      <div className="details">
                        <h5>{request.requester.firstName} {request.requester.lastName}</h5>
                        <p>{request.requester.email}</p>
                      </div>
                    </div>
                    <div className="actions">
                      <button 
                        onClick={() => handleFriendRequest(request.id, true)}
                        className="accept-btn"
                        title="Chấp nhận"
                        disabled={isProcessingRequest === request.id}
                      >
                        {isProcessingRequest === request.id ? (
                          <div className="loading-spinner-small"></div>
                        ) : (
                          <FiPlus />
                        )}
                      </button>
                      <button 
                        onClick={() => handleFriendRequest(request.id, false)}
                        className="reject-btn"
                        title="Từ chối"
                        disabled={isProcessingRequest === request.id}
                      >
                        {isProcessingRequest === request.id ? (
                          <div className="loading-spinner-small"></div>
                        ) : (
                          <FiX />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating action button - luôn hiển thị */}
      <button className="add-friend-button" onClick={handleAddFriend}>
        <FiPlus />
        {pendingRequests.length > 0 && (
          <div className="notification-dot">
            <span className="notification-count">
              {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
            </span>
          </div>
        )}
      </button>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={handleAddFriendByEmail}
        isLoading={isAddingFriend}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={handleCancelCreateGroup}
        onConfirm={handleConfirmCreateGroup}
        groupName={groupName}
        onGroupNameChange={setGroupName}
        isCreating={isCreatingGroup}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={4000}
      />
    </div>
  );
}; 