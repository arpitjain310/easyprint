import { useState } from "react";

export default function UserUpload() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState("all");
  const [copies, setCopies] = useState(1);
  const [result, setResult] = useState(null);

  const upload = async () => {
    if (!file) return alert("Select PDF");

    const form = new FormData();
    form.append("file", file);
    form.append("pages", pages);
    form.append("copies", copies);

    const res = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: form
    });

    setResult(await res.json());
  };

  return (
    <div>
      <h2>User Upload</h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={e => setFile(e.target.files[0])}
      />

      <input
        placeholder="Pages (e.g. 1-3,5 or all)"
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
        <div>
          <p><b>Job ID:</b> {result.job_id}</p>
          <p><b>PIN:</b> {result.pin}</p>
          <p><b>Pages:</b> {result.pages}</p>
          <p><b>Copies:</b> {result.copies}</p>
        </div>
      )}
    </div>
  );
}
