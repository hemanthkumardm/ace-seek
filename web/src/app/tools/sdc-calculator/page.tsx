import { headers } from "next/headers";
import { productHostSlug } from "@/lib/site";
import { Clock, Cpu, ArrowLeft, Activity, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Timing · SDC Calculator",
};

export default async function SdcCalculatorPage() {
  const host = (await headers()).get("host");
  const slug = productHostSlug(host);
  const back = slug ? "https://ace-seek.com/dashboard" : "/dashboard";

  return (
    <div className="m-shell py-16 max-w-xl">
      <div className="sk-panel p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-4">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well">
              <Clock className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <span className="font-mono text-xs text-[var(--accent-cyan)] font-bold block">
                TIMING.ACE-SEEK.COM
              </span>
              <h1 className="text-xl font-bold">SDC Constraint Workbench</h1>
            </div>
          </div>
          <span className="sk-badge">
            <span className="sk-led sk-led-amber" />
            <span>CALIBRATING</span>
          </span>
        </div>

        <p className="text-xs text-[var(--muted)] leading-relaxed">
          SDC formulation helpers: clock uncertainty, input/output delays, multi-cycle paths, jitter derates, and timing constraint math.
        </p>

        <div className="sk-lcd space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span>MODULE_STATUS: INITIALIZING</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] opacity-80 font-mono">
            Interactive timing bench UI coming in next update.
          </p>
        </div>

        <a href={back} className="sk-btn sk-btn-ghost !text-xs inline-flex items-center gap-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </a>
      </div>
    </div>
  );
}
