# Static Timing Analysis (STA & SI)
- **Domain id:** `static-timing-analysis`
- **Existing in app:** 16
- **New in this doc:** 9
- **Target:** 25 total

> Top-up bank only. Suggested ids `sta-17` … `sta-25` fill gaps not heavily covered in the live app bank (path-group triage, MMMC object model, basic setup/hold whiteboards, FinFET temp inversion, hierarchical ILM boundary STA). Prefer CRPR/CPPR, AOCV/POCV, GBA vs PBA, SI delta delay, latch borrowing, data checks, recovered clocks, min pulse width, clock-gating checks, and reconvergence pessimism.

---

### Q01. CRPR / CPPR common-path credit math
- **Suggested id:** `sta-17`
- **Difficulty:** Staff / Principal
- **Company style:** Apple Silicon / Intel
- **Round:** Onsite Deep-Dive
- **Question:**
  Derive why flat OCV without CRPR (CPPR) double-counts on-chip variation on the common clock path. Given launch network delay $D_L$, capture network delay $D_C$, common path delay $D_{\text{common}}$, and flat late/early derates $k_L$ / $k_E$, write the setup slack with and without common-path credit, and state the exact credit term tools remove.
- **Short answer:**
  Flat OCV derates the entire launch path late and the entire capture path early, including the shared trunk. That shared segment cannot be simultaneously late *and* early, so CRPR/CPPR restores the illegal pessimism $D_{\text{common}}(k_L - k_E)$ (setup) back into slack.
- **Detailed answer:**
  ### Setup without CRPR (naive flat OCV)
  Ideal period $T$, data path delay $D_{\text{data}}$, library setup $T_{\text{su}}$:

  $$
  \begin{aligned}
  T_{\text{launch}}^{\text{late}} &= k_L\,(D_{\text{common}} + D_{L,\text{unique}}) \\
  T_{\text{capture}}^{\text{early}} &= k_E\,(D_{\text{common}} + D_{C,\text{unique}}) \\
  S_{\text{setup}}^{\text{no CRPR}} &= T + T_{\text{capture}}^{\text{early}} - T_{\text{launch}}^{\text{late}} - D_{\text{data}}^{\text{late}} - T_{\text{su}}
  \end{aligned}
  $$

  Expanding the clock terms:

  $$
  T_{\text{capture}}^{\text{early}} - T_{\text{launch}}^{\text{late}}
  = k_E D_{C,\text{u}} - k_L D_{L,\text{u}} - D_{\text{common}}(k_L - k_E)
  $$

  The last term $-D_{\text{common}}(k_L-k_E)$ is **physically impossible** pessimism: one physical net cannot be both late-derated and early-derated in the same analysis edge pair.

  ### With CRPR / CPPR
  Tools compute the common segment (same cells/nets from root to divergence point) and **credit** that illegal delta:

  $$
  \text{CRPR}_{\text{setup}} = D_{\text{common}}(k_L - k_E)
  $$

  $$
  S_{\text{setup}}^{\text{CRPR}} = S_{\text{setup}}^{\text{no CRPR}} + \text{CRPR}_{\text{setup}}
  $$

  Hold CRPR is analogous but with early launch / late capture; credit still removes double-counting on the shared trunk.

  ### Industrial notes
  - **Graph-based** CRPR uses a single divergence point per path pair; reconvergent clock trees need careful LCA (lowest common ancestor) selection.
  - **POCV / LVF** still uses CRPR-like common-path handling, but sigma combination is statistical rather than min/max derate arithmetic.
  - Disabling CRPR for “conservative” signoff is usually wrong: you are signing off against an **impossible** corner, not a real silicon corner.
- **Snippet:**
  ```tcl
  # PrimeTime / Tempus style (names vary by tool):
  set_app_var timing_remove_clock_reconvergence_pessimism true
  # or Tempus:
  set_db timing_analysis_cppr true
  report_timing -path_type full_clock_expanded  ;# inspect common clock segment
  ```
- **Common pitfalls:**
  - Confusing CRPR with AOCV stage-count derating — they address different pessimism sources.
  - Assuming CRPR always makes hold *worse*; hold also receives common-path credit (different edge combination).
  - Looking only at Ideal clocks where CRPR is zero because network latency is not propagated.
- **Interviewer follow-ups:**
  - How does CRPR interact with generated clocks and clock mux divergence?
  - Why can over-aggressive clock gating / ICG placement change the CRPR divergence point overnight?
- **Tags:** crpr, cppr, ocv, common-path, setup-hold, signoff

---

### Q02. Flat OCV vs AOCV vs POCV / LVF
- **Suggested id:** `sta-18`
- **Difficulty:** Staff / Principal
- **Company style:** Intel / Synopsys STA lead
- **Round:** Onsite Technical Round 1
- **Question:**
  Contrast flat OCV, Advanced OCV (AOCV / SBOCV), and Parametric OCV (POCV / SOCV / LVF). For a 12-stage data path and a 3-stage clock path, explain qualitatively why flat derates over-penalize long paths, how distance/depth tables correct that, and what mean/sigma Liberty Variation Format changes in path combination.
- **Short answer:**
  Flat OCV applies one late/early constant to every arc — long paths accumulate absurd pessimism. AOCV indexes derate by path depth and/or spatial distance so deep paths get milder per-stage derate. POCV replaces deterministic min/max with statistical mean + sigma (LVF) and combines variances along the path (RSS-like), yielding less global guardband at iso-yield.
- **Detailed answer:**
  ### Flat OCV
  Single scalars, e.g. `set_timing_derate -late 1.05 -early 0.95`. Every cell/net arc is scaled. A 40-stage path is treated as if *every* stage is simultaneously at the same extreme — physically correlated variation does not behave that way → **guardband explosion** on deep logic, while short hold paths are inconsistently treated.

  ### AOCV / stage-based / distance-based
  Libraries or side tables provide derate as a function of:
  - **Path depth** (stage count from clock root or from path startpoint)
  - **Spatial distance** (bounding-box diagonal between launch and capture)
  - Often separate clock vs data, cell vs net tables

  Intuition: random local variation averages out over many independent stages → per-stage derate **shrinks** with depth. Systematic / global components remain in the corner (PVT) itself.

  ### POCV / SOCV / LVF
  Liberty Variation Format annotates per-arc **nominal delay + sensitivity / sigma** (and often slew/load dependence). Path slack becomes a statistical quantity:
  - Means add along a path
  - Independent random sigmas combine approximately as $\sigma_{\text{path}} \approx \sqrt{\sum \sigma_i^2}$ (tool-specific correlation models apply)
  - Signoff targets a quantile (e.g. mean + $k\sigma$) instead of pure corner stacking

  ### Practical comparison table

  | Method | What varies | Combination | Typical use |
  | :--- | :--- | :--- | :--- |
  | Flat OCV | Constant % | Min/max stack | Legacy / early floorplan |
  | AOCV | Depth/distance table | Still min/max, milder tables | Mid-node production |
  | POCV/LVF | Per-arc sigma | Statistical RSS + CRPR | Advanced FinFET signoff |

  ### Correlation rule of thumb
  Closing timing with flat 8–10% OCV then “hoping” AOCV/POCV will magically recover is backwards: choose the **signoff derate methodology first**, then budget architecture frequency.
- **Common pitfalls:**
  - Mixing AOCV tables from the wrong metal stack / voltage in MMMC.
  - Forgetting clock-path AOCV tables (data-only AOCV leaves clock skew over-pessimistic).
  - Treating POCV “mean path” reports as if they were GBA worst-corner numbers.
- **Interviewer follow-ups:**
  - How do you validate AOCV/POCV tables against silicon / ring-oscillator correlation?
  - What breaks if hierarchical ILMs were characterized under flat OCV but top-level signs off POCV?
- **Tags:** aocv, pocv, lvf, socv, derate, variation, mmmc

---

### Q03. Graph-based (GBA) vs path-based (PBA) analysis
- **Suggested id:** `sta-19`
- **Difficulty:** Hard
- **Company style:** Apple / Broadcom
- **Round:** Onsite Deep-Dive
- **Question:**
  Explain why graph-based analysis (GBA) is pessimistic versus path-based analysis (PBA). Give a concrete slew-propagation example where GBA reports negative slack but PBA recovers, and state when you *must not* waive GBA violations solely because PBA is green.
- **Short answer:**
  GBA stores one worst slew/arrival per node for *all* fanouts, so a side-path’s horrible slew can poison the critical path’s arc delay. PBA re-propagates slew along each path individually. PBA is the right recovery tool for slew-poisoned endpoints, but never for missing constraints, DRV failures, or physical SI that PBA wasn’t configured to see.
- **Detailed answer:**
  ### GBA mechanics
  At each pin, the timer keeps:
  - Worst (latest) arrival for setup
  - Worst slew (usually slowest) used to index Liberty delay tables for *every* outgoing arc

  If net $N$ fans out to a lightly loaded critical flop **and** a huge poorly buffered side load, GBA may use the slow slew from the side-load transition to evaluate the critical arc → inflated $T_{\text{cq}}$ / combo delay → **false** WNS.

  ### PBA mechanics
  For a selected path (or path group), the tool:
  1. Recomputes slew along *that* path’s arcs only
  2. Re-evaluates Liberty delays with path-specific slew/load
  3. Often re-applies CRPR / AOCV with path-specific stage counts

  Result: critical path sees its true fast slew → recovered slack.

  ### When PBA recovery is legitimate
  - Endpoint fails GBA by tens of ps, PBA recovers after slew re-prop
  - Path is real (not false), clocks constrained, SI mode consistent
  - You re-run PBA after ECO because slew topology changed

  ### When “PBA green” is a trap
  - **Constraint bugs** (missing clock, wrong multicycle) — PBA won’t invent correctness
  - **Max-transition / capacitance DRVs** still fail even if slack recovers
  - **Hold** at min corner with SI — PBA without crosstalk can lie
  - Selective PBA on 100 paths while 50k GBA violators remain — not tapeout signoff

  ### Signoff policy (staff answer)
  Use GBA for optimization and full-chip triage; use exhaustive or “PBA on failing endpoints” for recovery **with a documented delta budget** (e.g. allow ≤X ps GBA→PBA recovery, else fix physically).
- **Snippet:**
  ```tcl
  # Conceptual Tempus / PT flow:
  report_timing -max_paths 200           ;# GBA
  report_timing -path_type full -pba_mode exhaustive  ;# tool-specific PBA switch
  ```
- **Common pitfalls:**
  - Running PBA before clocks are propagated / before SI is enabled.
  - Comparing GBA WNS from view A to PBA WNS from view B.
- **Interviewer follow-ups:**
  - How does path-based AOCV depth differ from graph-based depth?
  - Incremental PBA vs exhaustive PBA — runtime vs risk?
- **Tags:** gba, pba, slew-propagation, pessimism, signoff-policy

---

### Q04. SI / crosstalk delta delay and glitch
- **Suggested id:** `sta-20`
- **Difficulty:** Staff / Principal
- **Company style:** Broadcom / Nvidia
- **Round:** Onsite Deep-Dive
- **Question:**
  Deconstruct signal-integrity timing: what is crosstalk **delta delay** on a victim net, how do aggressor switching windows create setup vs hold hits, and when does SI analysis report a **glitch** rather than a delay change? Outline a physical ECO ladder when SI delta dominates cell delay.
- **Short answer:**
  Capacitively coupled aggressors inject current into the victim, speeding or slowing its transition (delta delay) depending on relative direction and overlap of switching windows. Setup is hurt by late-increasing delta on data or clock shrink; hold is hurt by early-decreasing data delay or clock push-out. A glitch is a noise pulse that can falsely trigger a latch/async pin even if delay slack is positive.
- **Detailed answer:**
  ### Delta delay physics
  Victim net transition sees effective capacitance:
  - **Same-direction** aggressor switch → Miller-like reduction → **faster** victim (hold risk on data paths)
  - **Opposite-direction** aggressor switch → inflated $C_{\text{eff}}$ → **slower** victim (setup risk)

  STA folds this into an incremental delay $\Delta_{\text{xtalk}}$ annotated on the victim arc after parasitic extraction + aggressor filtering.

  ### Switching windows
  Tools need arrival windows on aggressors. Infinite windows (unknown) → maximum pessimism. Clock uncertainty, false paths, and multicycle exceptions reshape windows; **wrong exceptions create wrong SI**.

  ### Glitch vs delta delay
  - **Delta delay**: monotonic transition slowed/sped — classical setup/hold math.
  - **Glitch / noise**: pulse height vs receiver noise immunity / $V_{\text{IL}}$/$V_{\text{IH}}$; critical on:
    - Async set/reset
    - Latch enables / clock pins
    - Narrow pulses feeding ICG EN paths

  ### ECO ladder (when $\Delta_{\text{xtalk}}$ dominates)
  1. **Spacing / double-spacing** victim vs worst aggressors (NDR)
  2. **Shielding** with VDD/VSS rails
  3. **Buffering** to harden slew (faster edges → less vulnerable window, but watch aggressor creation)
  4. **Layer promotion** (fatter upper metal, lower R, often less relative coupling %)
  5. **Aggressor timing** — useful skew or schedule so aggressors miss victim window (advanced)
  6. Last resort: logic ECO to break coupling-critical topology

  ### Report hygiene
  Always separate “cell delay vs net delay vs SI delta” columns. If SI delta is 40% of path delay, upsizing every gate is cargo cult.
- **Common pitfalls:**
  - Closing SI-unaware timing then enabling SI at the last week.
  - Fixing victim drive strength into a wall of unfixed aggressors (you become the aggressor elsewhere).
- **Interviewer follow-ups:**
  - How do incremental SI updates interact with ECO routing?
  - Difference between CCSN noise libraries and older NLDM noise models?
- **Tags:** crosstalk, si, delta-delay, glitch, ndr, shielding

---

### Q05. Latch-based design and time borrowing
- **Suggested id:** `sta-21`
- **Difficulty:** Hard
- **Company style:** Apple / AMD
- **Round:** Onsite Technical Round 1
- **Question:**
  For a positive level-sensitive latch transparent while clock=1, explain **time borrowing**: when is borrowing legal, how does the borrow amount appear in STA reports, and how do you constrain max borrow so you don’t steal the entire next half-cycle?
- **Short answer:**
  If data arrives after the latch opening edge but before the closing edge, the latch still captures — the lateness is **borrowed** from the next stage’s timing budget. STA shows reduced slack on the downstream path. Illegal borrow past the closing edge is a setup failure at the latch; unbounded borrow without `set_max_time_borrow` (or equivalent) can hide architectural cycle theft.
- **Detailed answer:**
  ### Transparency window
  For an active-high latch:
  - Opens on rising edge (or after $T_{\text{dq}}$ opening)
  - Closes on falling edge

  Data arriving at $t_{\text{arr}}$ relative to the opening edge:
  - If $t_{\text{arr}} \le 0$ (before open + setup-to-open modeling): no borrow
  - If $0 < t_{\text{arr}} < T_{\text{high}} - T_{\text{su,latch}}$: **legal borrow** $B = t_{\text{arr}}$
  - If past closing setup: **latch setup fail**

  ### Cycle math intuition
  Phase 1 combinational logic may use up to half-cycle + borrow into Phase 2. Phase 2 then has only half-cycle − borrow left. Borrow is a **zero-sum** transfer, not free performance.

  ### STA controls
  - `set_max_time_borrow` limits optimistic architectural stealing
  - Pulse-width / duty-cycle constraints bound the transparency window
  - Mixed flop-latch pipelines need explicit exceptions — default flop equations mis-model latches

  ### Why interviewers love this
  Candidates who only memorize edge-triggered $T \ge T_{\text{cq}}+T_{\text{logic}}+T_{\text{su}}$ fail latch questions. Staff candidates discuss closing-edge setup, borrow reports, and duty-cycle sensitivity (jitter eats borrow budget first).
- **Snippet:**
  ```tcl
  set_max_time_borrow 0.150 [get_pins u_pipe/*/LAT*/D]  ;# 150 ps cap
  report_timing -through [get_pins u_pipe/u_lat/Q]
  ```
- **Common pitfalls:**
  - Treating latch Q like a flop Q edge-triggered arrival.
  - Ignoring that hold for latches is often checked to the **opening** edge / transparency start.
- **Interviewer follow-ups:**
  - How does useful skew on latch clocks differ from flop useful skew?
  - Borrow across voltage islands with level shifters in the transparent path?
- **Tags:** latch, time-borrow, transparency, duty-cycle, set_max_time_borrow

---

### Q06. Non-sequential data checks (`set_data_check`)
- **Suggested id:** `sta-22`
- **Difficulty:** Hard
- **Company style:** Qualcomm / TI
- **Round:** Technical Phone Screen
- **Question:**
  When do you use `set_data_check` instead of a flop setup/hold check? Give examples (clock-mux select vs clocks, analog enable vs data, memory latch self-timed interfaces). Write the setup/hold data-check forms and explain why forgetting the related clock / `-clock` association creates silent escapes.
- **Short answer:**
  Data checks constrain **pin-to-pin** relationships that are not implied by sequential library arcs — e.g. select stable before muxed clocks switch. `set_data_check -from A -to B -setup Ts` requires A to be stable Ts before B switches (setup-like); hold form requires A to remain stable after B. Without proper clock association, the check may be timed in the wrong mode or dropped.
- **Detailed answer:**
  ### Why library arcs aren’t enough
  Liberty timing arcs cover characterized cell behavior. Chip-level **intentional** constraints between arbitrary pins (RTL mux controls, soft-macro self-timed enables, DFT mode pins) often have **no** arc. SDC data checks close that hole.

  ### Canonical forms
  ```tcl
  # Setup-like: constrained_pin must be ready BEFORE related_pin edge
  set_data_check -from [get_pins u_mux/S] -to [get_pins u_mux/CLK0] -setup 0.20

  # Hold-like: constrained_pin must remain stable AFTER related_pin edge
  set_data_check -from [get_pins u_mux/S] -to [get_pins u_mux/CLK0] -hold 0.05
  ```

  Semantics (tool-documented carefully): setup data check fails if the “from” signal arrives too late relative to the “to” transition; hold fails if it changes too soon after.

  ### Industrial examples
  1. **Glitch-free clock mux**: select one-hot / select stable vs old/new clock edges
  2. **Async FIFO gray pointer** sampled by companion logic with explicit separation
  3. **Memory compiler** pins: `CLK` vs `WEN`/`ADDR` when .lib arcs incomplete at chip wrap
  4. **Analog IP digital wrapper**: freeze/enable vs toggling data

  ### Silent escape modes
  - Data check declared but clocks ideal / wrong — check never arms
  - `-clock` omitted in multi-clock cones — ambiguous related edge
  - Check marked false by aggressive `set_false_path -to` covering the same pins
  - Only setup data check coded; hold race on select still silicon-real
- **Common pitfalls:**
  - Using `set_max_delay` as a lazy substitute without understanding edge directionality.
  - Duplicating a check that already exists as a Liberty non-seq arc → double constraint / confusion.
- **Interviewer follow-ups:**
  - How do data checks appear in QoR vs regular path groups?
  - Interaction with CPPR when both pins are clock-network endpoints?
- **Tags:** set_data_check, non-sequential, clock-mux, sdc, interface-constraints

---

### Q07. Recovered / removal checks on async set-reset
- **Suggested id:** `sta-23`
- **Difficulty:** Hard
- **Company style:** Nvidia / AMD
- **Round:** Onsite Technical Round 1
- **Question:**
  Define **recovery** and **removal** timing checks for asynchronous clear/preset. Why can a design meet all sync setup/hold yet still fail recovery? How do you constrain async resets properly in STA (including synchronized deassertion)?
- **Short answer:**
  Recovery is the minimum time between async pin release (inactive edge) and the next active clock edge — like setup for async→sync handoff. Removal is the minimum time async must remain asserted after a clock edge — like hold. Most silicon bugs are **async deassertion** releasing near a clock edge, putting flops into metastability even when D-pin timing is clean.
- **Detailed answer:**
  ### Definitions
  - **Recovery** ($T_{\text{rec}}$): async control must be **released** at least $T_{\text{rec}}$ before the capturing clock edge so the flop is cleanly in functional mode.
  - **Removal** ($T_{\text{rem}}$): async control must not release too soon after a clock edge (analogous to hold vs clock).

  ### Why sync-only STA misses it
  Classic R2R reports ignore async pins unless recovery/removal arcs exist in Liberty **and** the async network is timed (not set_false_path’d carelessly). Teams often:
  ```tcl
  set_false_path -to [get_pins */CLR]   ;# DANGER if used to hide recovery
  ```
  which silences the exact check that prevents reset-exit metastability.

  ### Correct architecture
  1. Assert async reset asynchronously (OK for init)
  2. **Deassert synchronously** through a reset synchronizer in each clock domain
  3. STA: time recovery from synchronizer Q to fanout flops’ async pins **or** prefer sync-only reset flops (`sync clear`) so recovery becomes ordinary setup

  ### Constraint sketch
  Prefer library recovery arcs. If custom:
  - Don’t blanket false-path async pins
  - Use timed reset trees with explicit uncertainty
  - Separate power-on reset vs functional soft reset modes in MMMC
- **Common pitfalls:**
  - Buffering reset trees for skew without re-checking recovery at leaves.
  - One global async reset deasserted into 12 PLLs’ domains without per-domain synchronizers.
- **Interviewer follow-ups:**
  - How do scan-reset and functional-reset interact in DFT modes?
  - Removal failures after useful-skew CTS — what changed?
- **Tags:** recovery, removal, async-reset, metastability, reset-synchronizer

---

### Q08. Minimum pulse width & clock gating checks
- **Suggested id:** `sta-24`
- **Difficulty:** Hard
- **Company style:** Qualcomm / Arm
- **Round:** Onsite Deep-Dive
- **Question:**
  Explain **minimum pulse width** (high and low) checks on clocks and on ICG outputs. How do high-frequency + high OCV + poor duty cycle create MPW failures even when setup WNS is positive? What is a **clock gating check** (setup/hold on ICG EN vs CK), and how does it differ from a data setup to a flop?
- **Short answer:**
  MPW ensures CK high/low phases at the pin meet Liberty `min_pulse_width`. Duty-cycle distortion, slow slew, and asymmetric derates shrink the effective pulse until flops/ICGs fail functionally. Clock gating checks ensure enable is stable around the sampling edge of the ICG so the gated clock doesn’t glitch — polarity depends on latch-based ICG architecture (typically EN setup to falling edge for neg-latch ICG).
- **Detailed answer:**
  ### Min pulse width
  For period $T$ and duty $d$ (high fraction):
  $$
  T_{\text{high}} = d\,T,\quad T_{\text{low}} = (1-d)\,T
  $$
  After network latency asymmetry, OCV, and slew degradation at the leaf:
  $$
  T_{\text{high,eff}} < T_{\text{MPW,high}} \Rightarrow \text{MPW fail}
  $$
  Failures show up first on:
  - Generated divide-by-2 clocks with skinny OR/AND logic
  - Gated clocks after ICG with slow EN→GCK arcs
  - Clock mux outputs

  Setup can still be green because setup uses full period edges; MPW is a **separate functional correctness** check.

  ### Clock gating check
  Neg-latch ICG (common): latch opens on CK=0, samples EN, ANDs with CK.
  - **Setup** on EN: must be stable before latch close (rising CK) by $T_{\text{su,EN}}$
  - **Hold** on EN: must remain stable after latch open appropriately

  This is *not* the same as D-pin setup to the gated register — it’s a check **at the ICG cell** preventing runt pulses on GCK.

  ### Debug ladder
  1. `report_min_pulse_width` / clock pulse reports
  2. Inspect duty at PLL vs at leaf (CTS insertion asymmetry)
  3. ICG placement: EN logic depth vs CK arrival (gating check fails)
  4. Don’t “fix path” EN — fix logic or use sync enable alignment
- **Snippet:**
  ```tcl
  report_clock_timing -type pulse_width
  report_timing -to [get_pins u_icg/EN]   ;# gating check path
  set_clock_latency -source ...           ;# won't fix MPW alone
  ```
- **Common pitfalls:**
  - Fixing MPW by increasing uncertainty (doesn’t widen pulse).
  - Upsizing flop CK pins without fixing upstream ICG pulse.
- **Interviewer follow-ups:**
  - How does POCV change MPW reporting vs flat OCV?
  - Interaction of clock gating checks with multicycle EN updates?
- **Tags:** min-pulse-width, mpw, icg, clock-gating-check, duty-cycle

---

### Q09. Reconvergent fanout pessimism (RFP) beyond classic CRPR
- **Suggested id:** `sta-25`
- **Difficulty:** Staff / Principal
- **Company style:** Intel / Google Silicon
- **Round:** Hiring Manager Round
- **Question:**
  Classic CRPR removes pessimism on a **shared clock** trunk. Explain **reconvergent fanout pessimism** on the **data** path (or mixed data/clock reconvergence): why graph-based min/max can still be overly pessimistic when two branches diverge and reconverge, and what modern timers do (path-based reconvergence / physical correlation / POCV) to avoid leaving performance on the table—or worse, over-fixing.
- **Short answer:**
  When a signal splits and later reconverges, GBA may pair a late arrival from branch A with an early slew or side status from branch B as if both extremes coexist. That correlation is illegal. Path-based analysis, reconvergence pessimism removal options, and statistical POCV reduce this; blindly waiving without proving mutual exclusivity of extremes is how chips escape.
- **Detailed answer:**
  ### Clock CRPR vs data reconvergence
  - **CRPR**: same physical clock cells cannot be late and early together.
  - **Data RFP**: a fanout net drives two cones that meet at a gate/mux; GBA’s node-hardening can imply inconsistent extremes on the shared prefix.

  Example: common logic $X$ fans out to path $X\to A\to Z$ and $X\to B\to Z$. GBA at $Z$ might combine late arc through $A$ with a slew assumption poisoned by $B$’s load, or apply derates as if $X$ were simultaneously at two PVT extremes feeding both branches.

  ### Mitigations
  1. **PBA** on the specific reconvergent endpoint — path-consistent slew/derate
  2. **POCV** — shared prefix variance counted once in statistical combination
  3. Tool settings for **data path reconvergence pessimism removal** (vendor-specific; know your timer)
  4. Physical: buffer/clone to isolate critical branch from poison fanout (also helps SI)

  ### Staff judgment
  Interviewers want you to say: “I quantify GBA→PBA recovery attributable to reconvergence, confirm SI and constraints are clean, then either accept bounded PBA credit or clone/buffer the critical leg.” Not: “RFP means always disable derates.”
- **Common pitfalls:**
  - Calling every GBA→PBA delta “CRPR” when the clock tree doesn’t even reconverge.
  - Fixing with `set_timing_derate 1.0` globally to hide RFP.
- **Interviewer follow-ups:**
  - How do mux select case_analysis values interact with reconvergent pessimism?
  - Does useful skew create new reconvergent clock pairs that change CRPR credit overnight?
- **Tags:** reconvergence, rfp, gba-pba, pocv, pessimism-removal, correlation
