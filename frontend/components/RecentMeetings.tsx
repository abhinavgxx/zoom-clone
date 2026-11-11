
"use client";

import {
  Video,
  ArrowUpRight,
  Clock3,
} from "lucide-react";

import { Meeting } from "./types";

interface Props {
  meetings: Meeting[];
}

export default function RecentMeetings({ meetings }: Props) {
  return (
    <section className="content-section">

      <div className="section-heading">
        <div>
          <h2>Recent meetings</h2>
          <p>Pick up where you left off.</p>
        </div>

        <button className="text-button">
          View history <ArrowUpRight size={15} />
        </button>
      </div>

      <div className="recent-table">

        <div className="recent-table-header">
          <span>MEETING</span>
          <span>DATE</span>
          <span>DURATION</span>
          <span>STATUS</span>
        </div>

        {meetings.length === 0 ? (
          <div className="recent-empty">
            No recent meetings yet.
          </div>
        ) : (
          meetings.map((meeting) => (
            <div className="recent-row" key={meeting.id}>

              <div className="recent-meeting-name">
                <div className="recent-icon">
                  <Video size={17} />
                </div>

                <div>
                  <strong>{meeting.title}</strong>
                  <small>ID: {meeting.id}</small>
                </div>
              </div>

              <span className="recent-date">
                {meeting.date}
              </span>

              <span className="recent-duration">
                <Clock3 size={14} />
                {meeting.duration} min
              </span>

              <span className="completed-badge">
                {meeting.status}
              </span>

            </div>
          ))
        )}

      </div>
    </section>
  );
}