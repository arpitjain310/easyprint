import os
import uuid
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

TEMP_DIR = "temp_files"
TTL_MINUTES = 10

os.makedirs(TEMP_DIR, exist_ok=True)


def save_temp_file(file_bytes: bytes):
    job_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    expires_at = datetime.utcnow() + timedelta(minutes=TTL_MINUTES)
    return job_id, file_path, expires_at


def delete_file(path: str):
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except OSError as e:
            logger.warning("Failed to delete %s: %s", path, e)


def cleanup_expired(jobs: dict) -> int:
    """Remove expired jobs and their files. Returns count of cleaned jobs."""
    now = datetime.utcnow()
    expired_ids = [
        job_id for job_id, job in jobs.items() if job["expires_at"] <= now
    ]
    for job_id in expired_ids:
        job = jobs.pop(job_id, None)
        if job:
            delete_file(job.get("path"))
    if expired_ids:
        logger.info("Cleaned up %d expired job(s)", len(expired_ids))
    return len(expired_ids)
