# Physical Design (Floorplan, CTS, PnR)
- **Domain id:** `physical-design`
- **Existing in app:** 13
- **New in this doc:** 12
- **Target:** 25 total

> Top-up bank only. Suggested ids `pd-14` … `pd-25` fill gaps beyond the live app themes (WLM/PLE/iSpatial, Genus congestion reports, pad-ring assembly, hierarchical ILM/LEC, SRAM integration, ECO methodology overview). Prefer floorplan channels, macro abutment, blockages, CTS useful skew, NDRs, antenna, double patterning, filler/decap, spare cells, route guides, congestion hotspots, and power-grid stripes.

---

### Q01. Floorplan channels and soft vs hard blockages
- **Suggested id:** `pd-14`
- **Difficulty:** Hard
- **Company style:** Qualcomm / MediaTek
- **Round:** Onsite Technical Round 1
- **Question:**
  You inherit a floorplan where two tall SRAM stacks leave a 15 µm “channel” of standard-cell rows between them. Congestion is red after global route, and timing through the channel is failing. How do you decide among widening the channel, punching feedthrough blockages, adding soft routing blockages, or moving macros — and what is the difference between **placement** blockage and **routing** blockage in that channel?
- **Short answer:**
  Channels are scarce horizontal/vertical conduits for both cells and wires. Placement blockages stop std-cell packing (preserve white space for routes or buffers); routing blockages stop metal use (or specific layers). Soft blockages discourage but allow overflow; hard blockages are absolute. Fix root cause: macro spacing vs pin faces, layer budget, and buffer sites — don’t only inflate utilization targets.
- **Detailed answer:**
  ### Why channels form
  Abutted or narrowly spaced macros create corridors where:
  - All east-west nets between left/right logic must pass
  - Clock and power straps may also claim tracks
  - Buffer/inverter sites for long nets compete with random logic

  ### Blockage taxonomy (channel toolkit)

  | Type | Effect | Typical use in channel |
  | :--- | :--- | :--- |
  | Hard placement blockage | No std cells | Reserve pure routing conduit |
  | Soft placement blockage | Cells only if needed | Prefer keep-out, allow buffer insert |
  | Partial / density screen | Cap local utilization | Prevent packing solid walls of cells |
  | Hard routing blockage | No routes on listed layers | Protect analog / keep-out |
  | Soft routing blockage | Cost penalty | Detour non-critical nets |

  ### Decision ladder
  1. **Pin orientation**: Are SRAM data pins facing the channel? Rotate/flip macros before touching cell density.
  2. **Channel width vs metal pitch**: Estimate tracks needed ≈ net count × via/pin tax; compare to available tracks on preferred layers.
  3. If tracks insufficient → **widen channel** or **split macros** with a second conduit.
  4. If tracks OK but cells stuffed the channel → **soft/hard placement blockage** + explicit buffer box.
  5. Only then consider route guides / layer promotion for critical buses.

  ### Staff insight
  A “15 µm channel” that looks fine at floorplan review can be dead after power straps + M2 must-join + clock spine steal 40% of tracks. Always overlay PDN + CTS plan on channel cross-sections.
- **Common pitfalls:**
  - Hard-routing-blocking the only escape layer “to force upper metal” without leaving vias.
  - Fixing congestion with `set_congestion_options` alone while macros still kiss.
- **Interviewer follow-ups:**
  - How do halo vs keep-out margin differ from channel placement blockage?
  - When do you allow std-cell feedthroughs *under* macro overhang vs forbid them?
- **Tags:** floorplan, channel, blockage, macro-spacing, congestion

---

### Q02. Macro abutment, halos, and pin accessibility
- **Suggested id:** `pd-15`
- **Difficulty:** Hard
- **Company style:** Nvidia / Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  When is **macro abutment** (zero gap) acceptable versus mandatory halo/keep-out? Explain pin accessibility failures that abutment creates, how abutment interacts with well/tap and PODE rules at advanced nodes, and your checklist before approving a sea-of-SRAM floorplan.
- **Short answer:**
  Abutment saves area when facing sides have no pins / legal abutment rules in LEF and foundry deck. It is fatal when signal pins, soft-macro straps, or tap requirements need edge access. Halos reserve placement/routing margin for buffers and pin escape. Approve abutment only with LEF edge types, pin-side audits, and PDN continuity plans.
- **Detailed answer:**
  ### Abutment OK when
  - Facing edges are abutment-legal in abstract (usually power ring / no signal pins)
  - Foundry allows touching implants / continuous nwell as per deck
  - Escape routing for all ports still exists on open sides
  - MBIST / repair ports aren’t trapped inward

  ### Abutment not OK when
  - Data/address/control pins face each other → zero escape tracks
  - Need buffer sites for timing on macro-to-macro nets
  - Power mesh needs stitch columns between macros
  - Antenna diode / spare cell columns planned at edges

  ### Halo vs blockage
  - **Halo**: typically moves with macro; keeps std cells away from macro boundary
  - Sized by max buffer depth you expect near pins + DRC margin
  - Too large → artificial congestion elsewhere; too small → pin DRC and timing

  ### Sea-of-SRAM checklist
  1. Pin-side map (color-coded) before placement freeze
  2. Channel width math per bus
  3. Power strap alignment across abutments
  4. Tap / endcap / boundary cell insertion plan
  5. Test access (MBIST) and physical-only cells
- **Common pitfalls:**
  - Abutting because “utilization looked better” in a spreadsheet.
  - Forgetting that flipped macros reverse pin faces relative to channels.
- **Interviewer follow-ups:**
  - How do soft macros (hierarchical blocks) change halo strategy vs hard SRAM?
  - Via-ladder access on buried pin layers?
- **Tags:** macro-abutment, halo, keep-out, pin-accessibility, sram-floorplan

---

### Q03. Placement vs routing vs buffer blockages — full type map
- **Suggested id:** `pd-16`
- **Difficulty:** Medium
- **Company style:** Cadence / Broadcom
- **Round:** Technical Phone Screen
- **Question:**
  Give a field guide to blockage and region types used in Innovus-class tools: hard/soft placement blockages, partial placement blockages, routing blockages (layer-aware), screen/density screens, exclusive soft vs hard fences/regions, and **buffer-only** / **macro-only** areas. For each, one sentence on when you create it during the flow.
- **Short answer:**
  Placement controls *what cells* may sit somewhere; routing controls *which metals* may cross; regions/fences bind *which hierarchy* may sit somewhere. Use the lightest restriction that encodes intent — overusing hard blockages is how floorplans become unroutable or unoptimizable.
- **Detailed answer:**
  | Construct | Intent | When to create |
  | :--- | :--- | :--- |
  | Hard placement blockage | Absolutely no std cells | Analog keep-out, reserved routes, macro channels |
  | Soft placement blockage | Avoid cells unless optimizer needs | Preferential routing space near buses |
  | Partial placement blockage | Cap local density (e.g. 60%) | Hotspot smoothing pre-CTS |
  | Routing blockage (per layer) | Forbid metal | Mask shielded IP, ESD keep-outs |
  | Soft routing blockage | Expensive detour | Guide non-critical away from critical corridor |
  | Fence (hard) | Instances *must* stay inside | Hard partition physical boundary |
  | Region (soft) | Prefer inside | Gentle hierarchy clustering |
  | Buffer-only blockage/area | Only buffers/inverters | Long-net repeater corridors |
  | Macro keep-out / halo | No std cells near macro | Pin escape + DRC |

  ### Staff heuristic
  Encode **design intent**, not yesterday’s congestion screenshot. Blockages that immortalize a bad floorplan make every ECO worse.
- **Common pitfalls:**
  - Hard fencing a block smaller than its legal cell area + PDN.
  - Layer-all routing blockage left over from an old IP revision.
- **Interviewer follow-ups:**
  - Difference between `create_place_blockage` and density screens in your tool?
  - How do blockages interact with useful-skew buffer insertion?
- **Tags:** blockages, fences, regions, density-screen, buffer-box

---

### Q04. CTS useful skew — intentional clock scheduling
- **Suggested id:** `pd-17`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia / AMD
- **Round:** Onsite Deep-Dive
- **Question:**
  Define **useful skew**. Show with equations how delaying the capture clock (or advancing launch) can heal setup without a data-path ECO, what happens to hold, and how you *safely* enable useful skew in CTS (path groups, skew groups, bounds) without creating a hold disaster at min corner.
- **Short answer:**
  Useful skew deliberately imbalances clock arrivals to transfer slack from paths that have margin to paths that don’t. Setup: extra capture latency helps; extra launch latency hurts. Hold moves in the opposite direction — every ps of setup-friendly skew must be budgeted against hold and MPW. Safe flows use bounded skew groups on critical endpoints with multi-corner CTS optimization.
- **Detailed answer:**
  ### Equations (edge-triggered)
  $$
  S_{\text{setup}} = T + T_{C,\text{capture}} - T_{C,\text{launch}} - T_{\text{cq}} - T_{\text{logic}} - T_{\text{su}}
  $$
  $$
  S_{\text{hold}} = T_{\text{cq,min}} + T_{\text{logic,min}} - T_{\text{hold}} - (T_{C,\text{capture}} - T_{C,\text{launch}})
  $$

  Increasing $(T_{C,\text{capture}} - T_{C,\text{launch}})$ **helps setup, hurts hold**.

  ### CTS implementation patterns
  1. **Automatic useful skew**: CTS/CCOpt schedules sinks within `max_skew` / latency budgets targeting WNS
  2. **Manual skew groups**: critical capture flops allowed extra latency bound
  3. **Interactive**: `set_interactive_constraint` latency adjust → legalize with local clock ECO

  ### Safety checklist
  - Optimize useful skew with **setup and hold views active** (MMMC)
  - Exclude async / hard-macro clocks with zero flexibility
  - Re-check SI on clock nets (skewed spines can become aggressors)
  - Re-check CRPR pairs — divergence points move when trees reshape
  - Cap per-sink delta (e.g. ±50–100 ps) unless architecture planned for more

  ### When *not* to use it
  Data path is slew/DRV limited — skew won’t fix Liberty derating from horrible transitions. Fix DRV first.
- **Snippet:**
  ```tcl
  # Conceptual CCOpt / CTS useful skew enable (tool names vary):
  set_ccopt_property enable_useful_skew true
  set_ccopt_property useful_skew_max_sink_delay_offset 0.08
  ccopt_design
  ```
- **Common pitfalls:**
  - Running useful skew in max-only CTS then discovering min-corner hold explosions post-route.
  - Skewing scan flops differently in functional vs shift without mode-aware CTS.
- **Interviewer follow-ups:**
  - Useful skew vs datapath retiming — who owns which lever?
  - How does useful skew interact with latch time borrow?
- **Tags:** useful-skew, cts, ccopt, setup-hold-tradeoff, skew-group

---

### Q05. Non-default rules (NDRs) for clocks and critical data
- **Suggested id:** `pd-18`
- **Difficulty:** Hard
- **Company style:** Broadcom / Intel
- **Round:** Onsite Technical Round 1
- **Question:**
  What is an NDR? Why do clock nets commonly get double-width double-spacing rules, and when do you apply NDRs to data buses instead of blindly upsizing cells? Discuss via rules, shielding NDRs, and the congestion cost of over-NDRing.
- **Short answer:**
  NDRs are per-net (or net-class) departures from default LEF routing rules — wider wires, larger spacing, mandatory shielding, specific via cuts. Clocks use them for RC matching, EM, and SI immunity. Critical data NDRs help when SI delta dominates; overuse starves tracks and creates worse congestion-driven detours than the problem you fixed.
- **Detailed answer:**
  ### Typical clock NDR package
  - 2× width / 2× spacing on intermediate clock metals
  - Non-default via arrays (multi-cut) for reliability
  - Optional parallel shield rails tied to VSS/VDD
  - Applied via net class: `CLOCK`, `CTS_LEAF`, etc.

  ### Data NDRs — when justified
  - Long bus with measured SI delta ≫ cell delay
  - Analog-adjacent digital control
  - High-current nets (EM), not just timing

  ### Cost model
  Each 2× spaced net consumes ~2–3× track resources. If 5% of nets get clock-class NDRs “just in case,” global route density can tip into irreparable overflow.

  ### Staff practice
  Start CTS with foundry-recommended clock NDRs only; add data NDRs from SI hotspot reports, not from fear. Re-run congestion after each NDR class expansion.
- **Common pitfalls:**
  - NDR on leaf clusters where short locals don’t need it (wastes pin access).
  - Shielding without PDN attachment → floating shields = coupling plates.
- **Interviewer follow-ups:**
  - Layer-specific NDRs (M3 only) vs all-layer — tradeoffs?
  - How do NDRs interact with double patterning coloring?
- **Tags:** ndr, clock-routing, shielding, si, em, congestion

---

### Q06. Antenna effect — ratio, diodes, and routing fixes
- **Suggested id:** `pd-19`
- **Difficulty:** Hard
- **Company style:** TSMC-flow / MediaTek
- **Round:** Technical Phone Screen
- **Question:**
  Explain plasma **antenna** damage during BEOL processing. Define antenna ratio, why long metal connected to a gate before a diffusion jumper is dangerous, and contrast fixing via **antenna diodes**, **layer hopping / bridging**, and **jumper vias** to diffusion. When can diode insertion hurt timing/leakage?
- **Short answer:**
  During metal etch, floating wires collect charge; if connected only to thin-oxide gates, voltage can rupture the gate. Antenna ratio ≈ drawn metal area (or perimeter, recipe-dependent) / gate area. Fixes: break metal with upper-layer jumpers, connect early to diffusion (diode), or insert explicit antenna diode cells. Diodes add capacitance and leakage and can violate strict analog keep-outs.
- **Detailed answer:**
  ### Process mechanism
  Gate poly/fin oxides see antenna risk when a large metal island is tied to gate while diffusion hasn’t yet been connected in the process sequence (process-step dependent rules in the deck).

  ### Ratio
  $$
  R_{\text{ant}} = \frac{A_{\text{metal (or perimeter)}}}{A_{\text{gate}}}
  $$
  Foundry sets max $R_{\text{ant}}$ per layer; hierarchical check includes cumulative rules.

  ### Fix preference order
  1. **Router antenna avoidance** — hop to higher metal earlier (jumper)
  2. **Incremental route ECO** on violators
  3. **Diode insertion** near gate pins (`ANTENNA` cells)
  4. Manual layout edit on stubborn IP pins

  ### Timing / leakage impact
  Diode on a critical input adds $C_{\text{pin}}$ → slower slew → setup risk; off-state leakage matters in UPF retention islands. Prefer jumpers on timing-critical clocks when legal.
- **Common pitfalls:**
  - Fixing antenna after filler/metal-fill freeze without re-checking density.
  - Putting diodes inside power-gated domains that collapse — diode reference must be valid.
- **Interviewer follow-ups:**
  - Partial antenna rules with layered accumulation — how do you debug a multi-layer fail?
  - Clock net diode vs NDR jumper preference?
- **Tags:** antenna, diode, jumper, beol, dirc, reliability

---

### Q07. Double patterning / coloring awareness in PnR
- **Suggested id:** `pd-20`
- **Difficulty:** Staff / Principal
- **Company style:** Apple / Intel
- **Round:** Onsite Deep-Dive
- **Question:**
  At nodes using LELE or SADP, what does **coloring** mean for the router, and how can a legally spaced layout still be unmanufacturable due to odd-cycle coloring conflicts? How should a PD lead think about same-color spacing, stitch risk, and ECO rip-up at color-aware signoff?
- **Short answer:**
  Multi-patterning assigns shapes to mask “colors.” Minimum spacing applies within a color; opposite colors may be closer per deck. Odd cycles in the conflict graph cannot be 2-colored → mandating layout change, not just DRC whitespace. ECOs that ignore color create late mask conflicts; always run color-aware DRC/LVS decks before tapeout milestones.
- **Detailed answer:**
  ### Conflict graph intuition
  Nodes = polygons on a DP layer; edges = “too close to be same mask.” 2-colorable ⇒ legal decomposition. Odd cycle ⇒ impossible without moving geometry or cutting with stitches (technology dependent).

  ### Router implications
  - Color-aware routing avoids creating odd cycles
  - May prefer preferred-direction tracks already pre-colored
  - Via farms and wrong-way jogs are frequent conflict sources

  ### ECO reality
  A 3-net timing ECO that “only moved M2 by 1 track” can introduce a mask conflict far from the timing path. Staff leads gate late ECOs with **incremental color DRC**.

  ### SADP vs LELE (interview depth)
  - LELE: two litho/etch passes; overlay error matters between colors
  - SADP: spacer-defined; mandrels/spacers constrain widths/gaps differently — “color” mental model still used in EDA but rules differ
- **Common pitfalls:**
  - Assuming “DRC clean in non-color deck” equals manufacturable.
  - Metal fill inserted without color awareness re-breaking a clean route.
- **Interviewer follow-ups:**
  - How do you debug an odd-cycle report from the foundry deck?
  - Interaction of NDR wide wires with DP spacing tables?
- **Tags:** double-patterning, coloring, lele, sadp, dirc, eco

---

### Q08. Filler cells, endcaps, and decap strategy
- **Suggested id:** `pd-21`
- **Difficulty:** Hard
- **Company style:** Qualcomm / TI
- **Round:** Onsite Technical Round 1
- **Question:**
  Differentiate **filler**, **endcap/boundary**, **tap/well-tie**, and **decap** cells. When in the flow is each inserted? How do you size decap budgets for dynamic IR without destroying routing density, and why is filler-not-decap a common tapeout miss?
- **Short answer:**
  Fillers legalize empty site gaps (implant continuity); endcaps terminate rows/macros legally; taps tie wells/substrates to rails; decaps intentionally add MOS capacitance for PDN. Insert legalization fillers late but plan decap early from IR analysis. Using only non-cap fillers leaves IR/EM fragile even when density DRC is clean.
- **Detailed answer:**
  ### Roles
  | Cell | Primary job |
  | :--- | :--- |
  | Filler | Fill SITE gaps, poly/implant continuity |
  | Endcap / boundary | Row ends, macro adjacency rules |
  | Tap / well pickup | Latch-up, well bias integrity |
  | Decap | Explicit $C$ between VDD–VSS for transient IR |

  ### Flow timing
  - Taps: per foundry max distance — often during placement legalization
  - Endcaps: with row setup / post-macro
  - Decap: iterative with Voltus-class IR — **before** final route freeze if possible
  - Filler: after ECO freeze / before metal fill; use **ECO-friendly** filler that can swap to decap/spare

  ### Decap budgeting intuition
  Local charge $\Delta Q = C_{\text{decap}}\Delta V$ must support instantaneous current until package/grid responds. Hotspots need local decap *within a radius*; global average % is not enough.

  ### Density tradeoff
  Blind 10% decap can steal buffer sites and routing tracks. Target IR-driven maps: dense near clocking/ALU, sparse near lightly switching IO control.
- **Common pitfalls:**
  - Filling with non-swappable fillers then needing decap → painful rip-up.
  - Decap in power-gated domains without retention bias strategy.
- **Interviewer follow-ups:**
  - Always-on decap islands vs gated-domain decap?
  - How do filler ECOs interact with spare cell planning?
- **Tags:** filler, decap, endcap, tap, ir-drop, legalization

---

### Q09. ECO spare cell strategy (beyond “sprinkle NAND2”)
- **Suggested id:** `pd-22`
- **Difficulty:** Staff / Principal
- **Company style:** Apple / Nvidia
- **Round:** Hiring Manager Round
- **Question:**
  Design a **spare cell** methodology for a 5 nm consumer SoC expecting functional ECOs. What mix of cells, distribution pattern, tie-off strategy, and routing-resource reservation do you use? How do you prevent spares from being optimized away, and how do you measure “ECO reachability” before tapeout?
- **Short answer:**
  Distribute a mix of inverters, buffers (several drives), NAND/NOR, AOI/OAI, and a few flops/ICGs across the die on a grid sized to metal hop budgets. Tie inputs to constant rails with ECO-breakable ties; protect with `dont_touch` / size_ok attributes. Reserve neighbor tracks; pre-validate that timing-critical regions have spare density proportional to risk. Pure corner-of-die spare farms fail real ECOs.
- **Detailed answer:**
  ### Mix (illustrative)
  - 40% INV/BUF ladder (X1–X8)
  - 25% NAND2/NOR2
  - 15% complex (AOI22, MUX2)
  - 10% flops (scan-capable) + 5% ICG
  - 5% diode / specials as needed

  ### Distribution
  - Uniform grid + **boost** near timing-hot and late-churn RTL modules
  - Avoid only channel leftovers — those sites vanish when congestion rises
  - Keep spare flops’ clock pins on lightly loaded, contactable clock stubs or plan clock ECO rules

  ### Tie-offs
  Inputs tied via explicit TIE cells or high-resistance ties so metal ECO can rewire without fighting optimization constants. Outputs left unconnected or capped per DFT rules.

  ### Freeze
  ```tcl
  set_db <spare_inst> .dont_touch true
  # prevent syn_opt / optDesign from deleting undriven logic
  ```

  ### Reachability metric
  Before tapeout: sample hypothetical ECO sites; run “can I connect spare within N µm on layers M2–M4 without crossing hard macros?” Fail regions → add spare clusters.
- **Common pitfalls:**
  - Spare flops without scan / without clock → useless for functional ECO.
  - Densities quoted as % area but all spares trapped under thick PDN with zero pin access.
- **Interviewer follow-ups:**
  - Metal-only ECO vs base-layer ECO — how does spare strategy change?
  - UPF: spare cells’ power domain membership and isolation?
- **Tags:** spare-cells, eco, dont-touch, metal-eco, tapeout-readiness

---

### Q10. Route guides and net priority vs congestion reality
- **Suggested id:** `pd-23`
- **Difficulty:** Hard
- **Company style:** Broadcom / Cadence AE-style
- **Round:** Onsite Technical Round 1
- **Question:**
  Contrast **route guides**, **net priorities**, **layer constraints**, and **NDRs**. When does a route guide help critical bus timing, and when does it cause a global congestion cascade? Describe a safe workflow to introduce guides after a congestion map.
- **Short answer:**
  Route guides spatially bias where a net *may* prefer to travel; priorities decide who wins disputes; layer constraints bind metal ranges; NDRs change geometry. Guides help when they encode floorplan intent (bus along a channel). They hurt when they force many nets through an already red bottleneck. Add guides surgically on SI/timing victims after measuring maps — never spray guides on all failing nets.
- **Detailed answer:**
  ### Failure mode
  200 nets with “must route in this 10 µm corridor” guides ≡ soft hardwall → detours explode elsewhere → new timing fails → more guides → death spiral.

  ### Safe workflow
  1. Congestion map + layer-by-layer overflow
  2. Identify **root** choke (macro channel / PDN / clock spine)
  3. Fix floorplan/PDN/NDR scope first
  4. Apply guides only to top SI aggressor/victim pairs or top hierarchical buses with known pin faces
  5. Rebalance priorities: clocks > async resets > critical data > general
  6. Remove obsolete guides each milestone

  ### Rule of thumb
  If >2–3% of nets carry guides, you likely have a floorplan problem, not a guide shortage.
- **Common pitfalls:**
  - Guides created from an old floorplan revision left enabled.
  - Priority-999 on thousands of nets (everyone is VIP ⇒ no one is).
- **Interviewer follow-ups:**
  - Early global route guides vs detail-route preferred layers?
  - How do route guides interact with clock NDRs?
- **Tags:** route-guide, net-priority, layer-constraint, congestion, bus-routing

---

### Q11. Congestion hotspots — read the map like a staff PD
- **Suggested id:** `pd-24`
- **Difficulty:** Hard
- **Company style:** Nvidia / MediaTek
- **Round:** Onsite Deep-Dive
- **Question:**
  A global route congestion map shows a red hotspot at a soft-macro corner and a diffuse yellow band across a std-cell sea. How do you triage root causes (pin density, cell density, PDN, clock, layer missing), and what different fixes apply to “local red spike” vs “global yellow”?
- **Short answer:**
  Local red spikes are usually pin-access / macro-corner / cell-cluster problems — fix with placement density screens, spreads, halos, or reorientation. Diffuse yellow implies systemic track shortage — PDN over-stripe, excess NDRs, wrong layer directive, or utilization too high. Don’t apply the same `place_spread` hammer to both.
- **Detailed answer:**
  ### Triage checklist
  1. Overlay **macros + pin heat** on congestion
  2. Overlay **power straps** — count tracks stolen
  3. Overlay **clock NDR nets**
  4. Check **cell density** vs **overflow** correlation
  5. Check missing preferred routing layers (accidental blockage)
  6. Demand vs supply: `overflow = demand - capacity` per GCell

  ### Local red spike fixes
  - Reduce local utilization (partial blockage / spread)
  - Expand macro halo; rotate pin faces
  - Create buffer-only corridors away from the corner
  - Split a bundled bus into two channels

  ### Diffuse yellow fixes
  - Lower global utilization or add floorplan area
  - Relax unnecessary NDRs / guides
  - Re-pitch PDN (careful vs IR)
  - Enable additional routing layers if stack allows
  - Hierarchy: push some logic to another physical partition

  ### Staff narrative
  Interviewers listen for **overlay thinking** (multi-layer cause analysis), not for “I ran place denser again.”
- **Common pitfalls:**
  - Fixing yellow global congestion by blasting soft blockages everywhere (moves the yellow).
  - Ignoring that CTS hasn’t run — clock NDRs will re-redden a “clean” pre-CTS map.
- **Interviewer follow-ups:**
  - How do you quantify “acceptable” overflow entering detail route?
  - Congestion after ECO — incremental vs full global route?
- **Tags:** congestion, gcell-overflow, pin-density, pdn-tracks, placement-spread

---

### Q12. Power grid stripes, stacks, and track tax
- **Suggested id:** `pd-25`
- **Difficulty:** Staff / Principal
- **Company style:** Intel / Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  Describe a classic multi-layer **power mesh**: follow-pins / std-cell rails, intermediate stripes, thick top straps, and bumps/TSVs. How do you co-optimize stripe pitch with IR/EM *and* routing congestion? What is “power grid track tax,” and how do you explain a late IR fail caused by signal NDRs stealing vias from the PDN?
- **Short answer:**
  PDN is a hierarchy of decreasing resistance toward the package. Stripe pitch denser → better IR/EM, fewer signal tracks. Track tax is the fraction of routing resources consumed by power/ground. Late IR fails often come from signal via farms / NDR shields punching holes in the mesh or from macro channels without stitch columns — not from “the IR tool being wrong.”
- **Detailed answer:**
  ### Mesh hierarchy
  1. **M1 follow-pins / standard rails**: feed every cell site
  2. **Intermediate stripes** (Mx/My): reduce local IR, vertical staples
  3. **Thick upper metal**: low-R distribution from bumps
  4. **RDL / bumps / backside (PowerVia)**: package interface

  ### Co-optimization
  $$
  \text{IR} \downarrow \Leftarrow \text{pitch} \downarrow \quad\text{but}\quad \text{signal capacity} \downarrow
  $$
  Use IR maps to **adaptively** densify under hot clocks/ALUs; keep sparser mesh over lightly switching control logic. Always re-check congestion after PDN change.

  ### Track tax communication
  Tell the floorplan review: “This 2× clock NDR + 1× shield class costs ~Y% of M3 capacity — PDN already took Z% — remaining for signal is …” Staff PDs quantify; juniors shrug.

  ### Late IR failure patterns
  - Signal ECO via arrays sever stripe continuity
  - Missing staples under macro abutments
  - Power-gated switch arrays undersized for wake-up inrush (UPF interaction)
  - Decap removed during filler refill

  ### Signoff loop
  PDN → early IR → place/CTS → SI/timing → update PDN → final dynamic IR/EM → freeze straps before last metal ECO window.
- **Common pitfalls:**
  - Designing PDN only for static IR average, ignoring dynamic wake-up / clock-gate enable storms.
  - Forgetting ground return path symmetry (EM on VSS).
- **Interviewer follow-ups:**
  - How does backside power delivery change stripe planning on the frontside?
  - Power switch daisy-chain IR during ramp — PD responsibility or UPF architect?
- **Tags:** power-grid, pdn, stripes, ir-drop, em, track-tax, congestion
