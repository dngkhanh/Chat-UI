import React, { useState, useEffect } from 'react';
import { token } from '../../../store/tokenContext';
import './AddParticipant.scss';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

interface Friend {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requester: User;
  receiver: User;
}

interface AddParticipantProps {
  conversationId: number;
  onParticipantAdded: () => void;
  onClose: () => void;
}

export const AddParticipant: React.FC<AddParticipantProps> = ({
  conversationId,
  onParticipantAdded,
  onClose,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/friends?page=1&size=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.statusCode === 200) {
        const acceptedFriends = data.data.result.filter(
          (friend: Friend) => friend.status === 'ACCEPTED'
        );
        setFriends(acceptedFriends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends');
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedEmail) {
      setError('Please select a friend or enter an email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:8080/conversations/${conversationId}/participants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: selectedEmail,
            type: 'MEMBER'
          })
        }
      );

      const data = await response.json();
      if (data.statusCode === 201) {
        onParticipantAdded();
        onClose();
      } else {
        setError(data.message || 'Failed to add participant');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      setError('Failed to add participant');
    } finally {
      setLoading(false);
    }
  };

  const handleFriendSelect = (email: string) => {
    setSelectedEmail(email);
    setError('');
  };

  return (
    <div className="add-participant-modal">
      <div className="modal-header">
        <h3>Add Participant</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="modal-content">
        <div className="search-section">
          <input
            type="email"
            placeholder="Enter email address"
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="email-input"
          />
          <button
            className="add-button"
            onClick={handleAddParticipant}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Participant'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="friends-section">
          <h4>Your Friends</h4>
          <div className="friends-list">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className={`friend-item ${selectedEmail === friend.requester.email ? 'selected' : ''}`}
                onClick={() => handleFriendSelect(friend.requester.email)}
              >
                <div className="friend-info">
                  <span className="friend-name">
                    {friend.requester.first_name} {friend.requester.last_name}
                  </span>
                  <span className="friend-email">{friend.requester.email}</span>
                </div>
                <div className="friend-status">
                  {selectedEmail === friend.requester.email && '✓'}
                </div>
              </div>
            ))}
            {friends.length === 0 && (
              <div className="no-friends">No friends available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddParticipant; 
