"use client";

import React, { useEffect, useRef, useState } from "react";

interface LogTerminalViewProps {
  log: string;
  isStreaming?: boolean;
  maxHeight?: string;
  className?: string;
}

export function LogTerminalView({
  log,
  isStreaming = false,
  maxHeight = "400px",
  className = "",
}: LogTerminalViewProps) {
  const terminalRef = useRef<HTMLPreElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [log, autoScroll]);

  const handleScroll = () => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  return (
    <div className={`relative bg-[#070a12] border border-white/10 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 font-mono text-[11px] text-white/40">OpenROAD / OpenLane Runner Output</span>
        </div>

        <div className="flex items-center gap-3">
          {isStreaming && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              LIVE
            </span>
          )}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              autoScroll
                ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <pre
        ref={terminalRef}
        onScroll={handleScroll}
        style={{ maxHeight }}
        className="p-4 font-mono text-xs text-emerald-300/90 leading-relaxed overflow-y-auto whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-white"
      >
        {log || (
          <span className="text-white/30 italic">No output logged yet. Launch a stage to view live terminal streams.</span>
        )}
      </pre>
    </div>
  );
}
