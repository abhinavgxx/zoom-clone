
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


# Meeting database model
class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)

    meeting_code = Column(String, unique=True, index=True, nullable=False)

    title = Column(String, nullable=False)

    description = Column(String, nullable=True)

    host_name = Column(String, nullable=False)

    scheduled_at = Column(DateTime, nullable=True)

    duration = Column(Integer, default=30)

    status = Column(String, default="scheduled")

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship with participants
    participants = relationship(
        "Participant",
        back_populates="meeting",
        cascade="all, delete-orphan"
    )


# Participant database model

# Participant database model
class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)

    display_name = Column(String, nullable=False)

    meeting_id = Column(
        Integer,
        ForeignKey("meetings.id"),
        nullable=False
    )

    is_host = Column(Integer, default=0, nullable=False)

    joined_at = Column(DateTime, default=datetime.utcnow)

    left_at = Column(DateTime, nullable=True)

    meeting = relationship(
        "Meeting",
        back_populates="participants"
    )



class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    sender_name = Column(String, nullable=False)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    participant_id = Column(
        Integer,
        ForeignKey("participants.id"),
        nullable=False
    )
    sent_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting")
    participant = relationship("Participant")
