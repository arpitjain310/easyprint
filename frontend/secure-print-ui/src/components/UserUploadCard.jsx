import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function UserUploadCard() {
  const [params] = useSearchParams();
  const shopSession = params.get("shop_session");

  const [file, setFile] = useState(null);
  const [pages, setPages] = useState("all");
  const [copies, setCopies] = useState(1);
  const [result, setResult] = useState(null);

  const upload = async () => {
    const form = new FormData();
    form.append("file", file);
    form.append("pages", pages);
    form.append("copies", copies);
    if (shopSession) form.append("shop_session", shopSession);

    const res = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: form
    });

    setResult(await res.json());
  };

  return (
    <div className="card">
      <h1>Secure Print</h1>

      <input type="file" accept="application/pdf"
        onChange={e => setFile(e.target.files[0])} />

      <input
        placeholder="Pages (1-3,5 or all)"
        value={pages}
        onChange={e => setPages(e.target.value)}
      />

      <input
        type="number"
        min="1"
        value={copies}
        onChange={e => setCopies(e.target.value)}
      />

      <button onClick={upload}>Upload</button>

      {result && (
      <div className="info-box">
        <p><b>PIN:</b> {result.pin}</p>

        <p className="muted">
          Show this QR to the shop owner
        </p>

        <QRCodeCanvas
          size={200}
          value={`http://localhost:5173/shop?job_id=${result.job_id}`}
        />
      </div>
    )}
    </div>
  );
}
