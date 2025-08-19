import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

function ChatPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
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

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: "me", text: input },
      { sender: "other", text: "Got it: " + input }, // demo reply
    ]);
    setInput("");
  };

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
      <main className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
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
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-xl max-w-xs text-sm ${
                  msg.sender === "me"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-neutral-800 text-neutral-200 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Typing area (only if chat exists) */}
      {messages.length > 0 && (
        <footer className="p-3 border-t border-neutral-800 bg-neutral-900 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm outline-none"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
          >
            Send
          </button>
        </footer>
      )}

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






