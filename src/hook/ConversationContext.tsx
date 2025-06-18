import React, { createContext, useContext, useState } from "react";

export interface ConversationContextType {
  conversationId: number | undefined;
  setConversationId: React.Dispatch<React.SetStateAction<number | undefined>>;
  isShowRecent: boolean;
  setIsShowRecent: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ConversationContext = createContext<ConversationContextType>({
  conversationId: undefined,
  setConversationId: () => {}, 
  isShowRecent: true,
  setIsShowRecent: () => {},  
});

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [isShowRecent, setIsShowRecent] = useState<boolean>(true);

  return (
    <ConversationContext.Provider value={{ conversationId, setConversationId, isShowRecent, setIsShowRecent }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => useContext(ConversationContext); 