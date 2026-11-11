
"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MessageSquare,
  Users,
  PhoneOff,
  Settings,
  MoreHorizontal,
  Copy,
  Check,
  X,
  Send,
} from "lucide-react";

export default function MeetingRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const meetingId = params.meetingId as string;
  const displayName = searchParams.get("name") || "Guest";

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "System",
      text: "Welcome to the meeting!",
    },
  ]);

  const participants = [
    displayName,
    "Sarah Johnson",
    "Rahul Sharma",
  ];

  const copyMeetingId = async () => {
    try {
      await navigator.clipboard.writeText(meetingId);
      setCopied(true);
    } catch {
      alert("Unable to copy meeting ID.");
    }
  };

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!chatMessage.trim()) return;

    setMessages((previous) => [
      ...previous,
      {
        sender: displayName,
        text: chatMessage.trim(),
      },
    ]);

    setChatMessage("");
  };

  const leaveMeeting = () => {
    router.push("/");
  };

  return (
    <main className="meeting-room">

      {/* Top bar */}
      <header className="room-header">

        <div className="room-brand">
          <Video size={25} />
          <strong>zoom</strong>
        </div>

        <div className="room-info">
          <strong>Meeting Room</strong>
          <span>ID: {meetingId}</span>
          <button onClick={copyMeetingId} className="copy-id">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy ID"}
          </button>
        </div>

        <div className="room-header-right">
          <span className="recording-indicator">
            <span /> LIVE
          </span>
          <button
            className="room-icon-button"
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={19} />
          </button>
        </div>

      </header>

      {/* Main meeting area */}
      <div className="room-main">

        <section className="video-area">

          <div className="video-grid">

            {/* Current user */}
            <div className="video-tile self-tile">
              <div className="video-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="tile-name">
                {displayName} (You)
              </div>

              {!cameraOn && (
                <div className="camera-off-label">
                  <VideoOff size={14} />
                  Camera off
                </div>
              )}
            </div>

            {/* Simulated participants */}
            {participants.slice(1).map((name, index) => (
              <div className="video-tile" key={name}>
                <div className={`video-avatar participant-${index}`}>
                  {name.charAt(0)}
                </div>

                <div className="tile-name">{name}</div>
                <div className="camera-off-label">
                  <VideoOff size={14} />
                  Camera off
                </div>
              </div>
            ))}

          </div>

          <div className="meeting-toolbar">

            <button
              className={`toolbar-button ${micOn ? "control-active" : ""}`}
              onClick={() => setMicOn(!micOn)}
            >
              {micOn ? <Mic size={21} /> : <MicOff size={21} />}
              <span>{micOn ? "Mute" : "Unmute"}</span>
            </button>

            <button
              className={`toolbar-button ${cameraOn ? "control-active" : ""}`}
              onClick={() => setCameraOn(!cameraOn)}
            >
              {cameraOn ? <Video size={21} /> : <VideoOff size={21} />}
              <span>{cameraOn ? "Stop Video" : "Start Video"}</span>
            </button>

            <button className="toolbar-button">
              <MonitorUp size={21} />
              <span>Share Screen</span>
            </button>

            <button
              className={`toolbar-button ${showParticipants ? "control-active" : ""}`}
              onClick={() => {
                setShowParticipants(!showParticipants);
                setShowChat(false);
              }}
            >
              <Users size={21} />
              <span>Participants</span>
            </button>

            <button
              className={`toolbar-button ${showChat ? "control-active" : ""}`}
              onClick={() => {
                setShowChat(!showChat);
                setShowParticipants(false);
              }}
            >
              <MessageSquare size={21} />
              <span>Chat</span>
            </button>

            <button className="toolbar-button">
              <MoreHorizontal size={21} />
              <span>More</span>
            </button>

            <button
              className="leave-button"
              onClick={leaveMeeting}
            >
              <PhoneOff size={19} />
              <span>Leave</span>
            </button>

          </div>

        </section>

        {/* Side panel */}
        {(showParticipants || showChat) && (
          <aside className="room-panel">

            <div className="panel-header">
              <strong>
                {showParticipants ? "Participants" : "Meeting Chat"}
              </strong>

              <button
                onClick={() => {
                  setShowParticipants(false);
                  setShowChat(false);
                }}
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {showParticipants && (
              <div className="participant-list">

                <div className="participant-count">
                  Participants ({participants.length})
                </div>

                {participants.map((name, index) => (
                  <div className="participant-item" key={name}>
                    <div className="participant-avatar">
                      {name.charAt(0)}
                    </div>

                    <div className="participant-name">
                      <strong>
                        {name}
                        {index === 0 && " (You)"}
                      </strong>
                      <small>
                        {index === 0 ? "Host" : "Participant"}
                      </small>
                    </div>

                    {index === 0 && (
                      <span className="host-label">HOST</span>
                    )}
                  </div>
                ))}

              </div>
            )}

            {showChat && (
              <div className="chat-container">

                <div className="chat-messages">
                  {messages.map((message, index) => (
                    <div className="chat-message" key={index}>
                      <strong>{message.sender}</strong>
                      <p>{message.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendMessage} className="chat-form">
                  <input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                  />

                  <button type="submit" aria-label="Send message">
                    <Send size={17} />
                  </button>
                </form>

              </div>
            )}

          </aside>
        )}

      </div>

    </main>
  );
}
