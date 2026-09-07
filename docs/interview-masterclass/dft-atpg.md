# DFT, Scan Chains & ATPG (Additions)

Domain: `dft-atpg`  
Additions: **20** questions (`dft-06` … `dft-25`) to reach 25 with existing `dft-01`…`dft-05`  
Existing in-app themes (Muxed-D basics, lockup intro, LOC/LOS+OPCG intro, compression+X-mask intro, TDRC/ScanDEF) are extended here — not restated verbatim.

---

### Q01. Stuck-At vs Transition vs Path-Delay Faults
- **Suggested id:** `dft-06`
- **Difficulty:** Hard
- **Company style:** DFT architecture
- **Round:** Onsite Technical Round 1
- **Question:**
  Compare stuck-at (SA), transition delay fault (TDF), and path-delay fault (PDF) models. What defect physics does each target, and why is PDF rarely the workhorse production model?
- **Short answer:**
  SA: static node 0/1. TDF: slow $0\to1$ or $1\to0$ at a gate output (gross delay). PDF: a specific structural path misses timing. PDF count explodes combinatorially; TDF + at-speed LOC gives practical coverage of most delay defects.
- **Detailed answer:**
  | Model | Fault site count | Detects | Pattern style |
  |---|---|---|---|
  | SA0/SA1 | ~2 per node | Opens/shorts DC | Single capture, slow OK |
  | TDF slow-to-rise/fall | ~2 per node | Resistive opens, weak vias | Two-vector at-speed |
  | PDF | Enormous path set | Specific critical-path delay | Two-vector, path-targeted |

  TDF assumes a lumped delay at a gate sufficient to miss a capture latch under robust/launch tests. PDF requires enumerating paths (or critical subsets) — great for characterizing speed paths, expensive as a full production fault universe.

  Cell-aware / bridge / interconnect fault models further refine below SA/TDF for advanced nodes.
- **Common pitfalls:**
  - Claiming SA testing at slow speed catches all delay defects.
  - Equating “at-speed scan” automatically with full PDF coverage.
- **Interviewer follow-ups:**
  - Robust vs non-robust path-delay tests.
  - Small-delay defect (SDD) timing-aware ATPG.
- **Tags:** stuck-at, transition-fault, path-delay, fault-models

---

### Q02. LOC vs LOS Edge Cases
- **Suggested id:** `dft-07`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  Beyond the textbook LOC vs LOS comparison: when might a project still choose LOS (or hybrid)? What fails in LOC when launch stateability is poor, and how do dead cycles / SE timing interact?
- **Short answer:**
  LOS can raise coverage when functional launch cannot justify care-bits, but needs at-speed SE. Hybrids exist (LOS in some domains). LOC fails patterns when the functional cone cannot reach the needed launch value; ATPG aborts or needs test points. Dead cycles allow SE to settle before LOC capture pulses.
- **Detailed answer:**
  LOC launch uses functional dependency $V_2 = \delta(V_1)$ with SE=0 — if $\delta$ cannot produce the transition, fault is ATPG-untestable under LOC.

  LOS launches from last shift (SE=1) ⇒ higher controllability, but SE must deassert in $<1$ functional period for skewed-load capture — SE becomes a high-speed distribution network (power, skew, SI).

  Edge cases:
  - Mixed LOC/LOS by partition.
  - False paths / multi-cycle paths confuse at-speed fault grading.
  - Power droop during capture mimics delay faults — need power-aware ATPG.

  Dead cycles: after shift, hold SE low for $N$ slow cycles before OPCG fires launch/capture — not optional on large dies.
- **Common pitfalls:**
  - Enabling LOS chip-wide without SE timing budget.
  - Zero dead cycles causing SE still transitioning into capture.
- **Interviewer follow-ups:**
  - Double-pulse vs multi-clock capture for sequential depth.
  - Why hold-time on scan paths still matters in at-speed modes.
- **Tags:** loc, los, edge-cases, se-timing, dead-cycles

---

### Q03. Lockup Latch Placement Strategy
- **Suggested id:** `dft-08`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Where exactly should lockup latches sit on a multi-clock scan chain (launch side vs capture side)? Active-high vs active-low? What about edge-mixing (posedge→negedge) segments?
- **Short answer:**
  Place lockups at the **driving/launch** domain boundary so the half-cycle shield is referenced to the launch clock. Use polarity matching the edge relationship (commonly active-low lockup after posedge launch). Edge-mix segments need lockups even inside one named chain.
- **Detailed answer:**
  Hold race is caused by positive skew into the capture flop. Delaying data by ~½ shift period at the launch side absorbs large skew.

  Placement near launch also localizes routing: lockup output can travel farther without hold risk relative to launch edge. Captureside-only delay buffers are inferior (P&R variability, no half-cycle guarantee).

  Genus/Innovus: terminal lockup at chain end when exiting a domain; internal lockups when `dft_mix_clock_edges` stitches edges/domains. Verify with scan-shift STA at hold corners.
- **Common pitfalls:**
  - Wrong lockup polarity reintroducing races.
  - Relying on buffer chains across domains.
- **Interviewer follow-ups:**
  - Lockup flop vs latch tradeoffs.
  - Scan enable skew creating similar races on SE→flop paths.
- **Tags:** lockup-latch, placement, edge-mix, hold

---

### Q04. OCC / OPCG Pipeline Details
- **Suggested id:** `dft-09`
- **Difficulty:** Staff / Principal
- **Company style:** Cadence / Synopsys OCC
- **Round:** Onsite Deep-Dive
- **Question:**
  Detail On-Chip Clocking (OCC/OPCG) beyond “two pulses from PLL.” How are shift clocks muxed vs capture pulses gated? What synchronization is needed between ATE and internal PLL clocks?
- **Short answer:**
  OCC FSM, controlled by slow tester bits, switches from external/slow shift clock to PLL-derived capture pulses. Pulse suppressors emit exact launch/capture counts. Clock domain crossings between TCK control and PLL domain need proper sync; IJTAG/1500 often programs OCC.
- **Detailed answer:**
  Blocks:
  1. Clock mux: `scan_shift_clk` vs `pll_clk`.
  2. Programmable pulse counter / waveform generator.
  3. Chain of ICGs / clock gates forcing known enable during shift vs capture.
  4. Lock/lossy bypass for debug.

  Control registers loaded via JTAG/1500 sit in slow domain; outputs synchronized into PLL domain before affecting gates — else OCC itself has CDC bugs.

  Multi-domain OCC: staggered capture across domains to manage IR; or synchronous aligned pulses when paths cross generated clocks from same PLL (not async).
- **Common pitfalls:**
  - Treating OCC enables as static without STA.
  - Forgetting PLL lock as a test precondition.
- **Interviewer follow-ups:**
  - Internal vs external clocking for transition tests at package test vs wafer sort.
  - OCC scan to measure $F_{\max}$ shmoo.
- **Tags:** occ, opcg, pll, at-speed, clock-control

---

### Q05. EDT / Compression Math and Care-Bit Limits
- **Suggested id:** `dft-10`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  For Embedded Deterministic Test–style compression, relate compression ratio, care-bit density, and pattern count. When does “higher compression” increase tester time?
- **Short answer:**
  Decompressor solves linear equations for care-bits. If care-bits per cycle exceed channel degrees of freedom, ATPG splits patterns or fails encoding ⇒ pattern inflation that can erase shift-length gains from short chains.
- **Detailed answer:**
  Rough intuition: with $c$ external channels and XOR/LFSR free variables per shift cycle, you can satisfy on the order of $O(c)$ independent cares per cycle (architecture-dependent). Compression ratio $\gamma = N_{\text{int}}/N_{\text{ext}}$ shortens shift length by ~$\gamma$, but encoding capacity per cycle does not grow with $\gamma$.

  High $\gamma$ + high care density (e.g., after test points poorly planned, or dense sequential patterns) ⇒ many loads, longer total test time. X-control / masking bits also consume bandwidth.

  Engineering: sweep $\gamma$ (30×–100× typical), measure total cycles = patterns × (load+unload shift + captures), pick minimum tester time, not max $\gamma$.
- **Common pitfalls:**
  - Equating compression ratio with tester-time reduction 1:1.
  - Ignoring unload masking cost.
- **Interviewer follow-ups:**
  - Ring generator vs MISR tradeoffs.
  - Adaptive scan / Illinois scan as historical context.
- **Tags:** edt, compression-math, care-bits, test-time

---

### Q06. Boundary Scan / JTAG Basics (IEEE 1149.1)
- **Suggested id:** `dft-11`
- **Difficulty:** Medium
- **Company style:** board DFT
- **Round:** Technical Phone Screen
- **Question:**
  Explain TAP controller states (briefly), IR/DR scan, and how boundary-scan cells enable board interconnect test without bed-of-nails on every pin.
- **Short answer:**
  1149.1 defines TCK/TMS/TDI/TDO (+ optional TRST). TAP FSM (16 states) sequences Instruction and Data registers. Boundary cells between IO pads and core can EXTEST to drive/capture pin values for interconnect shorts/opens.
- **Detailed answer:**
  Instructions: `BYPASS`, `EXTEST`, `SAMPLE/PRELOAD`, `IDCODE`, plus design-specific (`INTEST`, BIST run). BSDL describes cell order for ATPG/board tools.

  Board test: park TAP in Shift-DR with EXTEST, serially load pin stimulus, update, capture neighbors — finds solder opens/shorts.

  Limit: does not replace at-speed core scan; it’s board/package interconnect centric (plus useful debug access).
- **Common pitfalls:**
  - Confusing JTAG with functional high-speed SerDes test.
  - Wrong BSDL vs silicon cell order.
- **Interviewer follow-ups:**
  - 1149.6 for AC-coupled differential links.
  - How IJTAG (1687) networks instruments on-chip.
- **Tags:** jtag, 1149.1, boundary-scan, tap, bsdl

---

### Q07. Logic BIST (LBIST)
- **Suggested id:** `dft-12`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  How does LBIST generate patterns and compact results on-chip? Why are X-states and indefinite cycles problematic, and how is LBIST used in automotive in-system test?
- **Short answer:**
  PRPG (LFSR) → scan channels; MISR compacts responses into a signature compared to golden. Xs corrupt MISR; need X-bounding/masking. In-system LBIST runs at power-on / periodic safety checks with known seeds and expected signatures.
- **Detailed answer:**
  Autonomous test reduces ATE pattern storage. Coverage is statistical — may need STUMPS architecture, phase shifters, and multiple seeds to reach SA/TDF targets. At-speed LBIST needs on-chip clocks similar to OCC.

  Challenges: deterministic diagnosis harder from signature alone; power during PRPG-heavy toggles; undefined states after reset must be bounded.

  ISO 26262-style flows use LBIST as a safety mechanism with diagnostic coverage metrics — not a full replacement for production ATPG in many ASICs, but complementary.
- **Common pitfalls:**
  - Shipping LBIST without X-bounding on RAMs/analog.
  - Ignoring IR drop under PRPG stress.
- **Interviewer follow-ups:**
  - Weighted random patterns vs flat LFSR.
  - Signature aliasing probability.
- **Tags:** lbist, prpg, misr, in-system-test

---

### Q08. Memory BIST (MBIST) and Repair
- **Suggested id:** `dft-13`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Describe MBIST controllers, common March algorithms, and how BIRA/BISR repair uses spare rows/columns. How does MBIST interact with scan compression Xs?
- **Short answer:**
  On-chip MBIST runs March C-/GO/etc. through memory collars. Fail maps feed Built-In Redundancy Analysis; fuses/eFuse allocate spares (BISR). Memories must be isolated/X-bounded during logic scan so outputs don’t poison compactors.
- **Detailed answer:**
  Collar: mux functional vs BIST ports, compare expected read data. Algorithms trade coverage of coupling/stuck faults vs time.

  Repair: analyze fail bitmap → assign spare rows/cols → program fuses → permanent remap. Soft repair for bring-up vs hard fuse at package test.

  At-speed memory test may use memory BIST with functional clocks; retention tests add pause elements.

  DFT integration: `write_memory_test` flows, shared JTAG go/no-go, and ensuring scan modes force memory outputs to known values.
- **Common pitfalls:**
  - Leaving SRAM Q floating into scan during logic test.
  - Forgetting retention / disturb patterns for advanced SRAM.
- **Interviewer follow-ups:**
  - ECC vs repair — complementary roles.
  - Shared vs dedicated MBIST controllers area tradeoff.
- **Tags:** mbist, march, bira, bisr, x-bounding

---

### Q09. Scan Chain Balancing
- **Suggested id:** `dft-14`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Why balance scan chain lengths? How do lockups, clock domains, and compression channels constrain balancing?
- **Short answer:**
  Tester time is gated by the **longest** chain (or longest compressed segment). Unbalanced chains waste IO bandwidth. Balance under domain/lockup/ hierarchical wrapper constraints — not purely by flop count if shift clocks differ.
- **Detailed answer:**
  Ideal: lengths within a few percent. Compression: balance internal chains feeding the compactor. Hierarchical DFT: balance within wrappers then at top.

  Constraints preventing perfect balance: flop clock domains that shouldn’t mix without lockups, physically distant regions (wire), and power domains. Tools pack chains with min/max length knobs.

  After Innovus reorder, lengths stay constant but wire length drops — balancing is logical, reordering is physical.
- **Common pitfalls:**
  - Balancing only by count while one chain runs a half-speed test clock.
- **Interviewer follow-ups:**
  - Segmented scan / dynamic chain length.
  - Why very short chains can hurt compression encoding.
- **Tags:** chain-balancing, test-time, compression, hierarchy

---

### Q10. ATPG Untestable and Redundant Faults
- **Suggested id:** `dft-15`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Distinguish ATPG-untestable, redundant, and aborted faults. What design fixes raise test coverage when ATPG is “stuck”?
- **Short answer:**
  Redundant: fault cannot alter any output (logic dominance) — often OK or cleaned by optimization. ATPG-untestable: blocked by constraints (X, uncontrollable clocks, bus contention rules). Aborted: tool effort timeout. Fixes: test points, controllability on resets/clocks, X-bounding, constraint review.
- **Detailed answer:**
  Coverage reporting: collapse vs uncollapsed; stuck-at vs transition separately. Don’t celebrate 99% if the missing 1% sits on critical control.

  Test points: control points (force values) and observe points (XOR into scan) raise controllability/observability. Cost: area, timing, possible functional intrusion if mis-gated.

  Formal can prove redundancy; don’t add test points for truly redundant faults.
- **Common pitfalls:**
  - Forcing coverage % by waiving without classification.
  - Test points on false paths only.
- **Interviewer follow-ups:**
  - Hard vs soft test points vs EDT observe sites.
  - Coverage vs DPM correlation realities.
- **Tags:** untestable, redundant, test-points, coverage

---

### Q11. Shift Power Reduction
- **Suggested id:** `dft-16`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Why is scan shift often the worst power mode? List ATPG and DFT architectural mitigations and their coverage/test-time costs.
- **Short answer:**
  High correlated toggling of most flops each shift cycle. Mitigate with constant/adjacent fill, shift clock staggering, reduced chain activity modes, blocking nontesting flops, and lower shift frequency. Tradeoffs: more patterns or longer time.
- **Detailed answer:**
  IR drop during shift can corrupt chain contents ⇒ false fails or damaged signatures. Capture power is a separate (often worse for delay test) problem.

  Techniques:
  - **Fill strategies:** 0-fill, 1-fill, adjacent-fill to cut transitions.
  - **Clock gating in shift:** only active chain segments clocked.
  - **Multi-duty shift** / burst-pause for thermal.
  - **Low-power ATPG** cost functions.

  Verify with power-aware simulation / rail analysis on shift vectors.
- **Common pitfalls:**
  - Slowing shift until throughput kills economics without fill improvements.
  - Ignoring shift-hold interactions when inserting stagger.
- **Interviewer follow-ups:**
  - Capture power vs shift power budgeting.
  - Why random fill maximizes toggle (sometimes wanted for stress, not production).
- **Tags:** shift-power, low-power-atpg, ir, fill

---

### Q12. IEEE 1500 Wrapper Cells
- **Suggested id:** `dft-17`
- **Difficulty:** Hard
- **Company style:** hierarchical SoC DFT
- **Round:** Onsite Deep-Dive
- **Question:**
  What problem do IEEE 1500 core wrappers solve? Explain wrapper serial/parallel ports, inward vs outward test, and why wrappers enable core-based hierarchical ATPG.
- **Short answer:**
  Wrappers isolate reused cores so the SoC can test inward (core internals) or outward (surrounding interconnect) with standardized WSP/WPP controls. Enables modular ATPG, black-box patterns, and reduced top-level complexity.
- **Detailed answer:**
  Wrapper boundary register (WBR) cells at core terminals: bypass functional path in external test, or isolate core during internal test. WIR instruction analogous to JTAG IR.

  Flows: generate patterns per core with wrapper; at SoC, schedule cores, manage TAM (test access mechanism) bandwidth, and test interconnect between wrappers.

  Without wrappers, soft-IP integration forces flattened ATPG that doesn’t scale to multi-billion-gate SoCs.
- **Common pitfalls:**
  - Wrapping but leaving uncontrolled clocks/resets into the core.
  - Starving TAM bandwidth so wrapper parallel ports sit idle.
- **Interviewer follow-ups:**
  - IJTAG 1687 instrument access vs 1500.
  - Hierarchical EDT — compression inside wrappers.
- **Tags:** ieee-1500, wrapper, hierarchical-dft, tam

---

### Q13. Clock-Gating DFT Controllability
- **Suggested id:** `dft-18`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Integrated clock gates (ICGs) can block scan shift if test overrides are missing. What DFT hooks are required, and how do LOC capture and shift differ in ICG control?
- **Short answer:**
  Force ICGs on (transparent) during shift via `test_mode`/`scan_en` OR into enable. During LOC capture, often allow functional enables so at-speed paths are realistic — or force-on for max coverage depending on methodology.
- **Detailed answer:**
  TDRC flags ungated controllability failures when clocks cannot toggle flops in shift. Fix: test OR-pin on ICG (`TE`/`SE`).

  Capture: if all ICGs forced on, activity/power and some functional false/re timing paths differ from mission mode. Many flows force-on for shift only; capture uses functional EN with ATPG justifying enables.

  Also ensure PLL/OCC clocks actually reach the ICG during at-speed.
- **Common pitfalls:**
  - Tying TE to 0 permanently after scan insertion bugs.
  - Async reset of ICG latch state mid-shift.
- **Interviewer follow-ups:**
  - Latch-based ICG vs AND-gate gating in test.
  - Power intent UPF retention vs scan clocks.
- **Tags:** icg, clock-gating, shift, loc-capture

---

### Q14. Diagnosis and Chain Failures
- **Suggested id:** `dft-19`
- **Difficulty:** Hard
- **Round:** Onsite Deep-Dive
- **Question:**
  A production fail shows unload mismatches. How do you distinguish a chain integrity fail (shift path) from a logic/capture fail? What is chain diagnosis?
- **Short answer:**
  Chain tests (flush patterns) toggle shift path without relying on combinational capture. If flush fails, diagnose broken chain segment via special chain diagnosis; if flush passes but ATPG fails, do logic diagnosis with fault dictionaries / layout-aware callouts.
- **Detailed answer:**
  Flush / chain pattern: shift known values through with capture disabled or trivial. Isolates SI↔SO path, lockups, hold races.

  Chain diagnosis algorithms locate likely broken flop positions from failing unload bits. Physical FA uses emission / e-beam on that region.

  Compression complicates diagnosis — bypass mode or unload masking logs needed for volume diagnosis.
- **Common pitfalls:**
  - Running expensive logic diagnosis on a broken chain.
  - No bypass path on compressed designs.
- **Interviewer follow-ups:**
  - Volume diagnosis statistical stacking for yield excursions.
  - Cell-aware diagnosis vs stuck-at dictionaries.
- **Tags:** diagnosis, chain-flush, yield, compression-bypass

---

### Q15. Path Delay / Timing-Aware ATPG
- **Suggested id:** `dft-20`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  How does timing-aware or small-delay defect ATPG differ from classic TDF? When would you invest in it?
- **Short answer:**
  Timing-aware ATPG biases tests toward long/sensitized paths and small slack, catching small delay defects that gross TDF metrics miss. Use on speed-critical products, late speed-path yield limiters, or when TDF coverage is high but $F_{\max}$ fallout remains.
- **Detailed answer:**
  Classic TDF may detect via short paths that still fail the fault model mathematically but don’t stress real timing. SDD/timing-aware uses STA slack data to prefer paths with little margin.

  Cost: heavier ATPG CPU, more patterns, needs accurate timing views (including IR-aware ideally). Complements functional speed sorting / LOS/LOC at-speed suites.
- **Common pitfalls:**
  - Running timing-aware on inaccurate early STA.
  - Expecting it to replace structural TDF entirely.
- **Interviewer follow-ups:**
  - N-detect TDF as a cheaper alternative.
  - Correlation to silicon speed path fails.
- **Tags:** timing-aware, sdd, path-delay, atpg

---

### Q16. IDDQ / Quiescent Current Testing
- **Suggested id:** `dft-21`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  What is IDDQ testing, why did it weaken at advanced nodes, and what replaced/augmented it?
- **Short answer:**
  Measure quiescent $I_{DD}$ after vectors to find shorts/leakage defects. Deep submicron leakage variance and massive SoC leakage drown defect deltas. Augmented by voltage stress, mini-IDDQ, and better structural/at-speed tests; still used selectively.
- **Detailed answer:**
  Classic CMOS: defect shorts raise $I_{DDQ}$ orders of magnitude above leakage. FinFET/advanced nodes: high normal leakage, wide distribution ⇒ poor SNR.

  Adaptations: delta-IDDQ between states, colder test, power-domain partitioned measurement, and reliance on SA/TDF/cell-aware. Burn-in / Vstress remain related screens.
- **Common pitfalls:**
  - Declaring IDDQ dead universally — still useful in some analog/MCU contexts.
- **Interviewer follow-ups:**
  - How does power gating invalidate a naive global IDDQ?
  - Very-low-voltage testing as defect screen.
- **Tags:** iddq, leakage, defect-screen

---

### Q17. Scan Cell Types Beyond Muxed-D
- **Suggested id:** `dft-22`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Contrast Muxed-D scan with LSSD and with scan flip-flops that use separate scan clocks. When does each appear?
- **Short answer:**
  Muxed-D: single clock + SE mux — industry ASIC default. LSSD: dual non-overlapping clocks, level-sensitive, avoids mux setup penalty, IBM heritage. Separate scan clock designs simplify some hold issues but add clock distribution complexity.
- **Detailed answer:**
  LSSD master/slave latches clocked by A/B clocks — shift uses alternating pulses; functional uses system clocks. Benefits: robust race control, no SE at-speed for some styles. Cost: latch-based design methodology unfamiliar to many CMOS ASIC teams; library/tooling.

  Muxed-D dominates commercial CMOS for ecosystem reasons (ATPG, compression, OCC recipes) despite mux penalty.
- **Common pitfalls:**
  - Claiming muxed-D has zero functional timing cost.
- **Interviewer follow-ups:**
  - Pulsed latches + scan.
  - Soft vs hard scan mapping in synthesis.
- **Tags:** lssd, muxed-d, scan-styles

---

### Q18. At-Speed False Failures from IR and SDD Confusion
- **Suggested id:** `dft-23`
- **Difficulty:** Staff / Principal
- **Round:** Hiring Manager Round
- **Question:**
  Field returns show “delay defects” that only fail certain LOC patterns. How do you triage real delay defects vs IR-induced false fails vs pattern sensitivity?
- **Short answer:**
  Re-run with reduced activity patterns / lower frequency / higher V; correlate with dynamic IR movies; use chain-safe power-aware regenerations. Real defects persist under low-power patterns; IR fails disappear when toggle density drops or V rises slightly.
- **Detailed answer:**
  Triage matrix:
  - **V/F shmoo:** IR often steep in V; hard defects may differ.
  - **Power-aware regenerate:** if fail vanishes, suspect IR.
  - **Layout-aware diagnosis:** clusters near weak PG ⇒ PI; random cell distribution ⇒ random defect.
  - **Same pattern across temperature:** thermal × EM/IR interactions.

  Process fix may be PDN ECO or ATPG power constraints rather than logic redesign — staff-level judgment call with yield $$.
- **Common pitfalls:**
  - Immediate metal ECO for delay when PDN is the root cause.
  - Shipping low-power patterns that hide real speed paths needed for quality.
- **Interviewer follow-ups:**
  - How do you set capture power thresholds in ATPG?
  - Communication between DFT and PI teams’ signoff metrics.
- **Tags:** false-fail, ir, triage, loc, yield

---

### Q19. Compression Bypass and Debug Hooks
- **Suggested id:** `dft-24`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Why must compressed scan architectures include a bypass / streaming diagnose mode? What else do you instrument for bring-up?
- **Short answer:**
  Bypass restores 1:1 external visibility for chain diagnosis and FA when compactors lose information. Also provide skip-compactor unload, seed control, OCC debug, and memory bypass modes.
- **Detailed answer:**
  Compactors destroy spatial mapping of fails (many-to-few). Volume diagnosis algorithms help, but early bring-up needs deterministic chain visibility.

  Hooks: JTAG instructions to disable EDT, select single chain, freeze MISR, read intermediate signatures, and clock-step OCC. Document in DFT spec — not an afterthought post-silicon.
- **Common pitfalls:**
  - Compression-only silicon with no bypass (undiagnosable chains).
- **Interviewer follow-ups:**
  - Bandwidth cost of always-on bypass pins vs instructional bypass.
  - Security locks on test access in production vs RMA.
- **Tags:** bypass, diagnosis, edt, bring-up

---

### Q20. Wrapper, Compression, and OCC Together (Signoff Picture)
- **Suggested id:** `dft-25`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  Sketch an end-to-end hierarchical DFT architecture that combines 1500 wrappers, EDT compression, OCC at-speed, MBIST, and top-level JTAG. What are the top five signoff checks before tapeout?
- **Short answer:**
  Top JTAG/IJTAG programs TAMs into wrappers; cores contain EDT+OCC+scan; memories have MBIST collars X-bounded from logic compactors. Signoff: TDRC clean, coverage targets, shift/capture STA, power budgets, SDC modes, ScanDEF/ATPG models match LEC, and package-test pattern bring-up plan.
- **Detailed answer:**
  Architecture layers:
  1. **Access:** 1149.1 / 1687 network.
  2. **Core wrappers:** 1500 isolation + TAM.
  3. **Inside core:** compressed scan + OCC + test points.
  4. **Memories:** MBIST + repair fuse controller.
  5. **Analog/IO:** boundary scan / IBIST as applicable.

  **Top signoff checks:**
  1. `check_dft_rules` / uncontrollable clocks/resets = 0 blockers.
  2. SA & TDF coverage ≥ gate; untestables classified.
  3. Shift + capture + OCC timing closed (including lockups).
  4. Shift/capture power < IR budget; patterns power-audited.
  5. Handoff: ScanDEF, ATPG models, BSDL, compression macros, LEC vs netlist, and known-fail bring-up suite on tester.

  Staff candidates should speak across DFT–STA–PI–ATE boundaries, not only ATPG switches.
- **Common pitfalls:**
  - Optimizing only coverage % while pattern power fails on ATE.
  - Hierarchical schedule deadlocks (cannot access core B while A holds TAM).
- **Interviewer follow-ups:**
  - How do you validate DFT on a multi-die / chiplet package?
  - Security: disabling test access after provisioning.
- **Tags:** hierarchical-dft, signoff, edt, occ, 1500, mbist
