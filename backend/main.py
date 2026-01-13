from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import random
import uuid

from storage import save_temp_file, delete_file
from print_service import print_file

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS = {}
SHOP_SESSIONS = {} 

@app.post("/upload")
async def upload(
    file: UploadFile,
    pages: str = "all",
    copies: int = 1,
    shop_session: str | None = None
):
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF allowed")

    data = await file.read()
    job_id, path, expiry = save_temp_file(data)
    pin = str(random.randint(100000, 999999))

    JOBS[job_id] = {
        "path": path,
        "pin": pin,
        "pages": pages,
        "copies": copies,
        "expires_at": expiry,
        "printed": False
    }

    if shop_session and shop_session in SHOP_SESSIONS:
        SHOP_SESSIONS[shop_session] = job_id

    return {
        "job_id": job_id,
        "pin": pin,
        "pages": pages,
        "copies": copies,
        "expires_at": expiry
    }


@app.post("/print/{job_id}")
def print_job(job_id: str, pin: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404)

    if job["pin"] != pin:
        raise HTTPException(403)

    if job["printed"]:
        raise HTTPException(400)

    print_file(
        job["path"],
        job["pages"],
        job["copies"]
    )

    # secure_delete(job["path"])
    job["printed"] = True

    return {"status": "printed"}


@app.get("/job/{job_id}")
def get_job(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404)

    return {
        "job_id": job_id,
        "pages": job["pages"],
        "copies": job["copies"],
        "expires_at": job["expires_at"]
    }

@app.post("/shop/session")
def create_shop_session():
    session_id = str(uuid.uuid4())
    SHOP_SESSIONS[session_id] = None
    return {"session_id": session_id}

@app.get("/shop/session/{session_id}")
def get_session_job(session_id: str):
    if session_id not in SHOP_SESSIONS:
        raise HTTPException(404)

    job_id = SHOP_SESSIONS[session_id]
    if not job_id:
        return {"status": "waiting"}

    job = JOBS[job_id]
    return {
        "status": "ready",
        "job_id": job_id,
        "pages": job["pages"],
        "copies": job["copies"]
    }
