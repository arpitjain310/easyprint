import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  ScanLine,
  ShieldCheck,
  Clock3,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import Layout from "../components/Layout";

export default function HomePage() {
  return (
    <Layout>
      <section className="max-w-5xl mx-auto px-5 pt-12 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold mb-5"
        >
          <ShieldCheck size={14} /> Private &middot; PIN-protected &middot; Auto-deletes
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900"
        >
          Print at any shop, <span className="text-blue-600">without sharing your file.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-4 text-slate-600 max-w-xl mx-auto"
        >
          Upload a PDF, get a QR code and a 6-digit PIN. The shop scans, you share the PIN, and they print. That's it.
        </motion.p>
      </section>

      <section className="max-w-5xl mx-auto px-5 grid sm:grid-cols-2 gap-5">
        <RoleCard
          to="/user"
          title="I want to print"
          desc="Upload your PDF and get a QR + PIN to share with the shop."
          icon={<Upload size={26} />}
          accent="from-blue-500 to-blue-700"
        />
        <RoleCard
          to="/shop"
          title="I'm the print shop"
          desc="Scan the customer's QR code, verify the PIN, and print."
          icon={<ScanLine size={26} />}
          accent="from-emerald-500 to-emerald-700"
        />
      </section>

      <section className="max-w-5xl mx-auto px-5 mt-14 grid sm:grid-cols-3 gap-4 pb-12">
        <Feature
          icon={<KeyRound size={18} />}
          title="6-digit PIN gate"
          desc="No PIN, no print. Even if someone has the QR."
        />
        <Feature
          icon={<Clock3 size={18} />}
          title="10-minute expiry"
          desc="Files vanish from the server after a short window."
        />
        <Feature
          icon={<ShieldCheck size={18} />}
          title="One-shot jobs"
          desc="Each PIN works once. No accidental reprints."
        />
      </section>
    </Layout>
  );
}

function RoleCard({ to, title, desc, icon, accent }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link
        to={to}
        className="group block rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-slate-300 transition"
      >
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-white bg-gradient-to-br ${accent} shadow-md mb-4`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-600">{desc}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
          Continue <ArrowRight size={16} />
        </div>
      </Link>
    </motion.div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="rounded-xl bg-white/60 border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-blue-700 font-semibold">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <p className="text-xs text-slate-600 mt-1">{desc}</p>
    </div>
  );
}
