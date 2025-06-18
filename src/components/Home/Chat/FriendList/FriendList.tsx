import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUserPlus, FiUsers, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import './FriendList.scss';
import { token } from '../../../store/tokenContext';

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

interface Friend {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface FriendListProps {
  onBack: () => void;
}

export const FriendList: React.FC<FriendListProps> = ({ onBack }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch friends
  const fetchFriends = async () => {
    try {
      const response = await fetch(`http://localhost:8080/friends`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
      });

      if (!response.ok) {
        throw `HTTP error! status: ${response.status}`;
        }

      const data = await response.json();
      setFriends(data.data?.result || []);
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
      const response = await fetch(`http://localhost:8080/friend-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw `HTTP error! status: ${response.status}`;
      }

      const data = await response.json();
      setFriendRequests(data.data?.result || []);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    }
  };

  // Handle friend request
  const handleFriendRequest = async (requestId: number, accept: boolean) => {
    try {
      const response = await fetch(`http://localhost:8080/friend-requests/${requestId}/${accept ? 'accept' : 'reject'}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw `HTTP error! status: ${response.status}`;
      }

      // Refresh friend requests and friends
      await fetchFriendRequests();
      await fetchFriends();
    } catch (err) {
      console.error('Error handling friend request:', err);
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

  if (isLoading) {
    return (
      <div className="friend-list">
        <div className="friend-list__header">
          <button onClick={onBack} className="back-button">
            <FiArrowLeft />
          </button>
          <h3>Bạn bè</h3>
        </div>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="friend-list">
      <div className="friend-list__header">
        <button onClick={onBack} className="back-button">
          <FiArrowLeft />
        </button>
        <h3>Bạn bè</h3>
        <button 
          onClick={() => setShowFriendRequests(!showFriendRequests)}
          className="requests-button"
        >
          <FiUserPlus />
          {pendingRequests.length > 0 && (
            <span className="request-count">{pendingRequests.length}</span>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showFriendRequests && (
        <div className="friend-requests">
          <h4>Lời mời kết bạn ({pendingRequests.length})</h4>
          {pendingRequests.length === 0 ? (
            <p>Không có lời mời kết bạn nào</p>
          ) : (
            pendingRequests.map(request => (
              <div key={request.id} className="friend-request-item">
                <div className="user-info">
                  <div className="avatar">
                    <FiUsers />
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
                  >
                    <FiCheck />
                  </button>
                  <button 
                    onClick={() => handleFriendRequest(request.id, false)}
                    className="reject-btn"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      <div className="friends-list">
        {filteredFriends.length === 0 ? (
          <div className="empty-state">
            <FiUsers className="empty-icon" />
            <p>Không tìm thấy bạn bè nào</p>
      </div>
        ) : (
          filteredFriends.map(friend => (
            <div key={friend.id} className="friend-item">
              <div className="avatar">
                <FiUsers />
              </div>
              <div className="friend-info">
                <h5>{friend.firstName} {friend.lastName}</h5>
                <p>{friend.email}</p>
                <span className={`status ${friend.isActive ? 'online' : 'offline'}`}>
                  {friend.isActive ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 