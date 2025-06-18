import { io, Socket } from "socket.io-client";
import { token } from "../components/store/tokenContext";

class SocketService {
  private socket: Socket | null = null;
  private readonly url: string = process.env.REACT_APP_API || "localhost:8080";

  constructor() {
    this.socket = io(this.url, {
      auth: { token },
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
      autoConnect: false,
    });
  }

  connect(): void {
    if (!this.socket) return;
    this.socket.connect();
    this.socket.on("error", (error: any) => {
      localStorage.removeItem("user");
    });
  }

  listen(eventName: string, callback: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.on(eventName, callback);
  }

  removeListener(eventName: string, listener?: (...args: any[]) => void): void {
    if (!this.socket) return;
    this.socket.removeListener(eventName, listener);
  }

  offListener(eventName: string, listener?: (...args: any[]) => void): void {
    if (!this.socket) return;
    this.socket.off(eventName);
  }

  emit(eventName: string, data: any): void {
    if (!this.socket) return;
    this.socket.emit(eventName, data);
  }

  // Disconnect from the socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log("Disconnected from the server.");
    }
  }

  status(): boolean {
    return this.socket?.connected || false;
  }
}

const socketService = new SocketService();

export default socketService; 