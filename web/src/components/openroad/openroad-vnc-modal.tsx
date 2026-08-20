"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Monitor,
  Layers,
  Sparkles,
} from "lucide-react";

export interface OpenroadVncModalProps {
  isOpen: boolean;
  onClose: () => void;
  webUrl: string;
  stageName?: string;
  odbLabel?: string;
}

export function OpenroadVncModal({
  isOpen,
  onClose,
  webUrl,
  stageName = "Floorplan",
  odbLabel = "top.odb",
}: OpenroadVncModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !webUrl) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className={`flex flex-col bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-0 rounded-none border-none"
            : "w-full max-w-6xl h-[88vh]"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 select-none">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  OpenROAD Native Cloud GUI
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {stageName}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <Layers className="w-3 h-3 text-slate-500" />
                {odbLabel}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              title="Reload Stream"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.open(webUrl, "_blank")}
              title="Open in Standalone Tab"
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <span>New Window</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              title="Close GUI (Esc)"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 w-full bg-black overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm text-slate-300 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <div className="text-center">
                <p className="text-sm font-medium">Connecting to OpenROAD X11 Framebuffer…</p>
                <p className="text-xs text-slate-500 mt-1">
                  Loading native Qt layout viewer ({odbLabel})
                </p>
              </div>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={webUrl}
            onLoad={() => setIsLoading(false)}
            className="w-full h-full border-0 bg-black"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        </div>

        {/* Footer Guidance Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Tip: Use mouse wheel to zoom in/out, right-click drag to pan, and click any standard cell to inspect pin net connections.
            </span>
          </div>
          <span className="font-mono text-slate-500">Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
