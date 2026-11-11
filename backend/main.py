
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import crud
from datetime import datetime

from database import engine, get_db, SessionLocal
from connection_manager import manager

# Initialize database tables
models.Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(title="Zoom Clone Backend")


# Allow Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/")
def home():
    return {"message": "Zoom Clone Backend Running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# CREATE: Create a meeting
@app.post("/meetings", response_model=schemas.MeetingResponse)
def create_meeting(
    meeting: schemas.MeetingCreate,
    db: Session = Depends(get_db)
):
    return crud.create_meeting(db, meeting)


# READ: Retrieve all meetings
@app.get("/meetings", response_model=list[schemas.MeetingResponse])
def get_meetings(db: Session = Depends(get_db)):
    return crud.get_meetings(db)


# READ: Retrieve meeting by code
@app.get("/meetings/{meeting_code}", response_model=schemas.MeetingResponse)
def get_meeting(
    meeting_code: str,
    db: Session = Depends(get_db)
):
    meeting = crud.get_meeting_by_code(db, meeting_code)

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    return meeting


# JOIN: Add participant to a meeting
@app.post(
    "/meetings/{meeting_code}/join",
    response_model=schemas.ParticipantResponse
)
def join_meeting(
    meeting_code: str,
    participant: schemas.ParticipantCreate,
    db: Session = Depends(get_db)
):
    meeting = crud.get_meeting_by_code(db, meeting_code)

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    if meeting.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="This meeting has already ended"
        )

    return crud.add_participant(db, meeting.id, participant)


# READ: Get meeting participants
@app.get(
    "/meetings/{meeting_code}/participants",
    response_model=list[schemas.ParticipantResponse]
)
def get_participants(
    meeting_code: str,
    db: Session = Depends(get_db)
):
    meeting = crud.get_meeting_by_code(db, meeting_code)

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    return crud.get_participants(db, meeting.id)


# LEAVE: Mark participant as having left

@app.post(
    "/meetings/{meeting_code}/leave/{participant_id}",
    response_model=schemas.ParticipantResponse
)
async def leave_meeting(
    meeting_code: str,
    participant_id: int,
    db: Session = Depends(get_db)
):
    meeting = crud.get_meeting_by_code(db, meeting_code)

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    participant = crud.leave_meeting(
        db,
        participant_id,
        meeting.id
    )

    if not participant:
        raise HTTPException(
            status_code=404,
            detail="Participant not found in this meeting"
        )

    # Notify everyone connected to this meeting.
    if participant.is_host == 1:
        await manager.broadcast(
            meeting_code,
            {
                "type": "meeting_ended"
            }
        )
    else:
        print(
            f"Broadcasting participant_left: "
            f"{participant.display_name} at {datetime.utcnow()}"
        )
        await manager.broadcast(
            meeting_code,
            {
                "type": "participant_left",
                "participant_id": participant.id,
                "display_name": participant.display_name
            }
        )

    return participant



# DELETE: Delete a meeting
@app.delete("/meetings/{meeting_code}")
def delete_meeting(
    meeting_code: str,
    db: Session = Depends(get_db)
):
    meeting = crud.delete_meeting(db, meeting_code)

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    return {"message": "Meeting deleted successfully"}



@app.post(
    "/meetings/{meeting_code}/messages",
    response_model=schemas.MessageResponse
)
async def send_message(
    meeting_code: str,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    meeting = crud.get_meeting_by_code(db, meeting_code)

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    if meeting.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="This meeting has already ended"
        )

    db_message = crud.create_message(db, meeting.id, message)


    if not db_message:
        raise HTTPException(
            status_code=404,
            detail="Active participant not found"
        )

    # Broadcast the saved message to everyone in the meeting.
    await manager.broadcast(
        meeting_code,
        {
            "type": "chat_message",
            "message": schemas.MessageResponse.model_validate(
                db_message
            ).model_dump(mode="json")
        }
    )

    return db_message


@app.get(
    "/meetings/{meeting_code}/messages",
    response_model=list[schemas.MessageResponse]
)
def get_messages(
    meeting_code: str,
    db: Session = Depends(get_db)
):
    meeting = crud.get_meeting_by_code(db, meeting_code)

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    return crud.get_messages(db, meeting.id)


@app.post("/meetings/{meeting_code}/end")
def end_meeting(
    meeting_code: str,
    participant_id: int,
    db: Session = Depends(get_db)
):
    result = crud.end_meeting(db, meeting_code, participant_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found"
        )

    if result is False:
        raise HTTPException(
            status_code=403,
            detail="Only the active host can end this meeting"
        )

    return {
        "message": "Meeting ended successfully",
        "status": result.status
    }


@app.websocket("/ws/{meeting_code}/{participant_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_code: str,
    participant_id: int
):
    db = SessionLocal()

    try:
        meeting = crud.get_meeting_by_code(db, meeting_code)

        if not meeting or meeting.status == "completed":
            await websocket.close(code=1008)
            return

        participant = db.query(models.Participant).filter(
            models.Participant.id == participant_id,
            models.Participant.meeting_id == meeting.id,
            models.Participant.left_at.is_(None)
        ).first()

        if not participant:
            await websocket.close(code=1008)
            return

        await manager.connect(websocket, meeting_code)

        await manager.broadcast(
            meeting_code,
            {
                "type": "participant_joined",
                "participant_id": participant.id,
                "display_name": participant.display_name
            }
        )

        # Keep the connection alive until the client disconnects.
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass

    finally:
        manager.disconnect(websocket, meeting_code)
        db.close()
