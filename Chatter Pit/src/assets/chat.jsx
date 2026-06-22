import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  MoreVertical,
  Phone,
  PhoneOff,
  Plus,
  Video,
  VideoOff,
  WifiOff,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";

import { compressImage, getIceServers, getSocketUrl } from "./media.js";
import { isNative } from "../native.js";

const RING_TIMEOUT_MS = 35000;

function formatDuration(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function ChatPage() {
  const navigate = useNavigate();
  const { peerId } = useParams();
  const socketRef = useRef(null);
  const activePeerRef = useRef("");
  const fileInputRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const [userId, setUserId] = useState("");
  const [activePeerId, setActivePeerId] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherId, setOtherId] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [sendingImage, setSendingImage] = useState(false);
  const [viewerImage, setViewerImage] = useState("");

  // ---- Call state ----------------------------------------------------------
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callPeerRef = useRef("");
  const callStatusRef = useRef("idle");
  const incomingCallRef = useRef(null);
  const ringTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // idle | calling | ringing | connecting | connected
  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState("audio");
  const [callPeer, setCallPeer] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const flashNotice = useCallback((message) => {
    setNotice(message);
    clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(""), 4000);
  }, []);

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

  // Keep the <video> elements bound to their streams across re-renders.
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callStatus, callType]);

  // Call duration ticker.
  useEffect(() => {
    if (callStatus !== "connected") {
      setCallSeconds(0);
      return undefined;
    }
    const interval = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const clearRingTimer = () => {
    clearTimeout(ringTimerRef.current);
    ringTimerRef.current = null;
  };

  // ---- WebRTC helpers ------------------------------------------------------
  const resetCall = useCallback((notifyPeer) => {
    clearRingTimer();

    if (notifyPeer && callPeerRef.current) {
      socketRef.current?.emit("call:end", {
        to: callPeerRef.current,
        from: socketRef.current?.userId,
      });
    }

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    callPeerRef.current = "";

    setCallStatus("idle");
    setCallPeer("");
    setIncomingCall(null);
    setMicOn(true);
    setCamOn(true);
  }, []);

  const flushCandidates = async () => {
    const pc = pcRef.current;
    if (!pc) return;

    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // A failed candidate is non-fatal; ICE keeps trying others.
      }
    }
  };

  const createPeerConnection = (remotePeerId, selfId) => {
    const pc = new RTCPeerConnection({ iceServers: getIceServers() });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("call:candidate", {
          to: remotePeerId,
          from: selfId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        clearRingTimer();
        setCallStatus("connected");
      } else if (["failed", "disconnected", "closed"].includes(state)) {
        if (pcRef.current === pc) {
          if (state === "failed") {
            flashNotice("Call connection lost.");
          }
          resetCall(false);
        }
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const getLocalMedia = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const startCall = async (type) => {
    const peer = activePeerRef.current;
    if (!peer || callStatusRef.current !== "idle") return;
    if (connectionStatus !== "connected") {
      flashNotice("You're offline. Reconnect to start a call.");
      return;
    }

    setErrorMessage("");
    setCallType(type);
    setCallPeer(peer);
    callPeerRef.current = peer;
    setCallStatus("calling");

    try {
      const stream = await getLocalMedia(type);
      const pc = createPeerConnection(peer, userId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("call:offer", {
        to: peer,
        from: userId,
        callType: type,
        sdp: offer,
      });

      // Give up if the other side never picks up.
      clearRingTimer();
      ringTimerRef.current = setTimeout(() => {
        if (callStatusRef.current === "calling") {
          flashNotice("No answer.");
          resetCall(true);
        }
      }, RING_TIMEOUT_MS);
    } catch {
      setErrorMessage(
        "Camera/microphone permission is needed. Enable it in your device settings and try again.",
      );
      resetCall(false);
    }
  };

  const acceptCall = async () => {
    const invite = incomingCallRef.current;
    if (!invite) return;

    const { from, callType: type, sdp } = invite;
    clearRingTimer();
    setErrorMessage("");
    setCallType(type);
    setCallPeer(from);
    callPeerRef.current = from;
    setCallStatus("connecting");
    setIncomingCall(null);

    try {
      const stream = await getLocalMedia(type);
      const pc = createPeerConnection(from, userId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("call:answer", {
        to: from,
        from: userId,
        sdp: answer,
      });
    } catch {
      setErrorMessage(
        "Camera/microphone permission is needed. Enable it in your device settings and try again.",
      );
      socketRef.current?.emit("call:reject", { to: from, from: userId });
      resetCall(false);
    }
  };

  const rejectCall = () => {
    clearRingTimer();
    const invite = incomingCallRef.current;
    if (invite) {
      socketRef.current?.emit("call:reject", { to: invite.from, from: userId });
    }
    setIncomingCall(null);
    setCallStatus("idle");
  };

  const hangUp = useCallback(() => resetCall(true), [resetCall]);

  const toggleMic = () => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicOn((value) => !value);
  };

  const toggleCam = () => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    tracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCamOn((value) => !value);
  };

  // ---- Socket + signaling --------------------------------------------------
  useEffect(() => {
    if (!userId) return undefined;

    const socket = io(getSocketUrl(), {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    });
    socket.userId = userId;
    socketRef.current = socket;

    const rejoinActive = () => {
      socket.emit("user:online", { userId });
      const active = activePeerRef.current;
      if (active && active !== userId) {
        socket.emit("chat:join", { userId, peerId: active });
      } else if (peerId && peerId !== userId) {
        socket.emit("chat:join", { userId, peerId });
      }
    };

    socket.on("connect", () => {
      setConnectionStatus("connected");
      setErrorMessage("");
      rejoinActive();
    });

    socket.io.on("reconnect_attempt", () => setConnectionStatus("connecting"));
    socket.on("disconnect", () => setConnectionStatus("offline"));
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

    socket.on("chat:error", ({ message }) => setErrorMessage(message));

    // ---- Call signaling ----------------------------------------------------
    socket.on("call:offer", ({ from, callType: type, sdp }) => {
      if (pcRef.current || callPeerRef.current) {
        socket.emit("call:reject", { to: from, from: userId });
        return;
      }
      setIncomingCall({ from, callType: type, sdp });
      setCallStatus("ringing");

      clearRingTimer();
      ringTimerRef.current = setTimeout(() => {
        if (callStatusRef.current === "ringing") {
          socket.emit("call:reject", { to: from, from: userId });
          flashNotice(`Missed call from ${from}.`);
          setIncomingCall(null);
          setCallStatus("idle");
        }
      }, RING_TIMEOUT_MS);
    });

    socket.on("call:answer", async ({ sdp }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        clearRingTimer();
        setCallStatus("connecting");
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushCandidates();
      } catch {
        setErrorMessage("Could not establish the call connection.");
        resetCall(true);
      }
    });

    socket.on("call:candidate", async ({ candidate }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // ICE negotiation continues with other candidates.
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    socket.on("call:reject", () => {
      flashNotice("Call was declined.");
      resetCall(false);
    });

    socket.on("call:end", () => {
      // If we were still being rung, the caller hung up first: missed call.
      if (callStatusRef.current === "ringing") {
        const from = incomingCallRef.current?.from;
        flashNotice(from ? `Missed call from ${from}.` : "Missed call.");
      }
      resetCall(false);
    });

    socket.on("call:unavailable", () => {
      flashNotice("That user is offline right now.");
      resetCall(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, userId]);

  // ---- Device network + app lifecycle (Capacitor + browser) ----------------
  const [deviceOnline, setDeviceOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => {
      setDeviceOnline(true);
      // Network is back: nudge the socket to reconnect immediately.
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };
    const goOffline = () => setDeviceOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    let removeNetwork;
    let removeResume;
    if (isNative) {
      import("@capacitor/network").then(({ Network }) => {
        Network.addListener("networkStatusChange", (status) => {
          setDeviceOnline(status.connected);
          if (status.connected) goOnline();
        }).then((handle) => {
          removeNetwork = () => handle.remove();
        });
      });

      import("@capacitor/app").then(({ App }) => {
        App.addListener("appStateChange", ({ isActive }) => {
          // Returning to the foreground: ensure the socket is live again.
          if (isActive && socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }).then((handle) => {
          removeResume = () => handle.remove();
        });
      });
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      removeNetwork?.();
      removeResume?.();
    };
  }, []);

  // ---- Android hardware back button ----------------------------------------
  useEffect(() => {
    if (!isNative) return undefined;

    let remove;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", ({ canGoBack }) => {
        if (callStatusRef.current === "calling" || callStatusRef.current === "connecting" || callStatusRef.current === "connected") {
          hangUp();
        } else if (incomingCallRef.current) {
          rejectCall();
        } else if (viewerImage) {
          setViewerImage("");
        } else if (isNewChatOpen) {
          setIsNewChatOpen(false);
        } else if (canGoBack && window.history.length > 1) {
          navigate(-1);
        } else {
          App.exitApp();
        }
      }).then((handle) => {
        remove = () => handle.remove();
      });
    });

    return () => remove?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerImage, isNewChatOpen, navigate, hangUp]);

  // Tear down any active call when the page unmounts.
  useEffect(() => {
    return () => {
      clearTimeout(noticeTimerRef.current);
      clearRingTimer();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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

  const handleImagePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activePeerId) return;

    setSendingImage(true);
    try {
      const image = await compressImage(file);
      socketRef.current?.emit("chat:message", {
        userId,
        peerId: activePeerId,
        image,
      });
    } catch (error) {
      setErrorMessage(error.message || "Could not send that image.");
    } finally {
      setSendingImage(false);
    }
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

  const statusLabel = {
    connected: "Realtime online",
    connecting: "Reconnecting…",
    offline: "Realtime offline",
  }[connectionStatus];

  const callsEnabled =
    Boolean(activePeerId) &&
    connectionStatus === "connected" &&
    callStatus === "idle";

  const showCallOverlay =
    callStatus === "calling" ||
    callStatus === "connecting" ||
    callStatus === "connected";

  const callStatusText = {
    calling: "Calling…",
    connecting: "Connecting…",
    connected: formatDuration(callSeconds),
  }[callStatus];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative">
      <header className="flex items-center justify-between bg-neutral-900 p-4 border-b border-neutral-800">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">Chats</h1>
          <p className="text-xs text-neutral-400 truncate">My ID: {userId}</p>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            {connectionStatus !== "connected" && (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <WifiOff size={12} /> {statusLabel}
              </span>
            )}
            {connectionStatus === "connected" &&
              (activePeerId ? `Chatting with ${activePeerId}` : statusLabel)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startCall("audio")}
            disabled={!callsEnabled}
            className="p-2 rounded-full hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Start voice call"
            title="Voice call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => startCall("video")}
            disabled={!callsEnabled}
            className="p-2 rounded-full hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Start video call"
            title="Video call"
          >
            <Video size={20} />
          </button>
          <button
            onClick={() => navigate("/Account")}
            className="p-2 rounded-full hover:bg-neutral-800"
            aria-label="Open account details"
            title="Account details"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {!deviceOnline && (
        <p className="flex items-center justify-center gap-2 border-b border-amber-900/60 bg-amber-950/40 px-4 py-2 text-sm text-amber-200">
          <WifiOff size={14} /> No internet connection
        </p>
      )}

      {errorMessage && (
        <p className="border-b border-red-900/70 bg-red-950/50 px-4 py-2 text-sm text-red-200">
          {errorMessage}
        </p>
      )}

      {notice && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-800/95 px-4 py-2 text-sm text-neutral-100 shadow-lg">
          {notice}
        </div>
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
                {messages.map((msg) => {
                  const direction =
                    msg.sender === userId ? "outgoing" : "incoming";
                  const sentTime = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "now";

                  if (msg.image) {
                    return (
                      <Message
                        key={msg.id}
                        model={{
                          direction,
                          position: "single",
                          sentTime,
                          sender: msg.sender === userId ? "me" : msg.sender,
                          type: "custom",
                        }}
                      >
                        <Message.CustomContent>
                          <img
                            src={msg.image}
                            alt="Shared attachment"
                            style={{
                              maxWidth: "220px",
                              maxHeight: "260px",
                              borderRadius: "10px",
                              display: "block",
                              cursor: "pointer",
                            }}
                            onClick={() => setViewerImage(msg.image)}
                          />
                        </Message.CustomContent>
                      </Message>
                    );
                  }

                  return (
                    <Message
                      key={msg.id}
                      model={{
                        message: msg.text,
                        sentTime,
                        sender: msg.sender === userId ? "me" : msg.sender,
                        direction,
                        position: "single",
                      }}
                    />
                  );
                })}
              </MessageList>

              <MessageInput
                placeholder={
                  connectionStatus === "connected"
                    ? "Type a message..."
                    : "Reconnecting to send messages..."
                }
                attachButton
                onAttachClick={() => fileInputRef.current?.click()}
                sendDisabled={connectionStatus !== "connected"}
                disabled={connectionStatus !== "connected"}
                onSend={handleSend}
              />
            </ChatContainer>
          </MainContainer>
        )}
      </main>

      {sendingImage && (
        <div className="absolute bottom-20 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full bg-neutral-800 px-4 py-2 text-sm text-neutral-200 shadow-lg">
          <Loader2 size={16} className="animate-spin" /> Sending image…
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />

      {/* Full-screen image viewer (works inside the Android WebView) */}
      {viewerImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setViewerImage("")}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close image"
            onClick={() => setViewerImage("")}
          >
            <X size={22} />
          </button>
          <img
            src={viewerImage}
            alt="Shared attachment"
            className="max-h-[90vh] max-w-[95vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {/* Incoming call screen */}
      {callStatus === "ringing" && incomingCall && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-neutral-950 py-16">
          <div className="flex flex-col items-center">
            <p className="text-sm uppercase tracking-widest text-neutral-400">
              Incoming {incomingCall.callType} call
            </p>
            <div className="mt-8 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-800">
              {incomingCall.callType === "video" ? (
                <Video size={48} />
              ) : (
                <Phone size={48} />
              )}
            </div>
            <p className="mt-6 text-2xl font-semibold">{incomingCall.from}</p>
            <p className="mt-1 text-sm text-neutral-500">Chatter Pit</p>
          </div>

          <div className="flex w-full items-center justify-around px-10">
            <button
              onClick={rejectCall}
              className="flex flex-col items-center gap-2"
              aria-label="Decline call"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 hover:bg-red-500">
                <PhoneOff size={26} />
              </span>
              <span className="text-xs text-neutral-400">Decline</span>
            </button>
            <button
              onClick={acceptCall}
              className="flex flex-col items-center gap-2"
              aria-label="Accept call"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 hover:bg-green-500">
                <Phone size={26} />
              </span>
              <span className="text-xs text-neutral-400">Accept</span>
            </button>
          </div>
        </div>
      )}

      {/* Active call overlay */}
      {showCallOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
          <div className="relative flex-1 overflow-hidden bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full object-cover ${
                callType === "video" && callStatus === "connected"
                  ? ""
                  : "hidden"
              }`}
            />

            {(callType !== "video" || callStatus !== "connected") && (
              <div className="flex h-full flex-col items-center justify-center text-neutral-300">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-800">
                  {callType === "video" ? (
                    <Video size={40} />
                  ) : (
                    <Phone size={40} />
                  )}
                </div>
                <p className="text-lg font-semibold">{callPeer}</p>
                {callStatus !== "connected" && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
                    <Loader2 size={14} className="animate-spin" />
                    {callStatusText}
                  </p>
                )}
              </div>
            )}

            <p className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1 text-sm text-neutral-200">
              {callStatus === "connected"
                ? `${callType === "video" ? "Video" : "Voice"} · ${callStatusText}`
                : callStatusText}
            </p>

            {callType === "video" && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-28 right-4 h-40 w-28 rounded-xl border border-neutral-700 object-cover"
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-6 bg-neutral-900 py-6">
            <button
              onClick={toggleMic}
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                micOn ? "bg-neutral-700 hover:bg-neutral-600" : "bg-red-600"
              }`}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
              title={micOn ? "Mute" : "Unmute"}
            >
              {micOn ? <Mic size={22} /> : <MicOff size={22} />}
            </button>

            {callType === "video" && (
              <button
                onClick={toggleCam}
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  camOn ? "bg-neutral-700 hover:bg-neutral-600" : "bg-red-600"
                }`}
                aria-label={camOn ? "Turn camera off" : "Turn camera on"}
                title={camOn ? "Camera off" : "Camera on"}
              >
                {camOn ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
            )}

            <button
              onClick={hangUp}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 hover:bg-red-500"
              aria-label="End call"
              title="End call"
            >
              <PhoneOff size={26} />
            </button>
          </div>
        </div>
      )}

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
