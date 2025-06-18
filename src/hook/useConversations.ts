import { useState, useEffect } from 'react';
import { Conversation } from '../api/Chat.int';
import { fetchConversationsAPI } from '../api/Chat.api';
import socketService from '../socket/Socket';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = socketService;

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchConversationsAPI();
      setConversations(response.data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    socket.on('new_conversation', (conversation: Conversation) => {
      setConversations(prev => [...prev, conversation]);
    });

    socket.on('update_conversation', (conversation: Conversation) => {
      setConversations(prev => 
        prev.map(c => c.id === conversation.id ? conversation : c)
      );
    });

    socket.on('delete_conversation', (conversationId: number) => {
      setConversations(prev => 
        prev.filter(c => c.id !== conversationId)
      );
    });

    return () => {
      socket.off('new_conversation');
      socket.off('update_conversation');
      socket.off('delete_conversation');
    };
  }, [socket]);

  return {
    conversations,
    isLoading,
    error,
    refreshConversations: fetchConversations,
  };
}; 