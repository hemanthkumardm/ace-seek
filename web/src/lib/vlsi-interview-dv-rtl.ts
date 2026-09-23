/**
 * Design Verification (DV) & RTL Design Interview Masterclass Bank
 * High-yield technical deep-dives for NVIDIA, Qualcomm, Apple, Intel, Broadcom, AMD, ARM.
 * Server-only module imported into vlsi-interview-masterclass-data.ts.
 */

import "server-only";
import type { InterviewQuestion } from "./interview-meta";

export const DV_RTL_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // =========================================================================
  // 🟢 DOMAIN: DESIGN VERIFICATION (DV / UVM / SYSTEMVERILOG)
  // =========================================================================

  {
    id: "dv-01",
    isFreeSample: true,
    company: "qualcomm",
    companyName: "Qualcomm",
    domain: "design-verification",
    domainName: "Design Verification (UVM/SV)",
    role: "Senior Design Verification (DV) Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Why does a UVM test end immediately at time 0 with zero transactions executed? Detail the complete mechanics of the UVM objection mechanism, phase hopping, phase.raise_objection(this) vs phase.drop_objection(this), drain time, and how you diagnose an objection leak.",
    shortSummary: "UVM run-time phases terminate the moment total raised objections in the component hierarchy drop to 0. Missing raise_objection in sequence/test causes time-0 exit.",
    detailedAnswer: `### 1. Root Cause of Time-0 UVM Exit:
In UVM, all time-consuming execution occurs within task phases (primarily \`run_phase(uvm_phase phase)\` or sub-phases like \`main_phase\`).
- When UVM advances into \`run_phase\`, the scheduler queries the global objection counter for that phase.
- If no component or sequence has called \`phase.raise_objection(this)\`, the total active objection count is **0**.
- The UVM phase controller immediately considers \`run_phase\` completed, terminates all child processes spawned under \`run_phase\`, advances to \`extract_phase\`, and calls \`$finish\` at simulation time $0\\,\\text{ns}$!

### 2. Mechanics of UVM Objection Hierarchy:
1. **Hierarchical Propagation**:
   - Calling \`phase.raise_objection(this)\` increments the local objection count and bubbles up the parent hierarchy until reaching the top-level \`uvm_top\`.
   - Each raise MUST be paired with a corresponding \`phase.drop_objection(this)\`.
2. **Where to Raise/Drop Objections**:
   - **Best Practice (UVM 1.2 / IEEE 1800.2)**: Raise and drop objections inside the **test** (e.g. around \`seq.start(m_sequencer)\`) or inside the **top-level virtual sequence**.
   - **Anti-Pattern**: Raising/dropping objections inside low-level drivers or monitors for every individual transaction causes massive simulation performance degradation due to hierarchical table traversals.
3. **Drain Time (Flushing In-Flight Packets)**:
   - When the last objection drops, the DUT pipeline or bus might still have packets traversing FIFOs.
   - Setting a drain time delays phase termination:
   \`\`\`systemverilog
   phase.phase_done.set_drain_time(this, 100ns);
   \`\`\`

### 3. Debugging Objection Leaks (Simulation Hang):
If a test hangs indefinitely because an objection was never dropped:
1. Add command-line flag: \`+UVM_OBJECTION_TRACE\`. This prints every raise/drop with hierarchical path and objection count.
2. In UVM 1.2, call \`phase.phase_done.display_objections()\` in a watchdog timer block.
3. Set an explicit simulation timeout in test top:
   \`\`\`systemverilog
   uvm_top.set_timeout(5ms, 1);
   \`\`\``,
    tclOrVerilogSnippet: {
      lang: "systemverilog",
      code: `// Standard Production UVM Test with Objection Handling
class axi_sanity_test extends uvm_test;
  \`uvm_component_utils(axi_sanity_test)
  axi_env env;

  function new(string name = "axi_sanity_test", uvm_component parent = null);
    super.new(name, parent);
  endfunction

  virtual task run_phase(uvm_phase phase);
    axi_traffic_seq seq = axi_traffic_seq::type_id::create("seq");
    
    // 1. Raise objection to keep run_phase alive
    phase.raise_objection(this, "Starting AXI Sanity Traffic Sequence");
    
    // 2. Set drain time to allow DUT pipelines to flush responses
    phase.phase_done.set_drain_time(this, 200ns);

    // 3. Execute sequence
    seq.start(env.axi_agent.sequencer);

    // 4. Drop objection when sequence execution finishes
    phase.drop_objection(this, "AXI Sanity Traffic Completed");
  endtask
endclass`,
    },
    commonPitfalls: [
      "Raising objections in low-level drivers causing 4x-10x simulator slowdown.",
      "Dropping an objection in a sequence after an unhandled exception or early return, resulting in a permanent test hang.",
      "Forgetting to set a drain time, causing the scoreboard to miss in-flight read responses.",
    ],
    interviewerFollowups: [
      "What happens if raise_objection is called in pre_reset_phase and dropped in post_reset_phase?",
      "How does UVM 1.2 uvm_objection differ from UVM 1.1d in terms of string description overhead?",
    ],
    tags: ["uvm", "objection", "phases", "drain-time", "simulation-hang", "qualcomm"],
  },

  {
    id: "dv-02",
    isFreeSample: true,
    company: "nvidia",
    companyName: "NVIDIA",
    domain: "design-verification",
    domainName: "Design Verification (UVM/SV)",
    role: "Staff ASIC Verification Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Explain how the UVM Factory works internally. Contrast set_type_override_by_type vs set_inst_override_by_type. How do you replace an existing bus driver with an error-injecting driver across a specific agent instance without modifying the testbench or recompiling the environment?",
    shortSummary: "UVM factory uses registry singletons and lookup tables to polymorphically instantiate derived classes without modifying instantiation call sites.",
    detailedAnswer: `### 1. Internal Working of UVM Factory:
The UVM Factory is a centralized polymorphic object creation mechanism.
1. **Registration**: When a class invokes \`\`uvm_component_utils(my_driver)\`\`, it instantiates a static lightweight proxy class (\`uvm_component_registry\`).
2. **Factory Table**: The factory maintains two internal lookup tables:
   - **Type Override Table**: Replaces all future creations of Class A with Class B.
   - **Instance Override Table**: Replaces creations of Class A with Class B only when requested under a matching hierarchical string pattern (e.g. \`"uvm_test_top.env.agent[1].*"\`).
3. **Creation via Proxy**:
   Instead of calling \`new()\`, code calls \`my_driver::type_id::create("drv", this)\`. The factory queries the override tables; if an override matches, it returns an instance of the derived class instead of the base class.

### 2. Type Override vs Instance Override:
| Attribute | \`set_type_override_by_type\` | \`set_inst_override_by_type\` |
| :--- | :--- | :--- |
| **Scope** | Global (all instances of Target across the chip) | Hierarchical string match only |
| **Typical Use** | Replace default scoreboard or VIP protocol version | Inject parity errors into Port 2 while leaving Ports 0, 1, 3 normal |
| **Syntax** | \`set_type_override_by_type(base::get_type(), derived::get_type());\` | \`set_inst_override_by_type("path.to.inst", base::get_type(), derived::get_type());\` |

### 3. Error Injection Without Recompiling:
To test corrupted parity packets on Agent 1 without touching Agent 0 or modifying golden RTL/VIP code:
1. Derive \`axi_err_inject_driver\` from \`axi_driver\`.
2. Inside the specialized test (\`axi_parity_error_test\`), configure the instance override inside \`build_phase\`:
\`\`\`systemverilog
set_inst_override_by_type(
  "env.agent[1].driver",
  axi_driver::get_type(),
  axi_err_inject_driver::get_type()
);
\`\`\`
When \`env.agent[1]\` executes \`build_phase\`, the factory returns \`axi_err_inject_driver\`. All other agents receive the standard \`axi_driver\`.`,
    tclOrVerilogSnippet: {
      lang: "systemverilog",
      code: `// Factory Registration and Instance Override Example
class axi_err_driver extends axi_driver;
  \`uvm_component_utils(axi_err_driver)
  
  function new(string name, uvm_component parent);
    super.new(name, parent);
  endfunction

  virtual task drive_transfer(axi_trans tr);
    if ($urandom_range(0, 100) < 15) begin
      tr.parity = ~tr.parity; // Inject bad parity on 15% of transactions
      \`uvm_info("CORRUPT", "Injected bus parity error!", UVM_LOW)
    end
    super.drive_transfer(tr);
  endtask
endclass

// In test build_phase:
function void axi_error_test::build_phase(uvm_phase phase);
  super.build_phase(phase);
  // Override only agent 1
  set_inst_override_by_type("env.agent[1].driver",
                            axi_driver::get_type(),
                            axi_err_driver::get_type());
endfunction`,
    },
    commonPitfalls: [
      "Calling 'new()' directly instead of 'type_id::create()', which completely bypasses the factory and renders overrides ineffective.",
      "Configuring factory overrides after child build_phase has already run.",
      "Missing the \`uvm_component_utils macro, causing cryptic runtime factory lookup failure.",
    ],
    interviewerFollowups: [
      "Can you override an object from the simulator command line without any code changes? (Yes, via +uvm_set_type_override or +uvm_set_inst_override).",
      "Why must components inherit from uvm_component while sequence items inherit from uvm_sequence_item / uvm_object?",
    ],
    tags: ["uvm", "factory", "overrides", "error-injection", "polymorphism", "nvidia"],
  },

  {
    id: "dv-03",
    isFreeSample: false,
    company: "apple",
    companyName: "Apple",
    domain: "design-verification",
    domainName: "Design Verification (UVM/SV)",
    role: "Silicon Verification Engineer",
    difficulty: "Hard",
    round: "Technical Phone Screen",
    question: "In SystemVerilog constraint solving, explain the behavior of 'solve a before b;'. Does 'solve a before b' change the set of valid legal solution pairs? Detail the difference between 'dist { [0:3] := 1, [4:7] :/ 4 }', 'soft' constraints, and how contradictory constraints are diagnosed.",
    shortSummary: "solve a before b does NOT change the legal solution space; it changes the probability distribution of solutions. soft constraints allow tests to override class defaults without contradictions.",
    detailedAnswer: `### 1. Behavior of 'solve a before b':
Consider:
\`\`\`systemverilog
rand bit a;
rand bit [3:0] b;
constraint c_rel { (a == 1) -> (b == 0); }
\`\`\`
- **Without \`solve a before b\`**:
  - The solver treats $(a, b)$ as a uniform 2D solution space.
  - Pair $(a=1, b=0)$ is 1 solution.
  - Pairs with $a=0$ have 16 valid solutions ($b \\in [0, 15]$).
  - Total valid solution pairs = $1 + 16 = 17$.
  - Probability $P(a = 1) = \\frac{1}{17} \\approx 5.8\\%$.
- **With \`solve a before b\`**:
  - The solver first selects $a \\in \\{0, 1\\}$ with uniform $50\\%$ probability!
  - If $a=1$ is picked, $b$ is forced to $0$.
  - If $a=0$ is picked, $b$ is picked uniformly from $0$ to $15$.
  - Probability $P(a=1) = 50\\%$!
- **Key Takeaway**: \`solve a before b\` **never eliminates solutions or changes legality**. It purely alters the joint probability distribution!

### 2. Weighted Distribution Operators (:= vs :/):
- \`:= (Item Weight)\`: Every value in the range gets the specified weight.
  \`\`\`systemverilog
  b dist { [0:3] := 1, [4:7] := 2 };
  \`\`\`
  Values $0, 1, 2, 3$ each get weight $1$ (total $4$). Values $4, 5, 6, 7$ each get weight $2$ (total $8$).
- \`:/ (Range Weight)\`: The specified weight is divided equally among all values in the range.
  \`\`\`systemverilog
  b dist { [0:3] :/ 4, [4:7] :/ 4 };
  \`\`\`
  The range $[0, 3]$ gets total weight $4$ (each item has $4/4 = 1$). The range $[4, 7]$ gets total weight $4$ (each item has $4/4 = 1$).

### 3. Soft Constraints:
- Defined with keyword \`soft\`: \`constraint c_len { soft len < 10; }\`
- Default sequence item constraints should generally be \`soft\`. If a directed test applies an inline constraint \`req.randomize() with { len == 64; }\`, the solver silently discards the \`soft\` constraint instead of throwing an unresolvable constraint conflict error!`,
    tclOrVerilogSnippet: {
      lang: "systemverilog",
      code: `class packet;
  rand bit is_control;
  rand bit [7:0] payload_len;

  // Change probability of control packets from 1/257 to 50%
  constraint c_order {
    solve is_control before payload_len;
  }

  constraint c_payload {
    (is_control == 1) -> (payload_len == 0);
    (is_control == 0) -> (payload_len inside {[1:255]});
  }

  // Soft constraint allowing test overrides
  constraint c_default_len {
    soft payload_len < 64;
  }
endclass`,
    },
    commonPitfalls: [
      "Assuming 'solve a before b' can resolve cyclic dependencies or fix over-constrained contradictions.",
      "Confusing ':=' with ':/' in weighted distributions, resulting in 10x higher probability on large ranges than intended.",
    ],
    interviewerFollowups: [
      "Can solve before be applied to state variables (non-rand)? (No, only rand variables).",
      "How do you disable a constraint in an active sequence? (pkt.c_payload.constraint_mode(0)).",
    ],
    tags: ["systemverilog", "constrained-random", "solve-before", "soft-constraints", "apple"],
  },

  {
    id: "dv-04",
    isFreeSample: false,
    company: "broadcom",
    companyName: "Broadcom",
    domain: "design-verification",
    domainName: "Design Verification (UVM/SV)",
    role: "Senior DV Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Contrast code coverage vs functional coverage. In a SystemVerilog covergroup, explain auto_bin_max, explicit bins, illegal_bins, and ignore_bins. How do you prevent combinatorial state-space explosion when defining cross coverage between three multi-bit variables?",
    shortSummary: "Code coverage measures execution of RTL code lines/toggles; functional coverage measures adherence to design specification scenarios. Cross explosion is avoided using binof/intersect ignore filters.",
    detailedAnswer: `### 1. Code Coverage vs Functional Coverage:
- **Code Coverage**: Generated automatically by the simulator without user testbench code. Measures:
  - Line / Statement coverage
  - Branch / Decision coverage
  - Condition / Expression coverage (truth table inputs)
  - FSM state & transition coverage
  - Toggle coverage (0->1 and 1->0 on nets)
  *Limitation*: Code coverage can reach $100\\%$ even if a critical feature from the specification was completely omitted from the RTL implementation!
- **Functional Coverage**: Written by the DV engineer based on the verification plan (vPlan). Checks whether specified corner cases (e.g. back-to-back buffer overflow, simultaneous DMA read/write) actually occurred during simulation.

### 2. Coverpoint Bin Types:
- \`auto_bin_max\`: When no bins are specified for an $N$-bit variable, simulator creates up to \`auto_bin_max\` bins (default 64) divided evenly across the values.
- \`explicit bins\`: User-defined values or ranges: \`bins low = {[0:15]};\`.
- \`ignore_bins\`: Excludes specified values from the coverage calculation denominator:
  \`\`\`systemverilog
  ignore_bins reserved = {3'b111};
  \`\`\`
- \`illegal_bins\`: Treats specified values as fatal runtime simulation errors if sampled!
  \`\`\`systemverilog
  illegal_bins bad_state = {2'b11};
  \`\`\`

### 3. Mitigating Cross Coverage State Space Explosion:
A naive cross between three variables $A (16\\text{ bins}) \\times B (16\\text{ bins}) \\times C (16\\text{ bins})$ creates:
$$16 \\times 16 \\times 16 = 4096\\text{ cross bins!}$$
Most of these bins may be invalid or irrelevant, resulting in permanent low coverage numbers.
**Mitigation Techniques**:
1. **Use \`ignore_bins\` with \`binof\` / \`intersect\`**:
   \`\`\`systemverilog
   cross_abc: cross cp_a, cp_b, cp_c {
     ignore_bins no_burst = binof(cp_a) intersect {0} && binof(cp_b) intersect {[1:15]};
   }
   \`\`\`
2. **Coarse Bins for Crosses**: Do not cross raw 32-bit addresses. Map addresses into 3 semantic bins (\`LOW_MEM\`, \`HIGH_MEM\`, \`IO_SPACE\`) before crossing with burst types.`,
    tclOrVerilogSnippet: {
      lang: "systemverilog",
      code: `covergroup axi_cov_cg @(posedge clk);
  cp_burst: coverpoint burst_type {
    bins fixed = {2'b00};
    bins incr  = {2'b01};
    bins wrap  = {2'b10};
    illegal_bins rsvd = {2'b11};
  }

  cp_len: coverpoint burst_len {
    bins single = {0};
    bins short_burst = {[1:7]};
    bins long_burst  = {[8:255]};
  }

  // Controlled Cross Coverage without explosion
  cx_burst_len: cross cp_burst, cp_len {
    // WRAP bursts are only legally defined for lengths 2, 4, 8, 16
    ignore_bins invalid_wrap = binof(cp_burst.wrap) && 
                               !(binof(cp_len) intersect {1, 3, 7, 15});
  }
endgroup`,
    },
    commonPitfalls: [
      "Crossing raw multi-bit integer variables without explicit bins, causing simulator memory exhaustion.",
      "Leaving illegal protocol states as unmonitored instead of using illegal_bins to catch RTL design bugs.",
    ],
    interviewerFollowups: [
      "Can covergroups be sampled procedurally without an event trigger? (Yes, via cg.sample()).",
      "What is the difference between per-instance coverage and cumulative type coverage? (option.per_instance = 1).",
    ],
    tags: ["functional-coverage", "covergroup", "cross-coverage", "code-coverage", "broadcom"],
  },

  {
    id: "dv-05",
    isFreeSample: false,
    company: "intel",
    companyName: "Intel",
    domain: "design-verification",
    domainName: "Design Verification (UVM/SV)",
    role: "Formal & DV Signoff Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Contrast Immediate vs Concurrent SystemVerilog Assertions (SVA). Explain the exact semantic difference between overlapped (|->) and non-overlapped (|=>) implication. Write a complete, synthesizable concurrent SVA property verifying that after an AXI4 ARVALID is asserted with ARREADY=0, ARVALID and ARADDR must remain unchanged until ARREADY=1 is observed.",
    shortSummary: "Immediate assertions evaluate on procedural execution in Active region; concurrent assertions sample in Preponed region on clock edges. |-> evaluates consequent on same tick; |=> evaluates 1 cycle later.",
    detailedAnswer: `### 1. Immediate vs Concurrent Assertions:
- **Immediate Assertions** (\`assert (expr);\`)
  - Evaluated dynamically in the procedural execution flow (like a C \`assert\`).
  - Executes in the simulator's **Active / Reactive region**.
  - Prone to glitching / false failures if inputs change multiple times during zero-delay gate delta cycles.
- **Concurrent Assertions** (\`assert property (prop_name);\`)
  - Temporal multi-cycle checks.
  - Signal values are sampled in the **Preponed region** (before any clock edge transitions occur), completely immune to intra-cycle race conditions!
  - Can be formally proven by Model Checking tools (e.g. JasperGold, VC Formal).

### 2. Overlapped (|->) vs Non-Overlapped (|=>) Implication:
- **Overlapped (\`antecedent |-> consequent\`)**:
  If antecedent evaluates to TRUE on clock tick $N$, consequent MUST evaluate to TRUE on the **same clock tick $N$**.
- **Non-Overlapped (\`antecedent |=> consequent\`)**:
  If antecedent evaluates to TRUE on clock tick $N$, consequent MUST evaluate to TRUE on clock tick **$N+1$** (equivalent to \`antecedent |-> ##1 consequent\`).

### 3. AXI4 Handshake Stability Assertion:
AMBA AXI4 requires: Once \`ARVALID\` is asserted, it MUST remain high, and \`ARADDR\`, \`ARBURST\`, \`ARSIZE\` must remain stable until the transfer is acknowledged with \`ARREADY=1\`.`,
    tclOrVerilogSnippet: {
      lang: "systemverilog",
      code: `module axi_handshake_checker (
  input wire        clk,
  input wire        rst_n,
  input wire        arvalid,
  input wire        arready,
  input wire [31:0] araddr
);

  // Property: ARVALID and ARADDR must remain stable while waiting for ARREADY
  property p_axi_arvalid_stability;
    @(posedge clk) disable iff (!rst_n)
    (arvalid && !arready) |=> (arvalid && $stable(araddr));
  endproperty

  // Property: ARVALID cannot glitch low without a handshake
  property p_no_arvalid_dropout;
    @(posedge clk) disable iff (!rst_n)
    (arvalid && !arready) |=> arvalid;
  endproperty

  assert_ar_stability: assert property (p_axi_arvalid_stability)
    else $error("VIOLATION: AXI ARADDR changed while ARVALID was waiting for ARREADY!");

  cover_ar_handshake: cover property (@(posedge clk) disable iff (!rst_n)
    arvalid && arready);

endmodule`,
    },
    commonPitfalls: [
      "Using immediate assertions inside clocked always blocks where combinatorial delta glitches cause false alarms.",
      "Omitting 'disable iff (!rst_n)', causing false assertion failures during system power-on reset.",
      "Using '|=>' when checking combinational relationships on the same clock cycle.",
    ],
    interviewerFollowups: [
      "How does SVA handle vacuously true properties? (e.g. when antecedent is false).",
      "What is the difference between $rose() and posedge in SVA?",
    ],
    tags: ["sva", "assertions", "axi4", "handshake-stability", "intel", "formal"],
  },

  {
    id: "dv-06",
    isFreeSample: false,
    company: "apple",
    companyName: "Apple",
    domain: "design-verification",
    domainName: "Design Verification (UVM/SV)",
    role: "Lead SoC Verification Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Detail the full architecture of the UVM Register Abstraction Layer (RAL). What is the operational difference between frontdoor access (via Reg2Bus adapter) and backdoor access (via HDL direct path)? How does UVM RAL track desired value vs mirrored value to automatically catch hardware register bugs?",
    shortSummary: "UVM RAL provides high-level register modeling. Frontdoor executes bus transactions; backdoor performs zero-time peek/poke. Desired value represents software intent; mirrored value tracks expected hardware state.",
    detailedAnswer: `### 1. UVM RAL Architecture:
UVM RAL provides an object-oriented software model of all memory-mapped hardware registers, fields, and memories in a chip.
- \`uvm_reg_field\`: The fundamental building block (e.g. a 1-bit enable bit or 4-bit status field). Contains access policy (\`RW\`, \`RO\`, \`WO\`, \`W1C\`, \`RC\`).
- \`uvm_reg\`: Contains fields and an address offset.
- \`uvm_reg_block\`: Groups registers (e.g. UART controller block, PCIe config space).
- \`uvm_reg_map\`: Translates register offsets to physical byte addresses on specific bus interfaces.
- \`uvm_reg_adapter\`: Bridges between UVM generic register transactions (\`uvm_reg_bus_op\`) and actual interface sequence items (\`axi_trans\` or \`apb_trans\`).

### 2. Frontdoor vs Backdoor Access:
| Feature | Frontdoor Access | Backdoor Access |
| :--- | :--- | :--- |
| **Physical Path** | Converted to bus transactions (e.g. APB read/write) driven onto pins by agent driver | Bypasses all buses; directly deposits/reads values into RTL simulator registers via VPI / hierarchical probe |
| **Simulation Time** | Consumes clock cycles (accurate bus timing) | Zero simulation time ($0\\,\\text{ns}$) |
| **Requires** | Active bus clock, reset released, working bus driver | HDL path string configured via \`add_hdl_path()\` |
| **Primary Use** | Standard functional verification of register access | Rapid initialization of 10,000 lookup table registers before running test |

### 3. Desired Value vs Mirrored Value:
- **Desired Value (\`reg.set()\`)**: Represents what software *wants* to write to the register. Setting it does not consume simulation time or update the hardware.
- **Hardware Actual Value**: The physical flip-flop states inside the RTL DUT.
- **Mirrored Value (\`reg.get_mirrored_value()\`)**: UVM RAL's internal tracker of what the hardware *should* currently contain.
- **Automatic Checking**:
  - When \`reg.write(status, value)\` executes frontdoor, the adapter drives the bus. On completion, the mirrored value updates to \`value\`.
  - When \`reg.mirror(status, UVM_CHECK)\` is called, it reads the hardware register via frontdoor, compares the bus response against the internal mirrored value, and automatically flags an error if they mismatch!`,
    tclOrVerilogSnippet: {
      lang: "systemverilog",
      code: `// Example of UVM RAL Adapter Implementation
class reg2apb_adapter extends uvm_reg_adapter;
  \`uvm_object_utils(reg2apb_adapter)

  function new(string name = "reg2apb_adapter");
    super.new(name);
    supports_byte_enable = 0;
    provides_responses = 1;
  endfunction

  virtual function uvm_sequence_item reg2bus(const ref uvm_reg_bus_op rw);
    apb_seq_item apb = apb_seq_item::type_id::create("apb");
    apb.write = (rw.kind == UVM_WRITE);
    apb.addr  = rw.addr;
    apb.data  = rw.data;
    return apb;
  endfunction

  virtual function void bus2reg(uvm_sequence_item bus_item, ref uvm_reg_bus_op rw);
    apb_seq_item apb;
    if (!$cast(apb, bus_item)) return;
    rw.kind   = apb.write ? UVM_WRITE : UVM_READ;
    rw.addr   = apb.addr;
    rw.data   = apb.data;
    rw.status = apb.error ? UVM_NOT_OK : UVM_IS_OK;
  endfunction
endclass`,
    },
    commonPitfalls: [
      "Calling reg.get() and expecting it to read hardware across the bus (get() only returns local desired value; read() executes frontdoor).",
      "Failing to set provides_responses=1 on adapter when the bus protocol returns read data on separate response cycles.",
    ],
    interviewerFollowups: [
      "How does RAL handle W1C (Write-1-to-Clear) fields during mirror(UVM_CHECK)?",
      "What is the performance advantage of using predictor components (explicit prediction vs auto prediction)?",
    ],
    tags: ["uvm-ral", "registers", "frontdoor", "backdoor", "apb", "apple"],
  },

  // =========================================================================
  // 🔵 DOMAIN: RTL DESIGN & MICROARCHITECTURE (VERILOG / SYSTEMVERILOG)
  // =========================================================================

  {
    id: "rtl-01",
    isFreeSample: true,
    company: "nvidia",
    companyName: "NVIDIA",
    domain: "rtl-verilog-architecture",
    domainName: "RTL Design & Architecture",
    role: "Senior RTL Design & Microarchitecture Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Derive the exact mathematical formula for the minimum depth of an Asynchronous FIFO under worst-case burst conditions. Write clock is 100 MHz with 1 wait state per write; read clock is 40 MHz with 3 wait states per read; burst size is 80 data words. Calculate the exact required depth. Explain why binary counters cannot be directly synchronized across clock domains and prove how Gray code pointers guarantee single-bit safety.",
    shortSummary: "Minimum FIFO depth accounts for worst-case burst write arrivals vs read drain rate. Binary counters toggle multiple bits simultaneously, causing catastrophic metastability during CDC; Gray code ensures single-bit transitions.",
    detailedAnswer: `### 1. General Mathematical Derivation for Async FIFO Depth:
Let:
- $f_W$: Write clock frequency ($T_W = 1/f_W$).
- $f_R$: Read clock frequency ($T_R = 1/f_R$).
- $B$: Burst size (number of data words to write).
- $N_W$: Clock cycles required per write transaction ($N_W = 1 + \\text{wait states}$).
- $N_R$: Clock cycles required per read transaction ($N_R = 1 + \\text{wait states}$).

1. **Time required to complete write burst ($T_{\\text{burst}}$)**:
$$T_{\\text{burst}} = B \\times N_W \\times T_W = \\frac{B \\times N_W}{f_W}$$

2. **Number of items read during this exact time interval ($N_{\\text{read}}$)**:
$$N_{\\text{read}} = \\left\\lfloor \\frac{T_{\\text{burst}}}{N_R \\times T_R} \\right\\rfloor = \\left\\lfloor \\frac{T_{\\text{burst}} \\times f_R}{N_R} \\right\\rfloor$$

3. **Minimum FIFO Depth ($D_{\\text{min}}$)**:
$$D_{\\text{min}} = B - N_{\\text{read}}$$

### 2. Numerical Calculation for Problem:
- $f_W = 100\\,\\text{MHz} \\implies T_W = 10\\,\\text{ns}$. $N_W = 1 + 1 = 2\\text{ cycles/write}$.
- $f_R = 40\\,\\text{MHz} \\implies T_R = 25\\,\\text{ns}$. $N_R = 1 + 3 = 4\\text{ cycles/read}$.
- $B = 80\\text{ words}$.

1. Time to write 80 words:
$$T_{\\text{burst}} = 80 \\times 2 \\times 10\\,\\text{ns} = 1600\\,\\text{ns}$$
2. Time per read operation:
$$T_{\\text{read\\_op}} = N_R \\times T_R = 4 \\times 25\\,\\text{ns} = 100\\,\\text{ns/read}$$
3. Items drained during burst:
$$N_{\\text{read}} = \\frac{1600\\,\\text{ns}}{100\\,\\text{ns}} = 16\\text{ words}$$
4. Minimum FIFO Depth:
$$D_{\\text{min}} = 80 - 16 = \\mathbf{64\\text{ words}}$$
*(Rounded up to next power of 2 for Gray code pointer symmetry = 64).*

### 3. Why Binary Counters Fail across CDC:
Consider transitioning from binary \`0111\` (7) to \`1000\` (8).
- **All 4 bits change state simultaneously**.
- In silicon, wire routing and cell delays mean the bits arrive at destination synchronizers with skew:
  $$\\text{Bit 3 might arrive in } 0.2\\,\\text{ns}, \\text{ Bit 0 in } 0.6\\,\\text{ns}.$$
- If the destination clock captures mid-transition, it samples an intermediate phantom value like \`1111\` (15) or \`0000\` (0), triggering false FIFO full or empty flags and corrupting data!

### 4. Gray Code Single-Bit Toggle Guarantee:
Gray code ensures that between any two consecutive numbers, **exactly one bit changes state**:
$$000 \\to 001 \\to 011 \\to 010 \\to 110 \\to 111 \\to 101 \\to 100$$
Even if CDC sampling occurs directly on the edge of transition, the synchronizer can only resolve to either the **old value** or the **new value** — never an arbitrary intermediate state!`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `// Binary to Gray Pointer Conversion and CDC Synchronization
module cdc_gray_sync #(
  parameter ADDR_WIDTH = 6 // 64 entries
)(
  input  wire                  wclk,
  input  wire                  wrst_n,
  input  wire                  winc,
  output reg  [ADDR_WIDTH:0]   wptr_gray,
  input  wire                  rclk,
  input  wire                  rrst_n,
  output reg  [ADDR_WIDTH:0]   wptr_gray_rclk_sync2
);

  reg [ADDR_WIDTH:0] wptr_bin;
  reg [ADDR_WIDTH:0] wptr_gray_next;
  reg [ADDR_WIDTH:0] wptr_gray_rclk_sync1;

  // 1. Binary increment and Gray conversion
  always @(posedge wclk or negedge wrst_n) begin
    if (!wrst_n) begin
      wptr_bin  <= 0;
      wptr_gray <= 0;
    end else if (winc) begin
      wptr_bin  <= wptr_bin + 1'b1;
      wptr_gray <= (wptr_bin + 1'b1) ^ ((wptr_bin + 1'b1) >> 1);
    end
  end

  // 2. Dual-FF synchronizer into Read Clock domain
  always @(posedge rclk or negedge rrst_n) begin
    if (!rrst_n) begin
      wptr_gray_rclk_sync1 <= 0;
      wptr_gray_rclk_sync2 <= 0;
    end else begin
      wptr_gray_rclk_sync1 <= wptr_gray;
      wptr_gray_rclk_sync2 <= wptr_gray_rclk_sync1;
    end
  end
endmodule`,
    },
    commonPitfalls: [
      "Using non-power-of-2 depths with standard Gray code, breaking the single-bit toggle wrap-around guarantee from 2^N-1 to 0.",
      "Synchronizing binary pointers with multi-bit synchronizers instead of Gray code.",
    ],
    interviewerFollowups: [
      "Why must the FIFO depth counter use (ADDR_WIDTH + 1) bits? (MSB distinguishes full from empty).",
      "How do you design an Async FIFO with arbitrary non-power-of-2 depth (e.g. 50 entries)?",
    ],
    tags: ["cdc", "async-fifo", "fifo-depth", "gray-code", "microarchitecture", "nvidia"],
  },

  {
    id: "rtl-02",
    isFreeSample: true,
    company: "arm",
    companyName: "ARM",
    domain: "rtl-verilog-architecture",
    domainName: "RTL Design & Architecture",
    role: "Senior RTL / Interconnect Design Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "According to the AMBA AXI4 specification, can VALID depend on READY? Can READY depend on VALID? Explain why a naive pipeline register on an AXI bus either introduces a 50% throughput bubble or creates a combinational path on the READY channel. Detail the microarchitecture of a 2-entry Skid Buffer that achieves 100% bandwidth with registered outputs on both VALID and READY.",
    shortSummary: "AXI4 forbids VALID from waiting for READY to prevent combinational deadlocks; READY may wait for VALID. Standard registers drop throughput by 50%; a 2-entry skid buffer achieves full 100% throughput with broken combinational paths on both channels.",
    detailedAnswer: `### 1. AXI4 Handshake Dependency Rules:
The AMBA AXI4 specification (Section A3.3) defines strict handshake rules to eliminate circular combinational deadlocks across complex interconnect crossbars:
- **Rule 1**: A master **MUST NOT wait for READY to be asserted before asserting VALID**. Once the master has data available, it must assert VALID independently.
- **Rule 2**: A slave **IS PERMITTED to wait for VALID before asserting READY**, or it can assert READY speculatively before VALID arrives.

### 2. The Problem with Naive Pipeline Registers:
- **Combinational Backpressure**: If we register the forward channel (\`VALID\` + \`DATA\`), the upstream \`READY\` signal is still combinational:
  \`\`\`verilog
  assign upstream_ready = downstream_ready || !reg_valid;
  \`\`\`
  This passes backpressure combinationally through the block, creating long timing paths across large SoC fabrics!
- **Half-Bandwidth Register**: If we register \`READY\` as well, when downstream drops \`READY=0\`, upstream already launched a transfer on the previous cycle. To avoid dropping data, the naive register must stall every other cycle, cutting maximum throughput from **1 transfer/cycle to 0.5 transfers/cycle (50% bubble)**!

### 3. The 2-Entry Skid Buffer Solution:
A Skid Buffer contains **2 storage registers** (Main register + Skid register):
1. **Normal Flow**: When downstream is ready, data flows straight into the main register and out to downstream (latency 1 cycle, 100% bandwidth).
2. **Backpressure (Skid Event)**: When downstream suddenly de-asserts \`READY\`:
   - The registered upstream \`s_ready\` cannot stop the upstream master immediately (the master has already launched a beat in flight).
   - The skid buffer absorbs this in-flight beat into its **secondary skid register**!
   - Upstream \`s_ready\` drops to 0.
   - When downstream re-asserts \`READY\`, the skid buffer drains the skid register first, then resumes normal upstream flow.
   **Zero bubbles. Zero data loss. Timing paths on both VALID and READY are completely registered and decoupled!**`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `// Production AXI4 Zero-Bubble Skid Buffer
module axi_skid_buffer #(
  parameter DATA_WIDTH = 32
)(
  input  wire                  clk,
  input  wire                  rst_n,
  // Upstream Interface
  input  wire [DATA_WIDTH-1:0] s_data,
  input  wire                  s_valid,
  output wire                  s_ready,
  // Downstream Interface
  output wire [DATA_WIDTH-1:0] m_data,
  output wire                  m_valid,
  input  wire                  m_ready
);

  reg [DATA_WIDTH-1:0] buf_data, out_data;
  reg buf_valid, out_valid;

  assign s_ready = !buf_valid; // Upstream ready only drops when spare buffer is full
  assign m_valid = out_valid;
  assign m_data  = out_data;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      out_valid <= 1'b0;
      out_data  <= {DATA_WIDTH{1'b0}};
      buf_valid <= 1'b0;
      buf_data  <= {DATA_WIDTH{1'b0}};
    end else begin
      if (m_ready) begin
        if (buf_valid) begin
          // Drain skid buffer into output
          out_valid <= 1'b1;
          out_data  <= buf_data;
          buf_valid <= 1'b0;
        end else if (s_valid) begin
          // Pass new data directly
          out_valid <= 1'b1;
          out_data  <= s_data;
        end else begin
          out_valid <= 1'b0;
        end
      end else begin
        // Downstream stalled; skid incoming data into spare buffer
        if (s_valid && s_ready) begin
          buf_valid <= 1'b1;
          buf_data  <= s_data;
        end
      end
    end
  end
endmodule`,
    },
    commonPitfalls: [
      "Asserting VALID only after sensing READY=1, which violates the AXI protocol and deadlocks interconnects.",
      "Attempting to break timing with a single flop, resulting in dropped data words when READY transitions low.",
    ],
    interviewerFollowups: [
      "How does an AXI forward register slice differ from a backward register slice?",
      "Can a skid buffer be used to break timing on the AXI AW, W, and B channels independently?",
    ],
    tags: ["axi4", "skid-buffer", "handshake", "pipelining", "arm", "microarchitecture"],
  },

  {
    id: "rtl-03",
    isFreeSample: false,
    company: "qualcomm",
    companyName: "Qualcomm",
    domain: "rtl-verilog-architecture",
    domainName: "RTL Design & Architecture",
    role: "RTL Design Engineer",
    difficulty: "Hard",
    round: "Technical Phone Screen",
    question: "Compare 1-always block, 2-always block, and 3-always block FSM coding styles in Verilog. Why do combinational outputs in Mealy or Moore FSMs produce dangerous glitch spikes on clock-gating or asynchronous reset inputs? How do you architect an FSM with registered outputs without adding an unwanted 1-cycle latency?",
    shortSummary: "Combinational FSM outputs glitch during state transitions. 3-always block style with next-state registered output prediction guarantees glitch-free registered control signals with zero latency penalty.",
    detailedAnswer: `### 1. FSM Coding Style Comparison:
- **1-Always Block (Anti-Pattern)**: Combines state register, next-state logic, and outputs in a single sequential block. Hard to maintain, mixes sequential storage with combinational decoding.
- **2-Always Block**:
  - Block 1: Sequential \`always @(posedge clk)\` updates \`state <= next_state\`.
  - Block 2: Combinational \`always @(*)\` computes \`next_state\` and outputs.
  - *Risk*: Outputs are purely combinational functions of state registers.
- **3-Always Block (Industry Standard)**:
  - Block 1: Sequential state register update.
  - Block 2: Combinational next-state decoding.
  - Block 3: Registered output generation based on \`next_state\`.

### 2. The Danger of Combinational Output Glitches:
When an FSM transitions between states (e.g. state \`01\` to \`10\` in binary encoding):
- Physical flip-flop clock-to-q delays are never perfectly identical.
- For a fraction of a nanosecond, the internal state lines may evaluate to \`00\` or \`11\`.
- Any combinational output decoder will output a brief false pulse (**glitch**):
  $$\\text{Width: } 50\\,\\text{ps} - 200\\,\\text{ps}$$
- If this output drives a **clock gate (ICG)**, an **asynchronous reset**, or a **write enable line**, the glitch triggers catastrophic false memory writes or clock pulses!

### 3. Registering Outputs Without Latency Penalty:
The common mistake is registering outputs based on current \`state\`:
\`\`\`verilog
always @(posedge clk) begin
  case (state)
    S_ACTIVE: out <= 1'b1; // Adds 1 extra cycle delay!
  endcase
end
\`\`\`
**The Solution**: Register outputs by decoding \`next_state\`!
\`\`\`verilog
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) out <= 1'b0;
  else        out <= (next_state == S_ACTIVE);
end
\`\`\`
Because \`next_state\` is calculated combinationally before the rising clock edge, the output updates at the exact same clock tick as the new state transition — **100% glitch-free with ZERO latency delay!**`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `// 3-Always Block Glitch-Free Registered Output FSM
module glitch_free_fsm (
  input  wire clk,
  input  wire rst_n,
  input  wire start,
  output reg  enable_out // Glitch-free registered control line
);
  localparam S_IDLE = 2'd0;
  localparam S_RUN  = 2'd1;
  localparam S_DONE = 2'd2;

  reg [1:0] state, next_state;

  // 1. Sequential State Register
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) state <= S_IDLE;
    else        state <= next_state;
  end

  // 2. Combinational Next-State Logic
  always @(*) begin
    case (state)
      S_IDLE:  next_state = start ? S_RUN : S_IDLE;
      S_RUN:   next_state = S_DONE;
      S_DONE:  next_state = S_IDLE;
      default: next_state = S_IDLE;
    endcase
  end

  // 3. Registered Output Based on next_state (Zero Latency Penalty)
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) enable_out <= 1'b0;
    else        enable_out <= (next_state == S_RUN);
  end
endmodule`,
    },
    commonPitfalls: [
      "Using combinational outputs to drive clock enables or asynchronous clear inputs, causing silicon glitch resets.",
      "Adding a redundant pipeline stage to clean up glitches instead of predicting output from next_state.",
    ],
    interviewerFollowups: [
      "When is One-Hot encoding preferred over Binary encoding in synthesis? (High speed, wide multiplexer reduction, minimal combinational logic).",
      "How do synthesis tools optimize unreached states in one-hot FSMs? (safe FSM vs default case).",
    ],
    tags: ["fsm", "glitch-free", "registered-outputs", "verilog", "qualcomm"],
  },

  {
    id: "rtl-04",
    isFreeSample: false,
    company: "broadcom",
    companyName: "Broadcom",
    domain: "rtl-verilog-architecture",
    domainName: "RTL Design & Architecture",
    role: "Lead Network Silicon RTL Designer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Design a 4-requester fair Round-Robin arbiter in synthesizable Verilog that grants requests in 1 clock cycle without a multi-cycle token ring. How does the double-barrel / priority-mask subtraction trick (req & mask) evaluate priority wrapping in purely combinational logic? How do you close timing at 1 GHz?",
    shortSummary: "Round-robin arbiter evaluates requests above the last granted position using a priority mask; if no higher requests exist, it wraps around to unmasked requests in a single clock cycle.",
    detailedAnswer: `### 1. The Challenge of Fair Arbitration at High Frequency:
In networking switches and multi-core memory crossbars, multiple clients compete for a single shared resource (e.g. DDR memory channel).
- **Fixed Priority**: Client 0 always wins. If Client 0 is saturated, Clients 1, 2, and 3 starve.
- **Token Ring**: Shifts a token bit sequentially. Takes $N$ cycles to grant, introducing unacceptable latency bubbles.
- **Round-Robin**: The highest priority rotates to the client immediately following the most recently granted client.

### 2. The Single-Cycle Priority-Mask Architecture:
To arbitrate among $N$ requesters in a single cycle:
1. Maintain an $N$-bit register \`mask\`. If Client 1 was granted on the last cycle, \`mask = 4'b1100\` (only clients with indices $> 1$ are prioritized).
2. Compute **Masked Requests**: \`masked_req = req & mask\`.
3. Compute **Masked Grants** (using standard fixed-priority logic).
4. Compute **Unmasked Grants** (evaluating all \`req\` with fixed priority starting at Client 0).
5. **Final Grant Selection**:
   $$\\text{grant} = (|\\text{masked\\_req}) \\;?\\; \\text{masked\\_grant} \\;:\\; \\text{unmasked\\_grant}$$
   - If any client higher than the last granted client requests the bus, it wins!
   - If no higher client requests, the arbiter wraps around to the lowest client in the same cycle!
6. Update \`mask\` on every valid grant:
   $$\\text{mask}[i] = \\sim (2^{i+1} - 1)$$

### 3. Closing Timing at 1 GHz:
- In wide arbiters ($N = 16$ or $32$), the ripple carry logic (\`req & ~req_below\`) forms a long carry-lookahead chain.
- The double-barrel subtraction trick (\`req - mask\` concatenation) simplifies wide arbiters into two adder stages optimized by synthesis carry trees.`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `// 4-Requester Single-Cycle Round-Robin Arbiter
module round_robin_arbiter (
  input  wire       clk,
  input  wire       rst_n,
  input  wire [3:0] req,
  output reg  [3:0] gnt
);
  reg [3:0] mask;
  wire [3:0] masked_req = req & mask;
  wire [3:0] masked_gnt;
  wire [3:0] unmasked_gnt;

  // Fixed priority logic for masked requests
  assign masked_gnt[0] = masked_req[0];
  assign masked_gnt[1] = masked_req[1] & ~masked_req[0];
  assign masked_gnt[2] = masked_req[2] & ~masked_req[1] & ~masked_req[0];
  assign masked_gnt[3] = masked_req[3] & ~masked_req[2] & ~masked_req[1] & ~masked_req[0];

  // Fixed priority logic for unmasked requests (wrap-around)
  assign unmasked_gnt[0] = req[0];
  assign unmasked_gnt[1] = req[1] & ~req[0];
  assign unmasked_gnt[2] = req[2] & ~req[1] & ~req[0];
  assign unmasked_gnt[3] = req[3] & ~req[2] & ~req[1] & ~req[0];

  wire [3:0] next_gnt = (|masked_req) ? masked_gnt : unmasked_gnt;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      gnt  <= 4'd0;
      mask <= 4'b1110;
    end else begin
      gnt <= next_gnt;
      if (|next_gnt) begin
        if      (next_gnt[0]) mask <= 4'b1110;
        else if (next_gnt[1]) mask <= 4'b1100;
        else if (next_gnt[2]) mask <= 4'b1000;
        else                  mask <= 4'b1111;
      end
    end
  end
endmodule`,
    },
    commonPitfalls: [
      "Using iterative loops with variable index shifts, which synthesis tools fail to unroll into parallel carry lookahead networks.",
      "Failing to preserve grants when a client holds a burst transaction active across multiple clock cycles.",
    ],
    interviewerFollowups: [
      "How do you implement weighted round-robin (WRR) to grant bandwidth in proportion to client weights?",
      "How does a Matrix Arbiter compare in gate count and delay for small client counts (N=4)?",
    ],
    tags: ["arbiter", "round-robin", "microarchitecture", "broadcom", "interconnect"],
  },

  {
    id: "rtl-05",
    isFreeSample: false,
    company: "apple",
    companyName: "Apple",
    domain: "rtl-verilog-architecture",
    domainName: "RTL Design & Architecture",
    role: "CPU Core / Datapath RTL Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "In a 5-stage RISC-V pipelined processor (IF, ID, EX, MEM, WB), detail the microarchitecture of the forwarding / operand bypassing unit. Under what precise conditions does an instruction in EX stage require forwarding from the MEM stage vs the WB stage? When is forwarding physically impossible, requiring a hardware pipeline interlock (stall)?",
    shortSummary: "Forwarding bypasses results from EX/MEM and MEM/WB registers back to the ALU inputs, resolving RAW data hazards without bubbles. A Load-Use hazard cannot be bypassed because data arrives at the end of MEM, requiring 1 cycle stall.",
    detailedAnswer: `### 1. Data Hazards in Pipelined Datapaths:
In a classic 5-stage RISC pipeline:
$$\\text{IF} \\longrightarrow \\text{ID} \\longrightarrow \\text{EX} \\longrightarrow \\text{MEM} \\longrightarrow \\text{WB}$$
When an instruction writes to register $x1$ and the immediately following instruction reads $x1$ (**Read-After-Write / RAW hazard**):
- Without hardware intervention, the consumer reads stale data in the ID stage because the producer does not write back to the register file until the WB stage (a 2-cycle penalty)!

### 2. Forwarding / Bypassing Microarchitecture:
The result of an arithmetic operation is already computed and available at the output of the **EX stage**!
Instead of waiting for WB, multiplexers are placed immediately before the ALU inputs in the EX stage to forward data from pipeline registers:

1. **Forward from EX/MEM Pipeline Register (1-cycle distance)**:
   Triggered when the instruction in MEM stage writes to a destination register matching an operand of the instruction currently in EX:
   \`\`\`verilog
   forward_a = (mem_reg_write && (mem_rd != 0) && (mem_rd == ex_rs1));
   \`\`\`
2. **Forward from MEM/WB Pipeline Register (2-cycle distance)**:
   Triggered when the instruction in WB stage writes to a destination register matching an operand in EX, **provided** the EX/MEM stage is not already forwarding the same register:
   \`\`\`verilog
   forward_a = (wb_reg_write && (wb_rd != 0) && (wb_rd == ex_rs1) && !(mem_reg_write && (mem_rd == ex_rs1)));
   \`\`\`

### 3. The Unavoidable Hazard: Load-Use Interlock:
When the producer instruction is a **Load** (\`lw x1, 0(x2)\`) immediately followed by an ALU operation (\`add x3, x1, x4\`):
- The loaded data is read from SRAM cache at the end of the **MEM stage**.
- The consumer instruction needs the operand at the beginning of the **EX stage**.
- Even with forwarding, data cannot travel backwards in time!
- **Hardware Interlock Action**:
  1. Detect: \`if (id_ex_mem_read && ((id_ex_rd == if_id_rs1) || (id_ex_rd == if_id_rs2)))\`
  2. **Freeze PC and IF/ID pipeline registers** for 1 cycle.
  3. **Inject a NOP bubble** into the ID/EX pipeline control register.
  4. On the next cycle, the loaded data is in the MEM/WB stage and can be forwarded to the ALU!`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `// RISC-V ALU Operand Forwarding Unit
module riscv_forwarding_unit (
  input  wire [4:0] ex_rs1,
  input  wire [4:0] ex_rs2,
  input  wire [4:0] mem_rd,
  input  wire       mem_reg_write,
  input  wire [4:0] wb_rd,
  input  wire       wb_reg_write,
  output reg  [1:0] forward_a, // 00: ID/EX, 10: from MEM, 01: from WB
  output reg  [1:0] forward_b
);

  always @(*) begin
    // Forwarding for Operand A (rs1)
    if (mem_reg_write && (mem_rd != 5'd0) && (mem_rd == ex_rs1)) begin
      forward_a = 2'b10; // Forward from EX/MEM
    end else if (wb_reg_write && (wb_rd != 5'd0) && (wb_rd == ex_rs1)) begin
      forward_a = 2'b01; // Forward from MEM/WB
    end else begin
      forward_a = 2'b00; // No forwarding; use register file output
    end

    // Forwarding for Operand B (rs2)
    if (mem_reg_write && (mem_rd != 5'd0) && (mem_rd == ex_rs2)) begin
      forward_b = 2'b10;
    end else if (wb_reg_write && (wb_rd != 5'd0) && (wb_rd == ex_rs2)) begin
      forward_b = 2'b01;
    end else begin
      forward_b = 2'b00;
    end
  end
endmodule`,
    },
    commonPitfalls: [
      "Forgetting to check 'rd != 5'd0', causing false forwarding from register x0 which must always read hardwired zero in RISC-V.",
      "Failing to prioritize EX/MEM forwarding over MEM/WB forwarding when both write to the same destination register.",
    ],
    interviewerFollowups: [
      "How do branch prediction units handle control hazards in modern speculative architectures?",
      "How does Out-of-Order (OoO) Tomasulo algorithm with Reorder Buffer (ROB) replace combinational forwarding wires?",
    ],
    tags: ["riscv", "pipelining", "forwarding", "hazards", "datapath", "apple"],
  },
];
