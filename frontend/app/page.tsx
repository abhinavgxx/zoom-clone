
"use client";

import { useState, useEffect } from "react";
import {
  Video,
  X,
  Copy,
  Check,
  ArrowRight,
  FileVideo,
  FileText,
  NotebookPen,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import MeetingActions from "@/components/MeetingActions";
import UpcomingMeetings from "@/components/UpcomingMeetings";
import RecentMeetings from "@/components/RecentMeetings";

import { Meeting, BackendMeeting, Participant } from "@/components/types";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

type ModalType = "new" | "join" | "schedule" | null;

export default function Home() {
  const [modal, setModal] = useState<ModalType>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [meetingId, setMeetingId] = useState("");
  const [displayName, setDisplayName] = useState("Abhinav Mishra");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [duration, setDuration] = useState("30");

  const [createdMeeting, setCreatedMeeting] =
    useState<Meeting | null>(null);

  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  const formatMeeting = (meeting: BackendMeeting): Meeting => {
  const scheduledDate = meeting.scheduled_at
    ? new Date(meeting.scheduled_at)
    : new Date(meeting.created_at);

  return {
    id: meeting.meeting_code,
    title: meeting.title,
    date: scheduledDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    time: scheduledDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: meeting.duration,
    participants: 1,
    status:
      meeting.status === "completed"
        ? "Completed"
        : meeting.status === "live"
          ? "Live"
          : "Upcoming",
  };
};

  const closeModal = () => {
    setModal(null);
    setMessage("");
    setCreatedMeeting(null);
    setCopied(false);
  };

  const generateMeetingId = () => {
    const digits = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString();

    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  // Create an instant meeting
const handleNewMeeting = async () => {
  try {
    setMessage("");

    const newMeeting = await apiRequest<BackendMeeting>("/meetings", {
      method: "POST",
      body: JSON.stringify({
        title: "Instant Meeting",
        description: "Instant meeting",
        host_name: displayName.trim() || "Abhinav Mishra",
        scheduled_at: null,
        duration: 30,
      }),
    });

    const formattedMeeting = formatMeeting(newMeeting);

    setCreatedMeeting(formattedMeeting);
    setModal("new");
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Could not create meeting"
    );
  }
};


const handleJoinCreatedMeeting = async () => {
  if (!createdMeeting) return;

  try {
    const participants = await apiRequest<Participant[]>(
      `/meetings/${createdMeeting.id}/participants`
    );

    const host = participants.find(
      (participant) => participant.is_host === 1
    );

    if (!host) {
      setMessage("Could not find the meeting host.");
      return;
    }

    router.push(
      `/meetings/${createdMeeting.id}?name=${encodeURIComponent(
        host.display_name
      )}&participantId=${host.id}`
    );
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to enter the meeting."
    );
  }
};

  // Join an existing meeting
  const handleJoinMeeting = () => {
    setMeetingId("");
    setMessage("");
    setModal("join");
  };

  // Schedule a meeting
  const handleScheduleMeeting = () => {
    setTitle("");
    setDescription("");
    setScheduleDate("");
    setScheduleTime("");
    setDuration("30");
    setMessage("");
    setModal("schedule");
  };


const handleJoinSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();
  setMessage("");

  const normalizedId = meetingId.replace(/\s/g, "");

  if (!displayName.trim()) {
    setMessage("Please enter your display name.");
    return;
  }

  try {
    // Verify that the meeting exists
    await apiRequest<BackendMeeting>(
      `/meetings/${normalizedId}`
    );

    // Register this participant
    const participant = await apiRequest<Participant>(
  `/meetings/${normalizedId}/join`,
  {
    method: "POST",
    body: JSON.stringify({
      display_name: displayName.trim(),
    }),
  }
);

// Pass participant ID to the meeting room
router.push(
  `/meetings/${normalizedId}?name=${encodeURIComponent(
    displayName.trim()
  )}&participantId=${participant.id}`
);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to join meeting."
    );
  }
};


  useEffect(() => {
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setApiError("");

      const data = await apiRequest<BackendMeeting[]>("/meetings");

      const formatted = data.map(formatMeeting);

      setUpcoming(
        formatted.filter((meeting) => meeting.status === "Upcoming")
      );

      setRecent(
        formatted.filter((meeting) => meeting.status === "Completed")
      );
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Unable to load meetings"
      );
    } finally {
      setLoading(false);
    }
  };

  fetchMeetings();
}, []);


const handleScheduleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();
  setMessage("");

  const scheduledDate = new Date(`${scheduleDate}T${scheduleTime}`);

  if (scheduledDate <= new Date()) {
    setMessage("Please select a future date and time.");
    return;
  }

  if (!title.trim()) {
    setMessage("Please enter a meeting title.");
    return;
  }

  try {
    const newMeeting = await apiRequest<BackendMeeting>("/meetings", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        host_name: displayName.trim() || "Abhinav Mishra",
        scheduled_at: scheduledDate.toISOString(),
        duration: Number(duration),
      }),
    });

    const formattedMeeting = formatMeeting(newMeeting);

    setUpcoming((previous) => [formattedMeeting, ...previous]);
    setCreatedMeeting(formattedMeeting);
    setMessage("Your meeting has been scheduled successfully!");
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Could not schedule meeting."
    );
  }
};


  const inviteLink = createdMeeting
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/meetings/${createdMeeting.id.replace(/\s/g, "")}`
    : "";

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
    } catch {
      setMessage("Unable to copy automatically. Please copy the link manually.");
    }
  };

  const router = useRouter();

  return (
    <div className="zoom-app-layout">

      <Sidebar />

      <main className="zoom-main-content">
        <Navbar />

        <div className="zoom-dashboard-content">

          {/* Welcome section */}
          {/* Dashboard hero */}
          <section className="zoom-dashboard-hero">
            <div className="zoom-hero-greeting">
              <span className="zoom-date-label">
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <h1>Hello, Abhinav 👋</h1>
              <p>Connect, collaborate and get things done.</p>
            </div>

            <div className="zoom-live-clock">
              <span>{now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
              <small>Local time</small>
            </div>
          </section>

          {/* Meeting actions */}
          <section className="zoom-start-section">
            <div className="zoom-start-heading">
              <h2>Get started</h2>
              <p>Start a meeting or connect to an existing one.</p>
            </div>

            <MeetingActions
              onNewMeeting={handleNewMeeting}
              onJoinMeeting={handleJoinMeeting}
              onScheduleMeeting={handleScheduleMeeting}
            />
          </section>

          {/* Quick links */}
          <section className="zoom-quick-links">
            <div className="zoom-quick-link">
              <div className="zoom-quick-icon">
                <FileVideo size={21} />
              </div>
              <div>
                <strong>Recordings</strong>
                <span>View your recordings</span>
              </div>
            </div>

            <div className="zoom-quick-link">
              <div className="zoom-quick-icon">
                <FileText size={21} />
              </div>
              <div>
                <strong>Summaries</strong>
                <span>Meeting summaries</span>
              </div>
            </div>

            <div className="zoom-quick-link">
              <div className="zoom-quick-icon">
                <NotebookPen size={21} />
              </div>
              <div>
                <strong>My Notes</strong>
                <span>Your personal notes</span>
              </div>
            </div>
          </section>

          {loading ? (
            <p>Loading meetings...</p>
          ) : (
            <>
              {apiError && <p className="form-message">{apiError}</p>}

          <UpcomingMeetings meetings={upcoming} />

          <RecentMeetings meetings={recent} />
          </>
          )}

          <footer className="dashboard-footer">
            © 2026 Zoom Clone. Built for collaboration.
          </footer>

        </div>
      </main>

      {/* Modal overlay */}
      {modal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal-card">

            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">ZOOM MEETINGS</span>
                <h2>
                  {modal === "new" && "Your meeting is ready"}
                  {modal === "join" && "Join a meeting"}
                  {modal === "schedule" &&
                    (createdMeeting ? "Meeting scheduled" : "Schedule a meeting")}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* New meeting modal */}
            {modal === "new" && createdMeeting && (
              <div className="modal-body">
                <div className="success-icon">
                  <Video size={27} />
                </div>

                <p className="modal-description">
                  Share the meeting link with anyone you want to invite.
                </p>

                <div className="meeting-info-box">
                  <span>MEETING ID</span>
                  <strong>{createdMeeting.id}</strong>
                </div>

                <div className="meeting-info-box">
                  <span>INVITE LINK</span>
                  <strong className="invite-link">{inviteLink}</strong>
                </div>

                <button
                  className="primary-button full-button"
                  onClick={copyInviteLink}
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  {copied ? "Copied!" : "Copy invite link"}
                </button>

                <button
                  className="primary-button full-button"
                  onClick={handleJoinCreatedMeeting}
                >
                  <Video size={17} />
                  Join Meeting Now
                </button>

              </div>
            )}

            {/* Join meeting modal */}
            {modal === "join" && (
              <form className="modal-body" onSubmit={handleJoinSubmit}>
                <p className="modal-description">
                  Enter the meeting ID and your display name to continue.
                </p>

                <label className="form-label">Meeting ID</label>
                <input
                  className="form-input"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="Enter meeting ID"
                  required
                />

                <label className="form-label">Your name</label>
                <input
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />

                {message && (
                  <div className="form-message">{message}</div>
                )}

                <button className="primary-button full-button" type="submit">
                  Join meeting <ArrowRight size={17} />
                </button>
              </form>
            )}

            {/* Schedule meeting modal */}
            {modal === "schedule" && (
              <div className="modal-body">

                {!createdMeeting ? (
                  <form onSubmit={handleScheduleSubmit}>
                    <p className="modal-description">
                      Plan your next meeting and invite your team.
                    </p>

                    <label className="form-label">Meeting title</label>
                    <input
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Weekly Team Sync"
                      required
                    />

                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input form-textarea"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this meeting about?"
                    />

                    <div className="form-row">
                      <div>
                        <label className="form-label">Date</label>
                        <input
                          className="form-input"
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toLocaleDateString("en-CA")}
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">Time</label>
                        <input
                          className="form-input"
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <label className="form-label">Duration</label>
                    <select
                      className="form-input"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>

                    {message && (
                      <div className="form-message">{message}</div>
                    )}

                    <button
                      className="primary-button full-button"
                      type="submit"
                    >
                      Schedule meeting <ArrowRight size={17} />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="success-icon">
                      <Check size={27} />
                    </div>

                    <p className="modal-description">
                      Your meeting has been added to upcoming meetings.
                    </p>

                    <div className="meeting-info-box">
                      <span>MEETING TITLE</span>
                      <strong>{createdMeeting.title}</strong>
                    </div>

                    <div className="meeting-info-box">
                      <span>MEETING ID</span>
                      <strong>{createdMeeting.id}</strong>
                    </div>

                    <button
                      className="primary-button full-button"
                      onClick={closeModal}
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}