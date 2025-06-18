import { token } from "../components/store/tokenContext";

// Hàm test để kiểm tra server có hoạt động không
export const testServerConnection = async () => {
  try {
    const response = await fetch(`http://localhost:8080/conversations?page=1&size=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Server test response:", response.status);
    return response.ok;
  } catch (error) {
    console.error("Server test failed:", error);
    return false;
  }
};

export const fetchConversationsAPI = async () => {
  const res = await fetch(
    `http://localhost:8080/conversations?page=1&size=20`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch conversations");
  }
  const data = await res.json();
  return data;
};

export const createConversation = async (body: Record<string, any>) => {
  const res = await fetch(`http://localhost:8080/conversations/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error("Failed to create conversation");
  }
  return res.json();
}

export const uploadImage = async (formData: FormData, id: number) => {
  const response = await fetch(
    `http://localhost:8080/conversations/${id}/avatar`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );
  if (!response.ok) {
    throw new Error("Failed to upload image");
  }
  return response.json();
}

export const updateImageUrl = async (body: Record<string, any>, id: number) => {
  const response = await fetch(
    `http://localhost:8080/conversations/${id}/avatar`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to update image URL");
  }
  return response.json();
}

export const deleteChat = async (id: number) => {
  const response = await fetch(
    `http://localhost:8080/chats/delete/${id}`, 
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to delete chat");
  }
  return response;
}

export const getConversationById = async (id: number) => {
  const response = await fetch(
    `http://localhost:8080/conversations/${id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch conversation by ID");
  }
  return response.json();
};

export const getChatByConversationId = async (conversationId: number, chatLimit: number) => {
  // Thử endpoint đầu tiên
  try {
    const response = await fetch (
      `http://localhost:8080/conversations/${conversationId}/message?page=1&size=${chatLimit}&order=desc`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch chat by conversation ID");
    }
    return response.json();
  } catch (error) {
    console.log("Endpoint 1 failed, trying endpoint 2...");
    
    // Thử endpoint thứ hai
    try {
      const response = await fetch (
        `http://localhost:8080/messages/${conversationId}?limit=${chatLimit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) {
        throw new Error("Failed to fetch chat by conversation ID");
      }
      return response.json();
    } catch (error2) {
      console.log("Endpoint 2 failed, trying endpoint 3...");
      
      // Thử endpoint thứ ba
      try {
        const response = await fetch (
          `http://localhost:8080/chats/${conversationId}?limit=${chatLimit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        if (!response.ok) {
          throw new Error("Failed to fetch chat by conversation ID");
        }
        return response.json();
      } catch (error3) {
        console.error("All endpoints failed:", error3);
        throw new Error("Failed to fetch chat by conversation ID - no working endpoint found");
      }
    }
  }
}; 