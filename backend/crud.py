
from sqlalchemy.orm import Session
from datetime import datetime
import secrets

import models
import schemas


# Generate a unique 10-digit meeting code
def generate_meeting_code(db: Session):
    while True:
        code = str(secrets.randbelow(9000000000) + 1000000000)

        existing = db.query(models.Meeting).filter(
            models.Meeting.meeting_code == code
        ).first()

        if not existing:
            return code


# CREATE: Create a new meeting
def create_meeting(db: Session, meeting: schemas.MeetingCreate):

    meeting_code = generate_meeting_code(db)

    db_meeting = models.Meeting(
        meeting_code=meeting_code,
        title=meeting.title,
        description=meeting.description,
        host_name=meeting.host_name,
        scheduled_at=meeting.scheduled_at,
        duration=meeting.duration,
        status="live" if meeting.scheduled_at is None else "scheduled"
    )

    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)

    # Automatically add the host as a participant
    host = models.Participant(
        display_name=meeting.host_name,
        meeting_id=db_meeting.id,
        is_host=1
    )

    db.add(host)
    db.commit()

    return db_meeting


# READ: Retrieve all meetings
def get_meetings(db: Session):
    return db.query(models.Meeting).order_by(
        models.Meeting.created_at.desc()
    ).all()


# READ: Retrieve a meeting using its meeting code
def get_meeting_by_code(db: Session, meeting_code: str):
    return db.query(models.Meeting).filter(
        models.Meeting.meeting_code == meeting_code
    ).first()


# READ: Retrieve a meeting using its internal database ID
def get_meeting_by_id(db: Session, meeting_id: int):
    return db.query(models.Meeting).filter(
        models.Meeting.id == meeting_id
    ).first()


# CREATE: Add a participant to a meeting
def add_participant(
    db: Session,
    meeting_id: int,
    participant: schemas.ParticipantCreate
):

    db_participant = models.Participant(
        display_name=participant.display_name,
        meeting_id=meeting_id
    )

    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)

    return db_participant


# READ: Retrieve all participants in a meeting
def get_participants(db: Session, meeting_id: int):
    return db.query(models.Participant).filter(
        models.Participant.meeting_id == meeting_id,
        models.Participant.left_at.is_(None)
    ).all()


def leave_meeting(db: Session, participant_id: int, meeting_id: int):
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id,
        models.Participant.meeting_id == meeting_id
    ).first()

    if not participant:
        return None

    # Avoid modifying an already inactive participant.
    if participant.left_at is not None:
        return participant

    now = datetime.utcnow()

    if participant.is_host == 1:
        # A host leaving automatically ends the meeting.
        meeting = db.query(models.Meeting).filter(
            models.Meeting.id == participant.meeting_id
        ).first()

        if meeting:
            meeting.status = "completed"

            # Mark every active participant as having left.
            db.query(models.Participant).filter(
                models.Participant.meeting_id == meeting.id,
                models.Participant.left_at.is_(None)
            ).update(
                {"left_at": now},
                synchronize_session=False
            )
    else:
        # Regular participants only leave themselves.
        participant.left_at = now

    db.commit()
    db.refresh(participant)

    return participant


# UPDATE: Update meeting status
def update_meeting_status(
    db: Session,
    meeting_code: str,
    status: str
):

    meeting = get_meeting_by_code(db, meeting_code)

    if meeting:
        meeting.status = status
        db.commit()
        db.refresh(meeting)

    return meeting


# DELETE: Delete a meeting
def delete_meeting(db: Session, meeting_code: str):

    meeting = get_meeting_by_code(db, meeting_code)

    if meeting:
        db.delete(meeting)
        db.commit()

    return meeting


def create_message(
    db: Session,
    meeting_id: int,
    message: schemas.MessageCreate
):
    participant = db.query(models.Participant).filter(
        models.Participant.id == message.participant_id,
        models.Participant.meeting_id == meeting_id,
        models.Participant.left_at.is_(None)
    ).first()

    if not participant:
        return None

    db_message = models.Message(
        content=message.content,
        sender_name=participant.display_name,
        meeting_id=meeting_id,
        participant_id=participant.id
    )

    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    return db_message


def get_messages(db: Session, meeting_id: int):
    return db.query(models.Message).filter(
        models.Message.meeting_id == meeting_id
    ).order_by(models.Message.sent_at.asc()).all()


def end_meeting(db: Session, meeting_code: str, participant_id: int):
    meeting = get_meeting_by_code(db, meeting_code)

    if not meeting:
        return None

    host = db.query(models.Participant).filter(
        models.Participant.id == participant_id,
        models.Participant.meeting_id == meeting.id,
        models.Participant.is_host == 1,
        models.Participant.left_at.is_(None)
    ).first()

    if not host:
        return False

    now = datetime.utcnow()

    meeting.status = "completed"

    # Mark all active participants as having left.
    db.query(models.Participant).filter(
        models.Participant.meeting_id == meeting.id,
        models.Participant.left_at.is_(None)
    ).update(
        {"left_at": now},
        synchronize_session=False
    )

    db.commit()
    db.refresh(meeting)

    return meeting
