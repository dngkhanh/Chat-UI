import React, { createContext, useContext, useState } from "react";
import { ConversationVm } from "../components/Home/Chat/ChatBox/ChatBox";

const CallContext = createContext<{
  conversation: ConversationVm | undefined;
  setConversation: React.Dispatch<
    React.SetStateAction<ConversationVm | undefined>
  >;
}>({
  conversation: undefined,
  setConversation: () => {},
});

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [conversation, setConversation] = useState<ConversationVm | undefined>(
    undefined
  );

  return (
    <CallContext.Provider value={{ conversation, setConversation }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext); 