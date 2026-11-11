
"use client";

import {
  Search,
  Bell,
  ChevronDown,
  Video,
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="zoom-navbar">
      <div className="zoom-navbar-brand">
        <Video size={27} strokeWidth={2.5} />
        <span className="zoom-logo-text">zoom</span>
        <span className="zoom-brand-divider"></span>
        <span className="zoom-workplace-text">Workplace</span>
      </div>

      <div className="zoom-navbar-links">
        <button>
          Discover products
          <ChevronDown size={15} />
        </button>
        <button>Pricing</button>
      </div>

      <div className="zoom-navbar-right">
        <div className="zoom-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search (Ctrl+K)"
          />
        </div>

        <button className="zoom-navbar-link">
          Admin Center
        </button>

        <button className="zoom-download-button">
          Download
        </button>

        <button className="zoom-upgrade-button">
          Upgrade
        </button>

        <button className="zoom-notification-button">
          <Bell size={19} />
        </button>

        <div className="zoom-user-avatar">A</div>
      </div>
    </header>
  );
}
