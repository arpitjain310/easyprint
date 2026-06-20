# EasyPrint

A secure PDF print-job submission system. Users upload PDFs and receive a QR code + PIN; shop staff scan the QR code, verify the PIN, and trigger the print. Jobs expire after 10 minutes.

I built it around one constraint: a customer should be able to print at a shop without handing over their file by email, USB, or a logged-in account — just a QR code and a PIN that dies in ten minutes.


### Tech Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Backend  | Python 3.11, FastAPI, Uvicorn             |
| Frontend | React 19, React Router, Vite              |
| QR       | qrcode.react (generate), ZXing (scan)     |
| Print    | CUPS (`lp`) / Windows, with stub fallback |

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

## Design notes & limitations

These are prototype boundaries I chose on purpose:

- **In-memory job store.** Jobs and shop sessions live in process memory, so a restart clears them and it runs as a single instance. A persistent store (Redis / a database) is the next step for multi-instance use.
- **Short-lived, single-use PINs.** A 6-digit PIN (drawn from `secrets`) paired with a 10-minute expiry and one-shot printing limits the exposure window. Per-job attempt throttling is the obvious next hardening step.
- **Printing adapts to its environment.** The backend uses CUPS (`lp`) where available, falls back to the Windows print verb, and otherwise logs a stub — so the full flow is demoable without a physical printer.

