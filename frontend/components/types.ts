
// Format used by the existing dashboard components
export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  status: string;
}

// Format returned by the FastAPI backend
export interface BackendMeeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  host_name: string;
  scheduled_at: string | null;
  duration: number;
  status: string;
  created_at: string;
}

export interface Participant {
  id: number;
  display_name: string;
  meeting_id: number;
  is_host: number;
  joined_at: string;
  left_at: string | null;
}
