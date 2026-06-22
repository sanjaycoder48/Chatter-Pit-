import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState("");
  const [passKey, setPassKey] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [serverSaved, setServerSaved] = useState(false);

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
    setServerUrl(localStorage.getItem("chatterpit_server") || "");
  }, []);

  if (!userId || !passKey) {
    return <p className="text-center mt-6">Generating your ID...</p>;
  }

  // In the native app window.location.origin is https://localhost, which is
  // useless in a shared link. Prefer a public app URL: a build-time override,
  // else the saved realtime server (which also serves the web app), else origin.
  const publicBase = (
    import.meta.env.VITE_PUBLIC_APP_URL ||
    serverUrl ||
    window.location.origin
  ).replace(/\/+$/, "");
  const userUrl = `${publicBase}/u/${userId}`;
  const pendingPeerId = new URLSearchParams(location.search).get("peer");
  const nextRoute = pendingPeerId
    ? `/u/${encodeURIComponent(pendingPeerId)}`
    : "/ChatPage";

  const saveServer = () => {
    const trimmed = serverUrl.trim().replace(/\/+$/, "");
    if (trimmed) {
      localStorage.setItem("chatterpit_server", trimmed);
    } else {
      localStorage.removeItem("chatterpit_server");
    }
    setServerUrl(trimmed);
    setServerSaved(true);
    setTimeout(() => setServerSaved(false), 2000);
  };

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

          {/* Server URL — lets two distant devices use the same public server */}
          <div className="flex flex-col gap-2 border-t border-neutral-800 pt-4">
            <label
              htmlFor="server-url"
              className="text-sm font-medium text-neutral-300"
            >
              Realtime server URL
            </label>
            <p className="text-xs text-neutral-500">
              Leave blank to use this site's own server. To chat across networks,
              both people enter the same public server URL (deployment or tunnel).
            </p>
            <div className="flex gap-2">
              <input
                id="server-url"
                type="url"
                inputMode="url"
                value={serverUrl}
                onChange={(event) => setServerUrl(event.target.value)}
                placeholder="https://your-server.example.com"
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 text-white text-sm outline-none"
              />
              <button
                onClick={saveServer}
                className="rounded-lg px-4 py-2 bg-neutral-700 hover:bg-neutral-600 transition-colors text-sm font-medium"
              >
                {serverSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={() => navigate(nextRoute)}
            className="mt-2 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium text-white shadow-md"
          >
            Go to Chat
          </button>
        </div>
      </main>
    </div>
  );
}

export default Account;
