import { Code2, ExternalLink } from "lucide-react";
import { SYSTEM_VERSION } from "@/core/config/version";

export function TomvisFooter() {
  return (
    <footer className="mt-12 pt-6 pb-8 border-t border-slate-200/80 text-xs text-slate-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Developer Branding & System Version */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200/70 text-teal-800 font-medium">
            <Code2 size={14} className="text-teal-600" />
            <span>Powered by <strong className="font-semibold">{SYSTEM_VERSION.coreName}</strong></span>
            <span className="text-[10px] px-1.5 py-0.2 bg-teal-700 text-white rounded font-mono">
              {SYSTEM_VERSION.version}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-700">
              {SYSTEM_VERSION.status}
            </span>
          </div>
        </div>

        {/* Center / Right: Hospital & Developer Copyright */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-1 text-slate-500">
          <span>{SYSTEM_VERSION.fullAppName} • {SYSTEM_VERSION.hospitalName}</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <a
            href={SYSTEM_VERSION.developerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-700 transition-colors flex items-center gap-1 font-medium text-slate-600"
          >
            <span>{SYSTEM_VERSION.developer}</span>
            <ExternalLink size={11} className="text-slate-400" />
          </a>
        </div>
      </div>
    </footer>
  );
}
