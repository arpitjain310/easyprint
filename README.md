# Smart Print

A secure PDF print-job submission system. Users upload PDFs and receive a QR code + PIN; shop staff scan the QR code, verify the PIN, and trigger the print. Jobs expire after 10 minutes.


### Tech Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Backend  | Python 3.11, FastAPI, Uvicorn             |
| Frontend | React 19, React Router, Vite              |
| QR       | qrcode.react (generate), ZXing (scan)     |
| Print    | Placeholder (ready for CUPS / lp)         |

## User Flows

**Customer (User page → `/user`)**
1. Upload a PDF, choose pages and copies.
2. Receive a QR code containing the `job_id` and a 6-digit PIN.
3. Share the QR code with the print shop.

**Shop Staff (Shop page → `/shop`)**
1. Scan the customer's QR code with the device camera.
2. See job details (pages, copies, expiry).
3. Enter the PIN to authorise and trigger the print.

## API Endpoints

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| POST   | `/upload`                   | Upload PDF, returns job_id+PIN |
| GET    | `/job/{job_id}`             | Get job details                |
| POST   | `/print/{job_id}?pin=`      | Authorise and print            |
| POST   | `/shop/session`             | Create a shop session          |
| GET    | `/shop/session/{session_id}`| Poll session for a job         |

---

## Running with Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

Stop everything:

```bash
docker compose down
```

---

## Running Locally (without Docker)

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend/secure-print-ui
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

