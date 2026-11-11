
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Participant, BackendMeeting } from "@/components/types";

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

interface ChatMessage {
  id: number;
  content: string;
  sender_name: string;
  meeting_id: number;
  participant_id: number;
  sent_at: string;
}

export default function MeetingRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const meetingId = params.meetingId as string;
  const displayName = searchParams.get("name") || "Guest";
  const participantId = Number(searchParams.get("participantId"));

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantError, setParticipantError] = useState("");

  const currentParticipant = participants.find(
    (participant) => participant.id === participantId
  );

const isHost = currentParticipant?.is_host === 1;

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState("");

  const fetchMessages = useCallback(async () => {
  try {
    const data = await apiRequest<ChatMessage[]>(
      `/meetings/${meetingId}/messages`
    );

    setMessages(data);
    setChatError("");
  } catch (error) {
    setChatError(
      error instanceof Error ? error.message : "Unable to load messages"
    );
  }
}, [meetingId]);

useEffect(() => {
  fetchMessages();
}, [fetchMessages]);

  const fetchParticipants = useCallback(async () => {
  try {
    const data = await apiRequest<Participant[]>(
      `/meetings/${meetingId}/participants`
    );

    setParticipants(data);
    setParticipantError("");
  } catch (error) {
    setParticipantError(
      error instanceof Error
        ? error.message
        : "Unable to load participants"
    );
  } finally {
    setParticipantsLoading(false);
  }
}, [meetingId]);

useEffect(() => {
  fetchParticipants();

  const interval = setInterval(fetchParticipants, 5000);

  return () => clearInterval(interval);
}, [fetchParticipants]);


useEffect(() => {
  if (!participantId || Number.isNaN(participantId)) {
    return;
  }

  const WS_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ||
    "ws://127.0.0.1:8000";

  const socket = new WebSocket(
    `${WS_BASE_URL}/ws/${meetingId}/${participantId}`
  );

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(
  "WebSocket event received at:",
  new Date().toISOString(),
  data.type
);
      if (data.type === "chat_message") {
        const incomingMessage: ChatMessage = data.message;

        setMessages((previous) => {
          // Prevent duplicate messages.
          if (previous.some((message) => message.id === incomingMessage.id)) {
            return previous;
          }

          return [...previous, incomingMessage];
        });
      }

      
      if (data.type === "participant_joined") {
        fetchParticipants();
      }

      if (data.type === "participant_left") {
        setParticipants((previous) =>
          previous.filter(
            (participant) => participant.id !== data.participant_id
          )
        );
      }

      if (data.type === "meeting_ended") {
        alert("The host has ended this meeting.");
        router.replace("/");
      }

    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  };

  socket.onerror = () => {
    console.warn("WebSocket connection encountered an error.");
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  return () => {
    socket.close();
  };
}, [meetingId, participantId, fetchParticipants]);


// Check whether the host has ended the meeting
useEffect(() => {
  let meetingEnded = false;

  const checkMeetingStatus = async () => {
    try {
      const meeting = await apiRequest<BackendMeeting>(
        `/meetings/${meetingId}`
      );

      if (meeting.status === "completed" && !meetingEnded) {
        meetingEnded = true;
        alert("The host has ended this meeting.");
        router.replace("/");
      }
    } catch (error) {
      console.error("Unable to check meeting status:", error);
    }
  };

  checkMeetingStatus();

  const interval = setInterval(checkMeetingStatus, 3000);

  return () => clearInterval(interval);
}, [meetingId, router]);

  const copyMeetingId = async () => {
    try {
      await navigator.clipboard.writeText(meetingId);
      setCopied(true);
    } catch {
      alert("Unable to copy meeting ID.");
    }
  };


const sendMessage = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  console.log("SEND MESSAGE FUNCTION CALLED");
  console.log("Message:", chatMessage);
  console.log("Participant ID:", participantId);
  console.log("Meeting ID:", meetingId);

  const content = chatMessage.trim();

  if (!content) return;

  try {
    const result = await apiRequest<ChatMessage>(
      `/meetings/${meetingId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content,
          participant_id: participantId,
        }),
      }
    );
    console.log("MESSAGE API RESPONSE:", result);
    setMessages((previous) => {
      if (previous.some((message) => message.id === result.id)) {
        return previous;
      }

      return [...previous, result];
    });
    setChatMessage("");
    setChatError("");
  } catch (error) {
    console.error("MESSAGE API ERROR:", error);
    setChatError(
      error instanceof Error
        ? error.message
        : "Unable to send message"
    );
  }
};


const leaveMeeting = async () => {
  try {
    if (!participantId || Number.isNaN(participantId)) {
      throw new Error("Invalid participant ID");
    }

    await apiRequest(
      `/meetings/${meetingId}/leave/${participantId}`,
      {
        method: "POST",
      }
    );

    router.push("/");
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Unable to leave meeting"
    );
  }
};

const endMeeting = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to end this meeting for everyone?"
  );

  if (!confirmed) return;

  try {
    await apiRequest(
      `/meetings/${meetingId}/end?participant_id=${participantId}`,
      {
        method: "POST",
      }
    );

    router.push("/");
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Unable to end meeting"
    );
  }
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
      {/* Main meeting area */}
      <div className="room-main">

        <div className="room-content">

          <section className="video-area">

        
          
          <div className="video-grid">
            {participants.map((participant) => {
              const isCurrentUser = participant.id === participantId;

              return (
                <div
                  className={`video-tile ${isCurrentUser ? "self-tile" : ""}`}
                  key={participant.id}
                >
                  <div className={`video-avatar participant-${participant.id % 4}`}>
                    {participant.display_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="tile-footer">
                    <span>
                      {participant.display_name}
                      {isCurrentUser ? " (You)" : ""}
                    </span>
                    <VideoOff size={14} />
                  </div>
                </div>
              );
            })}
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

                

{participantsLoading && <p>Loading participants...</p>}

{participantError && (
  <p className="form-message">{participantError}</p>
)}

{participants.map((participant) => (
  <div className="participant-item" key={participant.id}>
    <div className={`participant-avatar participant-${participant.id % 4}`}>
      {participant.display_name.charAt(0).toUpperCase()}
    </div>

    <div className="participant-name">
      <strong>
        {participant.display_name}
        {participant.id === participantId && " (You)"}
      </strong>

      <small>
        {participant.id === participantId ? "You" : "Participant"}
      </small>
    </div>

    {participant.id === participantId && (
      <span className="host-label">YOU</span>
    )}
  </div>
))}

              </div>
            )}

            {showChat && (
              <div className="chat-container">

                <div className="chat-messages">
                  {chatError && <p className="form-message">{chatError}</p>}

                  {messages.map((message) => (
                  <div className="chat-message" key={message.id}>
                    <strong>
                      {message.sender_name}
                      {message.participant_id === participantId && " (You)"}
                    </strong>
                    <p>{message.content}</p>
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
      {/* Meeting toolbar */}
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

            {isHost && (
              <button
                className="leave-button"
                onClick={endMeeting}
              >
                <X size={19} />
                <span>End Meeting</span>
              </button>
            )}
      </div>

    </div>
    </main>
  );
}
