# Interview Masterclass — Q&A Packs

**Status (post `9b15fcb`):** Markdown banks are **wired** into the app via `web/src/lib/vlsi-interview-masterclass-additions.ts` (199 additions) + base bank (87) = **286** live questions across all 11 domains.

Source markdown in this folder remains the editable authoring copy. Re-run `web/scripts/parse-masterclass.mts` if you change the `.md` files and need to regenerate additions.

---

## Inventory

| File | Domain id | Role |
|------|-----------|------|
| [`00-verification-existing-87.md`](./00-verification-existing-87.md) | audit | Correctness notes for the original 87 |
| [`synthesis-sdc.md`](./synthesis-sdc.md) | `synthesis-sdc` | +5 bonus (`syn-32`…`36`) → **36** live |
| [`static-timing-analysis.md`](./static-timing-analysis.md) | `static-timing-analysis` | +9 → **25** |
| [`physical-design.md`](./physical-design.md) | `physical-design` | +12 → **25** |
| [`low-power-upf.md`](./low-power-upf.md) | `low-power-upf` | +8 → **25** |
| [`clock-domain-crossing.md`](./clock-domain-crossing.md) | `clock-domain-crossing` | +20 → **25** |
| [`dft-atpg.md`](./dft-atpg.md) | `dft-atpg` | +20 → **25** |
| [`design-verification.md`](./design-verification.md) | `design-verification` | **25** (was empty) |
| [`rtl-verilog-architecture.md`](./rtl-verilog-architecture.md) | `rtl-verilog-architecture` | **25** (was empty) |
| [`aptitude-quantitative.md`](./aptitude-quantitative.md) | `aptitude-quantitative` | **25** (was empty) |
| [`logical-reasoning-puzzles.md`](./logical-reasoning-puzzles.md) | `logical-reasoning-puzzles` | **25** (was empty) |
| [`power-integrity-ir.md`](./power-integrity-ir.md) | `power-integrity-ir` | **25** (was empty) |

---

## Post-wiring polish applied after `9b15fcb`

- KaTeX renderer: `\(...\)` / `\[...\]` + un-indent GFM tables
- Content fixes: `chip-02`, `clk-03`, `cdc-04`, `idx-01`, `syn-04`, `pwr-02`
- UX: Free previews / Bookmarks filters + **Random drill**
- Marketing: removed false “Mock Exam Simulators” claim on pricing

See verification doc for remaining nits.
