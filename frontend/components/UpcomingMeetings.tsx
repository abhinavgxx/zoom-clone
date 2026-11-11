
"use client";

import {
  CalendarDays,
  Clock3,
  Users,
  ArrowUpRight,
  Video,
} from "lucide-react";

import { Meeting } from "./types";

interface Props {
  meetings: Meeting[];
}

export default function UpcomingMeetings({ meetings }: Props) {
  return (
    <section className="zoom-upcoming-section">

      <div className="zoom-section-heading">
        <div>
          <h2>Upcoming meetings</h2>
          <p>Your scheduled meetings</p>
        </div>

        <button className="zoom-view-all">
          View all <ArrowUpRight size={15} />
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="zoom-empty-state">
          <CalendarDays size={30} />
          <strong>No upcoming meetings</strong>
          <span>Meetings you schedule will appear here.</span>
        </div>
      ) : (
        <div className="zoom-meeting-list">
          {meetings.map((meeting) => (
            <div className="zoom-meeting-row" key={meeting.id}>

              <div className="zoom-meeting-date">
                <CalendarDays size={18} />
                <span>{meeting.date}</span>
              </div>

              <div className="zoom-meeting-details">
                <div className="zoom-meeting-title">
                  <Video size={18} />
                  <strong>{meeting.title}</strong>
                </div>

                <div className="zoom-meeting-info">
                  <span>
                    <Clock3 size={14} />
                    {meeting.time}
                  </span>

                  <span>
                    <Users size={14} />
                    {meeting.participants} participants
                  </span>
                </div>
              </div>

              <span className="zoom-meeting-status">
                {meeting.status}
              </span>

            </div>
          ))}
        </div>
      )}

    </section>
  );
}
