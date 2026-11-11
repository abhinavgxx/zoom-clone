
"use client";

import {
  Video,
  Plus,
  CalendarDays,
} from "lucide-react";

interface MeetingActionsProps {
  onNewMeeting: () => void;
  onJoinMeeting: () => void;
  onScheduleMeeting: () => void;
}

export default function MeetingActions({
  onNewMeeting,
  onJoinMeeting,
  onScheduleMeeting,
}: MeetingActionsProps) {
  return (
    <div className="zoom-meeting-actions">

      <button
        className="zoom-meeting-action"
        onClick={onNewMeeting}
      >
        <div className="zoom-action-icon blue">
          <Video size={27} />
        </div>
        <span>New Meeting</span>
      </button>

      <button
        className="zoom-meeting-action"
        onClick={onJoinMeeting}
      >
        <div className="zoom-action-icon orange">
          <Plus size={27} />
        </div>
        <span>Join</span>
      </button>

      <button
        className="zoom-meeting-action"
        onClick={onScheduleMeeting}
      >
        <div className="zoom-action-icon purple">
          <CalendarDays size={27} />
        </div>
        <span>Schedule</span>
      </button>

    </div>
  );
}
