import { Link } from "react-router-dom";
import { Printer } from "lucide-react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-slate-900 hover:opacity-80 transition"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-600/30">
              <Printer size={18} />
            </span>
            <span className="text-lg tracking-tight">Smart Print</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/user"
              className="px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            >
              I'm Printing
            </Link>
            <Link
              to="/shop"
              className="px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            >
              I'm the Shop
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      <footer className="text-center text-xs text-slate-500 py-6">
        Files auto-delete after 10 minutes &middot; PIN-protected printing
      </footer>
    </div>
  );
}
