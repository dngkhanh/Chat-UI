import React, {
  useEffect,
  useState,
  useRef,
} from "react";
import "./ChatBox.scss";
import { decodeToken, token } from "../../../store/tokenContext";
import VideoCall from "../../Call/Call";
import Success from "../../../Alert/Success";
import Error from "../../../Alert/Error";
import Emoji from "../../../Emoji/Emoji";
import user, { Account } from "../../../store/accountContext";
import InsertMessage from "../ChatItem/ChatItem";
import socketService from "../../../../socket/Socket";
import ChatForm from "../ChatForm/ChatForm";
import ChatInfo from "../ChatInfo/ChatInfo";
import { FiMoreVertical, FiUsers, FiSearch, FiPhone } from 'react-icons/fi';
import { useConversation } from "../../../../hook/ConversationContext";
import { useCall } from "../../../../hook/CallContext";
import { getConversationById, getChatByConversationId, testServerConnection } from "../../../../api/Chat.api";

export enum MessageType {
  text = "TEXT",
  image = "IMAGE",
  file = "FILE",
  video = "VIDEO",
  call = "CALL",
}

export enum CallStatus {
  INVITED,
  MISSED,
  ONGOING,
  ENDED,
}

// export enum TargetType {
//   ROOM,
//   FRIEND,
// }

export enum CallType {
  voice,
  video,
}

export enum MessageStatus {
  sent,
  delivered,
  read,
}

export enum ParticipantType {
  lead,
  member,
}

export enum FriendStatus {
  PENDING,
  ACCEPTED,
  REJECTED,
}

export enum ConversationType {
  GROUP,
  FRIEND,
}

export interface ConversationParticipant {
  id: number;
  userId: number;
  type: ParticipantType;
  createdAt: Date;
  user: User;
}

export interface ConversationVm {
  id: number;
  title: string;
  creatorId: number;
  channelId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  type: ConversationType;
  participants?: ConversationParticipant[];
}

// Message response types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  isActive: boolean;
}

export interface Attachment {
  thumbUrl: string;
  fileUrl: string;
}

// export interface MessageItem {
//   id: number;
//   guid: string;
//   conversationId: number;
//   targetType: TargetType;
//   senderId: number;
//   messageType: MessageType;
//   content: string;
//   createdAt: string;
//   deletedAt: string | null;
//   callType: CallType;
//   callStatus: CallStatus;
//   status: MessageStatus;
//   user: User;
//   attachments: Attachment[];
// }

export interface MessageResponse {
  statusCode: number;
  message: string;
  data: {
    page: number;
    result: MessageDto[];
    size: number;
    totalPage: number;
    totalElement: number;
  };
}

export interface MessageDto {
  id?: number;
  conversationId: number;
  guid?: number;
  conversationType?: ConversationType;
  messageType: MessageType;
  content: string;
  callType?: CallType;
  callStatus?: CallStatus;
  status?: MessageStatus; // You can default this in your implementation logic
  timestamp?: Date;
  attachments?: Attachment[];
  user?: Account;
}

export interface CallDto extends MessageDto {
  callerInfomation: Account;
  signalData: string;
}

export interface CallResponseDto extends MessageDto {
  signal: string;
}

interface OtherInfo {
  name: string;
  image: string;
  type: ConversationType;
  participants?: ConversationParticipant[];
  phoneNumber?: string;
  email?: string;
}

// Function to get other info from conversation
const getOtherInfo = (
  conversation: ConversationVm | undefined,
  currentUserId: number
): OtherInfo => {
  if (!conversation) {
    return {
      name: "All",
      image: "",
      type: ConversationType.FRIEND,
      phoneNumber: undefined,
      email: undefined,
    };
  }

  if (conversation.type === ConversationType.GROUP) {
    return {
      name: conversation.title,
      image: "", // You might want to add a group image field to ConversationVm
      type: ConversationType.GROUP,
      participants: conversation.participants,
      phoneNumber: undefined, // Group chat typically doesn't have one phone number
      email: undefined, // Group chat typically doesn't have one email
    };
  }

  // For friend conversation, find the other participant
  if (conversation.participants && conversation.participants.length === 2) {
    // Lấy participant khác current user
    let friend = conversation.participants.find(p => p.userId !== currentUserId);
    // Nếu không tìm thấy (dữ liệu lỗi), fallback về participant đầu tiên
    if (!friend) {
      friend = conversation.participants[0];
    }
    return {
      name: friend
        ? `${friend.user.firstName} ${friend.user.lastName}`
        : "Unknown",
      image: friend?.user.avatarUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRI9lRck6miglY0SZF_BZ_sK829yiNskgYRUg&s',
      type: ConversationType.FRIEND,
      participants: conversation.participants,
      phoneNumber: undefined,
      email: friend?.user.email,
    };
  }

  // Nếu chỉ có 1 participant (trường hợp bất thường)
  if (conversation.participants && conversation.participants.length === 1) {
    const friend = conversation.participants[0];
    return {
      name: friend
        ? `${friend.user.firstName} ${friend.user.lastName}`
        : "Unknown",
      image: friend?.user.avatarUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRI9lRck6miglY0SZF_BZ_sK829yiNskgYRUg&s',
      type: ConversationType.FRIEND,
      participants: conversation.participants,
      phoneNumber: undefined,
      email: friend?.user.email,
    };
  }

  return {
    name: "Group: " + conversation.title,
    image:
      conversation.participants && conversation.participants[0]?.user.avatarUrl ||
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg2EeQe-qNJinTWuKmUVZwpQnXkt6DudNoBQ&s",
    type: ConversationType.GROUP,
    participants: conversation.participants,
    phoneNumber: undefined,
    email: undefined,
  };
};

interface ChatBoxProps {
  // isChatInfoOpen: boolean;
  // setIsChatInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ChatBox(/*{ isChatInfoOpen, setIsChatInfoOpen }: ChatBoxProps*/) {
  // Connect to socket when component mounts
  useEffect(() => {
    socketService.connect();
    console.log('Socket connected:', socketService.status());
  }, []);

  const { conversationId, setConversationId, isShowRecent, setIsShowRecent } = useConversation();
  const { conversation, setConversation } = useCall();

  const [isChatInfoOpen, setIsChatInfoOpen] = useState<boolean>(false);
  const [otherInfo, setOtherInfo] = useState<OtherInfo>({
    name: "All",
    image: "",
    type: ConversationType.FRIEND,
    phoneNumber: undefined,
    email: undefined,
  });
  const [conversationInfo, setConversationInfo] = useState<ConversationVm>();
  const [chatsFriendRecent, setChatsFriendRecent] = useState<MessageDto[]>([]);
  const [isCall, setIsCall] = useState<"none" | "flex">("none");
  const [alertTag, setAlertTag] = useState<JSX.Element | string>("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messageRecent, setMessageRecent] = useState<JSX.Element[]>([]);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [isEmoji, setIsEmoji] = useState<boolean>(false);
  const [myGroups, setMyGroups] = useState<number[]>([]);
  const [chatLimit, setChatLimit] = useState<number>(15);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [showLoad, setShowLoad] = useState<boolean>(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [currentHeightOfChats, setCurrentHeightOfChats] = useState<
    number | undefined
  >(undefined);
  const [option, setOption] = useState<number | undefined>(undefined);
  const [coop, setCoop] = useState<string>("");
  const [resetCall, setResetCall] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageDto[]>([]);

  // Update conversation when isLoad changes
  useEffect(() => {
    if (conversationId) {
      setConversationId(conversationId);
      setAutoScroll(true);
      setChatLimit(15);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [conversationId]);

  // Fetch conversation info
  useEffect(() => {
    if (conversationId && conversationId !== -1) {
      getConversationById(conversationId)
        .then((data) => {
          setConversationInfo(data.data);
        })
        .catch((err) => console.error(err));
    }
  }, [conversationId]);

  // Update other info when conversation changes
  useEffect(() => {
    if (conversationInfo) {
      setOtherInfo(getOtherInfo(conversationInfo, user.id));
    }
  }, [conversationInfo]);

  useEffect(() => {
    const messages = document.querySelector(
      "#messages"
    ) as HTMLDivElement | null;
    if (messages) {
      messagesRef.current = messages;
      setCurrentHeightOfChats(messages.scrollHeight);
    }
  }, []);

  // Keep old position before fetch
  useEffect(() => {
    if (messagesRef.current && currentHeightOfChats !== undefined) {
      messagesRef.current.scrollTop =
        messagesRef.current.scrollHeight - currentHeightOfChats;
    }
  }, [currentHeightOfChats]);

  // Fetch messages from API
  useEffect(() => {
    if (conversationId && conversationId !== -1) {
      fetchChat();
    }
  }, [conversationId, chatLimit]);

  // Get message recent with other friend now
  const fetchChat = async (retryCount = 0) => {
    if (!conversationId) {
      setChatsFriendRecent([]);
      return;
    }

    try {
      setShowLoad(true);
      
      // Test server connection first
      const serverOk = await testServerConnection();
      if (!serverOk) {
        // Fallback: hiển thị tin nhắn mẫu nếu server không hoạt động
        console.log("Server not available, showing sample messages");
        const sampleMessages: MessageDto[] = [
          {
            id: 1,
            conversationId: conversationId,
            messageType: MessageType.text,
            content: "Xin chào! Đây là tin nhắn mẫu.",
            timestamp: new Date(),
            user: {
              id: 2,
              firstName: "Người",
              lastName: "Dùng",
              email: "user@example.com",
              avatarUrl: "https://i.pravatar.cc/150?img=2",
              isActive: true
            }
          },
          {
            id: 2,
            conversationId: conversationId,
            messageType: MessageType.text,
            content: "Server hiện tại không khả dụng. Vui lòng thử lại sau.",
            timestamp: new Date(Date.now() - 60000),
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              avatarUrl: user.avatarUrl,
              isActive: user.isActive
            }
          }
        ];
        
        setChatsFriendRecent(sampleMessages);
        setMessages(sampleMessages);
        setShowLoad(false);
        return;
      }
      
      // Sử dụng API mới
      const data: MessageResponse = await getChatByConversationId(conversationId, chatLimit);
      
      if (data.data) {
        setChatsFriendRecent(data.data.result || []);
        setMessages(data.data.result || []); // Cập nhật cả messages state
      }
      
      const messages = document.querySelector(
        "#messages"
      ) as HTMLDivElement | null;
      if (messages) {
        setCurrentHeightOfChats(messages.scrollHeight);
      }
      setShowLoad(false);
    } catch (err) {
      console.error('Error fetching chat:', err);
      
      // Retry mechanism
      if (retryCount < 3) {
        setAlertTag(
          <Error
            value={[
              "Lỗi kết nối",
              `Đang thử lại lần ${retryCount + 1}/3...`,
            ]}
          />
        );
        setTimeout(() => {
          fetchChat(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        setAlertTag(
          <Error
            value={[
              "Lỗi kết nối",
              "Không thể tải tin nhắn. Vui lòng thử lại sau.",
            ]}
          />
        );
        setTimeout(() => setAlertTag(""), 5000);
      }
      setShowLoad(false);
    }
  };

  // Render message recent with other friend now
  useEffect(() => {
    const old: JSX.Element[] = [];
    chatsFriendRecent.forEach((msg, index) => {
      if (conversationId) {
      old.push(<InsertMessage key={msg.id || `msg-${index}-${Date.now()}`} props={[msg, conversationId]} />);
      }
    });
    setMessageRecent(old);
  }, [chatsFriendRecent, conversationId]);

  // Function to sanitize input
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  };

  // Function to validate message content
  const validateMessage = (message: string): { isValid: boolean; error?: string } => {
    if (!message.trim()) {
      return { isValid: false, error: "Tin nhắn không được để trống." };
    }
    
    if (message.length > 1000) {
      return { isValid: false, error: "Tin nhắn quá dài. Tối đa 1000 ký tự." };
    }
    
    // Check for potential XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(message)) {
        return { isValid: false, error: "Tin nhắn chứa nội dung không hợp lệ." };
      }
    }
    
    return { isValid: true };
  };

  // SEND message to server
  function onSubmit(message: string) {
    if (!conversationId) {
      setAlertTag(
        <Error
          value={[
            "Lỗi",
            "Không thể gửi tin nhắn. Vui lòng chọn một cuộc trò chuyện.",
          ]}
        />
      );
      setTimeout(() => setAlertTag(""), 5000);
      return;
    }

    const validationResult = validateMessage(message);
    if (!validationResult.isValid) {
      setAlertTag(
        <Error
          value={[
            "Lỗi",
            validationResult.error,
          ]}
        />
      );
      setTimeout(() => setAlertTag(""), 3000);
      return;
    }

    if (isSending) {
      setAlertTag(
        <Error
          value={[
            "Đang gửi",
            "Vui lòng chờ tin nhắn trước được gửi.",
          ]}
        />
      );
      setTimeout(() => setAlertTag(""), 3000);
      return;
    }

    setIsSending(true);

    const sanitizedMessage = sanitizeInput(message);

      const msg: MessageDto = {
        conversationId: conversationId,
        conversationType: conversationInfo?.type,
        messageType: MessageType.text,
      content: sanitizedMessage,
      };

      console.log('Sending message:', msg);
    
    try {
      socketService.emit("sendMessage", msg);
      console.log('Message sent');
      setAutoScroll(true);
      if (inputRef.current) inputRef.current.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      setAlertTag(
        <Error
          value={[
            "Lỗi gửi tin nhắn",
            "Không thể gửi tin nhắn. Vui lòng thử lại.",
          ]}
        />
      );
      setTimeout(() => setAlertTag(""), 5000);
    } finally {
      setIsSending(false);
    }
  }

  // Scroll top extra and get message previous
  const overScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0) {
      setShowLoad(true);
      setChatLimit((prev) => prev + 20);
      setAutoScroll(false);
      fetchChat();
    } else if (target.scrollTop + window.innerHeight <= target.scrollHeight) {
      setAutoScroll(false);
    } else {
      setAutoScroll(true);
    }
  };

  // User is typing
  const typing = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (conversationId) {
      socketService.emit("typing", { otherId: conversationId });
    }
  };

  const handleComingMessage = (msg: any) => {
    console.log('Received message:', msg);
    const tmp = user;
    console.log("xxxxxxxxxxxx " + tmp);
    if (msg.conversationId == conversationId) {
      console.log("HERE 1");
      if (conversationId) {
      setMessageRecent((prev) => [
        ...prev,
        <InsertMessage key={msg.id || `new-msg-${Date.now()}`} props={[msg, conversationId]} />,
      ]);
      }
      return;
    } else {
      console.log("HERE 2");
      setAlertTag(
        <Success
          value={[
            `${
              msg.conversationType === ConversationType.GROUP
                ? "Group message from: " + msg.user?.lastName + ": "
                : ""
            } ${msg.user?.lastName}`,
            [msg.content],
          ]}
        />
      );
      setTimeout(() => setAlertTag(""), 6000);
    }
  };

  useEffect(() => {}, [socketService]);

  // useEffect(() => {
  //   socket.on("listOnline", (data: { listOnline: number[] }) => {
  //     setListOnline(data.listOnline);
  //   });
  // }, [socket]);

  // RENDER incoming message realtime
  useEffect(() => {
    socketService.listen("messageComing", handleComingMessage);
    return () => socketService.offListener("messageComing", handleComingMessage);
  }, [conversationId, messageRecent, myGroups]);

  // Scroll to bottom
  useEffect(() => {
    const messages = document.querySelector(
      "#messages"
    ) as HTMLDivElement | null;
    if (autoScroll && messages) messages.scrollTop = messages.scrollHeight;
  }, [messageRecent]);

  // Check Profile
  const checkProfile = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log("checkProfile");
  };

  // SECTION OF CALLING
  // const goCall = (e: React.MouseEvent<HTMLImageElement>) => {
  //   if (isCall === "none") {
  //     setCoop("You calling to " + otherName);
  //     setOption(conversationId);
  //     setIsCall("flex");
  //   } else {
  //     window.alert(
  //       "To CALL/ANSWER doubleClick on `your` screen! \nTo STOP doubleClick on `other` screen \nOr You Can Click Button On Screen !"
  //     );
  //   }
  // };

  // Receiver call
  useEffect(() => {
    socketService.listen("user_not_online", () => {
      setAlertTag(
        <Error
          value={[
            "Not Online",
            "Current this user not online, pls contact him after !",
          ]}
        />
      );
      setIsCall("none");
      setTimeout(() => setAlertTag(""), 5000);
      setOption(undefined);
      setCoop("");
      setResetCall(false);
      setConversation(undefined); // Clear call conversation
    });

    socketService.listen("open_call", (data: { callerName: string; conversation?: ConversationVm }) => {
      setIsCall("flex");
      setCoop(data.callerName + " calling to you");
      if (data.conversation) {
        setConversation(data.conversation); // Set call conversation
      }
    });

    socketService.listen("refuse_call", () => {
      setCoop("");
      setOption(undefined);
      setIsCall("none");
      console.log("refuse");
      setResetCall(false);
      setConversation(undefined); // Clear call conversation
    });

    socketService.listen("complete_close_call", () => {
      console.log("complete_close_call");
      setCoop("");
      setOption(undefined);
      setIsCall("none");
      setResetCall(false);
      setConversation(undefined); // Clear call conversation
    });

    socketService.listen("give_up_call", () => {
      setCoop("");
      setOption(undefined);
      setIsCall("none");
      setResetCall(false);
      setConversation(undefined); // Clear call conversation
    });

    return () => {
      socketService.offListener("user_not_online");
      socketService.offListener("open_call");
      socketService.offListener("refuse_call");
      socketService.offListener("complete_close_call");
      socketService.offListener("give_up_call");
    };
  }, [setConversation]);

  useEffect(() => {
    if (!resetCall) setResetCall(true);
  }, [resetCall]);

  // Sending call
  const goCall = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isCall === "none") {
      setCoop(`You calling to ${otherInfo.name}`);
      setOption(conversationId);
      setIsCall("flex");
    } else {
      window.alert(
        "To CALL/ANSWER doubleClick on `your` screen! \nTo STOP doubleClick on `other` screen \nOr You Can Click Button On Screen !"
      );
    }
  };

  const handleSendMessage = (message: string) => {
    if (!conversationId) return;

    const msg: MessageDto = {
      conversationId: conversationId,
      conversationType: conversationInfo?.type,
      messageType: MessageType.text,
      content: message,
    };

    socketService.emit("sendMessage", msg);
    setAutoScroll(true);
  };

  const handleVideoCall = () => {
    // Xử lý gọi video
    console.log('Video call clicked');
  };

  const handleVoiceCall = () => {
    // Xử lý gọi thoại
    console.log('Voice call clicked');
  };

  const handleViewProfile = () => {
    // Xử lý xem thông tin
    console.log('View profile clicked');
  };

  const handleSocketInteraction = (message: string) => {
    if (!socketService || !conversationId) return;
    
    const messageData = {
      conversationId,
      messageType: MessageType.text,
      content: message,
      timestamp: new Date(),
    };

    socketService.emit('sendMessage', messageData);
    handleSendMessage(message);
  };

  return (
    <div className="chat-box">
      <div className="chat-box__main">
        <div 
          id="messages" 
          className="chat-box__messages"
          onScroll={overScroll}
        >
          {showLoad && <div className="loading">Loading...</div>}
          {messageRecent}
        </div>

        {isChatInfoOpen && (
          <ChatInfo 
            isOpen={isChatInfoOpen}
            onClose={() => setIsChatInfoOpen(false)}
            chatInfo={{
              id: conversationId || 0,
              name: otherInfo.name,
              avatar: otherInfo.image,
              type: ConversationType[otherInfo.type] as keyof typeof ConversationType,
              participants: otherInfo.participants,
              email: otherInfo.email,
              phoneNumber: otherInfo.phoneNumber,
            }}
          />
        )}
      </div>

      <ChatForm 
        onSubmit={onSubmit}
        isChatInfoOpen={isChatInfoOpen}
      />
    </div>
  );
}

export default ChatBox;
