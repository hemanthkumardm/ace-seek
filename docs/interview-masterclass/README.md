# Interview Masterclass — Q&A Packs (docs only)

**No TypeScript wiring yet.** These markdown banks are ready for you to place into `web/src/lib/vlsi-interview-masterclass-data.ts` (and clear `comingSoon` on domains once filled).

**Do not push until you say so** (this folder is local until you commit).

---

## What’s here

| File | Domain id | New Qs | After you merge into app |
|------|-----------|-------:|--------------------------|
| [`00-verification-existing-87.md`](./00-verification-existing-87.md) | (audit) | — | Fix 2 critical + ~16 medium/nit in existing bank |
| [`synthesis-sdc.md`](./synthesis-sdc.md) | `synthesis-sdc` | 5 bonus | Already **31** in app (≥25); bonuses optional |
| [`static-timing-analysis.md`](./static-timing-analysis.md) | `static-timing-analysis` | 9 | 16+9 = **25** |
| [`physical-design.md`](./physical-design.md) | `physical-design` | 12 | 13+12 = **25** |
| [`low-power-upf.md`](./low-power-upf.md) | `low-power-upf` | 8 | 17+8 = **25** |
| [`clock-domain-crossing.md`](./clock-domain-crossing.md) | `clock-domain-crossing` | 20 | 5+20 = **25** |
| [`dft-atpg.md`](./dft-atpg.md) | `dft-atpg` | 20 | 5+20 = **25** |
| [`design-verification.md`](./design-verification.md) | `design-verification` | 25 | 0+25 = **25** (remove `comingSoon`) |
| [`rtl-verilog-architecture.md`](./rtl-verilog-architecture.md) | `rtl-verilog-architecture` | 25 | 0+25 = **25** |
| [`aptitude-quantitative.md`](./aptitude-quantitative.md) | `aptitude-quantitative` | 25 | 0+25 = **25** |
| [`logical-reasoning-puzzles.md`](./logical-reasoning-puzzles.md) | `logical-reasoning-puzzles` | 25 | 0+25 = **25** |
| [`power-integrity-ir.md`](./power-integrity-ir.md) | `power-integrity-ir` | 25 | 0+25 = **25** |

**New questions in docs:** ~199  
**Projected bank if all wired + existing kept:** 87 − 0 + 199 ≈ **286** (or **281** if you skip the 5 synth bonuses)

---

## Existing bank verification (summary)

Full detail: [`00-verification-existing-87.md`](./00-verification-existing-87.md)

| Severity | Count | Action |
|----------|------:|--------|
| Critical | 2 | **`chip-02`** slack math broken; **`clk-03`** virtual-clock causality wrong |
| Medium | ~12 | DFT order contradiction, clock exclusivity conflict, α-scaling, assign≠LVS short, etc. |
| Nit | ~8 | Formula convention, UPF version, skew wording |
| Clean | ~69 | OK to keep |

**Grade: B+** — strong Staff content; fix criticals before calling the pack “Principal-precise.”

---

## Suggested id prefixes (for TS)

| Prefix | Domain |
|--------|--------|
| `syn-*` | synthesis-sdc (existing + `syn-32`…`syn-36`) |
| `sta-*` | static-timing-analysis additions (`sta-17`…`sta-25`) |
| `pd-*` | physical-design additions (`pd-14`…`pd-25`) |
| `upf-*` / `lp-*` / `pwr-*` | existing UPF; new `upf-18`…`upf-25` |
| `cdc-*` | `cdc-06`…`cdc-25` |
| `dft-*` | `dft-06`…`dft-25` |
| `dv-*` | design-verification |
| `rtl-*` | rtl-verilog-architecture |
| `apt-*` | aptitude-quantitative |
| `puz-*` | logical-reasoning-puzzles |
| `ir-*` | power-integrity-ir |

Each question block includes: Suggested id, Difficulty, Round, Question, Short answer, Detailed answer, optional Snippet, Common pitfalls, Interviewer follow-ups, Tags — map 1:1 onto `InterviewQuestion` fields.

---

## Recommended work order for you

1. Read / apply fixes from `00-verification-existing-87.md` on the existing 87  
2. Wire empty domains first (DV, RTL, Aptitude, Puzzles, IR) — biggest UX win (nav no longer empty)  
3. Top up CDC + DFT (currently only 5 each)  
4. Top up STA / PD / UPF to 25  
5. Optional synth bonuses  
6. Clear `comingSoon: true` in `DOMAINS_METADATA` when a domain has content  
7. Update marketing copy (87 → ~275+) when live  

---

## Out of scope here

- No edits to `vlsi-interview-masterclass-data.ts`  
- No git push  
- Learn Hub Synopsys/Open-Source **course** quizzes (separate from this Interview Masterclass product)  
