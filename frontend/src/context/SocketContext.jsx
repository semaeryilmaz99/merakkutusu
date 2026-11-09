import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingMessages, setIncomingMessages] = useState([]);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setIncomingMessages([]);
      return;
    }

    // socket.io-client artık burada, sadece giriş yapmış bir kullanıcı olduğunda
    // dinamik import ediliyor — önceden dosyanın en üstünde statik import
    // edildiği için kütüphanenin tamamı (engine.io-client dahil) Login/Register
    // gibi anonim sayfalarda bile ana bundle'a gömülüyordu.
    let cancelled = false;
    let instance;

    import("socket.io-client").then(({ io }) => {
      if (cancelled) return;
      const token = localStorage.getItem("token");
      instance = io(SOCKET_URL, { auth: { token } });

      instance.on("direct_message", (message) => {
        setIncomingMessages((prev) => [...prev, { ...message, id: `${message.roomId}-${message.createdAt}` }]);
      });

      setSocket(instance);
    });

    return () => {
      cancelled = true;
      instance?.disconnect();
    };
  }, [user?._id]);

  const dismissIncomingMessage = (id) => {
    setIncomingMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, incomingMessages, dismissIncomingMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext)?.socket;

export const useIncomingMessages = () => {
  const ctx = useContext(SocketContext);
  return {
    incomingMessages: ctx?.incomingMessages || [],
    dismissIncomingMessage: ctx?.dismissIncomingMessage,
  };
};
