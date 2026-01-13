import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useSearchParams } from "react-router-dom";

export default function ShopPrintCard() {
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [job, setJob] = useState(null);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");

  const [params] = useSearchParams();
  const jobIdFromURL = params.get("job_id");

  // Load job if QR opened via URL
  useEffect(() => {
    if (!jobIdFromURL) return;
    fetchJob(jobIdFromURL);
  }, [jobIdFromURL]);

  useEffect(() => {
  return () => {
    stopScan();
  };
}, []);


  const fetchJob = async (jobId) => {
    const res = await fetch(`http://127.0.0.1:8000/job/${jobId}`);
    if (!res.ok) {
      setMsg("Invalid or expired job");
      return;
    }
    setJob(await res.json());
    setMsg("");
  };

  // Start camera
  const startScan = async () => {
  if (scanning) return;

  setScanning(true);
  codeReader.current = new BrowserMultiFormatReader();

  const devices = await BrowserMultiFormatReader.listVideoInputDevices();
  const deviceId = devices[0]?.deviceId;

  codeReader.current.decodeFromVideoDevice(
    deviceId,
    videoRef.current,
    (result, err) => {
      if (result) {
        stopScan();
        const url = new URL(result.getText());
        const jobId = url.searchParams.get("job_id");
        if (jobId) fetchJob(jobId);
      }
    }
  );
};


  const stopScan = () => {
  try {
    // 1. Stop ZXing decoding
    codeReader.current?.reset();

    // 2. Stop camera stream manually
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  } catch (e) {
    console.error("Error stopping camera:", e);
  }

  // 3. Update UI state
  setScanning(false);
};

  const print = async () => {
    const res = await fetch(
      `http://127.0.0.1:8000/print/${job.job_id}?pin=${pin}`,
      { method: "POST" }
    );
    setMsg(await res.text());
  };

  return (
    <div className="card">
      <h1>Print Console</h1>

      {!job && !scanning && (
        <>
          <button onClick={startScan}>Scan QR</button>
          <p className="muted">or scan QR from customer phone</p>
        </>
      )}

      {scanning && (
        <>
          <video ref={videoRef} style={{ width: "100%" }} />
          <button className="secondary" onClick={stopScan}>
            Cancel Scan
          </button>
        </>
      )}

      {job && (
        <>
          <div className="info-box">
            <p><b>Pages:</b> {job.pages}</p>
            <p><b>Copies:</b> {job.copies}</p>
          </div>

          <input
            placeholder="Enter PIN"
            type="password"
            onChange={e => setPin(e.target.value)}
          />

          <button onClick={print}>PRINT</button>
        </>
      )}

      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}
