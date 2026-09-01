import React from "react";
import { ShieldCheck, Info } from "lucide-react";

export function LegalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <aside aria-label="Legal and trademark notice" className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
        <p className="flex items-center gap-1.5 font-medium text-slate-400 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Educational Fair-Use &amp; Trademark Compliance</span>
        </p>
        <p>
          Cadence®, Genus™, Innovus™, Voltus™, Tempus™, Conformal® are trademarks of Cadence Design Systems, Inc. 
          Synopsys®, Design Compiler®, IC Compiler® II, PrimeTime®, Formality® are trademarks of Synopsys, Inc. 
          Ace-Seek is an independent educational platform and is not affiliated with, endorsed by, or sponsored by Cadence, Synopsys, Siemens, or any semiconductor foundry. 
          All tutorials, code templates, and exercises utilize generic or open-source technology libraries solely for technical instruction.
        </p>
      </aside>
    );
  }

  return (
    <section aria-labelledby="legal-notice-heading" className="mt-12 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-2">
          <h3 id="legal-notice-heading" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            Educational Disclaimer &amp; Trademark Compliance
          </h3>
          <p>
            <strong>Ace-Seek</strong> is an independent digital learning platform developed for technical education, script syntax training, and conceptual workflow understanding in VLSI physical design and ASIC engineering.
          </p>
          <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 space-y-1.5">
            <p>
              • <strong>Cadence Design Systems:</strong> Cadence®, Genus™, Innovus™, Voltus™, Tempus™, Conformal®, and JasperGold® are registered trademarks or trademarks of Cadence Design Systems, Inc. in the United States and other jurisdictions.
            </p>
            <p>
              • <strong>Synopsys, Inc.:</strong> Synopsys®, Design Compiler®, IC Compiler® II, PrimeTime®, PrimePower®, and Formality® are registered trademarks or trademarks of Synopsys, Inc. in the United States and other jurisdictions.
            </p>
            <p>
              • <strong>Non-Affiliation:</strong> Ace-Seek is not affiliated with, associated with, authorized by, sponsored by, or endorsed by Cadence Design Systems, Synopsys, Siemens, or any commercial semiconductor foundry.
            </p>
            <p>
              • <strong>Clean-Room Educational Standard:</strong> All scripts, timing libraries, technology LEF files, and design rules presented across lessons, labs, and interactive analyzers are clean-room synthetic models, generic benchmarks, or open-source PDKs (e.g. SkyWater 130nm). No confidential or proprietary foundry data is used or distributed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
