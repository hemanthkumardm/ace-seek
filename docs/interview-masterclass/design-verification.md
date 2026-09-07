# Design Verification (DV / UVM & SVA)

Domain id: `design-verification`  
Audience: Nvidia / Qualcomm / Apple / Intel / AMD Staff–Principal VLSI interviews  
Questions: 25

---

### Q01. UVM factory type vs instance override
- **Suggested id:** `dv-01`
- **Difficulty:** Medium
- **Company style:** Nvidia
- **Round:** Technical Phone Screen
- **Question:**
  Explain the UVM factory. How do `set_type_override_by_type` and `set_inst_override_by_type` differ? When would you override a driver instance under one agent but leave sibling agents untouched?
- **Short answer:**
  The factory creates objects by registered type name so tests can substitute derived types without editing the environment. Type override replaces every create of that type; instance override matches a hierarchical instance path and substitutes only there.
- **Detailed answer:**
  UVM components and objects register with the factory via `uvm_component_param_utils` / `uvm_object_utils`. Environments call `type_id::create("name", parent)` instead of `new`, so the factory can return a derived class.

  - **Type override:** `set_type_override_by_type(base::get_type(), derived::get_type())` — every subsequent create of `base` yields `derived`. Use for global substitutions (e.g., all agents use an error-injecting driver).
  - **Instance override:** `set_inst_override_by_type("env.agt[0].drv", base::get_type(), derived::get_type())` — only the named path is overridden. Sibling `agt[1].drv` stays base.

  Override resolution prefers the most specific instance match, then type override. Overrides must be set **before** `create` of the target. Parameterized classes need `*_by_type` with `get_type()`, not string names alone, to avoid type identity bugs.

  Staff expectation: explain why hardcoding `new derived_driver(...)` inside the agent breaks reuse and why factory + config_db is the standard extensibility pattern for VIP and SoC benches.
- **Snippet:**
```systemverilog
// Global: all my_driver creates become err_driver
my_driver::type_id::set_type_override(err_driver::get_type());

// Local: only agent 0
my_driver::type_id::set_inst_override(err_driver::get_type(), "uvm_test_top.env.agt[0].drv");
```
- **Common pitfalls:**
  - Setting overrides after `build_phase` creates have already run.
  - Using string type names with parameterized classes and getting silent base-type creates.
  - Overriding the agent type when only the driver needed replacement (unnecessary blast radius).
- **Interviewer follow-ups:**
  - How does `factory.print()` help debug a “my override didn’t take” bug?
  - Difference between `set_type_override` and `set_type_override_by_type`?
- **Tags:** uvm, factory, override, vip, reuse

---

### Q02. RAL mirror, predict, and map
- **Suggested id:** `dv-02`
- **Difficulty:** Hard
- **Company style:** Qualcomm
- **Round:** Onsite Technical Round 1
- **Question:**
  In UVM RAL, what are `mirror`, `predict`, `update`, and `write`? How do frontdoor vs backdoor accesses interact with the mirrored value, and when is `UVM_CHECK` vs `UVM_NO_CHECK` appropriate after reset?
- **Short answer:**
  RAL keeps a mirrored model of DUT registers. `write`/`read` go through a map (frontdoor bus or backdoor peek/poke). `predict` updates the mirror from observed bus activity; `mirror` reads DUT and optionally compares to the mirror; `update` writes DUT from desired values that differ from mirrored.
- **Detailed answer:**
  A `uvm_reg_block` holds `uvm_reg` / `uvm_reg_field` objects with access policies (`RW`, `RO`, `W1C`, `RC`, etc.), reset values, and one or more `uvm_reg_map`s binding registers to addresses and adapters.

  - **`write` / `read`:** Explicit frontdoor (via sequencer/adapter) or backdoor (`UVM_BACKDOOR`) access. Frontdoor exercises the real bus protocol; backdoor uses HDL paths for speed.
  - **`predict`:** Updates mirrored/desired based on a bus operation observed by a predictor (monitor → `reg_predict`). Critical for keeping the model coherent when the DUT or another master writes registers outside the RAL sequence.
  - **`mirror(status, UVM_CHECK)`:** Reads DUT (front or back) and compares against mirrored value; fails on mismatch.
  - **`update`:** Writes only fields whose desired ≠ mirrored — useful after batching desired changes.

  After async reset, mirrored values may be stale. Typical flow: `reset` callback or explicit `mirror(..., UVM_NO_CHECK)` / `set_reset` then `reset()`, then enable checking. `W1C`/`W1S` fields need correct `predict` semantics or scoreboards will false-fail.

  Staff angle: multiple maps (APB vs AHB vs backdoor), byte-enable sparse writes, and locking `uvm_reg_field` access during concurrent sequences.
- **Common pitfalls:**
  - Calling `mirror(UVM_CHECK)` immediately after reset before the model’s reset values are applied.
  - Forgetting a predictor when software/CPU also writes the same CSR space.
  - Treating backdoor write as covering bus protocol bugs (it does not).
- **Interviewer follow-ups:**
  - How do you model a `W1C` interrupt status bit correctly in RAL?
  - How does `uvm_reg_adapter` `bus2reg`/`reg2bus` interact with your APB VIP?
- **Tags:** ral, uvm-reg, mirror, predict, frontdoor, backdoor

---

### Q03. Sequences, sequencers, and virtual sequences
- **Suggested id:** `dv-03`
- **Difficulty:** Medium
- **Company style:** Apple
- **Round:** Technical Phone Screen
- **Question:**
  Distinguish `uvm_sequence`, `uvm_sequencer`, and a virtual sequence. Why should protocol sequences not call `starting_phase.raise_objection` in modern UVM, and where should objections live instead?
- **Short answer:**
  Sequences generate transactions; sequencers arbitrate and deliver them to drivers; virtual sequences coordinate multiple sequencers without driving pins. Objections belong in the test (or a top-level virtual sequence started from the test), not buried in leaf protocol sequences.
- **Detailed answer:**
  - **`uvm_sequence #(REQ)`:** Procedural stimulus — `body()` calls `start_item`/`finish_item` or `uvm_do` macros. Can be layered (sequence calls sub-sequences).
  - **`uvm_sequencer #(REQ)`:** TLM consumer connected to the driver’s `seq_item_port`. Implements arbitration (`SEQ_ARB_FIFO`, `SEQ_ARB_WEIGHTED`, `SEQ_ARB_RANDOM`, etc.).
  - **Virtual sequence:** A sequence that holds handles to multiple sequencers (`p_sequencer` cast or explicit `uvm_sequencer_base` pointers) and starts sub-sequences on each. It does **not** connect to a driver.

  Objection hygiene: if every leaf sequence raises/drops objections, early-finishing sequences can drop the last objection while others still run, or nested sequences double-count. UVM recommends raising in the test’s `run_phase` (or one controlling virtual sequence) around `seq.start(sqr)`.

  Layered stimulus (e.g., PCIe TLP sequence on top of DLL/PHY sequences) uses virtual sequences plus sequence libraries for constrained-random scenarios at each layer.
- **Common pitfalls:**
  - Putting pin-level waits inside a virtual sequence instead of in the driver.
  - Starting a sequence on the wrong sequencer type (compile-time param mismatch).
  - Relying on deprecated `raising_objection` inside every `pre_body`.
- **Interviewer follow-ups:**
  - How does `set_arbitration(SEQ_ARB_STRICT_FIFO)` change starvation behavior?
  - What is a sequence library and when do you use `uvm_sequence_library`?
- **Tags:** uvm, sequences, virtual-sequence, objections, arbitration

---

### Q04. TLM ports: put, get, analysis
- **Suggested id:** `dv-04`
- **Difficulty:** Medium
- **Company style:** Intel
- **Round:** Technical Phone Screen
- **Question:**
  Compare `uvm_blocking_put_port`, `uvm_blocking_get_port`, and `uvm_analysis_port`. Which connection style do monitors use to broadcast to scoreboards and coverage collectors, and why must analysis exports be non-blocking?
- **Short answer:**
  Put/get are point-to-point request/response style TLM-1 interfaces (often blocking). Analysis ports are broadcast (1:N) and call `write()` which must not block, so monitors never stall the DUT interface timing model.
- **Detailed answer:**
  UVM TLM builds on SystemVerilog interfaces:

  | Port | Direction semantics | Typical use |
  |---|---|---|
  | `put_port` → `put_imp` | Initiator pushes transaction | Sequencer→driver is actually `seq_item_pull`; put used in custom channels |
  | `get_port` → `get_imp` | Initiator pulls | Passive consumer fetching from a FIFO |
  | `analysis_port` → `analysis_imp` / `analysis_export` | Broadcast `write(T)` | Monitor → scoreboard, coverage, predictor |

  Monitor pattern:
  ```systemverilog
  uvm_analysis_port #(axi_item) ap;
  // in run: ap.write(item); // non-blocking fanout
  ```
  Scoreboard implements `write(axi_item t)` via `uvm_analysis_imp`. For multiple analysis imps in one component, use `uvm_analysis_imp_decl(_expected)` macros to create distinct `write_expected` methods.

  Blocking `put`/`get` can deadlock if both sides wait. Analysis must be non-blocking because the monitor samples on clock edges; blocking would desynchronize sampling and break cycle accuracy.
- **Common pitfalls:**
  - Connecting analysis_port to a blocking put_imp.
  - Forgetting `ap = new("ap", this)` in `build_phase`.
  - Deep-copy vs handle: writing the same object reference that the monitor mutates next cycle.
- **Interviewer follow-ups:**
  - Why clone or copy the transaction before `ap.write`?
  - How does `uvm_tlm_analysis_fifo` help decouple producer/consumer rates?
- **Tags:** tlm, analysis-port, monitor, scoreboard

---

### Q05. SVA overlapping vs non-overlapping implication
- **Suggested id:** `dv-05`
- **Difficulty:** Medium
- **Company style:** Nvidia
- **Round:** Technical Phone Screen
- **Question:**
  What is the difference between `|→` and `|=>` in SystemVerilog Assertions? Write an assertion: when `req` rises, `ack` must be high within 1 to 3 cycles, and explain vacuity.
- **Short answer:**
  `|→` (overlapping) checks the consequent starting in the **same** cycle as the antecedent match; `|=>` (non-overlapping) starts one cycle later. Vacuous success occurs when the antecedent never matches — coverage of the antecedent matters.
- **Detailed answer:**
  Concurrent assertions sample values in the preponed region relative to the clocking event.

  - `a |-> b` ≡ if `a` is true at cycle T, evaluate `b` starting at T.
  - `a |=> b` ≡ `a |-> ##1 b`.

  For “`req` rose ⇒ `ack` in 1..3 cycles”:
  ```systemverilog
  property p_req_ack;
    @(posedge clk) disable iff (rst_n === 1'b0)
      $rose(req) |-> ##[1:3] ack;
  endproperty
  assert property (p_req_ack);
  cover property (p_req_ack); // non-vacuous hits
  ```
  Use `$rose(req)` so a multi-cycle sticky `req` does not retrigger every cycle unless intended. If protocol allows same-cycle ack, use `|→ ##[0:3] ack`.

  **Vacuity:** If `req` never rises, the assertion passes vacuously. Formal tools and simulators report vacuous passes; always pair critical asserts with `cover property` on the antecedent or use `not`/`accept_on` carefully.
- **Snippet:**
```systemverilog
assert property (@(posedge clk) disable iff (!rst_n)
  $rose(req) |-> ##[1:3] ack)
else $error("ack window miss");
```
- **Common pitfalls:**
  - Using `|→` when the designer meant “next cycle” (`|=>`).
  - Forgetting `disable iff` for reset, causing false failures during X/reset.
  - Asserting on `req` level instead of `$rose(req)` for pulse protocols.
- **Interviewer follow-ups:**
  - How do `s_eventually` and `##[1:3]` differ in formal completeness?
  - What does `intersect` buy you versus `and` in sequences?
- **Tags:** sva, implication, vacuity, handshake

---

### Q06. `$rose`, `$fell`, `$past`, and sampling
- **Suggested id:** `dv-06`
- **Difficulty:** Medium
- **Company style:** AMD
- **Round:** Technical Phone Screen
- **Question:**
  Define `$rose(sig)`, `$fell(sig)`, and `$past(sig, n)`. Why can `$rose` be true when `sig` goes `X→1`, and how do you write a stable-data assertion relative to a handshake?
- **Short answer:**
  `$rose` is true when the sampled LSB was 0 and is now 1; `$fell` is the inverse; `$past(sig,n)` returns the value n cycles ago (default clock). X/Z transitions can create unexpected `$rose`/`$fell`. For stable data: when `valid&&ready`, data must equal `$past(data)` under appropriate conditions, or data must be stable while `valid&&!ready`.
- **Detailed answer:**
  In concurrent assertions / sampled value functions, values are from the **preponed** region of the clocking event — matching NBA-updated flops visually on waveform rising edges.

  - `$rose(s)` ⇔ `!$past(sLSB) && sLSB` (roughly; X handling is tool-defined carefully).
  - `$stable(s)` ⇔ `s === $past(s)`.
  - `$changed(s)` ⇔ `!$stable(s)`.

  Classic valid/ready stability (AXI-style):
  ```systemverilog
  property p_data_stable;
    @(posedge clk) disable iff (!rst_n)
      (valid && !ready) |=> $stable(data) && valid;
  endproperty
  ```
  Meaning: if transfer stalled, data and valid must hold until ready.

  Gotcha: comparing with `==` instead of `===` hides X. During reset release, `$past` may still see X — gate with `disable iff` or `$past(rst_n)`.
- **Common pitfalls:**
  - Using `$rose` in a procedural `always_ff` without understanding it needs a clock context (use `$rose(sig, @(posedge clk))`).
  - Expecting `$past` depth beyond tool/formal limits without declaring.
- **Interviewer follow-ups:**
  - Difference between `$sampled(sig)` and reading `sig` in the action block?
  - How does clocking block input skew interact with `$rose` in a testbench checker?
- **Tags:** sva, sampled-value, rose, past, axi

---

### Q07. SVA `eventually`, `until`, and liveness
- **Suggested id:** `dv-07`
- **Difficulty:** Hard
- **Company style:** Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  Explain `s_eventually`, `eventually`, `until`, and `s_until`. Why are strong properties important for liveness (“ack must eventually come”), and what happens to strong properties in bounded simulation?
- **Short answer:**
  Weak operators can pass at end-of-time if the obligation was never discharged; strong operators (`s_*`) require the eventuality to occur within the finite trace. Formal proves unbounded liveness; simulation can only falsify or vacuously/weakly pass.
- **Detailed answer:**
  Liveness example: `req |-> s_eventually ack`. If `req` happens and `ack` never arrives, formal fails; in simulation, a weak `eventually` may pass when `$finish` occurs before ack.

  - `seq1 until prop` — prop becomes true sometime, and seq1 holds until then (weak: if prop never comes, still OK at EOT).
  - `s_until` — requires prop to occur.
  - `go_to` / `nonconsecutive repetition` (`[=]`, `[->]`) encode “next occurrence” patterns for intermittent ready.

  Staff practice: use strong properties in formal; in sim use bounded windows `##[1:MAX]` with a documented MAX from latency contracts. Mix safety (`assert`) and liveness (`assert` strong / formal-only) with `assume` on inputs.
- **Common pitfalls:**
  - Claiming simulation “proved” unbounded `eventually`.
  - Using weak `until` for grant-must-happen arbitration specs.
- **Interviewer follow-ups:**
  - How do you set a formal proof radius / bound for a strong property?
  - When do you prefer `assume property` on inputs vs constraining a UVM sequence?
- **Tags:** sva, liveness, eventually, formal, strong-property

---

### Q08. Covergroup, coverpoint, and cross
- **Suggested id:** `dv-08`
- **Difficulty:** Hard
- **Company style:** Qualcomm
- **Round:** Onsite Technical Round 1
- **Question:**
  Design a covergroup for an AXI write address channel sampling `awlen`, `awburst`, and `awsize`. How does a `cross` explode bin count, and how do you use `ignore_bins` / `illegal_bins` to keep closure meaningful?
- **Short answer:**
  Define coverpoints with explicit bins for architecturally meaningful values, then `cross` only legal combinations. `ignore_bins` drop don’t-care combos from denominator; `illegal_bins` flag forbidden hits as errors.
- **Detailed answer:**
  ```systemverilog
  covergroup cg_aw @(posedge clk);
    option.per_instance = 1;
    cp_len: coverpoint awlen {
      bins single = {0};
      bins burst_2_16 = {[1:15]};
      bins max = {255};
    }
    cp_burst: coverpoint awburst {
      bins fixed = {0}; bins incr = {1}; bins wrap = {2};
    }
    cp_size: coverpoint awsize {
      bins sz[] = {[0:3]}; // up to 8B if bus=64b
    }
    cx: cross cp_len, cp_burst, cp_size {
      ignore_bins wrap_non_pow2 =
        binsof(cp_burst.wrap) && binsof(cp_len) intersect {[1:255]};
      // refine: WRAP requires len=2^n-1 — encode properly
      illegal_bins reserved_burst = binsof(cp_burst) intersect {3};
    }
  endgroup
  ```
  Cross bin count ≈ product of constituent bins. Uncontrolled crosses with auto-bins on 32-bit data are worthless. Prefer goal-driven coverage: protocol legal space + interesting corners (unaligned, 4K boundary, narrow transfers).

  Sample in monitor via analysis export calling `cg.sample()`, not in the driver (driver never sees slave backpressure the same way).
- **Common pitfalls:**
  - Crossing raw 32-bit address without bins → millions of empty bins.
  - Using `illegal_bins` for “not yet interested” (should be `ignore_bins`).
- **Interviewer follow-ups:**
  - `option.weight` / `type_option.goal` — how do they affect report closure %?
  - Covergroup vs cover property — when each?
- **Tags:** coverage, covergroup, cross, axi, functional-coverage

---

### Q09. Scoreboard / predictor architecture
- **Suggested id:** `dv-09`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  Sketch a scoreboard for an out-of-order CPU-to-memory interconnect with tagged transactions. Should the reference model be in-order predictive or transactional? How do you handle dropped vs reordered responses without false fails?
- **Short answer:**
  Use a transactional predictor keyed by ID/tag: expected responses live in an associative array/queue per ID. Compare on response arrival; separately check completion/fairness. In-order FIFOs alone false-fail under legitimate reorder.
- **Detailed answer:**
  Architecture:
  1. **Ingress analysis** from master monitor: push request into reference model.
  2. **Reference model:** functional abstract (SystemVerilog class, DPI-C, or TLMs) computes expected payload/status.
  3. **Store expected** in `expected[id][$]` preserving per-ID order (AXI: responses for same ID remain ordered; across IDs may reorder).
  4. **Egress analysis:** on response, pop matching ID queue head and compare; mismatch → error with full txn dump.
  5. **End-of-test:** drain check — all expected queues empty; optional in-flight timeout.

  For lossy or filtered designs, explicit “drop” events must retire expected entries. For partial writes / byte strobes, compare only active bytes.

  Staff topics: in-order vs OOP reference, symbolic predictors for formal assist, and using `uvm_tlm_analysis_fifo` for rate decoupling when the RM is slow (DPI).
- **Common pitfalls:**
  - Global in-order queue for an OoO interconnect.
  - Comparing X-containing DUT outputs with `==` instead of masking unknowns where RTL allows them.
- **Interviewer follow-ups:**
  - How do you scoreboard a DUT that merges writes to the same address?
  - Where does RAL predict fit vs a packet scoreboard?
- **Tags:** scoreboard, predictor, ooo, axi-id, reference-model

---

### Q10. VIP architecture and agent structure
- **Suggested id:** `dv-10`
- **Difficulty:** Hard
- **Company style:** Intel
- **Round:** Onsite Deep-Dive
- **Question:**
  What constitutes a reusable protocol VIP agent? Describe active vs passive modes, configuration object contents, and how a chip-level env instantiates 40+ identical agents without code duplication.
- **Short answer:**
  A VIP agent packages sequencer, driver, monitor, config, and coverage behind a stable API. Active = drive + monitor; passive = monitor only. Config_db + factory + parameterized env arrays scale to many ports.
- **Detailed answer:**
  Standard agent:
  - `uvm_sequencer`, `driver`, `monitor`, optional `coverage` subscriber
  - `uvm_active_passive_enum is_active`
  - Virtual interface handle(s) and protocol knobs in a `uvm_object` config (data width, ID width, outstanding depth, timing delays)
  - Analysis ports for monitored items

  Chip env:
  ```systemverilog
  axi_agent agt[];
  // build: foreach port create agent; set config is_active based on whether TB drives that port
  ```
  Use instance overrides for fault-injection agents. Separate **protocol VIP** (compliant) from **test sequences** (scenario intent) so VIP updates do not break tests.

  Compliance: include protocol SVA bind files inside the VIP, enable/disable via config for gate-level where X’s explode assertions.
- **Common pitfalls:**
  - Baking test-specific knobs into the driver instead of the sequence/config.
  - Passive agent that still instantiates a driver (wasted, or worse, drives contention).
- **Interviewer follow-ups:**
  - How do you version a VIP against a changing RTL interface via adaptors?
  - Master vs slave agent differences for ready generation?
- **Tags:** vip, agent, active-passive, config-db, reuse

---

### Q11. Constrained random: hard vs soft, dist, solve before
- **Suggested id:** `dv-11`
- **Difficulty:** Staff / Principal
- **Company style:** Qualcomm
- **Round:** Onsite Deep-Dive
- **Question:**
  In SystemVerilog CRV, what is the difference between hard and soft constraints? Explain `dist`, `solve before`, and a classic pitfall when constraining `len` and `addr` for a burst that must not cross a 4K boundary.
- **Short answer:**
  Hard constraints must be satisfied or randomization fails; soft may be dropped if conflicting. `dist` sets weighted value likelihood. `solve before` orders variable decisions to bias conditional distributions. Address/length coupling needs a joint constraint, not independent uniform picks.
- **Detailed answer:**
  ```systemverilog
  class axi_aw;
    rand bit [31:0] addr;
    rand bit [7:0]  len;
    rand burst_e    burst;
    constraint c_4k {
      burst == INCR ->
        addr[11:0] + ((len+1) << awsize) <= 13'h1000;
    }
    constraint c_soft_pref {
      soft len < 16; // tests may disable with randomize() with { len == 255; }
    }
    constraint c_dist {
      awsize dist {0:=10, 1:=20, 2:=50, 3:=20};
    }
  endclass
  ```
  Without the joint 4K constraint, independently random `addr` near page end and large `len` produce illegal AXI bursts — VIP assertions fire and you waste cycles.

  `solve addr before len` changes statistical shape: solver picks addr first, then len conditioned on remaining page budget. It does **not** add a constraint; it only affects distribution under existing constraints.

  `randomize() with {}` inline constraints are hard. Use `constraint_mode(0)` to disable named constraints for directed cases.
- **Common pitfalls:**
  - Believing `solve before` “fixes” illegal combos without writing the real constraint.
  - Soft constraints silently dropped — thinking the preference always applied.
- **Interviewer follow-ups:**
  - How do `unique` constraints work for an array of IDs?
  - What does a randomization failure (`randomize()==0`) imply for debug?
- **Tags:** crv, constraints, dist, solve-before, axi-4k

---

### Q12. UVM objections and drain time
- **Suggested id:** `dv-12`
- **Difficulty:** Medium
- **Company style:** AMD
- **Round:** Technical Phone Screen
- **Question:**
  How do phase objections control simulation end? What is `phase.phase_done.set_drain_time`, and why might a scoreboard still have pending expected transactions when the run phase ends?
- **Short answer:**
  A phase ends when all raised objections are dropped. Drain time keeps the phase alive after the last drop so pipelines can flush. Pending scoreboard entries usually mean stimulus stopped objections too early or responses never returned.
- **Detailed answer:**
  In `run_phase`, the test raises an objection, starts sequences, then drops. Components that need extra time (scoreboard waiting for last response) should raise their own objections or the test should wait on an explicit end-of-test event.

  Drain time: after objection count hits 0, UVM waits `drain_time` before ending the phase — a blunt instrument. Prefer explicit handshake: scoreboard sets `final_drain` objection until queues empty or timeout.

  Common bug: sequences drop objections in `post_body` while the driver still has items in flight / slave still responding. Fix: objection in test around `seq.start`, plus scoreboard activity objection, or `wait fork` on in-flight counters.
- **Common pitfalls:**
  - Multiple sequences each raising/dropping → last drop ends test prematurely.
  - Relying only on drain_time instead of modeling in-flight count.
- **Interviewer follow-ups:**
  - Difference between objections in `run_phase` vs `main_phase` (with phase jumping)?
  - How does `uvm_objection` tracing (`+UVM_OBJECTION_TRACE`) help?
- **Tags:** uvm, objections, drain-time, eot

---

### Q13. Phase jumping and reset phases
- **Suggested id:** `dv-13`
- **Difficulty:** Staff / Principal
- **Company style:** Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  Explain UVM runtime phases (`reset`, `configure`, `main`, `shutdown`) and phase jumping. How would you model a mid-test warm reset that kills in-flight sequences and restarts stimulus without `\$finish`?
- **Short answer:**
  UVM splits run into schedules of sub-phases with objections. Phase jump moves the current phase to another (e.g., `main` → `reset`), aborting the prior phase’s threads. Warm reset: jump to reset phase, re-init RAL/VIP, then continue to main.
- **Detailed answer:**
  The common phase domain includes `pre_reset → reset → post_reset → pre_configure → configure → ... → main → ... → shutdown`. Each has objection semantics like `run_phase`.

  **Phase jump:** `phase.jump(uvm_pre_reset_phase::get())` from a component when a reset event is detected (or injected). Active `main_phase` sequences receive kill; drivers must be written to be restartable (interfaces return to idle, semaphores cleared).

  Staff checklist for warm reset:
  1. Detect reset assertion in monitor or dedicated reset agent.
  2. Jump phases; drop stale objections carefully.
  3. Clear scoreboard expected queues / mark in-flight as cancelled.
  4. `reg_model.reset()` and re-`mirror`.
  5. Re-apply configs; restart virtual sequence library.

  Many teams still use a single `run_phase` with an explicit reset task for simplicity — know both and defend tradeoffs (jumping is powerful but easy to deadlock if objections leak).
- **Common pitfalls:**
  - Phase jump without cleaning TLM FIFOs → ghost transactions after reset.
  - Not killing sequences → post-reset stimulus corruption.
- **Interviewer follow-ups:**
  - How do domains and schedules interact with multiple clocks/tests?
  - Why do some VIPs forbid phase jumping and require `run_phase` only?
- **Tags:** uvm-phases, phase-jump, warm-reset, staff

---

### Q14. CRV corner cases: inside, unique, soft disable
- **Suggested id:** `dv-14`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  You need a random array of 8 distinct AXI IDs from 0..15, each with a burst length from a weighted distribution, and one “poison” constraint that is usually on but disabled in a directed test. Write the constraint strategy and explain failure modes.
- **Short answer:**
  Use `unique {ids}` or pairwise inequality, `dist` on lengths, and a named constraint toggled via `constraint_mode`. Watch array size vs value space (8 unique from 0..15 is fine; 17 unique is unsatisfiable).
- **Detailed answer:**
  ```systemverilog
  class multi_id_seq_item;
    rand bit [3:0] id[8];
    rand bit [7:0] len[8];
    constraint c_unique_ids { unique {id}; }
    constraint c_len_dist {
      foreach (len[i]) len[i] dist {[0:3]:=50, [4:15]:=40, [16:255]:=10};
    }
    constraint c_poison { // usually: forbid id==0
      foreach (id[i]) id[i] != 0;
    }
  endclass
  // directed test:
  item.c_poison.constraint_mode(0);
  assert(item.randomize());
  ```
  Unsatisfiable sets (`unique` with more elements than domain) cause `randomize()` to return 0 — always check return value. Nested `foreach` with cross-index relations can blow up solver time; simplify with intermediate random vars.
- **Common pitfalls:**
  - Ignoring `randomize()` return value.
  - Using `soft unique` thinking it partially applies (uniqueness is all-or-nothing for the set).
- **Interviewer follow-ups:**
  - How does `randc` differ from `unique` over multiple randomize calls?
  - Solver performance: when do you switch to procedural randomization?
- **Tags:** crv, unique, constraint-mode, solver

---

### Q15. Clocking blocks in testbenches
- **Suggested id:** `dv-15`
- **Difficulty:** Hard
- **Company style:** Intel
- **Round:** Onsite Technical Round 1
- **Question:**
  What problem do SystemVerilog clocking blocks solve in reactive testbenches? Explain input/output skew and why driving DUT inputs with `#0` or NBA from a clocking block avoids races with DUT flops.
- **Short answer:**
  Clocking blocks define synchronous sampling/driving points with explicit skews relative to a clock, removing TB/DUT race ambiguity. Inputs sample before the edge (or with skew); outputs drive after the edge via NBA semantics.
- **Detailed answer:**
  ```systemverilog
  clocking cb @(posedge clk);
    default input #1step output #0;
    input  ready, rdata;
    output valid, wdata;
  endclocking
  // driver:
  @(cb);
  cb.valid <= 1'b1;
  cb.wdata <= data;
  ```
  `#1step` input skew samples in the postponed region of the previous time slot — sees stable DUT outputs after NBAs. Output `#0` schedules drives in the NBA region of the current cycle, aligning with RTL `<=` flops that sample those signals next edge.

  Without clocking blocks, `@ (posedge clk) vif.valid = 1;` (blocking) can race: some simulators sample DUT flops before TB assign, others after. Clocking + virtual interface is the standard VIP pattern.
- **Common pitfalls:**
  - Mixing absolute `#delay` drives with clocking drives on the same signals.
  - Using clocking block in design RTL (usually TB-only discipline).
- **Interviewer follow-ups:**
  - `##1` cycle delays inside clocking vs program blocks?
  - How do you handle asynchronous resets alongside a clocking block?
- **Tags:** clocking-block, race, testbench, skew

---

### Q16. Interfaces and modports
- **Suggested id:** `dv-16`
- **Difficulty:** Hard
- **Company style:** AMD
- **Round:** Onsite Technical Round 1
- **Question:**
  Why bundle DUT connections in a SystemVerilog `interface` with `modport`s? How do modports enforce directionality for master vs slave, and how does a virtual interface get from top-level to a UVM driver?
- **Short answer:**
  Interfaces group signals + concurrent assertions + clocking; modports declare directions per role. The testbench top sets `uvm_config_db#(virtual axi_if.drv_mp)::set(...)`; the driver `get`s it in `build_phase`.
- **Detailed answer:**
  ```systemverilog
  interface axi_if(input logic clk, rst_n);
    logic valid, ready;
    logic [31:0] data;
    clocking drv_cb @(posedge clk);
      output valid, data; input ready;
    endclocking
    modport drv_mp (clocking drv_cb, input clk, rst_n);
    modport mon_mp (input clk, rst_n, valid, ready, data);
  endinterface
  ```
  Modports prevent a slave TB from accidentally driving `ready` the wrong way when using the wrong modport type. Virtual interfaces are references — necessary because UVM classes cannot contain hierarchical signal references directly.

  Bind: `config_db` set from TB top using the concrete instance path; drivers use parameterized virtual types matching the modport.
- **Common pitfalls:**
  - Passing the interface without modport and losing direction checks.
  - `config_db::get` failing due to wrong instance path / type mismatch (virtual vs non-virtual).
- **Interviewer follow-ups:**
  - `interface` parametric with `parameter DATA_W` — how does that type-match in config_db?
  - Assertions inside interface vs `bind` of an SVA module?
- **Tags:** interface, modport, virtual-interface, config-db

---

### Q17. Formal verification vs simulation
- **Suggested id:** `dv-17`
- **Difficulty:** Staff / Principal
- **Company style:** Apple
- **Round:** Hiring Manager Round
- **Question:**
  When do you choose formal (property checking / connectivity / sequential equivalence) over constrained-random UVM, and vice versa? How do you partition an SoC verification plan across both?
- **Short answer:**
  Formal excels at control-path safety/liveness with bounded state, exhaustive corner coverage, and EC (RTL vs netlist). CRV/UVM excels at long traffic scenarios, software-driven flows, performance, and analog-mixed timing. Use both: formal on protocol engines/arbiters/CDC gates; UVM on system scenarios.
- **Detailed answer:**
  **Formal strengths:** complete proof of assertions under assumptions; great for arbiters, FIFOs, FSM deadlock, scoreboarding-free safety, connectivity, X-prop bounded checks. **Limits:** state explosion on large datapaths/caches; needs careful `assume` to avoid over-constraints that prove nonsense.

  **Simulation strengths:** real VIP traffic shapes, multi-agent coordination, HW/SW co-sim, GF coverage closure with software. **Limits:** cannot exhaust rare arbitration interleavings.

  Partition example (GPU/SoC):
  - Formal: NoC router credit protocol, interrupt controller, power-state FSM, CDC gray pointer checks.
  - UVM: full application traffic, QoS, multi-clock integration, performance KPIs.
  - Sequential equivalence: ECO netlist vs golden RTL.

  Staff signal: speak to **coverage unification** — formal covered properties map into the same verification plan DB as functional covergroups.
- **Common pitfalls:**
  - Over-constraining formal (assumes hide bugs).
  - Using formal alone on a CPU core without simulation regressions.
- **Interviewer follow-ups:**
  - What is a bounded proof vs full proof?
  - How do you validate that assumptions are not vacuously killing the cone?
- **Tags:** formal, simulation, methodology, planning, staff

---

### Q18. Reset testing strategy
- **Suggested id:** `dv-18`
- **Difficulty:** Hard
- **Company style:** Qualcomm
- **Round:** Onsite Technical Round 1
- **Question:**
  How do you verify asynchronous assert / synchronous deassert reset trees in DV? List stimulus cases (power-on, warm, mid-transaction) and checkers you require.
- **Short answer:**
  Assert reset asynchronously in TB; release synchronously to the destination clock. Check that outputs go to defined reset values, no X leakage on control, in-flight txns are dropped/replayed per spec, and re-init sequences restore RAL/software visible state.
- **Detailed answer:**
  Cases:
  1. **Cold reset:** apply before clocks; release after clocks stable; check reset values via backdoor + frontdoor.
  2. **Warm reset mid-idle:** clean re-entry.
  3. **Warm reset mid-transaction:** randomize phase of reset vs valid handshake; expect bus to terminate without deadlock; VIP protocol FSMs reset.
  4. **Reset during different power states** (if UPF): isolation interaction.
  5. **Staggered resets** across domains: ensure CDC paths don’t propagate X forever.

  Checkers: SVA on reset values; X checkers on control after N cycles; scoreboard cancel policy; coverage on reset timing bins relative to protocol phases.

  Deassert sync: TB should model the sync flops or release only on clock edges to match silicon intent — releasing async in TB can hide bugs the sync cells exist to prevent.
- **Common pitfalls:**
  - Only testing reset at time 0.
  - Failing to clear scoreboard on mid-test reset.
- **Interviewer follow-ups:**
  - How do you verify reset minimum pulse width requirements?
  - Scan reset vs functional reset interactions?
- **Tags:** reset, async-assert, warm-reset, x-check

---

### Q19. X-propagation and X-optimism
- **Suggested id:** `dv-19`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia
- **Round:** Onsite Deep-Dive
- **Question:**
  Explain X-optimism and X-pessimism in RTL simulation. How do X-prop tools / `xprop` methodologies differ from naive 4-state sim, and what DV practices catch reset/X bugs before silicon?
- **Short answer:**
  Verilog `if (x)` takes the else path (optimism) and may hide bugs; pessimistic merging makes more Xs than silicon. X-prop instrumentation forces unknowns through control to reveal reliance on Xs. Combine with init-to-X, random init, and formal X checks.
- **Detailed answer:**
  Example optimism:
  ```systemverilog
  if (ready)  // ready=X → treated as 0 in sim
    state <= NEXT;
  ```
  Silicon might sample 0 or 1; sim silently takes not-taken path.

  Approaches:
  - **Synopsys/other xprop:** instruments RTL so control Xs propagate to outputs.
  - **Explicit X asserts:** `assert (!$isunknown(ctrl))` after reset window.
  - **Random initialization:** `$urandom` on memories/flops at start to approximate silicon.
  - **Gate-level sim with SDF:** Xs from timing, but expensive.

  Staff practice: classify signals — control must be 0/1 after reset+N; datapath Xs may be OK until qualified by valid. Don’t blanket-`0` initialize everything in TB and claim X-clean silicon.
- **Common pitfalls:**
  - Using `==` comparisons that mask X (`===` needed).
  - Disabling X checks in GLS “because too noisy” without triage.
- **Interviewer follow-ups:**
  - How does `unique case` interact with X?
  - Memory read X before write — scoreboard policy?
- **Tags:** x-prop, x-optimism, reset, gls, staff

---

### Q20. config_db vs resource_db
- **Suggested id:** `dv-20`
- **Difficulty:** Medium
- **Company style:** Broadcom
- **Round:** Technical Phone Screen
- **Question:**
  How does `uvm_config_db` work? What are the lookup rules for field name and instance path, and when would you use `uvm_resource_db` instead?
- **Short answer:**
  `config_db` is a typed wrapper over the resource database for hierarchical configuration. `set(cntxt, inst_name, field, value)` and `get(cntxt, inst_name, field, value)` match by type + field + scope. Use it for VIF and config objects; resource_db for low-level/sharing tricks — prefer config_db in modern UVM.
- **Detailed answer:**
  Lookup walks from the getting component upward, matching wildcards in instance paths (`*`, `*.agt[*]`). Last-write / priority rules can surprise you when multiple sets apply — debug with `uvm_config_db_options::set_trace(1)` / print resources.

  Pattern:
  ```systemverilog
  uvm_config_db#(virtual apb_if)::set(null, "uvm_test_top.env.agt*", "vif", vif);
  // in agent build:
  if (!uvm_config_db#(virtual apb_if)::get(this, "", "vif", vif))
    `uvm_fatal(...)
  ```
  Passing `null` context means top-level. Prefer setting from the parent targeting children rather than globals when possible for reuse.
- **Common pitfalls:**
  - Wrong field string `"vif"` vs `"virtual_if"`.
  - Getting before set (build order) — parents build before children, so set in parent `build_phase` before `super` creates children carefully, or set from test before `env`.
- **Interviewer follow-ups:**
  - How does `set_config_object` (deprecated) relate?
  - Wildcard performance with thousands of agents?
- **Tags:** config-db, resource-db, uvm, vif

---

### Q21. Driver vs monitor responsibilities
- **Suggested id:** `dv-21`
- **Difficulty:** Medium
- **Company style:** Arm
- **Round:** Technical Phone Screen
- **Question:**
  Why must protocol checking and transaction extraction live in the monitor (or bound SVA), not the driver? What does the driver do when the slave inserts wait states?
- **Short answer:**
  Drivers are active and absent in passive mode; monitors always observe true pin behavior including DUT-as-master traffic. Driver applies sequence items and reacts to backpressure (`ready` low) by holding stable outputs per protocol; it does not “check” the DUT’s correctness.
- **Detailed answer:**
  Separation of concerns:
  - **Driver:** convert `seq_item` → timed pin wiggles; honor clocking block; handle wait states; optional reactive slave driver generates `ready`/responses from a slave sequence.
  - **Monitor:** sample pins → create transactions → analysis port; independent of active/passive.
  - **SVA bind:** cycle-accurate protocol legality.

  If checks live only in the driver, passive monitoring of RTL-driven buses (e.g., DUT master) gets zero checking. Scoreboards subscribe to monitors on both ends of a link.
- **Common pitfalls:**
  - Driver emitting analysis transactions that never saw the wire (predicted, not observed).
  - Slave driver with fixed `#delay` ready instead of constrained-random wait states (weak coverage).
- **Interviewer follow-ups:**
  - What is a reactive slave sequence?
  - Should coverage sample in monitor or a separate subscriber?
- **Tags:** driver, monitor, separation, vip

---

### Q22. Functional coverage closure strategy
- **Suggested id:** `dv-22`
- **Difficulty:** Staff / Principal
- **Company style:** Qualcomm
- **Round:** Hiring Manager Round
- **Question:**
  A block is at 92% functional coverage with 8 stubborn cross bins. How do you decide whether to write directed tests, refine bins, or waive? Tie your answer to project risk and tapeout criteria.
- **Short answer:**
  First verify bins are legal and valuable; drop/ignore meaningless bins; for real holes, analyze constraint bias and add directed or shaped random tests; waive only with written risk signoff. Closure is risk management, not a vanity percentage.
- **Detailed answer:**
  Process:
  1. **Bin audit:** illegal? unreachable due to arch? duplicate of another cover? → `ignore_bins` / remove.
  2. **Reachability:** prove with formal hit or explain structural impossibility.
  3. **Stimulus gap:** review CRV distributions (`dist`, solve order); add sequence that forces the corner (e.g., wrap burst at 4K-8).
  4. **Regression shaping:** increase weight of scenario library entries that hit near-miss bins.
  5. **Waive:** document residual risk, owners, and why silicon/errata acceptable.

  Staff metric: cover **spec-derived** items linked to requirements IDs; raw % without peer review is insufficient for Apple/Nvidia-style audits.
- **Common pitfalls:**
  - Inflating closure by deleting hard bins.
  - Infinite random cycles hoping for a 1-in-2^40 hit.
- **Interviewer follow-ups:**
  - How do you merge coverage across distributed regressions?
  - Code coverage vs functional coverage — can one replace the other?
- **Tags:** coverage-closure, methodology, risk, staff

---

### Q23. SVA for valid/ready handshake
- **Suggested id:** `dv-23`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  Write SVA properties for AXI-style channels: (1) valid must stay asserted until ready; (2) payload stable while stalled; (3) no X on valid after reset. Discuss `assume` vs `assert` for master vs slave ports in a formal TB.
- **Short answer:**
  Assert stability/X-clean on the DUT-driven side; assume the same on TB-driven side in formal so the tool doesn’t generate illegal stimulus. Simulation VIP usually asserts both directions.
- **Detailed answer:**
  ```systemverilog
  property p_valid_hold;
    @(posedge clk) disable iff (!rst_n)
      valid && !ready |=> valid;
  endproperty

  property p_payload_stable;
    @(posedge clk) disable iff (!rst_n)
      valid && !ready |=> $stable(data) && $stable(keep);
  endproperty

  property p_valid_known;
    @(posedge clk) disable iff (!rst_n)
      !$isunknown(valid);
  endproperty

  assert property (p_valid_hold);
  assert property (p_payload_stable);
  assert property (p_valid_known);
  ```
  Formal: if TB drives `ready`, `assume property` on ready liveness/`s_eventually ready` carefully — over-strong assumes can prove false confidence. Prefer bounded `##[0:MAX] ready` as assume if fairness needed.
- **Common pitfalls:**
  - Forgetting KEEP/STROBE in stability set.
  - Asserting against unconstrained formal inputs without assumes.
- **Interviewer follow-ups:**
  - How do you encode “ready can be X only in reset”?
  - AXI AW/W/B coupling properties?
- **Tags:** sva, axi, handshake, formal-assume

---

### Q24. Register sequences: frontdoor, backdoor, mem
- **Suggested id:** `dv-24`
- **Difficulty:** Staff / Principal
- **Company style:** Intel
- **Round:** Onsite Deep-Dive
- **Question:**
  How do UVM RAL sequences (`uvm_reg_hw_reset_seq`, bit-bash, mem walk) complement functional traffic? When is backdoor mem init mandatory for reasonable sim time, and what coverage do you still require via frontdoor?
- **Short answer:**
  Built-in RAL sequences catch reset value and access-policy bugs quickly. Backdoor-load large memories for bringing up data-path tests; still frontdoor-cover CSR programming paths software will use and at least sample mem address ranges via bus.
- **Detailed answer:**
  - **`uvm_reg_hw_reset_seq`:** reads all registers, compares reset values.
  - **Bit bash:** writes walking 1s/0s where RW; checks side effects.
  - **Access sequence:** validates RO/W1C policies.
  - **Mem walk:** address/data marches — often too slow frontdoor for multi-MB SRAMs → backdoor init + targeted frontdoor spots.

  Mix: backdoor preload frame buffers; frontdoor program DMA descriptors (the SW path); scoreboard checks data plane. Explicitly cover “CPU writes CFG enables path” — backdoor-only bring-up misses decoder/bus faults.
- **Common pitfalls:**
  - Shipping with only backdoor CSR writes in tests.
  - Bit-bash on volatile status registers without predict hooks.
- **Interviewer follow-ups:**
  - How do you skip unsupported built-in tests for WO/reserved fields?
  - Concurrent RAL sequence locking (`uvm_reg_map` semaphore)?
- **Tags:** ral, reg-sequences, backdoor, mem-walk

---

### Q25. Layered sequences and scenario libraries
- **Suggested id:** `dv-25`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia
- **Round:** Onsite Deep-Dive
- **Question:**
  Design a layered UVM stimulus architecture for a GPU command processor: software-visible PM4 packets → privileged register programming → PCIe TLP sequences → PHY link layer. Where do constraints live at each layer, and how do you debug a failure attributed to the wrong layer?
- **Short answer:**
  Each layer exposes sequence APIs and constraints for its abstraction only; higher layers call lower via virtual sequences or translation sequences. Debug with transaction logging at every analysis port and layer-specific protocol checkers to localize the first failing layer.
- **Detailed answer:**
  Layering:
  1. **PHY/link VIP sequences:** ordered sets, SKP, flow control credits.
  2. **TLP sequences:** memory WR/RD, completion reassembly constraints (byte count, lower address).
  3. **Register/RAL layer:** BAR-mapped CSR programming.
  4. **Command packet layer:** random PM4 with architectural constraints (opcode, dword count).
  5. **Scenario virtual sequences:** “submit kick → wait irq → check fence” using all layers.

  Constraints at packet layer must not re-implement PCIe 4K rules already in TLP layer — translate and let lower layers enforce/legalize with hooks for intentional illicit tests (`error_inject` flag).

  Debug: tag transactions with `sequence_id` / `parent_sequence`; scoreboard errors dump the originating layer. Formal on lower FSMs + UVM on system scenarios remains the staff-level split.

  Deliverable in interview: a block diagram of agents, analysis paths, and which objections/coverage live where.
- **Common pitfalls:**
  - God-sequence that wiggles every layer’s pins directly.
  - Duplicating protocol legality in five places that drift.
- **Interviewer follow-ups:**
  - How do you inject a poisoned TLP and still keep upper-layer sequences alive?
  - Virtual interface vs DPI for co-sim with C models at the packet layer?
- **Tags:** layered-stimulus, virtual-sequence, gpu, vip, staff
