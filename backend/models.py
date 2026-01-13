from pydantic import BaseModel
from datetime import datetime

class PrintJob(BaseModel):
    job_id: str
    pin: str
    pages: str          # "1-3,5"
    copies: int
    expires_at: datetime
    printed: bool = False
