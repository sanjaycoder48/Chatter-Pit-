import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

// ChatScope UI Kit
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";

function ChatPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherId, setOtherId] = useState(""); // entered friend's ID

  useEffect(() => {
    const id = localStorage.getItem("chatterpit_id");
    const key = localStorage.getItem("chatterpit_key");

    if (!id || !key) {
      navigate("/Account");
    } else {
      setUserId(id);
    }
  }, [navigate]);

  // send message
  const handleSend = (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: "me", text },
      { sender: "other", text: "Got it: " + text }, // demo reply
    ]);
  };

  // start a new chat
  const startNewChat = () => {
    if (!otherId.trim()) return;
    setMessages([{ sender: "other", text: `Connected with ${otherId} ✅` }]);
    setOtherId("");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative">
      {/* Header */}
      <header className="flex items-center justify-between bg-neutral-900 p-4 border-b border-neutral-800">
        <div>
          <h1 className="text-lg font-semibold">Chats</h1>
          <p className="text-xs text-neutral-400">My ID: {userId}</p>
        </div>
        <button
          onClick={() => navigate("/Account")}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
              💬
            </div>
            <p className="text-center text-sm">
              No chats yet <br /> Start a conversation!
            </p>
          </div>
        ) : (
          <MainContainer>
            <ChatContainer>
              <MessageList>
                {messages.map((msg, index) => (
                  <Message
                    key={index}
                    model={{
                      message: msg.text,
                      sentTime: "just now",
                      sender: msg.sender,
                      direction: msg.sender === "me" ? "outgoing" : "incoming",
                      position: "single",
                    }}
                  />
                ))}
              </MessageList>

              {/* Typing area */}
              <MessageInput
                placeholder="Type a message..."
                attachButton={false}
                onSend={handleSend}
              />
            </ChatContainer>
          </MainContainer>
        )}
      </main>

      {/* Floating Add Button with Dialog */}
      {messages.length === 0 && (
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg">
              ➕
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-xl p-6">
              <Dialog.Title className="text-lg font-bold mb-2">
                Start New Chat
              </Dialog.Title>
              <p className="text-neutral-400 mb-4 text-sm">
                Enter your friend’s ID or scan their QR code to start chatting.
              </p>

              <input
                type="text"
                value={otherId}
                onChange={(e) => setOtherId(e.target.value)}
                placeholder="Enter user ID..."
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm outline-none mb-4"
              />

              <button
                onClick={startNewChat}
                className="w-full rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
              >
                Connect
              </button>

              <Dialog.Close className="absolute top-2 right-2 text-neutral-400 hover:text-white">
                ✖
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

export default ChatPage;







