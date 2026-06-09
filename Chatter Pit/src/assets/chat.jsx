import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { MessageCircle, MoreVertical, Plus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";

function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  return `${window.location.protocol}//${window.location.hostname}:3001`;
}

function ChatPage() {
  const navigate = useNavigate();
  const { peerId } = useParams();
  const socketRef = useRef(null);
  const activePeerRef = useRef("");
  const [userId, setUserId] = useState("");
  const [activePeerId, setActivePeerId] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherId, setOtherId] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("chatterpit_id");
    const key = localStorage.getItem("chatterpit_key");

    if (!id || !key) {
      const accountRoute = peerId
        ? `/Account?peer=${encodeURIComponent(peerId)}`
        : "/Account";
      navigate(accountRoute);
      return;
    }

    setUserId(id);
  }, [navigate, peerId]);

  useEffect(() => {
    activePeerRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    if (!userId) return undefined;

    const socket = io(getSocketUrl());
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      setErrorMessage("");
      socket.emit("user:online", { userId });

      if (peerId && peerId !== userId) {
        socket.emit("chat:join", { userId, peerId });
      }
    });

    socket.on("disconnect", () => {
      setConnectionStatus("offline");
    });

    socket.on("connect_error", () => {
      setConnectionStatus("offline");
      setErrorMessage("Realtime server is not reachable.");
    });

    socket.on("chat:joined", ({ peerId: joinedPeerId, messages: history }) => {
      activePeerRef.current = joinedPeerId;
      setActivePeerId(joinedPeerId);
      setMessages(history || []);
      setErrorMessage("");
      setIsNewChatOpen(false);
    });

    socket.on("chat:invite", ({ from }) => {
      if (!from || from === userId || activePeerRef.current) return;

      activePeerRef.current = from;
      setActivePeerId(from);
      socket.emit("chat:join", { userId, peerId: from });
    });

    socket.on("chat:message", (message) => {
      const relatedPeer =
        message.sender === userId ? message.peerId : message.sender;

      if (!activePeerRef.current) {
        activePeerRef.current = relatedPeer;
        setActivePeerId(relatedPeer);
      }

      if (activePeerRef.current !== relatedPeer) return;

      setMessages((currentMessages) => {
        if (currentMessages.some((item) => item.id === message.id)) {
          return currentMessages;
        }

        return [...currentMessages, message];
      });
    });

    socket.on("chat:error", ({ message }) => {
      setErrorMessage(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [peerId, userId]);

  useEffect(() => {
    if (!userId || !peerId || peerId === userId) return;

    activePeerRef.current = peerId;
    setActivePeerId(peerId);
    socketRef.current?.emit("chat:join", { userId, peerId });
  }, [peerId, userId]);

  const handleSend = (text) => {
    if (!text.trim() || !activePeerId) return;

    socketRef.current?.emit("chat:message", {
      userId,
      peerId: activePeerId,
      text,
    });
  };

  const startNewChat = () => {
    const trimmedId = otherId.trim();
    if (!trimmedId) return;

    if (trimmedId === userId) {
      setErrorMessage("Enter a friend's Chatter Pit ID, not your own.");
      return;
    }

    setOtherId("");
    navigate(`/u/${encodeURIComponent(trimmedId)}`);
  };

  const statusLabel =
    connectionStatus === "connected" ? "Realtime online" : "Realtime offline";

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative">
      <header className="flex items-center justify-between bg-neutral-900 p-4 border-b border-neutral-800">
        <div>
          <h1 className="text-lg font-semibold">Chats</h1>
          <p className="text-xs text-neutral-400">My ID: {userId}</p>
          <p className="text-xs text-neutral-500">
            {activePeerId ? `Chatting with ${activePeerId}` : statusLabel}
          </p>
        </div>
        <button
          onClick={() => navigate("/Account")}
          className="p-2 rounded-full hover:bg-neutral-800"
          aria-label="Open account details"
          title="Account details"
        >
          <MoreVertical size={20} />
        </button>
      </header>

      {errorMessage && (
        <p className="border-b border-red-900/70 bg-red-950/50 px-4 py-2 text-sm text-red-200">
          {errorMessage}
        </p>
      )}

      <main className="flex-1 overflow-hidden">
        {!activePeerId ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
              <MessageCircle size={34} />
            </div>
            <p className="text-center text-sm">
              No chats yet <br /> Start a conversation!
            </p>
          </div>
        ) : (
          <MainContainer>
            <ChatContainer>
              <MessageList>
                {messages.map((msg) => (
                  <Message
                    key={msg.id}
                    model={{
                      message: msg.text,
                      sentTime: msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "now",
                      sender: msg.sender === userId ? "me" : msg.sender,
                      direction:
                        msg.sender === userId ? "outgoing" : "incoming",
                      position: "single",
                    }}
                  />
                ))}
              </MessageList>

              <MessageInput
                placeholder={
                  connectionStatus === "connected"
                    ? "Type a message..."
                    : "Start the realtime server to send messages..."
                }
                attachButton={false}
                disabled={connectionStatus !== "connected"}
                onSend={handleSend}
              />
            </ChatContainer>
          </MainContainer>
        )}
      </main>

      <Dialog.Root open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <Dialog.Trigger asChild>
          <button
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg"
            aria-label="Start new chat"
            title="Start new chat"
          >
            <Plus size={24} />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-xl p-6">
            <Dialog.Title className="text-lg font-bold mb-2">
              Start New Chat
            </Dialog.Title>
            <p className="text-neutral-400 mb-4 text-sm">
              Enter your friend's ID or scan their QR code to start chatting.
            </p>

            <input
              type="text"
              value={otherId}
              onChange={(event) => setOtherId(event.target.value)}
              placeholder="Enter user ID..."
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm outline-none mb-4"
            />

            <button
              onClick={startNewChat}
              className="w-full rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
            >
              Connect
            </button>

            <Dialog.Close
              className="absolute top-2 right-2 text-neutral-400 hover:text-white"
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default ChatPage;
