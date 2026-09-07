# Logic Synthesis & SDC Constraints
- **Domain id:** `synthesis-sdc`
- **Existing in app:** 31
- **New in this doc:** 5 bonus (optional)
- **Target:** 25 total

## Status note

The live interview bank for **synthesis-sdc already has 31 questions (≥ 25 target)**. No mandatory top-up is required for count closure.

This file adds **optional bonus** questions (`syn-32` … `syn-36`) that fill SDC gaps **not heavily covered** in the existing bank (path-group triage, false/multicycle basics, generated/virtual clocks, driving cell vs transition, wireload/PLE, check_design, retiming, pad I2O math). Prefer: `set_data_check`, `set_max_skew`, clock sense / invert, `set_sense`, and external delays with `network_latency_included`.

---

### Q01. `set_data_check` for clock-mux and IP non-seq pins
- **Suggested id:** `syn-32`
- **Difficulty:** Hard
- **Company style:** Qualcomm / TI
- **Round:** Onsite Technical Round 1
- **Question:**
  Write production-quality SDC using `set_data_check` for a glitch-free clock mux: select must be stable before the losing clock’s edge and remain stable (hold) after switchover. Contrast this with `set_max_delay` between the same pins, and explain when Liberty already has a non-sequential arc so a data check would double-constrain.
- **Short answer:**
  Data checks express pin-to-pin setup/hold-like relationships outside normal flop arcs. For mux select vs clock pins, use paired `-setup` and `-hold` data checks (with explicit clocks when multi-clock). `set_max_delay` is a path-delay budget without the same edge semantics — weaker / different. If the mux `.lib` already defines non-seq checks, don’t duplicate blindly.
- **Detailed answer:**
  ### Why synthesis/SDC owners care
  RTL clock muxes and soft-IP wrappers often lack complete sequential arcs at the chip level. Without data checks, Genus/Innovus may report green R2R while select races clocks.

  ### Example
  ```sdc
  # Select must settle before CLK_A samples the mux (setup-like)
  set_data_check -from [get_pins u_cmux/S] \
                 -to   [get_pins u_cmux/CLK_A] \
                 -setup 0.200

  # Select must not change too soon after the switch event (hold-like)
  set_data_check -from [get_pins u_cmux/S] \
                 -to   [get_pins u_cmux/CLK_A] \
                 -hold 0.050

  # Repeat vs CLK_B as architecture requires; associate -clock when needed
  ```

  ### `set_max_delay` contrast
  `set_max_delay 0.2 -from S -to CLK_A` constrains combinational delay along paths but does **not** cleanly replace recovery-style “stable before edge” semantics for arbitrary pins, and can fight clock-path timing.

  ### Double-constraint hazard
  Read Liberty: if `timing_type : non_seq_setup|non_seq_hold` exists on those pins, prefer library arcs; extra SDC may create impossible requirements.
- **Common pitfalls:**
  - Only coding setup data check — hold select races still ship.
  - Data checks then `set_false_path -to` the same pins “to clean QoR.”
- **Interviewer follow-ups:**
  - How do data checks show up in synthesis vs signoff STA path groups?
  - Interaction with `set_case_analysis` on mux select in test modes?
- **Tags:** set_data_check, clock-mux, non-sequential, sdc, synthesis

---

### Q02. `set_max_skew` for balanced buses and clock groups
- **Suggested id:** `syn-33`
- **Difficulty:** Hard
- **Company style:** Broadcom / Nvidia
- **Round:** Technical Phone Screen
- **Question:**
  What does `set_max_skew` constrain, and how is it different from `set_max_delay` / `set_min_delay` on a bus? Give a use case for source-synchronous DDR-style data vs strobe balance and a use case for bounded skew among clock sinks before CTS. What goes wrong if you apply tight max skew too early in logic synthesis with ideal clocks?
- **Short answer:**
  `set_max_skew` limits the **arrival difference** among a set of related pins/nets, not the absolute path delay. Absolute max/min delay bound each path independently; skew bounds the spread. Ideal-clock synthesis cannot meaningfully close leaf-level clock skew — apply sink skew targets primarily to CTS/PnR, while data-bus skew constraints need real propagated delays / physical context.
- **Detailed answer:**
  ### Semantics
  For pins $\{p_i\}$ in a skew group with limit $S$:
  $$
  \max_i t_{\text{arr}}(p_i) - \min_j t_{\text{arr}}(p_j) \le S
  $$

  ### Use cases
  1. **Source-synchronous**: data\[63:0\] vs `dqs` arrival skew within eye budget
  2. **Reset tree** balance (sometimes) — careful with recovery
  3. **Clock sinks** bounded skew (usually a CTS property; SDC max_skew may assist reporting)

  ### Vs max/min delay
  You can meet max delay on every bit yet still violate skew if one bit is fast and one is slow-but-still-under-max. Conversely, skew-only without max delay can allow all bits late together.

  ### Ideal clock trap
  In Genus pre-CTS, clock network latency is ideal/estimated — forcing tiny `set_max_skew` on flop CK pins either no-ops, fights the ideal model, or causes bizarre optimization. Prefer:
  - Data-path skew groups on buses with physical awareness
  - Clock skew budgets as CTS specs (`skew_group`, CCOpt properties), not fake pre-CTS SDC
- **Snippet:**
  ```sdc
  set_max_skew 0.050 -from [get_ports {data[*]}] -to [get_ports dqs]
  # Tool-specific variants exist for -group / objects; check reference manual
  ```
- **Common pitfalls:**
  - Using max skew as a substitute for IO timing windows (`set_input_delay` / output).
  - Forgetting min-delay / hold when balancing a bus (skew fix inserts delay buffers that heal setup skew but can break hold).
- **Interviewer follow-ups:**
  - How does SI delta delay destroy a skew-closed bus?
  - Skew groups across voltage domains with level shifters?
- **Tags:** set_max_skew, source-synchronous, bus-balance, cts, sdc

---

### Q03. Clock sense invert — `create_generated_clock -invert` vs logical inversion
- **Suggested id:** `syn-34`
- **Difficulty:** Hard
- **Company style:** AMD / Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  A designer inserts an inverting clock buffer and models it with a separate `create_clock` on the buffer output. Why is that often wrong? Explain correct use of `create_generated_clock -invert` / `-combinational`, how edge sense propagates into setup/hold equations, and what breaks in CRPR and clock-gating checks when invert sense is mis-modeled.
- **Short answer:**
  A physically derived inverted clock must remain in the **generated clock** relationship to its source so latency, uncertainty, and common-path credit stay consistent. A fresh `create_clock` treats it as an independent root — false asynchronous behavior, wrong edges, broken CRPR. `-invert` flips which source edge defines rising/falling of the generated clock.
- **Detailed answer:**
  ### Correct modeling
  ```sdc
  create_clock -name CLK -period 2.0 [get_ports clk]
  create_generated_clock -name CLK_N -source [get_ports clk] \
    -master_clock CLK -invert \
    [get_pins u_inv/Y]
  ```

  For a non-inverting divider:
  ```sdc
  create_generated_clock -name CLK_DIV2 -source [get_ports clk] \
    -divide_by 2 [get_pins u_div/Q]
  ```

  ### Edge sense in equations
  Inversion swaps which master edge launches/captures for rising generated edges. Half-cycle paths between CLK and CLK_N become intentional — STA must see them as generated, not async.

  ### Failure modes of “new create_clock”
  - `set_clock_groups -asynchronous` accidentally applied → real paths false-pathed
  - Network latency duplicated or zeroed incorrectly
  - CRPR cannot see shared trunk through the inverter
  - ICG gating checks use wrong related edge

  ### Combinational generated clocks
  Clock mux outputs often need `-combinational` generated clocks for each select path, plus exclusivity — not covered by inventing independent clocks.
- **Common pitfalls:**
  - Modeling PLL feedback invert incorrectly → period/phase shift errors.
  - Forgetting to update generated clock after CTS moves the invert buffer.
- **Interviewer follow-ups:**
  - How do you constrain both phases of a DDR clock pair?
  - `set_clock_sense` vs generated `-invert` — when each applies?
- **Tags:** generated-clock, invert, clock-sense, crpr, half-cycle

---

### Q04. `set_sense` / `set_clock_sense` for stop-propagation and unate fixes
- **Suggested id:** `syn-35`
- **Difficulty:** Staff / Principal
- **Company style:** Intel / Synopsys STA
- **Round:** Onsite Technical Round 1
- **Question:**
  Explain `set_clock_sense` (positive/negative/stop) and broader `set_sense` usage on pins. When do you **stop** clock propagation through a gate, when do you force positive/negative sense, and how can wrong sense create false half-cycle paths or hide real ones? Contrast with `set_disable_timing` and `set_case_analysis`.
- **Short answer:**
  Clock sense controls how a clock is considered to propagate through a pin (non-inverting, inverting, or not at all). Use stop at intentional clock blockers (synced disables, scan-only logic) when case analysis isn’t enough. Forcing sense is for known unate/inversion the timer mis-infers. `set_disable_timing` kills arcs; `set_case_analysis` constants pins — different hammers.
- **Detailed answer:**
  ### Typical controls
  ```sdc
  # Do not propagate clock beyond this pin
  set_clock_sense -stop_propagation -clock CLK [get_pins u_gate/S]

  # Force inverted sense through a logically inverting cell the timer got wrong
  set_clock_sense -negative -clock CLK [get_pins u_odd_cell/Z]
  ```

  ### When stop_propagation is legitimate
  - Clock feeds a data-only OR structure in test that is architecturally gated off
  - Explicit documentation that functional clock cannot emerge at that pin
  - Paired with physical/DFT review — never to silence QoR

  ### Contrast
  | Construct | Effect |
  | :--- | :--- |
  | `set_clock_sense -stop` | Clock identity stops; data may still time |
  | `set_disable_timing` | Removes timing arc(s) entirely |
  | `set_case_analysis` | Constants a pin → disables alternate arcs |
  | `set_false_path` | Keeps arcs but excludes path checking |

  ### Danger
  Stopping sense on a real functional branch hides paths → silicon fails while STA is green. Staff answer always includes “prove mutual exclusivity / architecture sign-off.”
- **Common pitfalls:**
  - Using stop_propagation instead of fixing a clock mux modeling problem.
  - Global sense commands without `-clock` in multi-clock cones.
- **Interviewer follow-ups:**
  - How does sense interact with clock gating check generation?
  - Tool differences: `set_sense` vs `set_clock_sense` naming?
- **Tags:** set_clock_sense, set_sense, stop-propagation, unate, sdc

---

### Q05. External delays with `network_latency_included` / `source_latency_included`
- **Suggested id:** `syn-36`
- **Difficulty:** Staff / Principal
- **Company style:** Apple / Broadcom
- **Round:** Onsite Deep-Dive
- **Question:**
  Derive how `set_input_delay` / `set_output_delay` interact with clock **source** and **network** latency. What do `-network_latency_included` and `-source_latency_included` mean, when must you set them, and what double-counting bug appears if board/source latency is already inside the external delay number *and* also applied via `set_clock_latency`?
- **Short answer:**
  By default, many flows treat external delay as **data path outside the chip**, while clock latency (source+network) still applies to the related clock. If your external delay number already bundled board clock tree delay, you must declare `*_latency_included` so STA does not add latency again. Wrong flags cause systematic I/O WNS or false optimism.
- **Detailed answer:**
  ### Mental model (input setup)
  Virtual or pad-referred clock $C$:
  $$
  S_{\text{in,setup}} \approx T - T_{\text{input\_delay}} - T_{\text{combo_to_first_ff}} - T_{\text{su}} + \text{(capture clock arrival terms)}
  $$

  Capture arrival includes source/network latency unless excluded by modeling flags and ideal/propagated mode.

  ### What the flags assert
  - **`network_latency_included`**: the specified external delay already contains the on-chip (or specified) network latency portion of the related clock — don’t add network latency again when applying that delay.
  - **`source_latency_included`**: similarly for source (board/PLL off-chip) latency already baked into the delay number.

  Exact default semantics are tool-specific — **read the reference** — but the interview concept is **double-counting vs under-counting** of latency relative to how the delay was characterized.

  ### Industrial scenarios
  1. Timing budget spreadsheet gives “input delay = 0.6 ns including board clock tree 0.25 ns” → need source latency included flag **or** strip 0.25 ns out of the delay and model latency separately (prefer one source of truth).
  2. Pure package delay with virtual clock and zero `set_clock_latency` → usually **no** included flags.
  3. Post-CTS: network latency becomes propagated — revisit I/O constraints that assumed ideal network latency numbers.

  ### Staff hygiene rule
  Pick one accounting system:
  - **A:** External delay = data-only; latency only via `set_clock_latency` / propagated clocks
  - **B:** External delay bundles some latency; declare included flags accordingly  

  Never mix A and B across interfaces on the same chip.
- **Snippet:**
  ```sdc
  create_clock -name VCLK_SYS -period 2.0
  set_clock_latency 0.25 [get_clocks VCLK_SYS]   ;# board source latency model

  # If input_delay is data-path ONLY (preferred):
  set_input_delay -clock VCLK_SYS -max 0.35 [get_ports rx_data*]

  # If spreadsheet delay already includes that 0.25 source latency:
  # set_input_delay -clock VCLK_SYS -max 0.60 \
  #   -source_latency_included [get_ports rx_data*]
  ```
- **Common pitfalls:**
  - Copy-pasting included flags from another project with different spreadsheet conventions.
  - Forgetting hold external delays need the same accounting consistency.
- **Interviewer follow-ups:**
  - How do these flags interact with `set_clock_latency -source` vs `-network` separately?
  - Virtual clock vs real pad clock as `-clock` reference for chip I/O?
- **Tags:** set_input_delay, set_output_delay, network_latency_included, source_latency_included, io-timing, virtual-clock
