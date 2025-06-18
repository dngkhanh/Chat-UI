import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  MouseEvent,
  DragEvent,
} from "react";
import "./Conversation.scss";
import { useConversation } from "../../../../hook/ConversationContext";
import { token } from "../../../store/tokenContext";
import AddParticipant from "./AddParticipant";
import user from "../../../store/accountContext";
import socketService from "../../../../socket/Socket";

export enum ConversationType {
  GROUP = 0,
  FRIEND = 1,
}

interface Participant {
  id: number;
  name?: string;
  userId: number;
  type: string;
}

interface Message {
  senderId: number;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  name: string;
  image: string;
  msgTime: string;
  content: string;
  conversationType: ConversationType;
  participants: Participant[];
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

interface FriendRequestResponse {
  page: number;
  size: number;
  totalPage: number;
  totalElement: number;
  result: FriendRequest[];
}

interface FriendRequestData {
  id: number;
  requesterId: number;
  receiverId: number;
  status: string;
  createdAt: string;
  requester: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
  receiver: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
}

interface FriendRequestApiResponse {
  statusCode: number;
  message: string;
  data: {
    page: number;
    size: number;
    totalPage: number;
    totalElement: number;
    result: FriendRequestData[];
  };
}

interface CreateConversationResponse {
  id: number;
  title: string;
  creator_id: number;
  channel_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
  avatar_url: string;
  participants: {
    id: number;
    conversation_id: number;
    user_id: number;
    type: "LEAD" | "MEMBER";
    created_at: string;
    updated_at: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      isActive: boolean;
    };
  }[];
}

interface AddParticipantResponse {
  statusCode: number;
  message: string;
  data: {
    id: number;
    conversation_id: number;
    user_id: number;
    type: "LEAD" | "MEMBER";
    created_at: string;
    updated_at: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      isActive: boolean;
    };
  };
}

interface Friend {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface FriendResponse {
  page: number;
  size: number;
  totalPage: number;
  totalElement: number;
  result: Friend[];
}

export function ChatsRecent() {
  const socket: any = socketService;
  const context = useConversation();

  if (!context) return null;

  const {
    conversationIdTransfer,
    setConversationIdTransfer,
    isShowRecent,
    setIsShowRecent,
    activeTab,
    setActiveTab,
    selectedChat,
    setSelectedChat
  } = context;

  const [chatRecent, setChatRecent] = useState<Conversation[]>([]);
  const [listOnline, setListOnline] = useState<number[]>([]);
  const [userTyping, setUserTyping] = useState<number[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [email, setEmail] = useState("");
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendRequest | null>(null);
  const [conversationTitle, setConversationTitle] = useState("");
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [showFriendSelection, setShowFriendSelection] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedConversationForImage, setSelectedConversationForImage] =
    useState<Conversation | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    socket.on("timerEvent", () => {
      setIsLoading(!isLoading);
    });
    
    fetchFriendRequested();
    fetchConversations();
    fetchFriends();
  }, [isLoading]);

  useEffect(() => {
    // Xử lý activeTab
    switch (activeTab) {
      case "add-friend":
        setShowAddFriend(true);
        break;
      case "friend-requests":
        setShowFriendRequests(true);
        break;
      case "create-conversation":
        setShowCreateConversation(true);
        break;
      default:
        setShowAddFriend(false);
        setShowFriendRequests(false);
        setShowCreateConversation(false);
    }
  }, [activeTab]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest(
      ".recent-item"
    ) as HTMLElement | null;
    const before = itemRef.current?.getElementsByClassName("current-recent");
    if (before?.[0]) {
      before[0].classList.remove("current-recent");
    }
    if (target) {
      target.classList.add("current-recent");
      const tartgetId = target.getAttribute("data-id") || "";
      changeIsLoadValue(+tartgetId);
      setIsShowRecent(false);
    }
  };

  const changeIsLoadValue = (value: number) => {
    setConversationIdTransfer(value);
  };

  const mapApiResponseToConversation = (item: any): Conversation => {
    const lastMsg = item.lastMessage;
    const content = lastMsg
      ? `${lastMsg.user?.firstName || "User"}: ${lastMsg.content}`
      : "";

    // For conversations with 2 participants, show the other person's name
    if (item.conversationType === ConversationType.FRIEND) {
      // Find the other participant (not the current user)
      const otherParticipant = item.participants.find(
        (p: any) => p.userId !== user.id
      );
      const title = otherParticipant
        ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
        : item.title;

      return {
        id: item.id,
        name: title,
        image: item.avatarUrl || "",
        msgTime: lastMsg?.createdAt ?? item.updatedAt,
        content,
        conversationType: item.conversationType,
        participants: item.participants,
      };
    }
    // For group conversations, use the conversation title
    else {
      return {
        id: item.id,
        name: item.title,
        image: item.avatarUrl || "",
        msgTime: lastMsg?.createdAt ?? item.updatedAt,
        content,
        conversationType: item.conversationType,
        participants: item.participants,
      };
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/conversations?page=1&size=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      const conversations = json.data?.result ?? [];

      const formatted: Conversation[] = conversations
        .map(mapApiResponseToConversation)
        .sort(
          (a: any, b: any) =>
            new Date(b.msgTime).getTime() - new Date(a.msgTime).getTime()
        );
      console.log(formatted);
      setChatRecent(formatted);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  useEffect(() => {
    socketService.listen("loadLastMessage", fetchConversations);
    return () => socketService.offListener("loadLastMessage", fetchConversations);
  }, []);

  useEffect(() => {
    socketService.listen("listOnline", (data: { listOnline: number[] }) => {
      setListOnline(data.listOnline);
    });
  }, []);

  useEffect(() => {
    socketService.listen("typing", (data: { otherId: number }) => {
      if (!userTyping.includes(data.otherId)) {
        setUserTyping((prev) => [...prev, data.otherId]);
        setTimeout(() => {
          setUserTyping((prev) => prev.filter((id) => id !== data.otherId));
        }, 3000);
      }
    });
  }, [userTyping]);

  const handleAddFriend = async () => {
    try {
      const response = await fetch(`http://localhost:8080/friends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.statusCode === 201) {
          alert("Friend request sent successfully!");
          setEmail("");
          setShowAddFriend(false);
          fetchFriendRequested();
        } else {
          alert(data.message || "Failed to send friend request");
        }
      } else {
        alert("Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Error sending friend request");
    }
  };

  const fetchFriendRequested = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/friends/requested?page=${currentPage}&size=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.statusCode === 200) {
        const friendData: FriendRequestResponse = data.data;
        setFriendRequests(friendData.result);
        setTotalPages(friendData.totalPage);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/friends/accepted?page=1&size=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data: FriendRequestApiResponse = await response.json();
      if (data.statusCode === 200) {
        // Extract friends from the friend requests
        const friends: Friend[] = data.data.result.map((request) => {
          // If current user is requester, return receiver as friend
          if (request.requesterId === user.id) {
            return request.receiver;
          }
          // If current user is receiver, return requester as friend
          return request.requester;
        });
        setFriends(friends);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedFriends.length === 0) {
      alert("Please select at least one friend");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/conversations/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: conversationTitle || "New Conversation",
            channelId: 2,
            avatarUrl:
              "https://st.gamevui.vn/images/image/gamehanhdong/Songoku-bao-ve-size-111x111-znd.jpg",
            participants: selectedFriends.map((friend) => ({
              userId: friend.id,
              type: "MEMBER",
            })),
          }),
        }
      );

      const data = await response.json();
      if (data.statusCode === 201) {
        const conversationData: CreateConversationResponse = data.data;
        const newConversation: Conversation = {
          id: conversationData.id,
          name: conversationData.title,
          image: conversationData.avatar_url,
          msgTime: conversationData.created_at,
          content: "",
          conversationType: ConversationType.GROUP,
          participants: conversationData.participants.map((p) => ({
            id: p.id,
            userId: p.user_id,
            name: `${p.user.firstName} ${p.user.lastName}`,
            type: p.type,
          })),
        };
        setChatRecent((prev) => [newConversation, ...prev]);
        setShowCreateConversation(false);
        setShowFriendSelection(false);
        setSelectedFriends([]);
        setConversationTitle("");
      } else {
        alert(data.message || "Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Error creating conversation");
    }
  };

  const handleFriendRequest = async (requestId: number, accept: boolean) => {
    try {
      const response = await fetch(
        `http://localhost:8080/friends/${requestId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.statusCode === 201) {
        const friendRequest = friendRequests.find(
          (req) => req.id === requestId
        );
        if (friendRequest) {
          setSelectedFriend(friendRequest);
          setShowCreateConversation(true);
        }
        fetchFriendRequested();
        fetchConversations();
      } else {
        alert(data.message || "Failed to handle friend request");
      }
    } catch (error) {
      console.error("Error handling friend request:", error);
      alert("Error handling friend request");
    }
  };

  useEffect(() => {
    fetchFriendRequested();
  }, [currentPage]);

  const pendingRequests = friendRequests.filter(
    (req) => req.status === "PENDING"
  );

  const handleConversationClick = (conversation: Conversation) => {
    // setSelectedConversation(conversation);
    // setShowAddParticipant(true);
  };

  const handleParticipantAdded = () => {
    fetchConversations();
  };

  const toggleFriendSelection = (friend: Friend) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f.id === friend.id);
      if (isSelected) {
        return prev.filter((f) => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleImageClick = (conversation: Conversation, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedConversationForImage(conversation);
    setImageUrl(conversation.image);
    setShowImageModal(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError("");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setUploadError("Please drop an image file");
        return;
      }
      await handleImageUpload(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleImageUpload(files[0]);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `http://localhost:8080/conversations/${selectedConversationForImage?.id}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.statusCode === 200) {
        setImageUrl(data.data.avatarUrl);
        // Update the conversation in the list
        setChatRecent((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationForImage?.id
              ? { ...conv, image: data.data.avatarUrl }
              : conv
          )
        );
      } else {
        setUploadError(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError("Failed to upload image");
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl) {
      setUploadError("Please enter an image URL");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/conversations/${selectedConversationForImage?.id}/avatar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: imageUrl }),
        }
      );

      const data = await response.json();
      if (data.statusCode === 200) {
        // Update the conversation in the list
        setChatRecent((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationForImage?.id
              ? { ...conv, image: imageUrl }
              : conv
          )
        );
        setShowImageModal(false);
      } else {
        setUploadError(data.message || "Failed to update image URL");
      }
    } catch (error) {
      console.error("Error updating image URL:", error);
      setUploadError("Failed to update image URL");
    }
  };

  return (
    <div className="chat-list">
      {chatRecent.map((chat) => (
        <div
          key={chat.id}
          className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
          onClick={() => setSelectedChat(chat)}
        >
          <div className="avatar">
            <img src={chat.image} alt={chat.name} />
          </div>
          <div className="chat-info">
            <div className="name">{chat.name}</div>
            <div className="last-message">{chat.content}</div>
          </div>
          <div className="chat-meta">
            <div className="time">{chat.msgTime}</div>
            {/* Nếu muốn hiển thị số tin nhắn chưa đọc, cần bổ sung trường unreadCount vào dữ liệu thực tế */}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatsRecent;
