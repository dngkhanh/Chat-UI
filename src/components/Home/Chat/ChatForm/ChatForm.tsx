import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiSmile, FiPaperclip } from 'react-icons/fi';
import Emoji from '../../../Emoji/Emoji';
import './ChatForm.scss';

interface ChatFormProps {
  onSubmit: (message: string) => void;
  isChatInfoOpen?: boolean;
}

const ChatForm: React.FC<ChatFormProps> = ({ onSubmit, isChatInfoOpen = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Đóng emoji picker khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
      setMessage('');
      setShowEmojiPicker(false); // Đóng emoji picker khi gửi tin nhắn
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleEmojiClick = (event: any, emojiObject: any) => {
    const emoji = event.emoji;
    const newMessage = message + emoji;
    setMessage(newMessage);
    
    // Cập nhật chiều cao textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <div className="chat-form-wrapper">
      <form className={`chat-form ${isChatInfoOpen ? 'chat-form--with-info' : ''}`} onSubmit={handleSubmit}>
        <div className="chat-form__input-container">
          <button type="button" className="chat-form__icon-button">
            <FiPaperclip />
          </button>
          <textarea
            ref={textareaRef}
            className="chat-form__input"
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            rows={1}
          />
          <button 
            type="button" 
            className="chat-form__icon-button"
            onClick={toggleEmojiPicker}
          >
            <FiSmile />
          </button>
        </div>
        <button 
          type="submit" 
          className="chat-form__send-button"
          disabled={!message.trim()}
        >
          <FiSend />
        </button>
      </form>
      
      {showEmojiPicker && (
        <div className="emoji-picker-container" ref={emojiPickerRef}>
          <Emoji 
            value={textareaRef}
            onEmojiClick={handleEmojiClick}
          />
        </div>
      )}
    </div>
  );
};

export default ChatForm; 