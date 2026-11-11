
"use client";

import {
  Home,
  MessageSquare,
  CalendarDays,
  Contact,
  MoreHorizontal,
  Settings,
} from "lucide-react";

const navigation = [
  { label: "Home", icon: Home },
  { label: "Chat", icon: MessageSquare },
  { label: "Calendar", icon: CalendarDays },
  { label: "Contacts", icon: Contact },
  { label: "More", icon: MoreHorizontal },
];

export default function Sidebar() {
  return (
    <aside className="zoom-sidebar">
      <nav className="zoom-side-nav">
        {navigation.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`zoom-side-item ${
                index === 0 ? "active" : ""
              }`}
            >
              <Icon size={21} strokeWidth={1.7} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="zoom-sidebar-bottom">
        <button className="zoom-side-item">
          <Settings size={21} strokeWidth={1.7} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
