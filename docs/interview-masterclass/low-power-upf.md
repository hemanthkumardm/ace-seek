# Low Power UPF & Multi-Voltage
- **Domain id:** `low-power-upf`
- **Existing in app:** 17
- **New in this doc:** 8
- **Target:** 25 total

> Top-up bank only. Suggested ids `upf-18` … `upf-25` fill gaps beyond the live app themes (UPF anatomy, L2H/H2L basics, switch/isolation sequencing, SRPG intro, Genus power-intent stages, activity/ICG power). Prefer PST illegal states, retention strategy differences, isolation clamp values, supply set vs net, soft vs hard domains, level-shifter strategies, daisy vs parallel switches, and UPF sim↔synthesis mismatch.

---

### Q01. PST illegal states and legalization
- **Suggested id:** `upf-18`
- **Difficulty:** Staff / Principal
- **Company style:** Qualcomm / MediaTek
- **Round:** Onsite Deep-Dive
- **Question:**
  What is a Power State Table (PST)? Give an example of an **illegal** simultaneous supply state that silicon must never enter, how `add_pst_state` / `add_power_state` encode legality, and how CLP / power-aware simulation uses the PST to flag protocol bugs that logic simulation alone will miss.
- **Short answer:**
  A PST enumerates allowed combinations of supply net/port states (voltage or OFF). Illegal example: a domain ON while its isolation control still clamps, or a downstream AO domain OFF while an upstream switchable domain drives it. Verification tools flag transitions and static combinations outside the PST — your PMU RTL can be “logically fine” yet power-illegal.
- **Detailed answer:**
  ### PST role
  Supplies: `{ VDD_AO, VDD_CORE, VDD_MEM, VSS }`  
  Legal states might be:

  | Name | VDD_AO | VDD_CORE | VDD_MEM |
  | :--- | :--- | :--- | :--- |
  | RUN | 0.8 | 0.8 | 0.8 |
  | MEM_RET | 0.8 | OFF | 0.6 |
  | DEEP_SLP | 0.8 | OFF | OFF |

  Anything else (e.g. `VDD_CORE=0.8` while `VDD_AO=OFF`) is **illegal** — AO logic couldn’t control switches/isolation.

  ### Classic illegal classes
  1. **Control supply OFF, controlled supply ON** — can’t sequence
  2. **Driver ON, receiver OFF without isolation armed**
  3. **Level-shifter rails biased in an unsupported combo** (HV rail down, LV active)
  4. **Retention rail OFF while retention asserted**

  ### UPF sketch
  ```tcl
  create_pst chip_pst -supplies {VDD_AO VDD_CORE VDD_MEM}
  add_pst_state RUN     -pst chip_pst -state {0.80 0.80 0.80}
  add_pst_state MEM_RET -pst chip_pst -state {0.80 OFF  0.60}
  add_pst_state DEEP    -pst chip_pst -state {0.80 OFF  OFF }
  # Unlisted combinations are illegal by omission
  ```

  ### Why staff care
  PST is the contract between architects, PMU designers, and implementation. Missing states cause tools to over-constrain; extra accidental states allow silicon gunshots (crowbar, latch-up, flash corruption).
- **Common pitfalls:**
  - Encoding voltages as strings inconsistently (`0.8` vs `0.80` vs `ON`) across tools.
  - PST at top only — hierarchical blocks with local supplies need aligned states.
- **Interviewer follow-ups:**
  - How do `create_power_state_group` / IEEE 1801-2015 power states relate to classic PST?
  - Can two PSTs exist for test vs functional modes?
- **Tags:** pst, illegal-state, pmu, clp, power-aware-sim, ieee-1801

---

### Q02. Retention strategies — Synopsys vs Cadence styles
- **Suggested id:** `upf-19`
- **Difficulty:** Staff / Principal
- **Company style:** Synopsys / Cadence tool-agnostic interview
- **Round:** Onsite Deep-Dive
- **Question:**
  Contrast **balloon / shadow-latch retention flops**, **live-slave retention**, and **save/restore scan-like retention** methodologies. How do Synopsys (`set_retention` / UPFf save-restore controls) and Cadence Genus/Innovus retention flows typically differ in control-pin conventions (`save`/`restore` vs `ret_n`), and what STA/UPF checks must still be common across vendors?
- **Short answer:**
  Shadow-latch SRPG keeps state on an always-on balloon latch while the main master powers down — usually a single retention sense pin. Save/restore protocols pulse explicit save then power-down, restore on power-up (two-phase). Vendor UPF flavors differ in default pin names and inference, but all require: retention rail always on during sleep, correct isolation/sequencing, and no X-corruption on restore. Don’t memorize GUI clicks — memorize electrical contracts.
- **Detailed answer:**
  ### Architectural options

  | Style | Mechanism | Control | Area/Power |
  | :--- | :--- | :--- | :--- |
  | Shadow/balloon SRPG | AO latch mirrors data | Often active-low `RET` | Cell larger; fast wake |
  | Live-slave | Slave portion AO | Similar | Library-specific |
  | Save/restore | Checkpoint to AO memory / scan | `save`, `restore` pulses | Flexible; longer latency |

  ### Vendor practical differences (interview-safe framing)
  - **Synopsys-oriented** flows often emphasize UPF retention with `set_retention` + `set_retention_control` and Liberty retention attributes; save/restore protocols appear in UPF 2.x extensively.
  - **Cadence-oriented** flows consume the same IEEE 1801 intent in Genus (`read/apply/commit_power_intent`) but library retention pin naming (`RET`, `NRET`, `SAVE`, `RESTORE`) and PLC checks are Cadence-reported.
  - Both require matching **Liberty** `retention_cell` / power-gating attributes — UPF alone won’t invent silicon.

  ### Common electrical contract (must say this)
  1. Retention supply present in sleep PST state
  2. Assert retention **before** primary rail collapse
  3. Release retention **after** rails stable and isolation sequenced
  4. Clock stable / gated per library diagram during save/restore windows
  5. STA: retention control pins timed (not casually false-pathed)

  ### Pitfall across vendors
  Mixing a save/restore UPF strategy with a library that only implements balloon SRPG (or vice versa) → commit_power_intent / MLP check failures or silent wrong cells.
- **Snippet:**
  ```tcl
  set_retention ret_core -domain PD_CORE -retention_power_net VDD_AO \
    -retention_ground_net VSS
  set_retention_control ret_core -domain PD_CORE \
    -save_signal    {save_core high} \
    -restore_signal {restore_core high}
  # Balloon-style libraries may use -retention_signal {ret_n low} instead
  ```
- **Common pitfalls:**
  - Powering retention rail from the gated primary net.
  - Assuming Genus will infer retention without `set_db` library enables / correct `.lib` attrs.
- **Interviewer follow-ups:**
  - Partial retention (only some regs) — how do you list elements vs use UPF strategies?
  - DFT: how does retention interact with scan shift in sleep-capable modes?
- **Tags:** retention, srpg, save-restore, balloon-latch, genus, synopsys, liberty

---

### Q03. Isolation clamp values — choosing 0 vs 1 vs latch/Z
- **Suggested id:** `upf-20`
- **Difficulty:** Hard
- **Company style:** Qualcomm / TI
- **Round:** Onsite Technical Round 1
- **Question:**
  How do you choose isolation **clamp value** (`0`, `1`, `latch`, hold) for each net leaving a switchable domain? Give examples where clamping to the wrong level causes enable-active stuck-on, reset storms, or bus contention, and explain why clamp value must match receiver polarity *and* power-on defaults.
- **Short answer:**
  Clamp to the **safe inactive** level of the receiving logic: active-high enables → clamp `0`; active-low resets → clamp `1` (keep deasserted) or carefully architect sync reset; bidirectional buses need contention-free clamps / isolation strategies. Wrong clamps are functional bugs invisible in ON-mode simulation.
- **Detailed answer:**
  ### Decision tree
  1. What does the receiver interpret as **active**?
  2. What is the safe idle during driver power-down?
  3. Is the net a clock, reset, enable, data, or bus?
  4. Does AO logic require sticky last-value (`latch` isolation) for protocol continuity?

  ### Examples
  | Net | Safe clamp | Why |
  | :--- | :--- | :--- |
  | Active-high clock gate EN | `0` | Prevent accidental wake clocks |
  | Active-low async reset | `1` | Keep deasserted while sleeping domain is off |
  | Chip select to external | Inactive polarity | Avoid false transactions |
  | Shared bus driver | Special ISO / buffered strategy | Avoid fighting AO drivers |

  ### Latch isolation
  Stores pre-power-down value — useful for configuration that must persist visibly, dangerous if that value was an armed enable.

  ### Verification
  Power-aware sim + CLP: when domain OFF, probe isolation outputs equal clamp. Formal power apps check “enable not stuck active.”
- **Common pitfalls:**
  - Global `clamp_value 0` policy on all outputs — resets/active-low controls break.
  - Clamping clocks to 1 accidentally feeding free-running toggles into AO.
- **Interviewer follow-ups:**
  - Isolation `location` self vs parent vs sibling — who owns the clamp cell electrically?
  - Different clamps in DFT vs functional PST states?
- **Tags:** isolation, clamp-value, enable-polarity, reset, power-gating

---

### Q04. Supply set vs supply net / supply port
- **Suggested id:** `upf-21`
- **Difficulty:** Hard
- **Company style:** Arm / Synopsys
- **Round:** Technical Phone Screen
- **Question:**
  In IEEE 1801, contrast **supply net**, **supply port**, and **supply set** (functions like `power`/`ground`/`nwell`). Why did supply sets appear, how do they simplify multi-rail cells (level shifters, isolation, retention), and what breaks if you only create nets but never update strategies to reference sets?
- **Short answer:**
  Supply nets are named electrical rails; ports are boundary connection points; supply sets bundle related functions (primary power, ground, well, retention) into one abstract object for strategies. Sets reduce errors when a cell needs multiple rails — strategies bind to sets instead of scattering net names. Modern UPF styles prefer sets; legacy net-only UPF still exists but maps poorly to complex libraries.
- **Detailed answer:**
  ### Objects
  - `create_supply_net VDD_CORE` — logical rail
  - `create_supply_port` + `connect_supply_net` — hierarchical interface
  - `create_supply_set ss_core -function {power VDD_CORE} -function {ground VSS}` — typed bundle

  ### Why sets matter
  A level shifter may need `vin`, `vout`, `ground` functions. Binding `set_level_shifter ... -input_supply_set ss_a -output_supply_set ss_b` is clearer and less error-prone than remembering six net flags.

  ### Migration hazard
  Mixed UPF: some strategies use `-isolation_power_net`, others use supply sets inconsistently → tools accept file but MLP insertion picks wrong rail (classic AO isolation powered from gated net bug returns in a new costume).

  ### Staff practice
  Pick one style per project (preferably supply sets for new 1801.2015+), document wrappers for IP deliveries still in net style.
- **Snippet:**
  ```tcl
  create_supply_net VDD_AO
  create_supply_net VDD_CORE
  create_supply_net VSS
  create_supply_set ss_ao   -function {power VDD_AO}   -function {ground VSS}
  create_supply_set ss_core -function {power VDD_CORE} -function {ground VSS}
  set_domain_supply_net PD_CORE -primary_power_net VDD_CORE -primary_ground_net VSS
  # or associate supply sets with domains per 1801 style used by the project
  ```
- **Common pitfalls:**
  - Creating supply sets but leaving `set_domain_supply_net` pointing at stale nets.
  - Forgetting well/bulk functions on advanced nodes.
- **Interviewer follow-ups:**
  - How do supply sets appear in PST / power states models?
  - Supply set handles vs hierarchical `connect_supply_set`?
- **Tags:** supply-set, supply-net, supply-port, ieee-1801, multi-rail

---

### Q05. Soft vs hard power domains
- **Suggested id:** `upf-22`
- **Difficulty:** Hard
- **Company style:** AMD / Broadcom
- **Round:** Onsite Technical Round 1
- **Question:**
  What is the difference between a **hard** power domain boundary and a **soft** (or extent-based / same-voltage logical) domain practice in implementation? When do you require physical contiguous voltage areas with switch arrays versus logical UPF domains that share a rail? How does this choice affect level shifters, floorplan, and UPF element lists?
- **Short answer:**
  Hard domains map to physically contiguous voltage islands with explicit switch/ISO/LS at the geometric boundary. Soft/logical domains may group hierarchy for intent or analysis while still sharing the same physical rail — useful for accounting or partial retention, dangerous if engineers assume physical shutdown that silicon can’t do. Implementation must match the **electrical** truth, not only the UPF name.
- **Detailed answer:**
  ### Hard domain
  - Unique primary supply (possibly switched)
  - Physical region(s) in floorplan
  - Boundary cells: switches, ISO, LS, AO buffers
  - PST states include OFF

  ### Soft / logical partitioning
  - May share `VDD_CORE` with siblings
  - Used for: retention subgroups, power reporting buckets, clock-gate regions mislabeled as “domains”
  - **No** true rail collapse unless separate supply exists

  ### Interview landmine
  Architect says “power-gate the USB block” but UPF only `create_power_domain` on hierarchy without `create_power_switch` / gated net → synthesis won’t insert switches; silicon never gates.

  ### Floorplan link
  Hard domains need contiguous placement + switch daisy/parallel planning; fragmenting a hard domain into 20 sprinkles of cells explodes AO buffer/ISO count and IR.
- **Common pitfalls:**
  - Nested domains without clear primary supply inheritance.
  - Reusing one gated net name for two hard islands that must shut down independently.
- **Interviewer follow-ups:**
  - How do you UPF a hard macro with internal power domains?
  - Multi-bit always-on vs switchable mix inside one Verilog module — element lists vs HDL change?
- **Tags:** hard-domain, soft-domain, voltage-island, floorplan, power-switch

---

### Q06. Level shifter strategies beyond L2H vs H2L
- **Suggested id:** `upf-23`
- **Difficulty:** Staff / Principal
- **Company style:** Apple / Arm
- **Round:** Onsite Deep-Dive
- **Question:**
  Beyond basic low-to-high and high-to-low, explain **enable level shifters**, **isolation+LS combined cells**, **bidirectional / bus LS**, and **strategy location** (`self`/`parent`/`fanout`). How do you pick `-rule` / `-elements` strategies when two domains have complex crossing graphs, and what STA complex arises when LS cells introduce large asymmetric delays?
- **Short answer:**
  LS strategy must cover every voltage crossing net with the correct cell type for direction and whether the driver can be OFF (needs ISO or enable-LS). Location decides which domain physically owns the cell (rail availability). Combined ISO+LS saves area on power-gated MV boundaries. STA must path-group LS-heavy crossings — a single wrong location leaves a thin-oxide gate driven by an illegal voltage.
- **Detailed answer:**
  ### Cell classes
  | Type | Use |
  | :--- | :--- |
  | LH / L2H | Low driver → high receiver |
  | HL / H2L | High → low (protect low oxide / fix VIH) |
  | Enable LS | Pass when enabled; safe when driver domain down |
  | ISO+LS | Clamp + shift in one cell |
  | Bidirectional | Careful pad/bus cases |

  ### Location semantics
  - **self**: inside the domain owning the strategy (driver domain often)
  - **parent**: in parent hierarchical extent
  - **fanout**: at receivers
  Choose so the cell’s **required rails exist** when either side is OFF — same fatal class as ISO powered from gated rail.

  ### Strategy authorship
  Prefer default domain strategies + explicit exceptions for special nets (analog, retention controls, clocks). Clock crossings may need AO buffers + LS with MPW budgets.

  ### STA impact
  LS delays can be hundreds of ps and highly voltage-dependent — put MV crossings in dedicated path groups; never bury them only in R2R noise.
- **Common pitfalls:**
  - Inserting H2L buffers that are electrically just thin gates (not true shifters).
  - Forgetting LS on clock and reset crossings while fixing only data buses.
- **Interviewer follow-ups:**
  - How do you verify completeness: every crossing has ISO/LS as required?
  - Multi-voltage SDC: set_voltage / related supply in Liberty vs UPF?
- **Tags:** level-shifter, enable-ls, iso-ls, location, multi-voltage, sta

---

### Q07. Power switch arrays — daisy-chain vs parallel
- **Suggested id:** `upf-24`
- **Difficulty:** Staff / Principal
- **Company style:** Qualcomm / Intel
- **Round:** Onsite Deep-Dive
- **Question:**
  Compare **daisy-chained** power-switch enable chains vs **parallel** (globally buffered) switch arrays for a large power-gated island. Discuss inrush current, wake latency, IR drop during ramp, and UPF `create_power_switch` abstraction versus physical array implementation in PnR.
- **Short answer:**
  Parallel switches turning on together minimize wake latency but maximize inrush/`L·di/dt` and supply droop. Daisy/chain or staged enables soften inrush at the cost of longer wake and asymmetric IR during ramp. UPF usually models one logical switch; physical design instantiates thousands of header/footer cells with staged enable routing — the abstraction gap is a classic staff topic.
- **Detailed answer:**
  ### Parallel
  - Pros: fast wake, uniform rail rise if sized well
  - Cons: huge inrush, package bounce, AO rail dip killing neighbors

  ### Daisy / staged
  - Enable ripples through buffer chain or weighted stages (10% → 30% → 100%)
  - Pros: controlled inrush, friendlier PDN
  - Cons: longer wake; must still meet software latency; partial-on IR can stress cells if logic unlocks early

  ### UPF vs physical
  ```tcl
  create_power_switch sw_core -domain PD_CORE \
    -input_supply_port {vin VDD_AO} \
    -output_supply_port {vout VDD_CORE} \
    -control_port {ssctrl pwr_en} \
    -on_state {on_state vin {ssctrl}} \
    -off_state {off_state {~ssctrl}}
  ```
  PnR maps this to a **switch cell array** + enable tree. Acknowledgement (`ack`) signals often added for software/PMU — may be UPF `ack_port` or design RTL.

  ### Staff closure criteria
  - Inrush within PDN budget (simulation)
  - No data release until `ack` / timed delay
  - Isolation remains asserted through ramp
  - Switch cell EM under repeated cycling (mobile SoCs)
- **Common pitfalls:**
  - Enabling logic clocks before rail reaches `Vmin` characterization voltage.
  - Putting switch enables on the gated domain (can’t turn itself back on).
- **Interviewer follow-ups:**
  - Header vs footer switches — leakage and body-bias interactions?
  - How do you test power switches in production (DFT)?
- **Tags:** power-switch, daisy-chain, inrush, ir-drop, ack, pnr-array

---

### Q08. UPF simulation vs synthesis / PnR mismatch
- **Suggested id:** `upf-25`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia / Cadence
- **Round:** Hiring Manager Round
- **Question:**
  List the top industrial mismatches between **power-aware RTL simulation**, **synthesis power intent commit**, and **physical UPF implementation**. How do you build a signoff checklist so that “sim passed UPF” doesn’t still tape out with missing isolation or wrong clamp rails?
- **Short answer:**
  Simulation may use behavioral isolation/supply models; synthesis inserts real cells from Liberty; PnR places them on real rails and may legally move/optimize. Mismatches: element list coverage, strategy location, library mapping, PST not imported equally, and ECO netlists dropping LP cells. Signoff requires the same UPF binary contract plus structural LP checks (CLP/MVRC), Conformal LP, and gate-level power-aware sim on the **final** netlist.
- **Detailed answer:**
  ### Mismatch catalog
  | Area | Sim | Synth | PnR |
  | :--- | :--- | :--- | :--- |
  | ISO insertion | Behavioral force/clamp | Real ISO cells | Moved to boundary legal sites |
  | Supplies | Abstract ON/OFF | Supply nets connected | PG routing / vias real |
  | Retention | Model state keep | Mapped SRPG cells | Replacement / spare ECO risk |
  | PST | Testbench sequences | Optimization modes | Same file? or stale copy |
  | Hierarchy | HDL paths | Uniquify/ungroup renames | ILM/abstract loss |

  ### High-risk bugs
  1. Sim UPF path lists outdated after RTL rename → silent missing ISO
  2. Synth commits intent; late `ungroup` dissolves domain elements
  3. PnR power-route connects ISO `VDD` pin to gated follow-pin (DRC-clean, electrically wrong)
  4. Different UPF versions in DV vs implementation repos

  ### Signoff checklist (staff answer)
  1. Single golden UPF revision in config management
  2. `check_power_intent` / MLP reports **zero** unexpected opens after commit
  3. Structural LP static checks on synth and post-route netlists
  4. Power-aware GLS on post-route with SDF + UPF
  5. PG connectivity LVS / soft-check: ISO/LS/retention rails
  6. ECO policy: LP cells `dont_touch`; re-run LP checks after every metal ECO
  7. PST scenarios covered in both PMU DV and PA-sim regressions
- **Common pitfalls:**
  - Trusting RTL PA-sim as sufficient for tapeout LP signoff.
  - Maintaining “DV UPF” and “impl UPF” as divergent forks.
- **Interviewer follow-ups:**
  - How do you handle hard-IP vendor UPF that disagrees with SoC top PST?
  - What LP regressions gate a functional ECO late in the schedule?
- **Tags:** upf-mismatch, power-aware-sim, clp, conformal-lp, signoff, eco
