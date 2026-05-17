import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { QRCodeCanvas } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Upload as UploadIcon,
  X,
  Loader2,
  Copy,
  Check,
  Clock,
  RotateCcw,
} from "lucide-react";
import { API_BASE, APP_BASE } from "../lib/api";

export default function UserUploadCard() {
  const [params] = useSearchParams();
  const shopSession = params.get("shop_session");

  const [file, setFile] = useState(null);
  const [pages, setPages] = useState("all");
  const [copies, setCopies] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((accepted) => {
    setError("");
    const pdf = accepted.find((f) => f.type === "application/pdf");
    if (!pdf) {
      setError("Please choose a PDF file.");
      return;
    }
    setFile(pdf);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const qs = new URLSearchParams({ pages: pages || "all", copies: String(copies) });
      if (shopSession) qs.append("shop_session", shopSession);

      const res = await fetch(`${API_BASE}/upload?${qs.toString()}`, {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail || "Upload failed");
      setResult(body);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPages("all");
    setCopies(1);
    setResult(null);
    setError("");
  };

  const copyPin = async () => {
    if (!result?.pin) return;
    await navigator.clipboard.writeText(result.pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Upload your PDF</h1>
              <p className="text-sm text-slate-600 mt-1">
                We'll generate a QR code and a 6-digit PIN to share with the shop.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`rounded-xl border-2 border-dashed transition cursor-pointer p-8 text-center ${
                isDragActive
                  ? "border-blue-500 bg-blue-50/70"
                  : file
                  ? "border-emerald-400 bg-emerald-50/40"
                  : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <FilePreview file={file} onClear={(e) => { e.stopPropagation(); setFile(null); }} />
              ) : (
                <div className="flex flex-col items-center text-slate-600">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <UploadIcon size={22} />
                  </div>
                  <p className="font-semibold text-slate-800">
                    {isDragActive ? "Drop it here" : "Drag your PDF or click to browse"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF only &middot; one file at a time</p>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <Field label="Pages">
                <input
                  type="text"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="all  or  1-3,5"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </Field>
              <Field label="Copies">
                <Stepper value={copies} onChange={setCopies} min={1} max={50} />
              </Field>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={upload}
              disabled={!file || uploading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 transition shadow-md shadow-blue-600/20"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>Generate QR &amp; PIN</>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 mb-4">
              <Check size={14} /> Ready to print
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Show this to the shop</h2>
            <p className="text-sm text-slate-600 mt-1">
              They scan the QR, you share the PIN.
            </p>

            <div className="mt-6 inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-slate-200">
              <QRCodeCanvas
                size={232}
                value={`${APP_BASE}/shop?job_id=${result.job_id}`}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Your PIN
              </div>
              <button
                onClick={copyPin}
                className="mt-1.5 inline-flex items-center gap-3 rounded-xl bg-slate-900 text-white px-5 py-3 font-mono text-3xl tracking-[0.5em] hover:bg-slate-800 transition group"
              >
                {result.pin}
                {copied ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} className="opacity-60 group-hover:opacity-100" />
                )}
              </button>
              <div className="text-xs text-slate-500 mt-2">Tap to copy</div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Clock size={16} />
              <ExpiryCountdown expiresAt={result.expires_at} />
            </div>

            <button
              onClick={reset}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              <RotateCcw size={14} /> Upload another file
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stepper({ value, onChange, min = 1, max = 99 }) {
  const dec = () => onChange(Math.max(min, Number(value) - 1));
  const inc = () => onChange(Math.min(max, Number(value) + 1));
  return (
    <div className="flex items-stretch rounded-lg border border-slate-300 bg-white overflow-hidden">
      <button
        type="button"
        onClick={dec}
        className="px-3 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        disabled={value <= min}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="w-full text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        className="px-3 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

function FilePreview({ file, onClear }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="h-11 w-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
        <FileText size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-slate-900">{file.name}</div>
        <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ExpiryCountdown({ expiresAt }) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  if (remaining === 0) return <span className="text-red-600">Expired</span>;
  return (
    <span>
      Expires in <span className="font-mono font-semibold text-slate-800">{m}:{String(s).padStart(2, "0")}</span>
    </span>
  );
}
