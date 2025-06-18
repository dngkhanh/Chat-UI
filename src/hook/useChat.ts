import { useState, useEffect } from 'react';
import { MessageDto, MessageType, CallType, CallStatus, MessageStatus } from '../api/Chat.int';
import { getChatByConversationId } from '../api/Chat.api';
import { socketService } from '../services/socket';

export const useChat = (conversationId?: number) => {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    socketService.on('receive_message', (message: MessageDto) => {
      setMessages(prev => [...prev, message]);
    });

    socketService.on('call_response', (message: MessageDto) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socketService.off('receive_message');
      socketService.off('call_response');
    };
  }, []);

  const fetchMessages = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getChatByConversationId(id, 20);
      const data = await response.json();
      setMessages(data.data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = (content: string, type: MessageType = MessageType.text) => {
    if (!conversationId) return;

    const message: MessageDto = {
      conversationId,
      messageType: type,
      content,
      status: MessageStatus.sent,
      timestamp: new Date(),
    };

    socketService.emit('send_message', message);
    setMessages(prev => [...prev, message]);
  };

  const sendCall = (callType: CallType) => {
    if (!conversationId) return;

    const message: MessageDto = {
      conversationId,
      messageType: MessageType.call,
      content: '',
      callType,
      callStatus: CallStatus.INVITED,
      status: MessageStatus.sent,
      timestamp: new Date(),
    };

    socketService.emit('send_call', message);
    setMessages(prev => [...prev, message]);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendCall,
  };
}; 