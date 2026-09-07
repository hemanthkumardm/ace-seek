# Power Integrity & Dynamic IR Drop

Domain: `power-integrity-ir`  
New questions: **25** (`ir-01` … `ir-25`)

---

### Q01. Static IR Drop Fundamentals
- **Suggested id:** `ir-01`
- **Difficulty:** Medium
- **Company style:** Intel / AMD PDN
- **Round:** Technical Phone Screen
- **Question:**
  Define static IR drop. Write the simple resistive model for a power grid node and explain why worst-case static IR is usually reported at max average current corners, not peak transient.
- **Short answer:**
  Static IR is the DC voltage loss $V_{\text{drop}}=I_{\text{avg}}R_{\text{eff}}$ from package bumps/pads to instance pins under sustained average current. It ignores $L\,di/dt$ and time-varying switching; dynamic analysis covers those.
- **Detailed answer:**
  For a rail segment: $\Delta V = IR$ with $R$ the effective resistance through straps, mesh, vias, and bumps. Instance pin voltage:
  $$V_{\text{pin}} = V_{\text{source}} - I_{\text{path}} R_{\text{path}}$$
  Static vectorless / average-power flows use instance duty-averaged currents from VCD/SAIF or vectorless activity annotations. Because inductance drops out at DC ($\omega L \to 0$), static IR underestimates high-frequency droop — it is necessary but not sufficient signoff.

  Typical budgets: few % of $V_{DD}$ (e.g. 1–2% static on a 0.75 V rail ⇒ 7.5–15 mV). Hotspots cluster at high-power macros far from bumps or in resistive via bottlenecks.
- **Common pitfalls:**
  - Treating static IR as full PDN signoff.
  - Using peak instantaneous current inside a pure DC solver.
- **Interviewer follow-ups:**
  - How does temperature enter $R(T)$?
  - Why might hold timing worsen when $V$ rises (less IR) at fast corners?
- **Tags:** static-ir, ohms-law, average-current, pdn

---

### Q02. Dynamic IR and $L\,di/dt$
- **Suggested id:** `ir-02`
- **Difficulty:** Hard
- **Company style:** Apple / Qualcomm
- **Round:** Onsite Technical Round 1
- **Question:**
  Derive why package inductance dominates first-droop behavior. Write the inductive voltage term and relate di/dt to simultaneous switching.
- **Short answer:**
  $v_L = L_{\text{pkg}}\frac{di}{dt}$. Fast current steps from clock-edge simultaneous switching see package/BGA loop inductance before on-die decap can respond through its own $R$/$L$, causing first droop.
- **Detailed answer:**
  Full rail loop:
  $$V_{\text{die}}(t) = V_{\text{reg}} - i(t)R - L\frac{di}{dt} - \text{(distributed RC mesh effects)}$$
  At a clock edge, thousands of flops toggle within tens of ps ⇒ large $di/dt$. Even micro-ohms of $R$ may be secondary to $L\,di/dt$ for the first ~100 ps–ns.

  **First droop:** inductive, package-dominated, partially filled by local MOS decap.  
  **Second/third droop:** mid-board / VRM resonance after charge is depleted from mid-frequency caps.

  Mitigation: more bump/C4 inductance reduction (more power balls, shorter loops), on-die decap, staggered enable / clock spreading, package decap.
- **Common pitfalls:**
  - Blaming only sheet resistance for GHz first droop.
  - Ignoring return-path inductance (power **and** ground loops).
- **Interviewer follow-ups:**
  - How does backside power delivery change $L$?
  - Clock gating “storms” when a big domain wakes — IR signature?
- **Tags:** dynamic-ir, inductance, first-droop, ssi

---

### Q03. Decap Effective Radius
- **Suggested id:** `ir-03`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  What is “decap radius”? Why does a MOS decap 200 µm away fail to help a 20 ps current spike at a CPU ALU?
- **Short answer:**
  Charge must travel through resistive (/inductive) grid; the RC time and IR along the path limit the distance from which charge arrives in time. Effective radius shrinks as transient edge rates get faster.
- **Detailed answer:**
  Model path as $R_{\square}$ mesh: time to deliver charge scales with $R_{\text{path}}C$ and the allowable $\Delta V$. For a pulse width $t_p$, only decap within distance where propagation/RC delay $\lesssim t_p$ participates.

  Rough intuition: higher metal resistivity or sparse straps ⇒ smaller radius; denser power mesh + via pillars ⇒ larger useful radius. Intrinsic gate cap of nearby logic also acts as “free” decap but collapses when that logic is also switching.

  Placement rule: sprinkle intentional decap (filler MOS caps / MIM) inside high $di/dt$ regions, not only in chip corners.
- **Common pitfalls:**
  - One big decap farm at chip edge for all cores.
  - Assuming package caps help 10 ps edges (they don’t — too much $L$).
- **Interviewer follow-ups:**
  - How do you measure effective radius in Voltus/RedHawk movies?
  - Tradeoff: decap area vs routing / device density.
- **Tags:** decap-radius, rc-delay, local-charge

---

### Q04. Electromigration and Black’s Equation
- **Suggested id:** `ir-04`
- **Difficulty:** Hard
- **Company style:** foundry signoff
- **Round:** Onsite Deep-Dive
- **Question:**
  State Black’s equation for MTTF under electromigration. How do IR-driven current densities couple to EM signoff? Distinguish power-EM vs signal-EM.
- **Short answer:**
  $$\text{MTTF} = \frac{A}{j^n}\exp\left(\frac{E_a}{kT}\right)$$
  Higher $|j|$ from aggressive IR recovery (narrow straps) kills lifetime. Power rails see mostly DC / unipolar stress; signal nets see bidirectional recovery.
- **Detailed answer:**
  $j$ = current density, $n$≈1–2 (foundry-specific), $E_a$ activation energy, $T$ absolute temperature. Because lifetime $\propto 1/j^n$, a 20% current density increase can slash lifetime by ~1.4–1.5× (for $n=2$, $1.2^2=1.44$).

  **Power EM:** sustained average / RMS currents in VDD/VSS; blech length and via downstream effects matter.  
  **Signal EM:** often peak RMS over switching; reverse-recovery pulse helps.

  Design trade: widen straps / add vias to cut $R$ (helps IR **and** $j$) vs area. Peak transient currents used for IR must be reconciled with average used for EM — don’t mix metrics blindly.
- **Common pitfalls:**
  - Using peak transient $I$ as EM DC average.
  - Ignoring temperature acceleration in hotspots near voltage droop regions (thermal ↔ EM coupling).
- **Interviewer follow-ups:**
  - What is Blech length / immortality?
  - Via array downstream voiding vs line EM.
- **Tags:** blacks-equation, electromigration, current-density

---

### Q05. Package Inductance and Bump Pattern
- **Suggested id:** `ir-05`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  How does C4/BGA bump allocation between PWR/GND and signals set package loop inductance? Give a qualitative formula for many parallel bumps.
- **Short answer:**
  Loop inductance falls roughly as bumps are added in parallel: $L_{\text{eq}} \approx L_{\text{bump}}/N_{\text{eff}}$ with mutual terms. Dense checkerboard PWR/GND minimizes loop area vs clustered power-only regions.
- **Detailed answer:**
  Single bump partial inductance is small, but the **loop** (PWR bump → die → GND bump → package plane) dominates. Increasing $N$ parallel PWR/GND pairs:
  $$L_{\text{loop,eq}} \sim \frac{L_{\text{single}}}{N} + L_{\text{mutual redistribution}}$$
  Spreading power bumps under high-current blocks beats dumping all PWR balls on one edge (lateral die metallization then dominates).

  Field solvers (package PI tools) extract S-parameter / RLC models consumed by chip-PDN co-sim.
- **Common pitfalls:**
  - Counting PWR bumps without matching GND return bumps.
  - Ignoring package plane discontinuities / antipads.
- **Interviewer follow-ups:**
  - Fan-out wafer-level packaging vs BGA inductance.
  - Why core VDD often needs dedicated ball maps separate from IO.
- **Tags:** package-l, c4, bump-map, loop-inductance

---

### Q06. PDN Target Impedance
- **Suggested id:** `ir-06`
- **Difficulty:** Hard
- **Company style:** system PI / Voltus
- **Round:** Onsite Deep-Dive
- **Question:**
  Derive the PDN target impedance $Z_{\text{target}}$. How do you use a $Z(f)$ plot against this target?
- **Short answer:**
  $$Z_{\text{target}}(f) = \frac{V_{DD}\cdot (\text{allowed ripple fraction})}{I_{\text{transient}}}$$
  Keep $|Z_{\text{pdn}}(f)| \le Z_{\text{target}}$ across the band where load current has energy (clock harmonics, burst spectra).
- **Detailed answer:**
  If allowable droop is $\Delta V = \kappa V_{DD}$ (e.g. $\kappa=5\%$) under current step $\Delta I$:
  $$Z_{\text{target}} = \frac{\Delta V}{\Delta I} = \frac{\kappa V_{DD}}{\Delta I}$$
  Example: $V_{DD}=0.75\,\text{V}$, $\kappa=0.05$, $\Delta I=10\,\text{A}$ ⇒ $Z_{\text{target}}=3.75\,\text{m}\Omega$.

  $Z(f)$ shows capacitive roll-off, package resonance peaks, VRM inductive rise. Peaks above $Z_{\text{target}}$ predict frequency-aligned droop. Fix with staged decap (bulk → mid → HF → on-die) damping the resonance.
- **Common pitfalls:**
  - Single $Z_{\text{target}}$ number without frequency context.
  - Using average $I_{\text{dd}}$ instead of transient $\Delta I$.
- **Interviewer follow-ups:**
  - How does DVFS change $Z_{\text{target}}$?
  - Impedance sensing / adaptive voltage for margin recovery.
- **Tags:** z-target, pdn-impedance, frequency-domain

---

### Q07. Early vs Late Rail Analysis (Voltus-Style)
- **Suggested id:** `ir-07`
- **Difficulty:** Hard
- **Company style:** Cadence Voltus
- **Round:** Onsite Technical Round 1
- **Question:**
  Contrast early (pre-route / prototype) vs late (post-route signoff) power integrity analysis. What fidelity do you gain at each stage?
- **Short answer:**
  Early: coarse PG, vectorless / estimated tech — catches floorplan / bump / strap issues. Late: extracted SPEF+PG parasitics, real switching windows — signoff IR/EM with instance-level accuracy.
- **Detailed answer:**
  **Early rail:** uses floorplan power domains, planned mesh density, sticky bump maps, default activity. Purpose: resize straps, move macros, add package balls before routing investment.

  **Late rail:** consumes routed PG + instance placement + SPEF + timing windows / VCD. Captures via starvation, local pinch-offs, dynamic hotspot movies. Signoff ECO: add straps, vias, decap fillers, reduce local density.

  Methodology mistake: skipping early analysis then discovering bump starvation after tapeout-level routing.
- **Common pitfalls:**
  - Believing prototype IR numbers are signoff-correlated without calibration.
- **Interviewer follow-ups:**
  - What is a “power movie” / cycle-based dynamic plot?
  - How do you correlate silicon vs tool (sense points)?
- **Tags:** voltus, early-rail, late-rail, methodology

---

### Q08. Backside Power Delivery Intuition
- **Suggested id:** `ir-08`
- **Difficulty:** Staff / Principal
- **Company style:** Intel PowerVia / TSMC BSPDN
- **Round:** Onsite Deep-Dive
- **Question:**
  Explain backside power delivery (BSPDN / PowerVia) intuition: what IR/EM problems does it solve, and what new constraints appear?
- **Short answer:**
  Move PWR/GND to wafer backside with through-silicon vias so frontside metals free up for signals; vertical path shortens $R$/$L$ into standard cells. New issues: BSPDN alignment, thermal, backside EM, and ECO difficulty.
- **Detailed answer:**
  Frontside scaling starved power routes (thin locals, via resistance). Backside thick metals + nano-TSVs feed cells from below ⇒ lower static IR, more uniform voltage, better standard-cell pin access on frontside.

  Dynamic benefit: reduced lateral frontside travel ⇒ smaller effective loop for mid-frequency components. Still need package-level PI.

  Costs: process complexity, probe/test access, thermal path changes, design-rule decks for buried power rails (BPR) + backside metals, and tool readiness for extraction.
- **Common pitfalls:**
  - Claiming BSPDN eliminates package inductance.
  - Ignoring that signal return paths still matter.
- **Interviewer follow-ups:**
  - Buried power rail vs backside only — difference?
  - How does DFT / probe touchdown change?
- **Tags:** bspdn, powervia, buried-rail, advanced-nodes

---

### Q09. Voltage Droop vs Timing Slack
- **Suggested id:** `ir-09`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  How does a local voltage droop translate into setup (and sometimes hold) timing impact? Why is a flat STA derate insufficient for pathological hotspots?
- **Short answer:**
  Delay $\propto 1/(V-V_t)^\alpha$ roughly — droop slows launch/capture paths (setup risk). Hold can fail if clock path slows less than data short path, or at high-V fast corners. Flat OCV/AOCV derates miss spatially correlated IR hotspots.
- **Detailed answer:**
  Instance delay sensitivity $\partial d/\partial V$ is steep near low $V_{DD}$. A 30 mV local droop on a critical cone can burn tens of ps.

  **IR-aware STA:** annotate instance voltages from dynamic IR into timing engines (TEMPUS/PrimeTime with rail voltages) so path delays use local $V$.

  Flat derate applies uniform margin — overpessimistic globally, yet still optimistic on a 50 mV hotspot. Clock and data may see different voltages (clock spine vs datapath), creating differential effects.
- **Common pitfalls:**
  - Only applying IR margin to data paths, not clock uncertainty.
  - Using static IR voltages for a dynamic-limited design.
- **Interviewer follow-ups:**
  - Adaptive clocking / droop detectors that stretch clocks.
  - Path-based vs graph-based IR-aware timing.
- **Tags:** ir-aware-sta, droop, setup-hold, derate

---

### Q10. Power Grid Mesh vs Stripes
- **Suggested id:** `ir-10`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Compare sparse power stripes vs dense power mesh. When does each win for IR vs routing congestion?
- **Short answer:**
  Stripes: lower routing blockage on some layers, directional $R$ anisotropy. Mesh: lower $R_{\text{eff}}$ and better current spreading, higher track blockage. High-current cores usually need mesh or dense orthogonal straps.
- **Detailed answer:**
  Unidirectional wide stripes on upper layers feed down through stacked vias. Without orthogonal stitching, current must travel long lateral distances on resistive lower metals.

  Mesh (orthogonal M6/M7 etc.) equalizes potential, reduces hotspot gradients, helps EM by parallelizing paths. Cost: fewer signal tracks → congestion → detours → timing.

  Hybrid: dense mesh over CPUs, striped over lightly loaded IO, with rings at boundaries.
- **Common pitfalls:**
  - Copying mesh density chip-wide without congestion budgeting.
- **Interviewer follow-ups:**
  - How do you decide strap width vs pitch quantitatively?
  - Via ladder under stripes — role?
- **Tags:** power-mesh, stripes, congestion, ir

---

### Q11. Via Pillars / Via Arrays for PG
- **Suggested id:** `ir-11`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Why do stacked via pillars under power straps dominate IR even when upper metal is wide? How do you analyze via EM separately?
- **Short answer:**
  Via resistance is high and localized; a wide M7 strap bottlenecked by few M7→M6→…→M1 vias still sees large IR. Parallel via arrays cut $R$ and $j$.
- **Detailed answer:**
  $$R_{\text{stack}} = \sum_i R_{\text{via},i}$$
  If $N$ vias in parallel, $R_{\text{stack}}/N$. Missing vias after DRC cleanup create “via starvation” hotspots visible in rail maps as speckles under macros.

  EM: each via has a max average current; tools report via EM separately from metal EM. Downstream via effects and current crowding at corners need foundry rules.

  ECO: insert via ladders, widen landing pads, forbid signal routing that deletes PG vias.
- **Common pitfalls:**
  - Widening straps without adding vias (false fix).
  - Allowing filler/decap to block via legalization sites.
- **Interviewer follow-ups:**
  - Double-cut vs single-cut via reliability.
  - Via pillar construction in Innovus PG commands.
- **Tags:** via-pillar, via-em, stacked-via, ir-bottleneck

---

### Q12. Inrush Current and Power-Gating Wakeup
- **Suggested id:** `ir-12`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  A power-gated island wakes through header switches. What causes inrush, how does it droop the always-on rail, and how do daisy-chained / weak-strong switch sequences help?
- **Short answer:**
  Discharged domain cap $C_{\text{island}}$ charges through headers: $i \approx C\,dV/dt$. Large simultaneous enable ⇒ huge inrush into shared package PDN ⇒ global droop. Sequence weak then strong switches / staggered enables to limit $di/dt$.
- **Detailed answer:**
  Energy to charge: $E=\tfrac12 C V^2$. Peak inrush depends on switch Ron schedule and slew of enable.

  Controls:
  1. **Daisy-chain / sleep-FET staging:** turn on small headers first (precharge slowly), then large headers.
  2. **Inrush limiters** / closed-loop current control.
  3. **Stagger wake** of multiple islands.
  4. On-die sensors pause wake if droop detected.

  Analyze with power-up IR vectors; don’t only sign off steady functional modes.
- **Common pitfalls:**
  - Enabling all headers in one cycle for “fast wake” without PDN budget.
  - Forgetting retention clamps / isolation cell timing during ramp.
- **Interviewer follow-ups:**
  - How does UPF `power_switch` acknowledge (`ack`) interact?
  - Rush current into SRAM arrays specifically.
- **Tags:** inrush, power-gating, headers, wakeup

---

### Q13. Resonance and Mid-Frequency Droop
- **Suggested id:** `ir-13`
- **Difficulty:** Hard
- **Round:** Onsite Deep-Dive
- **Question:**
  Sketch a typical PDN impedance peak from package $L$ and die $C$. How can a repetitive current spectrum at that frequency cause large voltage ripple even if average IR looks fine?
- **Short answer:**
  Parallel resonance $f_r \approx 1/(2\pi\sqrt{L_{\text{pkg}}C_{\text{die}}})$ peaks $|Z|$. Periodic current at $f_r$ (e.g., bursty loops) excites ringing → second droop / sustained ripple.
- **Detailed answer:**
  Die capacitance and package inductance form a high-Q tank if ESR is low. Damping via intentional ESR or spread decap values flattens the peak.

  Time domain: after a current step, voltage rings at $f_r$. Frequency domain: harmonics of the workload aligning with $f_r$ are amplified by $Q$.

  Fixes: add mid-frequency package/PCB caps near resonance, reduce $L$, increase damping, scramble throttle patterns / DVFS dithering.
- **Common pitfalls:**
  - Only adding HF on-die decap (misses mid-band peak).
  - Over-damping with huge series R (hurts transient response).
- **Interviewer follow-ups:**
  - How do you measure $f_r$ on silicon?
  - Interaction with SSDM / clock modulation.
- **Tags:** resonance, second-droop, q-factor, pdn

---

### Q14. Types of On-Die Decap
- **Suggested id:** `ir-14`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Compare intrinsic device capacitance, intentional MOS decap fillers, and MIM/MOM decap for PDN. Pros/cons?
- **Short answer:**
  Intrinsic: “free” but vanishes when gates switch. MOS fillers: dense, leaky, voltage-dependent $C$. MIM/MOM: higher quality / less leakage, needs special layers and area, better HF.
- **Detailed answer:**
  | Type | Density | Leakage | Notes |
  |---|---|---|---|
  | Intrinsic gate/diff | High opportunistically | Functional | Unreliable under activity |
  | MOS decap cell | High | Gate leakage | Cheap fillers; thin-ox stress rules |
  | MOM | Medium | Low | Metal fingers; process friendly |
  | MIM | High quality | Low | Extra mask; excellent HF |

  Place intentional decap near hotspots; respect ESD / antenna / density rules. Thin-oxide decap may be disallowed on high-voltage rails.
- **Common pitfalls:**
  - Filling 100% with MOS decap → leakage power failure.
- **Interviewer follow-ups:**
  - Voltage dependence of MOS $C_{ox}$ under droop (capacitance collapses).
  - Decap ECO late in PG legalization.
- **Tags:** mos-decap, mim, mom, leakage

---

### Q15. Static vs Dynamic Signoff Corners
- **Suggested id:** `ir-15`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Which PVT / RC corners typically bound static IR, dynamic IR, and EM? Why are they not identical?
- **Short answer:**
  Static IR: high-$R$ (often hot + RC worst) with high average power. Dynamic: depends on edge rates / package $L$ (may be cold fast for $di/dt$). EM: hot, high average $j$. Different physics ⇒ different corners.
- **Detailed answer:**
  Resistance rises with temperature ⇒ hot corners hurt static IR & EM.  
  Dynamic first droop may be worse when switching is fastest (cold) even if $R$ is lower — $L\,di/dt$ dominates.  
  Foundry techfiles define EM corners (Temp, lifetime years, duty).

  Signoff matrix must explicitly list rail scenarios: vectorless stress, VCD hotspot, wakeup, DFT shift/capture power, etc.
- **Common pitfalls:**
  - One corner for all PI checks.
  - Using functional max-power vector that misses DFT capture storms.
- **Interviewer follow-ups:**
  - Why scan capture can be the dynamic IR limiter.
  - Aging / BTI interaction with Vmin under droop.
- **Tags:** corners, pvt, signoff-matrix, em

---

### Q16. Sense Points and Remote Sense
- **Suggested id:** `ir-16`
- **Difficulty:** Medium
- **Company style:** board + chip co-design
- **Round:** Hiring Manager Round
- **Question:**
  A VRM uses remote sense. Where should sense lines Kelvin-connect, and what IR illusion appears if sense is at the package edge while the hotspot is die-center?
- **Short answer:**
  Sense at the point-of-load you care about (die bumps / on-die sense). If sense is at a quiet package node, VRM regulates that node while die-center still droops — false confidence.
- **Detailed answer:**
  Kelvin sense excludes IR in delivery path from regulation loop. Wrong sense location ⇒ systematic offset. On-die PVT sensors / droop detectors complement VRM sense for fast local events the VRM cannot track (bandwidth limits).

  Board design: route differential sense tightly coupled, avoid injecting noise.
- **Common pitfalls:**
  - Single-ended noisy sense.
  - Sensing a lightly loaded domain while regulating a heavy one sharing the rail.
- **Interviewer follow-ups:**
  - Multi-phase VRM current share under asymmetric bump maps.
  - On-die digital LDO vs board VRM bandwidth partition.
- **Tags:** remote-sense, vrm, kelvin, system-pi

---

### Q17. Chip–Package–Board Co-Design
- **Suggested id:** `ir-17`
- **Difficulty:** Staff / Principal
- **Round:** Onsite Deep-Dive
- **Question:**
  Partition PDN design across die, package, and PCB. Which frequency band is each responsible for, roughly?
- **Short answer:**
  On-die: GHz / highest frequency. Package mid (≈10–200+ MHz depending). PCB bulk + VRM: kHz–low MHz. Caps staged to cover decades of frequency without impedance peaks.
- **Detailed answer:**
  Bode / $|Z(f)|$ handoff: each stage’s ESR/ESL shifts coverage. Gaps between stages create peaks. Co-sim with chip+pkg+board models prevents optimistic die-only analysis.

  Floorplanning bumps without PCB ball compatibility causes layer transition inductance spikes. Early collaborative ball maps are a program-level PI activity, not a late ECO.
- **Common pitfalls:**
  - Die team and board team optimizing $Z$ separately against inconsistent $Z_{\text{target}}$.
- **Interviewer follow-ups:**
  - How do you validate with frequency-domain reflectometry / VNA?
  - Interposer / EMIB / RDL power delivery twists.
- **Tags:** co-design, frequency-partition, pcb, package

---

### Q18. IR vs EM Tradeoffs When Narrowing Straps
- **Suggested id:** `ir-18`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Congestion forces you to narrow a power strap. What happens to IR and EM, and what compensatory knobs exist?
- **Short answer:**
  Narrower ⇒ higher $R$ (worse IR) and higher $j$ (worse EM). Compensate with more parallel straps, thicker upper layers, more vias, lower local power, or move bumps closer.
- **Detailed answer:**
  $R \propto 1/\text{width}$, $j = I/\text{area}$. Both degrade together when width drops — rare to hurt only one. Sometimes switching to a higher metal layer (thicker) restores both.

  If only peak IR fails but EM average is fine, dynamic fixes (decap, stagger) may suffice without widening — diagnose which check failed first.
- **Common pitfalls:**
  - Fixing IR with vias only while line $j$ still fails EM.
- **Interviewer follow-ups:**
  - Non-default rule widths / sparsing for DFM vs IR.
- **Tags:** tradeoff, strap-width, em, ir

---

### Q19. Droop Recovery Time Constant
- **Suggested id:** `ir-19`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  After a current step, voltage recovers with what time constants? How do adaptive clock generators use recovery time?
- **Short answer:**
  Multiple exponentials / rings: local RC (ps–ns), package resonance (ns–tens ns), VRM loop (µs). Adaptive clocks stretch period while $V$ is low, then release as sensors see recovery.
- **Detailed answer:**
  Local decap refill from neighbors: fast partial recovery. Package L-C ring: oscillatory. Board VRM feedback: slow.

  Droop detectors trigger instruction throttle or PLL/DLL freeze / stretch. Must avoid false triggers and ensure deterministic restart (formal on control FSMs).

  Timing analysis needs a mode covering stretched clocks if used for signoff credit — or treat as soft margin only.
- **Common pitfalls:**
  - Assuming VRM corrects GHz droop.
- **Interviewer follow-ups:**
  - Analog vs digital droop sensors.
  - Interaction with synchronizers when clock pauses.
- **Tags:** recovery, adaptive-clock, droop-detect

---

### Q20. Multi-Voltage Domain IR
- **Suggested id:** `ir-20`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Two voltage islands share package balls through split planes. How can activity in domain A induce droop in domain B? What isolation techniques exist?
- **Short answer:**
  Shared package/board inductance and finite plane impedance couple $di/dt$ noise. Isolate with separate balls/planes, ferrite/bead filters for analog, on-die LDOs, or carefully placed decoupling at the split.
- **Detailed answer:**
  Even with distinct on-die rails, package planes often share returns. Ground bounce is a common coupling path: domain A switching returns through shared GND inductance ⇒ $V$ reference moves for B.

  Sensitive analog / PLL supplies need dedicated balls + star returns. Digital cores can share more aggressively with budgeted crosstalk IR analysis.
- **Common pitfalls:**
  - Declaring domains isolated because UPF shows separate `supply_net` while balls are shared.
- **Interviewer follow-ups:**
  - Level shifter / isolation cell behavior during asymmetric droop.
  - Cross-domain EM on shared ground mesh.
- **Tags:** multi-voltage, coupling, gnd-bounce, isolation

---

### Q21. Redundant Vias and Reliability
- **Suggested id:** `ir-21`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Why do PG via arrays use redundant vias beyond pure resistance needs?
- **Short answer:**
  Yield and reliability: single-via voids from EM or process kill the connection; N+1 redundancy extends lifetime and reduces via resistance variance that creates IR outliers.
- **Detailed answer:**
  Foundries incentivize multi-cut vias with rule decks. For signal nets, double-cut improves yield; for PG, large arrays also cut $j$ per cut. Downstream voiding still possible — follow current-direction rules.

  Tools: via pillar optimization, `add_redundant_vias` style P&R commands with PG awareness so signal via insertion does not delete PG cuts.
- **Common pitfalls:**
  - Adding redundant signal vias that punch through and remove PG vias.
- **Interviewer follow-ups:**
  - Bar vias / long vias in advanced nodes.
- **Tags:** redundant-via, reliability, yield

---

### Q22. DFT Modes as Worst Dynamic IR Vectors
- **Suggested id:** `ir-22`
- **Difficulty:** Hard
- **Company style:** DFT + PI interaction
- **Round:** Onsite Deep-Dive
- **Question:**
  Why do shift and at-speed capture patterns often create worse dynamic IR than functional workloads? What mitigations exist (without abandoning coverage)?
- **Short answer:**
  Scan shifts many flops with high correlation; LOC capture launches wide switching. Functional gated clocks rarely toggle everything. Mitigate with low-power ATPG, fill-0/1/random control, staggered shift clocks, reduced chain activity, and IR-aware pattern rejection.
- **Detailed answer:**
  Shift: almost all scan flops switching at tester period with SE=1 — pathological toggle density.  
  Capture: at-speed dual pulses with wide enable → first-droop fails that look like delay defects (false failures).

  Mitigations: adjacent-fill, test scheduling, power-aware ATPG cost functions, on-chip clock control limiting active domains, decoupling DFT from functional Vmin assumptions (separate guard-bands).
- **Common pitfalls:**
  - Interpreting IR-induced capture fails as real delay defects.
- **Interviewer follow-ups:**
  - How do you correlate pattern fails with Voltus movies?
  - Shift vs capture power budgeting separately.
- **Tags:** dft-power, capture-ir, low-power-atpg

---

### Q23. Grid Resistance Extraction Fidelity
- **Suggested id:** `ir-23`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  What must a PG extractor capture that a signal SPEF flow might under-model for rail analysis?
- **Short answer:**
  Dense mesh reduction, via arrays, bump/RDL parasitics, package macro models, and accurate local pin→rail connectivity — not only lumped net C for timing.
- **Detailed answer:**
  Rail tools build a huge R (sometimes RL) network, reduce it, and stamp instance current sources. Missing micro-vias or wrong bump models skew hotspots. Frequency-dependent package S-parameters matter for dynamic.

  Validate with checksums: total power ≈ $\sum I\cdot V$, comparison to vectorless vs VCD totals, and unit-grid sanity tests.
- **Common pitfalls:**
  - Using signal SPEF alone as PDN model.
- **Interviewer follow-ups:**
  - Hierarchical vs flat rail analysis for SoCs.
  - Reduced-order modeling errors near resonance.
- **Tags:** extraction, pg-network, voltus, spef

---

### Q24. Vmin, Noise Margin, and Guard Bands
- **Suggested id:** `ir-24`
- **Difficulty:** Staff / Principal
- **Round:** Hiring Manager Round
- **Question:**
  Explain how product $V_{\min}$ guard-banding absorbs IR drop, aging, and tester-to-system differences. What happens if marketing wants to cut guard band by 20 mV?
- **Short answer:**
  $V_{\min}$ stack-up includes static/dynamic IR, sensor error, aging, PLL margins, and board tolerance. Cutting 20 mV requires proving PDN/timing/aging headroom or improving silicon (mesh, bins, adaptive schemes).
- **Detailed answer:**
  Typical stack: regulator tolerance + package IR + on-die static + dynamic first droop + aging + margin. Each owner must quantify. A 20 mV cut without PDN work shifts failures into the field (silent data corruption or hard fails under burst).

  Data-driven path: silicon shmoo under worst workloads, correlate droop sensors, then either reduce workload $di/dt$, improve PDN, or use adaptive voltage/clocking to reclaim margin safely.
- **Common pitfalls:**
  - Double-counting margins in STA and voltage stack.
  - Cutting only based on average IR reports.
- **Interviewer follow-ups:**
  - How do AVS / DVFS closed loops change the stack?
  - Automotive vs consumer guard-band philosophy.
- **Tags:** vmin, guard-band, productization, reliability

---

### Q25. Current Maps and ECO Prioritization
- **Suggested id:** `ir-25`
- **Difficulty:** Medium
- **Round:** Onsite Technical Round 1
- **Question:**
  You receive a dynamic IR hotspot map three days before tapeout. Outline a prioritized ECO checklist that maximizes droop reduction per day of effort.
- **Short answer:**
  (1) Via starvation under hotspot (2) local strap opens / pinched mesh (3) add decap fillers (4) shift bump/package if still open (5) only then logic throttle / timing re-budget. Verify each ECO with incremental rail runs.
- **Detailed answer:**
  Priority rationale: via/strap fixes remove root $R$ bottlenecks cheaply; decap helps dynamic; package ball changes are expensive/late; architectural throttle is last resort (PPA hit).

  Process: isolate whether hotspot is resistivity, inductance, or demand spike. Check DFT-only vs functional. Apply ECO, re-extract incremental PG, confirm no EM regressions, and re-time IR-aware paths near the ECO.
- **Common pitfalls:**
  - Sprinkling decap while vias are missing.
  - ECOs that break DRC density or antenna.
- **Interviewer follow-ups:**
  - How many incremental Voltus iterations fit in 72 hours?
  - Signoff waiver criteria when residual hotspot is non-timing-critical.
- **Tags:** eco, hotspot, methodology, tapeout
