import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ScanLine,
  Camera,
  Printer,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  Copy,
} from "lucide-react";
import { API_BASE, apiFetch } from "../lib/api";

export default function ShopPrintCard() {
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [job, setJob] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [printing, setPrinting] = useState(false);

  const [params] = useSearchParams();
  const jobIdFromURL = params.get("job_id");

  useEffect(() => {
    if (jobIdFromURL) fetchJob(jobIdFromURL);
    return () => stopScan();
  }, [jobIdFromURL]);

  const fetchJob = async (jobId) => {
    setLoadingJob(true);
    setError("");
    try {
      const body = await apiFetch(`/job/${jobId}`);
      setJob(body);
    } catch (e) {
      setError(e.message || "Invalid or expired job");
    } finally {
      setLoadingJob(false);
    }
  };

  const startScan = async () => {
    if (scanning) return;
    setError("");
    setScanning(true);
    try {
      codeReader.current = new BrowserMultiFormatReader();
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const deviceId = devices[0]?.deviceId;
      if (!deviceId) throw new Error("No camera found on this device");

      codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result) => {
          if (!result) return;
          stopScan();
          try {
            const url = new URL(result.getText());
            const jobId = url.searchParams.get("job_id");
            if (jobId) fetchJob(jobId);
            else setError("QR is not a Smart Print code");
          } catch {
            setError("Could not read that QR code");
          }
        }
      );
    } catch (e) {
      setScanning(false);
      setError(e.message || "Could not start camera");
    }
  };

  const stopScan = () => {
    try {
      codeReader.current?.reset();
      const video = videoRef.current;
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    } catch {
      // ignore
    }
    setScanning(false);
  };

  const print = async () => {
    if (!job || pin.length !== 6 || printing) return;
    setPrinting(true);
    setError("");
    try {
      await apiFetch(`/print/${job.job_id}?pin=${encodeURIComponent(pin)}`, {
        method: "POST",
      });
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Could not print");
    } finally {
      setPrinting(false);
    }
  };

  const reset = () => {
    setJob(null);
    setPin("");
    setError("");
    setSuccess(false);
  };

  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 min-h-[520px]">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Printer size={18} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Print Console</h1>
            <p className="text-xs text-slate-500">Scan customer QR &middot; verify PIN &middot; print</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <SuccessState key="success" onReset={reset} />
          ) : scanning ? (
            <ScannerState key="scanner" videoRef={videoRef} onCancel={stopScan} />
          ) : loadingJob ? (
            <LoadingState key="loading" />
          ) : job ? (
            <JobState
              key="job"
              job={job}
              pin={pin}
              setPin={setPin}
              onPrint={print}
              onCancel={reset}
              printing={printing}
              error={error}
            />
          ) : (
            <IdleState key="idle" onScan={startScan} error={error} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IdleState({ onScan, error }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="text-center py-8"
    >
      <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4">
        <ScanLine size={34} className="text-blue-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Ready to scan</h2>
      <p className="text-sm text-slate-600 mt-1">
        Ask the customer to show their Smart Print QR code.
      </p>

      <button
        onClick={onScan}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 transition shadow-md shadow-blue-600/20"
      >
        <Camera size={18} /> Open camera
      </button>

      {error && (
        <p className="mt-5 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg inline-flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </motion.div>
  );
}

function ScannerState({ videoRef, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-2 border-white/80 rounded-2xl" />
          <motion.div
            initial={{ y: "10%" }}
            animate={{ y: "90%" }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="absolute left-8 right-8 h-0.5 bg-blue-400 shadow-[0_0_12px_2px_rgba(59,130,246,0.7)]"
          />
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-slate-600">Centre the QR code in the box</p>
      <button
        onClick={onCancel}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 transition"
      >
        <X size={16} /> Cancel
      </button>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center py-20 text-slate-500"
    >
      <Loader2 size={22} className="animate-spin mr-2" /> Fetching job…
    </motion.div>
  );
}

function JobState({ job, pin, setPin, onPrint, onCancel, printing, error }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
        <div className="h-11 w-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
          <FileText size={20} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-sm">Print job ready</div>
          <div className="text-xs text-slate-600 mt-0.5">
            Pages: <span className="font-mono">{job.pages}</span> &middot; Copies:{" "}
            <span className="font-mono">{job.copies}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
          Enter 6-digit PIN
        </label>
        <PinInput value={pin} onChange={setPin} disabled={printing} />
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg inline-flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <button
        onClick={onPrint}
        disabled={pin.length !== 6 || printing}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 transition shadow-md shadow-emerald-600/20"
      >
        {printing ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Sending to printer…
          </>
        ) : (
          <>
            <Printer size={18} /> Print
          </>
        )}
      </button>
      <button
        onClick={onCancel}
        className="mt-2 w-full text-sm text-slate-500 hover:text-slate-700 py-2"
      >
        Cancel
      </button>
    </motion.div>
  );
}

function SuccessState({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center py-10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.05 }}
        className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center"
      >
        <CheckCircle2 size={44} className="text-emerald-600" />
      </motion.div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">Sent to printer</h2>
      <p className="text-sm text-slate-600 mt-1">The job has been queued successfully.</p>
      <button
        onClick={onReset}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition"
      >
        <ScanLine size={16} /> Next customer
      </button>
    </motion.div>
  );
}

function PinInput({ value, onChange, disabled }) {
  const inputs = useRef([]);

  const setDigit = (idx, ch) => {
    const digit = ch.replace(/\D/g, "").slice(0, 1);
    const arr = value.padEnd(6, " ").split("");
    arr[idx] = digit || " ";
    const next = arr.join("").replace(/\s+$/, "").replace(/\s/g, "");
    onChange(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text) {
      e.preventDefault();
      onChange(text);
      inputs.current[Math.min(text.length, 5)]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-between">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono font-bold rounded-xl border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition disabled:opacity-60"
        />
      ))}
    </div>
  );
}
