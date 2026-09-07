# Verilog & Digital Architecture (RTL)

Domain id: `rtl-verilog-architecture`  
Audience: Nvidia / Qualcomm / Apple / Intel / AMD Staff–Principal VLSI interviews  
Questions: 25

---

### Q01. Blocking vs nonblocking assignments
- **Suggested id:** `rtl-01`
- **Difficulty:** Medium
- **Company style:** Nvidia
- **Round:** Technical Phone Screen
- **Question:**
  Why do we use nonblocking `<=` in sequential `always_ff` and blocking `=` in combinational `always_comb`? What race occurs if you use blocking assigns to infer flops across two `always` blocks?
- **Short answer:**
  Nonblocking schedules NBA updates after all RHS evaluations, modeling parallel flop behavior. Blocking updates immediately, modeling combo logic. Mixing blocking flop assigns across blocks creates read/write race depending on always-block execution order.
- **Detailed answer:**
  At a clock edge, all RHS of `<=` in the design are computed from current values, then all LHS update — matching simultaneous flip-flop sampling. If `always @(posedge clk) q1 = d;` and another block does `q2 = q1;`, simulation order can make `q2` get old or new `q1` — not synthesizable intent for a 2-flop chain.

  Guideline:
  - `always_ff @(posedge clk)` → `<=` only
  - `always_comb` → `=` only, complete LHS assignments to avoid latches
  - Do not mix `=` and `<=` to the same variable

  Staff note: `#0` and NBA scheduling regions matter in testbenches; RTL should stay simple so synthesis and sim agree.
- **Snippet:**
```systemverilog
always_ff @(posedge clk) begin
  q1 <= d;
  q2 <= q1; // shift register — correct with NBA
end
```
- **Common pitfalls:**
  - Blocking assigns in sequential blocks “because it worked in one simulator.”
  - Reading a reg written with `=` in the same combo block before assignment → stale/X.
- **Interviewer follow-ups:**
  - What does `always_latch` imply vs incomplete `always_comb`?
  - Why is `a = a + 1` inside `always_ff` with blocking still a flop but poor style?
- **Tags:** verilog, nba, blocking, races, rtl-style

---

### Q02. FSM encoding: binary, one-hot, gray
- **Suggested id:** `rtl-02`
- **Difficulty:** Medium
- **Company style:** Apple
- **Round:** Technical Phone Screen
- **Question:**
  Compare binary, one-hot, and gray FSM encodings for area, timing, and power. When does one-hot win on a high-frequency GPU control FSM?
- **Short answer:**
  Binary minimizes flops but needs wide decode; one-hot uses N flops for N states with trivial next-state OR-of-inputs and fast output decode; gray minimizes bit toggles on sequential state walks (good for low power / CDC of state). High-speed sparse control often prefers one-hot.
- **Detailed answer:**
  | Encoding | Flops | Next-state logic | Outputs | Notes |
  |---|---|---|---|---|
  | Binary | \(\lceil\log_2 N\rceil\) | Compact but multi-level decode | Often slower | Default synthesis |
  | One-hot | \(N\) | Per-state simple conditions | Outputs tap single bit | Excellent timing |
  | Gray | \(\lceil\log_2 N\rceil\) | Adjacent-only transitions | Medium | Soft-error / power |

  One-hot: illegal states (`==0` or multi-bit) need recovery or X-checks. Synthesis `enum` + `syn_encoding` / `fsm_encoding` attributes guide mapping. For timing-critical APIs (issue control, credit return), one-hot’s output = state bit beats binary decode cones.
- **Common pitfalls:**
  - Assuming one-hot always smaller — flop+routing cost can dominate at large N.
  - Gray encoding when transitions are not adjacent — loses its benefit and complicates logic.
- **Interviewer follow-ups:**
  - How do you safely recover from illegal one-hot states in ISO 26262 designs?
  - Sparse one-hot vs full?
- **Tags:** fsm, one-hot, encoding, timing

---

### Q03. CDC-safe RTL patterns
- **Suggested id:** `rtl-03`
- **Difficulty:** Staff / Principal
- **Company style:** Qualcomm
- **Round:** Onsite Deep-Dive
- **Question:**
  List CDC-safe RTL patterns for (1) single-bit control, (2) multi-bit configuration, (3) data streaming between asynchronous clocks. What must never be done with a 2-FF synchronizer?
- **Short answer:**
  (1) 2-FF sync for single-bit. (2) Handshake or async FIFO / gray pointers for multi-bit. (3) Async FIFO or credited ready/valid with sync of controls only. Never independently 2-FF-sync each bit of a multi-bit bus — bits can skew into illegal combinations.
- **Detailed answer:**
  Patterns:
  - **Pulse → level toggle** in src, sync level, edge-detect in dst for single-cycle pulses.
  - **Req/ack handshake** for multi-bit payload stability while req is held.
  - **Async FIFO:** binary counters locally, gray-sync pointers across domains, memory is dual-clock.
  - **Mux-recirc / quasi-static:** config bits change only while consumer is held in reset or gated — documented false path.

  Forbidden: `dst <= sync(src_bus[i])` per bit; `if (sync_valid) data <= unsynced_data` without holding data stable.

  Staff: mention MTBF via sync depth, naming conventions for CDC tools (`_async`, `_meta`), and why gray code only works for counters that change by ±1.
- **Snippet:**
```systemverilog
// pulse stretch to toggle
always_ff @(posedge clk_src)
  if (pulse) toggle <= ~toggle;
// 2FF in dst + rise detect
always_ff @(posedge clk_dst)
  {sync_ff2, sync_ff1} <= {sync_ff1, toggle};
assign pulse_dst = sync_ff2 ^ sync_ff1;
```
- **Common pitfalls:**
  - Sync’ing a multi-bit counter in binary.
  - Using the unsynchronized data with a synchronized valid from a different cycle.
- **Interviewer follow-ups:**
  - Why is gray(pointer+1) computed in binary then converted?
  - 3-FF vs 2-FF tradeoff?
- **Tags:** cdc, synchronizer, async-fifo, gray

---

### Q04. Pipeline hazards: structural, data, control
- **Suggested id:** `rtl-04`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia
- **Round:** Onsite Deep-Dive
- **Question:**
  In a 5-stage RISC-like pipeline (F/D/X/M/W), explain structural, data (RAW/WAR/WAW), and control hazards. How do you implement hazard detection and forwarding in RTL at a Staff level?
- **Short answer:**
  Structural: resource conflict (one mem port). Data RAW: use forwarding + stall if load-use. WAR/WAW rare in simple in-order with fixed writeback. Control: branch redirect + flush younger instructions; predictors reduce penalty.
- **Detailed answer:**
  RTL pieces:
  - **Scoreboard / hazard unit:** compare D-stage source regs vs X/M/W destinations; generate `stall_f_d` and `forward_a/b` mux selects.
  - **Forwarding muxes:** X-stage ALU inputs can take M or W results.
  - **Load-use:** if M is load targeting X’s source → insert bubble (freeze F/D, inject NOP into X).
  - **Control:** branch resolves in X; squash D/X instructions via `valid` clears; PC redirect.

  Microarch interview bar: discuss delay slots (legacy), branch predictors, and why valid bits per stage beat “global stall” for multi-issue GPUs (per-lane scoreboarding).
- **Common pitfalls:**
  - Forwarding from W while forgetting W also writes the regfile same cycle (bypass vs regfile timing).
  - Stalling only PC but not freezing decode registers → duplicate issue.
- **Interviewer follow-ups:**
  - How does a dual-issue pipe change structural hazard logic?
  - Store-load forwarding in the MEM stage?
- **Tags:** pipeline, hazards, forwarding, stall

---

### Q05. FIFO pointers and full/empty
- **Suggested id:** `rtl-05`
- **Difficulty:** Hard
- **Company style:** Intel
- **Round:** Onsite Technical Round 1
- **Question:**
  For a synchronous FIFO depth 8, how do you generate full and empty with binary pointers? Why do people use an extra pointer bit or count register? Extend to async FIFO gray pointers.
- **Short answer:**
  Empty when read==write pointer; full when pointers differ only in the MSB wrap bit (N+1 bit pointers) or when count==DEPTH. Async: keep local binary for mem addressing, convert to gray, sync gray, convert back for compare.
- **Detailed answer:**
  Depth-8 → 3-bit address. With 3-bit pointers alone, full and empty both look like equality after wrap — ambiguous. Fixes:
  1. **4-bit pointers:** empty if equal; full if MSBs differ and LSBs equal.
  2. **Count:** increment on write-only, decrement on read-only, hold on both/neither.

  Async FIFO:
  ```text
  wr_bin -> wr_gray -> sync to rd clk -> compare with rd_gray
  rd_bin -> rd_gray -> sync to wr clk -> compare with wr_gray
  ```
  Full checked in write domain; empty in read domain. Never compare binary across domains.
- **Common pitfalls:**
  - Checking full in the wrong clock domain.
  - Using combination gray increment without registering — multi-bit transitions.
- **Interviewer follow-ups:**
  - Exact gray code formula `g = b ^ (b>>1)` and inverse.
  - Almost-full thresholds for cut-through flow control?
- **Tags:** fifo, pointers, gray, full-empty

---

### Q06. Arbiter fairness: fixed vs round-robin
- **Suggested id:** `rtl-06`
- **Difficulty:** Staff / Principal
- **Company style:** AMD
- **Round:** Onsite Deep-Dive
- **Question:**
  Design a 4-port round-robin arbiter with grant / request. How do you ensure fairness under persistent requests, and how does a masked priority arbiter implement RR in RTL?
- **Short answer:**
  RR rotates priority to the peer after the last grant. Implement as two priority arbiters: one on requests masked above the pointer, one on unmasked; prefer upper mask hit else lower. Fixed priority starves low clients.
- **Detailed answer:**
  Classic Lamport/mask RR:
  - Maintain `ptr` one-hot or binary of last grant.
  - `req_masked = req & ~mask(ptr)` (requests strictly above last grant in ring order).
  - If `|req_masked`, grant = priority_find_first(req_masked); else grant = priority_find_first(req).
  - Update `ptr` from grant when any grant issues.

  Properties: starvation-free if every granted client eventually drops req or is limited by quantum. For NoCs, weighted RR / age-based / credit-aware variants appear — know tradeoffs for QoS.

  Formal: assert no two grants; assert that if req[i] held continuously, grant[i] within N cycles.
- **Snippet:**
```systemverilog
// priority encode example (LSB highest)
always_comb begin
  grant = '0;
  for (int i = 0; i < N; i++)
    if (req_rot[i]) begin grant_rot[i] = 1'b1; break; end
end
```
- **Common pitfalls:**
  - Updating pointer combinationally from grant causing loops.
  - Granting when request already deasserted mid-cycle (need registered req or Mealy carefully).
- **Interviewer follow-ups:**
  - How do you add preemption for a high-priority client?
  - Matrix arbiter vs RR for 16×16?
- **Tags:** arbiter, round-robin, fairness, noc

---

### Q07. Async assert, sync deassert reset
- **Suggested id:** `rtl-07`
- **Difficulty:** Medium
- **Company style:** Qualcomm
- **Round:** Technical Phone Screen
- **Question:**
  Why assert reset asynchronously but deassert synchronously? Draw the 2-flop reset synchronizer and explain recovery/removal timing on the first flop.
- **Short answer:**
  Async assert immediately forces known state even if clocks are off. Sync deassert ensures all flops exit reset on the same clock edge, avoiding partial release and metastability on deassert. A 2-FF sync chain releases `rst_n` cleanly in the clock domain.
- **Detailed answer:**
  ```systemverilog
  always_ff @(posedge clk or negedge rst_async_n)
    if (!rst_async_n) {q2,q1} <= 2'b00;
    else              {q2,q1} <= {q1,1'b1};
  assign rst_sync_n = q2;
  ```
  First flop can go metastable when async release violates recovery/removal vs `clk`; second flop filters. All functional flops use `rst_sync_n` as async clear/preset.

  Don’t OR unrelated async resets into one tree without synchronizing per domain. Reset tree buffering is a PD concern — RTL must still declare correct sensitivity.
- **Common pitfalls:**
  - Deasserting async reset combinationally mid-cycle → some flops released, others not.
  - Using sync-only reset when clocks may be gated at power-up.
- **Interviewer follow-ups:**
  - How do scan and async reset interact (`dft` mux)?
  - Reset stretching across multiple clocks?
- **Tags:** reset, synchronizer, async-assert, rtl

---

### Q08. Generate constructs
- **Suggested id:** `rtl-08`
- **Difficulty:** Medium
- **Company style:** Intel
- **Round:** Technical Phone Screen
- **Question:**
  When do you use `generate for` vs arrayed module instantiations vs a single wide procedural block? What are elaboration-time vs simulation-time limitations of `generate if`?
- **Short answer:**
  `generate` elaborates structural hierarchy (instances, continuous assigns, assertions) based on parameters. Use it for scalable arrays of cells/FIFOs. `generate if` conditions must be constant at elaboration — not runtime signals.
- **Detailed answer:**
  ```systemverilog
  genvar i;
  generate
    for (i = 0; i < N; i++) begin : g_pipe
      pipe_stage #(.W(W)) u (.clk(clk), .d(d[i]), .q(d[i+1]));
    end
  endgenerate
  ```
  Prefer generate when you need **named hierarchy** for binding SVA, or different instance types via `generate if (USE_ECC)`. For simple bitwise ops, a single `always_comb` with `for` loop is clearer and synthesizes fine.

  Cannot put `generate` inside processes. `genvar` is elaboration-only.
- **Common pitfalls:**
  - Trying to `generate if (runtime_signal)`.
  - Accidental latch inference inside generated combo blocks with incomplete assigns.
- **Interviewer follow-ups:**
  - How do hierarchical names `g_pipe[2].u` appear in STA reports?
  - `generate` vs array of instances with `.conn(bus[i])`?
- **Tags:** generate, elaboration, parameterized-rtl

---

### Q09. Parameterized modules and `localparam`
- **Suggested id:** `rtl-09`
- **Difficulty:** Hard
- **Company style:** Apple
- **Round:** Onsite Technical Round 1
- **Question:**
  How do you write a reusable parameterized FIFO with width/depth? Contrast `parameter`, `localparam`, and `#(parameter ...)` port-style. What breaks when depth is not a power of two?
- **Short answer:**
  Expose `WIDTH`/`DEPTH` as parameters; derive `ADDR_W=$clog2(DEPTH)` as localparam. Non-power-of-two depths need careful full/empty (count-based) rather than MSB-wrap pointer tricks that assume power-of-two.
- **Detailed answer:**
  ```systemverilog
  module sync_fifo #(
    parameter int WIDTH = 32,
    parameter int DEPTH = 8
  )(
    input  logic             clk, rst_n, we, re,
    input  logic [WIDTH-1:0] din,
    output logic [WIDTH-1:0] dout,
    output logic             full, empty
  );
    localparam int ADDR_W = $clog2(DEPTH);
    ...
  endmodule
  ```
  `$clog2(8)=3`, `$clog2(7)=3` still — max index 6 needs 3 bits, but pointer wrap logic `+1` mod DEPTH ≠ mod 2^ADDR_W. Use modular arithmetic or count.

  Overrides: `sync_fifo #(.WIDTH(64), .DEPTH(16)) u(...)`. Don’t allow contradictory parameters without elaboration asserts: `if (DEPTH<2) $error(...)`.
- **Common pitfalls:**
  - Using `parameter ADDR_W = $clog2(DEPTH)` incorrectly for DEPTH=1.
  - Mixing ANSI and non-ANSI parameter overrides confusingly.
- **Interviewer follow-ups:**
  - `parameter type T = logic [7:0]` — typed parameters?
  - Why prefer `localparam` for derived constants?
- **Tags:** parameter, fifo, clog2, reuse

---

### Q10. `casez` / `casex` hazards
- **Suggested id:** `rtl-10`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  Why is `casex` dangerous in RTL? How does `casez` treat Z vs X, and what is the safer modern alternative for decode with don’t-cares?
- **Short answer:**
  `casex` treats X and Z as don’t-care in both case item and expression — Xs in the select can match unexpected branches (X-optimism). `casez` only treats Z/`?` as don’t-care. Prefer `unique case` / `priority case` with explicit `?` in items only, or mask-based decode.
- **Detailed answer:**
  If `case (sel)` uses `casex` and `sel=4'b10xx`, it may match `4'b1001` item even though silicon `sel` isn’t don’t-care — sim/synth mismatch risk. Lint tools ban `casex` in synthesizable RTL.

  Safer:
  ```systemverilog
  unique casez (opcode)
    8'b0001_????: /* ... */;
    8'b0010_????: /* ... */;
    default: /* illegal */;
  endcase
  ```
  `unique` adds runtime/formal check that exactly one item matches (no overlap). Overlaps with don’t-cares are a common bug.
- **Common pitfalls:**
  - Using `casex` for APB decode with X on address during reset.
  - Overlapping `casez` items without `unique`/`priority`.
- **Interviewer follow-ups:**
  - Difference between `unique` and `unique0`?
  - How does synthesis treat overlapping case items?
- **Tags:** casex, casez, decode, x-optimism

---

### Q11. Latches vs flip-flops
- **Suggested id:** `rtl-11`
- **Difficulty:** Medium
- **Company style:** AMD
- **Round:** Technical Phone Screen
- **Question:**
  How does incomplete assignment in `always_comb` infer a latch? When are latches intentionally used (time borrowing), and why do most digital SoC flows forbid unintentional latches?
- **Short answer:**
  If a combo path doesn’t assign an output under all conditions, synthesis keeps prior value → latch. Intentional latches enable cycle stealing on critical paths but complicate STA (transparent windows, pulse generators). Unintentional latches fail lint and cause hold nightmares.
- **Detailed answer:**
  ```systemverilog
  always_comb
    if (en) q = d; // missing else q = q; → latch
  ```
  Fix: assign default before if, or use `always_ff` for storage.

  Intentional latch pipelines (Intel-style) need 2-phase non-overlap clocks and specialized methodology — not ad-hoc. For interviews: know detection (`check_design`, lint), and that `always_latch` documents intent.
- **Common pitfalls:**
  - Case without default on enum FSM next-state.
  - Assuming FPGA tools “optimize latches away” safely.
- **Interviewer follow-ups:**
  - How does STA time-borrow through a latch?
  - Why are latch-based register files used in some CPUs?
- **Tags:** latch, flop, inference, sta

---

### Q12. One-hot FSM RTL style
- **Suggested id:** `rtl-12`
- **Difficulty:** Hard
- **Company style:** Apple
- **Round:** Onsite Technical Round 1
- **Question:**
  Write a clean one-hot FSM using an `enum` of 1-hot literals. How do you compute next-state with parallel `if` on `state[S]` bits, and how do you assert illegal states?
- **Short answer:**
  Define states as one-hot enum values; register `state`; drive `next` combinationally from bit tests; assert `$onehot(state)` after reset. Outputs can be Moore (decode state) or Mealy (state+inputs).
- **Detailed answer:**
  ```systemverilog
  typedef enum logic [3:0] {
    S0 = 4'b0001,
    S1 = 4'b0010,
    S2 = 4'b0100,
    S3 = 4'b1000
  } state_t;
  state_t state, next;

  always_ff @(posedge clk or negedge rst_n)
    if (!rst_n) state <= S0;
    else        state <= next;

  always_comb begin
    next = state;
    unique case (state)
      S0: if (go) next = S1;
      S1: next = S2;
      S2: if (done) next = S3; else next = S1;
      S3: next = S0;
      default: next = S0; // recovery
    endcase
  end
  assert property (@(posedge clk) disable iff(!rst_n) $onehot(state));
  ```
  Synthesis may re-encode unless attributes preserve one-hot — verify in netlist if timing depended on it.
- **Common pitfalls:**
  - Enum auto-sequential encoding accidentally binary.
  - Forgetting default recovery — FSM lockup in illegal state.
- **Interviewer follow-ups:**
  - Safe FSM vs fully enumerated?
  - Output registered vs combo from one-hot?
- **Tags:** onehot, fsm, enum, assert

---

### Q13. AXI / valid-ready handshake basics
- **Suggested id:** `rtl-13`
- **Difficulty:** Medium
- **Company style:** Nvidia
- **Round:** Technical Phone Screen
- **Question:**
  Explain valid/ready handshake rules. Who can wait for whom? When may data change? Implement a skid buffer and explain why it is needed between two registered ready-valid stages.
- **Short answer:**
  Transfer occurs when `valid&&ready` in the same cycle. Source must hold valid+data while valid&&!ready. Ready may depend on valid (combinational) but that risks combo loops — often register ready with a skid/elasticity buffer to break timing.
- **Detailed answer:**
  Skid buffer: when downstream deasserts ready, upstream may already have launched a beat; skid captures that beat so upstream ready can drop without combinatorial dependence.

  Two back-to-back `if (ready) q<=d` stages with `ready=downstream_ready` registered incorrectly can drop data. Standard pattern: store pipeline with `valid` bits and bubble insertion when `~ready`.

  AXI specifics: separate channels; AW/W ordering rules; ID-based response ordering — know at least channel independence and stability rules for interviews.
- **Common pitfalls:**
  - Data changing while stalled.
  - Combo path `ready = valid & ...` creating loops through both sides.
- **Interviewer follow-ups:**
  - Decouple with FIFO vs skid — when each?
  - AXI-Stream vs AXI4-Lite differences?
- **Tags:** axi, valid-ready, skid, handshake

---

### Q14. Clock gating enable correctness
- **Suggested id:** `rtl-14`
- **Difficulty:** Hard
- **Company style:** Qualcomm
- **Round:** Onsite Technical Round 1
- **Question:**
  How must a clock-gate enable be timed relative to the clock? Why do we use an integrated clock gating cell (latch + AND) instead of a naked AND gate on clock?
- **Short answer:**
  Enable must be stable during the clock-high (for AND-high gates) so the latch in ICG captures enable when clock is low and freezes it while clock is high — glitch-free. Naked AND of `clk & enable` glitches when enable falls while clk is high.
- **Detailed answer:**
  ICG functional model:
  - Transparent latch passes `en` when `clk=0`
  - When `clk=1`, latch opaque — `en_latched` stable
  - Gated clock = `clk & en_latched`

  RTL: use `always_ff` enables and let synthesis insert ICGs via `clock_gating` / hierarchical CG. Explicit RTL ANDing clocks is a lint violation.

  Functional enable may be OR of many conditions — register it and STA treats ICG enable like a setup path to the latch.
- **Common pitfalls:**
  - Gating with XOR for “toggles” without glitch analysis.
  - Glitchy combo enable into ICG (still setup, but functional hazards if used elsewhere).
- **Interviewer follow-ups:**
  - How does DFT scan bypass ICGs?
  - Clock gate overrides for debug?
- **Tags:** clock-gating, icg, glitch, low-power

---

### Q15. Glitch-free clock mux
- **Suggested id:** `rtl-15`
- **Difficulty:** Staff / Principal
- **Company style:** Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  Design a glitch-free mux between two asynchronous clocks. Why is a plain data `mux` on clocks illegal, and how do synchronizers + “make-before-break / break-before-make” sequences avoid runt pulses?
- **Short answer:**
  A combinational mux on clocks produces glitches during select transitions. Glitch-free clock switchers disable both clocks (or use carefully sequenced enables) with sync handshakes before enabling the new source — break-before-make.
- **Detailed answer:**
  Approach:
  1. Request switch to `clk_b`.
  2. Deassert ICG enable for `clk_a` path; wait synced “off” confirmation.
  3. Assert enable for `clk_b` after sync into `clk_b` domain.
  4. Special cells (glitch-free clock mux IP) encapsulate this.

  Never switch on a data mux cell. For related clocks (same PLL divided), glitch-free mux IP still recommended; phase relationships may allow simpler designs but need PD signoff.

  Staff: discuss metastability on select path, lockup if both off forever, and DFT clock switching.
- **Common pitfalls:**
  - Using `assign clk = sel ? clk1 : clk2;`.
  - Switching without waiting for clock-off → OR of two clocks briefly.
- **Interviewer follow-ups:**
  - How do you switch among N>2 clocks?
  - Relation to UPF clock isolation?
- **Tags:** clock-mux, glitch-free, icg, staff

---

### Q16. Priority encoder RTL
- **Suggested id:** `rtl-16`
- **Difficulty:** Medium
- **Company style:** Intel
- **Round:** Technical Phone Screen
- **Question:**
  Write a synthesizable priority encoder for an 8-bit request vector (LSB highest priority). Discuss timing depth vs a logarithmic tree encoder for wide vectors (64+).
- **Short answer:**
  A sequential `for` loop if-break yields a priority chain — simple but O(N) logic depth. Wide arbiters use hierarchical/tournament trees O(log N) for timing closure at GHz.
- **Detailed answer:**
  ```systemverilog
  always_comb begin
    grant = '0;
    found = 1'b0;
    for (int i = 0; i < 8; i++) begin
      if (!found && req[i]) begin
        grant[i] = 1'b1;
        found = 1'b1;
      end
    end
  end
  ```
  Synthesis maps to AOI chains. For 128 requesters at high freq, break into groups of 8, encode locally, then encode group winners — same as RR building blocks.
- **Common pitfalls:**
  - Multiple grants if forgetting to suppress after first hit.
  - Using `casex` on req for priority — fragile.
- **Interviewer follow-ups:**
  - Find-first-one leading zero count circuits?
  - One-hot vs binary grant output?
- **Tags:** priority-encoder, arbiter, timing

---

### Q17. Mealy vs Moore machines
- **Suggested id:** `rtl-17`
- **Difficulty:** Medium
- **Company style:** AMD
- **Round:** Technical Phone Screen
- **Question:**
  Contrast Mealy and Moore output formation. Which is safer for CDC-facing control outputs, and how do registered outputs change the classification?
- **Short answer:**
  Moore outputs depend only on state (stable between edges); Mealy depends on state+inputs (can glitch when inputs glitch). Registered outputs (state → combo → flop) give synchronous clean outputs preferred at block boundaries.
- **Detailed answer:**
  Mealy can react same-cycle (lower latency) but creates combo paths from inputs to outputs — bad for timing budgets and glitch-sensitive enables. Moore adds at least one cycle latency.

  Best practice at IP boundary: registered Moore-style outputs. Internally Mealy OK if contained. For CDC, only synchronized, glitch-free level signals may cross — never raw Mealy pulses.
- **Common pitfalls:**
  - Decoding Mealy grant into another clock domain.
  - Calling a registered-output FSM “pure Mealy” incorrectly.
- **Interviewer follow-ups:**
  - Output registered in parallel with state vs after?
  - How do FPGA tools report FSM style?
- **Tags:** mealy, moore, fsm, glitch

---

### Q18. Inferring RAM vs flip-flop arrays
- **Suggested id:** `rtl-18`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  What RTL coding patterns infer SRAM vs a bank of flops? Why might a “reg [W-1:0] mem [0:D-1];” still become flops, and how do you write vendor-friendly dual-port RAM inference?
- **Short answer:**
  Large arrays with synchronous read/write and no reset on every word infer RAM. Async read, per-word resets, or small depths often map to flops. Follow vendor templates for true dual-port (two clocks/addresses).
- **Detailed answer:**
  Flop-inferred when: depth small, async read `assign q = mem[a]`, or `mem[i] <= '0` under reset for all i. RAMs typically cannot clear all locations in one cycle — that pattern forces flops.

  Sync read template:
  ```systemverilog
  always_ff @(posedge clk) begin
    if (we) mem[addr] <= din;
    dout <= mem[addr]; // read-old or read-new policies vary
  end
  ```
  Document read-during-write behavior; mismatch vs simulation is a classic silicon bug. For multi-GHz GPUs, instantiate hardened SRAM macros via wrappers, not inference.
- **Common pitfalls:**
  - Assuming inference always works across vendors.
  - Mixing async and sync reads on same array.
- **Interviewer follow-ups:**
  - ECC wrapper around inferred RAM?
  - Byte enables inference?
- **Tags:** ram-inference, sram, memory, rtl

---

### Q19. Signed arithmetic and width extension
- **Suggested id:** `rtl-19`
- **Difficulty:** Hard
- **Company style:** Intel
- **Round:** Onsite Technical Round 1
- **Question:**
  In SystemVerilog, how do `signed` types, `$signed()`, and width extension rules interact in an expression mixing signed and unsigned? Give a bug where a subtractor wraps unexpectedly.
- **Short answer:**
  If any operand is unsigned, the expression is unsigned — negative signed values become huge positives after zero-extension. Cast both sides with `$signed` or declare signed types consistently; match widths explicitly.
- **Detailed answer:**
  Example bug:
  ```systemverilog
  logic signed [7:0] a;
  logic        [7:0] b;
  logic signed [8:0] diff;
  assign diff = a - b; // b unsigned ⇒ a treated unsigned
  ```
  If `a=-1` (8'hFF) and `b=1`, unsigned math gives `0xFF-0x01=0xFE`, not `-2`.

  Fix: `assign diff = $signed(a) - $signed(b);` with wide enough LHS. For arithmetic right shift use `>>>` on signed values; `>>` always logical on unsigned.

  Staff: know self-determined vs context-determined widths in Verilog LRM — intermediate widths surprise people in multiplies/adds.
- **Common pitfalls:**
  - Comparing signed negative to unsigned threshold.
  - Truncating multiply MSB product bits unintentionally.
- **Interviewer follow-ups:**
  - How do you saturating-add in RTL?
  - Fixed-point Q-format alignment?
- **Tags:** signed, verilog-width, arithmetic, bugs

---

### Q20. Synchronous FIFO almost-full and cut-through
- **Suggested id:** `rtl-20`
- **Difficulty:** Hard
- **Company style:** Broadcom
- **Round:** Onsite Technical Round 1
- **Question:**
  A producer cannot throttle until 3 cycles after `almost_full`. Size the threshold for a depth-32 FIFO so it never overflows. Explain cut-through vs store-and-forward at the consumer.
- **Short answer:**
  Threshold must reserve at least the pipeline bubbles of in-flight writes after almost_full asserts: `almost_full when count >= DEPTH - LATENCY`. Cut-through starts reading before full packet arrives (lower latency); store-and-forward waits for complete packet (simpler flow control).
- **Detailed answer:**
  If after AF rises, up to L more writes can occur: set watermark at `DEPTH-L`. Example L=3, DEPTH=32 → AF when `count>=29`. Cover simultaneous read+write: if a read happens in the window, margin increases — worst-case sizing ignores beneficial reads unless guaranteed.

  Cut-through: forward as soon as header/first beat available — needs packet-length/abort handling. Networking switches use cut-through; many on-chip FIFOs are beat-based ready/valid (neither packet notion).
- **Common pitfalls:**
  - Watermark = DEPTH-1 with multi-cycle throttle latency → overflow.
  - Forgetting simultaneous both-sides transactions in count update.
- **Interviewer follow-ups:**
  - How does credit-based flow control replace almost_full?
  - Elastic buffer in SerDes PCS — similar math?
- **Tags:** fifo, almost-full, watermark, flow-control

---

### Q21. Pipeline bubble insertion and valid bits
- **Suggested id:** `rtl-21`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Deep-Dive
- **Question:**
  Describe an RTL pattern for a stallable pipeline using per-stage `valid` bits. How do you kill instructions on branch mispredict without leaving stale valids, and how does backpressure propagate?
- **Short answer:**
  Each stage register holds `{valid, payload}`. A stage accepts input when `~valid_q || ready_down` (can overwrite bubble or advancing). Stall freezes stage when valid and downstream not ready. Flush clears valid bits for younger stages.
- **Detailed answer:**
  ```systemverilog
  wire advance = valid_i && (!valid_q || ready_o);
  always_ff @(posedge clk) begin
    if (!rst_n) valid_q <= 0;
    else if (flush) valid_q <= 0;
    else if (advance) begin
      valid_q <= 1'b1;
      data_q  <= data_i;
    end else if (ready_o) valid_q <= 1'b0; // optional drain
  end
  assign ready_i = !valid_q || ready_o;
  ```
  Backpressure is combinatorial `ready` chain — may need skid at timing-critical points. Flush must have clear priority over advance.
- **Common pitfalls:**
  - Clearing data but not valid (or vice versa).
  - Ready chain too long for timing — must pipeline ready with skids.
- **Interviewer follow-ups:**
  - Elastic vs inelastic pipelines?
  - Multi-thread valid vectors (GPU warps)?
- **Tags:** pipeline, valid, stall, flush, backpressure

---

### Q22. Multi-cycle path intent in RTL
- **Suggested id:** `rtl-22`
- **Difficulty:** Staff / Principal
- **Company style:** Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  How should RTL express a multicycle path so synthesis/STA can be constrained safely? What handshake guarantees are required before `set_multicycle_path` is legal?
- **Short answer:**
  Data must be stable for N cycles at the capture flop; enable/qualifiers must ensure launch changes only every N cycles. SDC MCP alone without RTL stability is a silicon bug. Prefer explicit qualifiers (`en` flop) over tribal knowledge.
- **Detailed answer:**
  Pattern: launching side updates `data` only when `issue` pulses every N cycles; capturing side samples on `capture_en` aligned to the same schedule. SDC: `set_multicycle_path N -setup; set_multicycle_path N-1 -hold` (details depend on methodology).

  Staff failure mode: MCP applied to a path that still toggles every cycle under rare modes — must cover with assertions that `data` is stable between enables, and mode-based false paths when reconfigured.

  Don’t use MCP to “fix” timing instead of pipelining unless protocol truly allows.
- **Common pitfalls:**
  - MCP without hold adjustment.
  - Forgetting secondary modes where the path becomes single-cycle.
- **Interviewer follow-ups:**
  - How do you verify MCP with formal stability properties?
  - Interaction with retiming?
- **Tags:** multicycle, sdc, rtl-intent, staff

---

### Q23. Reset values: X vs known, don’t-care
- **Suggested id:** `rtl-23`
- **Difficulty:** Staff / Principal
- **Company style:** Intel
- **Round:** Hiring Manager Round
- **Question:**
  Which flops must reset to known values, which can be left uninitialized, and how do you balance reset fanout power/area vs X risk? Tie to DV X-prop strategy.
- **Short answer:**
  Control FSMs, valids, credits, and security-sensitive state must reset. Datapath/pipeline payload flops often omit reset to save routing if valids ensure consumers ignore them — but DV must prove no X leakage into control. Document and lint.
- **Detailed answer:**
  Cost: async reset nets are high-fanout; resetting every pipeline data flop is expensive. Industry pattern: reset `valid`/tag/FSM; leave `data` payload alone; assert `valid → !$isunknown(control_fields)`.

  Memories: typically no reset of contents — software/RTL initializes. Sparse resets need ECO-awareness.

  Interview: show you can negotiate with DV/PD — not “reset everything” or “reset nothing.”
- **Common pitfalls:**
  - Unreset valid bits → permanent phantom transactions after power-up.
  - Assuming synthesis ties unreset flops to 0 (it may not).
- **Interviewer follow-ups:**
  - Retention flops in UPF — reset semantics across power cycles?
  - Soft reset vs hard reset subsets?
- **Tags:** reset, x-init, area, methodology, staff

---

### Q24. Glitchy combo hazards into flops
- **Suggested id:** `rtl-24`
- **Difficulty:** Hard
- **Company style:** AMD
- **Round:** Onsite Technical Round 1
- **Question:**
  Can glitches on combinational logic into a flop D-pin cause functional errors if setup/hold to the next edge are met? When do glitches matter (async set/clear, clock gates, latch enables, CDC)?
- **Short answer:**
  Into a synchronous D input, mid-cycle glitches are OK if D is stable before the setup window at the active edge. Glitches are fatal on clocks, async resets, latch enables, and as CDC pulses.
- **Detailed answer:**
  Synchronous discipline: evaluate combo between edges; sample once. Static hazards in SOP logic may pulse D mid-cycle — ignored if settled by setup time.

  Dangerous endpoints: ICG enables (handled by latch window), async clear, mux select on clocks, single-FF pulse synchronizer sources. For those, register then use.

  STA doesn’t “simulate glitches”; use design rules + CDC/RDC tools.
- **Common pitfalls:**
  - Generating a 1-cycle pulse from combo decode and sending across clocks.
  - Using XOR of gray bits as a pulse without care.
- **Interviewer follow-ups:**
  - Hazard coverage in ATPG vs functional?
  - When does retiming move a flop past glitchy logic dangerously?
- **Tags:** glitch, hazard, synchronous, cdc

---

### Q25. Parameterized crossbar / mux tree architecture
- **Suggested id:** `rtl-25`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia
- **Round:** Onsite Deep-Dive
- **Question:**
  Architect an N×M crossbar for a GPU/NoC tile: mux-tree vs matrix, one-hot vs binary select, registered stages, and fairness under contention. What is the Big-O of area and of combo delay for a flat mux matrix?
- **Short answer:**
  Flat matrix: area \(O(N\cdot M\cdot W)\), delay \(O(1)\) mux depth theoretically but wire RC dominates. Tree muxes: delay \(O(\log N)\), area similar order with better PPA at scale. Arbitration separate from datapath; pipeline at floorplan cuts.
- **Detailed answer:**
  Datapath: for each output j, mux among N inputs based on grant one-hot — one-hot mux folds to AND-OR without decode. Binary select needs decode → extra layer.

  Control: N requestors × M resources → often decompose as request to destination, output-side arbiter per column (or input-side). RR per output for fairness.

  Physical: pure combo crossbar fails timing for large N — insert pipe stages, use crossbar networks (Clos, mesh) instead of full connect when \(N\) large.

  Staff whiteboard: draw request → arb → one-hot → data mux → optional skid; discuss fanout on broadcast inputs and clocking.
- **Common pitfalls:**
  - Ignoring wiring congestion — schematic O(1) delay fantasy.
  - Centralized arbiter critical path at high N.
- **Interviewer follow-ups:**
  - How does a folded Beneš network reduce area vs full crossbar?
  - Virtual channels interaction with output arb?
- **Tags:** crossbar, noc, mux-tree, architecture, staff
