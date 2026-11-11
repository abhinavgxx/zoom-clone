# Zoom Clone – Video Conferencing Platform

A full-stack, Zoom-inspired meeting management and collaboration platform built using **Next.js, FastAPI, SQLAlchemy, and PostgreSQL**. The application supports instant and scheduled meetings, participant management, persistent chat, and real-time communication through WebSockets.

**Live Application:** https://zoom-clone-delta-two.vercel.app/

**Backend API:** https://zoom-clone-backend-nhpn.onrender.com/

**API Documentation:** https://zoom-clone-backend-nhpn.onrender.com/docs

---

## Features

### 1. Dashboard
- Zoom-like dashboard with a responsive layout.
- Create instant meetings, join existing meetings, and schedule meetings.
- View upcoming meetings and meeting information.
- Live clock and personalized dashboard greeting.

### 2. Meeting Management
- Create instant meetings with automatically generated unique meeting codes.
- Generate shareable meeting links.
- Schedule meetings with a title, description, date, time, and duration.
- Join meetings using a meeting code or invitation link.
- Enter a display name before joining.
- Validate meeting existence and meeting status.

### 3. Participant Management
- Track participants joining and leaving meetings.
- Display participant information in the meeting room.
- Support host-specific meeting controls.
- Allow hosts to terminate meetings.
- Notify connected participants when a meeting ends.

### 4. Real-Time Chat
- Persistent meeting chat using PostgreSQL.
- Instant message broadcasting using WebSockets.
- Retrieve previous messages when reopening a meeting.
- Real-time participant join and leave notifications.

### 5. Meeting Room Interface
- Dark, Zoom-inspired meeting interface.
- Participant tiles and meeting controls.
- Dedicated participants and chat panels.
- Camera and microphone toggle interface.
- Leave meeting and end meeting controls.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL (Neon), SQLite for local development |
| ORM | SQLAlchemy |
| API Communication | REST APIs |
| Real-Time Communication | WebSockets |
| Authentication / Session Handling | Participant and host identifiers |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Neon |

---

## System Architecture

The application follows a client-server architecture.

```text
              Next.js Frontend
                     |
              REST API / WebSocket
                     |
                FastAPI Backend
                     |
                  SQLAlchemy
                     |
              PostgreSQL (Neon)
```

### Frontend
The Next.js application provides the dashboard, meeting room, participant interface, and chat interface. It communicates with the backend through REST APIs and WebSocket connections.

### Backend
FastAPI handles meeting creation, scheduling, participant management, message persistence, and meeting lifecycle operations.

### Database
SQLAlchemy provides the ORM layer between the backend and database.

SQLite is used as the default database during local development, while PostgreSQL (Neon) is used for production deployment.

---

## Database Design

The application uses three primary database tables:

### Meetings
Stores meeting information, including meeting identifiers, meeting codes, titles, descriptions, host information, scheduling details, and meeting status.

### Participants
Stores participant information associated with meetings, including display names, host status, and participation timestamps.

### Messages
Stores chat messages associated with meetings, including message content, sender information, and timestamps.

### Relationships

```text
Meetings
   |
   | 1:N
   |
   +---------- Participants

   |
   | 1:N
   |
   +---------- Messages
```

A meeting can have multiple participants and multiple messages. Participants and messages are associated with their respective meetings.

---

## Project Structure

```text
zoom-clone/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   ├── connection_manager.py
│   ├── migrate_db.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── meetings/
│   │       └── [meetingId]/
│   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── MeetingActions.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── UpcomingMeetings.tsx
│   │   ├── RecentMeetings.tsx
│   │   └── types.ts
│   │
│   ├── lib/
│   │   └── api.ts
│   │
│   ├── package.json
│   └── .gitignore
│
└── README.md
```

---

## Local Installation and Setup

### Prerequisites

- Node.js and npm
- Python 3.10 or later
- Git

### 1. Clone the repository

```bash
git clone https://github.com/abhinavgxx/zoom-clone.git
cd zoom-clone
```

### 2. Set up the backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

**Windows:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///./zoom_clone.db
FRONTEND_URL=http://localhost:3000
```

The backend defaults to SQLite when `DATABASE_URL` is not configured. PostgreSQL can be used by supplying a PostgreSQL connection URL.

Start the backend:

```bash
python -m uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Set up the frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file inside the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the Next.js development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLAlchemy database connection URL |
| `FRONTEND_URL` | Allowed deployed frontend origin for CORS |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend |

The frontend derives its WebSocket URL from the API URL, using `ws://` locally and `wss://` in production.

**Important:** Never commit `.env` or `.env.local` files containing credentials.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health message |
| GET | `/health` | Health check |
| POST | `/meetings` | Create a meeting |
| GET | `/meetings` | Retrieve meetings |
| GET | `/meetings/{meeting_code}` | Retrieve a meeting |
| POST | `/meetings/{meeting_code}/join` | Join a meeting |
| GET | `/meetings/{meeting_code}/participants` | Retrieve participants |
| POST | `/meetings/{meeting_code}/leave/{participant_id}` | Leave a meeting |
| DELETE | `/meetings/{meeting_code}` | Delete a meeting |
| POST | `/meetings/{meeting_code}/messages` | Send a message |
| GET | `/meetings/{meeting_code}/messages` | Retrieve chat history |
| POST | `/meetings/{meeting_code}/end` | End a meeting |

### WebSocket

```text
/ws/{meeting_code}/{participant_id}
```

The WebSocket connection supports real-time chat broadcasting and participant join/leave notifications.

---

## Deployment

The application is deployed using three services:

| Component | Hosting Provider |
|---|---|
| Next.js Frontend | Vercel |
| FastAPI Backend | Render |
| PostgreSQL Database | Neon |

**Production URLs:**

- Frontend: https://zoom-clone-delta-two.vercel.app/
- Backend: https://zoom-clone-backend-nhpn.onrender.com/
- API Documentation: https://zoom-clone-backend-nhpn.onrender.com/docs

The backend uses environment variables for database configuration and frontend CORS settings.

---

## Current Limitations

- Actual video and audio streaming using WebRTC has not been implemented. Participant tiles currently use UI placeholders.
- Camera and microphone controls currently represent interface state rather than actual media-device access.
- User account authentication and persistent user profiles are not implemented.
- Participant and host identifiers are used for meeting operations rather than a full authentication system.

---

## Author

**Abhinav Mishra**

GitHub: https://github.com/abhinavgxx

---

*Built as an SDE Fullstack Assignment - Zoom-like Video Conferencing Platform.*