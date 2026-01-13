import os
import uuid
from datetime import datetime, timedelta

TEMP_DIR = "temp_files"
TTL_MINUTES = 10

os.makedirs(TEMP_DIR, exist_ok=True)

def save_temp_file(file_bytes: bytes):
    job_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    return job_id, file_path, datetime.utcnow() + timedelta(minutes=TTL_MINUTES)

def delete_file(path: str):
    if os.path.exists(path):
        os.remove(path)
