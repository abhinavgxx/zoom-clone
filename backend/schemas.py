
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


# Schema for creating a meeting
class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    host_name: str
    scheduled_at: Optional[datetime] = None
    duration: int = 30


# Schema for returning meeting information
class MeetingResponse(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: Optional[str]
    host_name: str
    scheduled_at: Optional[datetime]
    duration: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Schema for joining a meeting
class ParticipantCreate(BaseModel):
    display_name: str


# Schema for returning participant information

class ParticipantResponse(BaseModel):
    id: int
    display_name: str
    meeting_id: int
    is_host: int
    joined_at: datetime
    left_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)



class MessageCreate(BaseModel):
    content: str
    participant_id: int


class MessageResponse(BaseModel):
    id: int
    content: str
    sender_name: str
    meeting_id: int
    participant_id: int
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)
