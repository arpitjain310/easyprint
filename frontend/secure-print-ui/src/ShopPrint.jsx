import { useState } from "react";

export default function ShopPrint() {
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState(null);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");

  const fetchJob = async () => {
    const res = await fetch(`http://127.0.0.1:8000/job/${jobId}`);
    if (!res.ok) {
      setMsg("Job not found");
      return;
    }
    setJob(await res.json());
  };

  const print = async () => {
    const res = await fetch(
      `http://127.0.0.1:8000/print/${jobId}?pin=${pin}`,
      { method: "POST" }
    );
    setMsg(await res.text());
  };

  return (
    <div>
      <h2>Shop Print</h2>

      <input
        placeholder="Job ID"
        onChange={e => setJobId(e.target.value)}
      />
      <button onClick={fetchJob}>Fetch Job</button>

      {job && (
        <div>
          <p><b>Pages:</b> {job.pages}</p>
          <p><b>Copies:</b> {job.copies}</p>

          <input
            placeholder="PIN"
            type="password"
            onChange={e => setPin(e.target.value)}
          />

          <button onClick={print}>PRINT</button>
        </div>
      )}

      <p>{msg}</p>
    </div>
  );
}
