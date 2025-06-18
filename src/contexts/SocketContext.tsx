import React, { createContext, useContext, useEffect } from "react";
import socketService from "../socket/Socket";

interface SocketContextType {
  socket: typeof socketService;
}

const SocketContext = createContext<SocketContextType>({
  socket: socketService,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketService }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 