import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

function Account() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [passKey, setPassKey] = useState("");

  useEffect(() => {
    let savedId = localStorage.getItem("chatterpit_id");
    let savedKey = localStorage.getItem("chatterpit_key");

    if (!savedId || !savedKey) {
      savedId = "cp_" + nanoid(6);
      savedKey = nanoid(6);
      localStorage.setItem("chatterpit_id", savedId);
      localStorage.setItem("chatterpit_key", savedKey);
    }

    setUserId(savedId);
    setPassKey(savedKey);
  }, []);

  if (!userId || !passKey) {
    return <p className="text-center mt-6">Generating your ID...</p>;
  }

  const userUrl = `${window.location.origin}/u/${userId}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-center items-center bg-neutral-900 p-4 border-b border-neutral-800">
        <h1 className="text-xl font-bold">Chatter Pit</h1>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-lg flex flex-col gap-5">
          <h2 className="text-lg font-semibold text-center text-neutral-200">
            Your ChatterPit ID
          </h2>

          {/* ID & PassKey */}
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-neutral-400">ID:</span>
              <p className="text-blue-400 break-all">{userId}</p>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-neutral-400">Key:</span>
              <p className="text-green-400 break-all">{passKey}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center bg-white p-3 rounded-lg">
            <QRCode value={userUrl} size={150} />
          </div>

          {/* Share URL */}
          <p className="text-center text-blue-400 text-xs break-all">{userUrl}</p>

          {/* Next Button */}
          <button
            onClick={() => navigate("/ChatPage")}
            className="mt-4 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium text-white shadow-md"
          >
            Go to Chat
          </button>
        </div>
      </main>
    </div>
  );
}

export default Account;


