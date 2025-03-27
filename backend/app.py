from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sqlite3
import uuid
from typing import Optional
import aiofiles
from contextlib import contextmanager

app = FastAPI(title="AI Meeting Summarizer")

# CORS Middleware for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
@contextmanager
def get_db():
    db = sqlite3.connect("summaries.db")
    try:
        yield db
    finally:
        db.close()

def init_db():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS summaries (
                id INTEGER PRIMARY KEY, 
                meeting_id TEXT UNIQUE,
                transcript TEXT,
                summary TEXT,
                wordcloud_path TEXT,
                pdf_path TEXT
            )
        """)
        db.commit()

init_db()

# Models
class MeetingRequest(BaseModel):
    meeting_id: Optional[str] = None
    audio_url: Optional[str] = None

# Path configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "../static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Routes
@app.get("/", response_class=HTMLResponse)
async def get_ui():
    try:
        async with aiofiles.open(os.path.join(STATIC_DIR, "index.html"), mode='r') as f:
            html = await f.read()
        return HTMLResponse(content=html)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="UI file not found")

@app.post("/process-meeting", response_model=dict)
async def process_meeting(request: MeetingRequest):
    meeting_id = request.meeting_id or str(uuid.uuid4())
    
    # Mock data - replace with actual processing
    transcript = "Sample transcript about project timelines and deliverables."
    summary = "Team agreed to deliver Phase 1 by next Friday."
    
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute(
            """INSERT OR REPLACE INTO summaries 
            (meeting_id, transcript, summary) 
            VALUES (?, ?, ?)""",
            (meeting_id, transcript, summary)
        )
        db.commit()
    
    return JSONResponse({
        "meeting_id": meeting_id,
        "status": "processed",
        "summary": summary
    })

@app.get("/summary/{meeting_id}", response_model=dict)
async def get_summary(meeting_id: str):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute(
            "SELECT transcript, summary FROM summaries WHERE meeting_id = ?",
            (meeting_id,)
        )
        result = cursor.fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return {
        "meeting_id": meeting_id,
        "transcript": result[0],
        "summary": result[1]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)