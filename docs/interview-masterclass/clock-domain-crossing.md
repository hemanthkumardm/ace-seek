# Clock Domain Crossing & Metastability (Additions)

Domain: `clock-domain-crossing`  
Additions: **20** questions (`cdc-06` … `cdc-25`) to reach 25 with existing `cdc-01`…`cdc-05`  
Do **not** treat as replacements for reconvergence/MTBF, toggle pulse fast→slow, async reset deassert, `set_clock_groups` taxonomy, or Gray FIFO full/empty basics — those are already covered in-app.

---

### Q01. Four-Phase Req/Ack Handshake for Multi-Bit Data
- **Suggested id:** `cdc-06`
- **Difficulty:** Hard
- **Company style:** Arm / networking ASIC
- **Round:** Onsite Technical Round 1
- **Question:**
  Design a 4-phase (return-to-zero) asynchronous handshake to transfer a multi-bit payload between two unrelated clocks. Which signals are synchronized, and when is the data bus allowed to change?
- **Short answer:**
  Synchronize only the 1-bit `req` into the destination and 1-bit `ack` back into the source. Hold `data` stable from req assert until ack is seen (and typically until req deassert completes). Never synchronize the data bits with independent 2-FF banks.
- **Detailed answer:**
  **Phases:**
  1. Source drives stable `data`, asserts `req`.
  2. Dest synchronizes `req`, captures `data` into dest-domain regs, asserts `ack`.
  3. Source synchronizes `ack`, deasserts `req` (data may hold or go don't-care per protocol).
  4. Dest sees `req` low (synced), deasserts `ack`. Idle when both low.

  Throughput ≈ several destination+source cycles per word — slower than a deep async FIFO but simple and robust for sparse control/config writes.

  **Stability window:** data must remain unchanged while dest might sample it — i.e., from before synced req is observed through capture. SDC often uses `set_max_delay` on the data envelope with the req as a control qualifier, or treats data as quasi-static relative to the handshake event.
- **Snippet:**
  ```verilog
  // Source: wait (!ack_sync); data<=payload; req<=1;
  //         wait (ack_sync); req<=0; wait (!ack_sync);
  // Dest:   if (req_sync && !ack) begin data_q<=data; ack<=1; end
  //         else if (!req_sync) ack<=0;
  ```
- **Common pitfalls:**
  - Synchronizing every data bit independently (reconvergence).
  - Changing data while `req` remains asserted.
- **Interviewer follow-ups:**
  - 2-phase (NRZ toggle) handshake vs 4-phase tradeoffs.
  - Ready/valid async adaptation of AXI — why it is hard.
- **Tags:** handshake, four-phase, multi-bit-cdc, req-ack

---

### Q02. Async FIFO Depth Sizing Under Rate Mismatch
- **Suggested id:** `cdc-07`
- **Difficulty:** Hard
- **Round:** Onsite Deep-Dive
- **Question:**
  Producer writes at up to $f_w$ with bursts of $B$ beats and minimum idle $G$ cycles; consumer reads at $f_r$. How do you size an async FIFO depth to guarantee no overflow, including pointer sync latency?
- **Short answer:**
  Depth must cover worst-case accumulated excess writes during the time the consumer is slow **plus** gray-pointer synchronization latency (typically 2–3 dest cycles of “stale” emptiness/fullness). Power-of-two depths simplify gray pointers.
- **Detailed answer:**
  Ignoring CDC latency first: integrate write−read over the worst window (often a burst). Example: if $f_w=f_r$ but writer bursts $B$ back-to-back while reader stalls $S$ cycles, need depth $\ge B+S$ (minus overlap if any).

  **CDC pessimism:** full/empty flags use **synchronized, delayed** pointers ⇒ the writer may think the FIFO is not full for 2–3 write clocks after it actually filled from the reader’s view (and vice versa for empty). Add margin $M_{\text{sync}}$ (commonly ≥3–4 entries, design-dependent).

  Formal: prove `!(full && write)` and `!(empty && read)` under async assumptions, or bound with rate-credit math. Depth must be $2^n$ for standard gray full/empty equations.
- **Common pitfalls:**
  - Sizing from average rates only (bursts overflow).
  - Forgetting sync latency margin.
- **Interviewer follow-ups:**
  - Almost-full / almost-empty thresholds for credit protocols.
  - Why bi-synchronous FIFO IP still needs correct gray width $n+1$.
- **Tags:** async-fifo, depth-sizing, burst, sync-latency

---

### Q03. When Gray Code Is Not Enough
- **Suggested id:** `cdc-08`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  Gray encoding protects single-step pointer increments. What fails if the producer jumps the write pointer by more than 1 (multi-beat update, flush, or non-power-of-two wrap tricks)? What alternatives exist?
- **Short answer:**
  Multi-bit gray transitions can have Hamming distance >1 ⇒ sampler may see illegal intermediate codes. Alternatives: handshake per word, binary pointers with handshake of a “valid snapshot,” or counted token credits; do not async-sample arbitrary binary vectors.
- **Detailed answer:**
  Gray’s safety theorem requires **unit-distance** transitions. A flush that adds 8 to a pointer can flip many gray bits. Metastability/sampling can then construct a code that is neither old nor new — false full/empty.

  Fixes:
  - Restrict hardware to +1 increments (normal FIFO).
  - For jumps: pass an absolute binary pointer under an explicit multi-cycle handshake (data stable while req toggles).
  - Or send delta counts with a synchronized strobe and reconstruct in the receiver (careful with lost strobes).

  Interviewers look for recognition that gray is not magic — it is a unit-distance code.
- **Common pitfalls:**
  - Gray-converting a free-running binary counter that sometimes loads mid-stream.
- **Interviewer follow-ups:**
  - Gray counter vs gray **encoder** on binary register — same property only if +1.
  - Johnson / one-hot rings as unit-distance alternatives for small state.
- **Tags:** gray-code, hamming-distance, pointer-jump

---

### Q04. Multi-Clock Reset Tree Architecture
- **Suggested id:** `cdc-09`
- **Difficulty:** Hard
- **Company style:** SoC integration
- **Round:** Onsite Technical Round 1
- **Question:**
  An SoC has 12 asynchronous clocks and one chip-level async reset. How do you architect reset distribution? Why is a single shared synchronizer insufficient?
- **Short answer:**
  One **async-assert / sync-deassert** reset bridge **per clock domain** (sometimes per reset domain). A single synchronizer’s output is async to other clocks and recreates recovery/removal hazards there. Manage reset sequencing between domains that share interfaces.
- **Detailed answer:**
  Hierarchy:
  1. POR / pin reset → cleaned (filter) → fanout.
  2. Per-domain `rst_sync` bridges.
  3. Optional software-controllable soft resets per block, also synced on deassert.

  **Ordering:** bring up lowest-level PHY clocks first, release reset after clocks are stable (PLL lock). For CDC links, hold sources in reset until dest bridges are ready, or design links to tolerate X during bring-up (isolation).

  RDC tools check reset assertion/deassertion crossings analogous to CDC.
- **Common pitfalls:**
  - One global synced reset used as async reset into all domains.
  - Releasing domain A while domain B still drives X into A’s sync inputs.
- **Interviewer follow-ups:**
  - Reset tree buffering vs clock tree — STA recovery/removal.
  - “Reset domain crossing” false failures from intentional async assert.
- **Tags:** multi-clock-reset, rdc, reset-bridge, bring-up

---

### Q05. Pulse Stretcher Slow → Fast
- **Suggested id:** `cdc-10`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  A single-cycle pulse in a **slow** clock domain must be observed in a **fast** domain. Why can a plain 2-FF level synchronizer work here when it fails fast→slow, and when do you still need an edge detector / stretcher?
- **Short answer:**
  If the slow pulse width $\ge 1.5$–$2$ fast clocks, the fast domain will sample it at least once — level sync works. Still use stretch/edge logic if you need a **single-cycle** fast pulse, or if pulse width is only one slow cycle but ratios vary with DVFS.
- **Detailed answer:**
  Sampling criterion: pulse high time $W$ must exceed destination period with margin. Slow→fast usually satisfies $W \gg T_{\text{fast}}$.

  To regenerate a 1-cycle fast pulse: sync the level, then `(sync & ~sync_d)` edge detect. If the slow pulse can be longer than one slow cycle, decide whether to pulse once or hold while level is high.

  DVFS hazard: frequencies change; a design that “usually” works at nominal ratio may fail at corner ratios — prefer toggle/handshake protocols when ratios are not guaranteed.
- **Common pitfalls:**
  - Assuming slow→fast never loses edges under DFS.
  - Double-pulsing from noisy async inputs without hysteresis.
- **Interviewer follow-ups:**
  - Closed-loop ACK so slow domain knows fast saw the event.
  - Stretching with a counter in the fast domain vs source-side stretch.
- **Tags:** pulse-stretch, slow-to-fast, edge-detect, dvfs

---

### Q06. Pulse Transfer Fast → Slow Without Pure Open-Loop Toggle
- **Suggested id:** `cdc-11`
- **Difficulty:** Hard
- **Round:** Onsite Deep-Dive
- **Question:**
  Besides an open-loop toggle synchronizer, describe a **closed-loop** pulse/event transfer from fast→slow that prevents event overrun. When is an async FIFO mandatory?
- **Short answer:**
  Req/ack or toggle-with-busy: source may not issue another event until synchronized ACK returns. If events can queue faster than the round-trip allows, use a FIFO (depth >1) or drop/coalesce policy.
- **Detailed answer:**
  Open-loop toggle fails when a second toggle occurs before the slow domain samples the first (back-to-back fast events). Closed-loop:

  1. Source toggles/asserts req only if `!busy`.
  2. Busy set until ACK synchronized back from slow domain.
  3. Minimum spacing ≥ sync latency round trip (often ≥ 3 slow + 3 fast cycles).

  If the application cannot stall the source (e.g., line-rate packets), depth-$N$ async FIFO or elastic buffer is mandatory; handshake alone cannot create storage.
- **Common pitfalls:**
  - Using open-loop toggle for interrupt storms.
  - ACK path without its own synchronizer.
- **Interviewer follow-ups:**
  - Credit-based vs ack-based event channels.
  - Coalescing multiple fast interrupts into one slow IRQ bit.
- **Tags:** closed-loop-cdc, busy-ack, event-overrun, fifo

---

### Q07. CDC Lint Rule Categories
- **Suggested id:** `cdc-12`
- **Difficulty:** Hard
- **Company style:** JasperGold / SpyGlass CDC
- **Round:** Onsite Technical Round 1
- **Question:**
  Categorize major CDC lint findings (not just “missing sync”). Give examples of structural, scheme, and reconvergence classes and how you disposition waivers.
- **Short answer:**
  Typical classes: unsynchronized crossings, missing/partial sync cells, multi-bit bus reconvergence, combinational logic before sync, pulse/glitch hazards, reset crossings, clock-group mismatches, and quasi-static violations. Waive only with documented scheme + SDC evidence.
- **Detailed answer:**
  | Class | Example | Typical fix |
  |---|---|---|
  | Structural | Combo cloud into sync D pin | Register in source domain |
  | Scheme | Multi-bit with per-bit sync | Handshake/FIFO |
  | Reconvergence | Divergent synced controls | Common sync / gray / FSM redesign |
  | Naming/cell | Inferred sync without hardened cell | Instantiate sync IP + dont_touch |
  | Reset | Async reset into other domain data | RDC bridges |
  | Constraint | Path still timed or unconstrained wrongly | clock_groups / max_delay |

  Waivers need owner, rationale, and review expiry. “Tool false positive” without waveform/scheme proof is not acceptable at staff level.
- **Common pitfalls:**
  - Mass-waiving reconvergence.
  - Sync cell optimized away / retimed apart in PnR.
- **Interviewer follow-ups:**
  - How do you verify sync pair placement max distance?
  - CDC on DFT scan paths — special case?
- **Tags:** cdc-lint, jaspergold, spyglass, waivers

---

### Q08. Quasi-Static Signals Across Domains
- **Suggested id:** `cdc-13`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  What is a quasi-static (software-static) CDC signal? What constraints and runtime rules make it legal without a full handshake on every bit?
- **Short answer:**
  A multi-bit value that changes rarely, with a guarantee it is stable for a long window and that consumers sample it only under a synchronized “update” qualifier—or after reset/config quiet periods. SDC often `set_false_path` or loose `set_max_delay` on the data with functional guarantees.
- **Detailed answer:**
  Examples: MMIO configuration programmed long before use; strap pins sampled once after reset.

  Rules:
  1. Writer updates only when reader is known idle / gated off, **or**
  2. Writer toggles a synchronized `cfg_update` after data has been stable for $N$ cycles; reader samples data only on detecting update.

  Without (1) or (2), quasi-static is just an unsynchronized multi-bit bug with a fancy name. Document in CDC waivers and verify with assertions (`$stable(data)` until update).
- **Common pitfalls:**
  - Labeling a streaming video bus “quasi-static.”
  - Changing cfg while the block runs without an update event.
- **Interviewer follow-ups:**
  - How do UVM RAL sequences enforce quiet windows?
  - Distinction from false-path clock crossings that still need glitch-free muxing.
- **Tags:** quasi-static, config-cdc, waiver, set_max_delay

---

### Q09. Mux Recoding / Control Recoding CDC
- **Suggested id:** `cdc-14`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  Explain mux-recoding (control recoding) as a multi-bit CDC technique. How does it differ from gray coding a counter?
- **Short answer:**
  Recode a multi-bit control field into a 1-hot or unit-distance representation so that asynchronous sampling cannot create a dangerous illegal combination; or send an index with a synchronized enable. Gray is a special unit-distance code for counters; recoding is the general FSM/control analogue.
- **Detailed answer:**
  Example hazard: 2-bit `{mode0,mode1}` changing $00\to11$ may be sampled as $01$ or $10$, enabling two illegal modes briefly.

  Recoding approaches:
  - **One-hot modes** with synchronized bit-by-bit only if transitions are guaranteed one-hot adjacent (still risky) — better: synchronize a single “token” bit and keep payload stable (handshake).
  - **Priority encode** after sync of a one-hot vector with care (multi-hot glitch) — usually inferior to handshake.
  - Industry “mux recode”: transform controls so intermediate values are safe no-ops; destination re-encodes to local binary.

  Staff answer emphasizes **safe intermediate states**, not merely “use gray for everything.”
- **Common pitfalls:**
  - Gray-encoding arbitrary enums that do not traverse gray adjacencies.
- **Interviewer follow-ups:**
  - Safe FSM encoding across async boundaries.
  - Recoding vs async FIFO of command descriptors.
- **Tags:** mux-recode, unit-distance, control-cdc

---

### Q10. DV Synchronizer Checkers & Formal
- **Suggested id:** `cdc-15`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  What dynamic verification (simulation) checkers prove CDC protocols beyond static lint? Give assertions for handshake and for “no change while crossing.”
- **Short answer:**
  Assertions: data stable while req asserted; req/ack 4-phase sequencing; toggle spacing; FIFO no write-when-full; sync input not driven by combo glitches. Plus dual-clock constrained-random and CDC-aware formal (check_cdc).
- **Detailed answer:**
  Example properties:
  ```systemverilog
  // Data stable from req rise until ack rise (src view)
  assert property (@(posedge clk_s)
    $rose(req) |-> $stable(data) until $rose(ack_sync));
  ```
  Also check destination does not capture unless `req_sync` is asserted.

  Stimulus must inject async phase sweep (offset clocks) — aligned TB clocks miss bugs. Formal CDC apps prove absence of structural issues; protocol assertions prove scheme correctness.
- **Common pitfalls:**
  - Only running lint, never async phase simulation.
  - Assertions clocked on the wrong domain.
- **Interviewer follow-ups:**
  - How do you model metastability in sim (nondeterministic delay)?
  - Cover bins for min toggle spacing.
- **Tags:** assertions, cdc-dv, formal, sva

---

### Q11. `set_max_delay` Datapath CDC
- **Suggested id:** `cdc-16`
- **Difficulty:** Staff / Principal
- **Company style:** STA + CDC
- **Round:** Onsite Deep-Dive
- **Question:**
  When is `set_max_delay -datapath_only` used for CDC instead of `set_clock_groups -asynchronous`? What value do you pick, and what still must be synchronized?
- **Short answer:**
  For synchronized control + multi-bit data that must arrive within a bounded skew window (handshake data, gray pointers sometimes), max_delay budgets combinational/routing skew between bits. Control/event bits still need proper sync flops; max_delay does not fix metastability.
- **Detailed answer:**
  `set_clock_groups -asynchronous` ignores timing entirely — fine for pure async with synchronizers, but then bit skew on a handshake payload is unchecked.

  `set_max_delay $T -datapath_only -from src_reg -to dst_reg` constrains skew so all bits of a static bus arrive within $T$ (often a fraction of dest period). `-datapath_only` excludes clock path insertion from the check.

  Still required: synchronizers on req/ack; data must be stable; ignore max_delay as a substitute for 2-FF on an async control.
- **Common pitfalls:**
  - Max_delay on free-running async controls without sync.
  - Overly tight max_delay causing impossible PnR.
- **Interviewer follow-ups:**
  - Interaction with `set_false_path` waivers on the same nets.
  - Point-to-point vs fanout max_delay.
- **Tags:** set-max-delay, datapath-cdc, sta, skew

---

### Q12. Three-Flop Synchronizers — When and Why
- **Suggested id:** `cdc-17`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  When do you choose a 3-FF synchronizer over 2-FF? Quantify the MTBF intuition and the latency cost.
- **Short answer:**
  When $f_{\text{clk}}$ is high, $\tau$ is poor (slow library / low V), or safety goals demand huge MTBF. Extra stage adds one more destination cycle of latency but multiplies MTBF roughly by $e^{T/\tau}$.
- **Detailed answer:**
  Resolution time grows from $\sim T$ to $\sim 2T$ (minus setup). Because MTBF $\propto e^{t_r/\tau}$, one extra stage is exponential gain. Automotive / high-reliability / multi-GHz domains often standardize on 3FF or library-hardened sync cells with special circuit design (not just three flops).

  Cost: +1 cycle latency on controls; throughput protocols must budget it. Never mix 2FF and 3FF carelessly on related controls (reconvergence depth mismatch).
- **Common pitfalls:**
  - Adding a 3rd flop far away without `dont_touch` / grouping — PnR breaks the chain.
- **Interviewer follow-ups:**
  - Synopsys/Cadence hardened synchronizer cells vs RTL flops.
  - MTBF at 0.6 V deep sleep vs nominal.
- **Tags:** 3ff, mtbf, latency, hardened-sync

---

### Q13. Two-Phase Toggle Handshake
- **Suggested id:** `cdc-18`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Describe a 2-phase (NRZ) toggle handshake for data transfer. How do phase wires encode requests without return-to-zero?
- **Short answer:**
  Each level **transition** on `req` means a new transaction; `ack` transitions to complete. Idle can be either level. Faster than 4-phase (fewer transitions) but edge-sensitive and harder to debug reset polarity.
- **Detailed answer:**
  Protocol:
  - Source puts data, toggles `req` when it differs from `ack` (phase unequal means outstanding).
  - Dest captures on detecting `req_sync != ack`, then toggles `ack`.
  - Source sees phases equal again ⇒ can issue next.

  Compared to 4-phase: half the phase events per word. Reset must define initial equal phases; a mismatch after reset causes a spurious transaction — initialize carefully.
- **Common pitfalls:**
  - Interpreting level high as “request valid” (that is 4-phase thinking).
  - Losing a toggle when DVFS violates spacing.
- **Interviewer follow-ups:**
  - Convert 2-phase to AXI-valid/ready in one domain.
  - Why async FIFO often preferred for streaming anyway.
- **Tags:** two-phase, nrz-handshake, toggle-phase

---

### Q14. Clock-Enable Crossing vs Data Crossing
- **Suggested id:** `cdc-19`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  You must qualify a counter in domain B with an enable generated in domain A. Compare: (1) synchronize enable, (2) generate a pulse event, (3) move the counter to domain A. Failure modes?
- **Short answer:**
  Sync’ing a multi-cycle enable level is OK if width meets sampling rules; 1-cycle enables need pulse sync. Related counters in two domains diverge under lost enables — prefer single domain or gray-coded shared count with proper sync.
- **Detailed answer:**
  Hazards:
  - Narrow enable pulse lost (fast→slow).
  - Enable synchronized but data associated with it is not (partial scheme).
  - Stretching enable causes multiple increments in a fast domain when only one was intended — use edge detect.

  Best practice: keep coherent state in one clock; cross events or snapshots, not “continuous enables” for shared mathematical state.
- **Common pitfalls:**
  - Level-sync a 1-cycle enable into a slower clock.
- **Interviewer follow-ups:**
  - Sample-and-hold of an entire register file on an enable event.
  - Credit returns as enables.
- **Tags:** clock-enable, pulse-vs-level, coherent-state

---

### Q15. Combinational Logic Before the First Sync Flop
- **Suggested id:** `cdc-20`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Why do CDC guidelines forbid combinational clouds feeding the first synchronizer flop? What about an AND of two already-async signals?
- **Short answer:**
  Combo logic glitches can produce runt pulses that set metastability or be sampled as false events. AND/OR of two unsynchronized async sources creates untimed glitch windows — synchronize each source first (or in source domains), then combine in the destination.
- **Detailed answer:**
  Glitch may violate pulse-width assumptions of the sync cell. Even without glitches, the arrival time is untimed relative to dest clock.

  Pattern: register in source → sync chain → combo in destination. Exception: vendor sync cells with specified input filtering still want clean source-registered inputs.
- **Common pitfalls:**
  - “It’s only an inverter” — still a delay path; usually OK electrically but lint flags; consistent methodology prefers registered.
  - Muxing two clocks’ data into sync D with select async.
- **Interviewer follow-ups:**
  - Glitch filtering synchronizers — when allowed?
  - Multi-input XOR of many async IRQs.
- **Tags:** glitch, sync-input, lint, combo-cloud

---

### Q16. Parameterized Sync IP, `dont_touch`, and Placement
- **Suggested id:** `cdc-21`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  How do you implement a reusable synchronizer module so synthesis/PnR cannot destroy MTBF (retiming, resizing apart, scan replacement issues)?
- **Short answer:**
  Instantiate library hardened sync or a module with `dont_touch`/`size_only`, adjacent placement constraints / bounds, no combo between stages, and documented scan strategy (lock sync stages or use approved scanable sync cells).
- **Detailed answer:**
  Risks: retiming moves logic across FF1; physical distance increases wire delay between FF1–FF2 eating resolution time; scan muxes add delay on D; useful-skew optimizations move clocks.

  Controls: `set_dont_retime`, placement halo, max wire length between stages, preserve hierarchy, and CDC tools recognizing sync pairs by cell type/name.
- **Common pitfalls:**
  - Inferring sync from generic RTL without attributes.
  - Different Vt/size on FF1 vs FF2 causing unmatched $\tau$.
- **Interviewer follow-ups:**
  - Should sync flops be on scan chains?
  - CPFs of synchronizer vs functional flops.
- **Tags:** dont-touch, placement, hardened-ip, mtbf

---

### Q17. False Path vs Max Delay vs Clock Groups (CDC Constraints Matrix)
- **Suggested id:** `cdc-22`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  Build a decision matrix: for a given crossing, when do you apply `set_false_path`, `set_clock_groups -asynchronous`, or `set_max_delay`? What is dangerous about stacking them inconsistently?
- **Short answer:**
  Clock groups: default for fully async domains with sync schemes. False path: specific exceptions (quasi-static statics). Max delay: bounded skew buses under handshake. Inconsistent mixes can leave paths both ignored and required, or double-waived real bugs.
- **Detailed answer:**
  Prefer **one** coherent methodology documented in the SDC cookbook:
  - Async domains → `set_clock_groups -asynchronous` between clocks.
  - Then selectively **re-constrain** handshake data with `set_max_delay` where needed (overrides must be understood per tool).
  - Point false paths for rare static straps.

  Audits: `check_timing`, CDC-SDC consistency reports, and ensuring sync cells are not false-pathed into oblivion so recovery checks disappear incorrectly.
- **Common pitfalls:**
  - False-pathing the entire dest sync first flop (hides real issues).
  - Relying on tool defaults when clock groups omitted (GIGO timing).
- **Interviewer follow-ups:**
  - Physically vs logically exclusive interaction with CDC.
  - Generated clocks from same PLL — not async.
- **Tags:** sdc, false-path, max-delay, clock-groups, methodology

---

### Q18. Stable Qualifier / Validated Data Crossing
- **Suggested id:** `cdc-23`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Explain the “data + synchronized valid” pattern: multi-bit data free-runs in the source, destination samples only when a synced qualifier says the window is safe. What SDC and RTL rules apply?
- **Short answer:**
  Source asserts `valid` only after data has been stable long enough; `valid` is synchronized (or is a toggle event). Destination captures `data` only on synced valid. Data lines use max_delay/false_path per methodology; they are not independently synchronized bit-wise.
- **Detailed answer:**
  This is the practical family behind handshakes and quasi-static updates. Critical RTL bug: destination using `data` combinationally while `valid_sync` is low (X or torn values). Gate all use by the qualifier.

  If valid is level-held for many slow cycles, fast dest may resample many times — use edge detect if one-shot capture is required.
- **Common pitfalls:**
  - Sampling data on the same dest cycle valid first becomes 1 without a hold delay from source (need stability before valid).
- **Interviewer follow-ups:**
  - Valid/ready with async — why ready must also close the loop.
  - Using gray code for the payload itself vs for pointers only.
- **Tags:** valid-qualifier, multi-bit, handshake-family

---

### Q19. Reset Domain Crossing (RDC) vs CDC
- **Suggested id:** `cdc-24`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  How does an RDC problem differ from a classic data CDC problem? Give an example where reset assertion is safe but reset release ordering across two domains corrupts a shared interface.
- **Short answer:**
  RDC concerns resets as asynchronous controls into flops (recovery/removal, partial reset). Example: domain A out of reset drives start-up transactions while domain B still holds reset — B’s sync/FIFO logic is X or stuck, causing deadlock or metastability on ack lines.
- **Detailed answer:**
  Tools analyze reset assertion sources vs clock domains. Fixes: per-domain bridges, reset controllers with sequence enables, isolation defaults on inter-domain interfaces during reset, and explicit “ready for traffic” status bits synchronized between domains.

  Soft reset of only one side of an async FIFO is a classic foot-gun — pointers diverge forever unless both sides reset coherently or soft-reset is forbidden.
- **Common pitfalls:**
  - Soft-resetting only the write side of an async FIFO.
  - Treating RDC waivers like CDC data waivers.
- **Interviewer follow-ups:**
  - Partial reset of a CPU vs fabric.
  - Scan clear vs functional reset interactions.
- **Tags:** rdc, reset-ordering, async-fifo-reset, isolation

---

### Q20. Muxed Recirculation / Recirculation Synchronizer Myths
- **Suggested id:** `cdc-25`
- **Difficulty:** Staff / Principal
- **Round:** Hiring Manager Round
- **Question:**
  Some legacy designs AND a synchronized “select” with multi-bit async data into a dest register (recirculation mux). What is the intended idea, and why do modern CDC methodologies usually reject it for high-speed SoCs?
- **Short answer:**
  Intent: freeze the dest register until select says data is stable, avoiding bit tearing. Reality: timing of data vs select is fragile, glitches and max_delay burdens are high, and handshakes/FIFOs are clearer. Acceptable only for slow quasi-static cases with hard proof.
- **Detailed answer:**
  Recirculation: `q <= sel_sync ? async_data : q`. If `sel_sync` rises only when `async_data` has been stable for a full dest period + skew budget, capture is coherent.

  Failure modes: select arrives while data still transitioning; data transitions while sel stays high; STA can’t prove stability without rigorous max_delay + design discipline. At GHz rates, proving this is harder than building a FIFO.

  Staff stance: prefer standard schemes; if recirculation remains, treat as quasi-static with assertions + lint waiver package.
- **Common pitfalls:**
  - Using recirculation for streaming buses.
  - Synchronizing `sel` but changing `async_data` every source cycle.
- **Interviewer follow-ups:**
  - Compare to Intel/ARM recommended sync libraries.
  - How would you formally prove the stability window?
- **Tags:** recirculation, quasi-static, methodology, anti-pattern
