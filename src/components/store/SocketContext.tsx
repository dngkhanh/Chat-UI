// // src/context/SocketContext.tsx
// import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { jwtDecode } from 'jwt-decode';

// interface DecodedToken {
//   sub?: string;
//   [key: string]: any;
// }

// const SocketContext = createContext<Socket | null>(null);

// interface SocketProviderProps {
//   token: string;
//   children: ReactNode;
// }

// export const SocketProvider: React.FC<SocketProviderProps> = ({ token, children }) => {
//   const [socket, setSocket] = useState<Socket | null>(null);

//   useEffect(() => {
//     if (!token) return;

//     let decoded: DecodedToken = {};
//     try {
//       decoded = jwtDecode<DecodedToken>(token);
//     } catch {
//       console.warn('Invalid token');
//     }

//     const socketInstance = io('http://localhost:8080', {
//       auth: { token },
//       query: { myParam: decoded.sub || '' },
//       transportOptions: {
//         polling: {
//           extraHeaders: {
//             Authorization: `Bearer ${token}`,
//           },
//         },
//       },
//       autoConnect: true,
//     });

//     setSocket(socketInstance);

//     return () => {
//       socketInstance.disconnect();
//     };
//   }, [token]);

//   return (
//     <SocketContext.Provider value={socket}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = () => useContext(SocketContext);
