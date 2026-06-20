import asyncio
import logging
import os
import secrets
import uuid
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from print_service import print_file, PrintError
from storage import cleanup_expired, delete_file, save_temp_file

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("smart_print")

JOBS: dict = {}
SHOP_SESSIONS: dict = {}

CLEANUP_INTERVAL_SECONDS = 60
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]


async def _cleanup_loop():
    while True:
        try:
            cleanup_expired(JOBS)
        except Exception:
            logger.exception("Cleanup loop iteration failed")
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_cleanup_loop())
    logger.info("Started cleanup task (interval=%ds)", CLEANUP_INTERVAL_SECONDS)
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Smart Print", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _get_active_job(job_id: str) -> dict:
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["expires_at"] <= datetime.utcnow():
        delete_file(job.get("path"))
        JOBS.pop(job_id, None)
        raise HTTPException(status_code=410, detail="Job expired")
    return job


@app.post("/upload")
async def upload(
    file: UploadFile,
    pages: str = "all",
    copies: int = 1,
    shop_session: str | None = None,
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    if copies < 1 or copies > 50:
        raise HTTPException(status_code=400, detail="Copies must be between 1 and 50")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    job_id, path, expiry = save_temp_file(data)
    pin = f"{secrets.randbelow(1_000_000):06d}"

    JOBS[job_id] = {
        "path": path,
        "pin": pin,
        "pages": pages,
        "copies": copies,
        "expires_at": expiry,
        "printed": False,
    }

    if shop_session and shop_session in SHOP_SESSIONS:
        SHOP_SESSIONS[shop_session] = job_id

    return {
        "job_id": job_id,
        "pin": pin,
        "pages": pages,
        "copies": copies,
        "expires_at": expiry,
    }


@app.post("/print/{job_id}")
def print_job(job_id: str, pin: str):
    job = _get_active_job(job_id)

    if job["pin"] != pin:
        raise HTTPException(status_code=403, detail="Incorrect PIN")

    if job["printed"]:
        raise HTTPException(status_code=409, detail="Job already printed")

    try:
        print_file(job["path"], job["pages"], job["copies"])
    except PrintError as e:
        logger.error("Print failed for job %s: %s", job_id, e)
        raise HTTPException(status_code=500, detail=f"Print failed: {e}")

    job["printed"] = True
    return {"status": "printed"}


@app.get("/job/{job_id}")
def get_job(job_id: str):
    job = _get_active_job(job_id)
    return {
        "job_id": job_id,
        "pages": job["pages"],
        "copies": job["copies"],
        "expires_at": job["expires_at"],
        "printed": job["printed"],
    }


@app.post("/shop/session")
def create_shop_session():
    session_id = str(uuid.uuid4())
    SHOP_SESSIONS[session_id] = None
    return {"session_id": session_id}


@app.get("/shop/session/{session_id}")
def get_session_job(session_id: str):
    if session_id not in SHOP_SESSIONS:
        raise HTTPException(status_code=404, detail="Shop session not found")

    job_id = SHOP_SESSIONS[session_id]
    if not job_id:
        return {"status": "waiting"}

    job = JOBS.get(job_id)
    if not job or job["expires_at"] <= datetime.utcnow():
        SHOP_SESSIONS[session_id] = None
        return {"status": "waiting"}

    return {
        "status": "ready",
        "job_id": job_id,
        "pages": job["pages"],
        "copies": job["copies"],
    }
