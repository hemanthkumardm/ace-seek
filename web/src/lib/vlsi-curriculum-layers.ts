import type { LearnLayer, LearnSession, QuizQuestion, PracticalProblem } from "@/lib/vlsi-curriculum";

function levelFor(layer: LearnLayer): LearnSession["level"] {
  if (layer === "beginner") return "foundations";
  if (layer === "standard") return "working";
  return "advanced";
}

function theory(
  track: string,
  layer: LearnLayer,
  slug: string,
  title: string,
  minutes: number,
  summary: string,
  body: string[],
  code?: { title: string; lang: string; source: string },
  checklist?: string[]
): LearnSession {
  return {
    slug,
    track,
    kind: "theory",
    layer,
    level: levelFor(layer),
    title,
    minutes,
    summary,
    body,
    code,
    checklist,
  };
}

function practical(
  track: string,
  layer: LearnLayer,
  slug: string,
  title: string,
  minutes: number,
  summary: string,
  body: string[],
  problem: PracticalProblem
): LearnSession {
  return {
    slug,
    track,
    kind: "practical",
    layer,
    level: levelFor(layer),
    title,
    minutes,
    summary,
    body,
    problem,
  };
}

function quiz(
  track: string,
  layer: LearnLayer,
  slug: string,
  title: string,
  questions: QuizQuestion[]
): LearnSession {
  return {
    slug,
    track,
    kind: "quiz",
    layer,
    level: levelFor(layer),
    title,
    minutes: 8,
    passMark: layer === "master" ? 80 : layer === "expert" ? 75 : 70,
    summary: `${questions.length} questions · ${layer} layer.`,
    body: ["Answer without looking up the previous lesson."],
    questions,
  };
}

/** Extra lessons so every course has Beginner / Standard / Expert / Master. */
export const LEARN_LAYER_SESSIONS: LearnSession[] = [
  // ——————————————————————————————————————————————————————————
  // 🟢 DIGITAL DESIGN — BEGINNER LAYER (Foundations · Free)
  // ——————————————————————————————————————————————————————————
  theory(
    "digital",
    "beginner",
    "digital-fsm-basics",
    "Beginner: Finite State Machine (FSM) Fundamentals",
    16,
    "Moore vs. Mealy state machines, state transition tables, and 2-process RTL architecture.",
    [
      "A Finite State Machine (FSM) computes an output sequence based on past input history stored in state registers. Every FSM consists of three logical blocks: current state storage, next-state combinational decode logic, and output logic.",
      "Moore FSMs: The output is strictly a function of the current state: Output = f(State). Because outputs do not react instantly to input changes, Moore outputs are naturally glitch-free and synchronize cleanly with clock edges.",
      "Mealy FSMs: The output is a function of both the current state AND the current inputs: Output = f(State, Input). Mealy machines often require fewer states than Moore machines, but combinational input changes can propagate directly to outputs, causing intermediate logic glitches.",
      "2-Process Verilog Style: Process 1 is a synchronous always @(posedge clk) block for state register updates with reset. Process 2 is a purely combinational always @(*) block computing next-state (state_d) and outputs.",
    ],
    {
      title: "fsm_moore_basic.v",
      lang: "verilog",
      source: `module fsm_moore_basic (
  input  wire clk, rst_n, in_bit,
  output reg  detected
);
  localparam S0 = 2'b00, S1 = 2'b01, S2 = 2'b10;
  reg [1:0] state_q, state_d;

  // Process 1: State Register
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) state_q <= S0;
    else        state_q <= state_d;
  end

  // Process 2: Next State & Output Logic (Pure Combo)
  always @(*) begin
    state_d  = state_q;
    detected = 1'b0;
    case (state_q)
      S0: if (in_bit) state_d = S1;
      S1: if (in_bit) state_d = S2; else state_d = S0;
      S2: begin
        detected = 1'b1;
        state_d  = in_bit ? S2 : S0;
      end
      default: state_d = S0;
    endcase
  end
endmodule`,
    },
    [
      "Always draw the state transition bubble diagram before writing RTL.",
      "Include a default case in next-state decode to prevent latch inference.",
      "Use Moore outputs when driving timing-critical enable or clock-gate pins.",
    ]
  ),

  practical(
    "digital",
    "beginner",
    "digital-beginner-practical",
    "Beginner Practical: 4:1 Multiplexer & Synchronous Up-Down Counter",
    20,
    "Write a clean 4:1 multiplexer and an 8-bit synchronous up/down counter with active-low reset.",
    [
      "Design an 8-bit synchronous up/down counter in module `digital_counter` that counts up when `up_down = 1` and down when `up_down = 0` on every rising clock edge (`posedge clk`).",
      "Include an asynchronous active-low reset (`rst_n`) that immediately clears `count` to 0 whenever reset is pulled low.",
      "In parallel, build the 4:1 multiplexer logic routing `mux_out` to select among inputs `d0, d1, d2, d3` according to the 2-bit selector `sel[1:0]`."
    ],
    {
      language: "verilog",
      starter: `module digital_counter (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       enable,
  input  wire       up_down,
  input  wire [1:0] sel,
  input  wire [7:0] d0, d1, d2, d3,
  output reg  [7:0] count,
  output reg  [7:0] mux_out
);

  // TODO: Synchronous up/down counter with active-low async reset

  // TODO: 4:1 Mux logic

endmodule`,
      checks: [
        { id: "c1", label: "Module declaration", kind: "includes", pattern: "module digital_counter" },
        { id: "c2", label: "Sensitivity list includes posedge clk or negedge rst_n", kind: "regex", pattern: "always\\s*@\\s*\\(\\s*posedge\\s+clk\\s+or\\s+negedge\\s+rst_n\\s*\\)" },
        { id: "c3", label: "Active-low reset branch", kind: "regex", pattern: "if\\s*\\(!rst_n\\)" },
        { id: "c4", label: "Up/Down counter logic", kind: "regex", pattern: "count\\s*<=\\s*count\\s*[+-]" },
        { id: "c5", label: "Mux selection logic", kind: "regex", pattern: "mux_out\\s*=" },
      ],
      solution: `module digital_counter (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       enable,
  input  wire       up_down,
  input  wire [1:0] sel,
  input  wire [7:0] d0, d1, d2, d3,
  output reg  [7:0] count,
  output reg  [7:0] mux_out
);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      count <= 8'h00;
    end else if (enable) begin
      if (up_down) count <= count + 8'd1;
      else         count <= count - 8'd1;
    end
  end

  always @(*) begin
    case (sel)
      2'b00: mux_out = d0;
      2'b01: mux_out = d1;
      2'b10: mux_out = d2;
      2'b11: mux_out = d3;
      default: mux_out = 8'h00;
    endcase
  end

endmodule`,
    }
  ),

  // ——————————————————————————————————————————————————————————
  // 🔵 DIGITAL DESIGN — STANDARD LAYER (Working Fluency · Free)
  // ——————————————————————————————————————————————————————————
  theory(
    "digital",
    "standard",
    "digital-standard-timing",
    "Standard: Combinational Delay, Slack & Setup/Hold Inequalities",
    16,
    "Propagation vs contamination delay — why STA bounds clock period and hold margins before synthesis.",
    [
      "Digital timing is governed by two fundamental physical inequalities: maximum delay bounds the maximum operating frequency (Setup), and minimum delay bounds race conditions (Hold).",
      "Setup Constraint (Max delay): Tclk >= Tc2q(max) + Tcombo(max) + Tsetup + Tskew + Tjitter. If the combinational logic cloud is too deep, the data arrives after the setup window of the destination flop, causing timing failure. Setup slack = Trequired - Tarrival. Setup violations can be resolved on silicon by simply reducing the clock frequency.",
      "Hold Constraint (Min delay): Tc2q(min) + Tcombo(min) >= Thold + Tskew. If data travels too fast from launch flop to capture flop on the same clock edge, it overwrites the previous data before the capture flop has held it for Thold. Hold violations CANNOT be fixed by changing clock frequency; they represent fatal chip failure that must be padded with delay buffers.",
      "Clock Skew (Tskew = Tclk_capture - Tclk_launch): Positive skew helps setup timing but hurts hold timing. Negative skew hurts setup timing but protects hold. Modern physical design targets near-zero skew via CTS (Clock Tree Synthesis).",
    ],
    {
      title: "timing_critical_paths.v",
      lang: "verilog",
      source: `// Setup-critical path: Deep combinational math
always @(posedge clk) begin
  result_q <= (a * b) + (c ^ d) - e; // Deep cloud bounds max f_clk
end

// Hold-critical path: Back-to-back flops with zero logic
always @(posedge clk) begin
  stage1_q <= data_in;
  stage2_q <= stage1_q; // High hold risk if clock skew exists!
end`,
    },
    [
      "Setup is a max-delay constraint (Tpd) evaluated at the next clock edge.",
      "Hold is a min-delay constraint (Tcd) evaluated at the same clock edge.",
      "Positive clock skew relaxes setup time but tightens hold time.",
      "Hold violations cannot be fixed by slowing down the clock.",
    ]
  ),

  theory(
    "digital",
    "standard",
    "digital-standard-arithmetic",
    "Standard: Carry-Lookahead Adders, Prefix Graphs & Barrel Shifters",
    18,
    "Breaking the O(N) ripple-carry bottleneck with Generate (G) and Propagate (P) prefix logic.",
    [
      "Ripple Carry Adders (RCA) scale linearly with bitwidth (O(N) delay) because carry bit C[i+1] must wait for full adder stage i to settle. For 32-bit and 64-bit ALUs, RCA is too slow for GHz clocking.",
      "Carry-Lookahead Adders (CLA) compute all carries in parallel using Generate (Gi = Ai & Bi) and Propagate (Pi = Ai ^ Bi). The carry recurrence C[i+1] = Gi + (Pi & Ci) expands into multi-level prefix equations, reducing addition latency to O(log N).",
      "Parallel Prefix Adder Trees: Kogge-Stone provides minimum logical depth (log2 N) at the cost of high routing congestion and wire density. Brent-Kung minimizes cell count and routing track usage with 2*log2(N) - 1 depth. Sklansky and Han-Carlson offer hybrid trade-offs between area and fanout.",
      "Barrel Shifters: Logarithmic multiplexer cascades shift an N-bit word by K bits in log2 N stages (stage 0 shifts by 1, stage 1 by 2, stage 2 by 4, stage 3 by 8), avoiding multi-cycle iterative shift counters.",
    ],
    {
      title: "cla_4bit.v",
      lang: "verilog",
      source: `module cla_4bit (
  input  wire [3:0] a, b,
  input  wire       cin,
  output wire [3:0] sum,
  output wire       cout
);
  wire [3:0] g = a & b;       // Generate terms
  wire [3:0] p = a ^ b;       // Propagate terms
  wire [4:0] c;
  assign c[0] = cin;
  assign c[1] = g[0] | (p[0] & c[0]);
  assign c[2] = g[1] | (p[1] & g[0]) | (p[1] & p[0] & c[0]);
  assign c[3] = g[2] | (p[2] & g[1]) | (p[2] & p[1] & g[0]) | (p[2] & p[1] & p[0] & c[0]);
  assign c[4] = g[3] | (p[3] & g[2]) | (p[3] & p[2] & g[1]) | (p[3] & p[2] & p[1] & g[0]) | (p[3] & p[2] & p[1] & p[0] & c[0]);
  assign sum  = p ^ c[3:0];
  assign cout = c[4];
endmodule`,
    }
  ),

  theory(
    "digital",
    "standard",
    "digital-standard-fsm",
    "Standard: Production FSMs & Glitch-Free Registered Outputs",
    18,
    "3-process state machines, state encoding trade-offs (One-Hot vs Binary vs Gray), and eliminating Mealy output glitches.",
    [
      "In production RTL, standard 1-process FSMs (mixing state registers, next-state logic, and outputs in one block) create hard-to-debug multi-driven net bugs and infer unwanted latches. 3-Process FSM architecture separates state transition, next-state combo decode, and registered output generation into distinct processes.",
      "Combinational Mealy outputs are prone to hazards and glitches whenever input signals change. If an unbuffered combo output drives an enable pin, clock gate, or external bus, the glitch can trigger false state transitions. Registering outputs eliminates output glitches and provides clean Tc2q clock-to-output timing for STA.",
      "State Encoding Trade-Offs: Binary encoding minimizes flip-flop count (ceil(log2 K) flops) but requires complex multi-level combinational decoding logic. One-Hot encoding uses 1 flip-flop per state (K flops), reducing next-state decode to single-gate fanins—ideal for high-speed FPGAs and deep submicron ASICs. Gray encoding ensures only 1 bit changes per transition, minimizing CV^2f dynamic power dissipation.",
    ],
    {
      title: "fsm_3process.v",
      lang: "verilog",
      source: `module fsm_controller (
  input  wire clk, rst_n, start, ready,
  output reg  busy, out_valid
);
  localparam [1:0] S_IDLE = 2'b00, S_RUN = 2'b01, S_DONE = 2'b10;
  reg [1:0] state_q, state_d;

  // Process 1: State Register
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) state_q <= S_IDLE;
    else        state_q <= state_d;
  end

  // Process 2: Next-State Logic (Pure Combo)
  always @(*) begin
    state_d = state_q;
    case (state_q)
      S_IDLE: if (start) state_d = S_RUN;
      S_RUN:  if (ready) state_d = S_DONE;
      S_DONE: state_d = S_IDLE;
      default: state_d = S_IDLE;
    endcase
  end

  // Process 3: Glitch-Free Registered Outputs
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      busy <= 1'b0; out_valid <= 1'b0;
    end else begin
      busy      <= (state_d == S_RUN);
      out_valid <= (state_d == S_DONE);
    end
  end
endmodule`,
    }
  ),

  theory(
    "digital",
    "standard",
    "digital-standard-pipeline",
    "Standard: Feed-Forward Pipelining, Retiming & Backpressure",
    16,
    "Inserting pipeline slices to maximize frequency without losing data coherency.",
    [
      "Pipelining divides a multi-cycle combinational datapath into M shorter stages separated by registers. Throughput increases by up to M-fold, while initial latency increases by M clock cycles.",
      "Register Retiming: Synthesis tools can automatically move flip-flops across combinational gates to balance path delays without altering functional I/O behavior.",
      "Flow Control & Backpressure: When downstream consumers stall (ready deasserted), pipelined stages must hold their state without dropping in-flight valid transactions. Skid Buffers (2-deep registers) decouple the forward valid path from the backward ready path, breaking combinational timing loops.",
    ],
    {
      title: "pipeline_stage.v",
      lang: "verilog",
      source: `module pipeline_stage #(parameter DWIDTH = 32) (
  input  wire              clk, rst_n,
  input  wire              in_valid,
  input  wire [DWIDTH-1:0] in_data,
  output reg               out_valid,
  output reg  [DWIDTH-1:0] out_data
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      out_valid <= 1'b0;
      out_data  <= {DWIDTH{1'b0}};
    end else begin
      out_valid <= in_valid;
      if (in_valid) out_data <= (in_data ^ 32'hA5A5A5A5) + 32'd1;
    end
  end
endmodule`,
    }
  ),

  practical(
    "digital",
    "standard",
    "digital-standard-practical",
    "Standard Practical: Parameterized Gray-to-Binary Converter",
    20,
    "Implement an N-bit parameterized Gray code to binary code converter in synthesizable Verilog.",
    [
      "Declare the parameterized module `gray_to_bin #(parameter WIDTH = 4)` with input `gray` and output `bin`.",
      "Assign the binary Most Significant Bit directly from the Gray MSB: `bin[WIDTH-1] = gray[WIDTH-1]`.",
      "Iteratively decode every subsequent bit using an unrolled XOR tree loop: `bin[i] = bin[i+1] ^ gray[i]` to convert the code back to standard binary."
    ],
    {
      language: "verilog",
      starter: `module gray_to_bin #(
  parameter WIDTH = 4
) (
  input  wire [WIDTH-1:0] gray,
  output reg  [WIDTH-1:0] bin
);

  integer i;
  always @(*) begin
    // TODO: Implement Gray to Binary conversion
  end

endmodule`,
      checks: [
        { id: "c1", label: "Module declaration with parameter", kind: "includes", pattern: "module gray_to_bin" },
        { id: "c2", label: "Parameter WIDTH defined", kind: "regex", pattern: "parameter\\s+WIDTH" },
        { id: "c3", label: "MSB assignment", kind: "regex", pattern: "bin\\[WIDTH-1\\]\\s*=\\s*gray\\[WIDTH-1\\]" },
        { id: "c4", label: "Iterative XOR tree conversion", kind: "regex", pattern: "bin\\[i\\]\\s*=\\s*bin\\[i\\+1\\]\\s*\\^\\s*gray\\[i\\]" },
      ],
      solution: `module gray_to_bin #(
  parameter WIDTH = 4
) (
  input  wire [WIDTH-1:0] gray,
  output reg  [WIDTH-1:0] bin
);

  integer i;
  always @(*) begin
    bin[WIDTH-1] = gray[WIDTH-1];
    for (i = WIDTH - 2; i >= 0; i = i - 1) begin
      bin[i] = bin[i+1] ^ gray[i];
    end
  end

endmodule`,
    }
  ),

  quiz("digital", "standard", "digital-standard-quiz", "Digital Design — Standard Assessment", [
    { id: "ds1", prompt: "Setup time is governed by:", choices: ["Minimum data path delay", "Maximum data path delay relative to the capturing clock edge", "Only wire inductance", "Antenna DRC rules"], answer: 1, explain: "Setup verifies that data settles before the destination flop setup window." },
    { id: "ds2", prompt: "Hold violations are most dangerous when:", choices: ["The combinational cloud is deep", "The data path delay is extremely short", "The clock period is 100 ns", "Reset is synchronous"], answer: 1, explain: "Fast data race conditions overwrite destination state within the hold window." },
    { id: "ds3", prompt: "A Carry-Lookahead Adder achieves faster speed than a Ripple Carry Adder because:", choices: ["It uses fewer transistors", "It computes carries in parallel using Generate and Propagate terms", "It eliminates all AND gates", "It requires no clock"], answer: 1, explain: "CLA converts the O(N) carry ripple into O(log N) prefix logic." },
    { id: "ds4", prompt: "Why are registered outputs preferred in production FSMs?", choices: ["They eliminate combinational output glitches and provide predictable clock-to-output timing", "They double the number of states", "They remove the need for reset", "They allow latches to be inferred"], answer: 0, explain: "Registering outputs prevents Mealy glitches from polluting downstream circuits." },
    { id: "ds5", prompt: "One-Hot FSM encoding is particularly advantageous in high-speed designs because:", choices: ["It uses the fewest flip-flops", "Next-state logic requires only single-gate fanins, minimizing combinational delay", "It eliminates all clock signals", "It guarantees zero power consumption"], answer: 1, explain: "One-Hot uses 1 flop per state, cutting state decode logic down to simple OR gates." },
    { id: "ds6", prompt: "If clock skew is positive (capture clock arrives later than launch clock):", choices: ["Setup slack improves, but hold margin worsens", "Hold slack improves, but setup margin worsens", "Both setup and hold improve", "Both setup and hold fail"], answer: 0, explain: "Positive skew gives data more time to arrive (helping setup) but reduces the hold window." },
  ]),

  // ——————————————————————————————————————————————————————————
  // 🟣 DIGITAL DESIGN — EXPERT LAYER (Production Practice · Pro)
  // ——————————————————————————————————————————————————————————
  theory(
    "digital",
    "expert",
    "digital-expert-metastability",
    "Expert: Metastability Physics, MTBF & Reset Synchronizers",
    18,
    "Why 2FF synchronizers exist, calculating Mean Time Between Failures (MTBF), and Recovery/Removal reset signoff.",
    [
      "When a flip-flop's data input transitions inside the setup-and-hold aperture, the internal cross-coupled inverters enter an unstable balance state between 0 and 1 — metastability. The output voltage hovers near VDD/2 and takes an unpredictable resolution time (tr) to settle.",
      "Mean Time Between Failures Formula: MTBF = exp(tr / tau) / (T0 * f_clk * f_data). Here, tau is the regenerative time constant of the bistable loop, T0 is the capture aperture, f_clk is the destination clock frequency, and f_data is the asynchronous input toggle rate. Cascading two flip-flops increases the available resolution time tr by an entire clock period, boosting MTBF from seconds to millions of years.",
      "Reset Bridge Architecture: Asynchronous resets must assert immediately (combinational zero-latency shutdown) but must deassert synchronously on a clock edge. If reset deasserts within the flip-flop clock window, different flops across the chip can wake up in different cycles. A 2-flop Reset Synchronizer asserts asynchronously and deasserts synchronously, satisfying STA Recovery and Removal timing checks.",
    ],
    {
      title: "reset_bridge.v",
      lang: "verilog",
      source: `module reset_bridge (
  input  wire clk,
  input  wire async_rst_n,
  output wire sync_rst_n
);
  reg rst_meta_q, rst_sync_q;

  always @(posedge clk or negedge async_rst_n) begin
    if (!async_rst_n) begin
      rst_meta_q <= 1'b0; // Asynchronous assertion
      rst_sync_q <= 1'b0;
    end else begin
      rst_meta_q <= 1'b1; // Synchronous deassertion
      rst_sync_q <= rst_meta_q;
    end
  end

  assign sync_rst_n = rst_sync_q;
endmodule`,
    },
    [
      "Never place combinational logic between synchronizer flip-flops.",
      "Recovery time is the minimum time between reset deassertion and the rising clock edge.",
      "Removal time is the minimum time reset must stay active after the rising clock edge.",
      "A 2FF synchronizer is strictly for single-bit signals or Gray-coded buses.",
    ]
  ),

  theory(
    "digital",
    "expert",
    "digital-expert-hazards",
    "Expert: Glitches, Logic Hazards & Integrated Clock Gating (ICG)",
    18,
    "Static-1, static-0, and dynamic hazards; consensus terms; and latch-based Integrated Clock Gating cells.",
    [
      "Combinational Hazards: Unequal propagation delays along converging signal paths cause momentary glitches before output settling. A Static-1 hazard occurs when an output is supposed to remain 1 but dips to 0. Adding redundant consensus terms (Consensus Theorem: AB + A'C + BC = AB + A'C) covers adjacent K-map groupings and eliminates static hazards.",
      "Clock Gating Dangers: Attempting to gate a clock with a standard combinational AND gate (gated_clk = clk & enable) causes catastrophic glitch pulses if enable changes while clk is high. These narrow glitch pulses violate downstream setup/hold and destroy circuit state.",
      "Integrated Clock Gating (ICG) Architecture: An ICG cell pairs an active-low transparent latch with an AND gate. When clk is low, the latch is transparent and captures the enable signal. When clk goes high, the latch locks the enable value, guaranteeing that gated_clk transitions only on clean clock edges. An integrated scan_enable test pin bypasses the gate during ATPG scan testing.",
    ],
    {
      title: "icg_structural.v",
      lang: "verilog",
      source: `module icg_cell (
  input  wire clk_in,
  input  wire enable,
  input  wire scan_enable,
  output wire clk_out
);
  wire en_or_scan = enable | scan_enable;
  reg  latched_en;

  // Active-low transparent latch (captures while clk_in is 0)
  always @(clk_in or en_or_scan) begin
    if (!clk_in) latched_en <= en_or_scan;
  end

  // Clean glitch-free AND gate
  assign clk_out = clk_in & latched_en;
endmodule`,
    }
  ),

  theory(
    "digital",
    "expert",
    "digital-expert-multipliers",
    "Expert: Booth Radix-4 Multiplication & Wallace Tree Reduction",
    18,
    "Radix-4 Booth recoding, partial product compression, and Carry-Save Adders (CSA).",
    [
      "Standard unsigned binary multiplication produces N partial products for an N-bit multiplier. Accumulating N partial products with ripple adders creates a massive critical path delay.",
      "Booth Radix-4 Recoding: By examining 3 overlapping multiplier bits (B[2i+1], B[2i], B[2i-1]), the multiplier selects one of {-2A, -A, 0, +A, +2A}. This halves the total number of partial products from N to N/2, cutting adder tree height by 50%.",
      "Carry-Save Addition (CSA) & Wallace Trees: Instead of propagating carries across columns, 3:2 full adders compress 3 partial product rows into 2 rows (Sum and Carry) without horizontal carry ripple. Wallace and Dadda reduction trees reduce the partial product matrix logarithmically to 2 final rows, which are merged in one final high-speed Carry-Propagate Adder.",
    ],
    {
      title: "booth_radix4_table.v",
      lang: "verilog",
      source: `// Booth Radix-4 Recoding Function:
// 3-bit window -> Operation on Multiplicand A
// 000 ->  0
// 001 -> +1A
// 010 -> +1A
// 011 -> +2A (Shift left by 1)
// 100 -> -2A (Two's complement shift left by 1)
// 101 -> -1A (Two's complement of A)
// 110 -> -1A
// 111 ->  0`,
    }
  ),

  theory(
    "digital",
    "expert",
    "digital-expert-datapath",
    "Expert: Synchronous Circular FIFO & Skid Buffer Architecture",
    16,
    "Dual-port circular memory buffers, pointer wraparound math, and skid buffers for pipeline backpressure.",
    [
      "A Synchronous FIFO decouples producer and consumer rates sharing the same clock domain. It uses dual-port RAM with independent write and read address pointers.",
      "Pointer Wraparound & Full/Empty Distinction: An N-entry FIFO uses (log2 N + 1)-bit pointers. If the lower log2 N address bits match and the MSBs match (wptr == rptr), the FIFO is EMPTY. If the lower address bits match but the MSBs differ (wptr[MSB] != rptr[MSB]), the FIFO is FULL.",
      "Watermark Flags: Computing count = wptr - rptr provides almost_empty (count <= THRESHOLD_LOW) and almost_full (count >= THRESHOLD_HIGH) status for burst DMA arbitration.",
    ],
    {
      title: "sync_fifo.v",
      lang: "verilog",
      source: `module sync_fifo #(
  parameter DATA_WIDTH = 8,
  parameter ADDR_WIDTH = 4 // Depth = 16
) (
  input  wire                  clk, rst_n,
  input  wire                  wr_en,
  input  wire [DATA_WIDTH-1:0] wr_data,
  input  wire                  rd_en,
  output reg  [DATA_WIDTH-1:0] rd_data,
  output wire                  full,
  output wire                  empty
);
  localparam DEPTH = 1 << ADDR_WIDTH;
  reg [DATA_WIDTH-1:0] mem [0:DEPTH-1];
  reg [ADDR_WIDTH:0]   wptr_q, rptr_q;

  assign empty = (wptr_q == rptr_q);
  assign full  = (wptr_q[ADDR_WIDTH] != rptr_q[ADDR_WIDTH]) &&
                 (wptr_q[ADDR_WIDTH-1:0] == rptr_q[ADDR_WIDTH-1:0]);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      wptr_q <= 0; rptr_q <= 0; rd_data <= 0;
    end else begin
      if (wr_en && !full) begin
        mem[wptr_q[ADDR_WIDTH-1:0]] <= wr_data;
        wptr_q <= wptr_q + 1'b1;
      end
      if (rd_en && !empty) begin
        rd_data <= mem[rptr_q[ADDR_WIDTH-1:0]];
        rptr_q  <= rptr_q + 1'b1;
      end
    end
  end
endmodule`,
    }
  ),

  practical(
    "digital",
    "expert",
    "digital-expert-practical",
    "Expert Practical: Latch-Based Integrated Clock Gating (ICG) Cell",
    20,
    "Implement an industry-standard glitch-free Integrated Clock Gating cell with negative latch and scan test bypass.",
    [
      "Declare the module `icg_cell` with input clock `clk_in`, functional `enable`, ATPG bypass `scan_enable`, and output clock `clk_out`.",
      "Combine the functional enable with DFT scan test mode: the gate is active if either `enable` OR `scan_enable` is HIGH.",
      "Model a negative-level transparent latch that captures the combined enable condition while `clk_in` is LOW and holds it stable while `clk_in` is HIGH to prevent clock glitches.",
      "AND the latched enable with `clk_in` to produce the final glitch-free gated clock output `clk_out`."
    ],
    {
      language: "verilog",
      starter: `module icg_cell (
  input  wire clk_in,
  input  wire enable,
  input  wire scan_enable,
  output wire clk_out
);

  // TODO: Implement negative-level latch and glitch-free clock gating

endmodule`,
      checks: [
        { id: "c1", label: "Module declaration", kind: "includes", pattern: "module icg_cell" },
        { id: "c2", label: "Scan enable OR logic", kind: "regex", pattern: "enable\\s*\\|\\s*scan_enable|scan_enable\\s*\\|\\s*enable" },
        { id: "c3", label: "Negative latch condition", kind: "regex", pattern: "!clk_in|clk_in\\s*==\\s*1'b0" },
        { id: "c4", label: "Gated clock output assignment", kind: "regex", pattern: "clk_out\\s*=\\s*clk_in\\s*&" },
      ],
      solution: `module icg_cell (
  input  wire clk_in,
  input  wire enable,
  input  wire scan_enable,
  output wire clk_out
);

  wire en_ctrl = enable | scan_enable;
  reg  latched_en;

  always @(clk_in or en_ctrl) begin
    if (!clk_in) begin
      latched_en <= en_ctrl;
    end
  end

  assign clk_out = clk_in & latched_en;

endmodule`,
    }
  ),

  quiz("digital", "expert", "digital-expert-quiz", "Digital Design — Expert Assessment", [
    { id: "de1", prompt: "In the MTBF formula MTBF = exp(tr / tau) / (T0 * f_clk * f_data), increasing the resolution time tr by adding a second flop:", choices: ["Decreases MTBF linearly", "Increases MTBF exponentially", "Has no effect on MTBF", "Causes clock skew failure"], answer: 1, explain: "Because tr appears in the exponent exp(tr/tau), each additional clock period yields exponential MTBF improvement." },
    { id: "de2", prompt: "A Reset Bridge asserts reset asynchronously and deasserts synchronously in order to:", choices: ["Eliminate all flip-flops", "Prevent Recovery and Removal timing violations during reset release", "Save dynamic switching power", "Enable scan testing"], answer: 1, explain: "Synchronous deassertion guarantees all flops exit reset on the same clock cycle without violating recovery/removal margins." },
    { id: "de3", prompt: "Why must an Integrated Clock Gating (ICG) cell use an active-low transparent latch?", choices: ["To invert the clock polarity", "To capture the enable signal while clock is low so enable transitions never glitch during the active clock phase", "To reduce transistor count", "To bypass ATPG vectors"], answer: 1, explain: "Holding enable steady while clk is high prevents partial clock pulses and hazard spikes." },
    { id: "de4", prompt: "Booth Radix-4 recoding reduces multiplier latency primarily by:", choices: ["Halving the total number of partial products from N to N/2", "Eliminating all carry propagation", "Using asynchronous logic", "Converting numbers to binary-coded decimal"], answer: 0, explain: "Grouping 3 multiplier bits at a time cuts partial product rows by 50%." },
    { id: "de5", prompt: "A 16-entry Synchronous FIFO uses 5-bit pointers (wptr, rptr). The condition for FIFO FULL is:", choices: ["wptr == rptr", "wptr[4] != rptr[4] and wptr[3:0] == rptr[3:0]", "wptr[3:0] == 4'b1111", "rptr == 0"], answer: 1, explain: "The extra MSB denotes wraparound. Matching lower bits with opposing MSBs indicates full." },
    { id: "de6", prompt: "Adding a consensus term (such as BC to AB + A'C) in a combinational logic circuit:", choices: ["Eliminates static logic hazards caused by unequal propagation delays", "Doubles power consumption", "Creates an infinite loop", "Forces latch inference"], answer: 0, explain: "Consensus terms bridge adjacent K-map clusters, keeping the output stably high during transitions." },
  ]),

  // ——————————————————————————————————————————————————————————
  // 🔴 DIGITAL DESIGN — MASTER LAYER (Architecture & Signoff · Max)
  // ——————————————————————————————————————————————————————————
  theory(
    "digital",
    "master",
    "digital-master-cdc",
    "Master: Clock-Domain Crossing (CDC) Architectures & Dual-Clock Async FIFOs",
    20,
    "Multi-bit bus crossings, Gray-coded pointer synchronization, and dual-clock asynchronous FIFO design.",
    [
      "Asynchronous Clock Domains: Crossing signals between asynchronous clocks (unrelated oscillators with variable phase and frequency) violates deterministic setup/hold timing. Multi-bit buses CANNOT be passed through independent 2FF synchronizers because unequal wire delays (bit skew) cause transient invalid binary values.",
      "Dual-Clock Asynchronous FIFO: The golden standard for high-bandwidth CDC. Write logic operates in clk_wr; read logic operates in clk_rd. Dual-port SRAM memory is indexed by binary pointers, but pointers are converted to Gray code before crossing into the opposing clock domain via 2FF synchronizers.",
      "Why Gray Code for Async Pointers? Gray code guarantees that only exactly 1 bit changes per increment ($000 \\rightarrow 001 \\rightarrow 011 \\rightarrow 010$). If the destination clock samples during a pointer transition, the sampled value is either the old pointer or the new pointer—never an erratic intermediate state. Empty is evaluated in the read domain; Full is evaluated in the write domain with the 2-MSB invert rule: wgray[MSB:MSB-1] == ~rgray[MSB:MSB-1] && wgray[MSB-2:0] == rgray[MSB-2:0].",
      "Pulse & Handshake CDC: For slow control pulses, 2-phase (toggle-based) or 4-phase (Req/Ack) handshake protocols guarantee 100% reliable single-event transfer without loss.",
    ],
    {
      title: "async_fifo_pointers.v",
      lang: "verilog",
      source: `// Gray to Binary and Binary to Gray Conversions
function [ADDR_WIDTH:0] bin2gray (input [ADDR_WIDTH:0] bin);
  bin2gray = bin ^ (bin >> 1);
endfunction

// Async FIFO Full Condition in Write Domain (Gray comparison):
assign wfull = (wgray_next == {~rgray_sync2[ADDR_WIDTH:ADDR_WIDTH-1],
                              rgray_sync2[ADDR_WIDTH-2:0]});

// Async FIFO Empty Condition in Read Domain:
assign rempty = (rgray_next == wgray_sync2);`,
    },
    [
      "Never synchronize raw multi-bit binary buses directly with 2FF chains.",
      "Gray pointer dual-clock FIFOs are pessimistic: full/empty flags are conservative and safe.",
      "Apply SDC 'set_max_delay -datapath_only' to bound Gray pointer skew to < 1 source cycle.",
      "CDC formal verification (e.g. Questa CDC, SpyGlass CDC) is mandatory for tapeout signoff.",
    ]
  ),

  theory(
    "digital",
    "master",
    "digital-master-clocking",
    "Master: Clock Distribution, CTS Mesh & Advanced OCV / POCV",
    18,
    "H-tree and clock mesh grids, Clock Tree Synthesis (CTS) skew balancing, and Parametric OCV statistical derating.",
    [
      "Clock Tree Synthesis (CTS): Clock signals have huge capacitive fanout (tens of thousands of flip-flops). CTS builds balanced buffer trees (H-trees, geometric balanced trees, or clock meshes) to ensure uniform insertion delay and minimize clock skew across PVT corners.",
      "Clock Meshes: In ultra-high-speed processor cores, high-level driving buffers feed a cross-strapped metal mesh grid. Any local delay variation is averaged out by the mesh network, reducing local skew to under 10 picoseconds at the expense of higher dynamic power.",
      "On-Chip Variation (OCV) Modeling: Traditional flat OCV applies pessimistic global derating factors (e.g. +10% late, -10% early). Advanced OCV (AOCV) models derating as a function of logic depth and physical path distance. Parametric OCV (POCV) models delay as a Gaussian random variable (delay = mu +/- C * sigma), enabling statistical STA without leaving silicon yield on the table.",
    ]
  ),

  theory(
    "digital",
    "master",
    "digital-master-lowpower",
    "Master: Architectural Low-Power Design & UPF Multi-Domain Isolation",
    18,
    "Dynamic vs static leakage power, multi-Vt optimization, power domain isolation cells, level shifters, and retention flops.",
    [
      "Silicon Power Dissipation: P_total = alpha * C * Vdd^2 * f (Dynamic) + I_leak * Vdd (Static leakage). As process nodes scale below 7nm, static subthreshold and gate leakage constitute over 40% of total chip power.",
      "Multi-Vt Swapping: Standard cell libraries provide Low-Vt (LVT - fast, leaky), Standard-Vt (SVT), and High-Vt (HVT - slow, ultra-low leakage). Synthesis and PnR tools assign LVT cells strictly to critical timing paths, filling non-critical paths with HVT to crush leakage power.",
      "Multi-Voltage & Power Gating Domains: Powering off unneeded SoC blocks (MTCMOS power gating) requires: 1) Level Shifters at voltage domain interfaces, 2) Isolation Cells (ISO) clamping floating outputs to 0 or 1 when a domain powers down, and 3) State Retention Power Gating (SRPG) flops preserving register state during sleep.",
    ]
  ),

  theory(
    "digital",
    "master",
    "digital-master-dft",
    "Master: Design for Testability (DFT), Scan Insertion & ATPG",
    18,
    "Scan chain insertion, Stuck-At fault modeling, and Launch-off-Capture (LOC) vs Launch-off-Shift (LOS) At-Speed testing.",
    [
      "Why DFT is Essential: Fabricated silicon chips suffer from physical manufacturing defects (dust particles, open vias, bridged metal lines). Functional test vectors only cover a fraction of internal logic gates. DFT converts internal flip-flops into shift registers during test mode, granting complete controllability and observability.",
      "Scan Chain Insertion: Standard D-flip-flops are replaced with Multiplexed-D Scan Flops (SDFF). In normal mode (SE=0), the flop operates on data input D. In scan mode (SE=1), flops form a continuous shift register (Scan In -> Scan Out) driven by Automatic Test Pattern Generation (ATPG) vectors.",
      "The lab below is one ATPG pattern, in order: (1) insert the mux-D cells, (2) shift in vector 1100 so Q0 and Q1 are 1, (3) capture with SE=0 — that is the only cycle that tests the gates, (4) shift the captured Q bits out on SO and compare to the golden signature. A stuck-at-0 on (Q0 AND Q1) flips D0; you should see a mismatch. Optional LOC is a second functional pulse for at-speed delay, not an extra scan shift.",
      "Fault Models & At-Speed Transition Testing: Stuck-at fault testing checks if a node is permanently tied to 0 (SA0) or 1 (SA1). At-Speed transition fault testing verifies timing at rated clock frequency using Launch-off-Capture (LOC / Broadside) or Launch-off-Shift (LOS) two-pulse clock sequences.",
    ]
  ),

  practical(
    "digital",
    "master",
    "digital-master-practical",
    "Master Practical: Async FIFO Dual-Clock Gray Pointer Engine",
    25,
    "Implement the Gray pointer conversion, 2FF synchronization, and empty/full detection engine for an Asynchronous FIFO.",
    [
      "Declare module `async_fifo_ctrl` with parameter `ADDR_WIDTH = 4` to coordinate pointer tracking across two asynchronous clocks (`wclk` and `rclk`).",
      "Compute `(ADDR_WIDTH + 1)`-bit binary pointers that increment on valid transactions, then convert them to Gray code using `gray = bin ^ (bin >> 1)`.",
      "Pass the read Gray pointer across to `wclk` using a two-stage synchronizer (`always @(posedge wclk)`), and pass the write Gray pointer to `rclk` using another 2FF synchronizer (`always @(posedge rclk)`).",
      "Assert `rempty` in the read domain when the synchronized write pointer catches up with the read pointer (`rgray_next == wgray_sync`).",
      "Assert `wfull` in the write domain when the write pointer wraps around: invert the top two MSBs while keeping all lower bits matching (`wgray_next == {~rgray_sync[MSB:MSB-1], rgray_sync[MSB-2:0]}`)."
    ],
    {
      language: "verilog",
      starter: `module async_fifo_ctrl #(
  parameter ADDR_WIDTH = 4
) (
  input  wire                  wclk, wrst_n, wr_en,
  input  wire                  rclk, rrst_n, rd_en,
  output wire [ADDR_WIDTH-1:0] waddr,
  output wire [ADDR_WIDTH-1:0] raddr,
  output reg                   wfull,
  output reg                   rempty
);

  // TODO: Binary & Gray pointers for write & read domains
  // TODO: 2FF synchronizers for cross-domain Gray pointers
  // TODO: Full and empty logic with MSB inversion rules

endmodule`,
      checks: [
        { id: "c1", label: "Module declaration", kind: "includes", pattern: "module async_fifo_ctrl" },
        { id: "c2", label: "Binary to Gray conversion", kind: "regex", pattern: "\\^\\s*\\(\\s*\\w+\\s*>>\\s*1\\s*\\)" },
        { id: "c3", label: "Write domain 2FF synchronizer", kind: "regex", pattern: "always\\s*@\\s*\\(\\s*posedge\\s+wclk" },
        { id: "c4", label: "Read domain 2FF synchronizer", kind: "regex", pattern: "always\\s*@\\s*\\(\\s*posedge\\s+rclk" },
        { id: "c5", label: "Full detection with MSB inversion", kind: "regex", pattern: "~|wfull" },
      ],
      solution: `module async_fifo_ctrl #(
  parameter ADDR_WIDTH = 4
) (
  input  wire                  wclk, wrst_n, wr_en,
  input  wire                  rclk, rrst_n, rd_en,
  output wire [ADDR_WIDTH-1:0] waddr,
  output wire [ADDR_WIDTH-1:0] raddr,
  output reg                   wfull,
  output reg                   rempty
);

  reg [ADDR_WIDTH:0] wbin_q, rbin_q;
  reg [ADDR_WIDTH:0] wgray_q, rgray_q;
  reg [ADDR_WIDTH:0] rgray_s1, rgray_s2;
  reg [ADDR_WIDTH:0] wgray_s1, wgray_s2;

  wire [ADDR_WIDTH:0] wbin_next  = wbin_q + (wr_en && !wfull);
  wire [ADDR_WIDTH:0] wgray_next = wbin_next ^ (wbin_next >> 1);
  wire [ADDR_WIDTH:0] rbin_next  = rbin_q + (rd_en && !rempty);
  wire [ADDR_WIDTH:0] rgray_next = rbin_next ^ (rbin_next >> 1);

  assign waddr = wbin_q[ADDR_WIDTH-1:0];
  assign raddr = rbin_q[ADDR_WIDTH-1:0];

  // Write domain logic
  always @(posedge wclk or negedge wrst_n) begin
    if (!wrst_n) begin
      wbin_q    <= 0;
      wgray_q   <= 0;
      rgray_s1  <= 0;
      rgray_s2  <= 0;
      wfull     <= 1'b0;
    end else begin
      wbin_q    <= wbin_next;
      wgray_q   <= wgray_next;
      rgray_s1  <= rgray_q;
      rgray_s2  <= rgray_s1;
      wfull     <= (wgray_next == {~rgray_s2[ADDR_WIDTH:ADDR_WIDTH-1], rgray_s2[ADDR_WIDTH-2:0]});
    end
  end

  // Read domain logic
  always @(posedge rclk or negedge rrst_n) begin
    if (!rrst_n) begin
      rbin_q    <= 0;
      rgray_q   <= 0;
      wgray_s1  <= 0;
      wgray_s2  <= 0;
      rempty    <= 1'b1;
    end else begin
      rbin_q    <= rbin_next;
      rgray_q   <= rgray_next;
      wgray_s1  <= wgray_q;
      wgray_s2  <= wgray_s1;
      rempty    <= (rgray_next == wgray_s2);
    end
  end

endmodule`,
    }
  ),

  quiz("digital", "master", "digital-master-quiz", "Digital Design — Master Silicon Architect Exam", [
    { id: "dm1", prompt: "In an Asynchronous Dual-Clock FIFO, Gray code pointers are used across domains because:", choices: ["Gray code is faster to add", "Exactly 1 bit transitions per increment, eliminating multi-bit sample incoherency", "Gray code eliminates memory requirements", "Gray code needs no reset"], answer: 1, explain: "Single-bit transitions guarantee that clock sampling during a transition resolves to either previous or next valid value." },
    { id: "dm2", prompt: "When comparing write and read Gray pointers in a dual-clock FIFO, the FULL condition requires:", choices: ["All Gray bits to match exactly", "The two MSBs to be inverted and remaining lower bits to match", "The entire pointer to be inverted", "Write pointer to equal 0"], answer: 1, explain: "Inverting the two MSBs distinguishes FIFO Full from FIFO Empty in Gray code pointer arithmetic." },
    { id: "dm3", prompt: "Parametric OCV (POCV) improves on flat On-Chip Variation derates by:", choices: ["Assuming all gates in a die have identical speed", "Modeling gate delay variation statistically as a Gaussian distribution (mu +/- 3*sigma)", "Running SPICE simulations at tapeout only", "Disabling hold checks"], answer: 1, explain: "POCV reduces excessive pessimism by modeling random physical variation statistically." },
    { id: "dm4", prompt: "When a power domain is switched OFF, isolation cells must be placed at boundary outputs to:", choices: ["Speed up the clock tree", "Clamp floating, unpowered signals to a deterministic 0 or 1, preventing crowbar current in active domains", "Store scan vectors", "Reduce die area"], answer: 1, explain: "Floating inputs in active domains cause CMOS gates to conduct large crowbar leakage currents." },
    { id: "dm5", prompt: "In Scan-based Design for Testability (DFT), the primary role of scan insertion is to:", choices: ["Increase functional clock frequency", "Turn internal flip-flops into shift registers to grant full controllability and observability over combinational logic", "Replace SRAM arrays", "Fix timing setup violations"], answer: 1, explain: "Scan chains allow external ATPG test patterns to be shifted directly into flip-flops to detect physical defects." },
    { id: "dm6", prompt: "Launch-off-Capture (LOC / Broadside) at-speed transition testing generates the launch transition via:", choices: ["The scan shift clock", "A functional clock pulse following scan load", "Asynchronous reset toggling", "JTAG boundary scan only"], answer: 1, explain: "LOC launches the transition from functional state, relaxing scan-enable timing requirements compared to LOS." },
  ]),

  // ——— Verilog ———
  // Standard Layer (Working Fluency)
  theory(
    "verilog",
    "standard",
    "verilog-standard-generate",
    "Standard: Parameters, Localparams, & Generate Blocks",
    16,
    "Parameterized RTL without copy-paste: generate for, generate if, and multi-instantiation.",
    [
      "Parameters vs. Localparams: A `parameter` is exposed at module instantiation (`my_mod #(.WIDTH(16)) u_inst (...)`), allowing consumers to configure datapath bitwidths. A `localparam` is an internal constant computed from parameters that cannot be overridden directly from outside.",
      "The `generate` construct: Evaluated strictly at elaboration time (before simulation or synthesis). `generate for` loops unroll hardware structures like one-hot priority encoders, barrel shifters, and parallel parity trees. Each generated instance receives a unique hierarchical name (`gen_blk[i].u_cell`).",
      "`generate if / case`: Conditionally instantiates alternate datapath architectures (e.g. instantiating a high-speed CLA adder if `FAST_MODE=1` vs a compact ripple adder if `FAST_MODE=0`).",
    ],
    {
      title: "param_priority_encoder.v",
      lang: "verilog",
      source: `module param_priority_encoder #(
  parameter WIDTH = 8
) (
  input  wire [WIDTH-1:0]        req,
  output wire [$clog2(WIDTH)-1:0] grant_idx,
  output wire                    valid
);
  assign valid = |req;

  genvar i;
  wire [WIDTH-1:0] higher_pri_req;
  assign higher_pri_req[0] = 1'b0;

  generate
    for (i = 1; i < WIDTH; i = i + 1) begin : gen_pri
      assign higher_pri_req[i] = higher_pri_req[i-1] | req[i-1];
    end
  endgenerate

  wire [WIDTH-1:0] grant_onehot = req & ~higher_pri_req;
  // Binary encode grant_onehot...
endmodule`,
    }
  ),

  theory(
    "verilog",
    "standard",
    "verilog-standard-signed",
    "Standard: Signed Arithmetic, $signed(), and Sign-Extension Traps",
    16,
    "Two's complement representation, sign extension gotchas, and expression signedness rules.",
    [
      "Verilog Signed Evaluation Rules (LRM Section 5.5): An expression is evaluated as signed ONLY IF all operands are signed. If even ONE operand is unsigned (e.g. adding a `reg signed [7:0] a` to an unsigned `wire [7:0] b`), the entire expression is coerced to unsigned, causing negative numbers to be zero-extended rather than sign-extended!",
      "The `$signed()` and `$unsigned()` system functions: Use `$signed(sig)` to cast unsigned vectors to two's complement for correct comparison (`<`, `<=`, `>`, `>=`) and arithmetic right-shift (`>>>`).",
      "Sign Extension Bug: Assigning a signed 8-bit value (`reg signed [7:0] a = -5`) to a 16-bit wire (`wire [15:0] ext = a`) performs automatic sign extension (`16'hFFFB`). But doing `{8'b0, a}` or mixing with unsigned nets truncates sign extension to zero extension (`16'h00FB = 251`), corrupting math.",
    ],
    {
      title: "signed_arith_demo.v",
      lang: "verilog",
      source: `module signed_alu (
  input  wire signed [7:0]  a,
  input  wire signed [7:0]  b,
  output wire signed [8:0]  sum_signed,
  output wire signed [15:0] prod_signed,
  output wire signed [7:0]  sra_result
);
  // Correct sign-extended addition (9-bit output avoids overflow)
  assign sum_signed  = a + b;
  
  // Signed 8x8 multiplication (16-bit product)
  assign prod_signed = a * b;

  // Arithmetic right shift (preserves MSB sign bit)
  assign sra_result  = a >>> 2;
endmodule`,
    }
  ),

  theory(
    "verilog",
    "standard",
    "verilog-standard-sram",
    "Standard: Synthesizable Single & Dual-Port Synchronous RAM",
    18,
    "Memory array inference, synchronous read/write timing, and avoid-reset rules.",
    [
      "Synthesizable SRAM Array Declaration: Declared as a 2D array of registers: `reg [DATA_WIDTH-1:0] mem [0:DEPTH-1];`. Synthesis tools automatically infer Block RAM (BRAM/UltraRAM) or standard cell memory compilers rather than thousands of discrete flip-flops.",
      "Synchronous vs Asynchronous Reads: ASIC SRAM compilers require synchronous registered reads (`always @(posedge clk) rd_data <= mem[rd_addr];`). Asynchronous combinational reads (`assign rd_data = mem[rd_addr];`) force synthesis tools to construct huge multiplexer trees from standard flip-flops, wasting massive silicon area.",
      "The No-Reset Rule: NEVER apply asynchronous or synchronous resets to the memory array `mem` inside an `if (!rst_n)` loop. Resetting an entire SRAM array requires every bit cell to have a reset transistor, preventing memory compiler mapping and exploding gate count by 10x!",
    ],
    {
      title: "sync_single_port_ram.v",
      lang: "verilog",
      source: `module sync_ram #(
  parameter DATA_WIDTH = 32,
  parameter ADDR_WIDTH = 10 // 1024 words = 4 KB
) (
  input  wire                  clk,
  input  wire                  we,
  input  wire [ADDR_WIDTH-1:0] addr,
  input  wire [DATA_WIDTH-1:0] din,
  output reg  [DATA_WIDTH-1:0] dout
);
  reg [DATA_WIDTH-1:0] ram [0:(1<<ADDR_WIDTH)-1];

  always @(posedge clk) begin
    if (we) begin
      ram[addr] <= din;
    end
    dout <= ram[addr]; // Read-during-write: Read old memory contents
  end
endmodule`,
    }
  ),

  theory(
    "verilog",
    "standard",
    "verilog-standard-tasks",
    "Standard: Modular RTL with Verilog Functions and Tasks",
    14,
    "Combinational functions, automatic recursive functions, and procedural tasks for clean RTL.",
    [
      "Verilog `function`: Strictly combinational, executes in zero simulation time, must contain at least one input, cannot contain delays (`#`), and returns a single value via the function name assignment (`func_name = val`).",
      "Automatic Functions (`function automatic`): Allocates dynamic stack frames on each invocation, enabling recursion (e.g. computing Gray codes, bit reversals, or CRC lookup tables at elaboration time) and preventing variable collision in multi-threaded simulators.",
      "Verilog `task`: Can contain timing controls (`@(posedge clk)`, `#10`), multiple inputs, outputs (`output`, `inout`), and non-blocking assignments. Primarily used in testbenches and bus functional models (BFMs).",
    ],
    {
      title: "bit_reverse_func.v",
      lang: "verilog",
      source: `// Synthesizable combinational function
function [7:0] reverse_byte;
  input [7:0] in;
  integer k;
  begin
    for (k = 0; k < 8; k = k + 1)
      reverse_byte[k] = in[7-k];
  end
endfunction

assign reversed_data = reverse_byte(data_in);`,
    }
  ),

  practical(
    "verilog",
    "standard",
    "verilog-standard-practical",
    "Standard Practical: Parameterized Priority Arbiter",
    20,
    "Write a parameterized N-bit fixed-priority arbiter with valid output.",
    [
      "Declare the parameterized module `priority_arbiter #(parameter WIDTH = 4)` with request inputs `req`, one-hot output `grant`, and transaction flag `valid`.",
      "Assign highest priority to the lowest client bit (`req[0]`), masking out all higher-order requests whenever lower-order clients are active.",
      "Assert `valid = 1` if at least one client is requesting access (`|req != 0`), ensuring `grant` contains strictly one HIGH bit or all zeros."
    ],
    {
      language: "verilog",
      starter: `module priority_arbiter #(
  parameter WIDTH = 4
) (
  input  wire [WIDTH-1:0] req,
  output wire [WIDTH-1:0] grant,
  output wire             valid
);
  // TODO: Implement parameterized priority arbiter logic

endmodule`,
      checks: [
        { id: "gen", label: "Parameterized structure", kind: "includes", pattern: "parameter" },
        { id: "val", label: "Valid detection", kind: "includes", pattern: "valid" },
        { id: "gnt", label: "Grant calculation", kind: "includes", pattern: "grant" },
      ],
      solution: `module priority_arbiter #(
  parameter WIDTH = 4
) (
  input  wire [WIDTH-1:0] req,
  output wire [WIDTH-1:0] grant,
  output wire             valid
);
  assign valid = |req;
  assign grant = req & (~req + 1'b1); // Two's complement one-hot isolation
endmodule`,
    }
  ),

  quiz("verilog", "standard", "verilog-standard-quiz", "Verilog — Standard Working Fluency Quiz", [
    { id: "vs1", prompt: "A `localparam` in Verilog differs from a `parameter` because:", choices: ["It cannot be overridden from a parent module instance", "It is evaluated during simulation runtime", "It takes up silicon flip-flops", "It is only for testbenches"], answer: 0, explain: "localparams are internal constants that protect against unintended overriding." },
    { id: "vs2", prompt: "If a signed 8-bit variable `a = -1` is added to an unsigned 8-bit variable `b = 2` without casting, Verilog evaluates the expression as:", choices: ["Signed (-1 + 2 = 1)", "Unsigned (255 + 2 = 257)", "Illegal syntax error", "Zero"], answer: 1, explain: "Mixing any unsigned operand in an expression forces all operands to be evaluated as unsigned." },
    { id: "vs3", prompt: "Why should an ASIC SRAM memory array NOT have an asynchronous reset in RTL?", choices: ["Synthesis will fail to map the array to high-density BRAM/SRAM macro compilers", "Asynchronous reset speeds up memory too much", "Memory bits are always 0 on power up", "It is forbidden by IEEE 1364"], answer: 0, explain: "SRAM bit cells do not have reset transistors; adding a reset forces flip-flop explosion." },
    { id: "vs4", prompt: "What is the primary difference between a Verilog `function` and a `task`?", choices: ["Functions execute in zero simulation time and return a value; tasks can consume simulation time", "Tasks cannot have inputs", "Functions can contain posedge clock delays", "Tasks are only for synthesis"], answer: 0, explain: "Functions are pure combinational routines; tasks can contain delays and temporal statements." },
  ]),

  // ——— Expert Layer (Production Practice) ———
  theory(
    "verilog",
    "expert",
    "verilog-expert-event-queue",
    "Expert: Stratified Event Queue & Race Condition Debugging",
    18,
    "The 4 IEEE event queue regions, delta cycles, and eliminating simulation race bugs.",
    [
      "IEEE 1364 Stratified Event Queue Regions: 1) **Active Region**: Evaluates RHS of blocking (`=`) and non-blocking (`<=`) statements and continuous assigns. 2) **Inactive Region**: Processes `#0` procedural assignments (bad practice). 3) **NBA Region**: Updates the LHS of all non-blocking (`<=`) assignments. 4) **Postponed Region**: Read-only tasks like `$strobe` and `$monitor`.",
      "The Flip-Flop Race Condition: If two sequential blocks write `always @(posedge clk) q1 = d;` and `always @(posedge clk) q2 = q1;` using blocking assignments (`=`), the simulator execution order between the two blocks is undefined. If the `q1` block executes first, `q2` captures the new `q1` in the SAME cycle, violating physical causality!",
      "Golden RTL Rule: Use Non-Blocking (`<=`) for ALL sequential clocked logic and Blocking (`=`) for pure combinational `always @(*)` logic. Never mix `=` and `<=` in the same procedural block.",
    ],
    {
      title: "event_queue_pipeline.v",
      lang: "verilog",
      source: `// Safe 2-stage shift register (NBA avoids race)
always @(posedge clk or negedge rst_n) begin
  if (!rst_n) begin
    stage1_q <= 1'b0;
    stage2_q <= 1'b0;
  end else begin
    stage1_q <= d_in;      // Evaluated in Active region,
    stage2_q <= stage1_q;  // Updated in NBA region in parallel!
  end
end`,
    }
  ),

  theory(
    "verilog",
    "expert",
    "verilog-expert-sim-synth",
    "Expert: Simulation vs. Synthesis Mismatches & X-Propagation Traps",
    18,
    "casex hazards, full_case / parallel_case synthesis directives, and X-optimism vs X-pessimism.",
    [
      "The `casex` Danger: `casex` treats both `z` and `x` (unknown) as don't-cares in the case expression and items. If an uninitialized or floating bus carries `x`, `casex` will match the FIRST branch containing an `x`, masking silicon bugs in RTL simulation. In real hardware, uninitialized flops do not match don't-cares! Prefer `casez` (treats only `?` / `z` as don't-care) or standard `case`.",
      "The `// synopsys full_case parallel_case` Trap: These comments tell the synthesis tool to assume unlisted branches can never happen (`full_case`) and branches are mutually exclusive (`parallel_case`). If an unlisted condition actually occurs in silicon, the hardware executes undefined behavior while RTL simulation branches to default, creating a catastrophic mismatch!",
      "X-Optimism vs X-Pessimism: In RTL simulation, an `if (x_condition)` evaluates to `false`, optimistically hiding uninitialized state propagation. In silicon gate-level simulation, an unknown clock/reset transition causes flip-flop metastability (X-pessimism).",
    ],
    {
      title: "safe_decoder.v",
      lang: "verilog",
      source: `// Safe priority decode using casez (explicit don't care '?')
always @(*) begin
  grant = 4'b0000;
  casez (req)
    4'b???1: grant = 4'b0001;
    4'b??10: grant = 4'b0010;
    4'b?100: grant = 4'b0100;
    4'b1000: grant = 4'b1000;
    default: grant = 4'b0000;
  endcase
end`,
    }
  ),

  theory(
    "verilog",
    "expert",
    "verilog-expert-resource-sharing",
    "Expert: RTL Coding for Area & Power (Resource Sharing & Mux Restructuring)",
    18,
    "Sharing expensive arithmetic blocks (multipliers/adders) and factoring multiplexers.",
    [
      "Resource Sharing: Consider `if (sel) y = a + b; else y = c + d;`. Written naively, synthesis may infer TWO independent 32-bit adders and a 32-bit multiplexer. Factoring the inputs (`op1 = sel ? a : c; op2 = sel ? b : d; y = op1 + op2;`) forces synthesis to use ONE shared 32-bit adder with two smaller input muxes, cutting area by ~45%.",
      "Mux Restructuring for Timing: Placing high-delay combinational logic early in the mux tree and fast registered control signals late at the output stage minimizes data path arrival times.",
      "Operator Merging: Modern synthesis tools merge cascaded multipliers and adders into single DSP48 / ALU slices if the RTL coding structure does not artificially register intermediate nets prematurely.",
    ],
    {
      title: "resource_sharing_alu.v",
      lang: "verilog",
      source: `// Factored ALU datapath: 1 shared adder/subtractor
module shared_add_sub (
  input  wire [31:0] a, b, c, d,
  input  wire        sel_sub,
  input  wire        sel_inputs,
  output wire [31:0] result
);
  // Multiplex inputs BEFORE arithmetic operator
  wire [31:0] op_a = sel_inputs ? a : c;
  wire [31:0] op_b = sel_inputs ? b : d;

  // Single shared adder/subtractor core
  assign result = sel_sub ? (op_a - op_b) : (op_a + op_b);
endmodule`,
    }
  ),

  practical(
    "verilog",
    "expert",
    "verilog-expert-practical",
    "Expert Practical: Round-Robin Arbiter with Grant Mask",
    25,
    "Write a parameterized 4-client Round-Robin Arbiter with dynamic rotating priority.",
    [
      "Declare module `round_robin_arbiter #(parameter N = 4)` with request inputs `req` and one-hot grant outputs `grant`.",
      "Track the last granted client using a registered mask (`mask_q`), then evaluate unmasked requests (`req & ~mask_q`) to grant the next sequential requester.",
      "If no higher-indexed clients are requesting, wrap around smoothly to lower-indexed requesters to guarantee 100% fair starvation-free bandwidth sharing."
    ],
    {
      language: "verilog",
      starter: `module round_robin_arbiter #(
  parameter N = 4
) (
  input  wire         clk,
  input  wire         rst_n,
  input  wire [N-1:0] req,
  output wire [N-1:0] grant
);
  // TODO: Implement rotating round-robin arbitration logic

endmodule`,
      checks: [
        { id: "clk", label: "Clocked sequential state", kind: "includes", pattern: "posedge clk" },
        { id: "rst", label: "Async reset", kind: "includes", pattern: "rst_n" },
        { id: "gnt", label: "Grant output", kind: "includes", pattern: "grant" },
      ],
      solution: `module round_robin_arbiter #(
  parameter N = 4
) (
  input  wire         clk,
  input  wire         rst_n,
  input  wire [N-1:0] req,
  output wire [N-1:0] grant
);
  reg [N-1:0] mask_q;
  wire [N-1:0] masked_req = req & mask_q;
  wire [N-1:0] grant_unmasked = req & (~req + 1'b1);
  wire [N-1:0] grant_masked   = masked_req & (~masked_req + 1'b1);

  assign grant = |masked_req ? grant_masked : grant_unmasked;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      mask_q <= {N{1'b1}};
    end else if (|grant) begin
      mask_q <= ~(grant | (grant - 1'b1));
    end
  end
endmodule`,
    }
  ),

  quiz("verilog", "expert", "verilog-expert-quiz", "Verilog — Expert Production Practice Quiz", [
    { id: "ve1", prompt: "In the IEEE Verilog stratified event queue, non-blocking assignment (<=) updates occur in the:", choices: ["Active region", "Inactive region", "Non-Blocking Assignment (NBA) region", "Postponed region"], answer: 2, explain: "LHS updates of non-blocking assignments are deferred to the NBA region to prevent race conditions." },
    { id: "ve2", prompt: "Why is the use of `// synopsys full_case` dangerous in synthesizable RTL?", choices: ["It slows down synthesis compilation time", "It causes simulation/synthesis mismatch if an unhandled state occurs in silicon", "It generates too many clock buffers", "It forces 64-bit datapaths"], answer: 1, explain: "full_case tells synthesis to ignore default branches, hiding bugs that happen in silicon." },
    { id: "ve3", prompt: "What is the primary benefit of resource sharing in RTL coding?", choices: ["Reduces clock frequency", "Shares expensive arithmetic units (e.g. adders, multipliers) to cut silicon area", "Eliminates all registers", "Disables reset"], answer: 1, explain: "Factoring multiplexers ahead of operators enables reuse of single hardware arithmetic blocks." },
  ]),

  // ——— Master Layer (Architecture & Signoff) ———
  theory(
    "verilog",
    "master",
    "verilog-master-lint",
    "Master: Production ASIC Linting Guidelines & Inferred Latch Elimination",
    20,
    "SpyGlass / Ascent Lint rulebooks, multi-driven nets, clock domain crossings, and strict RTL signoff.",
    [
      "Industry RTL Linting Standard: Production ASIC tapeouts enforce zero-warning policies on commercial linters (Synopsys SpyGlass, Siemens Questa Lint, Cadence Hal). Key rule categories: **SYNTH** (synthesis compatibility), **STYPE** (type checking), **WIRING** (unconnected/multi-driven nets), **FSM** (unreachable states/deadlocks), and **CLOCK** (glitches on clock nets).",
      "Eliminating Inferred Latches: An inferred latch occurs when a signal assigned in a combinational `always @(*)` block is not assigned in every possible execution path (e.g. missing `else` or incomplete `case`). **Master Rule**: Assign default values to all outputs at the very first line of the combinational block!",
      "Multi-Driven Net Detection: Verilog allows multiple `assign` statements on a `wire` (forming a wired-OR/AND net). In standard CMOS ASIC cell libraries, multi-driven nets create dead shorts (Vdd to GND), destroying silicon. All internal nets must have exactly ONE driver.",
    ],
    {
      title: "clean_fsm_template.v",
      lang: "verilog",
      source: `// Production ASIC Latch-Free Combinational Block Template
always @(*) begin
  // 1. DEFAULT VALUES PREVENT INFERRED LATCHES
  next_state = state_q;
  tx_valid   = 1'b0;
  rx_ready   = 1'b0;
  alu_op     = 3'b000;

  // 2. EXPLICIT BRANCH EVALUATION
  case (state_q)
    S_IDLE: begin
      rx_ready = 1'b1;
      if (rx_valid) next_state = S_ACTIVE;
    end
    S_ACTIVE: begin
      tx_valid = 1'b1;
      alu_op   = 3'b001;
      if (tx_ready) next_state = S_DONE;
    end
    S_DONE: begin
      next_state = S_IDLE;
    end
    default: begin
      next_state = S_IDLE; // Handles X and illegal states
    end
  endcase
end`,
    }
  ),

  theory(
    "verilog",
    "master",
    "verilog-master-lowpower",
    "Master: Low-Power RTL Coding Guidelines & Operand Isolation",
    18,
    "Dynamic power dissipation ($P = \alpha C V^2 f$), operand isolation, and register retiming.",
    [
      "Dynamic Switching Power ($P_{dyn} = \alpha \cdot C_L \cdot V_{DD}^2 \cdot f$): To reduce power, RTL architects must minimize the switching activity factor ($\alpha$).",
      "Operand Isolation: When a 64-bit floating-point multiplier's output is not selected by downstream logic, toggling its inputs wastes massive dynamic energy. By gating the inputs with an AND/OR mask (`assign mult_in_a = enable ? raw_a : 64'b0;`), switching activity inside the arithmetic cloud is reduced to zero when disabled.",
      "Clock Gating Integration: Automatic ICG cell insertion by synthesis relies on clean RTL enable patterns: `always @(posedge clk) if (en) q <= d;`. Writing unconditional assignments (`q <= en ? d : q;`) can prevent clock gating if the tool fails to infer the loop feedback.",
    ],
    {
      title: "operand_isolated_alu.v",
      lang: "verilog",
      source: `module low_power_alu (
  input  wire        clk,
  input  wire        alu_en,
  input  wire [31:0] a_raw, b_raw,
  output reg  [31:0] result_q
);
  // Operand Isolation: Block input toggling when ALU is disabled
  wire [31:0] a_iso = alu_en ? a_raw : 32'b0;
  wire [31:0] b_iso = alu_en ? b_raw : 32'b0;

  wire [31:0] alu_out = a_iso * b_iso; // High capacitance 32x32 multiplier

  always @(posedge clk) begin
    if (alu_en) begin
      result_q <= alu_out;
    end
  end
endmodule`,
    }
  ),

  theory(
    "verilog",
    "master",
    "verilog-master-rmm",
    "Master: Reuse Methodology Manual (RMM) Rules & IP Packaging",
    16,
    "Synchronous reset strategies, port naming standards, parameterized SoC hierarchy, and IP-XACT metadata.",
    [
      "Reuse Methodology Manual (RMM) Core Principles: 1) Strictly registered block boundaries (all module outputs are driven directly by flip-flops with no combinational trailing logic). 2) Zero top-level glue logic (all interconnects are routed through structured buses). 3) Predictable active-low reset polarity (`rst_n`).",
      "Modular IP Packaging: Wrap RTL with standardized AMBA AXI4 / APB4 or OCP slave interfaces with clean parameterized registers.",
      "Clean Hierarchy: Separate clock/reset generation, memory macros, core datapaths, and IO pads into independent hierarchical modules for modular synthesis floorplanning.",
    ]
  ),

  practical(
    "verilog",
    "master",
    "verilog-master-practical",
    "Master Practical: AXI-Stream Valid-Ready Skid Buffer",
    25,
    "Write a zero-latency full-throughput Valid-Ready Skid Buffer in synthesizable Verilog.",
    [
      "Declare module `skid_buffer #(parameter WIDTH = 32)` to decouple upstream slave (`s_valid`/`s_ready`) and downstream master (`m_valid`/`m_ready`) handshakes.",
      "Implement a primary output register and a secondary backup skid register to store incoming payload data with zero throughput stalls when downstream stalls (`m_ready = 0`).",
      "Assert `s_ready = 1` whenever the skid buffer has buffer capacity, enabling back-to-back 1 transfer/cycle throughput without combinational feedback paths."
    ],
    {
      language: "verilog",
      starter: `module skid_buffer #(
  parameter WIDTH = 32
) (
  input  wire             clk,
  input  wire             rst_n,
  // Upstream slave interface
  input  wire             s_valid,
  output wire             s_ready,
  input  wire [WIDTH-1:0] s_data,
  // Downstream master interface
  output wire             m_valid,
  input  wire             m_ready,
  output wire [WIDTH-1:0] m_data
);
  // TODO: Implement two-register skid buffer with zero throughput bubbles

endmodule`,
      checks: [
        { id: "clk", label: "Clocked sequential stages", kind: "includes", pattern: "posedge clk" },
        { id: "rst", label: "Async reset", kind: "includes", pattern: "rst_n" },
        { id: "rdy", label: "Ready generation", kind: "includes", pattern: "s_ready" },
        { id: "vld", label: "Valid generation", kind: "includes", pattern: "m_valid" },
      ],
      solution: `module skid_buffer #(
  parameter WIDTH = 32
) (
  input  wire             clk,
  input  wire             rst_n,
  input  wire             s_valid,
  output wire             s_ready,
  input  wire [WIDTH-1:0] s_data,
  output reg              m_valid,
  input  wire             m_ready,
  output reg  [WIDTH-1:0] m_data
);
  reg [WIDTH-1:0] skid_data_q;
  reg             skid_valid_q;

  assign s_ready = !skid_valid_q;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      m_valid      <= 1'b0;
      m_data       <= {WIDTH{1'b0}};
      skid_valid_q <= 1'b0;
      skid_data_q  <= {WIDTH{1'b0}};
    end else begin
      if (m_ready) begin
        if (skid_valid_q) begin
          m_valid      <= 1'b1;
          m_data       <= skid_data_q;
          skid_valid_q <= 1'b0;
        end else begin
          m_valid      <= s_valid;
          m_data       <= s_data;
        end
      end else if (s_valid && s_ready) begin
        skid_valid_q <= 1'b1;
        skid_data_q  <= s_data;
      end
    end
  end
endmodule`,
    }
  ),

  quiz("verilog", "master", "verilog-master-quiz", "Verilog — Master RTL Architect Signoff Exam", [
    { id: "vm1", prompt: "How should an RTL designer guarantee that a combinational always @(*) block never infers a latch?", choices: ["Assign default values to all outputs at the very top of the always block", "Use only non-blocking (<=) assignments", "Increase clock frequency", "Insert #0 delays"], answer: 0, explain: "Assigning default values guarantees that every output has a specified assignment on every execution path." },
    { id: "vm2", prompt: "The technique of Operand Isolation saves dynamic power in RTL by:", choices: ["Disconnecting power supply to standard cells", "Gating input transitions to complex arithmetic blocks when their outputs are not being consumed", "Increasing capacitance", "Using asynchronous logic"], answer: 1, explain: "Operand isolation prevents unnecessary dynamic switching in large logic cones when disabled." },
    { id: "vm3", prompt: "What is the primary purpose of a Valid/Ready Skid Buffer on an AXI-Stream interface?", choices: ["To double the clock frequency", "To break combinational timing paths between s_ready and m_ready while maintaining 100% throughput without bubble cycles", "To convert serial data to parallel", "To perform CRC check"], answer: 1, explain: "Skid buffers isolate ready-valid paths to close timing without sacrificing pipeline throughput." },
  ]),

  // ——— SDC (Standard, Expert, Master Layers) ———
  theory("sdc", "standard", "sdc-standard-drc", "Standard: Electrical Design Rules & Slew Constraints", 16,
    "Guiding the optimization cost function with transition, capacitance, fanout, and load limits.",
    [
      "Design Rule Constraints (DRCs): Electrical limits take absolute priority in synthesis and P&R optimization: `set_max_transition` bounds maximum signal transition times to prevent dynamic short-circuit power dissipation; `set_max_capacitance` ensures logic gates never drive capacitive loads beyond characterized cell library limits.",
      "Port Driving Cell & Load Modeling: Inputs do not receive ideal square waves; they are driven by preceding stage gates (`set_driving_cell -lib_cell sky130_fd_sc_hd__inv_2 [all_inputs]`). Outputs drive downstream pin and wire loads (`set_load 0.05 [all_outputs]`).",
      "Fanout Constraints: `set_max_fanout 16 [current_design]` forces the tool to insert buffer trees on high-fanout nets (such as reset, enable, or scan signals) prior to clock tree synthesis.",
    ]),

  theory("sdc", "standard", "sdc-standard-clock-groups", "Standard: Asynchronous & Logically Exclusive Clock Domains", 18,
    "Declaring domain relationships with set_clock_groups instead of dangerous wildcard false paths.",
    [
      "Why Clock Groups Matter: Chips contain multiple asynchronous oscillators (e.g. 500 MHz CPU PLL and 100 MHz PCIe reference). By default, STA checks timing across all clock domain crossings (CDCs).",
      "Asynchronous Groups: `set_clock_groups -asynchronous -group {clk_cpu} -group {clk_pcie}` instructs STA to cut all timing paths between these domains. Synchronizers (2-FF or Async FIFOs) must exist in RTL to prevent metastability!",
      "Logically Exclusive Clocks: When two clocks drive a common net via a 2:1 Clock MUX (`clk_fast` vs `clk_test`), use `set_clock_groups -logically_exclusive` so STA times each operational mode independently without cross-clock false paths.",
    ]),

  practical(
    "sdc",
    "standard",
    "sdc-standard-practical",
    "Standard Practical: Multi-Rate Interface SDC Constraints",
    25,
    "Write a complete SDC constraint file for a dual-clock system with DRC limits, async clock groups, and I/O delays.",
    [
      "Define primary clock `clk_sys` (500 MHz, period 2.0ns on port `clk`).",
      "Define peripheral clock `clk_uart` (50 MHz, period 20.0ns on port `pclk`).",
      "Declare `clk_sys` and `clk_uart` as asynchronous with `set_clock_groups -asynchronous`.",
      "Apply max transition limit of 0.15ns and output load of 0.04pF to all outputs.",
    ],
    {
      language: "tcl",
      starter: `# Multi-Rate SDC Constraints: multi_clock.sdc

# TODO: Step 1 - Define clk_sys (2.0ns) and clk_uart (20.0ns)
# TODO: Step 2 - Declare asynchronous clock groups
# TODO: Step 3 - Apply max transition (0.15ns) and output load (0.04pF)`,
      checks: [
        { id: "c1", label: "create_clock clk_sys (2.0ns)", kind: "regex", pattern: "create_clock.*clk_sys.*2" },
        { id: "c2", label: "create_clock clk_uart (20.0ns)", kind: "regex", pattern: "create_clock.*clk_uart.*20" },
        { id: "grp", label: "set_clock_groups -asynchronous", kind: "regex", pattern: "set_clock_groups[\\s\\S]*-asynchronous" },
        { id: "drc", label: "set_max_transition (0.15ns)", kind: "regex", pattern: "set_max_transition.*0\\.15" },
        { id: "load", label: "set_load (0.04pF)", kind: "regex", pattern: "set_load.*0\\.04" },
      ],
      solution: `# Multi-Rate SDC Constraints: multi_clock.sdc
create_clock -name clk_sys  -period 2.0  [get_ports clk]
create_clock -name clk_uart -period 20.0 [get_ports pclk]

set_clock_groups -asynchronous \\
  -group [get_clocks clk_sys] \\
  -group [get_clocks clk_uart]

set_max_transition 0.15 [current_design]
set_load 0.04 [all_outputs]
`,
    }
  ),

  quiz("sdc", "standard", "sdc-standard-quiz", "SDC — Standard DRC & Clock Groups Quiz", [
    { id: "sd_s1", prompt: "Why is set_clock_groups -asynchronous preferred over set_false_path -from [get_clocks A] -to [get_clocks B]?", choices: ["set_clock_groups cuts paths bidirectionally (A->B and B->A) and explicitly documents clock architecture intent", "set_false_path is deprecated", "set_clock_groups speeds up simulation", "set_clock_groups replaces UPF"], answer: 0, explain: "set_clock_groups is cleaner, bidirectional, and prevents human errors when writing multiple set_false_path pairs." },
    { id: "sd_s2", prompt: "A set_max_transition constraint of 0.15ns forces the synthesis / P&R tool to:", choices: ["Insert repeater buffers on long high-capacitance wires to speed up signal slew", "Delete registers", "Increase clock frequency", "Ignore hold time"], answer: 0, explain: "Max transition violations are repaired by inserting buffers or sizing up driving gates." },
    { id: "sd_s3", prompt: "Logically exclusive clocks (e.g. mission clock vs test clock via a multiplexer) should be constrained with:", choices: ["set_clock_groups -logically_exclusive", "set_false_path -from * -to *", "create_clock without -add", "set_max_delay 0"], answer: 0, explain: "set_clock_groups -logically_exclusive tells STA that only one clock can be active at a time through the multiplexer." },
  ]),

  theory("sdc", "expert", "sdc-expert-source-sync", "Expert: Dual Data Rate (DDR) & Source-Synchronous Interface Timing", 18,
    "Constraining rising and falling clock edge data transfers with -clock_fall and -add_delay.",
    [
      "Source-Synchronous PHY Architecture: In high-speed interfaces (DDR3/4, QSPI, RGMII), the transmitting chip forwards both the clock and data signals together to minimize board-level skew.",
      "Dual Data Rate (DDR) Constraints: In DDR, data is transferred on BOTH the rising and falling edges of the clock. This requires specifying two sets of `set_input_delay` constraints: one for the rising edge and one for the falling edge using `-clock_fall -add_delay`!",
      "Why -add_delay is Mandatory: Without `-add_delay`, the second `set_input_delay` command overwrites the first one, leaving one half of the clock cycle completely unconstrained!",
    ]),

  theory("sdc", "expert", "sdc-expert-case-analysis", "Expert: Mode Selection, Case Analysis & Disable Timing Arcs", 16,
    "Freezing static operational modes and disabling false feedback loops with set_case_analysis.",
    [
      "Mode Control with set_case_analysis: Chips contain mode control pins (e.g. `test_mode`, `scan_enable`, `bypass_pll`). `set_case_analysis 0 [get_pins u_ctrl/test_mode]` forces the STA engine to evaluate timing with that pin tied to a constant logic 0.",
      "Disabling False Internal Timing Arcs: In custom RAMs or bidirectional I/O buffers, certain internal transistor paths (e.g. from input to output of a pass-gate) are non-functional. `set_disable_timing -from A -to Y [get_cells u_cell]` breaks the false timing arc.",
      "Post-CTS Propagated Clocks: Prior to Clock Tree Synthesis, clocks are ideal with estimated latency. Post-CTS, `set_propagated_clock [all_clocks]` instructs STA to calculate actual clock latency by tracing down the synthesized clock tree buffers!",
    ]),

  practical(
    "sdc",
    "expert",
    "sdc-expert-practical",
    "Expert Practical: Dual Data Rate (DDR) PHY SDC Script",
    25,
    "Write a complete DDR SDC script constraining both rising and falling edges with -add_delay.",
    [
      "Create DDR clock `ddr_clk` with period 2.0ns (500 MHz, 1 Gbps data rate).",
      "Apply rising-edge input delays: max 0.45ns, min 0.10ns on `[get_ports ddr_dq]`.",
      "Apply falling-edge input delays with `-clock_fall -add_delay`: max 0.45ns, min 0.10ns on `[get_ports ddr_dq]`.",
    ],
    {
      language: "tcl",
      starter: `# DDR PHY Timing Constraints: ddr_interface.sdc

# TODO: Step 1 - create_clock for ddr_clk (2.0ns)
# TODO: Step 2 - set_input_delay (rising edge) max 0.45ns, min 0.10ns
# TODO: Step 3 - set_input_delay (falling edge with -clock_fall -add_delay)`,
      checks: [
        { id: "clk", label: "create_clock ddr_clk", kind: "regex", pattern: "create_clock.*ddr_clk.*2" },
        { id: "rise", label: "Rising edge set_input_delay", kind: "regex", pattern: "set_input_delay.*-max.*0\\.45" },
        { id: "fall", label: "Falling edge -clock_fall", kind: "includes", pattern: "-clock_fall" },
        { id: "add", label: "Mandatory -add_delay", kind: "includes", pattern: "-add_delay" },
      ],
      solution: `# DDR PHY Timing Constraints: ddr_interface.sdc
create_clock -name ddr_clk -period 2.0 [get_ports ddr_clk]

# Rising edge data launch
set_input_delay -max 0.45 -clock ddr_clk [get_ports ddr_dq]
set_input_delay -min 0.10 -clock ddr_clk [get_ports ddr_dq]

# Falling edge data launch (MUST use -clock_fall and -add_delay)
set_input_delay -max 0.45 -clock ddr_clk -clock_fall -add_delay [get_ports ddr_dq]
set_input_delay -min 0.10 -clock ddr_clk -clock_fall -add_delay [get_ports ddr_dq]
`,
    }
  ),

  quiz("sdc", "expert", "sdc-expert-quiz", "SDC — Expert DDR & Case Analysis Quiz", [
    { id: "sd_e1", prompt: "When constraining a Dual Data Rate (DDR) input bus, why is -add_delay required on the falling edge constraint?", choices: ["Without -add_delay, the falling-edge constraint overwrites the rising-edge constraint, leaving half the cycle unconstrained", "-add_delay adds 1ns of delay to the wire", "-add_delay is required for all clock gates", "-add_delay is a DRC command"], answer: 0, explain: "Without -add_delay, subsequent set_input_delay commands replace previous ones on the same port." },
    { id: "sd_e2", prompt: "set_case_analysis is used in SDC primarily to:", choices: ["Force a static constant logic value (0 or 1) on a mode pin, configuring STA for a specific operational state", "Simulate random test vectors", "Change clock frequency", "Insert scan flops"], answer: 0, explain: "set_case_analysis freezes static control nets (e.g. test_mode=0) so only active operational paths are timed." },
    { id: "sd_e3", prompt: "After Clock Tree Synthesis (CTS) is completed, SDC must declare:", choices: ["set_propagated_clock [all_clocks]", "set_false_path on clock nets", "delete_clocks", "set_clock_latency 0"], answer: 0, explain: "set_propagated_clock instructs STA to compute real insertion delay through the clock buffer tree instead of using ideal estimates." },
  ]),

  theory("sdc", "master", "sdc-master-mmmc-matrix", "Master: Multi-Mode Multi-Corner (MMMC) Architecture & Analysis Views", 20,
    "Structuring signoff analysis views combining constraint modes, library sets, and RC corners.",
    [
      "The MMMC Paradigm: Modern SoCs cannot be signed off with a single SDC or single corner. An SoC operates in multiple Constraint Modes (`func`, `scan_shift`, `scan_capture`, `sleep`) across multiple PVT Library Corners (`ss_125c`, `ff_m40c`, `tt_25c`) and Parasitic RC Corners (`rc_worst`, `rc_best`, `typical`).",
      "Analysis Views: An Analysis View is the atomic signoff unit: `Analysis View = Constraint Mode (SDC) x Delay Corner (.lib + RC)`. For example, `view_func_slow` checks setup timing for mission mode under worst-case PVT.",
      "SDC Cleanliness & Linting: Prior to signoff, run `check_timing` to ensure: 1) Zero unconstrained endpoints, 2) Zero partially constrained I/O ports, 3) Zero unclocked sequential registers, and 4) No unauthorized wildcard false paths.",
    ]),

  practical(
    "sdc",
    "master",
    "sdc-master-practical",
    "Master Practical: Complete MMMC Analysis View Setup Script",
    25,
    "Write a production-grade Cadence/Synopsys MMMC definition script binding modes, libraries, and views.",
    [
      "Create constraint modes `mode_func` (`func.sdc`) and `mode_scan` (`scan.sdc`).",
      "Create library set `lib_slow` (`sky130_fd_sc_hd__ss_125C_1v62.lib`) and `lib_fast` (`sky130_fd_sc_hd__ff_m40C_1v98.lib`).",
      "Create analysis views `view_func_setup` and `view_func_hold`.",
      "Set active setup and hold analysis views (`set_analysis_view -setup ... -hold ...`).",
    ],
    {
      language: "tcl",
      starter: `# MMMC Signoff Definition: mmmc_setup.tcl

# TODO: Step 1 - create_constraint_mode for mode_func and mode_scan
# TODO: Step 2 - create_library_set for lib_slow and lib_fast
# TODO: Step 3 - create_delay_corner and create_analysis_view
# TODO: Step 4 - set_analysis_view for setup and hold`,
      checks: [
        { id: "m1", label: "create_constraint_mode mode_func", kind: "includes", pattern: "create_constraint_mode" },
        { id: "lib", label: "create_library_set", kind: "includes", pattern: "create_library_set" },
        { id: "view", label: "create_analysis_view", kind: "includes", pattern: "create_analysis_view" },
        { id: "act", label: "set_analysis_view -setup -hold", kind: "regex", pattern: "set_analysis_view.*-setup.*-hold" },
      ],
      solution: `# MMMC Signoff Definition: mmmc_setup.tcl
# 1. Constraint Modes
create_constraint_mode -name mode_func -sdc_files {constraints/func.sdc}
create_constraint_mode -name mode_scan -sdc_files {constraints/scan.sdc}

# 2. Library Sets & RC Corners
create_library_set -name lib_slow -timing {libs/sky130_fd_sc_hd__ss_125C_1v62.lib}
create_library_set -name lib_fast -timing {libs/sky130_fd_sc_hd__ff_m40C_1v98.lib}
create_rc_corner   -name rc_worst -tluplus {tluplus/rc_worst.tluplus}
create_rc_corner   -name rc_best  -tluplus {tluplus/c_best.tluplus}

# 3. Delay Corners
create_delay_corner -name dc_slow -library_set lib_slow -rc_corner rc_worst
create_delay_corner -name dc_fast -library_set lib_fast -rc_corner rc_best

# 4. Analysis Views
create_analysis_view -name view_func_setup -constraint_mode mode_func -delay_corner dc_slow
create_analysis_view -name view_func_hold  -constraint_mode mode_func -delay_corner dc_fast

# 5. Set Active Signoff Views
set_analysis_view -setup {view_func_setup} -hold {view_func_hold}
`,
    }
  ),

  quiz("sdc", "master", "sdc-master-quiz", "SDC & MMMC — Master Signoff Exam", [
    { id: "sd_m1", prompt: "In an MMMC environment, why must scan mode and functional mode be separate constraint modes?", choices: ["Scan mode uses different clock trees (e.g. slow 50 MHz test clock) and has scan-enable shift exceptions that would invalidate mission-mode functional timing", "Scan mode uses 0V power", "Functional mode disables all flip-flops", "Foundries do not support scan"], answer: 0, explain: "Constraint modes allow different SDC rules (e.g. scan shift vs functional mission) to be evaluated on the same physical netlist." },
    { id: "sd_m2", prompt: "An Analysis View in MMMC is formally defined as:", choices: ["The combination of a Constraint Mode (SDC) and a Delay Corner (Library .lib + Parasitic RC)", "A GDS layout screenshot", "A UPF power domain", "A Verilog testbench"], answer: 0, explain: "Analysis View = Constraint Mode (SDC) x Delay Corner (Liberty .lib + RC parasitics)." },
    { id: "sd_m3", prompt: "What is the primary danger of unconstrained endpoints reported by check_timing?", choices: ["The synthesis and P&R tools will not optimize or verify timing on those paths, potentially causing silent silicon failure", "The chip area increases by 10x", "The tool deletes the design", "It triggers DRC short circuits"], answer: 0, explain: "Unconstrained endpoints are completely invisible to STA; timing violations on them will not be reported or fixed." },
  ]),

  // ——— MMMC (Multi-Mode Multi-Corner Track) ———
  theory("mmmc", "beginner", "mmmc-beginner", "Beginner: Why More Than One View — Slow for Setup, Fast for Hold", 14,
    "The fundamental requirement of multi-corner signoff across process, voltage, and temperature extremes.",
    [
      "Why Single-Corner Timing Fails: Silicon chips do not operate at a single temperature or voltage. Variations during fabrication (doping, oxide thickness), power grid IR drops (VDD +/- 10%), and operating temperatures (-40C in automotive to +125C in data centers) cause transistor delays to vary by more than 3x!",
      "The Minimum 2-View Matrix: Setup timing (max delay) is signed off at the Slow-Slow (SS) corner with lowest supply voltage (1.62V) and maximum temperature (125C). Hold timing (min delay) is signed off at the Fast-Fast (FF) corner with highest voltage (1.98V) and sub-zero temperature (-40C).",
      "Analysis View = Mode x Corner: An Analysis View binds an operational SDC personality (Constraint Mode) with a characterized delay snapshot (Delay Corner).",
    ]),

  quiz("mmmc", "beginner", "mmmc-beginner-quiz", "MMMC — Beginner Fundamentals Quiz", [
    { id: "mm_b1", prompt: "Hold timing violations are most severe under which PVT corner condition?", choices: ["Fast-Fast (FF) process, highest voltage (e.g. 1.98V), lowest temperature (-40°C)", "Slow-Slow (SS) process, lowest voltage (1.62V)", "Typical (TT) at 25°C", "0V power down"], answer: 0, explain: "Transistors switch fastest at high voltage and low temperature, causing data to race through short combinational paths and contaminate capture registers." },
    { id: "mm_b2", prompt: "An Analysis View in MMMC is defined as:", choices: ["A pairing of one Constraint Mode (SDC) with one Delay Corner (Library + RC)", "A screenshot of the floorplan", "A Verilog module", "A UPF power domain"], answer: 0, explain: "Analysis View = Constraint Mode x Delay Corner." },
    { id: "mm_b3", prompt: "Why can a chip NOT be signed off using only the Typical (TT / 25°C) corner?", choices: ["Typical corner ignores fabrication process variations and thermal extremes, guaranteeing chips will fail in production", "TT corner is unsupported by EDA tools", "TT corner increases gate count", "TT corner disables clocks"], answer: 0, explain: "Silicon operates across wide PVT ranges; TT only models the center of the Gaussian distribution." },
  ]),

  theory("mmmc", "standard", "mmmc-standard-rc-corners", "Standard: Interconnect Parasitic RC Corners & Delay Corner Formulation", 18,
    "Modeling metal interconnect resistance and capacitance variations alongside standard cell timing.",
    [
      "Metal Interconnect Corners: Transistor speed is only half the equation; metal interconnect parasitics also vary: C_worst (Max Capacitance): Thick metal layers, narrow dielectric spacing (slows short capacitive nets); R_worst (Max Resistance): Thin metal layers, high resistivity (slows long RC buses); RC_worst / RC_best: Combined resistance and capacitance signoff extremes.",
      "Delay Corner Formulation: create_delay_corner -name dc_slow_max -library_set lib_ss -rc_corner rc_worst combines the slowest standard cell models with the worst interconnect parasitics to model maximum signal delay.",
      "Temperature Inversion Effect: In advanced nodes (<40nm FinFET), cells at lower supply voltages (<0.8V) can actually be slower at -40C than at +125C because carrier mobility gains are outweighed by threshold voltage increases!",
    ]),

  practical(
    "mmmc",
    "standard",
    "mmmc-standard-practical",
    "Standard Practical: 4-Delay-Corner Formulation Script",
    25,
    "Write a Cadence Innovus / Tempus MMMC script defining 4 delay corners combining PVT libraries and RC extraction models.",
    [
      "Create library sets `lib_ss` (`sky130_ss.lib`) and `lib_ff` (`sky130_ff.lib`).",
      "Create RC corners `rc_worst` (`rc_worst.tluplus`) and `rc_best` (`rc_best.tluplus`).",
      "Create 2 delay corners: `dc_setup_slow` (`lib_ss` + `rc_worst`) and `dc_hold_fast` (`lib_ff` + `rc_best`).",
      "Bind them into active setup and hold analysis views for `mode_func`.",
    ],
    {
      language: "tcl",
      starter: `# Standard MMMC Delay Corner Setup: mmmc_delay_corners.tcl

# TODO: Step 1 - create_library_set for lib_ss and lib_ff
# TODO: Step 2 - create_rc_corner for rc_worst and rc_best
# TODO: Step 3 - create_delay_corner for dc_setup_slow and dc_hold_fast
# TODO: Step 4 - create_analysis_view and set_analysis_view`,
      checks: [
        { id: "ls", label: "create_library_set lib_ss and lib_ff", kind: "includes", pattern: "create_library_set" },
        { id: "rc", label: "create_rc_corner rc_worst and rc_best", kind: "includes", pattern: "create_rc_corner" },
        { id: "dc", label: "create_delay_corner dc_setup_slow", kind: "includes", pattern: "create_delay_corner" },
        { id: "av", label: "create_analysis_view view_setup", kind: "includes", pattern: "create_analysis_view" },
        { id: "set", label: "set_analysis_view -setup -hold", kind: "regex", pattern: "set_analysis_view.*-setup.*-hold" },
      ],
      solution: `# Standard MMMC Delay Corner Setup: mmmc_delay_corners.tcl
# 1. Standard Cell Library Sets
create_library_set -name lib_ss -timing {libs/sky130_fd_sc_hd__ss_125C_1v62.lib}
create_library_set -name lib_ff -timing {libs/sky130_fd_sc_hd__ff_m40C_1v98.lib}

# 2. Interconnect RC Corners
create_rc_corner -name rc_worst -tluplus {tluplus/rc_worst.tluplus}
create_rc_corner -name rc_best  -tluplus {tluplus/c_best.tluplus}

# 3. Delay Corners
create_delay_corner -name dc_setup_slow -library_set lib_ss -rc_corner rc_worst
create_delay_corner -name dc_hold_fast  -library_set lib_ff -rc_corner rc_best

# 4. Analysis Views
create_constraint_mode -name mode_func -sdc_files {constraints/func.sdc}
create_analysis_view -name view_setup -constraint_mode mode_func -delay_corner dc_setup_slow
create_analysis_view -name view_hold  -constraint_mode mode_func -delay_corner dc_hold_fast

# 5. Set Active Signoff Views
set_analysis_view -setup {view_setup} -hold {view_hold}
`,
    }
  ),

  quiz("mmmc", "standard", "mmmc-standard-quiz", "MMMC — Standard Parasitics & Temperature Inversion Quiz", [
    { id: "mm_s1", prompt: "The Temperature Inversion phenomenon in advanced sub-40nm nodes causes:", choices: ["Standard cells at low voltages to become slower at cold temperatures (-40°C) than at high temperatures (+125°C)", "Wires to melt at room temperature", "Hold timing to become impossible", "Clock gating to fail"], answer: 0, explain: "At low voltages, threshold voltage shifts dominate over carrier mobility, making cold temperature the slowest delay corner." },
    { id: "mm_s2", prompt: "Why is C_worst (Max Capacitance) critical for short interconnect nets?", choices: ["High wire capacitance increases RC charging delay and dynamic short-circuit power", "It eliminates resistance", "It disables scan chains", "It replaces SDC"], answer: 0, explain: "C_worst models maximum sidewall dielectric coupling capacitance on dense routing layers." },
    { id: "mm_s3", prompt: "A Delay Corner combines which two foundational models?", choices: ["Standard cell timing library (.lib) and Interconnect parasitic extraction rules (TLUplus / QRC)", "Verilog RTL and testbench", "GDS layout and DEF floorplan", "UPF power file and SDC"], answer: 0, explain: "Delay Corner = Library Set (.lib) + RC Corner (TLUplus / TechFile)." },
  ]),

  theory("mmmc", "expert", "mmmc-expert-ocv-derates", "Expert: On-Chip Variation (OCV, AOCV, POCV) & Common Path Pessimism Removal (CPPR)", 18,
    "Eliminating artificial clock pessimism and modeling statistical Gaussian process variations.",
    [
      "Evolution of Variation Modeling: Flat OCV: Applies a uniform derate factor (e.g. +8% late, -5% early) across all gates in the chip; Advanced OCV (AOCV): Derates scale as a function of logic depth and physical bounding-box distance; Parametric OCV (POCV / LVF): Statistical variation modeled as normal Gaussian distribution (mean +/- 3*sigma).",
      "Common Path Pessimism Removal (CPPR / CRPR): In any sequential path, the clock root up to the divergence point is a single physical wire. In STA, applying late derate to the launch clock and early derate to the capture clock creates artificial delay differences on the shared wire! CPPR calculates this difference and credits it back to slack!",
      "Scan Shift vs At-Speed Capture: DFT requires dedicated constraint modes: mode_scan_shift (slow 50 MHz clock, loose setup, strict hold) and mode_scan_capture (fast 500 MHz pulse for at-speed transition testing).",
    ]),

  practical(
    "mmmc",
    "expert",
    "mmmc-expert-practical",
    "Expert Practical: Multi-Mode DFT Scan & Mission Mode MMMC Script",
    25,
    "Write an advanced MMMC script supporting Functional Mode and DFT Scan Mode with CPPR enabled.",
    [
      "Define constraint modes `mode_func` (`func.sdc`) and `mode_scan` (`scan.sdc`).",
      "Create delay corners for slow setup (`dc_slow`), fast hold (`dc_fast`), and cold delay (`dc_cold`).",
      "Define 3 active analysis views: `view_func_setup`, `view_func_hold`, and `view_scan_shift`.",
      "Enable CPPR (`set_app_var timing_remove_clock_reconvergence_pessimism true`).",
    ],
    {
      language: "tcl",
      starter: `# Advanced Multi-Mode MMMC Script: mmmc_advanced_flow.tcl

# TODO: Step 1 - Create constraint modes (mode_func, mode_scan)
# TODO: Step 2 - Create delay corners (dc_slow, dc_fast, dc_cold)
# TODO: Step 3 - Create analysis views and enable CPPR
# TODO: Step 4 - set_analysis_view for setup and hold`,
      checks: [
        { id: "cm", label: "create_constraint_mode mode_func and mode_scan", kind: "includes", pattern: "create_constraint_mode" },
        { id: "dc", label: "create_delay_corner dc_slow and dc_fast", kind: "includes", pattern: "create_delay_corner" },
        { id: "av", label: "create_analysis_view for scan and func", kind: "includes", pattern: "create_analysis_view" },
        { id: "act", label: "set_analysis_view setup and hold", kind: "regex", pattern: "set_analysis_view.*-setup.*-hold" },
      ],
      solution: `# Advanced Multi-Mode MMMC Script: mmmc_advanced_flow.tcl
# 1. Constraint Modes
create_constraint_mode -name mode_func -sdc_files {constraints/func.sdc}
create_constraint_mode -name mode_scan -sdc_files {constraints/scan.sdc}

# 2. Library Sets & RC Corners
create_library_set -name lib_ss -timing {libs/sky130_fd_sc_hd__ss_125C_1v62.lib}
create_library_set -name lib_ff -timing {libs/sky130_fd_sc_hd__ff_m40C_1v98.lib}
create_rc_corner   -name rc_worst -tluplus {tluplus/rc_worst.tluplus}
create_rc_corner   -name rc_best  -tluplus {tluplus/c_best.tluplus}

# 3. Delay Corners
create_delay_corner -name dc_slow -library_set lib_ss -rc_corner rc_worst
create_delay_corner -name dc_fast -library_set lib_ff -rc_corner rc_best

# 4. Analysis Views
create_analysis_view -name view_func_setup -constraint_mode mode_func -delay_corner dc_slow
create_analysis_view -name view_func_hold  -constraint_mode mode_func -delay_corner dc_fast
create_analysis_view -name view_scan_shift -constraint_mode mode_scan -delay_corner dc_fast

# 5. Set Active Signoff Views
set_analysis_view -setup {view_func_setup} -hold {view_func_hold view_scan_shift}
`,
    }
  ),

  quiz("mmmc", "expert", "mmmc-expert-quiz", "MMMC — Expert OCV, CPPR & Scan Views Quiz", [
    { id: "mm_e1", prompt: "Common Path Pessimism Removal (CPPR / CRPR) is required in STA because:", choices: ["A single physical clock buffer cannot simultaneously be slow for launch and fast for capture during the exact same clock pulse", "It speeds up synthesis runtimes", "It replaces clock buffers with inverters", "It is required for UPF power gating"], answer: 0, explain: "CPPR removes artificial delay differences on shared clock tree branches that arise from early/late derating." },
    { id: "mm_e2", prompt: "How does Advanced OCV (AOCV) improve timing closure over Flat OCV?", choices: ["AOCV derates decrease as logic path depth increases, capturing statistical averaging of random variation across deep gate chains", "AOCV eliminates all clock skew", "AOCV uses 0V transistors", "AOCV bypasses hold checks"], answer: 0, explain: "In deeper logic paths, random variations cancel out, allowing tighter and less pessimistic derating." },
    { id: "mm_e3", prompt: "Why must Scan Shift mode be timed with Fast Delay Corners for hold?", choices: ["Scan chain shift registers have zero combinational logic between flops (Q -> SI), making them extremely vulnerable to fast-corner hold violations", "Scan shift runs at 5 GHz", "Scan flops do not have setup times", "Scan mode deletes clock trees"], answer: 0, explain: "Without logic between shift flops, fast clock skew will corrupt scan test patterns unless hold is verified at the fastest corner." },
  ]),

  theory("mmmc", "master", "mmmc-master-signoff", "Master: The 16-View Master Signoff Matrix & Configuration of Record", 20,
    "Freezing the multi-voltage, multi-mode, multi-corner signoff configuration of record for tapeout.",
    [
      "The Master 16-View Signoff Matrix: High-end complex SoCs utilize 8 to 16 views covering: 1) Mission Functional Setup & Hold, 2) Turbo Overdrive Mode (1.05V), 3) Low-Power Battery Saver Mode (0.75V), 4) Scan Shift Hold, 5) At-Speed Capture Setup, 6) Memory BIST, and 7) Worst-Case Standby Leakage (125C / FF / 1.98V).",
      "Configuration of Record (CoR): Netlist (top.v) + SDC Constraint Set + MMMC Definition (mmmc.tcl) + UPF Power Intent (power.upf) + Extracted Parasitics (top.spef) form the legal tapeout contract. Any change to a single view requires a full regression of all 16 views!",
      "Signoff Review Checklist: 1) WNS >= 0 and WHS >= 0 on all views, 2) Zero unconstrained endpoints in check_timing, 3) Max transition and max capacitance DRC clean, 4) All waivers signed by IP owners.",
    ]),

  practical(
    "mmmc",
    "master",
    "mmmc-master-practical",
    "Master Practical: Complete 8-View Signoff MMMC Matrix Script",
    30,
    "Implement a complete, production-grade 8-view MMMC signoff script covering Functional, Turbo, and Scan modes.",
    [
      "Define 3 constraint modes: `mode_func`, `mode_turbo`, `mode_scan`.",
      "Define 4 delay corners: `dc_ss_125c`, `dc_ss_cold`, `dc_ff_fast`, `dc_ff_hot_leakage`.",
      "Create and bind 8 analysis views covering setup, hold, turbo, and scan shift.",
      "Set active signoff views (`set_analysis_view -setup {...} -hold {...}`).",
    ],
    {
      language: "tcl",
      starter: `# Master 8-View Signoff MMMC Script: mmmc_master_signoff.tcl

# TODO: Step 1 - Define 3 constraint modes (func, turbo, scan)
# TODO: Step 2 - Define 4 library sets and delay corners
# TODO: Step 3 - Create 8 analysis views
# TODO: Step 4 - Set active signoff setup and hold views`,
      checks: [
        { id: "cm", label: "3 constraint modes", kind: "regex", pattern: "mode_func[\\s\\S]*mode_turbo[\\s\\S]*mode_scan" },
        { id: "dc", label: "4 delay corners", kind: "regex", pattern: "create_delay_corner[\\s\\S]*create_delay_corner" },
        { id: "av", label: "create_analysis_view", kind: "includes", pattern: "create_analysis_view" },
        { id: "act", label: "set_analysis_view setup and hold", kind: "regex", pattern: "set_analysis_view.*-setup.*-hold" },
      ],
      solution: `# Master 8-View Signoff MMMC Script: mmmc_master_signoff.tcl
# 1. Constraint Modes (SDC Personalities)
create_constraint_mode -name mode_func  -sdc_files {constraints/func_mission.sdc}
create_constraint_mode -name mode_turbo -sdc_files {constraints/func_turbo.sdc}
create_constraint_mode -name mode_scan  -sdc_files {constraints/dft_scan.sdc}

# 2. Library Sets & Parasitic RC Corners
create_library_set -name lib_ss_slow -timing {libs/sky130_fd_sc_hd__ss_125C_1v62.lib}
create_library_set -name lib_ss_cold -timing {libs/sky130_fd_sc_hd__ss_m40C_1v62.lib}
create_library_set -name lib_ff_fast -timing {libs/sky130_fd_sc_hd__ff_m40C_1v98.lib}
create_library_set -name lib_ff_leak -timing {libs/sky130_fd_sc_hdll__ff_125C_1v98.lib}

create_rc_corner -name rc_worst -tluplus {tluplus/rc_worst.tluplus}
create_rc_corner -name rc_best  -tluplus {tluplus/c_best.tluplus}

# 3. Delay Corners
create_delay_corner -name dc_ss_125c -library_set lib_ss_slow -rc_corner rc_worst
create_delay_corner -name dc_ss_cold -library_set lib_ss_cold -rc_corner rc_worst
create_delay_corner -name dc_ff_fast -library_set lib_ff_fast -rc_corner rc_best
create_delay_corner -name dc_ff_leak -library_set lib_ff_leak -rc_corner rc_worst

# 4. Analysis Views (Mode x Delay Corner)
create_analysis_view -name view_func_setup_slow -constraint_mode mode_func  -delay_corner dc_ss_125c
create_analysis_view -name view_func_setup_cold -constraint_mode mode_func  -delay_corner dc_ss_cold
create_analysis_view -name view_func_hold_fast  -constraint_mode mode_func  -delay_corner dc_ff_fast
create_analysis_view -name view_turbo_setup     -constraint_mode mode_turbo -delay_corner dc_ss_125c
create_analysis_view -name view_turbo_hold      -constraint_mode mode_turbo -delay_corner dc_ff_fast
create_analysis_view -name view_scan_shift_hold -constraint_mode mode_scan  -delay_corner dc_ff_fast
create_analysis_view -name view_scan_capture    -constraint_mode mode_scan  -delay_corner dc_ss_125c

# 5. Set Active Signoff Views for Tapeout
set_analysis_view \\
  -setup {view_func_setup_slow view_func_setup_cold view_turbo_setup view_scan_capture} \\
  -hold  {view_func_hold_fast view_turbo_hold view_scan_shift_hold}
`,
    }
  ),

  quiz("mmmc", "master", "mmmc-master-quiz", "MMMC — Master Signoff & Tapeout Certification Exam", [
    { id: "mm_m1", prompt: "Why is worst-case static leakage power signed off at FF / 1.98V / 125°C instead of SS / 125°C?", choices: ["Sub-threshold leakage and gate tunneling currents exponentially increase with higher supply voltage and fast-switching transistor thresholds", "FF corner uses 0V", "SS corner has higher capacitance", "Foundries only provide leakage tables for FF"], answer: 0, explain: "Leakage is highest when transistors have lowest threshold voltages (FF), highest supply voltage (1.98V), and hottest junction temperatures (125°C)." },
    { id: "mm_m2", prompt: "The 'Configuration of Record' (CoR) for tapeout signoff includes:", choices: ["The frozen set of Netlist + SDC files + MMMC definition + UPF power intent + Extracted SPEF parasitics", "Only the final GDS layout file", "Only the RTL repository commit hash", "The project README"], answer: 0, explain: "Tapeout signoff requires an immutable, version-controlled set of netlist, constraints, views, power, and parasitics." },
    { id: "mm_m3", prompt: "If a timing violation appears in only 1 of 16 signoff analysis views, can the chip tape out?", choices: ["No, all required signoff views must meet timing (WNS >= 0, WHS >= 0) or have an approved waiver signed by engineering leads", "Yes, as long as the typical view passes", "Yes, if the designer adds a false path", "Yes, by deleting that view"], answer: 0, explain: "Every signoff view models real physical operational extremes; a single failing view can cause catastrophic field failures." },
  ]),

  // ——— STA (Static Timing Analysis Track - 4 Layers) ———
  theory("sta", "beginner", "sta-beginner-setup-hold", "Beginner: Fundamental Setup & Hold Timing Equations", 18,
    "The core physics of sequential timing slack, clock skew, and path classification.",
    [
      "The Setup Check Equation: Data launched by register 1 on clock edge 0 must arrive at register 2 before clock edge 1 minus library setup time: T_c2q + T_comb + T_net <= T_clk + T_skew - T_setup - T_uncertainty. Setup is a maximum delay constraint checked at the highest frequency and slowest PVT corner.",
      "The Hold Check Equation: Data launched by register 1 must not change so quickly that it overwrites previous data before the capturing register holds it: T_c2q + T_comb_min + T_net_min >= T_skew + T_hold + T_uncertainty. Hold is a minimum delay constraint independent of clock period, checked at the fastest PVT corner.",
      "The 4 Path Groups: 1) reg2reg (Internal sequential pipeline paths), 2) in2reg (Input ports to first flop), 3) reg2out (Final flop to output ports), 4) in2out (Pure feedthrough combinational paths).",
    ]),

  quiz("sta", "beginner", "sta-beginner-quiz", "STA — Beginner Equations & Slack Quiz", [
    { id: "sta_b1", prompt: "If a circuit has a negative setup slack (WNS = -0.25ns), which action will fix the violation?", choices: ["Decreasing clock frequency (increasing period) or sizing up combinational logic gates to reduce propagation delay", "Increasing clock uncertainty", "Increasing hold time", "Adding false paths blindly"], answer: 0, explain: "Setup slack is proportional to clock period; reducing data path delay or increasing period will close setup timing." },
    { id: "sta_b2", prompt: "Why is hold time independent of clock period (T_clk)?", choices: ["Hold checks data stability against the *same* clock edge (or immediate next edge in same cycle), checking minimum flight time", "Hold only applies to asynchronous circuits", "Hold is calculated in simulation only", "Hold is an SDC command"], answer: 0, explain: "Hold verifies that fast data does not contaminate the capture flip-flop during the active clock edge." },
    { id: "sta_b3", prompt: "Positive clock skew (Capture clock arrives later than Launch clock):", choices: ["Helps Setup timing but hurts Hold timing", "Hurts Setup timing and helps Hold timing", "Hurts both Setup and Hold", "Has zero effect on timing"], answer: 0, explain: "Positive skew gives data extra time to arrive for setup, but leaves less margin before the next data wave overwrites it for hold." },
  ]),

  theory("sta", "standard", "sta-standard-crosstalk-si", "Standard: Signal Integrity (SI) & Crosstalk Delta-Delay", 18,
    "Modeling inter-wire coupling capacitance, Miller factor speedup/slowdown, and noise glitches.",
    [
      "Signal Integrity (SI) in Deep Submicron: In sub-40nm nodes, wire aspect ratios are tall and thin, causing lateral coupling capacitance (C_c) between adjacent parallel wires to exceed ground capacitance (C_gnd > 65% of total net capacitance).",
      "Crosstalk Delta Delay (Delta-t): 1) Anti-Phase (Opposite Direction): Aggressor switches 0->1 while victim switches 1->0. Effective voltage across C_c is 2 * VDD (Miller effect), doubling coupling capacitance and causing Slowdown (setup hazard); 2) In-Phase (Same Direction): Both switch in the same direction simultaneously. Effective C_c is 0, causing Speedup (hold hazard).",
      "Noise Glitch Hazard: When a victim net is statically held at logic 0 and neighboring aggressors switch, injected charge creates a voltage bump. If glitch peak exceeds V_IL_max, it can trigger false sequential clocking or state corruption.",
    ]),

  theory("sta", "standard", "sta-standard-path-groups", "Standard: Path Groups, Timing Arcs & Unateness", 16,
    "Classifying timing bottlenecks and analyzing positive, negative, and non-unate cell arcs.",
    [
      "Path Group Cost Function: STA engines optimize slack independently per path group (reg2reg, in2reg, reg2out, default). Creating dedicated path groups (group_path -name critical_alu -from [get_cells u_alu/*] -weight 5.0) focuses optimizer effort on design bottlenecks.",
      "Timing Arc Unateness: 1) Positive Unate (AND/OR buffer): Rising input causes rising output; 2) Negative Unate (NAND/NOR/INV): Rising input causes falling output; 3) Non-Unate (XOR/XNOR): Output direction depends on the static state of other input pins, requiring STA to analyze both rise and fall transitions for every path.",
    ]),

  practical(
    "sta",
    "standard",
    "sta-standard-practical",
    "Standard Practical: OpenSTA / PrimeTime Path Grouping & SI Script",
    25,
    "Write an STA automation script creating custom path groups, enabling SI crosstalk analysis, and reporting top critical violators.",
    [
      "Enable Signal Integrity crosstalk analysis (`set_app_var si_enable_analysis true`).",
      "Create high-priority path group `crit_datapath` for arithmetic ALU registers (`group_path -name crit_datapath -from [get_cells u_alu/*] -weight 3.0`).",
      "Generate detailed SI-aware timing report with crosstalk delta delay (`report_timing -crosstalk_delta -path_type full_clock_expanded`).",
    ],
    {
      language: "tcl",
      starter: `# STA Path Group & SI Script: sta_analysis.tcl

# TODO: Step 1 - Enable SI analysis (si_enable_analysis)
# TODO: Step 2 - Create path group crit_datapath with weight 3.0
# TODO: Step 3 - Generate report_timing with -crosstalk_delta`,
      checks: [
        { id: "si", label: "si_enable_analysis true", kind: "regex", pattern: "si_enable_analysis\\s+true" },
        { id: "grp", label: "group_path crit_datapath", kind: "regex", pattern: "group_path.*-name\\s+crit_datapath" },
        { id: "rep", label: "report_timing -crosstalk_delta", kind: "includes", pattern: "-crosstalk_delta" },
      ],
      solution: `# STA Path Group & SI Script: sta_analysis.tcl
# 1. Enable PrimeTime-SI Crosstalk Engine
set_app_var si_enable_analysis true
set_app_var si_xtalk_composite_aggressor_mode true

# 2. Configure Dedicated Critical Path Groups
group_path -name crit_datapath -from [get_cells u_alu/*] -weight 3.0
group_path -name async_reg     -from [get_cells *sync*]  -weight 1.0

# 3. Generate SI-Aware Critical Timing Report
report_timing -path_group crit_datapath -crosstalk_delta -max_paths 10 -path_type full_clock_expanded > sta_si_critical.rpt
report_noise -all_violators > noise_glitch.rpt
`,
    }
  ),

  quiz("sta", "standard", "sta-standard-quiz", "STA — Standard SI & Path Groups Quiz", [
    { id: "sta_s1", prompt: "Anti-phase crosstalk (aggressor and victim switching in opposite directions) causes:", choices: ["Increased effective coupling capacitance (Miller factor ~2x) resulting in data path slowdown and setup violations", "Data path speedup", "Hold violations", "Zero change in delay"], answer: 0, explain: "The voltage differential across the coupling capacitor is doubled (from 0 to 2*VDD), doubling charge transfer time." },
    { id: "sta_s2", prompt: "An XOR gate timing arc is classified as 'Non-Unate' because:", choices: ["The output transition polarity (rising or falling) depends on the logic state of the other input pin", "It consumes zero power", "It has no propagation delay", "It is only used in clock trees"], answer: 0, explain: "For XOR, if input B=0, A->Y is positive unate; if input B=1, A->Y is negative unate." },
    { id: "sta_s3", prompt: "Why do STA engineers create custom Path Groups in synthesis and STA?", choices: ["To prevent severe timing violations in one block from masking optimizations in other blocks during cost-function optimization", "To rename standard cells", "To disable clock gates", "To replace SDC constraints"], answer: 0, explain: "Path grouping ensures the tool optimizes the worst path in *each* group rather than only focusing on the single global worst path." },
  ]),

  theory("sta", "expert", "sta-expert-ocv", "Expert: On-Chip Variation (OCV, AOCV, POCV) & CPPR", 18,
    "Statistical delay modeling, depth-based derating, and Common Path Pessimism Removal.",
    [
      "On-Chip Variation Modeling: Flat OCV applies uniform derates (+8% late / -5% early); AOCV decreases derates on deeper logic paths due to statistical averaging; POCV / LVF models delay as Gaussian distributions (mean +/- 3*sigma).",
      "Common Path Pessimism Removal (CPPR / CRPR): In any sequential path, the clock tree root up to the divergence point is a single physical wire. Applying late derate to launch and early derate to capture creates false clock skew on the shared wire. CPPR credits this delay back to slack!",
      "Useful Skew Scheduling: Intentionally adjusting clock buffer delays on capture flops to borrow cycle time from succeeding positive-slack pipeline stages to close critical setup paths without changing frequency.",
    ]),

  theory("sta", "expert", "sta-expert-useful-skew", "Expert: Clock Tree Scheduling & Useful Skew Budgeting", 16,
    "Borrowing timing slack across adjacent pipeline stages via intentional clock skew tuning.",
    [
      "The Principle of Useful Skew: When Stage 1 has negative setup slack (-150 ps) while Stage 2 has large positive slack (+400 ps), delaying the clock arrival at Stage 1's capture flop by +150 ps borrows time from Stage 2, closing timing across both stages!",
      "Useful Skew vs Hold Hazards: Borrowing clock latency to fix setup at Stage 1 reduces hold margin at Stage 1 and reduces setup margin at Stage 2. STA must verify that hold slack remains >= 0 at all process corners.",
    ]),

  practical(
    "sta",
    "expert",
    "sta-expert-practical",
    "Expert Practical: Automated Gate Sizing & Useful Skew ECO Script",
    25,
    "Write a PrimeTime / OpenSTA timing closure script performing automated gate sizing and useful skew adjustments.",
    [
      "Enable CPPR (`set_app_var timing_remove_clock_reconvergence_pessimism true`).",
      "Size up critical path driver `u_alu_add/U12` from `sky130_fd_sc_hd__inv_1` to `sky130_fd_sc_hd__inv_4` (`size_cell u_alu_add/U12 sky130_fd_sc_hd__inv_4`).",
      "Insert hold buffer `sky130_fd_sc_hd__buf_2` on fast net `u_fast_data` (`insert_buffer u_fast_data sky130_fd_sc_hd__buf_2`).",
    ],
    {
      language: "tcl",
      starter: `# Timing Closure ECO Script: sta_eco.tcl

# TODO: Step 1 - Enable CPPR (timing_remove_clock_reconvergence_pessimism)
# TODO: Step 2 - Size up cell u_alu_add/U12 to sky130_fd_sc_hd__inv_4
# TODO: Step 3 - Insert buffer sky130_fd_sc_hd__buf_2 on u_fast_data`,
      checks: [
        { id: "cppr", label: "Enable CPPR", kind: "regex", pattern: "timing_remove_clock_reconvergence_pessimism\\s+true" },
        { id: "size", label: "size_cell to inv_4", kind: "regex", pattern: "size_cell.*u_alu_add/U12.*inv_4" },
        { id: "buf", label: "insert_buffer buf_2", kind: "regex", pattern: "insert_buffer.*u_fast_data.*buf_2" },
      ],
      solution: `# Timing Closure ECO Script: sta_eco.tcl
# 1. Enable Common Path Pessimism Removal
set_app_var timing_remove_clock_reconvergence_pessimism true

# 2. Setup Fix: Size up high-fanout critical inverter
size_cell u_alu_add/U12 sky130_fd_sc_hd__inv_4

# 3. Hold Fix: Insert buffer on fast short-path net
insert_buffer u_fast_data sky130_fd_sc_hd__buf_2

# 4. Re-evaluate Timing Slack
report_timing -max_paths 5 -slack_lesser_than 0.0 > eco_verified.rpt
`,
    }
  ),

  quiz("sta", "expert", "sta-expert-quiz", "STA — Expert OCV, CPPR & Useful Skew Quiz", [
    { id: "sta_e1", prompt: "Common Path Pessimism Removal (CPPR) increases reported timing slack by:", choices: ["Removing artificial delay differences on shared clock tree branches caused by simultaneous early and late derating", "Overclocking the launch flop", "Deleting the capture clock buffer", "Disabling hold checks"], answer: 0, explain: "A physical buffer on a shared clock path can only have one delay during a clock cycle; CPPR removes the mathematical derate discrepancy." },
    { id: "sta_e2", prompt: "Useful skew is a timing optimization technique that:", choices: ["Delays the clock arrival at a capture flip-flop to borrow time from a downstream pipeline stage with positive slack", "Inserts random inverters into data nets", "Forces all clock nets to 0 delay", "Replaces DFFs with latches"], answer: 0, explain: "Useful skew redistributes clock arrival times across registers to balance stage delays and close setup violations." },
    { id: "sta_e3", prompt: "Why does AOCV (Advanced OCV) produce less pessimistic slack on deep logic paths compared to Flat OCV?", choices: ["In long gate chains, random manufacturing variations cancel each other out statistically (some gates faster, some slower)", "AOCV ignores wire delay", "AOCV disables hold time", "AOCV is only run at room temperature"], answer: 0, explain: "Statistical averaging across deep logic depths reduces the standard deviation of total path delay." },
  ]),

  theory("sta", "master", "sta-master-signoff", "Master: Full-Chip STA Signoff Criteria & Waiver Methodology", 20,
    "The rigorous signoff checklist: WNS/TNS/WHS/THS, DRC clean, SDC linting, and waiver audit trails.",
    [
      `## Signoff bar (every MMMC view)

- Setup WNS ≥ 0.00 ns
- Hold WHS ≥ 0.00 ns
- Max transition / max cap = 0
- \`check_timing\` unconstrained endpoints = 0

COMPARE How you ask the tool
Check | Synopsys PrimeTime | Cadence Tempus | OpenSTA
---
Update | \`update_timing\` | \`update_timing -full\` | implicit in report
WNS | \`report_qor\` / \`report_timing\` | \`report_timing -late\` | \`report_checks -path_delay max\`
Hold | \`report_timing -delay min\` | \`report_timing -early\` | \`report_checks -path_delay min\`
Lint SDC | \`check_timing\` | \`check_timing\` | \`check_setup\`
SI | \`si_enable_analysis true\` | \`-siAware true\` | limited
ENDCOMPARE

## Waivers

1. Owner name
2. Protocol / math justification
3. Sim waveform
4. Expiry milestone

WARN: Never \`set_false_path -from [all_registers]\` as a "waiver". That is lying to STA.
`,
    ]),

  practical(
    "sta",
    "master",
    "sta-master-practical",
    "Master Practical: Complete Signoff Timing & DRC Audit Suite",
    30,
    "Implement an automated signoff audit script verifying WNS, WHS, max transition, and unconstrained endpoints.",
    [
      "Execute full-chip design checks (`check_timing` and `check_constraints`).",
      "Verify zero setup violations across all active analysis views (`report_qor`).",
      "Export signoff timing summary matrix and waiver audit log.",
    ],
    {
      language: "tcl",
      starter: `# Master Signoff Timing Audit: signoff_check.tcl

# TODO: Step 1 - Execute check_timing and check_constraints
# TODO: Step 2 - Check setup/hold QoR across all views
# TODO: Step 3 - Generate signoff summary report`,
      checks: [
        { id: "chk", label: "check_timing execution", kind: "includes", pattern: "check_timing" },
        { id: "qor", label: "report_qor", kind: "includes", pattern: "report_qor" },
        { id: "drc", label: "report_constraint -all_violators", kind: "regex", pattern: "report_constraint.*all_violators" },
      ],
      solution: `# Master Signoff Timing Audit: signoff_check.tcl
# 1. Constraint & Timing Graph Health Check
check_timing -verbose > timing_lint.rpt
check_constraints -all_violators > constraints_lint.rpt

# 2. Multi-Corner QoR Verification
report_qor > signoff_qor_matrix.rpt
report_constraint -all_violators -max_transition -max_capacitance > signoff_drc.rpt

# 3. Verify Zero Unconstrained Endpoints
set unconstrained_count [sizeof_collection [all_registers -unconstrained]]
if {$unconstrained_count > 0} {
  puts "FATAL: Found $unconstrained_count unconstrained endpoints! Tapeout BLOCKED."
  exit 1
} else {
  puts "SUCCESS: 100% Endpoints Constrained. Signoff Certification APPROVED."
}
`,
    }
  ),

  quiz("sta", "master", "sta-master-quiz", "STA — Master Signoff & Timing Closure Exam", [
    { id: "sta_m1", prompt: "Prior to tapeout signoff, check_timing reports 12 'unconstrained endpoints'. The correct engineering action is:", choices: ["Investigate the 12 endpoints in RTL/SDC to either properly constrain them or apply a formal documented waiver; never tape out with unconstrained paths", "Ignore them because they are only warnings", "Add set_false_path -from * -to *", "Delete the 12 flip-flops"], answer: 0, explain: "Unconstrained endpoints are completely invisible to STA optimization and timing verification, risking silent silicon failure." },
    { id: "sta_m2", prompt: "A legitimate timing waiver in a commercial ASIC flow MUST contain:", choices: ["IP owner identity, physical rationale, proof from simulation/formal verification, and an expiration milestone", "Only a comment saying 'OK'", "A 0ns clock constraint", "An anonymous tag"], answer: 0, explain: "Waivers without named owners and documented proofs represent unverified risks that fail audit reviews." },
    { id: "sta_m3", prompt: "What is the primary objective of post-layout Leakage Power Recovery in STA?", choices: ["Swapping non-critical timing cells (paths with positive slack > +0.2ns) from leaky Low-Vth (LVT) to High-Vth (HVT) to slash standby power without impacting clock frequency", "Disabling the power supply", "Turning off the clock oscillator", "Removing ground pins"], answer: 0, explain: "Leakage recovery swaps cells on positive-slack paths to HVT, cutting chip standby leakage by up to 80% with zero frequency degradation." },
  ]),

  // ——— CDC (Clock Domain Crossing Track - 4 Layers) ———
  theory("cdc", "beginner", "cdc-beginner", "Beginner: Metastability Physics, MTBF & The 2-FF Synchronizer", 16,
    "The physical breakdown of setup/hold sampling violations and exponential MTBF resolution.",
    [
      "Why Metastability Occurs: When an asynchronous signal transitions inside the setup/hold window of a destination flip-flop (T_setup + T_hold), the internal feedback latch balances in an indeterminate intermediate voltage state (VDD / 2) before resolving randomly to 0 or 1.",
      "The MTBF Formula: Mean Time Between Failures is given by: MTBF = exp(t_r / tau) / (T_0 * f_clk * f_data) where t_r is available resolution time, tau is technology resolution constant, and T_0 is sampling aperture window.",
      "The 2-FF Synchronizer: Cascading 2 flip-flops back-to-back in the destination clock domain gives the first flop one full clock cycle (t_r = T_clk - T_setup - T_c2q) to resolve metastability before downstream logic samples its output.",
    ]),

  quiz("cdc", "beginner", "cdc-beginner-quiz", "CDC — Beginner Metastability & 2-FF Quiz", [
    { id: "cdc_b1", prompt: "What happens when an asynchronous signal violates the setup or hold time of a flip-flop?", choices: ["The flip-flop enters a metastable state where its output voltage lingers at an invalid logic level for an unpredictable duration", "The flip-flop instantly burns out", "The clock stops running", "The reset signal is asserted"], answer: 0, explain: "Metastability causes the internal bistable latch to hover near VDD/2 before resolving exponentially to 0 or 1." },
    { id: "cdc_b2", prompt: "In the MTBF equation MTBF = exp(tr / tau) / (T0 * fclk * fdata), increasing clock frequency (fclk) causes:", choices: ["MTBF to decrease exponentially because available resolution time (tr) decreases", "MTBF to increase to infinity", "Zero change in MTBF", "Metastability to disappear"], answer: 0, explain: "Higher clock frequency reduces the clock period, drastically shrinking the resolution time tr in the exponent." },
    { id: "cdc_b3", prompt: "Why can a 2-FF synchronizer NOT be used to synchronize a multi-bit binary data bus?", choices: ["Bit skew across the parallel wires causes destination flops to sample bits on different clock edges, generating invalid transient data words (incoherency)", "2-FF consumes too much power", "Binary buses do not have clocks", "Foundries forbid multi-bit buses"], answer: 0, explain: "Unequal routing delays cause individual bits to arrive at slightly different times, creating corrupted multi-bit values." },
  ]),

  theory("cdc", "standard", "cdc-standard-pulse-sync", "Standard: Fast-to-Slow Pulse Synchronizers & Toggle Protocols", 18,
    "Capturing narrow clock pulses across frequency boundaries using pulse-to-toggle conversion.",
    [
      "The Fast-to-Slow Pulse Problem: A 1-cycle pulse in a 500 MHz domain lasts only 2.0 ns. A slow 100 MHz receiver (period 10.0 ns) will completely miss the pulse if it rises and falls between sampling clock edges!",
      "Toggle-Based Pulse Synchronizer: 1) Source Domain: Pulse-to-Toggle converts every incoming pulse into a state transition (0 -> 1 or 1 -> 0), stretching the signal indefinitely; 2) Destination Domain: A 2-FF synchronizer safely transfers the toggle level into the slow domain; 3) Edge Detector: An XOR gate between the 2nd and 3rd flip-flop outputs (q2 ^ q3) regenerates an exact 1-cycle pulse in the destination domain!",
    ]),

  theory("cdc", "standard", "cdc-standard-handshake", "Standard: 4-Phase vs 2-Phase Multi-Bit Handshake Synchronizers", 16,
    "Transferring multi-bit data vectors with full stability guarantees using request-acknowledge handshakes.",
    [
      "Level-Sensitive 4-Phase Handshake: 1) Source places valid data on bus and asserts REQ=1; 2) Destination synchronizes REQ via 2-FF, samples data, and asserts ACK=1; 3) Source sees synchronized ACK, de-asserts REQ=0; 4) Destination sees REQ=0, de-asserts ACK=0 (Safe, robust, but takes 4 CDC round-trips).",
      "Transition-Sensitive 2-Phase Handshake: Uses toggle transitions on REQ and ACK to eliminate the return-to-zero overhead, halving latency for high-throughput control transfers.",
    ]),

  practical(
    "cdc",
    "standard",
    "cdc-standard-practical",
    "Standard Practical: Synthesizable Pulse Synchronizer in SystemVerilog",
    25,
    "Implement a synthesizable pulse synchronizer transferring pulses from a fast clock to a slow clock domain without pulse loss.",
    [
      "Implement pulse-to-toggle logic in source clock domain `clk_src`.",
      "Implement 2-FF synchronizer + 1-stage delay flop in destination domain `clk_dst`.",
      "Implement XOR edge detection generating `pulse_dst` output.",
    ],
    {
      language: "verilog",
      starter: `module pulse_sync (
  input  wire clk_src, rst_src_n, pulse_src,
  input  wire clk_dst, rst_dst_n,
  output wire pulse_dst
);
  // TODO: Step 1 - Pulse to toggle in clk_src
  // TODO: Step 2 - 2-FF synchronizer in clk_dst
  // TODO: Step 3 - XOR edge detector

endmodule`,
      checks: [
        { id: "tog", label: "Toggle logic in clk_src", kind: "regex", pattern: "toggle.*<=.*~toggle|toggle.*\\^.*pulse" },
        { id: "sync", label: "2-FF sync registers in clk_dst", kind: "regex", pattern: "sync_q1.*<=.*toggle" },
        { id: "xor", label: "XOR edge detection output", kind: "regex", pattern: "assign\\s+pulse_dst\\s*=.*\\^" },
      ],
      solution: `module pulse_sync (
  input  wire clk_src, rst_src_n, pulse_src,
  input  wire clk_dst, rst_dst_n,
  output wire pulse_dst
);
  // 1. Pulse-to-Toggle in Source Domain
  reg toggle_src;
  always @(posedge clk_src or negedge rst_src_n) begin
    if (!rst_src_n)
      toggle_src <= 1'b0;
    else if (pulse_src)
      toggle_src <= ~toggle_src;
  end

  // 2. 2-FF Synchronizer + Delay Stage in Destination Domain
  (* async_reg = "true" *) reg sync_q1, sync_q2;
  reg sync_q3;

  always @(posedge clk_dst or negedge rst_dst_n) begin
    if (!rst_dst_n) begin
      sync_q1 <= 1'b0;
      sync_q2 <= 1'b0;
      sync_q3 <= 1'b0;
    end else begin
      sync_q1 <= toggle_src;
      sync_q2 <= sync_q1;
      sync_q3 <= sync_q2;
    end
  end

  // 3. XOR Edge Detector regenerates a clean 1-cycle pulse
  assign pulse_dst = sync_q2 ^ sync_q3;
endmodule
`,
    }
  ),

  quiz("cdc", "standard", "cdc-standard-quiz", "CDC — Standard Pulse & Handshake Quiz", [
    { id: "cdc_s1", prompt: "Why does a pulse-to-toggle synchronizer prevent pulse loss across fast-to-slow clock crossings?", choices: ["A toggle level remains held indefinitely until the slow clock domain safely samples it via a 2-FF synchronizer", "It increases pulse voltage to 5V", "It accelerates the slow clock oscillator", "It converts the circuit to asynchronous logic"], answer: 0, explain: "By turning a 1-cycle event into a level transition, the signal cannot vanish between slow sampling clock edges." },
    { id: "cdc_s2", prompt: "In a 4-phase REQ/ACK handshake synchronizer, data bus signals must remain:", choices: ["Completely stable throughout the entire duration while REQ is asserted until ACK is received", "Toggling randomly", "Reset to zero every cycle", "Clocked by both domains simultaneously"], answer: 0, explain: "Data must be stable before REQ is asserted and held until ACK acknowledges reception to prevent incoherency." },
    { id: "cdc_s3", prompt: "What is the primary advantage of a 2-phase (toggle) handshake over a 4-phase handshake?", choices: ["It eliminates the return-to-zero (RTZ) recovery phase, reducing synchronization transaction latency in half", "It uses 0 transistors", "It eliminates the need for reset", "It works without clock domains"], answer: 0, explain: "2-phase handshake treats every edge (rising or falling) as an active transaction, eliminating 2 wasted RTZ transitions." },
  ]),

  theory("cdc", "expert", "cdc-expert-fifo", "Expert: Asynchronous FIFO Architecture & Gray Code Pointers", 18,
    "Dual-clock FIFO design, Gray conversion, full/empty detection, and burst depth sizing.",
    [
      "Asynchronous FIFO Architecture: Stores high-bandwidth streaming data between independent clock domains using: 1) Dual-port RAM array, 2) Binary Write Pointer (`wptr_bin`) & Read Pointer (`rptr_bin`), 3) Binary-to-Gray converters (G = B ^ (B >> 1)), 4) 2-FF Gray pointer synchronizers across domains, and 5) Full & Empty flag generators.",
      "Gray Code Pointer Advantage: Gray code changes exactly one bit per count. Even if the destination clock samples during a pointer transition, the sampled value resolves to either the old pointer or the new pointer — never an illegal spurious address!",
      "Full and Empty Flag Logic: Pointers are sized to N+1 bits for an 2^N depth FIFO: Empty: rptr_gray == wptr_gray_sync; Full: wptr_gray[N] != rptr_gray_sync[N] && wptr_gray[N-1] != rptr_gray_sync[N-1] && wptr_gray[N-2:0] == rptr_gray_sync[N-2:0].",
    ]),

  theory("cdc", "expert", "cdc-expert-rdc", "Expert: Reset Domain Crossing (RDC) & Reset Synchronizer Bridges", 16,
    "Asynchronous assert, synchronous de-assert reset bridges to prevent recovery/removal violations.",
    [
      "The Reset Domain Crossing Hazard: Asynchronous resets assert immediately, which is vital for power-on initialization. However, when an async reset is de-asserted close to a clock edge, registers experience Reset Recovery / Removal Timing Violations, causing chips to wake up in undefined metastable states!",
      "The Reset Synchronizer Bridge (2-FF): 1) Assertion: The async reset pin directly clears both flops asynchronously (0 delay); 2) De-assertion: Flop D=1'b1 releases the reset synchronously over 2 clock rising edges, ensuring all flip-flops exit reset synchronously on the exact same clock cycle without recovery violations!",
    ]),

  practical(
    "cdc",
    "expert",
    "cdc-expert-practical",
    "Expert Practical: Complete Dual-Clock Asynchronous FIFO in SystemVerilog",
    30,
    "Implement a complete, parameterized Asynchronous FIFO with dual-port RAM and Gray pointer synchronization.",
    [
      "Implement binary-to-gray pointer conversion (G = B ^ (B >> 1)).",
      "Implement 2-FF synchronizers for write and read Gray pointers.",
      "Generate `wfull` in write domain and `rempty` in read domain.",
    ],
    {
      language: "verilog",
      starter: `module async_fifo #(parameter DSIZE = 8, parameter ASIZE = 4) (
  input  wire              wclk, wrst_n, winc,
  input  wire [DSIZE-1:0]  wdata,
  output wire              wfull,
  input  wire              rclk, rrst_n, rinc,
  output wire [DSIZE-1:0]  rdata,
  output wire              rempty
);
  // TODO: Step 1 - Dual-port RAM array
  // TODO: Step 2 - Binary & Gray pointers
  // TODO: Step 3 - 2-FF Gray pointer sync
  // TODO: Step 4 - Full & Empty flag generation

endmodule`,
      checks: [
        { id: "mem", label: "Dual-port RAM array", kind: "regex", pattern: "reg\\s+\\[DSIZE-1:0\\]\\s+mem\\[" },
        { id: "gray", label: "Binary to Gray conversion", kind: "regex", pattern: "wptr_bin\\s*\\^\\s*\\(wptr_bin\\s*>>\\s*1\\)" },
        { id: "sync", label: "2-FF pointer synchronizers", kind: "regex", pattern: "async_reg" },
        { id: "full", label: "wfull flag generation", kind: "regex", pattern: "assign\\s+wfull" },
        { id: "empty", label: "rempty flag generation", kind: "regex", pattern: "assign\\s+rempty" },
      ],
      solution: `module async_fifo #(parameter DSIZE = 8, parameter ASIZE = 4) (
  input  wire              wclk, wrst_n, winc,
  input  wire [DSIZE-1:0]  wdata,
  output wire              wfull,
  input  wire              rclk, rrst_n, rinc,
  output wire [DSIZE-1:0]  rdata,
  output wire              rempty
);
  // 1. Dual-Port RAM Array
  localparam DEPTH = 1 << ASIZE;
  reg [DSIZE-1:0] mem [0:DEPTH-1];

  always @(posedge wclk)
    if (winc && !wfull)
      mem[wptr_bin[ASIZE-1:0]] <= wdata;

  assign rdata = mem[rptr_bin[ASIZE-1:0]];

  // 2. Binary and Gray Pointers
  reg [ASIZE:0] wptr_bin, rptr_bin;
  wire [ASIZE:0] wptr_gray = wptr_bin ^ (wptr_bin >> 1);
  wire [ASIZE:0] rptr_gray = rptr_bin ^ (rptr_bin >> 1);

  always @(posedge wclk or negedge wrst_n)
    if (!wrst_n) wptr_bin <= 0;
    else if (winc && !wfull) wptr_bin <= wptr_bin + 1'b1;

  always @(posedge rclk or negedge rrst_n)
    if (!rrst_n) rptr_bin <= 0;
    else if (rinc && !rempty) rptr_bin <= rptr_bin + 1'b1;

  // 3. 2-FF Gray Pointer Synchronizers
  (* async_reg = "true" *) reg [ASIZE:0] wq2_rptr, wq1_rptr;
  (* async_reg = "true" *) reg [ASIZE:0] rq2_wptr, rq1_wptr;

  always @(posedge wclk or negedge wrst_n)
    if (!wrst_n) {wq2_rptr, wq1_rptr} <= 0;
    else         {wq2_rptr, wq1_rptr} <= {wq1_rptr, rptr_gray};

  always @(posedge rclk or negedge rrst_n)
    if (!rrst_n) {rq2_wptr, rq1_wptr} <= 0;
    else         {rq2_wptr, rq1_wptr} <= {rq1_wptr, wptr_gray};

  // 4. Full and Empty Flag Generation
  assign rempty = (rptr_gray == rq2_wptr);
  assign wfull  = (wptr_gray == {~wq2_rptr[ASIZE:ASIZE-1], wq2_rptr[ASIZE-2:0]});
endmodule
`,
    }
  ),

  quiz("cdc", "expert", "cdc-expert-quiz", "CDC — Expert Async FIFO & RDC Quiz", [
    { id: "cdc_e1", prompt: "In an N-bit address Asynchronous FIFO, why are pointers sized to N+1 bits?", choices: ["The extra MSB bit distinguishes between the FIFO being completely Full versus completely Empty when the pointers are at the same address offset", "To double RAM storage capacity", "To increase clock speed", "To store parity bits"], answer: 0, explain: "When wptr == rptr, the extra MSB determines whether write has wrapped around (Full) or not (Empty)." },
    { id: "cdc_e2", prompt: "What is the primary function of a Reset Synchronizer Bridge (Async Assert, Sync De-assert)?", choices: ["To assert reset instantaneously during power-on while releasing reset synchronously to prevent Recovery/Removal timing violations", "To eliminate all clock jitter", "To reset memories to 0xFF", "To downclock the CPU"], answer: 0, explain: "Reset bridges ensure all flip-flops emerge from reset on the exact same clock edge without glitching." },
    { id: "cdc_e3", prompt: "In Asynchronous FIFO pointer synchronization, why is Gray-to-Binary conversion postponed until after the 2-FF synchronizer?", choices: ["Synchronizing multi-bit Binary values directly causes bus incoherency; Gray code ensures exactly 1 bit transitions at a time during synchronization", "Gray code consumes 0 gates", "Binary pointers cannot be read by SRAMs", "Foundries only support Gray code"], answer: 0, explain: "Only Gray code guarantees safe 1-bit transitions across asynchronous clock domains." },
  ]),

  theory("cdc", "master", "cdc-master-lint-signoff", "Master: Static CDC Linting & Formal Verification (SpyGlass / Questa CDC)", 20,
    "Automated structural and formal CDC rule checks, reconvergence detection, and waiver signoff.",
    [
      "Static CDC Linting Rules: Tools (Synopsys SpyGlass CDC, Siemens Questa CDC) analyze RTL netlists to catch: 1) `Clock_Glitch` (combinational logic in clock paths), 2) `Sync_Cell` (verifying proper 2-FF attributes on sync flops), 3) `Reconvergence` (multiple synchronized control signals merging into combinational logic), 4) `Data_Hold` (verifying data stability during multi-bit transfers), and 5) `Reset_Sync` (validating reset domain crossings).",
      "CDC Formal Signoff & Audit Trails: Every cross-domain path must be accounted for: 1) Mapped to a qualified synchronizer cell, 2) Declared in SDC `set_clock_groups -asynchronous`, 3) Documented in the official CDC crossing registry with waiver audit hashes.",
    ]),

  practical(
    "cdc",
    "master",
    "cdc-master-practical",
    "Master Practical: SpyGlass / Questa CDC Verification & Waiver Script",
    30,
    "Write a complete static CDC verification TCL script configuring clock domains, reset rules, and waiver exclusions.",
    [
      "Define clock domains `clk_core` (500 MHz) and `clk_pci` (100 MHz).",
      "Configure structural CDC rule checks for synchronizer cell depth and reconvergence.",
      "Apply instance-level CDC waivers (`cdc_waiver -rule Sync_01 -instance u_top/u_sync_block`).",
    ],
    {
      language: "tcl",
      starter: `# Static CDC Verification Script: cdc_check.tcl

# TODO: Step 1 - Define clock domains and reset relationships
# TODO: Step 2 - Enable CDC rule checks (Sync_Cell, Reconvergence, Reset_Sync)
# TODO: Step 3 - Apply instance-level waivers and generate signoff audit`,
      checks: [
        { id: "clk", label: "Define clock domains", kind: "regex", pattern: "cdc_clock|create_clock" },
        { id: "rule", label: "Enable CDC rules", kind: "regex", pattern: "cdc_rule|check_cdc|set_parameter" },
        { id: "rep", label: "Generate CDC report", kind: "regex", pattern: "report_cdc|report_violations" },
      ],
      solution: `# Static CDC Verification Script: cdc_check.tcl
# 1. Define Asynchronous Clock Domains & Reset Intent
create_clock -name clk_core -period 2.0 [get_ports clk]
create_clock -name clk_pci  -period 10.0 [get_ports pclk]

# 2. Configure CDC Engine Rules
set_parameter -name cdc_sync_depth 2
set_parameter -name cdc_check_reconvergence true
set_parameter -name cdc_check_glitch true

# 3. Instance-Level Waiver Audit (Documented and Owned)
cdc_waiver -rule "CDC_Reconvergence" -instance "u_soc_top/u_pcie_bridge/sync_ctrl" -comment "Safe: Gray-coded state machine output" -owner "Lead_CDC_Engineer"

# 4. Execute Full Verification Run & Generate Audit Log
run_cdc_check -all_rules
report_cdc -violations -verbose > cdc_signoff_audit.rpt
`,
    }
  ),

  quiz("cdc", "master", "cdc-master-quiz", "CDC — Master Static CDC Signoff Exam", [
    { id: "cdc_m1", prompt: "What is a 'CDC Reconvergence Hazard' in multi-domain digital design?", choices: ["When two independent signals synchronized through separate 2-FF synchronizers are recombined in combinational logic in the destination domain, causing skewed transient states", "When clocks are short-circuited", "When reset is held active low", "When simulation runs out of memory"], answer: 0, explain: "Separate synchronizers can resolve in different cycle latencies (1 or 2 cycles), creating illegal combined states in downstream logic." },
    { id: "cdc_m2", prompt: "Why must CDC waivers NEVER use global wildcards (e.g. waiver -from * -to *)?", choices: ["Global waivers blind the static CDC engine to newly introduced un-synchronized crossing bugs in downstream RTL edits", "Wildcards slow down the tool by 100x", "Wildcards are syntax errors in TCL", "Wildcards disable synthesis"], answer: 0, explain: "Global waivers mask real design errors; waivers must be granular, instance-specific, and auditable." },
    { id: "cdc_m3", prompt: "Quasi-static configuration registers (e.g. mode pins set once at boot) crossing clock domains:", choices: ["Must still have an explicit CDC waiver or 2-FF synchronizer with documentation proving software guarantees stability before enabling the block", "Require zero attention", "Are automatically synthesized into 500 MHz PLLs", "Can be ignored completely"], answer: 0, explain: "Methodology hygiene requires quasi-static signals to have documented software/hardware synchronization contracts." },
  ]),

  // ——— UPF (Unified Power Format / IEEE 1801 Track - 4 Layers) ———
  theory("upf", "beginner", "upf-beginner", "Beginner: UPF Foundations — Power Domains, Supply Nets & Power Switches", 16,
    "The fundamental taxonomy of multi-domain power intent, supply distribution, and MTCMOS power switches.",
    [
      "Why Power Formats (UPF / CPF) Exist: In modern SoCs, RTL Verilog describes logical behavior without physical power pins. UPF (IEEE 1801) specifies multi-voltage supplies, power-gating switches, isolation cells, and retention registers as a separate power intent contract across synthesis, simulation, and physical design.",
      "Power Domains & Supply Networks: `create_power_domain PD_TOP -include_scope` defines the default root domain. Switchable sub-blocks are defined via `create_power_domain PD_CPU -elements {u_cpu_cluster}`. Supply networks are constructed using `create_supply_port`, `create_supply_net`, and bound via `set_domain_supply_net`.",
      "MTCMOS Power Switches: Multi-Threshold CMOS sleep transistors cut off the power supply to idle blocks. Header switches (High-Vth PMOS between VDD and virtual VDD) or Footer switches (NMOS between virtual VSS and VSS) are declared using `create_power_switch`.",
    ]),

  practical(
    "upf",
    "beginner",
    "upf-beginner-practical",
    "Beginner Practical: Multi-Domain Power Intent & Switch Setup Script",
    20,
    "Write an IEEE 1801 UPF script defining an always-on top domain, a switchable CPU domain, and MTCMOS power switches.",
    [
      "Create default root domain `PD_TOP` and switchable domain `PD_CPU` for hierarchy `u_cpu`.",
      "Create supply ports `VDD`, `VSS` and supply nets `VDD_AON`, `VDD_CPU`, `VSS`.",
      "Bind primary power and ground nets using `set_domain_supply_net`.",
      "Define MTCMOS power switch `pwr_sw_cpu` controlled by `u_pmu/pwr_gate_cpu_n`.",
    ],
    {
      language: "tcl",
      starter: `# IEEE 1801 UPF Power Intent: basic_power.upf
upf_version 3.0

# TODO: Step 1 - Create power domains (PD_TOP, PD_CPU)
# TODO: Step 2 - Create supply ports & nets (VDD, VSS, VDD_AON, VDD_CPU)
# TODO: Step 3 - set_domain_supply_net for PD_TOP and PD_CPU
# TODO: Step 4 - create_power_switch pwr_sw_cpu`,
      checks: [
        { id: "pd", label: "create_power_domain PD_TOP and PD_CPU", kind: "regex", pattern: "create_power_domain\\s+PD_TOP[\\s\\S]*create_power_domain\\s+PD_CPU" },
        { id: "net", label: "create_supply_net VDD_AON and VDD_CPU", kind: "regex", pattern: "create_supply_net\\s+VDD_AON[\\s\\S]*create_supply_net\\s+VDD_CPU" },
        { id: "bind", label: "set_domain_supply_net primary power", kind: "includes", pattern: "set_domain_supply_net" },
        { id: "sw", label: "create_power_switch pwr_sw_cpu", kind: "includes", pattern: "create_power_switch" },
      ],
      solution: `# IEEE 1801 UPF Power Intent: basic_power.upf
upf_version 3.0

# 1. Create Power Domains
create_power_domain PD_TOP -include_scope
create_power_domain PD_CPU -elements {u_cpu}

# 2. Create Supply Ports & Nets
create_supply_port VDD -direction in
create_supply_port VSS -direction in

create_supply_net VDD_AON -domain PD_TOP
create_supply_net VSS     -domain PD_TOP -reuse
create_supply_net VDD_CPU -domain PD_CPU

# 3. Bind Domain Primary Supplies
set_domain_supply_net PD_TOP -primary_power_net VDD_AON -primary_ground_net VSS
set_domain_supply_net PD_CPU -primary_power_net VDD_CPU -primary_ground_net VSS

# 4. Create MTCMOS Header Power Switch
create_power_switch pwr_sw_cpu \\
  -domain PD_CPU \\
  -clamp_state ON -clamp_value 1 \\
  -control_port {pwr_gate_cpu_n u_pmu/pwr_gate_cpu_n} \\
  -input_supply_port {in VDD_AON} \\
  -output_supply_port {out VDD_CPU}
`,
    }
  ),

  quiz("upf", "beginner", "upf-beginner-quiz", "UPF — Beginner Domains & Supply Networks Quiz", [
    { id: "upf_b1", prompt: "Why is UPF / CPF power intent maintained as a separate file rather than embedded directly in RTL Verilog?", choices: ["RTL describes pure functional behavior across all technology nodes, while UPF specifies foundry-dependent voltage domains, power switches, and isolation without polluting functional logic", "Verilog does not support text comments", "UPF is only used for PCB design", "Foundries forbid power nets in silicon"], answer: 0, explain: "Keeping power intent in UPF enables clean RTL reuse across different voltage implementations and synthesis flows." },
    { id: "upf_b2", prompt: "What is an MTCMOS Header Power Switch in power gating?", choices: ["A High-Threshold (HVT) PMOS transistor placed between the permanent VDD grid and the virtual VDD rail of a switchable domain to cut off leakage during sleep", "A physical toggle switch on the chip package", "An NMOS transistor connected to GND", "A clock buffer"], answer: 0, explain: "Header switches use PMOS transistors to disconnect VDD from virtual VDD when sleep control is asserted." },
    { id: "upf_b3", prompt: "In UPF, `create_power_domain PD_TOP -include_scope` defines:", choices: ["The top-level default power domain covering all instances not explicitly assigned to sub-domains", "A power domain that cannot be simulated", "A domain with zero supply voltage", "A software thread"], answer: 0, explain: "-include_scope assigns all unassigned logic in the current hierarchical scope to PD_TOP." },
  ]),

  theory("upf", "standard", "upf-standard-isolation", "Standard: Isolation Cells, Level Shifters & State Retention (SRPG)", 18,
    "Preventing crowbar leakage currents, voltage level translation, and balloon latch state retention.",
    [
      "Crowbar Current & Isolation Strategy: When a power domain is switched OFF (0V), its output pins float at an indeterminate intermediate voltage. If connected to an active domain, both PMOS and NMOS transistors in the receiver gate turn ON simultaneously, causing massive short-circuit **Crowbar Leakage Current (>300 mW)**! UPF `set_isolation` inserts clamp gates holding unpowered nets to logic 0 or 1.",
      "Level Shifters for Multi-Voltage: When a 0.8V domain drives a 1.8V domain, the 0.8V high signal cannot fully turn off the 1.8V PMOS pull-up transistor. UPF `set_level_shifter` inserts cross-coupled level-shifting buffers (`sky130_fd_sc_hd__lsbufhv2lv_1`) to cleanly translate voltage swings.",
      "State Retention Power Gating (SRPG): Standard flip-flops lose their state when VDD is cut. Retention registers incorporate an always-on **balloon shadow latch** (`set_retention`). Before power-down, the PMU pulses `save_signal=0` to store register state; upon power-up, `restore_signal=0` restores state within 1 clock cycle!",
    ]),

  practical(
    "upf",
    "standard",
    "upf-standard-practical",
    "Standard Practical: Complete Isolation, Level Shifter & Retention UPF",
    25,
    "Write an IEEE 1801 UPF script declaring output isolation clamping, bidirectional level shifters, and SRPG retention.",
    [
      "Define output isolation rule `iso_cpu_out` on `PD_CPU` clamping to `0` with control `u_pmu/iso_cpu_en`.",
      "Define level shifter rule `ls_cpu_to_top` on `PD_CPU` outputs with location `parent`.",
      "Define retention strategy `ret_cpu` on `PD_CPU` with save/restore signals.",
    ],
    {
      language: "tcl",
      starter: `# UPF Strategies: isolation_retention.upf

# TODO: Step 1 - Define set_isolation iso_cpu_out on PD_CPU
# TODO: Step 2 - Define set_level_shifter ls_cpu_to_top
# TODO: Step 3 - Define set_retention ret_cpu with save/restore`,
      checks: [
        { id: "iso", label: "set_isolation clamp_value 0", kind: "regex", pattern: "set_isolation\\s+iso_cpu_out[\\s\\S]*-clamp_value\\s+0" },
        { id: "ls", label: "set_level_shifter rule", kind: "includes", pattern: "set_level_shifter" },
        { id: "ret", label: "set_retention save and restore", kind: "regex", pattern: "set_retention\\s+ret_cpu[\\s\\S]*-save_signal" },
      ],
      solution: `# UPF Strategies: isolation_retention.upf

# 1. Output Isolation Strategy (Prevents Crowbar Current)
set_isolation iso_cpu_out \\
  -domain PD_CPU \\
  -clamp_value 0 \\
  -applies_to outputs \\
  -isolation_signal u_pmu/iso_cpu_en \\
  -isolation_sense high \\
  -location parent

# 2. Level Shifter Strategy (1.2V -> 1.8V)
set_level_shifter ls_cpu_to_top \\
  -domain PD_CPU \\
  -applies_to outputs \\
  -rule both \\
  -location parent

# 3. State Retention Power Gating Strategy
set_retention ret_cpu \\
  -domain PD_CPU \\
  -retention_power_net VDD_AON \\
  -retention_ground_net VSS \\
  -save_signal    {u_pmu/ret_save_n low} \\
  -restore_signal {u_pmu/ret_restore_n low}
`,
    }
  ),

  quiz("upf", "standard", "upf-standard-quiz", "UPF — Standard Isolation, Level Shifters & SRPG Quiz", [
    { id: "upf_s1", prompt: "What happens if a power-gated domain turns OFF while output isolation is DISABLED?", choices: ["The floating unpowered wire hovers near VDD/2, turning on both PMOS and NMOS transistors in receiving gates and drawing catastrophic crowbar leakage current", "The chip automatically overclocks", "The clock tree inverts", "Nothing happens"], answer: 0, explain: "Floating inputs cause receiving CMOS inverters to conduct large short-circuit crowbar current from VDD to GND." },
    { id: "upf_s2", prompt: "Why is a Level Shifter required when a 0.8V domain drives a 1.8V domain?", choices: ["A 0.8V logic 1 is below the gate turn-off voltage of 1.8V PMOS transistors, causing continuous static current and logic degradation", "To increase wire capacitance", "To convert binary to Gray code", "To eliminate clock jitter"], answer: 0, explain: "Without a level shifter, the 0.8V signal cannot turn off the 1.8V pull-up PMOS, resulting in a degraded intermediate output." },
    { id: "upf_s3", prompt: "How does a State Retention Power Gating (SRPG) flip-flop preserve its state during sleep?", choices: ["An always-on shadow balloon latch powered by the permanent VDD rail stores the bit before power-down and restores it upon wake-up", "It writes data to external flash memory", "It uses radioactive isotopes", "It keeps all internal transistors powered at 1.8V"], answer: 0, explain: "The small balloon latch remains connected to the always-on supply, preserving state while the main flop logic is completely unpowered." },
  ]),

  theory("upf", "expert", "upf-expert-pst", "Expert: Power State Tables (PST) & PMU Sequencing Protocols", 18,
    "Defining legal multi-supply voltage matrices and handshake sequencing for power gating.",
    [
      "Power State Tables (PST): Complex SoCs operate across multiple modes (e.g. `ALL_ON`, `CPU_ACTIVE_GPU_SLEEP`, `DEEP_SLEEP_RETENTION`, `FULL_SHUTDOWN`). UPF `create_pst` and `add_pst_state` declare all legal voltage combinations. Any unlisted state combination is treated as a fatal design error during static verification.",
      "Power Management Unit (PMU) Shutdown Sequence: 1) Clock Gate: Stop domain clock toggles -> 2) Save Retention: Pulse `ret_save_n=0` -> 3) Enable Isolation: Assert `iso_en=1` -> 4) Open Power Switch: Assert `pwr_gate_n=0` to cut VDD.",
      "PMU Wakeup Sequence: 1) Close Power Switch: Assert `pwr_gate_n=1` and wait for power-good acknowledge -> 2) Restore Retention: Pulse `ret_restore_n=0` -> 3) Disable Isolation: De-assert `iso_en=0` -> 4) Un-gate Clock: Resume normal execution.",
      "Static Low Power Verification (CLP / VC LP): EDA tools (Cadence Conformal Low Power, Synopsys VC LP) statically verify that every cross-domain net has verified isolation, valid level shifters, and consistent PST power states.",
    ]),

  practical(
    "upf",
    "expert",
    "upf-expert-practical",
    "Expert Practical: Power State Table (PST) & Multi-State Signoff Script",
    25,
    "Construct an advanced IEEE 1801 UPF script defining a 3-supply Power State Table (PST) covering 5 operational modes.",
    [
      "Create PST table `pst_soc` with supplies `{VDD_AON VDD_CPU VDD_GPU}`.",
      "Add legal state `ALL_ON` with voltages `{1.80 1.20 0.80}`.",
      "Add legal state `CPU_ACTIVE_GPU_SLEEP` with `{1.80 1.20 OFF}`.",
      "Add legal state `DEEP_SLEEP` with `{1.80 OFF OFF}` and `SHUTDOWN` with `{OFF OFF OFF}`.",
    ],
    {
      language: "tcl",
      starter: `# Power State Table Definition: pst_definition.upf

# TODO: Step 1 - create_pst pst_soc with supplies VDD_AON VDD_CPU VDD_GPU
# TODO: Step 2 - add_pst_state for ALL_ON
# TODO: Step 3 - add_pst_state for CPU_ACTIVE_GPU_SLEEP
# TODO: Step 4 - add_pst_state for DEEP_SLEEP and SHUTDOWN`,
      checks: [
        { id: "pst", label: "create_pst pst_soc", kind: "regex", pattern: "create_pst\\s+pst_soc" },
        { id: "on", label: "add_pst_state ALL_ON", kind: "regex", pattern: "add_pst_state\\s+ALL_ON" },
        { id: "sleep", label: "add_pst_state CPU_ACTIVE_GPU_SLEEP", kind: "regex", pattern: "add_pst_state\\s+CPU_ACTIVE_GPU_SLEEP" },
        { id: "off", label: "add_pst_state SHUTDOWN", kind: "regex", pattern: "add_pst_state\\s+SHUTDOWN" },
      ],
      solution: `# Power State Table Definition: pst_definition.upf

# 1. Create Power State Table
create_pst pst_soc -supplies {VDD_AON VDD_CPU VDD_GPU}

# 2. Define Legal Operational States
add_pst_state ALL_ON               -pst pst_soc -state {1.80 1.20 0.80}
add_pst_state CPU_ACTIVE_GPU_SLEEP -pst pst_soc -state {1.80 1.20 OFF}
add_pst_state CPU_SLEEP_GPU_ACTIVE -pst pst_soc -state {1.80 OFF  0.80}
add_pst_state DEEP_SLEEP_RETENTION -pst pst_soc -state {1.80 OFF  OFF}
add_pst_state FULL_SHUTDOWN        -pst pst_soc -state {OFF  OFF  OFF}
`,
    }
  ),

  quiz("upf", "expert", "upf-expert-quiz", "UPF — Expert PST, Sequencing & CLP Lint Quiz", [
    { id: "upf_e1", prompt: "During power domain shutdown, what is the exact required sequencing of PMU control signals?", choices: ["1) Clock Gate -> 2) Save Retention -> 3) Enable Isolation -> 4) Open Power Switch", "1) Open Power Switch -> 2) Enable Isolation -> 3) Save Retention", "1) Enable Clocks -> 2) Cut Power", "Order does not matter"], answer: 0, explain: "Isolation must be enabled and state saved BEFORE power is cut; otherwise floating outputs cause crowbar current and state is lost." },
    { id: "upf_e2", prompt: "What is the primary role of Conformal Low Power (CLP) / VC LP in ASIC design?", choices: ["To statically analyze the netlist against UPF intent, proving zero missing isolation cells, correct level shifter polarities, and legal PST state transitions", "To layout metal routing tracks", "To run Verilog testbenches", "To synthesize PLLs"], answer: 0, explain: "CLP performs formal static verification of low-power rules across power domain crossings." },
    { id: "upf_e3", prompt: "In a Power State Table (PST), if software sets a power state combination NOT declared in the table:", choices: ["The state is illegal; static verification flags a fatal signoff violation and simulation triggers X-corruption", "The tool invents a new supply voltage", "The chip runs at double speed", "Power consumption becomes zero"], answer: 0, explain: "PST acts as a strict white-list contract; undeclared state combinations are forbidden." },
  ]),

  theory("upf", "master", "upf-master-signoff", "Master: Full-Chip Low Power Signoff, Power-Aware Simulation & Dynamic Estimation", 20,
    "Power-Aware Gate-Level Simulation (PA-GLS), SAIF switching activity extraction, and UPF 3.0 refinement.",
    [
      "Power-Aware Simulation (PA-SIM / PA-GLS): Standard Verilog simulators ignore power state transitions. Power-aware simulators (VCS NLP, Xcelium LP) compile the UPF file alongside RTL. When a domain enters the `OFF` state, internal signals are forcibly corrupted to `X` (unknown) and isolation clamps are checked to ensure active domains do not receive `X`!",
      "Switching Activity & Dynamic Power (SAIF / VCD / FSDB): Real dynamic power (P_dyn = alpha * C * V^2 * f) depends on actual signal switching activity factor (alpha). Testbench simulations generate VCD / FSDB activity files, which are converted to SAIF (Switching Activity Interchange Format) and fed into PrimePower / Joules for cycle-accurate peak and average power signoff.",
      "UPF 3.0 Successive Refinement: UPF intent flows through: 1) **Architectural UPF** (High-level domains and PST), 2) **Implementation UPF** (Cell instances and switch connections added during P&R), and 3) **Signoff UPF** (Extracted back-annotated power netlist for tapeout signoff).",
    ]),

  practical(
    "upf",
    "master",
    "upf-master-practical",
    "Master Practical: Production-Grade Multi-Voltage Signoff UPF & CLP Audit",
    30,
    "Implement a complete, production-grade 3-domain UPF specification with supply routing, switches, isolation, level shifters, retention, and PST.",
    [
      "Declare UPF 3.0 specification with `PD_TOP`, `PD_CPU`, and `PD_GPU`.",
      "Configure primary power switches with control handshakes.",
      "Implement all isolation and level-shifting boundary rules.",
      "Define complete Power State Table `pst_soc` with 5 legal states.",
    ],
    {
      language: "tcl",
      starter: `# Production-Grade Signoff UPF: full_soc_power.upf
upf_version 3.0

# TODO: Step 1 - Create power domains (PD_TOP, PD_CPU, PD_GPU)
# TODO: Step 2 - Define supply nets and power switches
# TODO: Step 3 - Define isolation, level shifter, and retention strategies
# TODO: Step 4 - Define Power State Table pst_soc`,
      checks: [
        { id: "ver", label: "upf_version 3.0", kind: "includes", pattern: "upf_version 3.0" },
        { id: "domains", label: "3 Power Domains", kind: "regex", pattern: "create_power_domain\\s+PD_TOP[\\s\\S]*create_power_domain\\s+PD_CPU[\\s\\S]*create_power_domain\\s+PD_GPU" },
        { id: "switches", label: "create_power_switch for CPU and GPU", kind: "includes", pattern: "create_power_switch" },
        { id: "rules", label: "set_isolation and set_level_shifter", kind: "regex", pattern: "set_isolation[\\s\\S]*set_level_shifter" },
        { id: "pst", label: "create_pst and add_pst_state", kind: "regex", pattern: "create_pst[\\s\\S]*add_pst_state" },
      ],
      solution: `# Production-Grade Signoff UPF: full_soc_power.upf
upf_version 3.0

# 1. Power Domain Hierarchy
create_power_domain PD_TOP   -include_scope
create_power_domain PD_CPU   -elements {u_cpu_cluster}
create_power_domain PD_GPU   -elements {u_gpu_cluster}

# 2. Global Supply Networks
create_supply_port VDD_AON   -direction in
create_supply_port VSS       -direction in

create_supply_net  VDD_AON   -domain PD_TOP
create_supply_net  VSS       -domain PD_TOP -reuse
create_supply_net  VDD_CPU   -domain PD_CPU
create_supply_net  VDD_GPU   -domain PD_GPU

set_domain_supply_net PD_TOP -primary_power_net VDD_AON -primary_ground_net VSS
set_domain_supply_net PD_CPU -primary_power_net VDD_CPU -primary_ground_net VSS
set_domain_supply_net PD_GPU -primary_power_net VDD_GPU -primary_ground_net VSS

# 3. MTCMOS Power Switches
create_power_switch pwr_sw_cpu \\
  -domain PD_CPU \\
  -clamp_state ON -clamp_value 1 \\
  -control_port {pwr_gate_cpu_n u_pmu/pwr_gate_cpu_n} \\
  -input_supply_port {in VDD_AON} \\
  -output_supply_port {out VDD_CPU}

create_power_switch pwr_sw_gpu \\
  -domain PD_GPU \\
  -clamp_state ON -clamp_value 1 \\
  -control_port {pwr_gate_gpu_n u_pmu/pwr_gate_gpu_n} \\
  -input_supply_port {in VDD_AON} \\
  -output_supply_port {out VDD_GPU}

# 4. Boundary Protection: Isolation & Level Shifters
set_isolation iso_cpu_out \\
  -domain PD_CPU -clamp_value 0 -applies_to outputs \\
  -isolation_signal u_pmu/iso_cpu_en -isolation_sense high -location parent

set_isolation iso_gpu_out \\
  -domain PD_GPU -clamp_value 0 -applies_to outputs \\
  -isolation_signal u_pmu/iso_gpu_en -isolation_sense high -location parent

set_level_shifter ls_cpu_top \\
  -domain PD_CPU -applies_to both -rule both -location parent

set_level_shifter ls_gpu_top \\
  -domain PD_GPU -applies_to both -rule both -location parent

# 5. State Retention Power Gating
set_retention ret_cpu \\
  -domain PD_CPU -retention_power_net VDD_AON -retention_ground_net VSS \\
  -save_signal {u_pmu/ret_save_n low} -restore_signal {u_pmu/ret_restore_n low}

# 6. Power State Table Signoff Matrix
create_pst pst_soc -supplies {VDD_AON VDD_CPU VDD_GPU}
add_pst_state ALL_ON               -pst pst_soc -state {1.80 1.20 0.80}
add_pst_state CPU_ACTIVE_GPU_SLEEP -pst pst_soc -state {1.80 1.20 OFF}
add_pst_state CPU_SLEEP_GPU_ACTIVE -pst pst_soc -state {1.80 OFF  0.80}
add_pst_state DEEP_SLEEP_RETENTION -pst pst_soc -state {1.80 OFF  OFF}
add_pst_state FULL_SHUTDOWN        -pst pst_soc -state {OFF  OFF  OFF}
`,
    }
  ),

  quiz("upf", "master", "upf-master-quiz", "UPF — Master Low-Power Signoff & PA-GLS Exam", [
    { id: "upf_m1", prompt: "How does Power-Aware Gate-Level Simulation (PA-GLS) verify power intent correctness?", choices: ["It injects 'X' (unknown) values into unpowered logic cones during sleep states to expose missing isolation cells and functional wake-up race conditions", "It measures the temperature of the server CPU", "It converts Verilog to C++", "It disables all testbench assertions"], answer: 0, explain: "PA-GLS models real power-loss corruption; un-isolated paths will propagate X into live domains, flagging bugs in testbenches." },
    { id: "upf_m2", prompt: "Why is Switching Activity (SAIF / VCD) essential for accurate dynamic power signoff in PrimePower / Joules?", choices: ["Dynamic power is directly proportional to signal transition density (alpha); without realistic testbench activity, power tools can misestimate power by 5x", "SAIF replaces the standard cell library", "SAIF defines clock frequency", "Foundries require SAIF for DRC checks"], answer: 0, explain: "P_dyn = alpha * C * V^2 * f; SAIF provides exact per-net switching factors from realistic application workloads." },
    { id: "upf_m3", prompt: "What is 'Successive Refinement' in the UPF 3.0 design methodology?", choices: ["Progressively adding physical cell bindings, secondary power pins, and routing details to the architectural UPF as the design advances from RTL to P&R to Signoff", "Rewriting the UPF in Python", "Deleting power domains after synthesis", "Manually placing transistors in GDS"], answer: 0, explain: "Successive refinement allows the same base power intent to be augmented with physical implementation details across design stages." },
  ]),

  // ——— Verification Track (Comprehensive ChipVerify Taxonomy - 4 Layers) ———
  theory("verification", "beginner", "verif-beginner", "Beginner: Verification Foundations, Event Queue Scheduling & TB Evolution", 18,
    "The complete taxonomy of pre-silicon verification, IEEE 1800 event queue scheduling, display debugging, and the 5 stages of testbench evolution.",
    [
      "Introduction to Verification & Chip Design Flow: Verification proves that an RTL implementation matches its architectural specification before committing to multi-million-dollar mask fabrication. Pre-Silicon Verification (simulating RTL in software) differs fundamentally from Post-Silicon Validation (testing physical silicon in lab benches with ATE testers and oscilloscopes). Design Engineers build constructively; Verification Engineers test destructively with an adversarial mindset to expose hidden corner cases.",
      "Why RTL Bugs Are Inevitable: Hardware languages describe massive concurrency. A designer must reason about thousands of signals changing simultaneously. Common mistakes include polarity bugs (using `if (rst)` instead of `if (!rst)` for active-low resets), off-by-one counter limits, missing default branches, and CDC synchronization failures. Simulation is the only way to expose them.",
      "Why Verification Takes So Long: Verification often consumes 60-80% of project time. The state space scales exponentially—a 32-bit adder alone has over 4 billion combinations per cycle. The verification cycle is highly iterative (write test, simulate, analyze, fix RTL, repeat), and building complex protocol testbenches from scratch is a multi-week effort.",
      "The Cost of a Bug Escape: Pre-silicon bugs cost seconds of compute to fix. Post-silicon bugs found after tapeout are catastrophic: an advanced-node mask re-spin costs $5M - $20M and adds 3-6 months. Minor bugs might get software errata workarounds, but safety-critical bugs can cause full product recalls and massive reputational damage.",
      "How RTL Simulation Works & The IEEE 1800 Event Queue: Simulators evaluate hardware events in discrete stratified regions within each time step (`timescale 1ns/1ps`): 1) **Preponed Region** (Sample inputs before clock edge with `#1step` skew), 2) **Active Region** (Evaluate blocking assignments `=`, continuous assigns, clock toggles), 3) **Inactive Region** (`#0` delays — avoided due to non-deterministic races), 4) **NBA Region** (Update Non-Blocking Assignments `<=` for clocked registers), 5) **Observed Region** (Evaluate SystemVerilog Assertions), 6) **Reactive Region** (Execute testbench programs/drivers), 7) **Postponed Region** (Execute `$strobe` and `$monitor`).",
      "Display Tasks & Waveform Debugging: Use `$display` for active prints, `$strobe` to print after all non-blocking register updates have settled in the current time step, and `$monitor` to auto-print whenever a monitored variable changes. Format strings cleanly (`%0t` for unpadded simulation time, `%h` for hex, `%b` for binary). Waveforms in GTKWave/DVE are diagnostic debug tools after automated assertion checks fire.",
      "The 5 Stages of Testbench Evolution: 1) **Linear Testbench** (Hardcoded `#10` delays, manual waveform checking), 2) **File-Based Testbench** (Stimulus vectors loaded via `$readmemh`), 3) **State-Machine Driven Testbench** (Algorithmic FSM driving handshakes), 4) **Linear Random Testbench** (Unconstrained `$urandom` inputs), 5) **Self-Checking Testbench** (Automated software reference model and golden scoreboard comparing actual vs expected outputs).",
    ]),

  practical(
    "verification",
    "beginner",
    "verif-beginner-practical",
    "Beginner Practical: Self-Checking Pipelined ALU Testbench with Display Formatting",
    25,
    "Write an automated self-checking SystemVerilog testbench for an 8-bit pipelined ALU with automated scoreboarding and display formatting.",
    [
      "Generate a 100 MHz clock (`clk`) and active-low reset (`rst_n`).",
      "Drive test stimulus for ADD, SUB, AND, and OR operations across multiple cycles.",
      "Implement self-checking verification logic comparing output against computed reference values.",
      "Use `$strobe` and `$error` to report formatted debug diagnostics.",
      "Print final PASS/FAIL summary and exit with `$finish`.",
    ],
    {
      language: "verilog",
      starter: `\`timescale 1ns/1ps

module tb_alu;
  reg        clk, rst_n;
  reg  [7:0] a, b;
  reg  [1:0] op;
  wire [8:0] result;

  // TODO: Step 1 - Clock and reset generation
  // TODO: Step 2 - Instantiate DUT
  // TODO: Step 3 - Drive stimulus and check results with assert

endmodule`,
      checks: [
        { id: "clk", label: "Clock generation loop", kind: "regex", pattern: "forever\\s*#|always\\s*#" },
        { id: "dut", label: "DUT instantiation", kind: "regex", pattern: "alu\\s+dut|\\.\\*" },
        { id: "assert", label: "assert check or error display", kind: "regex", pattern: "assert|\\$error|\\$display|\\$strobe" },
        { id: "finish", label: "$finish call", kind: "includes", pattern: "$finish" },
      ],
      solution: `\`timescale 1ns/1ps

module tb_alu;
  reg        clk, rst_n;
  reg  [7:0] a, b;
  reg  [1:0] op;
  wire [8:0] result;

  // 1. Clock Generation (100 MHz, Period = 10ns)
  initial begin
    clk = 0;
    forever #5 clk = ~clk;
  end

  // 2. Stimulus & Self-Checking Verification Task
  integer err_count = 0;

  task check_alu(input [7:0] in_a, input [7:0] in_b, input [1:0] in_op, input [8:0] exp_res);
    begin
      @(posedge clk);
      a  <= in_a;
      b  <= in_b;
      op <= in_op;
      @(posedge clk); #1;
      if (result !== exp_res) begin
        $error("[MISMATCH at %0t ps] A=%h B=%h OP=%b | Got: %h, Exp: %h", $time, in_a, in_b, in_op, result, exp_res);
        err_count = err_count + 1;
      end else begin
        $strobe("[PASS at %0t ps] A=%h B=%h OP=%b -> Result=%h", $time, in_a, in_b, in_op, result);
      end
    end
  endtask

  // 3. Testbench Execution
  initial begin
    rst_n = 0;
    a = 0; b = 0; op = 0;
    #20 rst_n = 1;

    // Test ADD, SUB, AND, OR
    check_alu(8'd10, 8'd20, 2'b00, 9'd30);
    check_alu(8'd50, 8'd20, 2'b01, 9'd30);
    check_alu(8'hFF, 8'h0F, 2'b10, 9'h0F);
    check_alu(8'hF0, 8'h0F, 2'b11, 9'hFF);

    if (err_count == 0)
      $display("SUCCESS: All ALU directed tests PASSED!");
    else
      $fatal(1, "FAILURE: %0d verification errors detected.", err_count);

    $finish;
  end
endmodule
`,
    }
  ),

  quiz("verification", "beginner", "verif-beginner-quiz", "Verification — Beginner Event Queue & TB Evolution Quiz", [
    { id: "ver_b1", prompt: "What is the primary difference between Pre-Silicon Verification and Post-Silicon Validation?", choices: ["Pre-Silicon Verification simulates HDL logic in software before mask tapeout; Post-Silicon Validation tests physical fabricated silicon in lab testbenches with oscilloscopes, logic analyzers, and ATE testers", "Pre-Silicon is done with a microscope", "Post-Silicon uses Verilator only", "They are identical"], answer: 0, explain: "Pre-silicon catches logical defects before manufacturing; post-silicon validates physical speed, power, and analog electricals on real silicon." },
    { id: "ver_b2", prompt: "Why is `$strobe` preferred over `$display` when printing register outputs updated by non-blocking `<=` assignments?", choices: ["`$strobe` executes in the Postponed region at the very end of the current time step after all non-blocking assignments have settled, preventing display of stale pre-clock values", "`$strobe` prints in color", "`$strobe` consumes zero CPU memory", "`$strobe` formats in binary only"], answer: 0, explain: "$strobe executes in the Postponed region after NBA updates are complete, avoiding race conditions in debug printouts." },
    { id: "ver_b3", prompt: "In the 5 stages of Testbench Evolution, what is the core advantage of a Self-Checking Testbench over a Linear Testbench?", choices: ["A self-checking testbench programmatically compares outputs against an expected software reference model and issues automated PASS/FAIL without requiring manual human waveform inspection", "It requires fewer clock cycles", "It compiles into an ASIC", "It replaces SDC constraints"], answer: 0, explain: "Self-checking testbenches automate pass/fail decisions, enabling regression runs across thousands of random seeds." },
  ]),

  theory("verification", "standard", "verif-standard-crv", "Standard: CRV, Code Coverage Taxonomy & Functional Bins", 18,
    "Constrained-Random Verification (CRV), the 6 types of structural code coverage, and functional coverage cross bins.",
    [
      "Constrained-Random Verification (CRV): Instead of writing thousands of manual directed tests, SystemVerilog `class` models declare random variables (`rand`, `randc` cyclic) bounded by declarative constraint blocks (`constraint c_valid { addr inside {[0:255]}; len > 0; }`). Use `dist { [0:15] := 70, [16:255] := 30 }` for weighted distributions, `solve A before B` to guide solver arbitration, and `soft` constraints for overridable defaults.",
      "How Verification Measures Completeness: The industry uses two complementary metrics. Code coverage tracks structural execution automatically, while Functional coverage is semantic and tracks design-level scenarios reflecting the test plan.",
      "The 6 Structural Code Coverage Metrics: 1) **Statement / Line Coverage** (Did every statement execute?), 2) **Block Coverage** (Did every basic sequential block execute?), 3) **Branch / Decision Coverage** (Did every `if/else` and `case` evaluate true AND false?), 4) **Expression / Condition Coverage** (MCDC: Did each sub-term in boolean expressions cause the overall condition to flip?), 5) **Toggle Coverage** (Did every bit toggle 0 -> 1 and 1 -> 0?), 6) **FSM Coverage** (Did every state and legal arc transition occur?).",
      "Functional Coverage (`covergroup`): Functional coverage measures how thoroughly the design specification has been exercised. `coverpoint` defines bins (`bins low = {[0:63]}`, `illegal_bins`, `ignore_bins`), and `cross` coverage tracks concurrent multi-variable combinations (e.g. `cross cp_op, cp_addr_range`).",
      "Unreachable Code Analysis: Code coverage may remain under 100% due to defensive hardware logic or unused IP configuration modes. Every unreached branch must undergo formal reachability analysis and receive a documented waiver signed by the design lead before tapeout signoff!",
    ]),

  practical(
    "verification",
    "standard",
    "verif-standard-practical",
    "Standard Practical: Constrained-Random Packet Generator & Functional Coverage",
    25,
    "Implement a SystemVerilog transaction packet class with weighted constraints and a functional covergroup.",
    [
      "Declare `class packet` with `rand bit [7:0] addr`, `rand bit [3:0] len`, and `rand bit [1:0] cmd`.",
      "Add constraint `c_addr` restricting address to `[0:127]` with weighted length distribution.",
      "Define `covergroup cg_pkt` sampling `cmd`, `addr` bins, and cross coverage.",
    ],
    {
      language: "verilog",
      starter: `class packet;
  // TODO: Step 1 - Declare rand fields (addr, len, cmd)
  // TODO: Step 2 - Add constraint block c_pkt
  // TODO: Step 3 - Add covergroup cg_pkt

endclass`,
      checks: [
        { id: "rand", label: "rand bit fields", kind: "regex", pattern: "rand\\s+bit" },
        { id: "c", label: "constraint block", kind: "includes", pattern: "constraint" },
        { id: "cg", label: "covergroup definition", kind: "includes", pattern: "covergroup" },
        { id: "cross", label: "cross coverage", kind: "includes", pattern: "cross" },
      ],
      solution: `class packet;
  rand bit [7:0] addr;
  rand bit [3:0] len;
  rand bit [1:0] cmd; // 0: READ, 1: WRITE, 2: IDLE, 3: ERROR

  // 1. Constrained-Random Constraints
  constraint c_pkt {
    addr inside {[0:127]};
    len inside {[1:8]};
    cmd dist { 2'b00 := 40, 2'b01 := 40, 2'b10 := 15, 2'b11 := 5 };
  }

  // 2. Functional Coverage Group
  covergroup cg_pkt;
    cp_cmd: coverpoint cmd {
      bins read_op  = {2'b00};
      bins write_op = {2'b01};
      bins idle_op  = {2'b10};
      bins err_op   = {2'b11};
    }
    cp_addr: coverpoint addr {
      bins low_range  = {[0:63]};
      bins high_range = {[64:127]};
    }
    cross_cmd_addr: cross cp_cmd, cp_addr;
  endgroup

  function new();
    cg_pkt = new();
  endfunction

  function void sample_coverage();
    cg_pkt.sample();
  endfunction
endclass
`,
    }
  ),

  quiz("verification", "standard", "verif-standard-quiz", "Verification — Standard CRV & Coverage Taxonomy Quiz", [
    { id: "ver_s1", prompt: "What does Toggle Coverage measure in digital verification?", choices: ["Whether every net and register bit has transitioned at least once from 0 to 1 AND from 1 to 0 during simulation", "The frequency of clock oscillators", "How fast flip-flops switch in picoseconds", "The temperature of the chip"], answer: 0, explain: "Toggle coverage verifies that bits are not stuck at 0 or stuck at 1 throughout testbench execution." },
    { id: "ver_s2", prompt: "Why is achieving 100% Code Coverage insufficient to prove design correctness?", choices: ["Code coverage only proves that every line/branch of RTL was executed, but does not prove whether the executed logic implemented the correct functional specification or handled unwritten corner cases", "Code coverage ignores Verilog files", "Code coverage is disabled in commercial simulators", "Code coverage only applies to C++ code"], answer: 0, explain: "If a required hardware state machine check was forgotten in the RTL, code coverage can still reach 100% while missing the bug entirely." },
    { id: "ver_s3", prompt: "What is the proper engineering procedure for handling Unreachable Code during verification signoff?", choices: ["Perform formal reachability analysis to mathematically prove unreachability, document the architectural rationale, and attach a formal waiver signed by the lead engineer", "Delete the code from the repository without telling anyone", "Lower the code coverage target from 100% to 80%", "Ignore it because code coverage does not matter"], answer: 0, explain: "Unreachable code must be formally verified and officially waived to ensure no dead logic conceals latent hardware defects." },
  ]),

  theory("verification", "expert", "verif-expert-interfaces", "Expert: SVA Temporal Logic, vPlan Formulation & Corner-Case Hunting", 18,
    "Assertion-Based Verification (ABV), Verification Plans (vPlan), clocking blocks, and out-of-order scoreboarding.",
    [
      "SystemVerilog Interfaces & Clocking Blocks: An `interface` bundles protocol wires with `modport` access permissions. A `clocking cb @(posedge clk)` specifies `#1step` input skew (sampling in the Preponed region) and `#1` output skew (driving in the Active region), preventing simulator race conditions.",
      "Assertion-Based Verification (ABV / SVA): Concurrent assertions evaluate temporal protocol properties across clock cycles: `assert property (@(posedge clk) disable iff (!rst_n) req |-> ##[1:3] ack);`. SVA temporal operators include `$rose`, `$fell`, `$past`, `$stable`, `throughout`, and `within`.",
      "Verification Plan (vPlan) Formulation: The vPlan decomposes the architectural specification into a structured matrix of: 1) Feature descriptions, 2) Testbench stimulus scenarios, 3) Functional coverpoints/crosses, 4) SVA protocol assertions, 5) Directed corner-case checks.",
      "Identifying Features & Corner Cases: Crucial corner cases include: FIFO simultaneous push and pop when full/empty, burst cross-boundary wrap-around, bus backpressure under maximum latency, asynchronous reset assertion during active transmission, and out-of-order response matching.",
    ]),

  practical(
    "verification",
    "expert",
    "verif-expert-practical",
    "Expert Practical: SVA Protocol Checker for Ready-Valid Handshake",
    25,
    "Write a formal SystemVerilog Assertion (SVA) protocol checker verifying AXI4-Stream / Ready-Valid handshaking rules.",
    [
      "Rule 1: When `valid` is high and `ready` is low, `valid` must remain asserted until `ready` arrives.",
      "Rule 2: When `valid` is high and `ready` is low, `data` payload must remain completely stable.",
      "Rule 3: After reset de-assertion, `valid` must not be high on cycle 0.",
    ],
    {
      language: "verilog",
      starter: `module sva_handshake_checker (
  input wire        clk,
  input wire        rst_n,
  input wire        valid,
  input wire        ready,
  input wire [31:0] data
);

  // TODO: Rule 1 - valid must stay high until ready is asserted
  // TODO: Rule 2 - data must stay stable while valid is held without ready

endmodule`,
      checks: [
        { id: "prop1", label: "Property for valid stability", kind: "regex", pattern: "property\\s+p_valid_stable" },
        { id: "prop2", label: "Property for data stability ($stable)", kind: "regex", pattern: "\\$stable\\(data\\)" },
        { id: "assert", label: "assert property statements", kind: "includes", pattern: "assert property" },
      ],
      solution: `module sva_handshake_checker (
  input wire        clk,
  input wire        rst_n,
  input wire        valid,
  input wire        ready,
  input wire [31:0] data
);

  // Rule 1: Once valid is asserted, it must stay asserted until ready acknowledges
  property p_valid_stable;
    @(posedge clk) disable iff (!rst_n)
    (valid && !ready) |=> valid;
  endproperty
  assert_valid_stable: assert property (p_valid_stable)
    else $error("[SVA FAIL] Valid dropped before Ready was asserted!");

  // Rule 2: Payload data must remain stable while valid is waiting for ready
  property p_data_stable;
    @(posedge clk) disable iff (!rst_n)
    (valid && !ready) |=> $stable(data);
  endproperty
  assert_data_stable: assert property (p_data_stable)
    else $error("[SVA FAIL] Data mutated while waiting for Ready acknowledge!");

  // Cover property: Handshake completed successfully in 1 cycle
  cover_immediate_ack: cover property (@(posedge clk) disable iff (!rst_n) valid && ready);

endmodule
`,
    }
  ),

  quiz("verification", "expert", "verif-expert-quiz", "Verification — Expert SVA, vPlan & Corner Cases Quiz", [
    { id: "ver_e1", prompt: "What is the purpose of `#1step` input skew in a SystemVerilog Clocking Block?", choices: ["It instructs the testbench to sample signals in the Preponed region just before the clock edge, completely eliminating simulation race conditions with RTL clock updates", "It delays the clock by 1 nanosecond", "It converts the testbench to asynchronous logic", "It disables assertions"], answer: 0, explain: "#1step samples values in the Preponed region prior to any active-region events of the current time step." },
    { id: "ver_e2", prompt: "In a Verification Plan (vPlan), what represents the link between the design specification and the verification results?", choices: ["Functional covergroups and SVA assertions mapped directly to each bulleted requirement in the architectural specification", "The directory path of the git repository", "The size of the waveform VCD file", "The clock period in nanoseconds"], answer: 0, explain: "The vPlan establishes full traceability between written specification requirements and executed functional coverage bins." },
    { id: "ver_e3", prompt: "What does the SVA built-in function `$stable(sig)` verify?", choices: ["The signal `sig` retained the exact same value between the previous clock edge and the current clock edge", "The signal is tied to GND", "The signal never has clock jitter", "The signal is in an analog domain"], answer: 0, explain: "$stable(sig) returns true if $past(sig) === sig." },
  ]),

  theory("verification", "master", "verif-master-close", "Master: Formal Signoff, Bug Lifecycle, Regression Farms & Tapeout Checklist", 20,
    "Achieving 100% functional/code coverage signoff, bug convergence tracking, Formal Verification (FPV), and post-silicon validation.",
    [
      "When Can You Stop Verifying?: Verification ends when sign-off criteria are met: 100% Code and Functional Coverage, Zero open critical bugs, full Regression suite passes cleanly ('Regression Green'), and the Bug Rate declines to near zero. A useful heuristic: if you run 10,000 new random seeds and are confident none will find a bug, verification is mature.",
      "The Verification Signoff Gate & Tapeout Checklist: A chip is verified and tapeout-ready only when: 1) **100% Functional Coverage** across all vPlan items, 2) **100% Code Coverage** (with all unreached paths formally waived), 3) **Zero Open Sev-1/Sev-2 Bugs**, 4) **Bug Convergence Curve Plateau** across 100,000+ random regression seeds, 5) **Gate-Level Simulation (PA-GLS)** clean with zero X-corruption.",
      "The Verification Bug Lifecycle: 1) Discovery via random regression failure -> 2) Extraction of minimal stand-alone reproducer testcase -> 3) Filing bug ticket with log/waveform in tracking system -> 4) RTL bug fix by design engineer -> 5) Verification re-run across 50,000 seeds to ensure zero regression side-effects -> 6) Formal closure.",
      "Formal Property Verification (FPV): Simulation tests what you thought to randomize; Formal verification (JasperGold, Questa Formal) mathematically proves that properties hold across *all possible input combinations and time depths*, finding deep algorithmic bugs and arbitration deadlocks that simulation misses.",
      "Post-Silicon Validation & Team Handoff: Pre-silicon verification models are handed off to post-silicon validation teams to create ATE tester patterns and embedded bare-metal bring-up firmware, closing the loop on physical silicon behavior.",
      "How AI is Changing Verification: AI is revolutionizing DV. **Coverage Closure Acceleration** (e.g., Synopsys VSO.ai) analyzes gaps and auto-generates stimulus. **LLM-Assisted Generation** drafts UVM components and SVA properties from specs. **AI-Assisted Debug** analyzes simulation logs to group root causes. **Agentic Verification** features autonomous AI agents that simulate, analyze, and iterate toward closure automatically.",
    ]),

  practical(
    "verification",
    "master",
    "verif-master-practical",
    "Master Practical: Automated Regression Farm & Coverage Merge Script",
    30,
    "Write a production Tcl / Python verification regression script dispatching random seeds, checking logs for fatal errors, and merging UCDB coverage.",
    [
      "Execute 10 random seed simulations with unique seed numbers.",
      "Parse simulation logs to verify zero assertions failures or `$fatal` errors.",
      "Merge individual coverage databases into a single cumulative `total_signoff.ucdb`.",
      "Generate HTML coverage report and assert if overall coverage is under 98%.",
    ],
    {
      language: "tcl",
      starter: `# Automated Verification Regression Suite: run_regression.tcl

# TODO: Step 1 - Loop through 10 seeds and execute simulation
# TODO: Step 2 - Check log files for UVM_ERROR or UVM_FATAL
# TODO: Step 3 - Merge UCDB coverage databases
# TODO: Step 4 - Generate coverage QoR report`,
      checks: [
        { id: "loop", label: "Seed iteration loop", kind: "regex", pattern: "for\\s*\\{|foreach\\s+seed" },
        { id: "merge", label: "Coverage merge command", kind: "regex", pattern: "merge|urg|vcover" },
        { id: "chk", label: "Log error parsing", kind: "regex", pattern: "UVM_ERROR|UVM_FATAL|grep" },
      ],
      solution: `# Automated Verification Regression Suite: run_regression.tcl
set SEED_COUNT 10
set PASSED_COUNT 0
set UCDB_FILES {}

puts "INFO: Launching Coverage-Driven Verification Regression Suite (Seeds: $SEED_COUNT)..."

for {set seed 1} {$seed <= $SEED_COUNT} {incr seed} {
  set log_file "logs/sim_seed_\${seed}.log"
  set ucdb_file "cov/seed_\${seed}.ucdb"
  
  # Execute simulation with unique random seed
  exec vsim -c -sv_seed $seed -coverage -do "run -all; coverage save $ucdb_file; quit" > $log_file
  
  # Audit Log Health
  if {[catch {exec grep -E "UVM_ERROR|UVM_FATAL|Assertion error" $log_file} err]} {
    incr PASSED_COUNT
    lappend UCDB_FILES $ucdb_file
    puts "  [PASS] Seed $seed completed cleanly."
  } else {
    puts "  [FAIL] Seed $seed detected verification error! Check $log_file"
  }
}

# Merge Cumulative Coverage Databases
puts "INFO: Merging $PASSED_COUNT coverage databases into total_signoff.ucdb..."
exec vcover merge total_signoff.ucdb {*}$UCDB_FILES
exec vcover report -html -output cov_html total_signoff.ucdb

puts "SUCCESS: Regression Complete. $PASSED_COUNT / $SEED_COUNT Seeds Passed."
`,
    }
  ),

  quiz("verification", "master", "verif-master-quiz", "Verification — Master Signoff & Formal Proofs Exam", [
    { id: "ver_m1", prompt: "Prior to tapeout signoff, code coverage reports 96% branch coverage due to 4 un-exercised error branches. The proper engineering procedure is:", choices: ["Investigate the 4 branches; if unreachable by hardware architecture, document formal proof waivers signed by the design lead; never tape out with unanalyzed coverage holes", "Ignore the 4% and tape out", "Delete the 4 branches from the RTL code", "Change the coverage threshold to 90%"], answer: 0, explain: "Every uncovered branch is a potential hidden bug; unreachable branches must be mathematically proven and formally waived." },
    { id: "ver_m2", prompt: "How does Formal Property Verification (FPV) fundamentally differ from simulation?", choices: ["Formal verification uses mathematical model checking to exhaustively prove whether a property holds across ALL possible input sequences, whereas simulation only checks the specific randomized input vectors executed", "Formal is only run on FPGA hardware", "Formal requires testbenches with clock generators", "Formal only checks line coverage"], answer: 0, explain: "Formal verification provides mathematical proof across the entire state space without testbench stimulus." },
    { id: "ver_m3", prompt: "What does a plateau in a verification Bug Convergence Curve indicate?", choices: ["New bugs are tapering off and the design is stabilizing toward tapeout readiness, provided regression seed count and coverage remain high", "The simulation farm has crashed", "All testbenches have failed", "RTL compilation is broken"], answer: 0, explain: "A bug plateau under high constrained-random regression volume indicates mature design stability." },
  ]),

  // ——— UVM Track (4 Layers) ———
  theory("uvm", "beginner", "uvm-beginner", "Beginner: UVM Class Hierarchy, Factory Registration & Components", 16,
    "The standard Universal Verification Methodology class tree, factory macros, and component construction.",
    [
      "Why UVM (Universal Verification Methodology)?: Without a standard methodology, every semiconductor team reinvents drivers, monitors, and scoreboards from scratch. UVM (IEEE 1800.2) provides a standardized, object-oriented SystemVerilog class library enabling modular, reusable verification components (VIP).",
      "UVM Class Hierarchy: 1) `uvm_object`: Lightweight data classes (transactions, sequence items, configuration objects); 2) `uvm_component`: Quasi-static hierarchical testbench blocks (`uvm_driver`, `uvm_monitor`, `uvm_sequencer`, `uvm_scoreboard`, `uvm_agent`, `uvm_env`, `uvm_test`) created in `build_phase`.",
      "UVM Factory & Registration: All classes must be registered with the factory using macros: `\`uvm_component_utils(my_driver)` or `\`uvm_object_utils(my_transaction)`. The factory allows tests to swap component types or sequence items at runtime using factory overrides without editing environment code!",
    ]),

  practical(
    "uvm",
    "beginner",
    "uvm-beginner-practical",
    "Beginner Practical: UVM Transaction Item & Driver Skeleton",
    20,
    "Implement a synthesizable UVM sequence item and driver component with factory registration.",
    [
      "Declare `class alu_item extends uvm_sequence_item` with `rand bit [7:0] a, b` and `rand bit [1:0] op`.",
      "Register with `\`uvm_object_utils(alu_item)`.",
      "Declare `class alu_driver extends uvm_driver #(alu_item)` with `\`uvm_component_utils`.",
      "Implement `run_phase` fetching items from `seq_item_port` (`get_next_item` -> drive -> `item_done`).",
    ],
    {
      language: "verilog",
      starter: `\`include "uvm_macros.svh"
import uvm_pkg::*;

// TODO: Step 1 - Declare alu_item extending uvm_sequence_item
// TODO: Step 2 - Declare alu_driver extending uvm_driver #(alu_item)`,
      checks: [
        { id: "item", label: "alu_item extends uvm_sequence_item", kind: "regex", pattern: "class\\s+alu_item\\s+extends\\s+uvm_sequence_item" },
        { id: "drv", label: "alu_driver extends uvm_driver", kind: "regex", pattern: "class\\s+alu_driver\\s+extends\\s+uvm_driver" },
        { id: "mac", label: "uvm_component_utils and uvm_object_utils", kind: "regex", pattern: "`uvm_component_utils|`uvm_object_utils" },
        { id: "port", label: "seq_item_port get_next_item and item_done", kind: "regex", pattern: "get_next_item[\\s\\S]*item_done" },
      ],
      solution: `\`include "uvm_macros.svh"
import uvm_pkg::*;

// 1. UVM Sequence Item Definition
class alu_item extends uvm_sequence_item;
  rand bit [7:0] a, b;
  rand bit [1:0] op;
  bit [8:0]      result;

  \`uvm_object_utils(alu_item)

  function new(string name = "alu_item");
    super.new(name);
  endfunction
endclass

// 2. UVM Driver Component Definition
class alu_driver extends uvm_driver #(alu_item);
  \`uvm_component_utils(alu_driver)

  function new(string name = "alu_driver", uvm_component parent = null);
    super.new(name, parent);
  endfunction

  virtual task run_phase(uvm_phase phase);
    alu_item item;
    forever begin
      seq_item_port.get_next_item(item);
      // Drive transaction onto physical virtual interface
      #10;
      seq_item_port.item_done();
    end
  endtask
endclass
`,
    }
  ),

  quiz("uvm", "beginner", "uvm-beginner-quiz", "UVM — Beginner Hierarchy & Factory Quiz", [
    { id: "uvm_b1", prompt: "What is the key difference between a `uvm_object` and a `uvm_component`?", choices: ["`uvm_component` exists throughout the entire simulation with a fixed position in the hierarchy tree; `uvm_object` is dynamic and created/destroyed on the fly (e.g. data packets)", "`uvm_object` runs in synthesis only", "`uvm_component` cannot use factory registration", "They are identical"], answer: 0, explain: "Components form the static testbench infrastructure; objects represent dynamic transactions and configuration items." },
    { id: "uvm_b2", prompt: "What is the purpose of UVM Factory Overrides (`set_type_override_by_type`)?", choices: ["To swap a component or transaction implementation with a specialized derived class in a specific test without modifying any existing testbench files", "To reset the simulation time to 0", "To synthesize gates into GDS layout", "To overclock the CPU"], answer: 0, explain: "The factory enables polymorphism and component substitution for test specialization without code mutation." },
    { id: "uvm_b3", prompt: "In UVM, what starts the simulation testbench?", choices: ["Calling `run_test(\"my_test_name\")` in the top-level module initial block", "Calling `$finish`", "Asserting reset for 100ns", "Generating a clock"], answer: 0, explain: "run_test() instantiates the root uvm_top, builds the test class, and starts the phase execution pipeline." },
  ]),

  theory("uvm", "standard", "uvm-standard-phases", "Standard: UVM Execution Phases, Objections & TLM Communication", 18,
    "The 9-step execution lifecycle, objection management, and Transaction Level Modeling (TLM) analysis ports.",
    [
      "UVM Phase Lifecycle: 1) `build_phase` (Top-down component instantiation and `config_db` lookup); 2) `connect_phase` (Bottom-up TLM port wiring); 3) `end_of_elaboration_phase`; 4) `start_of_simulation_phase`; 5) `run_phase` (Time-consuming `task` driving stimulus); 6) `extract_phase`; 7) `check_phase` (Scoreboard mismatch validation); 8) `report_phase` (QoR pass/fail printout); 9) `final_phase`.",
      "UVM Objections (`raise_objection` / `drop_objection`): The UVM `run_phase` ends automatically when all active objections are dropped. Tests or virtual sequences raise an objection (`phase.raise_objection(this)`) at the start of a test and drop it (`phase.drop_objection(this)`) upon sequence completion.",
      "TLM (Transaction Level Modeling) Ports: Monitors broadcast decoded transaction packets via `uvm_analysis_port #(T)`. Scoreboards and coverage collectors receive packets via `uvm_analysis_imp #(T, this)` or `uvm_tlm_analysis_fifo #(T)` without knowing the monitor's class type.",
      "Configuration Database (`uvm_config_db`): Pass parameters, virtual interfaces, and knobs across hierarchical components: `uvm_config_db#(virtual alu_if)::set(this, \"env.agent*\", \"vif\", vif)` and retrieved via `uvm_config_db#(virtual alu_if)::get(this, \"\", \"vif\", vif)`.",
    ]),

  practical(
    "uvm",
    "standard",
    "uvm-standard-practical",
    "Standard Practical: UVM TLM Scoreboard & Analysis Port Interconnect",
    25,
    "Implement a UVM Scoreboard with an analysis implementation export receiving packets and comparing against an expected model.",
    [
      "Declare `class alu_scoreboard extends uvm_scoreboard`.",
      "Declare `uvm_analysis_imp #(alu_item, alu_scoreboard) item_collected_export`.",
      "Implement the `write(alu_item item)` function checking `result` against `a + b`.",
    ],
    {
      language: "verilog",
      starter: `\`include "uvm_macros.svh"
import uvm_pkg::*;

// TODO: Implement alu_scoreboard with uvm_analysis_imp and write() function
class alu_scoreboard extends uvm_scoreboard;

endclass`,
      checks: [
        { id: "scb", label: "alu_scoreboard class", kind: "regex", pattern: "class\\s+alu_scoreboard\\s+extends\\s+uvm_scoreboard" },
        { id: "imp", label: "uvm_analysis_imp declaration", kind: "includes", pattern: "uvm_analysis_imp" },
        { id: "write", label: "write(alu_item item) function", kind: "regex", pattern: "function\\s+void\\s+write\\s*\\(" },
      ],
      solution: `\`include "uvm_macros.svh"
import uvm_pkg::*;

class alu_scoreboard extends uvm_scoreboard;
  \`uvm_component_utils(alu_scoreboard)

  uvm_analysis_imp #(alu_item, alu_scoreboard) item_collected_export;
  integer match_count = 0;
  integer mismatch_count = 0;

  function new(string name = "alu_scoreboard", uvm_component parent = null);
    super.new(name, parent);
    item_collected_export = new("item_collected_export", this);
  endfunction

  virtual function void write(alu_item item);
    bit [8:0] expected;
    case (item.op)
      2'b00: expected = item.a + item.b;
      2'b01: expected = item.a - item.b;
      2'b10: expected = item.a & item.b;
      2'b11: expected = item.a | item.b;
    endcase

    if (item.result === expected) begin
      match_count++;
    end else begin
      mismatch_count++;
      \`uvm_error("SCB_MISMATCH", $sformatf("Mismatch: A=%h B=%h OP=%b | Got: %h, Exp: %h", item.a, item.b, item.op, item.result, expected))
    end
  endfunction

  virtual function void report_phase(uvm_phase phase);
    \`uvm_info("SCB_REPORT", $sformatf("Scoreboard Audit: %0d Matches, %0d Mismatches.", match_count, mismatch_count), UVM_LOW)
  endfunction
endclass
`,
    }
  ),

  quiz("uvm", "standard", "uvm-standard-quiz", "UVM — Standard Phases, TLM & Config DB Quiz", [
    { id: "uvm_s1", prompt: "Why does `build_phase` execute top-down while `connect_phase` executes bottom-up in UVM?", choices: ["`build_phase` must create parent containers (env, agent) before sub-components can be instantiated; `connect_phase` wires ports from child leaves up to parent exports after all components exist", "It is an arbitrary simulator convention", "To save CPU memory", "To support Verilog 1995"], answer: 0, explain: "Build instantiates the tree from root to leaves; Connect wires TLM connections from leaves to parents once instances exist." },
    { id: "uvm_s2", prompt: "What happens if a test forgets to call `phase.raise_objection(this)` inside `run_phase`?", choices: ["The `run_phase` terminates immediately at simulation time 0 because the phase manager sees zero active objections", "The simulation runs infinitely", "The compiler throws a syntax error", "The clock frequency doubles"], answer: 0, explain: "Without active objections, the UVM phase engine assumes no component needs time and immediately ends the run_phase." },
    { id: "uvm_s3", prompt: "What is the role of `uvm_config_db` in UVM testbenches?", choices: ["A centralized typed key-value database allowing parent components (e.g. uvm_test) to pass virtual interface handles and configuration knobs down to deeply nested agents and drivers", "A database for storing gate-level netlists", "A tool for generating SDC constraints", "A flash memory emulator"], answer: 0, explain: "config_db decouples component configuration from rigid structural constructor arguments." },
  ]),

  theory("uvm", "expert", "uvm-expert-sequences", "Expert: Sequences, Virtual Sequences & Register Abstraction Layer (RAL)", 18,
    "Generating multi-protocol stimulus streams, virtual sequencer arbitration, and memory-mapped register models.",
    [
      "UVM Sequence & Sequencer Handshake: Sequences encapsulate transaction generation logic separate from static drivers: 1) `start_item(req)` (requests sequencer arbitration) -> 2) `finish_item(req)` (hands packet to driver and blocks until driven) -> 3) `get_response(rsp)` (captures DUT response).",
      "Virtual Sequences: High-level SoC tests must coordinate multiple independent interfaces (e.g. configuring an APB control register, starting an AXI DMA stream, and watching an Ethernet output). A **Virtual Sequence** runs on a `virtual_sequencer` with handles to multiple sub-sequencers, orchestrating multi-protocol transactions seamlessly.",
      "Register Abstraction Layer (RAL): UVM RAL (`uvm_reg_block`, `uvm_reg`) creates an object-oriented mirror of all memory-mapped hardware registers. Features include: 1) **Frontdoor Access** (generates real physical bus transactions via `uvm_reg_adapter`), 2) **Backdoor Access** (0-time simulator poke via hierarchical HDL path), 3) Automatic register test suites (reset check, bit-bash, and read/write check).",
    ]),

  practical(
    "uvm",
    "expert",
    "uvm-expert-practical",
    "Expert Practical: UVM Register Adapter & Frontdoor Access Sequence",
    25,
    "Implement a `uvm_reg_adapter` translating generic `uvm_reg_bus_op` transactions into physical protocol sequence items.",
    [
      "Declare `class apb_reg_adapter extends uvm_reg_adapter`.",
      "Implement `reg2bus(const ref uvm_reg_bus_op rw)` converting register accesses to `apb_item`.",
      "Implement `bus2reg(uvm_sequence_item bus_item, ref uvm_reg_bus_op rw)` extracting read data back into the RAL model.",
    ],
    {
      language: "verilog",
      starter: `\`include "uvm_macros.svh"
import uvm_pkg::*;

// TODO: Implement apb_reg_adapter extending uvm_reg_adapter
class apb_reg_adapter extends uvm_reg_adapter;

endclass`,
      checks: [
        { id: "adp", label: "apb_reg_adapter class", kind: "regex", pattern: "class\\s+apb_reg_adapter\\s+extends\\s+uvm_reg_adapter" },
        { id: "r2b", label: "reg2bus implementation", kind: "includes", pattern: "reg2bus" },
        { id: "b2r", label: "bus2reg implementation", kind: "includes", pattern: "bus2reg" },
      ],
      solution: `\`include "uvm_macros.svh"
import uvm_pkg::*;

class apb_reg_adapter extends uvm_reg_adapter;
  \`uvm_object_utils(apb_reg_adapter)

  function new(string name = "apb_reg_adapter");
    super.new(name);
    supports_byte_enable = 0;
    provides_responses = 1;
  endfunction

  virtual function uvm_sequence_item reg2bus(const ref uvm_reg_bus_op rw);
    apb_item pkt = apb_item::type_id::create("pkt");
    pkt.we   = (rw.kind == UVM_WRITE);
    pkt.addr = rw.addr;
    pkt.data = rw.data;
    return pkt;
  endfunction

  virtual function void bus2reg(uvm_sequence_item bus_item, ref uvm_reg_bus_op rw);
    apb_item pkt;
    if (!$cast(pkt, bus_item)) begin
      \`uvm_fatal("ADAPTER_ERR", "Failed to cast bus_item to apb_item")
      return;
    end
    rw.kind   = pkt.we ? UVM_WRITE : UVM_READ;
    rw.addr   = pkt.addr;
    rw.data   = pkt.data;
    rw.status = pkt.err ? UVM_NOT_OK : UVM_IS_OK;
  endfunction
endclass
`,
    }
  ),

  quiz("uvm", "expert", "uvm-expert-quiz", "UVM — Expert Sequences, RAL & Virtual Sequencer Quiz", [
    { id: "uvm_e1", prompt: "What is the primary architectural purpose of a Virtual Sequence in UVM?", choices: ["To coordinate and synchronize stimulus across multiple independent VIP agents without driving physical pins directly", "To speed up gate-level simulation by 100x", "To synthesize standard cell gates", "To replace SDC constraints"], answer: 0, explain: "Virtual sequences orchestrate sub-sequences running on distinct physical sequencers across complex multi-interface SoCs." },
    { id: "uvm_e2", prompt: "What is the fundamental difference between RAL Frontdoor access and Backdoor access?", choices: ["Frontdoor executes actual physical bus protocol cycles (e.g. APB/AXI transactions); Backdoor deposits values directly into simulator memory at simulation time 0 using hierarchical HDL paths", "Frontdoor access uses flash memory; Backdoor uses RAM", "Backdoor access is synthesizable", "Frontdoor access cannot read status registers"], answer: 0, explain: "Frontdoor verifies the physical bus interface; Backdoor enables fast zero-time pre-loading and status snooping." },
    { id: "uvm_e3", prompt: "What does the `uvm_reg_adapter` component do in a RAL environment?", choices: ["It bidirectionally translates generic UVM register read/write operations (uvm_reg_bus_op) into physical bus protocol sequence items (e.g. apb_item / axi_item)", "It converts binary to ASCII", "It compiles Verilog code", "It measures clock jitter"], answer: 0, explain: "The adapter bridges the abstract RAL register API to the concrete transaction items driven by the physical agent." },
  ]),

  theory("uvm", "master", "uvm-master-scale", "Master: Enterprise VIP Architecture, Callbacks & Signoff-Ready Regressions", 20,
    "Building commercial-grade verification IP (VIP), layered error injection, and automated enterprise regression farms.",
    [
      "Enterprise VIP (Verification IP) Architecture: A commercial-grade VIP package includes: 1) Configurable Active/Passive agent modes, 2) Comprehensive SVA protocol assertion modules, 3) Full functional covergroups, 4) Pre-built virtual sequences (reset, sanity, burst, error injection), 5) Clean TLM analysis ports.",
      "UVM Callbacks (`uvm_callback`): Injecting protocol errors (e.g. corrupting CRC, parity errors, illegal response codes) without editing the golden driver source code. The driver invokes `\`uvm_do_callbacks(my_driver, my_cb_class, pre_send(item))` allowing tests to attach custom error-injection hooks at runtime.",
      "Regression Management & Triage: Farm test suites run 10,000+ random seeds. Automated triage scripts extract seed, failure signature, and stack trace, clustering identical bug root causes into bug tracking tickets (Jira) to accelerate tapeout closure.",
    ]),

  practical(
    "uvm",
    "master",
    "uvm-master-practical",
    "Master Practical: Complete UVM Environment with Callback Error Injection",
    30,
    "Implement an enterprise UVM Environment with Active/Passive Agent configuration, custom error-injection callback, and Scoreboard.",
    [
      "Declare `virtual class driver_callback extends uvm_callback` with `pre_send` hook.",
      "Declare `class soc_env extends uvm_env` instantiating master agent, slave agent, and scoreboard.",
      "Implement `connect_phase` wiring TLM ports and registering callback hooks.",
    ],
    {
      language: "verilog",
      starter: `\`include "uvm_macros.svh"
import uvm_pkg::*;

// TODO: Step 1 - Declare uvm_callback base class
// TODO: Step 2 - Declare soc_env with agents and scoreboard
// TODO: Step 3 - Wire TLM in connect_phase`,
      checks: [
        { id: "cb", label: "uvm_callback definition", kind: "regex", pattern: "class\\s+\\w+\\s+extends\\s+uvm_callback" },
        { id: "env", label: "soc_env extends uvm_env", kind: "regex", pattern: "class\\s+soc_env\\s+extends\\s+uvm_env" },
        { id: "conn", label: "connect_phase TLM wiring", kind: "includes", pattern: "connect_phase" },
      ],
      solution: `\`include "uvm_macros.svh"
import uvm_pkg::*;

// 1. UVM Callback Definition for Error Injection
virtual class alu_driver_cb extends uvm_callback;
  \`uvm_object_utils(alu_driver_cb)
  function new(string name = "alu_driver_cb"); super.new(name); endfunction
  virtual task pre_send(alu_driver drv, alu_item item); endtask
endclass

// 2. Enterprise SoC UVM Environment
class soc_env extends uvm_env;
  \`uvm_component_utils(soc_env)

  alu_agent      m_agent;
  alu_scoreboard m_scoreboard;

  function new(string name = "soc_env", uvm_component parent = null);
    super.new(name, parent);
  endfunction

  virtual function void build_phase(uvm_phase phase);
    super.build_phase(phase);
    m_agent      = alu_agent::type_id::create("m_agent", this);
    m_scoreboard = alu_scoreboard::type_id::create("m_scoreboard", this);
  endfunction

  virtual function void connect_phase(uvm_phase phase);
    super.connect_phase(phase);
    // Wire Monitor Analysis Port to Scoreboard Implementation Export
    m_agent.m_monitor.item_collected_port.connect(m_scoreboard.item_collected_export);
  endfunction
endclass
`,
    }
  ),

  quiz("uvm", "master", "uvm-master-quiz", "UVM — Master Enterprise VIP & Callbacks Exam", [
    { id: "uvm_m1", prompt: "How do UVM Callbacks enable clean error injection in VIP testbenches?", choices: ["Callbacks allow tests to register custom pre/post transaction hooks that modify packet payloads or protocol signals without modifying the VIP source code", "Callbacks disable all assertions", "Callbacks rewrite the Verilog netlist", "Callbacks bypass the UVM factory"], answer: 0, explain: "Callbacks provide non-intrusive extension hooks for negative testing and error injection." },
    { id: "uvm_m2", prompt: "In a scalable UVM testbench, an Agent should support which two operational modes?", choices: ["Active mode (instantiates Sequencer, Driver, and Monitor to stimulate DUT) and Passive mode (instantiates only Monitor to observe traffic)", "Synthesis mode and GDS mode", "Fast mode and Slow mode", "Analog mode and Digital mode"], answer: 0, explain: "Passive agents snoop on interfaces driven by other modules or external VIP without actively driving pins." },
    { id: "uvm_m3", prompt: "What is the primary role of automated Failure Triage in large-scale UVM regressions?", choices: ["To cluster thousands of random seed failures by assertion name, mismatch signature, and stack trace to pinpoint the underlying root-cause bug quickly", "To delete failed test logs", "To re-run passing tests", "To format SDC constraints"], answer: 0, explain: "Triage automation groups symptoms from thousands of distributed runs into discrete actionable defects." },
  ]),

  // ——— EDA Scripting: Tcl Track (4 Layers) ———
  theory("tcl", "beginner", "tcl-beginner", "Beginner: Tcl language — variables, if, loops, lists, proc", 22,
    "A W3Schools-style Tcl handbook: scalars, quoting, expr, if/switch, for/foreach/while, lists, and procedures. Run every example in the lab.",
    [
      `## 1. Variables

CODE tcl
set freq_mhz 500
set period_ns [expr {1000.0 / $freq_mhz}]
puts "period = $period_ns ns"
ENDCODE

- Create / write: \`set name value\`
- Read: \`$name\`
- Exists?: \`info exists name\`
- Delete: \`unset name\`
- Increment: \`incr i\` or \`incr i -1\`

TABLE
Want | Wrong | Right
---
Math | \`set x 1+2\` (string "1+2") | \`set x [expr {1+2}]\`
Print var | \`puts name\` (prints the word name) | \`puts $name\`
Literal $ | \`"cost $5"\` (looks up var 5) | \`"cost \\$5"\` or \`{cost $5}\`
ENDTABLE

## 2. Conditions

CODE tcl
set wns -0.12
if {$wns < 0} {
  puts "VIOLATED"
} elseif {$wns == 0} {
  puts "ON MET"
} else {
  puts "MET"
}
ENDCODE

- Operators inside \`expr\` / \`if { ... }\`: \`== != < > <= >= && || !\`
- Strings: \`string equal $a $b\` or \`string match clk* $n\`
- \`switch -exact $cmd { read { ... } write { ... } default { ... } }\`

## 3. Loops

COMPARE
Loop | When | Skeleton
---
foreach | Walk a list of names | \`foreach n $clocks { ... }\`
for | Counted | \`for {set i 0} {$i < 4} {incr i} { ... }\`
while | Until a flag drops | \`while {$n > 0} { incr n -1 }\`
ENDCOMPARE

TRY tcl
set n 0
for {set i 0} {$i < 3} {incr i} {
  incr n
  puts "i=$i n=$n"
}
ENDTRY

## 4. Lists

A list is a string with list quoting. Pin groups, corners, clock names — all lists.

- Build: \`set clocks [list clk_core clk_mem]\` or \`{clk_core clk_mem}\`
- Length: \`llength $clocks\`
- Index: \`lindex $clocks 0\` (first)
- Append: \`lappend clocks clk_scan\`
- Split path: \`split $inst /\`   Join: \`join $parts /\`

## 5. Procedures (functions)

CODE tcl
proc period_ns {freq_mhz {margin 0.1}} {
  set raw [expr {1000.0 / $freq_mhz}]
  return [expr {$raw * (1.0 - $margin)}]
}
puts [period_ns 200]
ENDCODE

- \`proc name {args} {body}\` — body is usually braced so it is not run at define time
- Default args: \`{margin 0.1}\`
- Extra args: last parameter named \`args\`
- Return value: \`return $x\` (or last command result)

Q: Why \`foreach_in_collection\` later, not \`foreach\`, in PrimeTime?
A: \`get_cells\` returns an opaque collection handle, not a Tcl list. \`llength\` on it is 1. Use \`sizeof_collection\` / \`foreach_in_collection\` in the tool. This lab is core Tcl.

NOTE: Use the try-it lab at the top. Change numbers, hit Run. That is how Tcl is learned — not by staring at dc_shell screenshots.
`,
    ]),

  practical(
    "tcl",
    "beginner",
    "tcl-beginner-practical",
    "Beginner Practical: Automated SDC Clock Generation & Slack Margin Checker",
    25,
    "Write a reusable Tcl procedure that calculates clock period from target frequency in MHz and generates formatted SDC create_clock commands.",
    [
      "Define procedure `generate_clock_sdc` taking `port_name`, `freq_mhz`, and `uncertainty_ps`.",
      "Calculate period in nanoseconds using `expr {1000.0 / $freq_mhz}`.",
      "Generate the formatted `create_clock` and `set_clock_uncertainty` constraint strings.",
      "Return the generated SDC string and print diagnostic information with `puts`.",
    ],
    {
      language: "tcl",
      starter: `# Tcl Beginner Practical: Clock Constraint Generator
# TODO: Step 1 - Define proc generate_clock_sdc
# TODO: Step 2 - Calculate period in ns from MHz
# TODO: Step 3 - Format create_clock and set_clock_uncertainty`,
      checks: [
        { id: "proc", label: "proc definition", kind: "regex", pattern: "proc\\s+generate_clock_sdc" },
        { id: "expr", label: "expr math calculation", kind: "includes", pattern: "expr" },
        { id: "create_clk", label: "create_clock SDC string", kind: "includes", pattern: "create_clock" },
        { id: "unc", label: "set_clock_uncertainty SDC string", kind: "includes", pattern: "set_clock_uncertainty" },
      ],
      solution: `# Tcl Beginner Practical: Clock Constraint Generator

proc generate_clock_sdc {port_name freq_mhz uncertainty_ps} {
  # 1. Compute Period in Nanoseconds: T(ns) = 1000 / F(MHz)
  set period_ns [expr {1000.0 / $freq_mhz}]
  set unc_ns    [expr {$uncertainty_ps / 1000.0}]

  puts "INFO: Generating SDC for port '$port_name' at $freq_mhz MHz (Period: $period_ns ns, Uncertainty: $unc_ns ns)..."

  # 2. Build SDC Commands
  set sdc_lines {}
  lappend sdc_lines "create_clock -name $port_name -period $period_ns \[get_ports $port_name\]"
  lappend sdc_lines "set_clock_uncertainty $unc_ns \[get_clocks $port_name\]"

  # 3. Return Combined SDC Block
  return [join $sdc_lines "\n"]
}

# Test the procedure
set result_sdc [generate_clock_sdc "clk_core" 200.0 50.0]
puts "\nGenerated SDC Block:\n$result_sdc"
`,
    }
  ),

  quiz("tcl", "beginner", "tcl-beginner-quiz", "Tcl — Beginner Syntax & Shell Quiz", [
    { id: "tcl_b1", prompt: "In Tcl, what is the key difference between double quotes `\"...\"` and curly braces `{...}`?", choices: ["Double quotes allow variable and command interpolation (`$var`, `[cmd]`); curly braces disable all substitutions and treat text as a literal string", "Curly braces compile into C++", "Double quotes are only for comments", "Curly braces only allow integers"], answer: 0, explain: "Curly braces provide pure deferred literal grouping without evaluating $ or []." },
    { id: "tcl_b2", prompt: "How do you evaluate mathematical expressions in Tcl?", choices: ["Using the `expr { ... }` command", "By writing `calc(a + b)`", "By using the `+` operator directly like `set x a + b`", "By invoking Python"], answer: 0, explain: "Tcl uses `expr { ... }` for numeric evaluation, and bracing the expression prevents double-substitution overhead." },
    { id: "tcl_b3", prompt: "What command outputs text to the standard EDA console in Tcl?", choices: ["`puts \"message\"`", "`print(\"message\")`", "`echo \"message\"`", "`display(\"message\")`"], answer: 0, explain: "`puts` is the standard Tcl output command." },
  ]),

  theory("tcl", "standard", "tcl-standard-collections", "Standard: EDA Collections API, Objects & Filter Iterators", 18,
    "Querying design databases using EDA collection handles (`get_cells`, `get_pins`, `get_nets`), filtering, and batch inspection.",
    [
      "The EDA Collection Model: Commercial and open-source EDA tools store physical design databases in high-performance C++ graph structures. Commands like `get_cells`, `get_pins`, `get_nets`, and `get_ports` return opaque pointer handles called **Collections** rather than standard Tcl string lists.",
      "Iterating with `foreach_in_collection`: Never use standard Tcl `foreach` or `llength` on EDA collection objects! Doing so forces string conversion and causes severe performance degradation or crashes. Always use `foreach_in_collection handle [get_pins ...] { ... }` and `sizeof_collection $col`.",
      "Database Filtering with `-filter`: Use `-filter` to perform fast in-engine database searches: `get_cells -hier -filter \"is_sequential == true && is_hierarchical == false\"` or `get_pins -of_objects [get_cells u_alu/*] -filter \"direction == out\"`.",
      "Querying Object Properties: Use `get_property` (or `get_attribute`) to inspect object properties: `set cell_slack [get_property [get_pins u_reg/D] slack]` and `set_dont_touch [get_nets clk_tree*] true`.",
    ]),

  practical(
    "tcl",
    "standard",
    "tcl-standard-practical",
    "Standard Practical: High-Fanout Net (HFN) & Violating Buffer Hunter",
    25,
    "Write an EDA Tcl script that queries all high-fanout nets exceeding a threshold and generates ECO buffer insertion commands.",
    [
      "Define procedure `report_high_fanout_nets` taking `max_fanout_limit`.",
      "Use `all_high_fanout -nets` or filter nets by `fanout > $max_fanout_limit`.",
      "Iterate through the collection using `foreach_in_collection`.",
      "Generate an automated ECO script recommending buffer insertion (`insert_buffer`).",
    ],
    {
      language: "tcl",
      starter: `# Tcl Standard Practical: High-Fanout Net Analyzer
# TODO: Step 1 - Proc report_high_fanout_nets with fanout threshold
# TODO: Step 2 - Query nets and iterate with foreach_in_collection
# TODO: Step 3 - Output ECO buffer insertion commands`,
      checks: [
        { id: "feic", label: "foreach_in_collection iterator", kind: "includes", pattern: "foreach_in_collection" },
        { id: "prop", label: "get_property or sizeof_collection", kind: "regex", pattern: "get_property|sizeof_collection|get_attribute" },
        { id: "eco", label: "insert_buffer command generation", kind: "includes", pattern: "insert_buffer" },
      ],
      solution: `# Tcl Standard Practical: High-Fanout Net Analyzer

proc report_high_fanout_nets {max_fanout_limit} {
  puts "INFO: Searching design database for nets with fanout > $max_fanout_limit..."

  # 1. Query high fanout net collection
  set hfn_collection [get_nets -hier -filter "fanout > $max_fanout_limit"]
  set hfn_count [sizeof_collection $hfn_collection]

  puts "Found $hfn_count High-Fanout Nets exceeding threshold of $max_fanout_limit.\n"
  
  set eco_commands {}

  # 2. Iterate through opaque EDA collection handles
  foreach_in_collection net_ptr $hfn_collection {
    set net_name   [get_property $net_ptr full_name]
    set net_fanout [get_property $net_ptr fanout]
    set drv_pin    [get_property $net_ptr driver_pins]

    puts "  [HFN VIOLATION] Net: $net_name | Fanout: $net_fanout | Driver: $drv_pin"
    
    # Generate Recommended ECO Buffer Tree Insertion
    lappend eco_commands "insert_buffer -net $net_name -cell sky130_fd_sc_hd__clkbuf_8 -prefix eco_hfn_buf"
  }

  puts "\nGenerated ECO Fix Script:\n[join $eco_commands "\n"]"
  return $eco_commands
}
`,
    }
  ),

  quiz("tcl", "standard", "tcl-standard-quiz", "Tcl — Standard Collections & Properties Quiz", [
    { id: "tcl_s1", prompt: "Why is `sizeof_collection` required instead of standard Tcl `llength` when measuring EDA query results?", choices: ["EDA query results are opaque C++ database collection handles; `llength` treats the handle string as a 1-element list, returning '1' instead of the true count of instances", "llength only counts floating-point numbers", "sizeof_collection runs faster on GPUs", "llength deletes the nets"], answer: 0, explain: "A collection handle is a single pointer object in Tcl; sizeof_collection queries the underlying C++ database count." },
    { id: "tcl_s2", prompt: "What is the proper command to iterate through items returned by `get_cells` or `get_pins`?", choices: ["`foreach_in_collection cell_ptr [get_cells *] { ... }`", "`foreach cell [get_cells *] { ... }`", "`while {get_cells} { ... }`", "`for_each cell_ptr`"], answer: 0, explain: "foreach_in_collection properly traverses the internal tool database without converting millions of objects to text." },
    { id: "tcl_s3", prompt: "What does the command `get_cells -filter \"is_sequential == true\"` accomplish?", choices: ["Instructs the EDA tool database engine to return only flip-flops and latches, filtering out combinational gates before passing data to Tcl", "Deletes combinational gates from the netlist", "Forces all gates to clock at 1 GHz", "Generates SDC clocks"], answer: 0, explain: "-filter executes in C++ engine memory for maximum speed." },
  ]),

  theory("tcl", "expert", "tcl-expert-upvar", "Expert: upvar, Namespaces, Error Trapping & Custom STA Engines", 18,
    "Modular EDA scripting architectures, `upvar` variable linking, namespace isolation, and production `catch` handlers.",
    [
      "Namespace Encapsulation (`namespace eval`): Large tapeout scripts must avoid polluting the global EDA console. Encapsulate utility libraries into dedicated namespaces (`namespace eval ::timing_audit { ... }`) to prevent overwriting built-in tool commands.",
      "Variable Aliasing with `upvar`: `upvar 1 caller_var local_var` creates a reference link to a variable in the calling procedure's scope, enabling pass-by-reference mutation of complex metrics arrays and data tables.",
      "Robust Error Trapping with `catch`: EDA tools abort batch jobs when a command fails (e.g. `open missing_file.rpt` or invalid pin name). Wrap vulnerable operations in `if {[catch { report_timing -to $pin } err_msg]} { puts \"WARN: Skipping invalid pin: $err_msg\" }` to ensure flow survivability.",
      "Avoiding `eval` Injections: Never construct dynamic Tcl commands using raw string concatenation and `eval`. Use `uplevel 1 [list command {*}$args]` to preserve safe argument boundaries.",
    ]),

  practical(
    "tcl",
    "expert",
    "tcl-expert-practical",
    "Expert Practical: Namespace-Encapsulated Multi-Corner Slack Auditor",
    25,
    "Write a production Tcl module encapsulated in `::timing_audit` with safe error trapping and `upvar` summary metrics aggregation.",
    [
      "Declare namespace `::timing_audit`.",
      "Implement procedure `audit_corner_slack` that accepts an upvar reference to a summary hash dictionary.",
      "Trap `report_timing` command execution with `catch`.",
      "Parse and record WNS and TNS metrics into the caller's summary dictionary.",
    ],
    {
      language: "tcl",
      starter: `namespace eval ::timing_audit {
  # TODO: Step 1 - Define proc audit_corner_slack with upvar stats_ref
  # TODO: Step 2 - Wrap timing query in catch block
  # TODO: Step 3 - Update caller stats array
}
`,
      checks: [
        { id: "ns", label: "namespace eval declaration", kind: "regex", pattern: "namespace\\s+eval\\s+::" },
        { id: "upvar", label: "upvar variable aliasing", kind: "includes", pattern: "upvar" },
        { id: "catch", label: "catch error trapping block", kind: "includes", pattern: "catch" },
      ],
      solution: `namespace eval ::timing_audit {
  variable version "2.4.0"

  proc audit_corner_slack {corner_name stats_dict_name} {
    # 1. Link to caller's summary dictionary in calling frame
    upvar 1 $stats_dict_name stats_dict

    puts "\[::timing_audit v$version\] Auditing Slack for Corner '$corner_name'..."

    # 2. Trap execution with catch
    set wns 0.0
    set tns 0.0
    set cmd_failed [catch {
      # Execute STA timing query
      set timing_path [report_timing -corner $corner_name -collection]
      if {[sizeof_collection $timing_path] > 0} {
        set wns [get_property [index_collection $timing_path 0] slack]
      }
    } err_log]

    if {$cmd_failed} {
      puts "ERROR: Timing query failed on corner $corner_name: $err_log"
      dict set stats_dict $corner_name "FAILED"
      return -code error $err_log
    }

    # 3. Update Caller's Summary Structure
    dict set stats_dict $corner_name "WNS=$wns"
    puts "  -> $corner_name: Worst Slack = $wns ns"
    return $wns
  }
}
`,
    }
  ),

  quiz("tcl", "expert", "tcl-expert-quiz", "Tcl — Expert Namespaces & Error Handling Quiz", [
    { id: "tx1", prompt: "What is the primary role of `catch { command } result_var` in production EDA scripting?", choices: ["To intercept command execution errors and prevent the EDA tool batch job from terminating abnormally", "To accelerate logic synthesis", "To calculate dynamic IR drop", "To compile Verilog files"], answer: 0, explain: "catch traps exceptions and returns non-zero on failure without crashing the EDA console." },
    { id: "tx2", prompt: "What does `upvar 1 external_var local_var` achieve in a Tcl procedure?", choices: ["It creates a pass-by-reference alias to a variable located 1 level up in the caller's execution stack frame", "It imports an SDC file from disk", "It renames a standard cell in the netlist", "It converts floats to strings"], answer: 0, explain: "upvar links a local identifier to a variable in a parent stack frame." },
    { id: "tx3", prompt: "Why is `eval $untrusted_string` dangerous in EDA flow scripts?", choices: ["It evaluates unescaped special characters (like brackets and semicolons), creating severe code injection risks and unpredictable console crashes", "It disables clock gating", "It consumes 100x more disk space", "It modifies Liberty files"], answer: 0, explain: "eval on untrusted input executes arbitrary commands within the tool environment." },
  ]),

  theory("tcl", "master", "tcl-master-flow", "Master: Vendor Tcl — Synopsys, Cadence, open source + idempotent flows", 24,
    "Same job, three consoles. Then: argv, idempotent artifacts, and exit codes that a farm can trust.",
    [
      `## Same intent, three dialects

The interactive chart above is the map. SDC names (\`create_clock\`) are shared. **Database queries are not.**

COMPARE Collections
Need | Synopsys (PT/DC/ICC2) | Cadence (Genus/Innovus/Tempus) | OpenSTA / Yosys
---
All flops | \`get_cells -hier -filter "is_sequential==true"\` | \`get_db insts .is_sequential\` | \`get_cells *\` + properties (OpenSTA)
Count | \`sizeof_collection $c\` | \`llength [get_db ...]\` (list of db handles) | \`llength [get_cells *]\`
Iterate | \`foreach_in_collection c $col { get_object_name $c }\` | \`foreach i [get_db insts] { get_db $i .name }\` | \`foreach c [get_cells *] { ... }\`
Attribute | \`get_attribute $pin slack\` | \`get_db $pin .slack\` | \`get_property\` / report
Read HDL | \`analyze; elaborate\` / \`read_verilog\` | \`read_hdl; elaborate\` | \`read_verilog\` (yosys / sta)
Compile | \`compile_ultra\` | \`syn_generic; syn_map; syn_opt\` | \`proc; opt; abc -liberty\`
Timing | \`report_timing -max_paths 20\` | \`report_timing -max_paths 20\` | \`report_checks -path_delay max\`
Quit fail | \`exit 1\` | \`exit -force 1\` | \`exit 1\`
ENDCOMPARE

CODE tcl
# Synopsys PrimeTime
foreach_in_collection p [get_pins u_alu/*/D] {
  puts [get_object_name $p]
}

# Cadence Tempus / Innovus
foreach p [get_db pins u_alu/*/D] {
  puts [get_db $p .name]
}

# OpenSTA
foreach p [get_pins u_alu/*/D] {
  puts $p
}
ENDCODE

WARN: Copy-pasting \`foreach_in_collection\` into Genus will error. Copy-pasting \`get_db\` into PrimeTime will error. Wrap vendor bits behind \`proc ::flow::get_flops {}\` in your house library.

## Production flow rules (all vendors)

- **Idempotent:** run twice → same bits. Write \`report.rpt.tmp\` then \`file rename -force\`.
- **argv:** \`sta.tcl -top soc -sdc x.sdc -corner ss_125c\` — never hardcode paths.
- **Exit codes:** print FAILED and \`exit 0\` poisons LSF/Slurm. \`check_timing\` errors → \`exit 1\`.
- **No GUI in signoff:** mouse clicks are not audit trails.

Q: Why not one Tcl file for DC and Genus?
A: Share the SDC and the *policy* (WNS gate, file names). Isolate the 20 lines that touch the database.

TIP: House style: \`vendor.tcl\` detects \`$::synopsys_program_name\` vs \`get_db\` and aliases \`get_flops\`.
`,
    ]),

  practical(
    "tcl",
    "master",
    "tcl-master-practical",
    "Master Practical: Full Flow Signoff Runner with QoR Gate & Exit Propagation",
    30,
    "Write a production signoff Tcl flow script that audits check_timing, unconstrained endpoints, and WNS, exiting non-zero on any violation.",
    [
      "Parse command line arguments (`-top`, `-sdc`, `-max_wns_slack`).",
      "Run `check_timing` and verify zero unconstrained endpoints.",
      "Audit Worst Negative Slack across all path groups.",
      "Write machine-readable JSON signoff metrics report.",
      "Exit 0 on full signoff pass, or exit 1 with descriptive fatal error on any violation.",
    ],
    {
      language: "tcl",
      starter: `# Master Practical: Signoff Flow Gate
# TODO: Step 1 - Define signoff verification procedure
# TODO: Step 2 - Verify check_timing clean
# TODO: Step 3 - Check WNS and exit non-zero on violation`,
      checks: [
        { id: "chk_tim", label: "check_timing audit", kind: "includes", pattern: "check_timing" },
        { id: "exit_fail", label: "exit 1 on violation", kind: "regex", pattern: "exit\\s+1" },
        { id: "exit_pass", label: "exit 0 on success", kind: "regex", pattern: "exit\\s+0" },
      ],
      solution: `# Master Practical: Signoff Flow Gate: signoff_check.tcl

set TOP_MODULE "soc_core"
set MAX_WNS_TOLERANCE 0.000

puts "================================================================="
puts "  ASIC PRODUCTION SIGNOFF AUDIT: $TOP_MODULE"
puts "================================================================="

# 1. Audit Timing Constraints Completeness
puts "INFO: Running check_timing..."
set unconstrained_pins [check_timing -include {unconstrained_endpoints no_clock}]

if {[sizeof_collection $unconstrained_pins] > 0} {
  puts "FATAL: check_timing detected unconstrained endpoints! Signoff REJECTED."
  exit 1
}

# 2. Audit Worst Negative Slack (WNS) Across All Path Groups
set violating_paths [get_timing_paths -max_paths 1 -slack_lesser_than $MAX_WNS_TOLERANCE]

if {[sizeof_collection $violating_paths] > 0} {
  set worst_path [index_collection $violating_paths 0]
  set worst_slack [get_property $worst_path slack]
  set ep_name     [get_property [get_property $worst_path endpoint] full_name]

  puts "FATAL: Timing Signoff FAILED! WNS = $worst_slack ns at endpoint $ep_name"
  puts "Signoff Gate: REJECTED (WNS < $MAX_WNS_TOLERANCE ns)"
  exit 1
}

puts "SUCCESS: All timing paths MET ($TOP_MODULE is Signoff Clean)!"
exit 0
`,
    }
  ),

  quiz("tcl", "master", "tcl-master-quiz", "Tcl — Master Flow Automation & Signoff Exam", [
    { id: "tm1", prompt: "Why must a batch EDA signoff script explicitly call `exit 1` when timing or DRC checks fail?", choices: ["Compute cluster schedulers (LSF, Slurm) inspect process exit codes to determine whether downstream dependency jobs should be halted or marked failed", "It makes the log file 10x smaller", "It re-synthesizes the RTL", "It turns off standard cell leakage"], answer: 0, explain: "A job exiting with code 0 is treated as successful by CI/CD and farm schedulers, potentially allowing a defective chip to proceed." },
    { id: "tm2", prompt: "What does 'Idempotency' mean in ASIC EDA flow design?", choices: ["Running the exact same flow script multiple times produces identical, reproducible results without leaving corrupted intermediate artifacts", "The script can only run in a GUI", "The script works only on Intel CPUs", "The script generates GDS in 1 second"], answer: 0, explain: "Idempotent flows guarantee reliable, repeatable builds across all tapeout revisions." },
    { id: "tm3", prompt: "In a production physical design flow, why is GUI selection disallowed in signoff scripts?", choices: ["GUI actions rely on non-reproducible mouse coordinates and human interaction, whereas batch signoff requires deterministic name queries", "GUI mode consumes zero power", "GUI mode cannot read Verilog", "GUI mode is unsupported by Linux"], answer: 0, explain: "Signoff flows must be fully scripted, headless, and audit-traceable." },
  ]),

  // ——— EDA Scripting: Shell / Linux Farm Track (4 Layers) ———
  theory("shell", "beginner", "shell-beginner", "Beginner: Bash language — variables, quoting, if, loops, functions", 22,
    "Bash as a language (not just 'run genus'): variables, quotes, tests, for/while, functions, then EDA env and redirection.",
    [
      `## Variables and quoting

CODE bash
TOP=soc_core
echo "block is $TOP"
echo 'block is $TOP'
ENDCODE

COMPARE Quotes
Form | \`$VAR\` expands | Use
---
\`"$TOP"\` | Yes | Almost always
\`'$TOP'\` | No | Regex, passwords
unquoted | Yes + glob | Easy to break on spaces
ENDCOMPARE

- Assign: \`NAME=value\` — **no spaces** around \`=\`
- Default: \`\${LM_LICENSE_FILE:-}\` empty if unset
- Special: \`$0\` script name, \`$#\` argc, \`"$@"\` all args

## if, loops, functions

CODE bash
if [[ -z "\${LM_LICENSE_FILE:-}" ]]; then
  echo "no license" >&2
  exit 1
fi

for f in timing.rpt power.rpt; do
  echo "harvest $f"
done

harvest() {
  grep VIOLATED "$1" || true
}
ENDCODE

TABLE Tests
Test | True when
---
\`[[ -z "$x" ]]\` | string empty
\`[[ -f "$f" ]]\` | file exists
\`[[ $wns -lt 0 ]]\` | integer compare
\`[[ $name == clk* ]]\` | glob match
ENDTABLE

TRY bash
CORNER=ss_125c
echo "STA $CORNER"
for f in timing.rpt area.rpt; do
  echo "file $f"
done
ENDTRY

## Then the EDA environment

- \`export PATH=/eda/genus/bin:$PATH\`
- \`export LM_LICENSE_FILE=27000@lic\`
- Redirection: \`> log\` overwrite, \`>>\` append, \`2>&1 | tee run.log\`
- Permissions: \`umask 002\`, \`chmod 775\` on shared \`/proj\`

Q: Why \`[[ -f "$f" ]]\` with quotes?
A: A filename with a space would split into two words without quotes and the test lies.

WARN: \`set -euo pipefail\` in every script you ship. Bare \`cmd | harvest\` without \`pipefail\` ignores grep's exit.
`,
    ]),

  practical(
    "shell",
    "beginner",
    "shell-beginner-practical",
    "Beginner Practical: EDA Run Directory Setup & Tool Launch Wrapper",
    25,
    "Write a production bash startup script that validates license servers, creates organized run directories, and launches OpenSTA with logging.",
    [
      "Verify environment variable `LM_LICENSE_FILE` is set, or exit with error.",
      "Create timestamped run directory structure (`runs/sta_<YYYYMMDD_HHMMSS>`).",
      "Launch tool with stdout and stderr captured simultaneously to `run.log`.",
    ],
    {
      language: "bash",
      starter: `#!/usr/bin/env bash
# TODO: Step 1 - Check license environment variable
# TODO: Step 2 - Create timestamped directory
# TODO: Step 3 - Launch tool and redirect output with tee`,
      checks: [
        { id: "lic", label: "License environment check", kind: "regex", pattern: "LM_LICENSE_FILE|-z" },
        { id: "mkdir", label: "Directory creation with timestamp", kind: "includes", pattern: "mkdir" },
        { id: "tee", label: "stdout/stderr redirection with tee", kind: "regex", pattern: "2>&1|tee" },
      ],
      solution: `#!/usr/bin/env bash
set -euo pipefail

# 1. Validate EDA Environment & Licenses
if [[ -z "\${LM_LICENSE_FILE:-}" ]]; then
  echo "ERROR: LM_LICENSE_FILE is not set. Please source the EDA environment setup script." >&2
  exit 1
fi

# 2. Create Timestamped Workspace Directory
RUN_ID=$(date +"%Y%m%d_%H%M%S")
RUN_DIR="runs/sta_\${RUN_ID}"
mkdir -p "\${RUN_DIR}/logs" "\${RUN_DIR}/reports"

echo "INFO: Initializing ASIC Run Workspace: \${RUN_DIR}"

# 3. Launch Tool with Full Logging
TOOL_LOG="\${RUN_DIR}/logs/opensta.log"
echo "INFO: Launching OpenSTA Timing Analysis..."
opensta -exit scripts/run_sta.tcl 2>&1 | tee "\${TOOL_LOG}"

echo "SUCCESS: STA Run completed. Full log preserved in: \${TOOL_LOG}"
`,
    }
  ),

  quiz("shell", "beginner", "shell-beginner-quiz", "Shell — Beginner EDA Environment Quiz", [
    { id: "sh_b1", prompt: "What does the redirection `2>&1 | tee run.log` accomplish in an EDA tool launch script?", choices: ["It merges standard error (2) into standard output (1) and pipes the combined stream to both the terminal screen and the `run.log` file simultaneously", "It doubles the simulation clock speed", "It ignores all tool syntax errors", "It deletes log files automatically"], answer: 0, explain: "2>&1 redirects stderr to stdout; tee splits stdout to both the console and a file." },
    { id: "sh_b2", prompt: "What environment variable is universally used across EDA tools to locate FlexNet license daemons?", choices: ["`LM_LICENSE_FILE`", "`PYTHONPATH`", "`GDS_DIR`", "`UPF_HOME`"], answer: 0, explain: "LM_LICENSE_FILE specifies the port@host for FlexLM/FlexNet license servers." },
    { id: "sh_b3", prompt: "Why is `umask 002` typically configured in shared semiconductor design team accounts?", choices: ["To ensure new files created by one engineer can be read and modified by team members in the same UNIX project group", "To encrypt Verilog files", "To enable fast SPICE simulations", "To set 2nm transistor geometries"], answer: 0, explain: "umask 002 leaves group write permissions intact for project team collaboration." },
  ]),

  theory("shell", "standard", "shell-standard-parsing", "Standard: Log Wrangling with grep, awk, sed, and find", 18,
    "Automated parsing of multi-gigabyte EDA logs using stream editors, pattern scanners, and pipeline filters.",
    [
      "Pattern Searching with `grep` & `egrep`: In EDA pipelines, logs can reach gigabytes. Extract critical violations rapidly: `grep -E \"(VIOLATED|HOLD VIOLATION|DRC Error)\" logs/*.log` or count violations with `grep -c \"VIOLATED\" timing.rpt`.",
      "Column Processing with `awk`: `awk` processes structured columnar reports (like OpenSTA or PrimeTime path summaries): `awk '/slack \\(VIOLATED\\)/ { print $NF, $0 }' timing.rpt | sort -n` extracts the slack number from the final column ($NF).",
      "Stream Editing with `sed`: Perform in-place batch text replacements across netlists or SDC files: `sed -i 's/clk_500mhz/clk_1ghz/g' constraints.sdc`.",
      "Locating Artifacts with `find`: Use `find . -name \"*.rpt\" -type f -mtime -1` to locate reports modified in the last 24 hours.",
    ]),

  practical(
    "shell",
    "standard",
    "shell-standard-practical",
    "Standard Practical: Multi-Corner Timing Violation Extractor & Summarizer",
    25,
    "Write a bash script using grep, awk, and sort to parse all timing report files in a directory and print a formatted Worst Negative Slack summary table.",
    [
      "Search for all `*.rpt` files across subdirectories.",
      "Extract lines containing `slack (VIOLATED)`.",
      "Use `awk` to extract Corner Name, Endpoint, and Slack value.",
      "Sort numerically to display the most critical violations first.",
    ],
    {
      language: "tcl",
      starter: `#!/usr/bin/env bash
# TODO: Step 1 - Find all timing report files
# TODO: Step 2 - Extract violating lines with grep/awk
# TODO: Step 3 - Sort by worst slack value`,
      checks: [
        { id: "find", label: "find command for reports", kind: "includes", pattern: "find" },
        { id: "awk", label: "awk column extraction", kind: "includes", pattern: "awk" },
        { id: "sort", label: "sort numeric ordering", kind: "regex", pattern: "sort\\s+-n|sort\\s+-g" },
      ],
      solution: `#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="\${1:-reports}"
echo "=================================================================="
echo "  TIMING VIOLATION HARVESTER (Target Directory: $REPORT_DIR)"
echo "=================================================================="
printf "%-12s | %-12s | %-40s\n" "SLACK (ns)" "STATUS" "ENDPOINT"
echo "------------------------------------------------------------------"

# Find, parse, and sort worst violating paths
find "$REPORT_DIR" -type f -name "*.rpt" -print0 | while IFS= read -r -d '' rpt_file; do
  awk '
    /Endpoint:/ { ep = $2 }
    /slack \\(VIOLATED\\)/ {
      slack = $NF
      printf "%-12s | %-12s | %-40s\n", slack, "VIOLATED", ep
    }
  ' "$rpt_file"
done | sort -n -k 1 | head -n 20

echo "------------------------------------------------------------------"
echo "Harvesting Complete. Displaying top 20 critical violating paths."
`,
    }
  ),

  quiz("shell", "standard", "shell-standard-quiz", "Shell — Standard Log Wrangling Quiz", [
    { id: "sh_s1", prompt: "In `awk`, what does the built-in variable `$NF` represent?", choices: ["The value of the last field/column in the current line record", "The line number", "The name of the file", "A null pointer"], answer: 0, explain: "NF is Number of Fields; $NF retrieves the final column on the line." },
    { id: "sh_s2", prompt: "Why is `find -print0 | xargs -0` preferred over `for f in $(find ...)` in production shell scripts?", choices: ["It handles filenames containing whitespace, tabs, or newlines safely without word-splitting errors", "It compresses files automatically", "It makes grep 10x faster", "It compiles Verilog"], answer: 0, explain: "-print0 separates entries by a null character (\0), preventing whitespace corruption." },
    { id: "sh_s3", prompt: "What does `grep -E \"(ERROR|FATAL)\" -c run.log` return?", choices: ["The total integer count of lines matching either ERROR or FATAL in run.log", "The byte offset of the error", "The file size in kilobytes", "The CPU temperature"], answer: 0, explain: "-c instructs grep to print the count of matching lines." },
  ]),

  theory("shell", "expert", "shell-expert-safe", "Expert: Production Bash Hardening, set -euo pipefail, Traps & Locks", 18,
    "Writing fault-tolerant, non-destructive EDA automation scripts using safe execution modes, signals, and concurrency locks.",
    [
      "The Gold Standard Header (`set -euo pipefail`): 1) `set -e` (Exit immediately if any command returns non-zero), 2) `set -u` (Treat unset variables as fatal errors, preventing catastrophic accidental deletion of `rm -rf $UNSET_VAR/*`), 3) `set -o pipefail` (Fail the entire pipeline if any intermediate command fails).",
      "Cleanup Traps (`trap ... EXIT INT TERM`): EDA jobs generate tens of gigabytes of scratch files. Register exit handlers with `trap 'rm -rf \"$TMP_DIR\"' EXIT INT TERM` to ensure scratch directories are wiped even if the simulation crashes or is aborted by a user `Ctrl-C`.",
      "Safe Concurrency Locking with `flock`: When multiple distributed farm jobs write to a shared library cache, use `flock -x \"$LOCK_FILE\" -c \"make_lib_entry\"` to prevent race conditions and corrupt builds.",
    ]),

  practical(
    "shell",
    "expert",
    "shell-expert-practical",
    "Expert Practical: Hardened Batch Tool Wrapper with Automatic Scratch Cleanup",
    25,
    "Write a hardened shell wrapper implementing set -euo pipefail, trap-based scratch directory cleanup, and safe variable quoting.",
    [
      "Enable `set -euo pipefail`.",
      "Create temporary scratch directory via `mktemp -d`.",
      "Register a cleanup `trap` handler on `EXIT`, `SIGINT`, and `SIGTERM`.",
      "Safely quote all variables and arguments passed to the sub-tool.",
    ],
    {
      language: "tcl",
      starter: `#!/usr/bin/env bash
# TODO: Step 1 - Enable strict execution modes
# TODO: Step 2 - Create mktemp scratch directory
# TODO: Step 3 - Register cleanup trap`,
      checks: [
        { id: "pipefail", label: "set -euo pipefail enabled", kind: "regex", pattern: "set\\s+-euo\\s+pipefail" },
        { id: "trap", label: "trap cleanup handler", kind: "includes", pattern: "trap" },
        { id: "mktemp", label: "mktemp directory creation", kind: "includes", pattern: "mktemp" },
      ],
      solution: `#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# 1. Create Isolated Temporary Directory
TMP_SCRATCH=$(mktemp -d "/tmp/eda_run_XXXXXX")
echo "INFO: Allocated scratch storage: \${TMP_SCRATCH}"

# 2. Register Safe Cleanup Handler on Exit or Interruption
cleanup() {
  local exit_code=$?
  echo "INFO: Performing cleanup of \${TMP_SCRATCH} (Exit Code: \${exit_code})..."
  rm -rf "\${TMP_SCRATCH}"
  exit \${exit_code}
}
trap cleanup EXIT INT TERM

# 3. Execute Tool Flow in Scratch Area
DESIGN_TOP="\${1:?Error: Design top module name must be provided}"
echo "INFO: Processing design '\$DESIGN_TOP'..."

# Simulated tool execution writing to scratch
cat <<EOF > "\${TMP_SCRATCH}/run.tcl"
read_verilog "\$DESIGN_TOP.v"
elaborate "\$DESIGN_TOP"
EOF

echo "SUCCESS: Flow completed safely."
`,
    }
  ),

  quiz("shell", "expert", "shell-expert-quiz", "Shell — Expert Bash Hardening & Traps Quiz", [
    { id: "shx1", prompt: "What danger does `set -u` prevent in shell scripting?", choices: ["It treats uninitialized variables as fatal errors, preventing destructive bugs like `rm -rf $DEST_DIR/*` where an unset variable resolves to `rm -rf /*`", "It prevents computers from overheating", "It turns off clock trees", "It disables SPICE simulation"], answer: 0, explain: "set -u aborts execution if an undefined variable name is referenced." },
    { id: "shx2", prompt: "Why is `set -o pipefail` critical in verification data pipelines like `sim_tool | grep -v 'INFO' | tee log.txt`?", choices: ["Without pipefail, bash only evaluates the exit code of the last command (`tee`), masking a failure if `sim_tool` crashed with a core dump", "It makes pipes 2x faster", "It compresses text files", "It enables floating point operations"], answer: 0, explain: "pipefail ensures that an error in any pipeline stage causes the whole pipeline to fail." },
    { id: "shx3", prompt: "What is the purpose of `trap cleanup EXIT INT TERM` in an EDA batch wrapper?", choices: ["It guarantees that the `cleanup` function runs regardless of whether the script finishes normally, errors out, or is terminated by the user", "It traps timing violations", "It disables Linux signals", "It restarts the computer"], answer: 0, explain: "trap hooks standard UNIX termination signals to ensure cleanup actions always execute." },
  ]),

  theory("shell", "master", "shell-master-farm", "Master: Compute Farm Orchestration (LSF / Slurm) & Parallel Harvest", 20,
    "Submitting, monitoring, and harvesting massive parallel verification and physical design jobs across thousands of compute nodes.",
    [
      "Compute Cluster Management (LSF & Slurm): ASIC tapeout regressions execute across thousands of cluster nodes managed by schedulers like IBM LSF (`bsub`) or Slurm (`sbatch`). Scripts must request appropriate resources: `bsub -q sta_high -n 8 -R \"rusage[mem=32G]\" -o logs/job_%J.log ./run_sta.sh`.",
      "Atomic File Publishing: When a farm node crashes or is killed due to exceeding memory limits (OOM Killer), it leaves partially written output files that can falsely appear as completed runs. Always write outputs to a temporary directory (`runs/run_1042.tmp`) and perform an atomic `mv` to the final destination only after all exit checks pass!",
      "Log Archival & Failure Classification: Master orchestration wrappers harvest millions of log lines, automatically classifying failures into categories: 1) License Starvation, 2) Out-Of-Memory (OOM), 3) Syntax / Elaboration Error, 4) Timing/DRC Violation.",
    ]),

  practical(
    "shell",
    "master",
    "shell-master-practical",
    "Master Practical: Parallel Slurm / LSF Regression Dispatcher & Log Aggregator",
    30,
    "Write a master bash cluster dispatcher that submits 10 parallel corner runs via bsub/sbatch and tracks job status until all jobs complete cleanly.",
    [
      "Loop over a list of 5 MMMC corners (`ss_0.75v`, `ff_0.88v`, `tt_0.80v`, etc.).",
      "Construct parameterized cluster submission command requesting 16GB RAM.",
      "Collect job IDs into an array and monitor completion status.",
      "Aggregate final pass/fail results into a unified signoff table.",
    ],
    {
      language: "tcl",
      starter: `#!/usr/bin/env bash
# TODO: Step 1 - Define corners array
# TODO: Step 2 - Loop and dispatch batch jobs
# TODO: Step 3 - Monitor and aggregate results`,
      checks: [
        { id: "loop", label: "Corner iteration loop", kind: "regex", pattern: "for\\s+corner|foreach|in\\s+\\$\\{" },
        { id: "batch", label: "bsub or sbatch submission syntax", kind: "regex", pattern: "bsub|sbatch|exec" },
        { id: "tbl", label: "Formatted summary table", kind: "regex", pattern: "printf|echo" },
      ],
      solution: `#!/usr/bin/env bash
set -euo pipefail

CORNERS=("ss_0.72v_125c" "ff_0.88v_-40c" "tt_0.80v_25c" "ss_0.72v_-40c" "ff_0.88v_125c")
JOB_IDS=()

echo "INFO: Dispatching 5 Multi-Corner STA Jobs to Compute Farm..."

for corner in "\${CORNERS[@]}"; do
  LOG_FILE="logs/sta_\${corner}.log"
  mkdir -p logs
  
  # Submit job to cluster scheduler (Simulated bsub/sbatch)
  echo "Submitting: Corner $corner (Queue: sta_signoff, Mem: 16G)..."
  # bsub -q sta_signoff -R "rusage[mem=16G]" -o "$LOG_FILE" ./run_corner.sh "$corner"
  JOB_IDS+=("$corner")
done

echo "=================================================================="
echo "  PARALLEL REGRESSION HARVEST SUMMARY"
echo "=================================================================="
printf "%-20s | %-12s | %-12s\n" "CORNER" "STATUS" "MEM USAGE"
echo "------------------------------------------------------------------"

for corner in "\${JOB_IDS[@]}"; do
  printf "%-20s | %-12s | %-12s\n" "$corner" "COMPLETED" "14.2 GB"
done

echo "SUCCESS: All 5 Corner Signoff Jobs Finished Cleanly."
`,
    }
  ),

  quiz("shell", "master", "shell-master-quiz", "Shell — Master Farm Orchestration Quiz", [
    { id: "shm1", prompt: "Why is 'Atomic Publishing' (writing to a tmp folder and moving on completion) essential in compute farm scripting?", choices: ["To ensure that jobs killed midway by out-of-memory errors or power outages never leave incomplete reports that masquerade as completed signoff artifacts", "To make the CPU run cooler", "To bypass license servers", "To format GDS polygons"], answer: 0, explain: "Atomic moves guarantee that only fully finished, valid runs exist at the final destination." },
    { id: "shm2", prompt: "What does the LSF resource string `-R \"rusage[mem=32G]\"` instruct the cluster scheduler to do?", choices: ["Reserve 32 Gigabytes of RAM on the execution host node before launching the tool, preventing OOM crashes caused by host overloading", "Limit the simulation time to 32 seconds", "Run 32 parallel threads", "Allocate 32 hard drives"], answer: 0, explain: "rusage[mem=...] reserves memory on the target worker node." },
    { id: "shm3", prompt: "When harvesting logs from 10,000 regression seeds, how should log filenames be structured?", choices: ["Each job should write to a uniquely named log containing its Seed Number and Job ID (e.g. `sim_seed_1042_job_8912.log`)", "All 10,000 jobs should append to a single `output.txt` file simultaneously", "Logs should never be saved to disk", "Logs should be stored as raw audio"], answer: 0, explain: "Unique filenames prevent race conditions and file corruption when thousands of jobs run in parallel." },
  ]),

  // ——— EDA Scripting: Python Track (4 Layers) ———
  theory("python", "beginner", "python-beginner", "Beginner: Python language — variables, if, loops, lists, dicts, functions", 22,
    "Python as a language for chip engineers: types, control flow, lists/dicts, functions, then files and re.",
    [
      `## Variables and types

CODE python
wns = -0.42
name = "alu"
ok = wns >= 0
print(f"{name} wns={wns} met={ok}")
ENDCODE

TABLE
Type | Example | Notes
---
int / float | \`period = 2.0\` | \`/\` is true divide
str | \`"clk_core"\` | f-strings: \`f"T={period}"\`
bool | \`True False\` | \`and or not\`
list | \`["clk", "rst_n"]\` | \`xs[0]\`, \`len(xs)\`, \`xs.append\`
dict | \`{"alu": -0.42}\` | \`d["alu"]\`, \`.get\`
None | missing | \`if x is None\`
ENDTABLE

## if / for / def

CODE python
def period_ns(freq_mhz, margin=0.0):
    return 1000.0 / freq_mhz * (1.0 - margin)

for i in range(3):
    print(period_ns(200 + i))
ENDCODE

- \`if / elif / else\` — indent is the block (4 spaces)
- \`for x in items:\` · \`for i in range(n):\`
- \`while cond:\`
- \`def name(args):\` then \`return\`

TRY python
cells = ["dfxtp_1", "nand2_1", "inv_2"]
print(f"count={len(cells)}")
print(cells[0])
for i in range(2):
    print(i)
ENDTRY

## Files and regex (the EDA 20%)

- \`with open("t.rpt") as f:\` — always
- \`import re\` then \`re.search(r"slack\\s+\\((VIOLATED|MET)\\)", line)\`

Q: Tcl or Python for PrimeTime?
A: **Tcl inside the tool** (collections). **Python around the tool** (harvest logs, drive farms, dashboards).
`,
    ]),

  practical(
    "python",
    "beginner",
    "python-beginner-practical",
    "Beginner Practical: Automated Gate-Level Instance Counter & Cell Type Breakdown",
    25,
    "Write a Python script that reads a Verilog gate-level netlist and generates a breakdown of sequential vs combinational cell usage.",
    [
      "Read a gate-level Verilog netlist file.",
      "Count occurrences of standard cell primitives (`sky130_fd_sc_hd__dfxtp_1`, `sky130_fd_sc_hd__nand2_1`, etc.).",
      "Classify cells into Sequential, Logic Gates, and Inverters/Buffers.",
      "Print a clean formatted summary report.",
    ],
    {
      language: "python",
      starter: `# Python Beginner Practical: Netlist Instance Counter
# TODO: Step 1 - Define cell classification dictionary
# TODO: Step 2 - Parse netlist lines and count instances
# TODO: Step 3 - Print formatted summary table`,
      checks: [
        { id: "dict", label: "Dictionary usage for counts", kind: "regex", pattern: "dict\\(|\\{\\}|\\[.*\\]\\s*\\+=" },
        { id: "open", label: "File open with context manager", kind: "includes", pattern: "with open" },
        { id: "print", label: "Formatted summary print", kind: "includes", pattern: "print" },
      ],
      solution: `# Python Beginner Practical: Netlist Instance Counter
import re
from collections import defaultdict

def analyze_netlist(netlist_code: str):
  cell_counts = defaultdict(int)
  
  # Regex to capture: cell_type instance_name ( ... );
  pattern = re.compile(r'^\s*(sky130_fd_sc_hd__\w+)\s+(\w+)\s*\(', re.MULTILINE)
  
  for match in pattern.finditer(netlist_code):
    cell_type = match.group(1)
    cell_counts[cell_type] += 1

  print("=" * 60)
  print(f"{'CELL TYPE':<35} | {'COUNT':<10}")
  print("-" * 60)
  
  total_cells = 0
  for cell, count in sorted(cell_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"{cell:<35} | {count:<10}")
    total_cells += count
    
  print("-" * 60)
  print(f"{'TOTAL INSTANCES':<35} | {total_cells:<10}")
  return cell_counts

# Test Sample
sample_netlist = """
module alu (clk, rst, a, b, y);
  sky130_fd_sc_hd__dfxtp_1 reg_a (.CLK(clk), .D(a), .Q(a_q));
  sky130_fd_sc_hd__dfxtp_1 reg_b (.CLK(clk), .D(b), .Q(b_q));
  sky130_fd_sc_hd__nand2_2 g1 (.A(a_q), .B(b_q), .Y(n1));
  sky130_fd_sc_hd__a21oi_2 g2 (.A1(n1), .A2(a_q), .B1(b_q), .Y(y));
endmodule
"""
analyze_netlist(sample_netlist)
`,
    }
  ),

  quiz("python", "beginner", "python-beginner-quiz", "Python — Beginner VLSI Scripting Quiz", [
    { id: "py_b1", prompt: "Why is the `with open(...) as f:` syntax preferred for reading EDA logs in Python?", choices: ["It automatically guarantees that the filehandle is flushed and closed, even if an unhandled exception or parsing error occurs", "It executes in parallel on all CPU cores", "It translates Python to Verilog", "It reduces memory usage to 1 byte"], answer: 0, explain: "Context managers prevent resource leaks by ensuring deterministic file closure." },
    { id: "py_b2", prompt: "Which Python data structure provides constant-time $O(1)$ lookups for mapping instance names to cell properties?", choices: ["Dictionary (`dict`)", "Linked List", "Tuple", "Array"], answer: 0, explain: "Python dictionaries use hash maps to deliver average O(1) key-value lookup." },
    { id: "py_b3", prompt: "What standard library module is used for regular expression matching in Python?", choices: ["`re`", "`regex_eda`", "`string_match`", "`parse_vcd`"], answer: 0, explain: "`re` is the built-in regular expression engine in Python." },
  ]),

  theory("python", "standard", "python-standard-regex", "Standard: EDA Log Parsing, Regex Named Groups & JSON Export", 18,
    "Extracting critical timing slack, power metrics, and DRC violations using compiled regular expressions and exporting structured JSON/CSV data.",
    [
      "Regex Named Groups (`(?P<name>...)`): When scraping complex EDA logs, named capture groups produce self-documenting code: `r'slack \\((?P<status>VIOLATED|MET)\\)\\s+(?P<slack>-?\\d+\\.\\d+)'`. Access results via `match.group('slack')` instead of fragile numeric indices.",
      "Multi-line Scanning (`re.DOTALL` & `re.MULTILINE`): Timing paths span multiple lines. Use `re.compile(pattern, re.DOTALL)` to capture full path blocks between `Startpoint:` and `slack (`.",
      "Exporting to Structured JSON/CSV: Raw log files are difficult to query across multiple runs. Parse metrics into Python dictionaries and serialize to structured JSON (`json.dump(data, f, indent=2)`) or CSV for database ingestion and visualization.",
    ]),

  practical(
    "python",
    "standard",
    "python-standard-practical",
    "Standard Practical: Production STA Timing Log Parser to JSON Matrix",
    25,
    "Write a complete Python parser that extracts Startpoint, Endpoint, Path Delay, Required Time, and Slack from timing reports into structured JSON.",
    [
      "Compile regex patterns with named capture groups.",
      "Iterate through timing path blocks in the log.",
      "Extract Startpoint, Endpoint, and Slack into dictionaries.",
      "Write serialized JSON output to disk.",
    ],
    {
      language: "python",
      starter: `# Python Standard Practical: STA Timing Report Parser
import re, json

# TODO: Step 1 - Define regex patterns with named groups
# TODO: Step 2 - Parse timing report blocks
# TODO: Step 3 - Serialize to JSON`,
      checks: [
        { id: "re", label: "re.compile with named groups", kind: "regex", pattern: "re\\.compile|\\?P<" },
        { id: "json", label: "json.dump serialization", kind: "regex", pattern: "json\\.dump" },
        { id: "slack", label: "Slack extraction logic", kind: "includes", pattern: "slack" },
      ],
      solution: `# Python Standard Practical: STA Timing Report Parser
import re, json

def parse_timing_report(report_text: str):
  # 1. Regex pattern for timing paths with named capture groups
  path_pattern = re.compile(
    r"Startpoint:\s+(?P<startpoint>\S+).*?"
    r"Endpoint:\s+(?P<endpoint>\S+).*?"
    r"data arrival time\s+(?P<arrival>-?\d+\.\d+).*?"
    r"data required time\s+(?P<required>-?\d+\.\d+).*?"
    r"slack \((?P<status>VIOLATED|MET)\)\s+(?P<slack>-?\d+\.\d+)",
    re.DOTALL
  )

  paths = []
  for match in path_pattern.finditer(report_text):
    path_data = {
      "startpoint": match.group("startpoint"),
      "endpoint":   match.group("endpoint"),
      "arrival_ns": float(match.group("arrival")),
      "required_ns": float(match.group("required")),
      "status":     match.group("status"),
      "slack_ns":   float(match.group("slack")),
    }
    paths.append(path_data)

  summary = {
    "total_paths": len(paths),
    "violating_paths": sum(1 for p in paths if p["status"] == "VIOLATED"),
    "wns_ns": min((p["slack_ns"] for p in paths), default=0.0),
    "paths": paths
  }

  print(json.dumps(summary, indent=2))
  return summary
`,
    }
  ),

  quiz("python", "standard", "python-standard-quiz", "Python — Standard Log Parsing Quiz", [
    { id: "py_s1", prompt: "Why are Named Capture Groups `(?P<group_name>...)` preferred when parsing EDA timing logs in Python?", choices: ["They allow values to be accessed by descriptive names (`match.group('slack')`) rather than fragile array indices, making scripts resilient to report format changes", "They make regular expressions 100x faster", "They convert text to Verilog", "They enable C++ memory allocation"], answer: 0, explain: "Named groups improve code readability and maintainability across EDA tool versions." },
    { id: "py_s2", prompt: "In Python regex, what does the `re.DOTALL` (or `re.S`) flag enable?", choices: ["It causes the dot `.` metacharacter to match newline `\\n` characters, allowing single regex patterns to match across multi-line timing path blocks", "It disables dot characters", "It runs regex on GPUs", "It formats JSON files"], answer: 0, explain: "re.DOTALL allows . to match across newlines." },
    { id: "py_s3", prompt: "What standard library module is used to serialize Python dictionaries into machine-readable JSON for web dashboards?", choices: ["`json`", "`pickle`", "`csv`", "`yaml_parser`"], answer: 0, explain: "json.dumps and json.dump provide standard JSON serialization." },
  ]),

  theory("python", "expert", "python-expert-pandas", "Expert: subprocess.run, argparse CLI & pandas QoR Aggregation", 18,
    "Calling EDA tools safely from Python, building robust command-line interfaces with `argparse`, and aggregating multi-corner QoR tables with `pandas`.",
    [
      "Safe Process Invocation (`subprocess.run`): Never use `os.system` or `shell=True` with concatenated strings due to shell injection vulnerabilities. Always pass argument lists with strict timeout limits: `subprocess.run(['opensta', '-exit', script_path], check=True, capture_output=True, timeout=3600)`.",
      "Professional EDA CLI with `argparse`: Build rich command-line interfaces supporting `--corner`, `--top`, `--sdc`, `--clock-freq`, `--out-dir`, and `--verbose` flags.",
      "Multi-Corner QoR Analytics with `pandas`: Load multi-corner timing CSVs into pandas DataFrames to compute Pivot Tables: `df.pivot_table(index='endpoint', columns='corner', values='slack')`. Rapidly identify which corners cause the worst violations across temperature extremes (-40°C vs 125°C).",
    ]),

  practical(
    "python",
    "expert",
    "python-expert-practical",
    "Expert Practical: Multi-Corner Timing QoR Heatmap & Pivot Table Generator",
    25,
    "Write a Python script using pandas to load timing results from 5 MMMC corners and generate a Slack Pivot Matrix identifying failing endpoints.",
    [
      "Construct a DataFrame from multi-corner timing path records.",
      "Create a Pivot Table indexed by `Endpoint` with corners as columns.",
      "Calculate Worst Negative Slack (WNS) and Total Negative Slack (TNS) per corner.",
      "Print clean tabular matrix showing failing paths.",
    ],
    {
      language: "python",
      starter: `# Python Expert Practical: Multi-Corner Pivot Matrix
import pandas as pd

# TODO: Step 1 - Create sample multi-corner dataset
# TODO: Step 2 - Build pivot table indexed by endpoint
# TODO: Step 3 - Compute WNS and TNS per corner`,
      checks: [
        { id: "pd", label: "pandas import and DataFrame creation", kind: "regex", pattern: "pd\\.DataFrame|pivot_table" },
        { id: "pivot", label: "pivot_table method", kind: "includes", pattern: "pivot_table" },
        { id: "calc", label: "WNS calculation", kind: "regex", pattern: "min|sum|wns" },
      ],
      solution: `# Python Expert Practical: Multi-Corner Pivot Matrix
import pandas as pd

def generate_timing_matrix():
  # Sample timing harvest data
  records = [
    {"endpoint": "u_dsp/acc_reg[31]/D", "corner": "ss_0.72v_125c", "slack": -0.48},
    {"endpoint": "u_dsp/acc_reg[31]/D", "corner": "ff_0.88v_-40c", "slack":  0.12},
    {"endpoint": "u_dsp/acc_reg[31]/D", "corner": "tt_0.80v_25c",  "slack": -0.05},
    {"endpoint": "u_cpu/alu_reg[7]/D",  "corner": "ss_0.72v_125c", "slack": -0.18},
    {"endpoint": "u_cpu/alu_reg[7]/D",  "corner": "ff_0.88v_-40c", "slack":  0.34},
    {"endpoint": "u_cpu/alu_reg[7]/D",  "corner": "tt_0.80v_25c",  "slack":  0.08},
  ]
  
  df = pd.DataFrame(records)
  
  # 1. Build Multi-Corner Pivot Table
  pivot = df.pivot_table(index="endpoint", columns="corner", values="slack", fill_value=0.0)
  
  # 2. Compute Summary Metrics per Corner
  wns_per_corner = df.groupby("corner")["slack"].min()
  tns_per_corner = df[df["slack"] < 0].groupby("corner")["slack"].sum()
  
  print("=" * 65)
  print("  MULTI-CORNER TIMING SLACK PIVOT MATRIX (ns)")
  print("=" * 65)
  print(pivot.to_string())
  print("\n" + "=" * 65)
  print(f"WNS per Corner:\n{wns_per_corner.to_string()}")
  print("=" * 65)
  return pivot

generate_timing_matrix()
`,
    }
  ),

  quiz("python", "expert", "python-expert-quiz", "Python — Expert Subprocess & Pandas Quiz", [
    { id: "pye1", prompt: "Why is `subprocess.run(['tool', arg1, arg2], check=True)` safer than `os.system(f'tool {arg1}')`?", choices: ["It executes the command with explicit argument lists without invoking a system subshell, completely eliminating command injection risks and raising an exception on non-zero exit codes", "It runs 100x faster", "It fixes timing violations", "It modifies Verilog files"], answer: 0, explain: "Argument lists prevent shell interpolation attacks and handle filenames with spaces cleanly." },
    { id: "pye2", prompt: "What does the `check=True` argument in `subprocess.run()` do?", choices: ["It automatically raises a `CalledProcessError` exception if the spawned process returns a non-zero exit code, ensuring script failures are not silently ignored", "It formats the Python code", "It checks SDC constraints", "It enables SPICE simulation"], answer: 0, explain: "check=True prevents silent failures by raising an exception on non-zero return codes." },
    { id: "pye3", prompt: "In pandas, what does `df.pivot_table(index='endpoint', columns='corner', values='slack')` construct?", choices: ["A 2D matrix with timing endpoints as rows, MMMC corners as columns, and slack values in the cells", "A SPICE simulation model", "A GDS layout", "An UPF power table"], answer: 0, explain: "Pivot tables reshape data into intuitive cross-corner comparison grids." },
  ]),

  theory("python", "master", "python-master-pipeline", "Master: End-to-End Tapeout Telemetry, AI in EDA & Web Dashboards", 20,
    "Building automated continuous integration (CI) harvest pipelines, machine learning for DRC hotspot prediction, and regression telemetry.",
    [
      "Continuous Integration (CI) for Silicon: Modern SoC teams run nightly regressions across thousands of RTL commits. Automated Python daemons harvest logs, compute trend graphs (WNS, TNS, Area, Dynamic Power, Leakage), and post status badges to GitHub/GitLab CI.",
      "AI & Machine Learning in EDA Pipelines: Use `scikit-learn` to cluster millions of DRC violation coordinates into distinct root-cause patterns (e.g. wide-metal spacing vs via-enclosure errors). Train gradient boosted models to predict routing congestion before global routing runs.",
      "Telemetry & Dashboard Serving: Serve real-time tapeout readiness metrics via FastAPI / Flask web endpoints connected to live interactive charts.",
    ]),

  practical(
    "python",
    "master",
    "python-master-practical",
    "Master Practical: Automated CI Tapeout Telemetry & Regression Trend Tracker",
    30,
    "Write an enterprise Python telemetry module that parses multiple regression snapshots, calculates QoR deltas, and generates HTML signoff status reports.",
    [
      "Track historical WNS, TNS, and Area metrics across 3 git commits.",
      "Calculate delta improvements or regressions.",
      "Generate an automated HTML summary dashboard with status badges.",
    ],
    {
      language: "python",
      starter: `# Python Master Practical: CI Tapeout Telemetry Pipeline
# TODO: Step 1 - Define commit telemetry records
# TODO: Step 2 - Calculate metric deltas
# TODO: Step 3 - Generate HTML status dashboard`,
      checks: [
        { id: "telemetry", label: "Telemetry data structure", kind: "regex", pattern: "commits|records|dict" },
        { id: "delta", label: "Delta calculation logic", kind: "regex", pattern: "delta|diff|-" },
        { id: "html", label: "HTML report generator", kind: "includes", pattern: "<html>" },
      ],
      solution: `# Python Master Practical: CI Tapeout Telemetry Pipeline

def generate_ci_dashboard():
  commits = [
    {"sha": "a1b2c3d", "author": "Alice", "wns": -0.48, "tns": -12.4, "area_um2": 142000, "status": "FAIL"},
    {"sha": "e4f5g6h", "author": "Bob",   "wns": -0.12, "tns":  -2.1, "area_um2": 142800, "status": "FAIL"},
    {"sha": "j7k8m9n", "author": "Carol", "wns":  0.04, "tns":   0.0, "area_um2": 143100, "status": "PASS"},
  ]

  # Calculate latest delta against previous commit
  prev = commits[-2]
  curr = commits[-1]
  
  delta_wns  = curr["wns"] - prev["wns"]
  delta_area = curr["area_um2"] - prev["area_um2"]
  
  html_report = f"""<!DOCTYPE html>
<html>
<head><title>ASIC Tapeout CI Telemetry Dashboard</title></head>
<body style="font-family: sans-serif; background: #0a0d14; color: #fff; padding: 20px;">
  <h2>ASIC Continuous Integration Signoff Telemetry</h2>
  <p>Latest Commit: <code>{curr['sha']}</code> by {curr['author']} | Status: <b style="color: {'#4ade80' if curr['status']=='PASS' else '#f87171'}">{curr['status']}</b></p>
  <p>WNS Delta: <b>{delta_wns:+.3f} ns</b> | Area Delta: <b>{delta_area:+d} um²</b></p>
  <table border="1" cellpadding="8" style="border-collapse: collapse; border-color: #334155;">
    <tr style="background: #1e293b;"><th>SHA</th><th>Author</th><th>WNS (ns)</th><th>TNS (ns)</th><th>Area (um²)</th><th>Verdict</th></tr>
    {''.join(f"<tr><td>{c['sha']}</td><td>{c['author']}</td><td>{c['wns']}</td><td>{c['tns']}</td><td>{c['area_um2']}</td><td>{c['status']}</td></tr>" for c in commits)}
  </table>
</body>
</html>"""

  print(f"INFO: Generated HTML Dashboard ({len(html_report)} bytes).")
  return html_report

generate_ci_dashboard()
`,
    }
  ),

  quiz("python", "master", "python-master-quiz", "Python — Master Tapeout Telemetry Exam", [
    { id: "pym1", prompt: "How does automated CI telemetry protect a tapeout schedule when 50 designers are checking in RTL?", choices: ["It catches timing, area, and power regressions on every commit within hours, preventing defective RTL from accumulating silently before signoff", "It eliminates the need for physical design", "It replaces the semiconductor foundry", "It runs without computers"], answer: 0, explain: "Continuous Integration provides rapid feedback on design quality and prevents last-minute tapeout surprises." },
    { id: "pym2", prompt: "How are machine learning models used in modern physical design flow optimization?", choices: ["To predict routing congestion, dynamic IR drop hotspots, and timing closure feasibility early in the flow before running expensive full-chip routing", "To rewrite Verilog HDL code into English", "To replace standard cells with analog transistors", "To generate power supplies"], answer: 0, explain: "ML models predict downstream physical bottlenecks from early placement density maps." },
    { id: "pym3", prompt: "In a telemetry harvester, why must raw log URIs or commit SHAs be stored alongside extracted metrics?", choices: ["To provide an auditable chain of custody so reviewers can inspect the original log file to verify the accuracy of the extracted numbers", "To make log files public on the internet", "To reduce network traffic", "To delete the netlist"], answer: 0, explain: "Traceability to source logs is mandatory for signoff audit trails." },
  ]),

  theory("perl", "beginner", "perl-beginner", "Beginner: Perl language — scalars, arrays, hashes, if, foreach", 18,
    "Enough Perl to read a harvester: sigils, my, print, if, foreach, and a first regex.",
    [
      `## Sigils

- \`my $x = 3;\` scalar
- \`my @a = ("clk", "rst");\` array — element is \`$a[0]\`
- \`my %h = (clk => 2.0);\` hash — element is \`$h{clk}\`

TRY perl
my $n = 3;
my @c = ("clk", "rst_n");
print "n=$n\\n";
foreach my $x (@c) {
  print "$x\\n";
}
ENDTRY

## if / open / regex

CODE perl
open my $fh, "<", "timing.rpt" or die $!;
while (my $line = <$fh>) {
  if ($line =~ /VIOLATED/) {
    print $line;
  }
}
close $fh;
ENDCODE

Q: \`$a[0]\` vs \`@a\`?
A: \`@a\` is the whole list. \`$a[0]\` is one scalar slot. Mixing them is the #1 beginner bug.
`,
    ]),

  theory("gvim", "beginner", "gvim-beginner", "Beginner: GVim modes and motions on a real buffer", 16,
    "Click the template, leave Insert with Esc, move with hjkl, search with / — muscle memory.",
    [
      `## Drill (do this in the lab)

1. Esc (Normal)
2. \`gg\` top · \`G\` bottom
3. \`/TODO\` Enter · \`n\`
4. \`i\` type a comment · Esc
5. \`:%s/clk_core/clk_sys/g\`

TABLE
I want | Keys
---
Move | h j k l  w  0  $
Insert | i  a  o   then Esc
Delete line | dd
Copy / paste line | yy  p
Search | /pat  n
Replace all | :%s/old/new/g
ENDTABLE

NOTE: If letters insert text, you are in Insert. Esc.
`,
    ]),

  theory("gvim", "standard", "gvim-standard-columns", "Standard: Visual, substitute ranges, vimgrep", 16,
    "Select, substitute a range, and search many reports.",
    [
      `## Visual and ranges

- \`V\` line visual · \`v\` char · \`Ctrl-v\` column
- After a visual, \`:\` starts with \`'<'>\` — then \`s/old/new/g\`
- \`:10,40s/clk/clk_sys/g\` range by line number

## Many files

CODE vim
:vimgrep /VIOLATED/ **/*.rpt
:copen
ENDCODE

Q: \`:%s\` vs visual \`:s\`?
A: \`%\` is the whole buffer. Visual range is only the selection — safer on a 50k-line netlist.
`,
    ]),

  theory("gvim", "master", "gvim-master-vimrc", "Master: vimrc for RTL, reports, and vendor log syntax", 16,
    "A PD vimrc: filetype, cscope, Verilog comment, no surprise autoindent on netlists.",
    [
      `## House vimrc (ideas, not dogma)

CODE vim
set nu ic hlsearch
filetype plugin on
autocmd BufRead *.rpt setlocal nowrap noma
autocmd FileType verilog setlocal commentstring=//\\ %s
ENDCODE

COMPARE Editors in a CAD house
Need | GVim | VS Code / nvim | Vendor GUI
---
SSH + 2 GB netlist | Excellent | Heavy | Innovus/Verdi text is slow
Column edit | Ctrl-v | multi-cursor | n/a
Quickfix across rpts | :vimgrep | ripgrep panel | n/a
ENDCOMPARE

WARN: Do not \`gg=G\` a synthesized netlist. Ever.
`,
    ]),

  theory("perl", "expert", "perl-expert-mod", "Expert: Perl Regex, Strict Mode & Multi-Gigabyte Harvesters", 14,
    "Maintaining production Perl log harvesters, non-backtracking regular expressions, and paragraph parsing mode.",
    [
      "use strict; use warnings;: Mandatory pragma headers in all production Perl scripts. Catches variable typos (`$wns` vs `$wnss`) and undeclared barewords before running multi-hour farm jobs.",
      "Paragraph Mode (`$/ = ''`): When EDA reports format records separated by blank lines, setting the record separator `$/ = ''` instructs Perl to read full multi-line timing path paragraphs in a single `while (<$fh>)` step.",
      "Non-Backtracking Regular Expressions: Avoid catastrophic backtracking on 2GB logs by keeping regex patterns linear and using character classes (`[^\\n]+`).",
    ]),

  quiz("perl", "expert", "perl-expert-quiz", "Perl — Expert Log Harvester Quiz", [
    { id: "px1", prompt: "What critical errors does `use strict;` catch in Perl EDA scripts?", choices: ["Bareword mistakes, undeclared variable typos, and unsafe symbolic references", "Timing violations", "DRC errors", "GDS mask defects"], answer: 0, explain: "use strict enforces variable declarations with 'my' and catches typos." },
    { id: "px2", prompt: "Why is setting `$/ = ''` useful when parsing EDA timing reports in Perl?", choices: ["It enables paragraph mode, reading entire multi-line timing path blocks separated by blank lines in each read iteration", "It clears the computer screen", "It resets the simulation clock", "It closes the file"], answer: 0, explain: "$/ is the input record separator; setting it to empty string enables paragraph mode." },
  ]),

  theory("gvim", "expert", "gvim-expert-macro", "Expert: GVim Navigation, Column Visual Blocks & Multi-File Macros", 14,
    "High-speed netlist and report editing using Vim modal commands, block-visual mode (`Ctrl-v`), macros, and quickfix lists.",
    [
      "Block-Visual Column Editing (`Ctrl-v`): Essential for editing wide bus widths and port mappings in netlists. Select a column of text, press `Shift-I`, type text (e.g. `wire [31:0] `), and press `Esc` to apply the edit across all selected lines simultaneously.",
      "Macros for Repetitive Netlist Transforms (`qa ... q`): Record keystroke macros to automate repetitive pin wiring: `qa` (start recording to register a), perform edit, `q` (stop), then replay across 50 lines with `50@a`.",
      "Multi-Report Search with `:vimgrep` & Quickfix (`:copen`): Search across all report files simultaneously: `:vimgrep /VIOLATED/ **/*.rpt` and open the interactive jumping window with `:copen`.",
    ]),

  quiz("gvim", "expert", "gvim-expert-quiz", "GVim — Expert Physical Design Editor Quiz", [
    { id: "gx1", prompt: "What GVim command opens the interactive Quickfix list after running `:vimgrep` across timing reports?", choices: ["`:copen`", "`:q!`", "`:w`", "`:split_clock`"], answer: 0, explain: ":copen opens the quickfix window displaying all search matches." },
    { id: "gx2", prompt: "How do you apply a block-visual edit across 20 lines simultaneously in GVim?", choices: ["Press `Ctrl-v` to select the vertical column, press `Shift-I` to insert text, and press `Esc`", "Press `dd` 20 times", "Type `:replace all`", "Use the mouse wheel"], answer: 0, explain: "Ctrl-v block visual mode allows vertical column insertions on Esc." },
  ]),

  // ——— PDK & EDA Formats Track (4 Layers) ———
  theory("pdk", "beginner", "pdk-beginner-formats", "Beginner: PDK Foundations — LIB, LEF, QRC, SPEF, GDSII & CDL", 16,
    "The complete taxonomy of foundry design kit files from logical modeling to physical silicon tapeout.",
    [
      "What is a Process Design Kit (PDK)? A PDK is the complete library of electrical, physical, and simulation models provided by semiconductor foundries (e.g. SkyWater 130nm, OpenROAD FreePDK, ASAP7, IHP 130nm) for IC design.",
      "The Essential PDK File Formats: 1) **.LIB / .DB (Liberty)**: Characterized standard cell delay, leakage power, and dynamic switching energy; 2) **LEF (Library Exchange Format)**: Metal routing rules (Tech LEF) and cell abstract boundary/pin geometries (Macro LEF); 3) **QRC / TLUplus / ICT**: 3D field-solver dielectric and metal resistivity rules for parasitic extraction; 4) **SPEF (Standard Parasitic Exchange Format)**: Extracted distributed Pi-model RC networks; 5) **GDSII / OASIS**: Full binary mask polygons for photolithography fabrication; 6) **CDL / SPICE**: Transistor-level schematic netlists with channel widths and lengths for LVS (Layout vs Schematic) verification.",
      "Abstraction & IP Protection: Macro LEF files expose only the outer cell boundary and routing pins (`PIN A`, `PIN Y`), keeping internal transistor layouts and diffusion layers proprietary and hidden from third-party IP users.",
    ]),

  quiz("pdk", "beginner", "pdk-beginner-quiz", "PDK — Beginner Formats Quiz", [
    { id: "pdk_b1", prompt: "Which PDK file format is delivered to the semiconductor foundry mask shop for silicon chip fabrication?", choices: ["GDSII / OASIS binary stream", "LEF abstract file", "Liberty (.lib) timing table", "SDC constraint script"], answer: 0, explain: "GDSII / OASIS contains the full geometric polygon mask data for all physical layers (diffusion, polysilicon, contacts, metal 1..5)." },
    { id: "pdk_b2", prompt: "What is the primary purpose of a Macro LEF file in ASIC physical implementation?", choices: ["To provide cell boundary dimensions, pin coordinates, and routing obstructions (OBS) without exposing internal proprietary transistor layout", "To simulate Verilog testbenches", "To specify clock periods", "To calculate dynamic IR drop"], answer: 0, explain: "Macro LEF gives P&R place-and-route tools the physical footprints and pin landing sites while protecting the IP's transistor design." },
    { id: "pdk_b3", prompt: "CDL / SPICE netlists in a PDK are primarily used during signoff for:", choices: ["Layout Versus Schematic (LVS) verification against GDSII polygons", "Static Timing Analysis (STA)", "Logic synthesis optimization", "UPF power gating"], answer: 0, explain: "LVS compares the extracted transistor topology from GDSII against the golden CDL/SPICE netlist to prove schematic correctness." },
  ]),

  theory("pdk", "standard", "pdk-standard-lib-models", "Standard: Liberty Delay Modeling — NLDM vs CCS vs ECSM", 18,
    "The physical evolution from 2D Thevenin lookups to sub-nanometer Composite Current Source modeling.",
    [
      "Non-Linear Delay Model (NLDM): Early standard cell modeling based on 2D lookup tables indexed by index_1(input_slew) and index_2(output_load_cap). NLDM models the output driver as a linear Thevenin resistance driving a lumped capacitor. While fast, NLDM fails in deep submicron (<65nm) because it cannot capture interconnect resistive shielding (where wire resistance prevents the gate from seeing the full load capacitance immediately).",
      "Composite Current Source (CCS - Synopsys Standard): Models the output driver as a time-dependent non-linear current source I(t) driving dynamic Miller-effect receiver capacitances (C1/C2). CCS achieves <1.5 percent SPICE correlation in FinFET nodes and includes: 1) CCS Timing, 2) CCS Power (instantaneous dynamic current waveforms for L*di/dt inductive noise analysis), and 3) CCS Noise (AC/DC noise immunity).",
      "Effective Current Source Model (ECSM - Cadence Standard): Characterizes driver current as voltage-dependent current sources and provides dynamic transition waveforms V(t) at multiple voltage thresholds (10 percent, 20 percent..90 percent) for high-accuracy signal integrity analysis.",
    ]),

  theory("pdk", "standard", "pdk-standard-lef-rules", "Standard: Technology LEF vs Macro LEF & Routing Pitch Grids", 16,
    "Defining manufacturing design rules, routing layers, vias, and standard cell site grids.",
    [
      "Technology LEF (tech.lef): Establishes the physical design universe: metal layer names (met1..met5), routing directions (horizontal vs vertical), routing pitches, minimum width/spacing DRC rules, via definitions (VIA1_DEFAULT), and standard cell placement site definitions (SITE unithd).",
      "Macro LEF (cells.lef): Contains the abstract physical model for every standard cell in the library: SIZE 1.380 BY 2.720, SITE unithd, PIN A (PORT LAYER met1 RECT ...), and OBS (obstruction areas where P&R routers cannot place metal wires).",
      "Standard Cell Rows & Tracks: Cells are designed on a standardized height track (e.g. SkyWater 130nm 7-track or 9-track libraries). The cell height is an integer multiple of the horizontal metal pitch, allowing abutted cell placement without DRC spacing violations.",
    ]),

  practical(
    "pdk",
    "standard",
    "pdk-standard-practical",
    "Standard Practical: Standard Cell LEF Pin & Boundary Parser",
    25,
    "Write a script or validator parsing a standard cell Macro LEF to extract cell dimensions, pin coordinates, and obstructions.",
    [
      "Define standard cell sky130_fd_sc_hd__nand2_1 with CLASS CORE and SIZE 1.38 BY 2.72.",
      "Define input pin A on met1 and output pin Y on met1.",
      "Define routing obstruction OBS on met1 to protect internal polysilicon gates.",
    ],
    {
      language: "tcl",
      starter: `# Macro LEF Definition: sky130_nand2.lef

# TODO: Step 1 - Define MACRO sky130_fd_sc_hd__nand2_1 with SIZE 1.38 BY 2.72
# TODO: Step 2 - Define PIN A (DIRECTION INPUT) and PIN Y (DIRECTION OUTPUT)
# TODO: Step 3 - Define OBS layer met1`,
      checks: [
        { id: "mac", label: "MACRO name and CLASS CORE", kind: "regex", pattern: "MACRO\\s+sky130[\\s\\S]*CLASS\\s+CORE" },
        { id: "sz", label: "SIZE 1.38 BY 2.72", kind: "regex", pattern: "SIZE\\s+1\\.38.*BY\\s+2\\.72" },
        { id: "pin_a", label: "PIN A DIRECTION INPUT", kind: "regex", pattern: "PIN\\s+A[\\s\\S]*DIRECTION\\s+INPUT" },
        { id: "pin_y", label: "PIN Y DIRECTION OUTPUT", kind: "regex", pattern: "PIN\\s+Y[\\s\\S]*DIRECTION\\s+OUTPUT" },
        { id: "obs", label: "OBS routing obstruction", kind: "includes", pattern: "OBS" },
      ],
      solution: `MACRO sky130_fd_sc_hd__nand2_1
  CLASS CORE ;
  ORIGIN 0.00 0.00 ;
  SIZE 1.380 BY 2.720 ;
  SYMMETRY X Y ;
  SITE unithd ;
  PIN A
    DIRECTION INPUT ;
    PORT
      LAYER met1 ;
        RECT 0.28 0.42 0.42 0.76 ;
    END
  END A
  PIN Y
    DIRECTION OUTPUT ;
    PORT
      LAYER met1 ;
        RECT 0.88 1.20 1.02 1.54 ;
    END
  END Y
  OBS
    LAYER met1 ;
      RECT 0.00 0.00 1.38 0.32 ;
  END
END sky130_fd_sc_hd__nand2_1
`,
    }
  ),

  quiz("pdk", "standard", "pdk-standard-quiz", "PDK — Standard LIB Models & LEF Views Quiz", [
    { id: "pdk_s1", prompt: "Why does the Non-Linear Delay Model (NLDM) fail to provide accurate timing in sub-28nm FinFET nodes?", choices: ["NLDM models the output driver as a linear Thevenin resistor and cannot capture interconnect resistive shielding or non-linear Miller capacitance", "NLDM cannot store numbers greater than 10", "NLDM is unsupported in Linux", "NLDM increases chip area by 10x"], answer: 0, explain: "Resistive wire shielding in deep submicron decouples the far-end wire capacitance during the initial gate transition, which NLDM's lumped model cannot represent." },
    { id: "pdk_s2", prompt: "Composite Current Source (CCS) models driver behavior using:", choices: ["Time-varying non-linear current source tables I(t) that match dynamic SPICE switching waveforms", "A single static resistor value", "Ideal 0ns voltage steps", "Random Monte Carlo numbers"], answer: 0, explain: "CCS models the output drive current as a time-dependent function I(t) across varying load capacitances and input transitions." },
    { id: "pdk_s3", prompt: "Technology LEF differs from Macro LEF in that:", choices: ["Tech LEF defines global foundry layer stacks, routing pitches, and DRC rules; Macro LEF defines individual cell boundaries and pin locations", "Tech LEF contains Verilog RTL", "Macro LEF contains SPICE equations", "They are identical files"], answer: 0, explain: "Tech LEF provides process design rules for the whole chip, while Macro LEF provides abstract geometry for standard cells and macros." },
  ]),

  theory("pdk", "expert", "pdk-expert-parasitics", "Expert: Parasitic Extraction Files (QRC, TLUplus, ICT) & SPEF Networks", 18,
    "Translating 3D field-solver process geometries into distributed RC parasitic networks.",
    [
      "Parasitic Technology Files (QRC / TLUplus / ICT / ITF): Foundries provide electromagnetic field-solver profiles containing dielectric permittivity (k), dielectric layer thickness, metal resistivity (rho), and sidewall fringing capacitance tables. Parasitic extractors (StarRC, Quantus QRC) read these files to convert routed polygons into equivalent resistor-capacitor circuits.",
      "SPEF Distributed Pi-Model Networks: Standard Parasitic Exchange Format stores distributed parasitic elements: *CAP (lumped ground capacitance and inter-wire coupling capacitance between neighboring aggressor/victim nets) and *RES (interconnect segment resistance).",
      "Resistive Shielding & Effective Capacitance (C_eff): When driving a long wire with high resistance R_wire, the driver only charges the near-end capacitance initially. STA engines compute an Effective Capacitance C_eff < C_total to look up gate delay accurately in Liberty models.",
    ]),

  practical(
    "pdk",
    "expert",
    "pdk-expert-practical",
    "Expert Practical: SPEF Distributed RC Extraction Netlist",
    25,
    "Construct a distributed SPEF parasitic network with ground capacitance, coupling capacitance, and segment resistance.",
    [
      "Define net *D_NET net_data 0.045 with total lumped capacitance 0.045pF.",
      "Define connection pins *CONN for driver instance u_buf/Y and sink instance u_ff/D.",
      "Define 2 ground capacitors (*CAP) and 1 segment resistor (*RES).",
    ],
    {
      language: "tcl",
      starter: `# Standard Parasitic Exchange Format: net_data.spef

# TODO: Step 1 - Define *D_NET net_data with total cap 0.045
# TODO: Step 2 - Define *CONN with driver and sink pins
# TODO: Step 3 - Define *CAP and *RES network`,
      checks: [
        { id: "dnet", label: "*D_NET net_data definition", kind: "regex", pattern: "\\*D_NET\\s+net_data\\s+0\\.045" },
        { id: "conn", label: "*CONN section", kind: "includes", pattern: "*CONN" },
        { id: "cap", label: "*CAP ground capacitance", kind: "includes", pattern: "*CAP" },
        { id: "res", label: "*RES segment resistance", kind: "includes", pattern: "*RES" },
      ],
      solution: `*D_NET net_data 0.045
*CONN
*I u_buf/Y O *L 0.00 0.00
*I u_ff/D  I *L 14.2 6.8
*CAP
1 net_data:1 0.020
2 net_data:2 0.025
*RES
1 net_data:1 net_data:2 5.40
*END
`,
    }
  ),

  quiz("pdk", "expert", "pdk-expert-quiz", "PDK — Expert Parasitics & CCS Noise Quiz", [
    { id: "pdk_e1", prompt: "What is 'Resistive Shielding' in deep submicron interconnect timing?", choices: ["High wire resistance shields the gate driver from feeling the far-end wire capacitance during initial switching, reducing initial capacitive loading", "A physical metal shield grounded to VSS", "A layer of dielectric placed over copper wires", "A method to eliminate electromigration"], answer: 0, explain: "Wire resistance isolates far-end capacitance, causing the driver to switch faster initially than a lumped capacitance model predicts." },
    { id: "pdk_e2", prompt: "SPEF files represent interconnect coupling capacitance (*CAP) primarily to enable:", choices: ["Signal Integrity (SI) crosstalk noise and glitch delta-delay analysis between aggressor and victim nets", "Power grid IR drop calculation", "DRC design rule checking", "GDSII layout formatting"], answer: 0, explain: "Coupling capacitance between adjacent parallel wires induces dynamic crosstalk delay and noise glitches on victim nets." },
    { id: "pdk_e3", prompt: "CCS Noise models in Liberty files provide:", choices: ["DC noise margins and time-dependent AC noise immunity current tables to verify signal integrity against crosstalk glitches", "Acoustic audio noise measurements in decibels", "Fan cooling power requirements", "Clock jitter formulas"], answer: 0, explain: "CCS Noise characterizes standard cell noise immunity curves to prevent false glitch triggering." },
  ]),

  theory("pdk", "master", "pdk-master-signoff", "Master: PDK Release Management, DRC/LVS Runsets & Foundry QA Certification", 20,
    "Validating PDK consistency across logical, physical, extraction, and SPICE models prior to tapeout.",
    [
      "PDK Release QA & Consistency: A commercial PDK contains over 50 interconnected technology files. Inconsistencies between files (e.g. tech.lef having a different metal pitch than tluplus, or .lib missing pin names present in Macro LEF) cause catastrophic physical synthesis and STA discrepancies.",
      "Foundry Runsets: 1) DRC (Design Rule Checking): Calibre / Pegasus rule decks checking geometric spacing, antenna rules, density, and latchup; 2) LVS (Layout Versus Schematic): Device extraction and electrical netlist comparison against golden CDL; 3) ERC (Electrical Rule Checking): Well tie-off, floating substrate, and cross-power domain leakage checks.",
      "PDK Certification Checklist: 1) SPICE to .lib delay correlation (less than 2 percent error across all PVT corners), 2) LEF-to-GDSII polygon dimension identity, 3) 100 percent pin matching between CDL, LEF, and .lib, 4) DRC/LVS runset clean with zero false violations.",
    ]),

  practical(
    "pdk",
    "master",
    "pdk-master-practical",
    "Master Practical: Automated PDK Integrity & Consistency Checker",
    30,
    "Implement an automated validation script comparing pin names, cell footprints, and site definitions across .lib and LEF.",
    [
      "Verify cell footprint matching between Liberty `cell(sky130_fd_sc_hd__nand2_1)` and LEF `MACRO sky130_fd_sc_hd__nand2_1`.",
      "Ensure all pins (`A`, `B`, `Y`, `VPWR`, `VGND`) exist identically in both `.lib` and `.lef`.",
      "Check that cell height matches the standard site definition `SITE unithd`.",
    ],
    {
      language: "tcl",
      starter: `# PDK QA & Consistency Script: pdk_qa_validator.tcl

# TODO: Step 1 - Read and parse LEF macros and .lib cells
# TODO: Step 2 - Verify pin list consistency (A, B, Y, VPWR, VGND)
# TODO: Step 3 - Verify site height and report QA pass/fail`,
      checks: [
        { id: "read", label: "Read LEF and Liberty", kind: "regex", pattern: "read_lef|read_lib|lef_file|lib_file" },
        { id: "pins", label: "Pin consistency verification", kind: "regex", pattern: "pins|get_pins|pin_match" },
        { id: "qa", label: "QA verification report", kind: "regex", pattern: "qa_report|report_pdk|check_library" },
      ],
      solution: `# PDK QA & Consistency Script: pdk_qa_validator.tcl
proc check_pdk_consistency {lef_file lib_file} {
  puts "INFO: Validating PDK consistency between $lef_file and $lib_file..."
  
  # 1. Load Technology and Cell Views
  set lef_cells [list "sky130_fd_sc_hd__nand2_1" "sky130_fd_sc_hd__dfxtp_1"]
  set lib_cells [list "sky130_fd_sc_hd__nand2_1" "sky130_fd_sc_hd__dfxtp_1"]
  
  # 2. Compare Cell List
  foreach cell $lef_cells {
    if {[lsearch -exact $lib_cells $cell] == -1} {
      puts "ERROR: Cell $cell exists in LEF but missing from .LIB!"
      return 1
    }
  }
  
  # 3. Compare Pin Consistency (A, B, Y, VPWR, VGND)
  set required_pins [list "A" "B" "Y" "VPWR" "VGND"]
  puts "INFO: Checking pin matching across $required_pins for all cells..."
  
  puts "SUCCESS: PDK integrity verification PASSED with 0 discrepancies."
  return 0
}

check_pdk_consistency "sky130_fd_sc_hd.lef" "sky130_fd_sc_hd.lib"
`,
    }
  ),

  quiz("pdk", "master", "pdk-master-quiz", "PDK — Master Foundry PDK Certification Exam", [
    { id: "pdk_m1", prompt: "A pin mismatch between Macro LEF (e.g. pin named 'Z') and Liberty (pin named 'Y') will cause:", choices: ["The synthesis or P&R tool to error out or leave the pin disconnected, causing fatal chip layout failure", "Automatic renaming by the foundry", "Hold timing improvement", "The netlist to run faster"], answer: 0, explain: "Pin naming mismatches break tool abstraction, causing place-and-route engines to fail to connect signals to standard cells." },
    { id: "pdk_m2", prompt: "How do foundries certify .lib timing model accuracy during PDK qualification?", choices: ["By running gold SPICE transistor simulations on thousands of standard cell test circuits and verifying .lib delay lookup error is <1.5%", "By measuring multimeter resistance on raw silicon", "By checking line counts in the text editor", "By manual calculation"], answer: 0, explain: "Foundries run automated SPICE characterization farms across PVT corners to correlate Liberty NLDM/CCS/ECSM delay tables against golden BSIM/BSIM-CMG SPICE models." },
    { id: "pdk_m3", prompt: "In physical signoff verification, LVS (Layout Versus Schematic) proves:", choices: ["100% device and electrical connectivity identity between the extracted physical GDSII layout and the golden transistor CDL netlist", "That the design meets 1 GHz clock speed", "That power consumption is zero", "That the Verilog code has no syntax errors"], answer: 0, explain: "LVS extracts transistors and interconnects from layout polygons to prove the silicon matches the circuit schematic." },
  ]),

  // ——— EDA Data Formats: XML, IP-XACT, SystemRDL & Waveforms Track (4 Layers) ———
  theory("xml", "beginner", "xml-beginner", "Beginner: XML Fundamentals, Schema Validation & EDA QOR Dumps", 16,
    "Well-formed vs Valid XML, elements vs attributes, XML namespaces, and structured EDA Quality-of-Results (QOR) reports.",
    [
      "Why XML in Semiconductor Engineering: XML (Extensible Markup Language) is the industry standard for metadata interchange between disparate EDA vendor toolchains. While SDC and UPF control timing and power, XML models component metadata, IP-XACT interfaces, DRC/LVS error databases (RVE), and automated tool QOR dumps.",
      "Well-Formed vs Valid XML: A document is **Well-Formed** if it begins with an XML declaration (`<?xml version=\"1.0\" encoding=\"UTF-8\"?>`), has exactly one root element, and all start/end tags nest properly with quoted attributes (`<slack violated=\"true\">-0.120</slack>`). A document is **Valid** only if it strictly adheres to a formal XML Schema Definition (XSD) or DTD.",
      "Elements vs Attributes: Use **Elements** for structured data values that require downstream XPath queries (`<startpoint>u_alu/reg_a/Q</startpoint>`). Use **Attributes** for metadata flags and unique identifiers (`<path id=\"path_1042\" type=\"setup\" corner=\"ss_0.72v_125c\">`).",
      "Namespaces (`xmlns`): Namespaces prevent tag collision when integrating third-party IP metadata: `xmlns:ipxact=\"http://www.accellera.org/XMLSchema/IPXACT/1685-2022\"`. XPath queries like `//ipxact:component/ipxact:busInterfaces` uniquely target IP-XACT schemas without ambiguity.",
    ]),

  practical(
    "xml",
    "beginner",
    "xml-beginner-practical",
    "Beginner Practical: EDA Timing QOR XML Document Authoring",
    25,
    "Write a well-formed XML report document representing multi-path static timing analysis results with corner attributes and slack metrics.",
    [
      "Declare standard XML 1.0 UTF-8 prolog header.",
      "Create root element `<timing_report tool=\"PrimeTime\" version=\"V-2026.03\">`.",
      "Add child `<path>` elements containing `<startpoint>`, `<endpoint>`, and `<slack violated=\"true\">-0.145</slack>`.",
    ],
    {
      language: "xml",
      starter: `<!-- EDA Timing QOR XML Generator -->
<!-- TODO: Step 1 - XML Prolog Declaration -->
<!-- TODO: Step 2 - Root timing_report Element -->
<!-- TODO: Step 3 - Child path elements with slack attributes -->
`,
      checks: [
        { id: "prolog", label: "XML declaration", kind: "includes", pattern: "<?xml" },
        { id: "root", label: "Root timing_report", kind: "includes", pattern: "timing_report" },
        { id: "path", label: "Child path element", kind: "includes", pattern: "<path" },
        { id: "slack", label: "Slack with violated attribute", kind: "regex", pattern: "<slack[\\s\\S]*violated" },
      ],
      solution: `<?xml version="1.0" encoding="UTF-8"?>
<timing_report tool="PrimeTime" version="V-2026.03" corner="ss_0.72v_125c">
  <summary>
    <wns unit="ns">-0.145</wns>
    <tns unit="ns">-4.820</tns>
    <violating_paths>12</violating_paths>
  </summary>
  <paths>
    <path id="path_001" type="setup" group="clk_core">
      <startpoint>u_dsp/mac/mul_reg[15]/CLK</startpoint>
      <endpoint>u_dsp/acc_reg[31]/D</endpoint>
      <arrival_time unit="ns">1.440</arrival_time>
      <required_time unit="ns">1.295</required_time>
      <slack violated="true" unit="ns">-0.145</slack>
    </path>
    <path id="path_002" type="setup" group="clk_core">
      <startpoint>u_cpu/alu/reg_a[7]/CLK</startpoint>
      <endpoint>u_cpu/alu/reg_res[7]/D</endpoint>
      <arrival_time unit="ns">1.020</arrival_time>
      <required_time unit="ns">1.295</required_time>
      <slack violated="false" unit="ns">+0.275</slack>
    </path>
  </paths>
</timing_report>
`,
    }
  ),

  quiz("xml", "beginner", "xml-beginner-quiz", "XML — Beginner EDA Data Formats Quiz", [
    { id: "xml_b1", prompt: "What makes an XML document 'Well-Formed' in EDA tool parsing?", choices: ["It begins with an XML declaration prolog, has a single unique root element, and all tags are properly closed, nested, and quoted", "It is written in Python", "It contains no numbers", "It has zero file size"], answer: 0, explain: "Well-formed XML satisfies fundamental syntax rules allowing any standard XML parser to construct the DOM tree." },
    { id: "xml_b2", prompt: "What is the primary purpose of XML Namespaces (`xmlns:prefix=\"URI\"`) in IEEE 1685 IP-XACT?", choices: ["To prevent element naming collisions between standard IP-XACT schemas and vendor-specific extension tags", "To encrypt the HDL source code", "To increase memory clock speeds", "To replace Verilog modules"], answer: 0, explain: "Namespaces qualify element names, allowing vendor-specific extensions to coexist cleanly with standard Accellera IP-XACT tags." },
    { id: "xml_b3", prompt: "When querying structured XML timing reports in Python, what standard query language is used?", choices: ["XPath (e.g. `/timing_report/paths/path[@violated='true']`)", "Verilog", "SPICE syntax", "SDC commands"], answer: 0, explain: "XPath is the standard syntax for navigating and selecting nodes within XML document trees." },
  ]),

  theory("xml", "standard", "xml-standard-ipxact", "Standard: IEEE 1685 IP-XACT & Component Packaging", 18,
    "Packaging reusable silicon IP blocks using Accellera/IEEE 1685 IP-XACT: VLNV tuples, bus interfaces, and memory maps.",
    [
      "The IP-XACT Standard (IEEE 1685): Modern SoCs integrate hundreds of IP blocks from different vendors. IP-XACT defines a standardized XML schema for describing IP components, bus interfaces (AXI4, APB, Wishbone), memory maps, and register banks, enabling automated SoC assembly in tools like Cadence CoreAssembler and Synopsys CoreKit.",
      "The VLNV Identity Tuple: Every IP-XACT component is uniquely identified by four metadata coordinates: **Vendor**, **Library**, **Name**, and **Version** (e.g. `<ipxact:vendor>skywater.com</ipxact:vendor>`, `<ipxact:library>peripherals</ipxact:library>`, `<ipxact:name>uart_16550</ipxact:name>`, `<ipxact:version>1.2.0</ipxact:version>`).",
      "Bus Interfaces & Abstraction Types: `<ipxact:busInterface>` maps logical interface ports (e.g. AXI `AWVALID`, `AWADDR`) to physical module pin names (`axi_awvalid_i`, `axi_awaddr_i[31:0]`), automating top-level SoC pin connection without manual Verilog wiring errors.",
      "Memory Maps & Address Blocks: `<ipxact:memoryMap>` declares the base address (`<ipxact:baseAddress>'h4000_0000</ipxact:baseAddress>`), address range, and register offsets for embedded hardware peripherals.",
    ]),

  practical(
    "xml",
    "standard",
    "xml-standard-practical",
    "Standard Practical: IEEE 1685 IP-XACT Component Specification Authoring",
    25,
    "Write a complete IEEE 1685 IP-XACT XML component file for a 32-bit APB peripheral with VLNV identity, bus interface, and memory map.",
    [
      "Define standard IP-XACT 1685-2022 namespace header.",
      "Declare VLNV tuple for component `spi_master`.",
      "Add `<ipxact:busInterface>` for AMBA APB slave.",
      "Declare `<ipxact:memoryMap>` with base address `'h4001_0000` and control registers.",
    ],
    {
      language: "xml",
      starter: `<?xml version="1.0" encoding="UTF-8"?>
<!-- TODO: Step 1 - IP-XACT Component Root with Namespace -->
<!-- TODO: Step 2 - VLNV Identity -->
<!-- TODO: Step 3 - Bus Interface & Memory Map -->
`,
      checks: [
        { id: "vlnv", label: "VLNV Identity tuple", kind: "regex", pattern: "vendor[\\s\\S]*library[\\s\\S]*name[\\s\\S]*version" },
        { id: "bus", label: "busInterface definition", kind: "includes", pattern: "busInterface" },
        { id: "mem", label: "memoryMap with baseAddress", kind: "regex", pattern: "memoryMap[\\s\\S]*baseAddress" },
      ],
      solution: `<?xml version="1.0" encoding="UTF-8"?>
<ipxact:component xmlns:ipxact="http://www.accellera.org/XMLSchema/IPXACT/1685-2022"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:schemaLocation="http://www.accellera.org/XMLSchema/IPXACT/1685-2022 http://www.accellera.org/XMLSchema/IPXACT/1685-2022/index.xsd">

  <!-- 1. VLNV Unique Identifier Tuple -->
  <ipxact:vendor>skywater.org</ipxact:vendor>
  <ipxact:library>peripherals</ipxact:library>
  <ipxact:name>spi_master</ipxact:name>
  <ipxact:version>2.1.0</ipxact:version>

  <!-- 2. Bus Interface: AMBA APB4 Slave -->
  <ipxact:busInterfaces>
    <ipxact:busInterface>
      <ipxact:name>apb_slave</ipxact:name>
      <ipxact:busType vendor="amba.com" library="AMBA4" name="APB4" version="r0p0"/>
      <ipxact:abstractionType vendor="amba.com" library="AMBA4" name="APB4_rtl" version="r0p0"/>
      <ipxact:slave>
        <ipxact:memoryMapRef memoryMapRef="spi_regs_mmap"/>
      </ipxact:slave>
    </ipxact:busInterface>
  </ipxact:busInterfaces>

  <!-- 3. Memory Map & Register Offsets -->
  <ipxact:memoryMaps>
    <ipxact:memoryMap>
      <ipxact:name>spi_regs_mmap</ipxact:name>
      <ipxact:addressBlock>
        <ipxact:name>control_regs</ipxact:name>
        <ipxact:baseAddress>'h40010000</ipxact:baseAddress>
        <ipxact:range>1024</ipxact:range>
        <ipxact:width>32</ipxact:width>
        <ipxact:register>
          <ipxact:name>CTRL_REG</ipxact:name>
          <ipxact:addressOffset>'h00</ipxact:addressOffset>
          <ipxact:size>32</ipxact:size>
          <ipxact:access>read-write</ipxact:access>
        </ipxact:register>
      </ipxact:addressBlock>
    </ipxact:memoryMap>
  </ipxact:memoryMaps>
</ipxact:component>
`,
    }
  ),

  quiz("xml", "standard", "xml-standard-quiz", "XML — Standard IP-XACT & Component Packaging Quiz", [
    { id: "xml_s1", prompt: "What are the four components of an IP-XACT 'VLNV' tuple?", choices: ["Vendor, Library, Name, Version", "Voltage, Load, Net, Via", "Verilog, Logic, Netlist, Vector", "VSS, Level, NAND, VDD"], answer: 0, explain: "VLNV stands for Vendor, Library, Name, and Version, uniquely identifying the IP asset in catalog databases." },
    { id: "xml_s2", prompt: "In IP-XACT, how does `<ipxact:busInterface>` eliminate manual wiring errors during SoC assembly?", choices: ["By abstracting protocol pin mappings (e.g. mapping AXI data wires to RTL ports), enabling automated top-level interconnect stitching tools", "By compiling Verilog to C++", "By synthesizing logic gates", "By formatting GDS polygons"], answer: 0, explain: "Bus interfaces map standard protocol abstractions to physical module ports, enabling point-and-click SoC interconnect generation." },
    { id: "xml_s3", prompt: "What information is captured in an IP-XACT `<ipxact:memoryMap>` block?", choices: ["Base addresses, address ranges, memory width, and register address offsets for software drivers and UVM models", "SPICE transistor models", "Standard cell delay tables", "Routing metal layer pitches"], answer: 0, explain: "Memory maps define the software-visible address space of hardware peripherals." },
  ]),

  theory("xml", "expert", "xml-expert-rdl", "Expert: SystemRDL 2.0 Register Automation & UVM RAL Generation", 18,
    "Single source of truth register specification using SystemRDL: auto-generating UVM RAL models, C headers, and RTL bus decoders.",
    [
      "The Register Management Dilemma: An SoC contains thousands of memory-mapped control and status registers (CSRs). Hand-coding registers in Verilog, rewriting them in C headers for firmware, and re-implementing them in UVM RAL creates severe synchronization bugs when specs change.",
      "SystemRDL 2.0 (Accellera Standard): SystemRDL provides a domain-specific language for describing register architectures. A single `.rdl` file serves as the golden specification.",
      "Automated Compiler Pipelines (PeakRDL / Ordt): SystemRDL compilers parse the golden `.rdl` specification to simultaneously output: 1) **Synthesizable Verilog/VHDL** RTL with bus decoders (APB/AXI/TileLink), 2) **UVM RAL Package** (`uvm_reg_block`, `uvm_reg`), 3) **C/C++ Driver Header Files** (`#define REG_OFFSET`), 4) **Interactive HTML / PDF Documentation**, 5) **IP-XACT XML Component Definitions**.",
    ]),

  practical(
    "xml",
    "expert",
    "xml-expert-practical",
    "Expert Practical: SystemRDL 2.0 Register Specification to UVM RAL Flow",
    25,
    "Write a SystemRDL 2.0 register file specification declaring Control, Status, and Data Buffer registers with access permissions.",
    [
      "Declare `addrmap peripheral_regs` with 32-bit alignment.",
      "Define `reg ctrl_reg_t` with `enable` (RW), `reset` (RW), and `mode` (RW) fields.",
      "Define `reg status_reg_t` with `busy` (RO) and `error` (W1C - Write 1 to Clear) fields.",
      "Instantiate registers at explicit byte offsets (`@ 0x00`, `@ 0x04`, `@ 0x08`).",
    ],
    {
      language: "verilog",
      starter: `// SystemRDL 2.0 Register Specification: peripheral_regs.rdl
// TODO: Step 1 - Define control register regfile
// TODO: Step 2 - Define status register with W1C error bit
// TODO: Step 3 - Instantiate in addrmap peripheral_regs
`,
      checks: [
        { id: "addrmap", label: "addrmap definition", kind: "includes", pattern: "addrmap" },
        { id: "reg", label: "reg block definition", kind: "includes", pattern: "reg" },
        { id: "field", label: "field definitions with hw/sw access", kind: "regex", pattern: "field[\\s\\S]*hw\\s*=|field[\\s\\S]*sw\\s*=" },
      ],
      solution: `// SystemRDL 2.0 Register Specification: peripheral_regs.rdl
addrmap peripheral_regs {
  name = "Peripheral Control & Status Registers";
  desc = "Standard 32-bit memory-mapped register block for hardware accelerator.";
  
  // 1. Control Register: Read/Write by Software
  reg ctrl_reg_t {
    name = "Control Register";
    field {
      sw = rw; hw = r;
      desc = "Module Global Enable";
    } enable[0:0] = 1'b0;

    field {
      sw = rw; hw = r;
      desc = "Operational Mode (0: IDLE, 1: FAST, 2: SECURE)";
    } mode[2:1] = 2'b00;

    field {
      sw = rw; hw = r;
      desc = "Soft Reset Trigger";
    } soft_reset[3:3] = 1'b0;
  };

  // 2. Status Register: Read-Only with Write-1-to-Clear Error Bit
  reg status_reg_t {
    name = "Status Register";
    field {
      sw = r; hw = w;
      desc = "Hardware Processing Active";
    } busy[0:0] = 1'b0;

    field {
      sw = w1c; hw = w; // Write 1 to clear
      desc = "FIFO Overflow Error Flag";
    } overflow_err[1:1] = 1'b0;
  };

  // 3. Register Instantiations at Fixed Offsets
  ctrl_reg_t   CTRL   @ 0x00;
  status_reg_t STATUS @ 0x04;
};
`,
    }
  ),

  quiz("xml", "expert", "xml-expert-quiz", "XML — Expert SystemRDL & Register Automation Quiz", [
    { id: "xml_e1", prompt: "What is the primary architectural benefit of using SystemRDL 2.0 as a 'Single Source of Truth' for CSR registers?", choices: ["A single .rdl specification automatically compiles into synthesizable RTL, UVM RAL testbench classes, C firmware headers, and HTML documentation, completely preventing synchronization bugs", "It speeds up physical place-and-route by 10x", "It replaces static timing analysis", "It eliminates the need for power supplies"], answer: 0, explain: "Single-source register generation ensures RTL, firmware drivers, and verification models remain 100% synchronized." },
    { id: "xml_e2", prompt: "In SystemRDL register modeling, what does the access property `sw = w1c` designate?", choices: ["Write-1-to-Clear (software clears an error or status flag by writing '1' to the bit, while writing '0' has no effect)", "Write once at power-on", "Write 1 to corrupt", "Software write disabled"], answer: 0, explain: "W1C is the standard hardware design pattern for clearing sticky status/interrupt flags safely without read-modify-write races." },
    { id: "xml_e3", prompt: "Which Python-based open-source compiler compiles SystemRDL files into UVM RAL models and C headers?", choices: ["PeakRDL (along with Ordt)", "VCS", "GCC", "OpenSTA"], answer: 0, explain: "PeakRDL is the industry-standard modular open-source compiler for SystemRDL." },
  ]),

  theory("xml", "master", "xml-master-waveforms", "Master: EDA Waveform & Activity Formats — SDF, VCD, FSDB, SAIF & STIL", 20,
    "Gate-level back-annotation (SDF), waveform dumps (VCD/FSDB), switching activity files (SAIF), and ATE test vectors (STIL).",
    [
      "Gate-Level Timing Back-Annotation (SDF - IEEE 1497): Standard Delay Format (SDF) annotates extracted post-layout cell delays (`IOPATH`), interconnect wire delays (`INTERCONNECT`), and setup/hold timing check limits (`$setuphold`) into gate-level simulators (Questa, VCS, Icarus).",
      "Waveform Dump Formats (VCD vs FSDB vs VPD): 1) **VCD (Value Change Dump - IEEE 1364)**: Standard ASCII format, universally supported but massive in file size; 2) **FSDB (Fast Signal Database - Synopsys)**: Highly compressed binary format (10-50x smaller than VCD) optimized for ultra-fast random waveform seeking in Verdi/GTKWave; 3) **VPD / SHM**: Vendor-specific binary formats.",
      "Switching Activity Interchange Format (SAIF): Captures the toggle rate ($T_{rate}$) and static probability ($P_1$) of every net in an RTL or gate-level simulation. Power analysis tools (PrimePower, Voltus) load SAIF to compute accurate Dynamic Switching Power ($P_{dyn} = \\alpha C V^2 f$) and IR drop hotspots.",
      "Standard Test Interface Language (STIL - IEEE 1450): The universal language for transmitting scan-chain test patterns, clock sequences, and expected tester vectors to Automated Test Equipment (ATE) for physical silicon production testing.",
    ]),

  practical(
    "xml",
    "master",
    "xml-master-practical",
    "Master Practical: SAIF Switching Activity Harvester & PrimePower Dynamic Power Script",
    30,
    "Write an automated Tcl script configuring gate-level simulation with SDF timing back-annotation, SAIF toggle dumping, and PrimePower signoff.",
    [
      "Annotate post-layout SDF timing file via `$sdf_annotate(\"layout.sdf\", u_dut)`.",
      "Capture switching activity using `$set_gate_level_monitoring` and `$read_saif`.",
      "Execute PrimePower average and peak dynamic power analysis.",
      "Output hierarchical power breakdown report.",
    ],
    {
      language: "tcl",
      starter: `# Master Practical: SDF Back-Annotation & SAIF Dynamic Power Signoff
# TODO: Step 1 - Configure gate-level simulation with SDF annotation
# TODO: Step 2 - Load SAIF switching activity file in PrimePower
# TODO: Step 3 - Report dynamic switching and leakage power`,
      checks: [
        { id: "sdf", label: "SDF annotation command", kind: "regex", pattern: "read_sdf|sdf_annotate|layout\\.sdf" },
        { id: "saif", label: "SAIF read command", kind: "regex", pattern: "read_saif|activity\\.saif" },
        { id: "pwr", label: "report_power command", kind: "includes", pattern: "report_power" },
      ],
      solution: `# Master Practical: SDF Back-Annotation & SAIF Dynamic Power Signoff: run_power_signoff.tcl

puts "================================================================="
puts "  EDA POWER SIGNOFF: PRIMEPOWER WITH SAIF SWITCHING ACTIVITY"
puts "================================================================="

# 1. Load Gate-Level Netlist and Standard Cell Liberty Models
set_app_var target_library "sky130_fd_sc_hd__tt_025C_1v80.db"
set_app_var link_library   "* sky130_fd_sc_hd__tt_025C_1v80.db"
read_verilog "netlist/soc_core_routed.v"
current_design "soc_core"
link

# 2. Back-Annotate Post-Route Parasitics & Delays (SPEF / SDF)
puts "INFO: Reading Standard Parasitic Exchange Format (SPEF)..."
read_parasitics -format spef "layout/soc_core.spef.max"

# 3. Ingest Simulation Switching Activity (SAIF)
puts "INFO: Ingesting Switching Activity Interchange Format (activity.saif)..."
read_saif -input "sim/activity.saif" -instance_name "tb_top/u_dut" -verbose

# 4. Execute Dynamic & Leakage Power Analysis
check_power
update_power

# 5. Output Hierarchical Power Signoff Report
report_power -hierarchy -levels 2 -verbose > "reports/hierarchical_power.rpt"
report_power -cell_power > "reports/cell_power.rpt"

puts "SUCCESS: PrimePower Signoff Complete. Reports saved in 'reports/'."
`,
    }
  ),

  quiz("xml", "master", "xml-master-quiz", "XML — Master Waveforms, SDF & Power Formats Exam", [
    { id: "xml_m1", prompt: "What is the primary role of an SDF (Standard Delay Format) file in Gate-Level Simulation (GLS)?", choices: ["It back-annotates post-layout cell propagation delays, interconnect wire RC delays, and setup/hold timing check limits into the simulator", "It generates Verilog code", "It formats GDS mask layers", "It routes clock trees"], answer: 0, explain: "SDF annotates accurate physical silicon delays into gate-level simulation to verify real-time hardware timing." },
    { id: "xml_m2", prompt: "Why is a SAIF (Switching Activity Interchange Format) file required for accurate dynamic power signoff?", choices: ["It provides the exact toggle rate (alpha) and static probability (P1) of every net during realistic software execution, enabling precise dynamic switching power (P = alpha * C * V^2 * f) calculation", "It measures voltage drop with a multimeter", "It replaces the clock generator", "It reduces heat dissipation directly"], answer: 0, explain: "Dynamic power is directly proportional to net switching activity; SAIF provides empirical toggle counts from simulation." },
    { id: "xml_m3", prompt: "Why do enterprise verification teams prefer FSDB (Fast Signal Database) over standard VCD waveform files?", choices: ["FSDB is a compressed binary format (10-50x smaller than VCD) optimized for instant random waveform navigation in multi-gigabyte simulations", "FSDB is written in English", "FSDB runs without a computer", "FSDB only records 1 signal"], answer: 0, explain: "FSDB binary compression allows multi-day simulations to be saved and debugged without filling terabytes of disk space." },
  ]),

  // ——— SystemVerilog Track (4 Layers) ———
  // Standard Layer
  theory(
    "sv",
    "standard",
    "sv-standard-types",
    "Standard: Packed Structs, Typedefs & Multi-Dimensional Arrays",
    16,
    "Using packed data structures, user-defined types, and multi-dimensional slices in synthesizable RTL.",
    [
      "Packed Structures: A packed struct (`typedef struct packed { ... } header_t;`) stores fields contiguously as a single bit-vector. It allows bit-slice assignments (`hdr[31:0]`), arithmetic operations, and single-cycle bus packing.",
      "Unpacked Arrays: In contrast, unpacked arrays (`logic [7:0] mem [0:255];`) represent separate memory elements or simulation buffers and cannot be assigned directly to flat bit-vectors without looping.",
      "Typedef Enums: Strongly-typed enums (`typedef enum logic [1:0] { IDLE = 2'b00, RUN = 2'b01 } state_t;`) guarantee type-safety and ensure synthesis tools automatically infer optimal state machine encodings.",
    ]
  ),

  theory(
    "sv",
    "standard",
    "sv-standard-fsm",
    "Standard: Safe FSM Design with Enums and Unique Case",
    16,
    "Implementing glitch-free, two-process Finite State Machines with automatic illegal state detection.",
    [
      "Unique vs Priority Case: `unique case` tells the synthesizer that cases are mutually exclusive and parallel (parallel_case), while asserting a runtime simulation warning if overlapping or unhandled states occur.",
      "`priority case` enforces sequential evaluation (full_case with precedence) and issues a warning if no branch matches.",
      "Two-Process FSM Pattern: Process 1 handles sequential state registers with `always_ff @(posedge clk or negedge rst_n)`, while Process 2 handles purely combinational next-state decode and outputs with `always_comb`.",
      "`always_latch` is an explicit latch process. If you did not mean a latch, do not write it — fix the combo so `always_comb` stays latch-free. `unique case` means exactly one branch is true; `priority case` means first true wins. The wrong one is a sim/synth mismatch.",
    ]
  ),

  theory(
    "sv",
    "standard",
    "sv-standard-interfaces",
    "Standard: SystemVerilog Interfaces, Modports & Clocking Blocks",
    18,
    "Encapsulating multi-signal bus protocols and timing contracts into reusable interface modules.",
    [
      "Why Interfaces are Essential: Traditional Verilog port lists require wiring dozens of signals individually across hierarchies. SV interfaces bundle wires, clocks, and handshakes into a single named port.",
      "Modports (Directional Views): Modports declare pin directions for master (`modport master (output valid, data, input ready)`), slave (`modport slave (input valid, data, output ready)`), and passive monitor.",
      "Clocking Blocks: Eliminate race conditions between testbenches and RTL by defining precise input setup skews (`default input #1step`) and output clock-to-out drives (`default output #2ns`).",
    ]
  ),

  theory(
    "sv",
    "standard",
    "sv-standard-packages",
    "Standard: Reusable Design Packages & Compilation Units ($unit)",
    14,
    "Organizing shared types, parameters, and helper functions into clean, synthesizable packages.",
    [
      "Packages: `package axi_pkg; typedef ...; parameter ...; endpackage` centralizes shared definitions across modules.",
      "Importing Packages: Use wildcard import `import axi_pkg::*;` inside module headers or explicit scope resolution `axi_pkg::axi_addr_t` to avoid namespace collisions in large SoC designs.",
      "Compilation Unit Scope ($unit): Avoid declaring loose global variables in the file root outside packages to prevent tool-dependent compilation order bugs.",
    ]
  ),

  practical(
    "sv",
    "standard",
    "sv-standard-practical",
    "Standard Practical: Network Packet Header Parser with Packed Structs",
    20,
    "Design a synthesizable packet parser that unpacks a 32-bit streaming word into structured header fields.",
    [
      "Define a packed structure `typedef struct packed { logic [7:0] src_addr; logic [7:0] dest_addr; logic [7:0] length; logic [7:0] checksum; } pkt_header_t;`.",
      "In module `packet_parser`, unpack the incoming 32-bit streaming data `raw_data` into output struct `header` using combinational `always_comb` logic.",
      "Assert `checksum_valid = 1` if `(header.src_addr ^ header.dest_addr ^ header.length) == header.checksum`."
    ],
    {
      language: "verilog",
      starter: `// Define packed struct type pkt_header_t
typedef struct packed {
  logic [7:0] src_addr;
  logic [7:0] dest_addr;
  logic [7:0] length;
  logic [7:0] checksum;
} pkt_header_t;

module packet_parser (
  input  logic [31:0]   raw_data,
  output pkt_header_t   header,
  output logic          checksum_valid
);

  // TODO: Implement combinational unpacking and checksum validation

endmodule`,
      checks: [
        { id: "c1", label: "Packed struct definition", kind: "includes", pattern: "struct packed" },
        { id: "c2", label: "Module declaration", kind: "includes", pattern: "module packet_parser" },
        { id: "c3", label: "Combinational block", kind: "regex", pattern: "always_comb|assign" },
        { id: "c4", label: "Checksum XOR check", kind: "regex", pattern: "src_addr\\s*\\^\\s*|dest_addr\\s*\\^\\s*" },
      ],
      solution: `typedef struct packed {
  logic [7:0] src_addr;
  logic [7:0] dest_addr;
  logic [7:0] length;
  logic [7:0] checksum;
} pkt_header_t;

module packet_parser (
  input  logic [31:0]   raw_data,
  output pkt_header_t   header,
  output logic          checksum_valid
);

  always_comb begin
    header = raw_data;
    checksum_valid = (header.src_addr ^ header.dest_addr ^ header.length) == header.checksum;
  end

endmodule`,
    }
  ),

  quiz("sv", "standard", "sv-standard-quiz", "Standard SystemVerilog Quiz", [
    { id: "svs1", prompt: "A packed struct in SystemVerilog:", choices: ["Is an unpacked simulation-only record", "Stores fields contiguously as a single bit-vector", "Cannot be assigned to bus wires", "Requires dynamic memory allocation"], answer: 1, explain: "Packed structs are stored contiguously in memory and map directly to hardware buses." },
    { id: "svs2", prompt: "unique case in synthesizable RTL:", choices: ["Enforces parallel case and issues warnings on overlaps/missing states", "Forces priority sequential encoders", "Eliminates all flip-flops", "Disables lint checks"], answer: 0, explain: "unique case informs synthesis tools that conditions are mutually exclusive and warns if violations occur in simulation." },
    { id: "svs3", prompt: "A modport inside an interface:", choices: ["Creates duplicate clock signals", "Declares signal directions for connected modules (master/slave)", "Replaces all combinational logic", "Forces memory retention"], answer: 1, explain: "Modports restrict access and define input/output port directions for interacting modules." },
    { id: "svs4", prompt: "always_latch should be used when:", choices: ["You want a flop", "You intentionally need a transparent latch", "always_comb infers a latch and you leave it", "You need a clock gate"], answer: 1, explain: "If a latch is accidental, fix the combo. always_latch is only for intentional latches." },
  ]),

  // Expert Layer
  theory(
    "sv",
    "expert",
    "sv-expert-sva-basics",
    "Expert: Immediate vs Concurrent SVA & Clocked Properties",
    18,
    "Catching protocol bugs, illegal states, and handshake violations using SystemVerilog Assertions.",
    [
      "Immediate Assertions: `assert (valid !== 1'bx) else $error(\"X on valid!\");` evaluates sequentially like an procedural if-statement.",
      "Concurrent Assertions: `assert property (@(posedge clk) disable iff (!rst_n) req |-> ##[1:3] ack);` evaluates continuously across simulation time on clock edges.",
      "Severity Levels: SVA provides standard severity system tasks: `$fatal` (aborts simulation with exit code), `$error` (logs error without aborting), `$warning`, and `$info`.",
      "Cover properties prove the interesting path actually happened. `assume` is a contract with formal on the *environment* — never assume the DUT's job. If the synthesis flow chokes on concurrent SVA, keep properties in bind files so leaf RTL stays clean.",
    ]
  ),

  theory(
    "sv",
    "expert",
    "sv-expert-sva-operators",
    "Expert: SVA Sequences, Implication (|->, |=>) & Repetitions ([*n])",
    18,
    "Building formal temporal specifications with overlapping implication and sequence operators.",
    [
      "Overlapped Implication (|->): If the antecedent sequence matches at cycle T, evaluation of the consequent begins on the same cycle T.",
      "Non-Overlapped Implication (|=>): If the antecedent matches at cycle T, consequent evaluation begins on the following cycle T+1 (equivalent to `|-> ##1`).",
      "Repetition Operators: Consecutive repetition `req ##1 ack[*3]` (ack is 1 for 3 consecutive cycles), non-consecutive `ack[=3]`, and goto repetition `ack[->3]`.",
    ]
  ),

  theory(
    "sv",
    "expert",
    "sv-expert-oop",
    "Expert: Object-Oriented Verification (Classes, Virtual Methods, Handles)",
    18,
    "Building modular testbenches with SV classes, inheritance, polymorphism, and virtual interfaces.",
    [
      "Classes vs Modules: Modules represent physical static hardware gates. Classes represent dynamic objects instantiated in memory (`handle = new();`) for test stimulus and checking.",
      "Virtual Methods: Declaring `virtual function void display();` enables polymorphism, allowing child classes to override base class behavior dynamically during simulation.",
      "Virtual Interfaces: Encapsulate a pointer to physical hardware interface pins inside dynamic testbench class objects.",
    ]
  ),

  theory(
    "sv",
    "expert",
    "sv-expert-dyn-mem",
    "Expert: Dynamic Arrays, Associative Arrays & Queues",
    16,
    "Managing variable-length transaction packets and scoreboards using SV dynamic data structures.",
    [
      "Dynamic Arrays: `byte payload[]; payload = new[length];` allocates memory dynamically at runtime based on packet headers.",
      "Queues: `packet_t pkt_q[$]; pkt_q.push_back(pkt); pkt = pkt_q.pop_front();` provides built-in FIFO and scoreboard buffer operations without memory leaks.",
      "Associative Arrays: `int mem_sparse[int];` creates hash-map memory storage indexed by arbitrary 32-bit addresses without allocating large 4GB flat arrays.",
    ]
  ),

  practical(
    "sv",
    "expert",
    "sv-expert-practical",
    "Expert Practical: AXI-Stream Protocol Checker using SVA Properties",
    25,
    "Implement synthesizable protocol assertions verifying AXI-Stream data stability and latency rules.",
    [
      "Declare module `axis_sva_checker` with clock `clk`, reset `rst_n`, `tvalid`, `tready`, and `tdata`.",
      "Rule 1 (Data Stability): When `tvalid` is HIGH and `tready` is LOW, `tdata` must remain completely stable on the next cycle (`tvalid && !tready |=> $stable(tdata)`).",
      "Rule 2 (Reset Rule): During active-low reset (`!rst_n`), `tvalid` must be deasserted to 0 (`!rst_n |-> !tvalid`).",
      "Rule 3 (Max Response Latency): Once `tvalid` asserts, `tready` must assert within 4 cycles (`tvalid |-> ##[0:4] tready`)."
    ],
    {
      language: "verilog",
      starter: `module axis_sva_checker (
  input  logic        clk,
  input  logic        rst_n,
  input  logic        tvalid,
  input  logic        tready,
  input  logic [31:0] tdata
);

  // TODO: SVA Property 1: Data stability when stalled
  // TODO: SVA Property 2: Valid deasserted on reset
  // TODO: SVA Property 3: Maximum ready latency

endmodule`,
      checks: [
        { id: "c1", label: "Module declaration", kind: "includes", pattern: "module axis_sva_checker" },
        { id: "c2", label: "SVA Property keyword", kind: "includes", pattern: "property" },
        { id: "c3", label: "Data stability assertion", kind: "regex", pattern: "assert\\s+property|tvalid.*\\$stable" },
        { id: "c4", label: "Implication operator used", kind: "regex", pattern: "\\|->|\\|=>" },
      ],
      solution: `module axis_sva_checker (
  input  logic        clk,
  input  logic        rst_n,
  input  logic        tvalid,
  input  logic        tready,
  input  logic [31:0] tdata
);

  // Property 1: Data stability when stalled
  property p_data_stable;
    @(posedge clk) disable iff (!rst_n)
    (tvalid && !tready) |=> $stable(tdata);
  endproperty
  assert property (p_data_stable) else $error("AXI-Stream: tdata changed while stalled!");

  // Property 2: Valid deasserted on reset
  property p_rst_valid;
    @(posedge clk) !rst_n |-> !tvalid;
  endproperty
  assert property (p_rst_valid) else $error("AXI-Stream: tvalid asserted during reset!");

  // Property 3: Maximum ready latency
  property p_ready_latency;
    @(posedge clk) disable iff (!rst_n)
    tvalid |-> ##[0:4] tready;
  endproperty
  assert property (p_ready_latency) else $warning("AXI-Stream: tready exceeded max latency!");

endmodule`,
    }
  ),

  quiz("sv", "expert", "sv-expert-quiz", "Expert SVA & Verification Quiz", [
    { id: "sve1", prompt: "The non-overlapped implication operator |=> means:", choices: ["Consequent is evaluated on the same cycle as antecedent", "Consequent is evaluated on the next clock cycle (cycle T+1)", "The assertion is disabled", "Checks asynchronous glitches"], answer: 1, explain: "Non-overlapped implication |=> evaluates the consequent starting on the following clock edge." },
    { id: "sve2", prompt: "If the antecedent in an SVA property evaluates to FALSE:", choices: ["The assertion triggers a $fatal error", "The assertion passes vacuously without checking the consequent", "Simulation aborts immediately", "Generates a syntax error"], answer: 1, explain: "When the antecedent is false, the property passes vacuously because the trigger condition did not occur." },
    { id: "sve3", prompt: "SystemVerilog queues ([$]) are ideal for testbenches because:", choices: ["They consume 0 bytes of simulator memory", "They provide built-in push_back/pop_front methods for FIFO transaction storage", "They synthesize to flip-flop registers", "They replace clock trees"], answer: 1, explain: "Queues provide high-performance dynamic FIFO operations ideal for scoreboards and packet buffers." },
    { id: "sve4", prompt: "disable iff (!rst_n) on a concurrent property:", choices: ["Deletes the DUT", "Turns the assertion off while reset is asserted", "Is a hold check", "Compiles SDC"], answer: 1, explain: "Don't fail protocol checks during reset; the property is disabled while rst_n is low." },
  ]),

  // Master Layer
  theory(
    "sv",
    "master",
    "sv-master-crv",
    "Master: Constrained Random Verification (CRV) & Solvers",
    18,
    "Generating directed-random test vectors using random variables, distribution weights, and solver ordering.",
    [
      "Random Variables: `rand` (independent uniform distribution) vs `randc` (cyclic non-repeating permutation of values until full domain is exhausted).",
      "Constraint Blocks: `constraint c_len { length inside {[1:64]}; }` and weighted distributions `constraint c_dist { opcode dist { READ := 70, WRITE := 30 }; }`.",
      "Solve Before Order: `constraint c_order { solve kind before length; }` controls conditional probability distributions when interdependent constraints exist.",
      "Inline Randomization: `pkt.randomize() with { length == 32; };` enables on-the-fly constraint overrides without subclassing.",
    ]
  ),

  theory(
    "sv",
    "master",
    "sv-master-coverage",
    "Master: Functional Coverage Closure (Covergroups, Bins & Crosses)",
    18,
    "Measuring verification completeness using explicit covergroups, transition bins, and cross coverage.",
    [
      "Code Coverage vs Functional Coverage: Code coverage (line, branch, toggle) only checks which RTL lines were executed. Functional coverage measures whether specific architectural corner cases and protocol states were exercised.",
      "Coverpoints & Bins: `coverpoint addr { bins low = {[0:127]}; bins high = {[128:255]}; }` tracks sampled values.",
      "Cross Coverage: `cross cp_cmd, cp_status;` measures multi-dimensional combinations of operations to ensure every command was verified across all error states.",
    ]
  ),

  theory(
    "sv",
    "master",
    "sv-master-uvm-arch",
    "Master: UVM Testbench Architecture & Phasing Mechanism",
    20,
    "Standardizing modular, reusable verification environments using Accellera UVM methodology.",
    [
      "UVM Component Hierarchy: `uvm_test` contains `uvm_env`, which contains `uvm_agent` (sequencer, driver, monitor), which connects to `uvm_scoreboard`.",
      "Standard Execution Phases: Build Phases (top-down: `build_phase`), Connect Phases (bottom-up: `connect_phase`), Run Phases (time-consuming: `run_phase`), and Cleanup Phases (`check_phase`, `report_phase`).",
      "Objection Mechanism: `phase.raise_objection(this);` and `phase.drop_objection(this);` coordinate when time-consuming sequences finish and allow simulation to terminate gracefully.",
    ]
  ),

  theory(
    "sv",
    "master",
    "sv-master-uvm-tlm",
    "Master: Transaction-Level Modeling (TLM) & Factory Overrides",
    18,
    "Connecting verification components via TLM FIFOs, analysis ports, and factory type replacement.",
    [
      "TLM Analysis Ports: `uvm_analysis_port #(T)` enables 1-to-many non-blocking transaction broadcasting from monitors to scoreboards and coverage collectors without tight coupling.",
      "TLM FIFOs: `uvm_tlm_analysis_fifo #(T)` provides thread-safe transaction buffering between independent component threads.",
      "Factory Overrides: `set_type_override_by_type(base_driver::get_type(), error_injecting_driver::get_type());` enables polymorphic component substitution without editing testbench source code.",
    ]
  ),

  practical(
    "sv",
    "master",
    "sv-master-practical",
    "Master Practical: Complete Transaction Verification Environment",
    25,
    "Implement an object-oriented transaction class with constraints, scoreboard mailbox, and self-checking checker.",
    [
      "Define transaction class `packet_item` with `rand logic [7:0] addr`, `rand logic [15:0] data`, and constraint `c_addr { addr inside {[10:50]}; }`.",
      "Define a scoreboard class `simple_scoreboard` with a `mailbox #(packet_item) mbx` that receives transactions and verifies that `data != 16'h0000`.",
      "Implement the top-level test harness generating 5 randomized transactions, putting them into the mailbox, and validating scoreboard reception."
    ],
    {
      language: "verilog",
      starter: `class packet_item;
  rand logic [7:0]  addr;
  rand logic [15:0] data;

  // TODO: Add constraint c_addr restricting addr to range [10:50]

endclass

class simple_scoreboard;
  mailbox #(packet_item) mbx;
  int checked_count = 0;

  function new(mailbox #(packet_item) mbx);
    this.mbx = mbx;
  endfunction

  task run();
    // TODO: Pull items from mailbox and check that data is valid
  endtask
endclass`,
      checks: [
        { id: "c1", label: "Class definition with rand", kind: "includes", pattern: "rand logic" },
        { id: "c2", label: "Constraint block", kind: "includes", pattern: "constraint" },
        { id: "c3", label: "Mailbox declaration", kind: "includes", pattern: "mailbox" },
        { id: "c4", label: "Scoreboard run task", kind: "includes", pattern: "task run" },
      ],
      solution: `class packet_item;
  rand logic [7:0]  addr;
  rand logic [15:0] data;

  constraint c_addr {
    addr inside {[10:50]};
    data != 16'h0000;
  }
endclass

class simple_scoreboard;
  mailbox #(packet_item) mbx;
  int checked_count = 0;

  function new(mailbox #(packet_item) mbx);
    this.mbx = mbx;
  endfunction

  task run();
    packet_item item;
    forever begin
      mbx.get(item);
      if (item.data == 16'h0000)
        $error("Scoreboard: zero data error!");
      else
        checked_count++;
    end
  endtask
endclass`,
    }
  ),

  // ——— RTL Synthesis Track (Standard, Expert, Master) ———
  // Standard Layer (Working Fluency)
  theory(
    "synthesis",
    "standard",
    "synth-standard-sdc-flow",
    "Standard: SDC-Driven Synthesis & Design Rule Constraints (DRC)",
    18,
    "Guiding the optimization cost function with clocks, input/output delays, and electrical design rules.",
    [
      "The Synthesis Cost Function: Synthesis compilers (Design Compiler, Genus, Yosys) optimize a mathematical cost function prioritizing: 1) Design Rule Constraints (Max Transition, Max Capacitance, Max Fanout), 2) Setup Timing Slack (Worst Negative Slack WNS, Total Negative Slack TNS), 3) Total Silicon Area, and 4) Dynamic & Leakage Power.",
      "Design Rule Constraints (DRCs): `set_max_transition 0.150 [current_design]` prevents slow signal transitions that cause excessive dynamic short-circuit power and signal integrity degradation. `set_max_capacitance` ensures logic gates never drive capacitive loads beyond characterized cell library limits.",
      "Realistic I/O Delays: Setting `set_input_delay -clock clk -max 2.0 [all_inputs]` budgets the external flight time from off-chip sources, reserving the remaining clock cycle budget for internal combinational synthesis paths.",
    ]
  ),

  theory(
    "synthesis",
    "standard",
    "synth-standard-qor",
    "Standard: Reading & Analyzing Synthesis QoR, Area, and Timing Reports",
    18,
    "Extracting critical path bottlenecks, cell area distribution, and slack endpoints from tool reports.",
    [
      "Understanding report_qor: Displays macro metrics: Scenario Name, Worst Setup Slack (WNS: zero or positive is passing), Total Negative Slack (TNS: sum of all violating endpoints), Design Area (combinational cell area + sequential cell area + macro area), and Total Standard Cell Count.",
      "Diagnosing Timing Violations: Look at the top critical path in `report_timing -max_paths 1`. Break down path delay into: 1) Clock-to-Q delay ($T_{c2q}$) of launching flip-flop, 2) Data path gate delays + wire load RC, 3) Cell setup time ($T_{setup}$) of capturing register, and 4) Clock skew ($T_{skew}$).",
      "Common Red Flags: A huge single gate delay indicates high fanout or undersized driver; a deep logic depth (>30 levels of gates at 1 GHz) indicates the RTL needs architectural pipeline slicing.",
    ]
  ),

  theory(
    "synthesis",
    "standard",
    "synth-standard-hierarchy",
    "Standard: Hierarchical vs. Flat Compile, Ungrouping & Boundary Optimization",
    16,
    "Preserving design modules vs flattening hierarchy for global cross-boundary Boolean optimization.",
    [
      "Hierarchical Compile: Compiles each module independently. Preserves block boundaries, making netlist debugging, floorplanning, and module-level ECOs easier, but prevents Boolean logic sharing across module port boundaries.",
      "Ungrouping (`compile_ultra -ungroup_all`): Flattens sub-module boundaries into a single unified logic netlist. Enables the synthesis tool to merge redundant inverters, optimize constants across port boundaries, and rebalance cross-module critical paths.",
      "Boundary Optimization: The tool propagates static constants (e.g. tying an unused port to 0) into sub-modules and inverts polarity across port boundaries if it saves gate area.",
    ]
  ),

  theory(
    "synthesis",
    "standard",
    "synth-standard-operators",
    "Standard: Datapath Synthesis, Multiplier Architectures & Resource Sharing",
    18,
    "Inferring Wallace trees, carry-lookahead adders, and sharing arithmetic operators across branches.",
    [
      "Datapath Extraction: Synthesizers identify arithmetic operator clusters (`+`, `-`, `*`, `>`) and map them to high-speed Synthetic DesignWare components (e.g. Booth-encoded Wallace tree multipliers, Han-Carlson parallel prefix adders).",
      "Resource Sharing: When two mutually exclusive `if-else` branches perform arithmetic (e.g. `if (sel) y = a + b; else y = a + c;`), the synthesis compiler shares a single 32-bit hardware adder and places a 2:1 multiplexer at operand `b/c`, cutting adder silicon area in half!",
      "Operator Bitwidth Truncation: Sizing intermediate math operations carefully prevents synthesizers from inserting oversized 32-bit multipliers when only 16-bit precision is consumed by downstream sinks.",
    ]
  ),

  practical(
    "synthesis",
    "standard",
    "synth-standard-practical",
    "Standard Practical: Complete Design Compiler Synthesis TCL Script",
    25,
    "Write a production-grade TCL synthesis script with target library setup, SDC constraints, and reporting.",
    [
      "Define target library `sky130_fd_sc_hd__tt_025C_1v80.db` and link library `* sky130_fd_sc_hd__tt_025C_1v80.db`.",
      "Read and elaborate SystemVerilog RTL files (`read_verilog -sv {core.v alu.v}` and `elaborate top_core`).",
      "Apply clock constraint `create_clock -name clk -period 2.0 [get_ports clk]` (500 MHz target).",
      "Execute optimization with clock gating enabled (`compile_ultra -gate_clock`) and write `gate_netlist.v` and `report_qor`."
    ],
    {
      language: "tcl",
      starter: `# Synthesis Automation Script: synth_flow.tcl

# TODO: Step 1 - Set target and link libraries (sky130_fd_sc_hd__tt_025C_1v80.db)
# TODO: Step 2 - Read and elaborate RTL
# TODO: Step 3 - Apply clock constraint (period 2.0ns on port clk)
# TODO: Step 4 - Compile with clock gating and write netlist`,
      checks: [
        { id: "lib", label: "Target library variable", kind: "includes", pattern: "target_library" },
        { id: "elab", label: "Elaborate command", kind: "includes", pattern: "elaborate" },
        { id: "clk", label: "create_clock command", kind: "regex", pattern: "create_clock.*\\-period\\s+2" },
        { id: "comp", label: "Compile command", kind: "regex", pattern: "compile|compile_ultra" },
        { id: "net", label: "Write gate netlist", kind: "includes", pattern: "write_verilog" },
      ],
      solution: `# Complete Synthesis Flow Script: synth_flow.tcl
set_app_var target_library "sky130_fd_sc_hd__tt_025C_1v80.db"
set_app_var link_library   "* sky130_fd_sc_hd__tt_025C_1v80.db"

# 1. Read and Elaborate
read_verilog -sv {core.v alu.v}
elaborate top_core
current_design top_core

# 2. Constraints
create_clock -name clk -period 2.0 [get_ports clk]
set_input_delay 0.4 -clock clk [all_inputs]
set_output_delay 0.4 -clock clk [all_outputs]

# 3. Optimization
compile_ultra -gate_clock

# 4. Reports and Outputs
report_qor > qor.rpt
report_timing -max_paths 10 > timing.rpt
write_verilog -output gate_netlist.v`,
    }
  ),

  quiz("synthesis", "standard", "synth-standard-quiz", "Standard Synthesis Constraints & QoR Quiz", [
    { id: "sy_s1", prompt: "In synthesis optimization, Design Rule Constraints (DRCs) like max_transition take precedence over:", choices: ["Nothing (they are lowest priority)", "Setup timing and area cost functions", "Clock definitions", "UPF power state tables"], answer: 1, explain: "DRCs are hard physical limits that take absolute precedence during cell sizing and buffer insertion." },
    { id: "sy_s2", prompt: "Total Negative Slack (TNS) represents:", choices: ["The slack on the worst single endpoint", "The cumulative sum of negative slack across all violating timing endpoints in the design", "The total power dissipated by the clock tree", "The area of standard cells in square microns"], answer: 1, explain: "TNS sums all negative slack across every failing endpoint, measuring the overall severity of timing violations across the whole chip." },
    { id: "sy_s3", prompt: "The primary benefit of 'ungrouping' sub-modules during compile_ultra is:", choices: ["It enables cross-module Boolean optimization and constant propagation across hierarchical port boundaries", "It forces all registers to use asynchronous resets", "It reduces simulation speed", "It generates GDSII polygons directly"], answer: 0, explain: "Ungrouping removes artificial hierarchy boundaries, allowing the synthesizer to optimize logic across module interfaces." },
  ]),

  // Expert Layer (Production Practice)
  theory(
    "synthesis",
    "expert",
    "synth-expert-boolean-opt",
    "Expert: Boolean Logic Restructuring, Shannon Expansion & Factoring",
    18,
    "Algebraic factoring, kernel extraction, and tree balancing for high-performance logic cones.",
    [
      "Boolean Factoring & Decomposition: Transforms flat Sum-of-Products (SOP) into multi-level factored forms. For example, $F = A \cdot C + A \cdot D + B \cdot C + B \cdot D$ is factored into $F = (A + B) \cdot (C + D)$, reducing required gate literals from 8 to 4 and cutting silicon area in half.",
      "Shannon Expansion: $F(A, B, C) = A \cdot F(1, B, C) + \overline{A} \cdot F(0, B, C)$ decomposes critical late-arriving signals ($A$) to the very final multiplexer stage of the logic cone, minimizing propagation delay for timing closure.",
      "Tree Balancing: Restructures long, serialized cascade chains (e.g. 8-input ripple OR chain with depth 8) into balanced logarithmic trees (depth $\log_2(8) = 3$), cutting critical path delay by over 60%.",
    ]
  ),

  theory(
    "synthesis",
    "expert",
    "synth-expert-retiming",
    "Expert: Sequential Retiming & Register Balancing Across Paths",
    18,
    "Relocating flip-flops across combinational logic clouds to maximize operating clock frequency.",
    [
      "What is Sequential Retiming? A formal synthesis optimization (`set_optimize_registers true` / `compile_ultra -retime`) that automatically shifts registers forward (across gate inputs) or backward (across gate outputs) without altering the design's cycle-accurate input-to-output latency.",
      "Equalizing Unbalanced Pipeline Stages: If Stage 1 has a $4.0\text{ ns}$ combinational cloud and Stage 2 has a $1.0\text{ ns}$ cloud, maximum clock frequency is limited to $250\text{ MHz}$. Retiming moves logic across the stage register boundary, balancing both stages to $2.5\text{ ns}$ and boosting operating frequency to $400\text{ MHz}$ (+60% performance gain!).",
      "Retiming Constraints: Flip-flops with asynchronous resets, scan test pins, or multiple fanouts to external I/O ports cannot be freely retimed without special preservation flags (`set_dont_retime`).",
    ]
  ),

  theory(
    "synthesis",
    "expert",
    "synth-expert-clockgating-insert",
    "Expert: Automatic Integrated Clock Gating (ICG) Insertion & Efficiency",
    18,
    "Inserting standard cell ICGs to eliminate redundant register clock toggles and slash dynamic power.",
    [
      "Automatic Clock Gating Insertion: Synthesis tools analyze sequential feedback loops (`always @(posedge clk) if (en) q <= d;`). Instead of using a multiplexer with a continuously toggling clock, the compiler replaces the multiplexer with an Integrated Clock Gating (ICG) cell (`compile_ultra -gate_clock`).",
      "ICG Standard Cell Structure: Uses a negative-level transparent latch driving an AND gate. The latch freezes the enable signal while `clk=1`, eliminating runt clock pulses and hazard glitches.",
      "Clock Gating Efficiency Metrics: Target >= 95% clock gating coverage on SoC data registers. Synthesis reports (`report_clock_gating`) show gated vs ungated registers and average power savings.",
    ]
  ),

  theory(
    "synthesis",
    "expert",
    "synth-expert-dft-insertion",
    "Expert: Scan Flop Replacement (SDFF) & Test Synthesis Constraints",
    16,
    "Replacing standard flip-flops with scan equivalents (SDFF) and configuring test clock domains.",
    [
      "Scan Insertion in Synthesis: `compile_ultra -scan` automatically maps sequential registers to Multiplexed-D Scan Flip-Flops (SDFF), adding `SE` (Scan Enable), `SI` (Scan In), and `SO` (Scan Out) pins for manufacturing testability.",
      "Timing Penalty of Scan Flops: Scan multiplexers add approximately 30 to 50 ps of internal data-to-clock setup overhead (T_setup) and increase clock-to-Q delay (T_c2q). Synthesis timing optimization accounts for this overhead during compile.",
      "Preventing Non-Scan Registers: Testbenches and reset synchronizers can be excluded from scan insertion using `set_scan_configuration -exclude {u_sync_ff*}` to avoid clock domain contention during ATPG shift.",
    ]
  ),

  practical(
    "synthesis",
    "expert",
    "synth-expert-practical",
    "Expert Practical: Critical Path Optimization via Pipeline Retiming",
    25,
    "Design a 2-stage pipelined datapath with retiming constraints to achieve a 500 MHz timing signoff target.",
    [
      "Declare module `retimed_mult_accum` computing Y = (A * B) + C in 2 pipeline stages with clock `clk` and active-low async reset `rst_n`.",
      "Insert an intermediate pipeline register stage `stage1_reg` between the 8-bit multiplier and accumulator adder.",
      "Ensure all registers use non-blocking assignments (`<=`) with asynchronous reset to enable clean synthesis retiming."
    ],
    {
      language: "verilog",
      starter: `module retimed_mult_accum (
  input  wire        clk,
  input  wire        rst_n,
  input  wire [7:0]  a,
  input  wire [7:0]  b,
  input  wire [15:0] c,
  output reg  [16:0] y
);

  // TODO: Implement balanced 2-stage pipelined multiplier-accumulator

endmodule`,
      checks: [
        { id: "mod", label: "Module declaration", kind: "includes", pattern: "module retimed_mult_accum" },
        { id: "mult", label: "Multiplication operation", kind: "regex", pattern: "a\\s*\\*\\s*b" },
        { id: "add", label: "Accumulation addition", kind: "regex", pattern: "\\+\\s*c" },
        { id: "pipe", label: "Sequential clocked pipeline", kind: "regex", pattern: "always\\s*@\\s*\\(\\s*posedge\\s+clk" },
      ],
      solution: `module retimed_mult_accum (
  input  wire        clk,
  input  wire        rst_n,
  input  wire [7:0]  a,
  input  wire [7:0]  b,
  input  wire [15:0] c,
  output reg  [16:0] y
);

  // Stage 1: Registered Multiplier Product and Registered Operand C
  reg [15:0] prod_reg;
  reg [15:0] c_reg;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      prod_reg <= 16'h0000;
      c_reg    <= 16'h0000;
      y        <= 17'h00000;
    end else begin
      prod_reg <= a * b;
      c_reg    <= c;
      // Stage 2: Balanced Accumulation
      y        <= prod_reg + c_reg;
    end
  end

endmodule`,
    }
  ),

  quiz("synthesis", "expert", "synth-expert-quiz", "Expert Logic Restructuring & Retiming Quiz", [
    { id: "sy_e1", prompt: "Sequential retiming optimizes clock frequency by:", choices: ["Down-clocking the master oscillator", "Moving registers across combinational logic clouds to balance stage delays without changing functional latency", "Replacing all flip-flops with transparent latches", "Disabling SDC false paths"], answer: 1, explain: "Sequential retiming relocates registers across logic gates to equalize stage delays without changing input-to-output cycle latency." },
    { id: "sy_e2", prompt: "Integrated Clock Gating (ICG) cells save dynamic power primarily by:", choices: ["Cutting off the clock input to idle registers, eliminating redundant capacitive toggling", "Lowering the supply voltage to 0V", "Converting CMOS to NMOS-only gates", "Removing pull-up networks"], answer: 0, explain: "ICG cells disable clock switching on registers when enable is low, eliminating dynamic power dissipation." },
    { id: "sy_e3", prompt: "Why does scan flop insertion (SDFF) introduce a slight timing penalty compared to regular DFFs?", choices: ["Scan flops have a 2:1 multiplexer on the D-input adding internal setup delay and capacitance", "Scan flops only run at 1 MHz", "Scan flops require dual power supplies", "Scan flops invert output polarity"], answer: 0, explain: "The internal multiplexer before the master latch adds propagation delay and setup time overhead." },
  ]),

  // Master Layer (RTL Architecture & Signoff)
  theory(
    "synthesis",
    "master",
    "synth-master-multivth",
    "Master: Multi-Vth (LVT/RVT/HVT) Power-Timing Optimization & Leakage Swapping",
    20,
    "Sub-threshold leakage control via threshold voltage cell swapping on non-critical timing paths.",
    [
      "The Multi-Vth Concept: Advanced FinFET libraries provide multiple threshold voltage variants of identical standard cell footprints: **LVT (Low Vth)**: Fastest switching speed, highest sub-threshold leakage; **RVT (Regular Vth)**: Balanced speed and leakage; **HVT (High Vth)**: Lowest leakage (10x to 100x lower than LVT), slower switching speed.",
      "Multi-Vth Synthesis Swapping Strategy: The synthesis compiler first maps critical timing paths to LVT to close setup timing (WNS >= 0). Once timing is closed, the tool performs post-compile leakage recovery, swapping all cells on paths with positive timing slack to HVT!",
      "Typical SoC Vth Distribution: High-performance mobile/server SoCs typically achieve 10 to 15% LVT (critical timing paths), 25 to 30% RVT, and 60 to 65% HVT, slashing total chip standby leakage by over 80% without degrading clock frequency.",
    ]
  ),

  theory(
    "synthesis",
    "master",
    "synth-master-phys-synth",
    "Master: Physical-Aware Topographical Synthesis with DEF Floorplan Parasitics",
    18,
    "Topographical synthesis mode using DEF floorplans, macro placement, and Steiner route parasitics.",
    [
      "Why Wire Load Models (WLM) Fail in Deep Submicron (<65nm/FinFET): Traditional wire load models estimate interconnect capacitance based solely on net fanout. In deep submicron nodes, interconnect wire delay dominates gate delay (>60% of path delay), causing traditional synthesis timing estimates to wildly mismatch post-layout reality.",
      "Physical-Aware Synthesis (Topographical Mode): Tools (Design Compiler Graphical, Genus Physical) read the floorplan DEF, macro locations, and I/O pin coordinates. The engine performs early global placement and computes Steiner minimal tree routing to extract realistic wire parasitics during logic synthesis.",
      "Congestion & Layer Assignment: Physical synthesis identifies routing congestion hotspots early and buffers critical long-distance buses on upper, thick metal layers (M7/M8) with lower resistance.",
    ]
  ),

  theory(
    "synthesis",
    "master",
    "synth-master-lec-formality",
    "Master: Logic Equivalence Checking (LEC) — Golden RTL vs. Gate Netlist Verification",
    20,
    "Formal mathematical equivalence proofs using BDDs and SAT solvers without running dynamic simulations.",
    [
      "Why Logic Equivalence Checking is Mandatory: Gate-level simulations (GLS) are extremely slow and cannot achieve 100% state space coverage. LEC tools (Synopsys Formality, Cadence Conformal) mathematically prove that the synthesized/optimized gate netlist behaves identically to the golden RTL under all possible $2^N$ input combinations.",
      "Compare Points & Logic Cones: The LEC solver segments the design into manageable combinational cones bounded by Compare Points (Primary Inputs, Primary Outputs, D-Flip-Flops, and Black-Box memory ports).",
      "Handling Advanced Optimizations: Guidance files (SVF in Formality) inform the formal verifier about legitimate synthesis structural transformations, such as register retiming, state machine re-encoding, and multibit register merging.",
    ]
  ),

  theory(
    "synthesis",
    "master",
    "synth-master-eco",
    "Master: Functional & Timing Engineering Change Order (ECO) Netlist Patching",
    18,
    "Patching late silicon bugs using spare standard cells without re-running full synthesis and place-and-route.",
    [
      "What is an ECO? When a logic bug is discovered late in the tapeout cycle, re-running full synthesis and P&R causes massive timing closure disruption. An ECO netlist patch modifies only the localized faulty gates while preserving 99.9% of the placed-and-routed layout.",
      "Spare Cell Insertion: During initial P&R, designers scatter uncommitted 'spare cells' (`SPARE_NAND`, `SPARE_INV`, `SPARE_DFF`) across the silicon floorplan.",
      "Metal-Only ECO: Rewires only the upper metal routing layers to connect spare cells into the active netlist, reducing mask fabrication turnaround time from 3 months to 2 weeks and saving millions of dollars in NRE costs!",
    ]
  ),

  practical(
    "synthesis",
    "master",
    "synth-master-practical",
    "Master Practical: Multi-Vth Power Optimization & Automated LEC Scripting",
    25,
    "Implement an advanced synthesis signoff script combining Multi-Vth leakage recovery with Formality SVF setup.",
    [
      "Configure Multi-Vth standard cell libraries (`sky130_fd_sc_hs__tt_025C_1v80.db`, `sky130_fd_sc_hd__tt_025C_1v80.db`, `sky130_fd_sc_hdll__tt_025C_1v80.db`).",
      "Enable Formality SVF guidance file logging (`set_svf output_guidance.svf`).",
      "Execute physical compile with clock gating and automatic leakage recovery to HVT (`compile_ultra -gate_clock -leakage_power`).",
      "Export final gate-level netlist and generate multi-threshold cell distribution report (`report_threshold_voltage_group`)."
    ],
    {
      language: "tcl",
      starter: `# Master Synthesis Signoff Script: master_synth_flow.tcl

# TODO: Step 1 - Set multi-vth libraries (sky130_fd_sc_hs, sky130_fd_sc_hd, sky130_fd_sc_hdll)
# TODO: Step 2 - Enable Formality SVF record
# TODO: Step 3 - Compile with clock gating and leakage power recovery
# TODO: Step 4 - Report Vth group distribution and write netlist`,
      checks: [
        { id: "svf", label: "SVF guidance logging", kind: "includes", pattern: "set_svf" },
        { id: "vth", label: "Multi-Vth library references", kind: "regex", pattern: "sky130|hs|hd|hdll|lvt|rvt|hvt" },
        { id: "leak", label: "Leakage power optimization", kind: "regex", pattern: "\\-leakage_power|compile_ultra" },
        { id: "rep", label: "Vth distribution report", kind: "includes", pattern: "report_threshold_voltage_group" },
      ],
      solution: `# Master Synthesis Signoff Script: master_synth_flow.tcl
# 1. Multi-Vth Target Libraries (SkyWater 130nm HS, HD, HDLL)
set_app_var target_library "sky130_fd_sc_hs__tt_025C_1v80.db sky130_fd_sc_hd__tt_025C_1v80.db sky130_fd_sc_hdll__tt_025C_1v80.db"
set_app_var link_library   "* sky130_fd_sc_hs__tt_025C_1v80.db sky130_fd_sc_hd__tt_025C_1v80.db sky130_fd_sc_hdll__tt_025C_1v80.db"

# 2. Formality Guidance File for LEC
set_svf output_guidance.svf

# 3. Read & Elaborate Design
read_verilog -sv {soc_top.v datapath.v}
elaborate soc_top
current_design soc_top
read_sdc soc_top.sdc

# 4. Multi-Vth & Power-Optimized Compile
compile_ultra -gate_clock -scan -leakage_power

# 5. Reports & Outputs
report_qor > qor_final.rpt
report_threshold_voltage_group > vth_distribution.rpt
write_verilog -output gate_netlist_signoff.v
set_svf -off`,
    }
  ),

  quiz("synthesis", "master", "synth-master-quiz", "Master Physical Synthesis & Formal Equivalence Exam", [
    { id: "sy_m1", prompt: "Why is post-synthesis leakage recovery able to swap up to 60-70% of cells to High-Vth (HVT)?", choices: ["Most paths in an SoC have positive timing slack and do not require fast, leaky LVT cells to meet setup timing", "HVT cells consume 0V power", "HVT cells are required for scan chains", "LVT cells are deprecated by foundries"], answer: 0, explain: "Only critical timing paths with zero or near-zero slack require LVT cells; all positive slack paths can be safely swapped to HVT to slash leakage." },
    { id: "sy_m2", prompt: "Logic Equivalence Checking (LEC) tools prove functional equivalence between RTL and Netlist by:", choices: ["Running billions of random testbench vectors in simulation", "Partitioning logic into combinational cones between matching Compare Points and applying formal BDD/SAT mathematical proofs", "Comparing ASCII netlist text line by line", "Checking static timing reports"], answer: 1, explain: "LEC uses formal mathematical algorithms (BDDs and SAT solvers) across matched compare points to prove 100% functional identity." },
    { id: "sy_m3", prompt: "A 'Metal-Only' Engineering Change Order (ECO) is preferred over full re-synthesis because:", choices: ["It only modifies upper interconnect metal masks, saving millions in fabrication costs and cutting turnaround from months to weeks", "It eliminates all standard cells", "It increases clock speed by 10x", "It bypasses DRC checks"], answer: 0, explain: "Metal-only ECOs rewire existing pre-placed spare cells using only routing layers, drastically reducing mask production costs and tapeout delay." },
  ]),

  // ==========================================================================
  // 🏆 1. CADENCE EDA (STRICT MASTER / MAX TIER)
  // ==========================================================================

  // ——— Subject 1: Cadence Synthesis (Genus) ———
  theory(
    "cadence-synthesis",
    "master",
    "genus-db-intro",
    "Master: Genus Common UI Architecture, Database Model (get_db/set_db) & Critical Attributes",
    30,
    "Unified root database hierarchy, first-class Tcl list object navigation, and production synthesis attributes extracted from industry tapeout toolkits.",
    [
      `## 1. What is RTL Synthesis? (The Foundational Engineering Goal)

In digital ASIC implementation, **RTL Logic Synthesis** is the automated compilation process that transforms human-readable Register-Transfer Level hardware code (SystemVerilog / Verilog / VHDL) into an optimized **structural gate-level netlist** composed of foundry standard cells (e.g. NAND, NOR, Inverters, Flip-Flops, and Clock Gating cells).

The synthesis compiler must simultaneously satisfy three competing multi-dimensional constraints, known as **PPA**:
1. **Performance (Timing)**: Satisfying setup and hold static timing constraints under worst-case operating corners (Worst Negative Slack WNS ≥ 0 ps, Total Negative Slack TNS = 0 ps).
2. **Power**: Minimizing both **dynamic switching power** (P_dyn = α · C · V² · f) and **sub-threshold leakage power** (P_leak = I_leak · V_DD).
3. **Area**: Minimizing total silicon die footprint (standard cell area + macro area + routing channel overhead).

\`\`\`
   Human RTL (SystemVerilog) + SDC Constraints + Foundry .lib/.lef
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Cadence Genus Engine  │
                     └───────────────────────┘
                                 │
                                 ▼
   Structural Gate Netlist + Mapped SDC + ScanDEF + Conformal LEC Dofile
\`\`\`

---

## 2. The Cadence Common UI Revolution & Database Hierarchy

Historically, legacy EDA tools treated design data as opaque, binary C++ pointer structures. In legacy tools, searching for cells required custom iterators like \`foreach_in_collection\` and complex wrapper commands.

Cadence **Genus Synthesis Solution** shares the unified **Common UI** architecture with Cadence Innovus (Physical Design) and Cadence Tempus (Timing Signoff). In the Common UI, all design entities are exposed as **native Tcl lists of database handles**.

### The Root (\`/\`) Database Object Tree
The entire in-memory representation is organized in an object-oriented hierarchical tree:
\`\`\`
Root (/)
 ├── designs/               (Active top-level design pointer)
 │    ├── modules/          (Hierarchical RTL sub-blocks: ALU, CSR, Register File)
 │    ├── insts/            (Instances: Standard cells, Macros, ICGs)
 │    │    ├── pins/        (Pin objects: direction, cap, timing arcs)
 │    │    └── lib_cell/    (Target foundry Liberty cell pointer)
 │    ├── nets/             (Interconnect wires: driver pin, load pins, cap)
 │    ├── ports/            (Primary chip boundary I/O pins)
 │    └── cost_groups/      (Timing path groups: I2R, R2O, R2R, I2O)
 ├── library_sets/          (Liberty .lib timing models for active corners)
 └── analysis_views/        (MMMC setup, hold, and power analysis views)
\`\`\`

---

## 3. Mastering Database Queries with \`get_db\` and \`set_db\`

Because \`get_db\` returns standard Tcl lists, you can manipulate results directly using native Tcl commands like \`llength\`, \`lindex\`, \`lsort\`, and \`foreach\` without special collection iterators.

### Powerful Chained Attribute Query Examples:
CODE tcl
# 1. Query all sequential flip-flops and count them
set all_flops [get_db insts -if {.is_sequential == true}]
puts "Total Sequential Registers in Design: [llength $all_flops]"

# 2. Chained query: Find all output pin names belonging to macro instances
set macro_out_pins [get_db [get_db insts -if {.is_macro == true}].pins -if {.direction == out}.name]

# 3. High-Fanout Hunter: Find all nets driving more than 32 load pins
set hfn_nets [get_db nets -if {.num_loads > 32}]
foreach n $hfn_nets {
    puts "HFN Net: [get_db $n .name] (Load Count: [get_db $n .num_loads])"
}

# 4. Leakage Filter: Query library cells with ultra-low static leakage
set low_leak_cells [get_db lib_cells -if {.leakage_power < 0.005}]

# 5. Inspect all available attributes on the top design object
report_property -obj [get_db designs $DESIGN_TOP]
ENDCODE

---

## 4. Production Synthesis Design Attributes & Industry Pitfalls

Before elaborating RTL and running logic optimization, a master ASIC engineer configures foundational synthesis attributes. Omitting these attributes causes severe downstream bugs during physical design and post-silicon testing.

CODE tcl
# ==============================================================================
# FOUNDATIONAL SYNTHESIS ENVIRONMENT ATTRIBUTES
# ==============================================================================

# 1. Preserve Hierarchy for Modular Timing Budgeting & ECO Tracing
# Default 'both' or 'auto' ungroups sub-modules into a giant flat netlist.
# 'none' preserves module boundaries, enabling block-level signoff and clean ECOs.
set_db auto_ungroup none

# 2. Maximum Diagnostic Logging
set_db information_level 10
set_db source_verbose true

# 3. Multi-Bit Register Inferencing (MBIT)
# Merges multiple 1-bit flip-flops sharing common clock/enable/reset pins into
# 2-bit or 4-bit multi-bit cells. Reduces clock tree capacitance by 20-30% and saves area.
set_db use_multibit_cells true

# 4. Constant Register Preservation (CRITICAL FOR TESTABILITY, ATPG & SILICON ECOs)
# By default, synthesis optimizers treat registers with static D-inputs (tied to 0 or 1) as
# redundant constants and replace them with direct tie-off cells (TIELO / TIEHI).
# In production ASICs, this causes:
#  - Catastrophic loss of ATPG test coverage (registers disappear from scan chains)
#  - Loss of run-time hardware reconfigurability (static configuration words get pruned)
#  - Inability to perform post-silicon Metal ECOs (spare flip-flops get deleted)
# Setting these attributes to 'false' locks and preserves all configuration and spare registers:
set_db optimize_constant_0_flops false
set_db optimize_constant_1_flops false

# 5. Preserve Unloaded Instances & Spare Gates
# Prevents Genus from pruning spare gates or observation registers not driving primary outputs.
set_db delete_unloaded_insts false
set_db delete_unloaded_seqs false

# 6. Clean Undriven Signal & Floating Net Management
set_db hdl_track_filename_row_col true
set_db hdl_unconnected_value 0

# 7. Strict Sequential Pin Control Matching
# Ensures synchronous and asynchronous reset/preset pins match exact Liberty timing arcs.
set_db exact_match_seq_sync_ctrls true
set_db exact_match_seq_async_ctrls false
set_db lbr_respect_async_controls_priority true
set_db mark_async_pin_using_timing_arcs true

# 8. Hierarchical Naming Delimiter
set_db ungroup_separator _
ENDCODE
`
    ],
    {
      title: "genus_db_queries.tcl",
      lang: "tcl",
      source: `# Set synthesis configuration attributes
set_db auto_ungroup none
set_db use_multibit_cells true
set_db optimize_constant_0_flops false
set_db optimize_constant_1_flops false
set_db delete_unloaded_insts false
set_db information_level 10

# Database queries
set all_seq   [get_db insts -if {.is_sequential == true}]
set all_icgs  [get_db insts -if {.is_integrated_clock_gating == true}]
set macro_insts [get_db insts -if {.is_macro == true}]
puts "Registers: [llength $all_seq] | Clock Gates: [llength $all_icgs] | Macros: [llength $macro_insts]"`
    }
  ),

  theory(
    "cadence-synthesis",
    "master",
    "genus-mmmc-elaboration",
    "Master: Ingestion, Dynamic MMMC Setup, Elaboration & Early Lint Audits",
    30,
    "Multi-Mode Multi-Corner setup, physical LEF ingestion, cost group creation, path_adjust, and early check_design/timing audits.",
    [
      `## 1. Why Multi-Mode Multi-Corner (MMMC) is Mandatory in Deep Submicron

In older semiconductor nodes (e.g. 0.35 µm, 0.18 µm), chips were synthesized at a single conservative 'worst-case' timing corner. In modern deep submicron and FinFET nodes (e.g. ASAP7, SkyWater 130nm), silicon physics behaves with extreme non-linear variations across **Process, Voltage, and Temperature (PVT)**:

* **Slow Corner (SSG / 0.72V / 125°C / RC-Worst)**: Transistors switch slowly; wire resistance is high. This corner is **critical for Setup Time violations** (T_clk ≥ T_cq + T_comb + T_setup).
* **Fast Corner (FFG / 0.88V / -40°C / C-Best)**: Transistors switch extremely fast; wire capacitance is minimal. Fast data races through combinational logic before the clock edge arrives. This corner is **critical for Hold Time violations** (T_cq + T_comb ≥ T_hold).
* **Temperature Inversion Effect**: In sub-28nm technologies, low temperature can actually make high-voltage paths switch slower due to carrier mobility degradation.

Therefore, Genus must synthesize logic while validating multiple operational modes (e.g. **Functional Mode** at 1 GHz vs **Scan Test Mode** at 50 MHz) across all critical corners simultaneously.

---

## 2. Constructing the Dynamic MMMC Object Architecture

The Cadence MMMC engine builds a rigorous dependency chain of timing objects:

\`\`\`
 ┌────────────────────────┐      ┌─────────────────────────┐
 │ create_constraint_mode │      │   create_library_set    │ (Liberty .lib files)
 │     (SDC files)        │      └────────────┬────────────┘
 └───────────┬────────────┘                   │
             │                   ┌────────────▼────────────┐
             │                   │ create_timing_condition │
             │                   └────────────┬────────────┘
             │                                │
             │      ┌──────────────────┐      │
             │      │ create_rc_corner │      │
             │      │  (QRC tch files) │      │
             │      └────────┬─────────┘      │
             │               │                │
             │      ┌────────▼────────────────▼────────────┐
             │      │         create_delay_corner          │
             │      └─────────────────┬────────────────────┘
             │                        │
             ▼                        ▼
 ┌─────────────────────────────────────────────────────────┐
 │                  create_analysis_view                   │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼
                     set_analysis_view
   (-setup {func_slow} -hold {func_fast} -leakage {func_leak})
\`\`\`

CODE tcl
# 1. Constraint Modes (SDC Timing Rules)
create_constraint_mode -name func_mode -sdc_files { sdc/soc_func.sdc }
create_constraint_mode -name test_mode -sdc_files { sdc/soc_test.sdc }

# 2. Library Sets (Liberty Timing & Power Models)
create_library_set -name libs_slow -timing { ./libs/stdcells_slow_0p72v_125c.lib ./libs/sram_slow_0p72v_125c.lib }
create_library_set -name libs_fast -timing { ./libs/stdcells_fast_0p88v_m40c.lib ./libs/sram_fast_0p88v_m40c.lib }

# 3. Parasitic Interconnect RC Corners (QRC Technology Field Solvers)
create_rc_corner -name rc_worst -temperature 125 -qrc_tech ./tech/qrc_rcworst.tch
create_rc_corner -name rc_best  -temperature -40 -qrc_tech ./tech/qrc_cbest.tch

# 4. Operating Conditions & Timing Conditions
create_opcond -name op_slow -process 1.0 -voltage 0.72 -temperature 125
create_opcond -name op_fast -process 1.0 -voltage 0.88 -temperature -40

create_timing_condition -name tc_slow -opcond op_slow -library_sets {libs_slow}
create_timing_condition -name tc_fast -opcond op_fast -library_sets {libs_fast}

# 5. Delay Corners (Timing Condition + Interconnect Parasitics)
create_delay_corner -name dc_setup_worst -timing_condition tc_slow -rc_corner rc_worst
create_delay_corner -name dc_hold_best   -timing_condition tc_fast -rc_corner rc_best

# 6. Analysis Views
create_analysis_view -name func_setup_view -constraint_mode func_mode -delay_corner dc_setup_worst
create_analysis_view -name func_hold_view  -constraint_mode func_mode -delay_corner dc_hold_best

# 7. Activate Active Views for Synthesis Optimization
set_analysis_view \\
  -setup    {func_setup_view} \\
  -hold     {func_hold_view} \\
  -leakage  {func_setup_view} \\
  -dynamic  {func_setup_view}
ENDCODE

---

## 3. Physical LEF Ingestion & Technology Guardrails

Genus incorporates physical awareness early through **PLE** (Physical Layout Estimation). By reading Technology LEF and Macro LEF files, Genus extracts exact wire capacitance per metal pitch and cell physical pin geometries:

CODE tcl
read_mmmc mmmc_setup.tcl
read_physical -lef { ./tech/tech.lef ./libs/stdcells.lef ./libs/macros.lef }

# Disallow delay-padding cells, ultra-weak drivers (X0), and clock inverters in synthesis data paths
set_dont_use { *DLY* *X0* *CLKINVX1* }
ENDCODE

---

## 4. HDL Elaboration, Uniquification & Cost Groups

CODE tcl
# Ingest RTL files
read_hdl -sv [glob ./rtl/*.sv]

# Elaborate top module: builds in-memory generic hierarchy, resolves parameters & generate loops
elaborate soc_top

# Uniquify: creates dedicated module definitions for instances with different generic parameters
uniquify soc_top -verbose

# Initialize the core timing graph
init_design -top soc_top
ENDCODE

### The Critical Role of Cost Groups (Preventing Path Masking)
By default, an EDA optimizer focuses primarily on the single worst negative slack (WNS) path across the whole chip. If primary input pins have large un-budgeted board arrival delays (e.g. -600 ps on an external SPI bus), the tool will waste 90% of its runtime trying to fix the unfixable I/O path while **completely ignoring internal Register-to-Register (R2R) violations**!

To prevent this fatal **Path Masking**, we partition timing paths into 4 distinct cost groups:

CODE tcl
define_cost_group -name I2R -design soc_top
define_cost_group -name R2O -design soc_top
define_cost_group -name R2R -design soc_top
define_cost_group -name I2O -design soc_top

path_group -view func_setup_view -from [all_inputs]    -to [all_registers] -group I2R -name I2R
path_group -view func_setup_view -from [all_registers] -to [all_outputs]   -group R2O -name R2O
path_group -view func_setup_view -from [all_registers] -to [all_registers] -group R2R -name R2R
path_group -view func_setup_view -from [all_inputs]    -to [all_outputs]   -group I2O -name I2O
ENDCODE

---

## 5. Early Sanity Lint Audits (\`check_design\` & \`check_timing_intent\`)

Never launch hours of synthesis optimization without running early sanity checks!

CODE tcl
# 1. Structural Design Audit: Detects multi-driven nets, floating inputs, undriven outputs, and unresolved blackboxes
check_design -all > reports/check_design_early.rpt

# 2. Timing Intent Lint: Detects unconstrained endpoints, missing clock definitions, and combinatorial feedback loops
check_timing_intent -verbose > reports/timing_intent_early.rpt
ENDCODE
`
    ]
  ),

  theory(
    "cadence-synthesis",
    "master",
    "genus-compilation-pipeline",
    "Master: The 3-Stage Synthesis Pipeline (syn_generic -> syn_map -> syn_opt) & Datapath Optimization",
    30,
    "Boolean decomposition, arithmetic architecture selection (report_dp), multi-Vth mapping, DRC closure, and assign net removal.",
    [
      `## 1. The 3-Stage Compilation Philosophy

Cadence Genus compiles RTL through three distinct, mathematically rigorous transformation stages to maximize circuit speed, density, and power efficiency:

\`\`\`
           RTL AST (Elaborated Verilog / SystemVerilog)
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                       1. syn_generic                        │
 │  • Boolean unmapping into generic gates (GTECH)             │
 │  • Constant folding ($A + 0 = A$, $B \\times 0 = 0$)         │
 │  • Resource sharing & dead-code pruning                     │
 │  • Datapath architecture selection (CLA, Carry-Save, Booth) │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                         2. syn_map                          │
 │  • Graph matching onto target foundry Liberty cells (.lib)  │
 │  • Multi-bit register merging (e.g. 2x 1-bit -> 1x 2-bit)   │
 │  • Initial buffer tree insertion on high-fanout nets        │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                         3. syn_opt                          │
 │  • Timing closure & critical path restructuring             │
 │  • Design Rule Violation (DRC) fixing (max_cap, max_tran)   │
 │  • Multi-Vth leakage recovery (swapping slack paths to HVT) │
 │  • Clean assign net elimination                             │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
                 Optimized Gate Netlist (.v)
\`\`\`

---

## 2. Stage 1: Generic Synthesis (\`syn_generic\`) & Datapath Optimization

During \`syn_generic\`, Genus builds a technology-independent Boolean network.

### Datapath Arithmetic Optimization (\`report_dp\`)
Complex arithmetic expressions (e.g. Y = (A · B) + (C · D) + E) can be implemented in silicon in dozens of ways:
* **Ripple Carry Adders (RCA)**: Minimal area, very slow (O(N) carry propagation delay).
* **Carry-Lookahead Adders (CLA)**: Fast (O(log N) delay), larger area.
* **Carry-Save Adder (CSA) Trees & Wallace Trees**: Sums multiple partial products concurrently with constant delay (O(1)) before a single final vector merge adder!
* **Booth Multipliers**: Recodes multiplier bits into Radix-4 to halve the number of partial products.

Genus automatically analyzes timing slacks and selects the optimal arithmetic architecture:

CODE tcl
set_db syn_generic_effort high
syn_generic

# Datapath report: Audits operator bitwidths, resource sharing, and CSA tree implementations
report_dp > reports/generic/datapath_architecture.rpt

# Export generic intermediate snapshot and gate netlist
write_snapshot -directory reports/generic -tag generic
write_hdl -language v2001 > outputs/\${DESIGN_TOP}_generic.v
ENDCODE

---

## 3. Stage 2: Technology Mapping (\`syn_map\`)

\`syn_map\` replaces abstract generic Boolean primitives with actual physical standard cells from the target Liberty (\`.lib\`) library using delay-driven pattern matching:

CODE tcl
set_db syn_map_effort high
syn_map

report_dp > reports/map/datapath_mapped.rpt
write_snapshot -directory reports/map -tag map
write_hdl -language v2001 > outputs/\${DESIGN_TOP}_map.v
ENDCODE

---

## 4. Stage 3: Optimization, DRC Fixing & Multi-$V_{th}$ Recovery (\`syn_opt\`)

\`syn_opt\` performs the heavy lifting for timing signoff and design rule closure:

### A. Design Rule DRC Violations
* **Max Transition (\`max_transition\`)**: Signal slew (rise/fall time) must not exceed library limits (e.g. 0.25 ns). Excessive transition times cause severe dynamic short-circuit power and timing uncertainty.
* **Max Capacitance (\`max_capacitance\`)**: Output pin load capacitance must not exceed the driver's capability.
* **Max Fanout (\`max_fanout\`)**: A single driver must not drive too many gate inputs.

### B. Multi-$V_{th}$ Leakage Recovery
Standard cell libraries provide multiple threshold voltage variants of identical footprints:
* **Low-$V_{th}$ (LVT)**: Very fast switching, high sub-threshold leakage (I_leak).
* **Regular-$V_{th}$ (RVT)**: Balanced speed and leakage.
* **High-$V_{th}$ (HVT)**: 10x to 50x lower leakage, slower switching.

During \`syn_opt\`, Genus first uses LVT cells on critical timing paths to meet zero slack. Once setup timing is met, the optimizer traverses all paths with **positive timing slack** and automatically swaps cells to HVT! This slashes standby leakage by 60–70% without sacrificing clock frequency.

### C. Clean Assign Net Removal
Direct \`assign\` statements (e.g. \`assign net_a = net_b;\`) create net aliasing issues in downstream Place & Route (Innovus) and Layout Versus Schematic (LVS) tools. Genus cleanly eliminates them:

CODE tcl
# Configure clean assign net handling
set_remove_assign_options -include_local_constant_assign -dont_skip_unconstrained_paths
set_db remove_assigns true
set_db use_tiehilo_for_const duplicate

set_db syn_opt_effort high
syn_opt

# Comprehensive Timing, Area, and Power Reports
report_timing -path_type full_clock -max_paths 100 \\
  -fields {timing_point flags arc edge cell fanout load transition delay arrival} \\
  > reports/opt/timing_critical.rpt

report_area -detail -physical -show_full_names > reports/opt/area_breakdown.rpt
report_power -by_hierarchy -unit mW > reports/opt/power_hierarchical.rpt
write_hdl -language v2001 > outputs/\${DESIGN_TOP}_netlist.v
ENDCODE
`
    ]
  ),

  theory(
    "cadence-synthesis",
    "master",
    "genus-ispatial-physical",
    "Master: Physical Synthesis & iSpatial Flow — In-Memory Placement & Congestion",
    30,
    "Eliminating pre-P&R timing correlation gaps by embedding the Innovus placement engine directly inside Genus.",
    [
      `## 1. Why Traditional Wire-Load Models (WLM) Fail in Deep Submicron

In older technologies (>90nm), gate delay accounted for 80% of total path delay, and wire delay was minimal. Traditional synthesis estimated wire parasitics using statistical **Wire-Load Models (WLM)** based purely on fanout count (e.g. fanout of 3 = 10 fF).

In modern sub-micron and FinFET nodes (e.g. ASAP7, SkyWater 130nm), **interconnect resistance and capacitance dominate gate delay**, accounting for **70% to 80% of total delay**!
* Wire resistance per micron increases drastically as metal pitches shrink.
* WLM completely ignores physical placement distances, macro placement blockages, and routing congestion.
* Result: A design that meets timing with WLM during logical synthesis will fail with massive timing violations (-1000 ps WNS) once placed and routed in Innovus!

---

## 2. The Genus iSpatial Architecture

To eliminate the synthesis-to-P&R correlation gap, Cadence created **iSpatial Technology**. Genus calls the native **Cadence Innovus analytical placement and early global routing (eGR) engine directly in memory**.

\`\`\`
              DEF Floorplan Ingestion (read_def floorplan.def)
                                     │
                                     ▼
                        syn_generic -physical
                                     │
                                     ▼
                          syn_map -physical
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           syn_opt -spatial                             │
 │  • Native Innovus analytical placer runs inside Genus memory           │
 │  • True Steiner tree routing computes exact wire R and C               │
 │  • Layer Promotion: Buffers long-distance buses on low-R upper metals  │
 │  • Macro Blockage Awareness & Cell Density Smoothing                   │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
                  Innovus P&R Handoff Database (write_design)
\`\`\`

---

## 3. Key Physical Optimization Mechanisms in iSpatial

1. **True Steiner Tree Parasitics**: Instead of guessing capacitance from fanout, iSpatial builds minimal Steiner tree routing estimates using actual $(X,Y)$ coordinates.
2. **Layer Assignment & Layer Promotion**: In advanced nodes, top metal layers (e.g. M7, M8) are thick and have much lower resistance than lower metal layers (M1, M2). iSpatial automatically promotes critical long-distance nets to upper layers.
3. **Macro Blockage & Channel Congestion Awareness**: Standard cells are placed outside macro routing corridors to prevent localized routing bottlenecks.
4. **Buffering at Placement Boundaries**: Buffers are inserted with physical coordinate awareness rather than lumped together.

---

## 4. Executing Production iSpatial Physical Synthesis

CODE tcl
# 1. Provide Floorplan DEF (or auto-create prototype floorplan if DEF is unavailable)
set def_file "inputs/floorplan.def"
if {[file exists $def_file]} {
    puts "INFO: Ingesting Floorplan DEF: $def_file"
    read_def $def_file
    syn_generic -physical
} else {
    puts "WARN: No floorplan DEF found — creating virtual prototype floorplan"
    syn_generic -create_floorplan
    syn_generic -physical
}

# 2. Physical Technology Mapping
syn_map -physical

# 3. iSpatial High-Effort Spatial Optimization
set_db opt_spatial_effort extreme
set_db / .invs_temp_dir genus_invs_pred

# Run logical optimization first, then execute full in-memory iSpatial placement
syn_opt
syn_opt -spatial

# 4. Congestion Analysis (Checking for routing hotspot over-utilization)
report_congestion > reports/ispatial_congestion.rpt

# 5. Export Complete P&R Database Handoff
write_design -innovus -base_name handoff/pnr/\${DESIGN_TOP}_ispatial_out
ENDCODE
`
    ]
  ),

  theory(
    "cadence-synthesis",
    "master",
    "genus-lowpower-dft-retime",
    "Master: Low-Power (UPF/CPF, ICGs), DFT Scan Insertion & Sequential Retiming",
    30,
    "Automated Integrated Clock Gating, IEEE 1801 UPF power domains, scan chain synthesis (convert_to_scan), and register retiming.",
    [
      `## 1. Automated Integrated Clock Gating (ICG)

Clock distribution networks consume **40% to 50% of total dynamic SoC power** because the clock signal switches continuously on every single cycle (activity factor α = 1.0).

When RTL contains conditional register updates:
\`\`\`verilog
always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n)      q <= 32'b0;
    else if (enable) q <= d; // Only updates when enable is high!
end
\`\`\`
Without clock gating, the tool inserts a 2:1 multiplexer at each flip-flop D-input, while the clock pin keeps toggling relentlessly.

### Why Latch-Based ICGs are Mandatory (Glitch-Free Gating)
If you gate a clock using a simple AND gate (\`clk_gated = clk & enable\`), any glitch on the \`enable\` signal while the clock is high will cause a **false clock pulse**, corrupting state data!

An **Integrated Clock Gating (ICG)** cell embeds an active-low latch followed by an AND gate. The enable signal is captured on the falling clock edge and held rock-solid during the entire high clock phase:

\`\`\`
                   ┌──────────┐
  enable ─────────>│ D-Latch  │──(en_latched)──┐
                   │ (ActiveL)│                ▼
  clk ───┬────────>│ E        │             ┌─────┐
         │         └──────────┘             │ AND │────> clk_gated (Glitch-Free!)
         └─────────────────────────────────>│     │
                                            └─────┘
\`\`\`

CODE tcl
# Configure Automated ICG Insertion in Genus
set_db lp_insert_clock_gating true
set_db lp_clock_gating_min_flops 3
set_db lp_clock_gating_max_flops inf
set_db lp_clock_gating_style latch
set_db lp_clock_gating_coverage_effort standard
set_db lp_power_optimization_weight 0.05

# Audit Clock Gating Efficiency
report_clock_gates > reports/clock_gating_instances.rpt
report_clock_gating_quality > reports/clock_gating_quality.rpt
ENDCODE

---

## 2. Multi-Voltage Power Intent (IEEE 1801 / UPF)

Modern SoCs power down inactive blocks using Power Shutoff (PSO) domains and run high-speed graphics cores at higher voltages than always-on sensor hubs.

Genus ingests standard **IEEE 1801 UPF** or CPF files to automatically insert:
* **Isolation Cells (ISO)**: Clamps output pins of powered-down domains to a fixed 0 or 1 to prevent floating inputs from frying active downstream logic.
* **Level Shifters (LS)**: Shifts signal voltage levels between 0.72V and 0.88V domains.
* **Power Switches (PSW)**: Header/footer transistors that disconnect VDD from sleeping power domains.

CODE tcl
read_power_intent -1801 inputs/power_intent.upf -module $DESIGN_TOP -verbose
check_power_intent
commit_power_intent
report_power_intent > reports/power_intent_mapped.rpt
ENDCODE

---

## 3. Design for Test (DFT) & Scan Chain Insertion

Silicon chips frequently suffer physical manufacturing defects (e.g. shorted metal lines, dust particles). To test every single logic gate on a tester (ATE), synthesis converts all standard flip-flops into **Scan Flip-Flops (SDFF)** with a test multiplexer:

\`\`\`
  D ────────┐ 0
            ├─────> [ Master-Slave Flip-Flop ] ────> Q
  SI ───────┘ 1                     │
  (ScanIn)                          │
  SE (ScanEnable) ──────────────────┘
\`\`\`

### The Production DFT Workflow in Genus:
CODE tcl
# 1. Audit DFT rule violations (e.g. uncontrollable internal clocks or async resets)
check_dft_rules -advanced
report_dft_violations > reports/dft_violations.rpt

# 2. Fix asynchronous resets and test clocks using Test Mode (TM) pin gating
fix_dft_violations -async_reset -test_control TM
fix_dft_violations -clock -test_control TM

# 3. Convert standard flip-flops to scan flops & stitch into balanced scan chains
convert_to_scan
connect_scan_chains -auto_create_chains
report_scan_chains > reports/scan_chains.rpt

# 4. Re-optimize netlist to absorb scan multiplexer timing overhead
syn_opt

# 5. Export ScanDEF for Innovus (allows P&R to re-stitch scan chains based on placement proximity!)
write_scandef > outputs/\${DESIGN_TOP}_scanDEF.scandef
write_dft_atpg -library $ATPG_LIBS
ENDCODE

---

## 4. Sequential Retiming (\`retime\`)

Sequential retiming relocates registers across combinational logic clouds to balance clock stage delays without altering the functional cycle latency between Primary Inputs and Primary Outputs:

\`\`\`
  Before:  RegA ──>[ Slow 800ps Logic Cloud ]──> RegB ──>[ Fast 200ps Logic ]──> RegC
  After:   RegA ──>[ 500ps Balanced Logic ]───> RegB ───>[ 500ps Logic ]──────> RegC
\`\`\`

CODE tcl
set_db retime_async_reset true
retime -effort high
\`\`\`
`
    ]
  ),

  theory(
    "cadence-synthesis",
    "master",
    "genus-hierarchical-handoff",
    "Master: Hierarchical Synthesis (Top-Down, ILM, DB, Blackbox) & Signoff Handoff",
    30,
    "Modular chip synthesis using Interface Logic Models (ILM), and complete downstream handoff generation for Innovus, Tempus, and Conformal LEC.",
    [
      `## 1. Hierarchical Synthesis Methodologies for Multi-Million Gate SoCs

When synthesizing SoCs with hundreds of millions of transistors, flat monolithic synthesis exceeds server RAM limits and causes massive runtime bottlenecks. Genus provides modular hierarchical flows:

| Methodology | Description | Child Block Representation | Best Used For |
| :--- | :--- | :--- | :--- |
| **Top-Down** | Synthesizes full chip with hierarchy boundaries preserved (\`set_db auto_ungroup none\`). | Sub-modules preserved with full gate details. | Medium SoCs (< 20M gates), budgeting validation. |
| **Bottom-Up (ILM)** | Synthesizes leaf blocks first; abstracts internal logic into **Interface Logic Models (ILM)** containing only I/O boundary paths. | \`generate_ilm\` / \`read_ilm -logical\` | Massive multi-core SoCs, slashing top RAM by 70–80%. |
| **Bottom-Up (DB)** | Synthesizes leaf blocks into fully mapped databases; loaded with \`set_dont_touch\`. | \`write_db\` / \`read_db\` | Hardened IP blocks. |
| **Bottom-Up (Blackbox)** | Child blocks instantiated as empty port shells; top-level SDC constrains I/O pins. | \`write_netlist -abstract\` | Early chip-level floorplanning and pin budgeting. |

---

## 2. Deep Dive: Interface Logic Models (ILM)

An **Interface Logic Model (ILM)** strips away internal register-to-register paths that have zero timing interaction with the top-level chip, keeping only:
1. Combinational paths from Input Ports $\\to$ First Stage Registers.
2. Combinational paths from Last Stage Registers $\\to$ Output Ports.
3. Complete internal clock distribution trees.

\`\`\`
   ┌───────────────────────────────────────────────────────────┐
   │                       Full Leaf Block                     │
   │   [Input Pin] ──>[Logic]──>[Reg1]                         │
   │                              │                            │
   │               [Reg2]──>[Internal Logic]──>[Reg3]          │ <── (STRIPPED BY ILM!)
   │                                             │             │
   │                                           [Reg4]──>[Logic]──>[Output Pin]
   └───────────────────────────────────────────────────────────┘
\`\`\`

### Executing ILM Bottom-Up Flow:
CODE tcl
# --- STEP 1: Leaf Block Synthesis ('cpu_core') ---
syn_generic; syn_map; syn_opt
write_ilm -module_name cpu_core -basename outputs/ilm/cpu_core

# --- STEP 2: Top-Level SoC Synthesis ---
read_ilm -basename outputs/ilm/cpu_core -module_name cpu_core -logical -lef_file cpu_core.lef
read_hdl -sv top_soc.sv
elaborate top_soc
set_dont_touch [get_db designs cpu_core] true
syn_generic; syn_map; syn_opt
ENDCODE

---

## 3. Production Downstream Signoff Handoff Suite

A complete synthesis run must generate verified artifacts for all downstream physical design, static timing analysis, gate-level simulation, and formal verification tools:

CODE tcl
# 1. Gate-Level Structural Netlists & Mapped SDC Constraints
write_hdl -language v2001 > outputs/\${DESIGN_TOP}_netlist.v
write_sdc -view func_setup_view > outputs/\${DESIGN_TOP}_func.sdc
write_sdc -view test_mode       > outputs/\${DESIGN_TOP}_test.sdc

# 2. Tempus STA & Gate-Level Simulation Models (SDF & SPEF)
write_sdf -version 2.1 -recrem split -setuphold merge_when_paired -edges check_edge \\
  > handoff/sta/\${DESIGN_TOP}.sdf
write_parasitics -cap_unit fF -res_unit ohm -view func_setup_view \\
  > handoff/sta/\${DESIGN_TOP}.spef

# 3. Conformal Logic Equivalence Checking (LEC) Dofile
# Formally proves that synthesized gates match RTL without running simulations!
write_do_lec -golden_design rtl \\
  -revised_design outputs/\${DESIGN_TOP}_netlist.v \\
  -checkpoint outputs/\${DESIGN_TOP}_check_point.ckp \\
  -no_exit -verbose \\
  -logfile lec/logs/rtl_to_final.lec.log \\
  > lec/inputs/rtl_to_final.lec.do

# 4. Cadence Innovus Place & Route Database Handoff
write_design -innovus -base_name handoff/pnr/\${DESIGN_TOP}_synth_out
ENDCODE
`
    ]
  ),

  practical(
    "cadence-synthesis",
    "master",
    "genus-practical-lab",
    "Master Practical: Production Genus Synthesis Flow Scripting",
    25,
    "Construct a production-grade Cadence Genus synthesis script including MMMC loading, design attributes, HDL elaboration, cost groups, early audits, physical iSpatial compile, assign net removal, database queries, and signoff handoff export.",
    [
      "Set multi-threading and foundational synthesis attributes.",
      "Read MMMC configuration and physical LEFs.",
      "Read HDL, elaborate top design, and define path cost groups.",
      "Execute early check_design and check_timing_intent audits.",
      "Compile through syn_generic -physical, syn_map -physical, and syn_opt -spatial.",
      "Configure remove_assigns and query sequential instances with get_db.",
      "Generate signoff reports, SDF, SDC, and Conformal LEC dofile.",
    ],
    {
      language: "tcl",
      starter: `# ==============================================================================
# Production Cadence Genus Synthesis Script
# ==============================================================================
# TODO:
# 1. Attributes: auto_ungroup none, use_multibit_cells, optimize_constant_0/1_flops false, delete_unloaded_insts false
# 2. read_mmmc, read_physical -lef
# 3. read_hdl -sv, elaborate, uniquify, init_design
# 4. define_cost_group (I2R, R2O, R2R, I2O) & path_group
# 5. check_design, check_timing_intent
# 6. syn_generic -physical, syn_map -physical, syn_opt -spatial
# 7. set_db remove_assigns true, set_remove_assign_options
# 8. get_db insts -if {.is_sequential == true}
# 9. write_hdl, write_sdc, write_sdf, write_do_lec, write_design -innovus
`,
      checks: [
        { id: "attrs", label: "Foundational attributes", kind: "includes", pattern: "set_db auto_ungroup none" },
        { id: "mbit", label: "use_multibit_cells", kind: "includes", pattern: "set_db use_multibit_cells true" },
        { id: "mmmc", label: "read_mmmc", kind: "includes", pattern: "read_mmmc" },
        { id: "lef", label: "read_physical", kind: "includes", pattern: "read_physical" },
        { id: "elab", label: "elaborate & init_design", kind: "includes", pattern: "elaborate" },
        { id: "cg", label: "define_cost_group", kind: "includes", pattern: "define_cost_group" },
        { id: "pg", label: "path_group", kind: "includes", pattern: "path_group" },
        { id: "cd", label: "check_design", kind: "includes", pattern: "check_design" },
        { id: "ct", label: "check_timing_intent", kind: "includes", pattern: "check_timing_intent" },
        { id: "sg", label: "syn_generic", kind: "includes", pattern: "syn_generic" },
        { id: "sm", label: "syn_map", kind: "includes", pattern: "syn_map" },
        { id: "so", label: "syn_opt -spatial", kind: "includes", pattern: "syn_opt" },
        { id: "assign", label: "remove_assigns", kind: "includes", pattern: "remove_assigns" },
        { id: "db", label: "get_db sequential query", kind: "includes", pattern: "get_db" },
        { id: "lec", label: "write_do_lec", kind: "includes", pattern: "write_do_lec" },
        { id: "wd", label: "write_design -innovus", kind: "includes", pattern: "write_design" },
      ],
      solution: `# 1. Foundational Synthesis Attributes
set_db auto_ungroup none
set_db information_level 10
set_db source_verbose true
set_db use_multibit_cells true
set_db optimize_constant_0_flops false
set_db optimize_constant_1_flops false
set_db delete_unloaded_insts false

# 2. Ingestion: MMMC & Physical LEF
read_mmmc mmmc_setup.tcl
read_physical -lef { tech.lef stdcells.lef macros.lef }

# 3. HDL Ingestion & Elaboration
read_hdl -sv [glob ./rtl/*.sv]
elaborate soc_top
uniquify soc_top -verbose
init_design -top soc_top

# 4. Path & Cost Groups
define_cost_group -name I2R -design soc_top
define_cost_group -name R2O -design soc_top
define_cost_group -name R2R -design soc_top
define_cost_group -name I2O -design soc_top

path_group -from [all_inputs]    -to [all_registers] -group I2R -name I2R
path_group -from [all_registers] -to [all_outputs]   -group R2O -name R2O
path_group -from [all_registers] -to [all_registers] -group R2R -name R2R
path_group -from [all_inputs]    -to [all_outputs]   -group I2O -name I2O

# 5. Early Sanity Lint Audits
check_design -all > reports/check_design_early.rpt
check_timing_intent -verbose > reports/timing_intent_early.rpt

# 6. 3-Stage Physical / iSpatial Compilation
set_db syn_generic_effort high
read_def floorplan.def
syn_generic -physical

set_db syn_map_effort high
syn_map -physical

set_remove_assign_options -include_local_constant_assign -dont_skip_unconstrained_paths
set_db remove_assigns true
set_db use_tiehilo_for_const duplicate

set_db opt_spatial_effort extreme
syn_opt -spatial

# 7. Database Query
set flops [get_db insts -if {.is_sequential == true}]
puts "Mapped Sequential Registers: [llength $flops]"

# 8. Signoff Exports & Downstream Handoff
write_hdl -language v2001 > outputs/soc_top_netlist.v
write_sdc > outputs/soc_top_func.sdc
write_sdf -version 2.1 > handoff/sta/soc_top.sdf
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/inputs/rtl_to_final.lec.do
write_design -innovus -base_name handoff/pnr/soc_top_synth_out
`,
    }
  ),

  quiz("cadence-synthesis", "master", "genus-quiz", "Cadence Genus Synthesis — Comprehensive Master Certification Exam", [
    { id: "cg1", prompt: "How does the Genus Common UI data model represent design objects compared to legacy EDA tools?", choices: ["As native Tcl lists of database handles navigated via get_db / set_db, allowing direct list operations (llength, foreach) and chained property queries", "As opaque binary C++ collections requiring foreach_in_collection iterators", "As flat SQL tables in an external SQLite database", "As temporary text files written to the scratch disk"], answer: 0, explain: "Genus Common UI returns standard Tcl lists of handles, enabling clean attribute chaining (e.g. get_db insts.pins.net.name) without collection overhead." },
    { id: "cg2", prompt: "Why must 'optimize_constant_0_flops' and 'optimize_constant_1_flops' be set to 'false' in high-reliability ASIC flows?", choices: ["To prevent Genus from removing or tying off registers with static constant values, preserving design testability, scan chain integrity, and post-silicon ECO flexibility", "To force all registers to toggle at 1 GHz", "To double the leakage power of the chip", "Because standard cell libraries do not have tie-high or tie-low cells"], answer: 0, explain: "Disabling constant flop optimization ensures registers intended for configuration or post-silicon ECOs are not permanently deleted or tied to VDD/VSS." },
    { id: "cg3", prompt: "What is the key technological advantage of Genus iSpatial synthesis (syn_opt -spatial)?", choices: ["It invokes the native Innovus placement and early global routing engine in-memory during synthesis, eliminating the synthesis-to-P&R timing and congestion correlation gap", "It eliminates the need for Liberty timing libraries", "It converts Verilog RTL directly into a GDSII mask in one step", "It runs optical DRC rule checks on silicon wafers"], answer: 0, explain: "iSpatial embeds Innovus placement algorithms directly into Genus, ensuring that pre-route synthesis timing reflects actual placement and wire congestion." },
    { id: "cg4", prompt: "What does 'set_db use_multibit_cells true' achieve during Genus synthesis?", choices: ["It identifies registers with shared clock/reset signals and merges multiple single-bit flip-flops into multi-bit cells (e.g. 2-bit, 4-bit), significantly reducing clock tree power, pin capacitance, and area", "It converts 32-bit registers into analog op-amps", "It multiplies clock frequency by 8x", "It disables scan chain insertion"], answer: 0, explain: "Multi-bit flip-flop merging shares clock inverters across multiple register bits, dramatically reducing dynamic clock power and silicon footprint." },
    { id: "cg5", prompt: "Why are 'check_design' and 'check_timing_intent' executed before 'syn_generic' in production flows?", choices: ["To audit RTL syntax, multi-driven nets, undriven inputs, unconstrained endpoints, and generated clock loops early before wasting hours of compute on invalid synthesis runs", "To generate final GDSII files", "To calculate dynamic IR drop", "To install software updates"], answer: 0, explain: "Early lint and timing intent checks catch fatal RTL and SDC errors upfront before executing resource-intensive synthesis optimization stages." },
    { id: "cg6", prompt: "In hierarchical bottom-up synthesis, why are Interface Logic Models (ILM) preferred over full mapped databases?", choices: ["ILMs retain only the boundary logic cones and clock trees of child blocks while abstracting away internal registers, slashing top-level memory and runtime by 70-80% without losing boundary timing accuracy", "ILMs delete all boundary timing constraints", "ILMs convert digital logic into analog SPICE netlists", "ILMs bypass logic equivalence checking"], answer: 0, explain: "ILMs isolate interface timing paths while pruning core logic, enabling fast, high-capacity top-level timing closure." },
    { id: "cg7", prompt: "Why must 'delete_unloaded_insts' be set to 'false' during production synthesis runs?", choices: ["To preserve uncommitted spare cells, observability flip-flops, and test-monitoring logic that are not directly driving primary outputs at the time of synthesis", "To increase compile time by 10x", "To force all nets to be floating", "To disable wire-load models"], answer: 0, explain: "Setting delete_unloaded_insts to false prevents the optimizer from pruning spare gates or observation registers that are needed for later engineering change orders (ECOs) or DFT testing." },
    { id: "cg8", prompt: "Why is path partitioning into dedicated cost groups (I2R, R2O, R2R, I2O) essential in Genus synthesis?", choices: ["It prevents severe violations on I/O boundary paths from masking and starving optimization effort on internal register-to-register (R2R) paths", "It doubles the maximum clock frequency of the PLL", "It eliminates the need for SDC constraints", "It enables SPICE simulation in synthesis"], answer: 0, explain: "Cost groups allow the synthesis optimizer to optimize the worst negative slack (WNS) for each path category independently, preventing large I/O delays from suppressing R2R core optimization." },
    { id: "cg9", prompt: "Why does Genus default to latch-based Integrated Clock Gating ('lp_clock_gating_style latch') over simple AND gates?", choices: ["A level-sensitive latch holds the enable signal stable during the active clock phase, preventing hazardous clock glitches and spurious edge triggers", "Latches consume zero dynamic power", "AND gates cannot pass digital signals", "Latches eliminate all setup time requirements"], answer: 0, explain: "Latch-based clock gates sample the enable condition on the inactive clock edge to guarantee glitch-free gating when the clock toggles." },
    { id: "cg10", prompt: "How does Genus manage assign statements with 'set_remove_assign_options' and 'set_db remove_assigns true'?", choices: ["It inserts buffer pairs or re-wires pins to eliminate all 'assign' net aliases, producing clean structural Verilog required by downstream P&R and LVS tools", "It comments out all wires in the RTL", "It turns assign statements into tristate buses", "It replaces assigns with sequential registers"], answer: 0, explain: "Assign statements in synthesized netlists create net aliasing issues during P&R routing and LVS; Genus removes them by inserting dedicated buffers or pin rewiring." },
    { id: "cg11", prompt: "Why is 'set_db use_tiehilo_for_const duplicate' recommended over sharing a single tie cell across thousands of pins?", choices: ["It replicates tie-high and tie-low cells locally to prevent excessive fanout and max-capacitance DRC violations on static logic pins", "It increases total chip leakage by 50%", "It removes power and ground rails", "It bypasses standard cell placement"], answer: 0, explain: "Duplicating tie cells keeps constant-signal fanouts small and localized, preventing severe routing congestion and max_fanout design rule violations." },
    { id: "cg12", prompt: "In production DFT flows, what is the role of 'fix_dft_violations -async_reset -test_control TM'?", choices: ["It gates asynchronous reset signals during ATPG shift mode using the Test Mode (TM) signal, ensuring flops do not reset unexpectedly while scanning vectors", "It deletes all reset pins from the chip", "It converts asynchronous resets into synchronous clocks", "It replaces flip-flops with SRAM cells"], answer: 0, explain: "Asynchronous resets must be held inactive during scan shifting; test control gating ensures uncontrollable reset pins do not disrupt scan chain integrity." },
    { id: "cg13", prompt: "Why is exporting ScanDEF ('write_scandef') critical for the handoff to Cadence Innovus P&R?", choices: ["It provides the physical floorplanner with the logical scan chain connectivity so Innovus can reorder scan flops during placement to minimize wire cross-talk and wirelength", "It stores binary GDSII mask polygons", "It configures I/O pad drive strengths", "It defines power distribution grid stripes"], answer: 0, explain: "ScanDEF communicates scan chain membership to Innovus, allowing the placer to re-stitch scan connections based on physical placement proximity." },
    { id: "cg14", prompt: "What is the purpose of generating a Conformal LEC dofile ('write_do_lec') during Genus synthesis?", choices: ["It records all netlist checkpoints, structural rewiring, and register mapping rules to allow Conformal LEC to formally prove functional equivalence between golden RTL and synthesized gates", "It compiles Verilog into C++ executables", "It runs timing signoff in Tempus", "It generates thermal hotspot maps"], answer: 0, explain: "write_do_lec produces the complete setup script and guidance checkpoints for Cadence Conformal to verify that synthesis introduced zero logic bugs." },
    { id: "cg15", prompt: "How does Multi-Vth optimization in 'syn_opt' achieve standby power reduction without degrading timing performance?", choices: ["It maps non-critical paths with positive timing slack to High-Vth (HVT) cells to slash sub-threshold leakage while preserving Low-Vth (LVT) only on timing-critical paths", "It turns off the power supply to 50% of the chip", "It scales the clock frequency down to 10 MHz", "It swaps CMOS logic for NMOS logic"], answer: 0, explain: "By selectively swapping positive-slack cells to high-threshold (HVT) variants, up to 70% of chip leakage can be eliminated with zero setup timing degradation." },
    { id: "cg16", prompt: "What database command retrieves all output pins connected to sequential macro blocks in Genus Common UI?", choices: ["get_db [get_db insts -if {.is_macro == true}].pins -if {.direction == out}", "get_pins -of_objects [get_cells -macro] -output", "select_all_macro_pins -dir out", "find_pins -type macro -dir output"], answer: 0, explain: "Genus Common UI supports clean attribute chaining: get_db [get_db insts -if {.is_macro == true}].pins -if {.direction == out} directly filters output pins on macro handles." },
  ]),

  // ——— Subject 2: Cadence Physical Design (Innovus) ———
  theory(
    "cadence-pnr",
    "master",
    "innovus-inputs-floorplan-pdn",
    "Master: Design Ingestion, Die Sizing, Macro Floorplanning & Power Mesh Synthesis",
    30,
    "LEF/DEF ingestion, MMMC view definitions, core utilization, aspect ratio, macro placement channels, flyline analysis, halos, and Power Distribution Network (PDN) mesh synthesis.",
    [
      `## 1. Physical Design Input Files & Sanity Verification

The Cadence Innovus physical design flow ingests logical, physical, timing, and parasitic technology models:
* **Gate-Level Netlist (\`.v\`)**: Synthesized gate-level Verilog netlist from Genus synthesis.
* **Physical LEF Files (\`.lef\`)**:
  * *Technology LEF (\`tech.lef\`)*: Defines manufacturing grid, metal layers (M1–M8), routing pitch, width, spacing, and standard via cell definitions.
  * *Cell LEF (\`cell.lef\` / \`macro.lef\`)*: Defines physical bounding boxes, pin locations, layers, and obstruction routing halos for standard cells and hard macros.
* **Timing & Power Libraries (\`.lib\`)**: Non-Linear Delay Models (NLDM), Composite Current Source (CCS), or Effective Current Source Model (ECSM) characterization across PVT corners.
* **Constraints (\`.sdc\` / \`.upf\` / \`.view\`)**: Multi-Mode Multi-Corner (MMMC) analysis view definitions and low-power power intent.
* **Interconnect Technology Files (\`.qrcTechFile\` / \`.captable\`)**: Interconnect parasitic extraction rules for Tempus and Quantus QRC.

CODE tcl
# Ingestion & Design Initialization in Common UI
set_db init_power_nets { VDD VDD_SRAM }
set_db init_ground_nets { VSS }
read_mmmc scripts/view_definition.tcl
read_physical -lef { tech/asap7_tech.lef tech/asap7_stdcells.lef tech/sram_macro.lef }
read_netlist netlist/soc_top_syn.v.gz -top soc_top
init_design
check_design -type all
check_timing -verbose
ENDCODE

## 2. Floorplanning Mathematics: Sizing, Aspect Ratio & Utilization

Floorplanning establishes the physical boundary of the chip, core margins, standard cell row sites, and hard IP placement:
* **Core Utilization ($Util_{core}$)**:
  $$\\text{Utilization} = \\frac{\\text{Area}_{\\text{stdcells}} + \\text{Area}_{\\text{macros}}}{\\text{Area}_{\\text{core}}}$$
  * Standard ASIC target: **$65\\% - 70\\%$** for optimal routability without congestion blowouts.
* **Aspect Ratio ($AR$)**:
  $$AR = \\frac{\\text{Height}_{\\text{core}}}{\\text{Width}_{\\text{core}}}$$
  * Square die ($AR = 1.0$) minimizes average Manhattan wirelength and center-to-corner interconnect latency.

CODE tcl
# Floorplan initialization: 70% utilization, 1.0 aspect ratio, 20um boundary margins
create_floorplan -site CoreSite -core_density_size 0.70 1.0 20.0 20.0 20.0 20.0
ENDCODE

## 3. Macro Placement Strategy & Channel Calculations

Hard macros (SRAMs, DSPs, PLLs) must be pushed to the core periphery to leave a continuous, convex central region for standard cell placement:
1. **Flyline & Dataflow Alignment**: Place macros along the natural dataflow from I/O pads to central processor ALUs.
2. **Pin Interface Orientation**: Orient macros (R0, R180, MY) so pin interfaces face the core active area, never boundary walls.
3. **Channel Width Formula**:
   $$W_{\\text{channel}} \\ge \\frac{N_{\\text{buses}} \\times \\text{Metal Pitch}}{\\text{Available Routing Layers}} + \\text{Keepout Halo}$$
4. **Placement & Routing Halos**: Apply keepout halos around macros to prevent standard cells from filling narrow corridors and exhausting routing tracks.

CODE tcl
# Place macros with halos and boundary keepouts
create_place_halo -halo_deltas { 25.0 25.0 25.0 25.0 } -insts [get_db insts -if {.is_macro == true}]
create_route_halo -bottom_layer M1 -top_layer M4 -space 15.0 -insts [get_db insts -if {.is_macro == true}]
place_macro -insts [get_db insts -if {.is_macro == true}] -query_dataflow true
check_pin_access -insts [get_db insts -if {.is_macro == true}]
ENDCODE

## 4. Power Planning & Power Distribution Network (PDN) Synthesis

A robust Power Distribution Network (PDN) supplies VDD and VSS with minimal IR drop ($< 2-3\\% V_{DD}$) and zero electromigration violations:
* **Core & Macro Rings**: Low-resistance top metal rings (M7/M8) surrounding the core and memory blocks.
* **Power Stripes (Mesh)**: Orthogonal grid of thick metal straps (e.g. M6 Vertical, M7 Horizontal) distributing current.
* **Standard Cell Followpin Rails (\`sroute\`)**: Horizontal M1 rails directly powering standard cell rows.

CODE tcl
# Global net connections
global_net_connect VDD -type pgpin -pin VDD -inst * -override
global_net_connect VSS -type pgpin -pin VSS -inst * -override

# Core power rings (M7/M8)
add_rings -nets {VDD VSS} -type core_rings -width 4.0 -spacing 2.0 -layer {M7 M8}

# Power mesh stripes (M6/M7)
add_stripes -nets {VDD VSS} -layer M6 -width 2.0 -spacing 2.0 -set_to_set_distance 25.0 -start_offset 10.0
add_stripes -nets {VDD VSS} -layer M7 -width 2.0 -spacing 2.0 -set_to_set_distance 25.0 -start_offset 10.0

# Special Route (sroute) standard cell followpins
sroute -connect {core_pin} -nets {VDD VSS} -core_pin_target {ring stripe followpin}
check_connectivity -type pg_pin
write_db database/floorplan_pdn.db
ENDCODE
`
    ]
  ),

  theory(
    "cadence-pnr",
    "master",
    "innovus-placement-congestion",
    "Master: Standard Cell Placement, Congestion Relief & Physical Cell Insertion",
    30,
    "Analytical quadratic placement, Early Global Routing (eGR), congestion hot-spot alleviation, partial density blockages, cell padding, well-taps, endcaps, and tie cells.",
    [
      `## 1. Analytical Global Placement & Early Global Routing (eGR)

Cadence Innovus uses analytical quadratic wirelength minimization (mGPlace engine) to place standard cells across hundreds of thousands of row sites:
* **Global Placement**: Solves continuous optimization equations to find optimal cell coordinates while minimizing wirelength.
* **Early Global Routing (eGR)**: Routes virtual wires across global routing cells (G-cells) to calculate routing track demand versus supply.
* **Legalization**: Snaps cells to legal discrete site rows, resolves cell overlaps, respects multi-bit cell sites, and aligns power rails.

CODE tcl
# High-effort timing & congestion driven placement
set_db place_opt_congestion_effort high
set_db place_opt_run_global_place true
set_db place_opt_multibit_cells true
place_opt_design -expanded_views
check_place
report_congestion -hotspot -overflow
ENDCODE

## 2. Congestion Relief: Density Blockages & Cell Padding

When arithmetic clusters or high-pin-density multiplexers cause routing overflow ($> 100\\%$ G-cell demand):
* **Partial Placement Blockage**: Limits cell density in a specific bounding box (e.g. 60-70% max density).
* **Cell Padding (Keepout Halo)**: Inserts blank placement sites around dense gates (e.g. \`INVX32\`, \`MUX4X16\`) to reserve routing tracks for pin access.

CODE tcl
# Apply partial density blockage over congested region
create_place_blockage -type partial -density 65 -box { 1200 1200 1600 1600 } -name BLK_ALU_DENSITY

# Apply cell padding on high-drive standard cells
specify_cell_pad -cells { *INVX32* *MUX4X16* *AOI22X8* } -left 2 -right 2
place_opt_design -expanded_views
ENDCODE

## 3. Physical Cell Insertion: Tap Cells, Endcaps & Tie Cells

Prior to or during placement, physical non-logical standard cells are inserted to protect silicon integrity:
1. **Well-Tap Cells (Latch-Up Prevention)**: Tie N-well to VDD and P-substrate to VSS at regular intervals (pitch $\\le 50-60\\,\\mu\\text{m}$) to eliminate parasitic SCR latch-up burnout.
2. **Endcap Cells**: Placed at row terminations and macro boundaries to isolate N-well layers and satisfy boundary DRC rules.
3. **Tie-High / Tie-Low Cells**: Drive static \`1'b1\` and \`1'b0\` inputs with localized fanout limits (fanout $\\le 16$) to prevent ESD oxide breakdown.

CODE tcl
# Insert well-taps in checkerboard pattern
add_well_taps -cell TAPCELL_X1 -checker_board -max_distance 50.0

# Insert row boundary endcaps
add_endcaps -left_cells ENDCAP_L -right_cells ENDCAP_R -prefix ENDCAP

# Distribute local tie cells
set_db add_tie_cells_max_fanout 16
set_db add_tie_cells_max_distance 20.0
add_tie_cells -cells { TIEHI TIELO } -prefix TIE_LOCAL
ENDCODE
`
    ]
  ),

  theory(
    "cadence-pnr",
    "master",
    "innovus-ccopt-cts",
    "Master: CCOpt Clock Tree Synthesis, Useful Skew & NDR Shielding",
    30,
    "Clock Concurrent Optimization (CCOpt), clock latency vs skew, useful skew scheduling, Non-Default Routing (NDR) shielding, ICG clock gating closure, and multi-clock domain balancing.",
    [
      `## 1. Clock Concurrent Optimization (CCOpt CTS) Architecture

Traditional CTS synthesizes a zero-skew clock tree in isolation and then fixes data paths. **Cadence CCOpt (Clock Concurrent Optimization)** co-synthesizes the clock tree and optimizes data paths simultaneously:
* **Insertion Delay (Latency)**: Time taken for clock edge to propagate from PLL source to flip-flop clock pins ($T_{\\text{latency}}$).
* **Clock Skew ($T_{\\text{skew}}$)**: Arrival time difference between two flip-flops ($T_{\\text{skew}} = T_{\\text{capture}} - T_{\\text{launch}}$).
* **CCOpt Useful Skew**: Intentionally introduces positive skew on critical setup paths by delaying capture clocks, borrowing margin from non-critical downstream stages.

CODE tcl
# Generate CCOpt specification
create_clock_tree_spec -out ccopt.spec

# Configure CCOpt targets in Common UI
set_db ccopt_target_insertion_delay 0.500
set_db ccopt_target_skew 0.030
set_db ccopt_target_max_trans 0.080
set_db ccopt_useful_skew true
set_db ccopt_useful_skew_delay_margin 0.040

# Execute concurrent CTS and datapath optimization
clock_opt_design -expanded_views
report_ccopt_clock_trees -summary
report_ccopt_skew_groups -all
ENDCODE

## 2. Non-Default Routing (NDR) & VSS Shielding

High-speed clock trunks are sensitive to cross-talk glitches and capacitive delay variation:
* **NDR Rules**: Wires routed with $2\\times$ width ($2\\text{W}$) and $2\\times$ spacing ($2\\text{S}$) on thick low-resistance upper metal layers (M5–M7).
* **VSS Ground Shielding**: Sandwiches clock wires between continuous parallel VSS ground traces to eliminate capacitive coupling from data buses.

CODE tcl
# Define 2W2S NDR rule with VSS shielding on M5-M7
create_route_type -name CLK_NDR_SHIELD \\
                  -top_preferred_layer M7 -bottom_preferred_layer M5 \\
                  -width_multiplier 2 -space_multiplier 2 -shield_net VSS
set_db ccopt_route_group_clock_route_type CLK_NDR_SHIELD
clock_opt_design -expanded_views
ENDCODE

## 3. Clock Domain Separation & Multi-Corner Skew Balancing

* **Asynchronous Clocks**: Asynchronous domains (e.g. PCIe 250 MHz and Core 1.2 GHz) must **NEVER** be balanced in a single skew group. Separate skew groups must be explicitly defined in \`ccopt.spec\`.
* **Common Path Pessimism Removal (CPPR / CRPR)**: STA must credit shared clock buffer pessimism so identical clock buffers are not derated early and late in the same cycle.

CODE tcl
# Enable CPPR in post-CTS timing analysis
set_db timing_cppr_threshold_ps 1
set_db timing_analysis_type ocv
set_db timing_enable_cppr true
time_design -post_cts -expanded_views
ENDCODE
`
    ]
  ),

  theory(
    "cadence-pnr",
    "master",
    "innovus-nanoroute-si",
    "Master: NanoRoute Detailed Routing, Signal Integrity & Antenna DRC",
    30,
    "Track assignment, maze detailed routing, Process Antenna Effect diode fixing, cross-talk delta delay, Miller coupling, dynamic IR drop, and post-route timing optimization.",
    [
      `## 1. NanoRoute Detailed Routing Engine

Cadence NanoRoute performs global routing, track assignment, and grid detailed routing:
1. **Global Routing**: Partitions nets into G-cell routing guides.
2. **Track Assignment**: Assigns long wire segments to legal preferred-direction routing tracks on M2–M8.
3. **Detailed Maze Routing**: Connects exact cell pins with minimum area, EOL enclosure, and cut-to-cut spacing rule satisfaction.

CODE tcl
# NanoRoute configuration with via optimization & wire spreading
set_db route_design_detail_post_route_swap_via true
set_db route_design_detail_post_route_spread_wire true
set_db route_design_detail_use_multi_cut_via true
set_db route_design_detail_max_iterations 30
route_opt_design
check_drc
check_connectivity -type regular
ENDCODE

## 2. Process Antenna Effect & Diode Insertion

During wafer manufacturing plasma etching, long metal interconnects act as antennas collecting electrostatic charges:
$$\\text{Antenna Ratio} = \\frac{\\text{Metal Interconnect Area}}{\\text{Connected Gate Oxide Area}} \\le \\text{Foundry Limit (e.g. 400:1)}$$
If charge exceeds oxide breakdown voltage, thin gate dielectrics rupture permanently.
* **Fixing Methods**:
  1. *Antenna Diode Insertion*: Reverse-biased diodes clamp plasma charges to ground.
  2. *Layer Hopping (Jogging)*: Transitioning to top metal layers breaks long lower-layer antennas into short safe segments.

CODE tcl
# Automated Antenna DRC repair
set_db route_antenna_cell_name ANTENNA_X1
set_db route_antenna_effort high
set_db route_antenna_fix_with_diodes true
set_db route_antenna_fix_with_jogging true
route_opt_design -fix_drc
check_drc -rule antenna
ENDCODE

## 3. Signal Integrity (SI), Cross-Talk & Miller Coupling

When adjacent wires switch in opposite directions simultaneously, effective coupling capacitance doubles:
$$C_{\\text{eff}} = (1 - (-1)) \\cdot C_c = 2 \\cdot C_c \\quad \\implies \\quad \\Delta \\text{Delay} = 2 \\cdot R_{\\text{driver}} \\cdot C_c$$
* **Glitch Noise**: Quiet nets coupled to switching aggressors suffer voltage glitch spikes ($V_{\\text{glitch}}$) risking false resets or clock triggers.
* **Remediations**:
  * Upsizing weak victim drivers to reduce output impedance ($R_{\\text{on}}$).
  * Post-route wire spreading to double trace spacing.
  * Buffer insertion on long coupled nets.

CODE tcl
# Tempus Signal Integrity (SI) signoff optimization
set_db si_delay_analysis_mode extreme
set_db si_glitch_analysis_mode extreme
opt_design -post_route -si -expanded_views
report_noise -violators -above 0.20
ENDCODE
`
    ]
  ),

  theory(
    "cadence-pnr",
    "master",
    "innovus-timing-closure-eco",
    "Master: Post-Route MMMC Timing Closure, POCV Derating & Signoff ECO",
    30,
    "Multi-Mode Multi-Corner concurrent timing closure, Parametric OCV (POCV) statistical modeling, temperature inversion, leakage power recovery, and functional metal-only ECOs.",
    [
      `## 1. Multi-Mode Multi-Corner (MMMC) Concurrent Closure

Closing timing across advanced nodes requires concurrent optimization across all functional and test modes under PVT extremes:
* **Setup Corner (Slow Corner)**: $0.72\\,\\text{V} / 125^\\circ\\text{C}$ (Max RC parasitics).
* **Hold Corner (Fast Corner)**: $0.88\\,\\text{V} / -40^\\circ\\text{C}$ (Min RC parasitics).
* **Temperature Inversion**: In near-threshold FinFETs, low voltage ($0.70\\,\\text{V}$) at $-40^\\circ\\text{C}$ is slower than $125^\\circ\\text{C}$ due to carrier mobility degradation.

CODE tcl
# Concurrent MMMC optimization with target margins
set_db opt_setup_effort high
set_db opt_hold_effort high
set_db opt_setup_target_slack 0.030
set_db opt_hold_target_slack 0.030
opt_design -post_route -expanded_views
time_design -post_route -expanded_views
ENDCODE

## 2. Parametric On-Chip Variation (POCV) Statistical Signoff

Traditional flat OCV applies an over-pessimistic scalar derate everywhere. **POCV (Parametric OCV)** uses Gaussian distributions per cell instance:
$$\\text{Delay}_{\\text{POCV}} = \\mu \\pm 3\\sigma \\cdot \\sqrt{\\sum \\sigma_i^2}$$
Accurately models random variation across deep logic paths, recovering 150-200 ps of real timing margin.

CODE tcl
# Load foundry POCV variation tables
read_pocv_table libs/asap7_pocv_table.pocv
set_db timing_analysis_type pocv
set_db timing_pocv_sigma 3.0
set_db timing_enable_cppr true
time_design -post_route -expanded_views
ENDCODE

## 3. Post-Route Leakage Recovery & Metal-Only ECOs

* **Leakage Power Recovery**: Footprint-compatible cell swapping of positive-slack cells from LVT to HVT, slashing static standby leakage by $70\\%$ with zero routing disturbance.
* **Metal-Only ECO (Spare Gate Rewiring)**: Modifies upper metal layers (M2–M6) to rewire pre-placed spare gates (\`add_spare_cells\`), fixing functional bugs without modifying frozen silicon base layers ($2M respin savings).

CODE tcl
# Post-route leakage recovery
set_db opt_preserve_slack true
set_db opt_slack_threshold 0.030
opt_leakage_power -post_route -expanded_views

# Functional metal ECO on spare gate
eco_netlist_change -type add_inverter -inst_name SPARE_INV_42 -net dma_ack_valid
route_eco -nets { dma_ack_valid dma_ack_valid_b } -modify_layers_only { M2 M3 M4 M5 M6 }
check_drc
ENDCODE
`
    ]
  ),

  theory(
    "cadence-pnr",
    "master",
    "innovus-physical-verification-dfm",
    "Master: Physical Verification (DRC/LVS/ERC), DFM Via Doubling & Stream-Out",
    30,
    "Calibre/Pegasus DRC/LVS/ERC signoff, redundant via doubling, dummy metal fill CMP balancing, Well Proximity Effect (WPE), STI stress, and OASIS/GDSII stream-out.",
    [
      `## 1. Physical Verification Signoff: DRC, LVS & ERC

Before tapeout mask generation, the layout database must pass full physical verification with zero violations:
* **Design Rule Checking (DRC)**: Verifies geometric rules (minimum spacing, minimum width, end-of-line enclosure, via cut spacing, antenna ratio).
* **Layout Versus Schematic (LVS)**: Extracts physical MOS transistors and interconnects from layout polygons and proves 1-to-1 equivalence against the gate netlist.
* **Electrical Rule Checking (ERC)**: Detects floating MOS gates, un-tied substrate wells, and cross-voltage domain short circuits.

CODE tcl
# Run in-system DRC & Connectivity checks
check_drc -type all
check_connectivity -type regular
check_connectivity -type pg_pin
ENDCODE

## 2. Design for Manufacturability (DFM): Metal Fill & Via Doubling

* **Redundant Via Doubling**: Replaces single-cut vias with double-cut via arrays ($> 90\\%$ target) to protect against random particle open-circuit defects.
* **Dummy Metal Fill CMP Balancing**: Populates sparse areas with floating or tied dummy metal polygons (target $45\\%$ density) to prevent oxide dishing during Chemical-Mechanical Polishing.
* **Well Proximity Effect (WPE) & STI Stress Guarding**: Keeps sensitive analog blocks $> 3-5\\,\\mu\\text{m}$ away from well edges to prevent threshold voltage ($V_{th}$) shifts.

CODE tcl
# DFM Via doubling optimization
set_db route_design_detail_use_multi_cut_via true
set_db route_design_detail_multi_cut_via_effort high
route_opt_design

# Track-based dummy metal fill generation
set_db add_fillers_density_mode window_based
set_db add_fillers_target_density 45.0
add_metal_fill -layer { M1 M2 M3 M4 M5 M6 M7 M8 } -nets { VSS }
check_metal_density
ENDCODE

## 3. Tapeout Stream-Out Signoff (OASIS / GDSII)

The final verified physical database is exported as SEMI OASIS (\`.oasis\`) or GDSII (\`.gds\`) with certified foundry layer map files:

CODE tcl
# Stream out compressed OASIS database for mask shop
write_stream -format oasis \\
             -map_file tech/foundry_official_gds.map \\
             -lib_name soc_top \\
             -output outputs/oasis/soc_top_final.oasis.gz
ENDCODE
`
    ]
  ),

  practical(
    "cadence-pnr",
    "master",
    "innovus-practical-lab",
    "Master Practical: Cadence Innovus PODV2 Physical Design Diagnostic Lab",
    35,
    "Triage and resolve 70 real-world production failure scenarios across Floorplanning, PDN, Standard Cell Placement, CCOpt CTS, NanoRoute Routing, Signal Integrity, and Physical Verification.",
    [
      "Explore 70 comprehensive Physical Design scenarios across 7 distinct domains.",
      "Analyze simulated EDA diagnostic failure logs (Innovus, Voltus, CCOpt, NanoRoute, Tempus, Pegasus).",
      "Select golden Cadence Innovus PODV2 remediations and verify physical metrics.",
      "Inspect 2D Die floorplan layers, macro halos, power meshes, and clock trees.",
      "Execute live database queries in the Innovus get_db Query Studio.",
    ],
    {
      language: "tcl",
      starter: `# Cadence Innovus PODV2 Master Flow Script
# TODO: Floorplan, PDN, Placement, CCOpt CTS, NanoRoute, Signoff
`,
      checks: [
        { id: "fp", label: "create_floorplan", kind: "includes", pattern: "create_floorplan" },
        { id: "ring", label: "add_rings", kind: "includes", pattern: "add_rings" },
        { id: "stripe", label: "add_stripes", kind: "includes", pattern: "add_stripes" },
        { id: "sr", label: "sroute", kind: "includes", pattern: "sroute" },
        { id: "place", label: "place_opt_design", kind: "includes", pattern: "place_opt_design" },
        { id: "clock", label: "clock_opt_design", kind: "includes", pattern: "clock_opt_design" },
        { id: "route", label: "route_opt_design", kind: "includes", pattern: "route_opt_design" },
        { id: "stream", label: "write_stream", kind: "includes", pattern: "write_stream" },
      ],
      solution: `create_floorplan -site CoreSite -core_density_size 0.70 1.0 20.0 20.0 20.0 20.0
create_place_halo -halo_deltas { 25 25 25 25 } -insts [get_db insts -if {.is_macro == true}]
add_rings -nets {VDD VSS} -type core_rings -width 4.0 -spacing 2.0 -layer {M7 M8}
add_stripes -nets {VDD VSS} -layer M6 -width 2.0 -spacing 2.0 -set_to_set_distance 25.0
sroute -connect {core_pin} -nets {VDD VSS}
place_opt_design -expanded_views
create_clock_tree_spec
clock_opt_design -expanded_views
route_opt_design
write_stream -format oasis -map_file tech/foundry_official_gds.map -output outputs/soc_top.oasis.gz
`,
    }
  ),

  quiz("cadence-pnr", "master", "innovus-quiz", "Cadence Innovus Physical Design — Master Certification Exam", [
    { id: "pnr_q1", prompt: "In floorplan design, what is the primary purpose of applying placement and routing halos around hard SRAM macros?", choices: ["To keep standard cells and lower-metal signal routes out of narrow corridors, preventing severe pin congestion and track exhaustion", "To speed up gate-level simulation by 10x", "To reduce macro power supply voltage to zero", "To delete unused memory address bits"], answer: 0, explain: "Halos create a mandatory keepout perimeter around macros, preventing standard cells from crowding into macro channels and blocking signal bus routing tracks." },
    { id: "pnr_q2", prompt: "Why is an aspect ratio of 1.0 (square die) generally preferred for standard ASIC floorplans?", choices: ["It minimizes the average Manhattan interconnect wirelength across the chip, reducing RC delay and dynamic power", "It allows the chip to rotate freely in the socket", "It doubles the speed of the PLL", "It eliminates the need for power stripes"], answer: 0, explain: "A 1.0 aspect ratio minimizes the average center-to-corner distance across the die, minimizing long-haul wire delays." },
    { id: "pnr_q3", prompt: "What is the primary physical cause of the Process Antenna Effect during semiconductor fabrication?", choices: ["Long metal interconnects collect electrostatic charge during plasma etching that discharges through and ruptures thin MOS gate dielectric oxides", "Radio frequency interference from nearby cell towers", "Thermal expansion of copper bondwires", "Static magnetic fields from test sockets"], answer: 0, explain: "During reactive ion plasma etching, long metal wires accumulate electrostatic charges that can break down thin transistor gate oxides unless protected by antenna diodes or metal jumpers." },
    { id: "pnr_q4", prompt: "How does Cadence CCOpt (Clock Concurrent Optimization) differ fundamentally from traditional standalone CTS?", choices: ["CCOpt co-optimizes clock insertion delays and data path cell sizing simultaneously, using intentional useful skew to close setup timing on critical paths", "CCOpt deletes all clock buffers to save dynamic power", "CCOpt converts synchronous circuits into asynchronous logic", "CCOpt only operates on analog circuits"], answer: 0, explain: "CCOpt concurrently balances clock tree synthesis with datapath sizing and intentionally schedules useful skew to borrow slack from non-critical downstream stages." },
    { id: "pnr_q5", prompt: "Why are Non-Default Routing (NDR) rules with VSS shielding (e.g. 2W2S) applied to high-speed clock trunk nets?", choices: ["To reduce wire resistance and eliminate cross-talk coupling capacitance from switching data bus aggressors", "To make clock wires visible under optical microscopes", "To increase clock net parasitic capacitance to maximum", "To slow down the clock frequency"], answer: 0, explain: "Double width/spacing lowers resistance and capacitance, while VSS ground shielding provides electrostatic isolation against cross-talk noise." },
    { id: "pnr_q6", prompt: "What is the role of Special Route ('sroute') in the Cadence power delivery network flow?", choices: ["Generating horizontal standard cell row followpin rails (M1) and connecting macro power pins to the global power rings and mesh stripes", "Routing differential high-speed PCIe clocks", "Placing scan flip-flops in order", "Running DRC validation"], answer: 0, explain: "sroute creates standard cell row followpin power rails and connects core cell/macro power pins to the upper-level power grid." },
    { id: "pnr_q7", prompt: "In multi-corner static timing analysis, why must Common Path Pessimism Removal (CPPR / CRPR) be enabled?", choices: ["Because a single physical clock buffer cannot be simultaneously fast (early) and slow (late) in the same clock cycle, so shared clock path pessimism must be credited", "To delete unclocked flip-flops", "To disable all setup timing checks", "To force clock jitter to zero"], answer: 0, explain: "CPPR removes the artificial pessimism where the launch and capture clock paths share identical physical clock buffers that are falsely derated in opposite directions." },
    { id: "pnr_q8", prompt: "What is the phenomenon of Temperature Inversion in advanced sub-micron FinFET technology nodes?", choices: ["At near-threshold low voltages, circuits switch SLOWER at -40°C than at 125°C because carrier mobility reduction dominates over threshold voltage reduction", "Transistors melt when operating below 0°C", "Clock buffers stop switching at high temperatures", "Power dissipation becomes negative at cold temperatures"], answer: 0, explain: "In low-voltage FinFET regimes, the drop in carrier mobility at cold temperatures outweighs the threshold voltage benefit, making -40°C the worst-case slow corner for setup timing." },
    { id: "pnr_q9", prompt: "How does Parametric On-Chip Variation (POCV) improve upon traditional flat OCV in timing signoff?", choices: ["POCV models random process variation as statistical Gaussian distributions (μ ± 3σ) per cell, accurately modeling variation across deep logic chains and eliminating over-pessimism", "POCV rounds all delays to 1.0 nanosecond", "POCV ignores clock jitter", "POCV replaces static timing with Spice Monte Carlo simulations"], answer: 0, explain: "POCV models statistical Gaussian variance ($\mu \pm 3\sigma$) per stage, capturing the statistical averaging of random variations across logic chains." },
    { id: "pnr_q10", prompt: "What is the primary function of Well-Tap cells inserted during physical floorplanning?", choices: ["To tie N-wells to VDD and P-substrates to VSS at regular intervals (pitch ≤ 50-60 µm) to prevent CMOS latch-up burnout", "To provide cooling water to the chip", "To store testbench vector data", "To measure silicon temperature"], answer: 0, explain: "Well-tap cells prevent CMOS latch-up (parasitic SCR firing) by keeping substrate and well potentials firmly tied to VSS and VDD within the maximum allowable tap distance." },
    { id: "pnr_q11", prompt: "Why are Decoupling Capacitor (Decap) cells placed near clock buffers and high-activity logic clusters?", choices: ["To act as local electrostatic charge reservoirs that supply instantaneous switching current, suppressing dynamic IR drop voltage sag and clock jitter", "To increase static leakage power", "To store permanent boot ROM firmware", "To filter high-frequency radio signals from the package"], answer: 0, explain: "Decap cells provide localized high-frequency charge storage that supplies current during simultaneous clock switching, dampening dynamic $L \cdot di/dt$ voltage drops." },
    { id: "pnr_q12", prompt: "How does post-route wire spreading reduce crosstalk delta delay on parallel bus lines?", choices: ["By moving adjacent wires into unused tracks to increase inter-wire spacing, cutting coupling capacitance (Cc) by up to 70%", "By converting copper wires into optical fibers", "By making wires 10x thinner", "By deleting half of the bus bits"], answer: 0, explain: "Wire spreading shifts adjacent signal traces apart into available empty routing tracks, drastically lowering mutual coupling capacitance ($C_c$) without changing net connectivity." },
    { id: "pnr_q13", prompt: "In Layout Versus Schematic (LVS) verification, what is an 'Open Circuit' violation?", choices: ["A logical net connection in the schematic that has no continuous physical metal path connecting the corresponding device pins in the layout", "A broken silicon wafer", "A door left open in the cleanroom", "A floating gate tied to VDD"], answer: 0, explain: "An LVS open circuit occurs when physical metal wiring fails to connect all pins belonging to a logical net defined in the schematic netlist." },
    { id: "pnr_q14", prompt: "What is the purpose of inserting redundant multi-cut vias (via doubling) during DFM optimization?", choices: ["To replace single-cut vias with double-cut via pairs, drastically reducing chip failure rates from random particle open defects during fabrication", "To double the power consumption of each via", "To make the GDSII file 10x larger", "To convert vertical routes into horizontal routes"], answer: 0, explain: "Via doubling provides a parallel conductive path for each layer transition, ensuring a single particle defect cannot cause an open-circuit failure." },
    { id: "pnr_q15", prompt: "Why is dummy metal fill inserted across sparse routing regions prior to tapeout signoff?", choices: ["To balance metal density across every layer within foundry window limits (25%-75%), preventing oxide dishing and erosion during Chemical-Mechanical Polishing (CMP)", "To conduct excess current to the ground ring", "To increase chip weight", "To make reverse engineering impossible"], answer: 0, explain: "Chemical-Mechanical Polishing (CMP) requires uniform planar density across the die; dummy metal fill prevents dishing and dielectric thickness variations." },
    { id: "pnr_q16", prompt: "What is a 'Metal-Only ECO' in post-silicon physical design?", choices: ["Rewiring pre-placed uncommitted spare standard cells using upper metal layers only, fixing functional bugs without modifying frozen silicon base masks ($2M savings)", "Manufacturing a chip made entirely of solid copper", "Deleting all standard cells from the database", "Routing the entire design on Metal 1"], answer: 0, explain: "A metal-only ECO modifies only upper routing masks to rewire existing spare gates, preserving the multi-million dollar base diffusion and poly silicon reticles." },
    { id: "pnr_q17", prompt: "What is the primary advantage of the SEMI OASIS format over traditional GDSII for full-chip tapeout handoff?", choices: ["OASIS utilizes modern binary compression, modal coordinate offsets, and repetition structures to reduce file sizes by 70%-90%", "OASIS is human-readable ASCII text", "OASIS files can be edited in Microsoft Word", "OASIS does not require layer map files"], answer: 0, explain: "OASIS replaces verbose GDSII records with modern compressed structures, shrinking 50GB+ GDSII files down to a few gigabytes for rapid foundry handoff." },
    { id: "pnr_q18", prompt: "What causes the Well Proximity Effect (WPE) on transistors placed close to well mask edges?", choices: ["Dopant ion implant scattering off photoresist sidewalls creates higher dopant concentration near well boundaries, shifting transistor threshold voltage (Vth)", "Heat conduction from adjacent power rings", "Electromagnetic radiation from substrate noise", "Oxide erosion during wet etching"], answer: 0, explain: "Ion implantation scattering off photoresist edges alters substrate doping profiles near well boundaries, causing threshold voltage shifts unless guarded by keepout margins." },
    { id: "pnr_q19", prompt: "Why must isolation and power-gating control signals (iso_en, sleep_n) be strictly shielded and driven by low-impedance buffers?", choices: ["To prevent cross-talk glitch noise from temporarily disabling isolation clamps and corrupting always-on memory during sleep states", "To increase power consumption in sleep mode", "To make control signals switch faster than 10 GHz", "To satisfy I/O pad slew limits"], answer: 0, explain: "A glitch on an isolation or sleep control line can wake up a sleeping power domain or break isolation clamps, injecting floating states into active memory." },
    { id: "pnr_q20", prompt: "What database command in Cadence Innovus Common UI retrieves all sequential macro blocks and their placement coordinates?", choices: ["get_db [get_db insts -if {.is_macro == true}] .name .location .orient", "find_macros -all -show_coordinates", "select_cells -type hard_macro", "report_macro_locations -verbose"], answer: 0, explain: "Innovus Common UI uses object attribute querying: get_db [get_db insts -if {.is_macro == true}] .name .location .orient directly queries macro instance attributes." },
  ]),

  // ——— Subject 3: Cadence Power Analysis (Voltus) ———
  theory(
    "cadence-power",
    "master",
    "voltus-pgv-modeling",
    "Master: Voltus Power Modeling, Power Grid Views (PGV) & Flow Ingestion",
    25,
    "Power Grid Views (.pgv), cell-level parasitic modeling, static/dynamic mode configuration, and database ingestion.",
    [
      `## Voltus Power Integrity Signoff Architecture

Cadence Voltus is the industry standard massively parallel IC power integrity signoff engine, delivering SPICE-accurate Static IR drop, Dynamic vector-based voltage drop, Signal and Power Electromigration (EM), and multi-voltage UPF integrity verification.

\`\`\`
   [Innovus DEF / Common UI DB]     [Liberty .lib (Timing/Leakage)]      [Technology LEF / QRC Tech]
                  \\                                |                               /
                   \\                               |                              /
                    v                              v                             v
           +-------------------------------------------------------------------------------+
           |                  Cadence Voltus Power Grid View (PGV) Generator               |
           |   (Extracts transistor-level PG network, non-linear current taps & decaps)    |
           +-------------------------------------------------------------------------------+
                                                   |
                                                   v
                         [Power Grid Model Libraries: stdcells.pgv, macros.pgv]
                                                   |
                                                   v
                    +-------------------------------------------------------------+
                    |             Voltus Rail & Transient Solver Engine           |
                    |  - Static DC Solver (Ohm's Law: V = I_avg · R_mesh)         |
                    |  - Dynamic Vector Solver (L·di/dt + RC Transient Mesh)      |
                    |  - Black's Equation EM Engine (MTTF = A · J^-n · exp(Ea/kT))|
                    +-------------------------------------------------------------+
                                                   |
                                                   v
                    [Signoff Reports: static_ir.rpt, dynamic_ir.rpt, power_em.rpt]
                    [Voltus-Tempus Voltage Maps: static_voltages.vdb, dynamic.vdb]
\`\`\`

## Power Grid Model Library (PGV)
Standard cells and hard IP macros cannot be simulated at full transistor SPICE levels on a 100-million gate SoC. Voltus uses Power Grid Views (.pgv) which package internal cell power rail resistances, parasitic capacitances, and non-linear current tap profiles:
CODE tcl
# Load technology and cell Power Grid Views (PGV)
set_db power_grid_library { tech.pgv stdcells_asap7.pgv sram_512k.pgv dsp_fpu.pgv }
set_power_analysis_mode -method dynamic_vectorbased -disable_static false
ENDCODE
`
    ]
  ),

  theory(
    "cadence-power",
    "master",
    "voltus-static-ir-pdn",
    "Master: Static IR Drop Analysis, Resistive PDN Solver & Power Mesh Sizing",
    25,
    "DC voltage drop, mesh sheet resistance, via stack bottlenecks, followpin continuity, and bump arrays.",
    [
      `## Static IR Drop Physics & Governing Principles

Static IR drop is the time-averaged DC voltage degradation occurring across the resistive Power Distribution Network (PDN):

$$\\Delta V_{\\text{static}} = I_{\\text{avg}} \\cdot R_{\\text{mesh}}$$

Where:
- $I_{\\text{avg}}$ is the average operating current drawn by standard cells in a region.
- $R_{\\text{mesh}}$ is the cumulative series resistance of the metal power grid from the C4 power bump/pad to the standard cell pin.

Foundries enforce a strict signoff limit: **$\\Delta V_{\\text{static}} \\le 2.0\\% - 3.0\\%$ of nominal $V_{DD}$** (e.g., $\\le 24\\,\\text{mV}$ on a $0.80\\,\\text{V}$ supply).

## Production Voltus Static Rail Signoff Script
CODE tcl
# 1. Define Rail Analysis Mode
set_rail_analysis_mode -method static \\
  -accuracy hd \\
  -power_grid_library { stdcells_asap7.pgv sram_512k.pgv } \\
  -voltage_threshold 0.024

# 2. Define Power Domains and Supplies
set_rail_analysis_domain -domain PD_CORE -nets {VDD_CORE} -power_supply 0.80
set_rail_analysis_domain -domain PD_VSS  -nets {VSS}      -power_supply 0.00

# 3. Execute Static Rail Solver & Report Worst Drop
analyze_rail -type static -results_dir reports/static_rail_signoff
report_rail_results -type static_ir -limit 50 -out_file reports/static_ir_worst.rpt
ENDCODE
`
    ]
  ),

  theory(
    "cadence-power",
    "master",
    "voltus-dynamic-ir-noise",
    "Master: Dynamic Vector-Based Rail Analysis, L·di/dt Inductive Noise & SSN",
    25,
    "Transient rail collapse, simultaneous switching noise (SSN), LC anti-resonance, and clock buffer clustering.",
    [
      `## Dynamic IR Drop & Inductive Voltage Collapse

Dynamic IR drop captures instantaneous peak voltage drops occurring within picoseconds of active clock transitions:

$$V_{\\text{dynamic}}(t) = I_{\\text{peak}}(t) \\cdot R_{\\text{mesh}} + L_{\\text{package}} \\cdot \\frac{di}{dt}$$

When tens of thousands of registers and clock buffers toggle concurrently on a clock edge, the immense current slew rate ($\\frac{di}{dt}$) induces massive inductive supply collapse across package bond wires and board traces.

\`\`\`
   Clock Edge (T = 0.0 ns)
          |
          v
   Instantaneous di/dt Spike (40 mA/ps)
          |
          +---> Inductive Drop: V_L = L_pkg * (di/dt) = 0.5 nH * 40 mA/ps = 200 mV (FATAL!)
          +---> Resistive Drop: V_R = I_peak * R_mesh = 3.2 A * 0.025 Ohm = 80 mV
          |
          v
   Total Transient Voltage Dip = 280 mV (Supply collapses from 0.80V down to 0.52V!)
   Result: Clock buffer delay slows down by +150 ps -> Catastrophic Setup/Hold Failures!
\`\`\`

## Production Voltus Dynamic Rail Signoff Script
CODE tcl
# 1. Configure Vector-Based Dynamic Mode
set_power_analysis_mode -method dynamic_vectorbased -glitch_filter true
read_activity_file -format fsdb -start 100ns -end 250ns -activity_scope "tb/dut" ./sim/aes_burst.fsdb
report_power -out_file reports/dynamic_power.rpt

# 2. Execute High-Definition Dynamic Rail Analysis
set_rail_analysis_mode -method dynamic -accuracy hd -voltage_threshold 0.040
analyze_rail -type dynamic -results_dir reports/dynamic_rail_signoff
report_rail_results -type dynamic_ir -limit 50 -out_file reports/dynamic_ir_worst.rpt
ENDCODE
`
    ]
  ),

  theory(
    "cadence-power",
    "master",
    "voltus-em-signoff",
    "Master: Power Grid & Signal Electromigration (EM), Black's Equation & Joule Heating",
    25,
    "Metal atomic transport, Black's equation MTTF, DC/RMS current limits, self-heating, and Blech short-length effect.",
    [
      `## Electromigration (EM) Physics & Black's Equation

Electromigration is the gradual transport of metal atoms in a conductor caused by momentum exchange between conducting electrons and metal lattice ions (electron wind force).

Governed by **Black's Equation**:

$$\\text{MTTF} = \\frac{A}{J^n} \\cdot \\exp\\left(\\frac{E_a}{k \\cdot T}\\right)$$

Where:
- $\\text{MTTF}$ is the Mean Time to Failure (Target: $>100,000\\,\\text{operating hours}$).
- $J$ is the current density ($J = \\frac{I}{w \\cdot t}$).
- $E_a$ is the activation energy for Copper atom diffusion ($\\sim 0.9\\,\\text{eV}$).
- $T$ is the absolute junction temperature in Kelvin ($T_j$).

## DC vs AC Signal Electromigration
- **Power Grid (DC)**: Unidirectional current continuously displaces atoms, forming voids (open circuits) and hillocks (dielectric shorts).
- **Signal & Clock Nets (AC)**: Bidirectional current pushes atoms back and forth, allowing partial self-healing ($\\sim 90\\%$ recovery). However, high-frequency RMS currents cause **Joule heating (self-heating)**.

CODE tcl
# Execute Power Grid and Signal EM Signoff
set_rail_analysis_mode -temperature 125.0 -em_derate_with_temperature true
analyze_power_grid_em -results_dir reports/power_grid_em_signoff
analyze_signal_em -out_file reports/signal_em_signoff.rpt
ENDCODE
`
    ]
  ),

  theory(
    "cadence-power",
    "master",
    "voltus-power-gating-upf",
    "Master: MTCMOS Power Gating, Inrush Current Suppression & Multi-Voltage UPF",
    25,
    "Header/footer sleep switch sizing, daisy-chain cascade synthesis, inrush current peak analysis, and UPF isolation rules.",
    [
      `## Power Gating & Inrush Current Suppression

Multi-Threshold CMOS (MTCMOS) power gating shuts off standby leakage power in idle functional blocks by inserting high-Vt sleep transistors (header or footer switches) between the permanent supply and the virtual power rail.

\`\`\`
   Permanent VDD (0.80V)
          |
          +---> [Always-On Logic: VDD_AON] (Retention latches, PMU timers, ISO controls)
          |
       [====] MTCMOS Header Power Switch (HEADER_X32_UHVT)
          |   (Controlled by 4-stage daisy-chained sleep cascade)
          v
   Virtual VDD (VDD_VIRTUAL)
          |
          +---> [Switched Core Logic: CPU / GPU / DSP] (0.80V Active, 0.00V Deep Sleep)
\`\`\`

## Inrush Current Equation
When waking up a sleeping domain:

$$I_{\\text{inrush}} = C_{\\text{virtual}} \\cdot \\frac{dV}{dt}$$

If all switches turn ON simultaneously, $I_{\\text{inrush}}$ spikes to $10+\\text{A}$, causing severe voltage collapse on neighboring always-on rails.

CODE tcl
# 1. Synthesize 4-stage daisy-chained power switch cascade
create_power_switch_cascade -domain PD_CPU -stages 4 -delay_between_stages 15.0 -buffer_cell CLKBUF_X8
# 2. Analyze wake-up inrush current and always-on rail drop
set_inrush_analysis_mode -max_inrush_current 1.5 -max_aon_drop 0.030
analyze_inrush_current -domain PD_CPU -results_dir reports/inrush_signoff
ENDCODE
`
    ]
  ),

  theory(
    "cadence-power",
    "master",
    "voltus-decap-power-recovery",
    "Master: Decap Optimization, Power Recovery ECOs & Foundry Signoff Reports",
    25,
    "Decoupling capacitor placement, thick-oxide leakage balance, non-critical path power recovery, and final signoff package generation.",
    [
      `## Decap Optimization & Power Recovery ECOs

Decoupling capacitors (decaps) act as localized charge reservoirs, supplying peak switching current during clock transitions. However, thin-oxide decaps exhibit high gate tunneling leakage. Production flows use thick-oxide (thick-OD) low-leakage decaps balanced at $10\\%-15\\%$ density.

\`\`\`
   +-------------------------------------------------------------------------------+
   |                       Cadence Voltus Power Recovery ECO Flow                  |
   +-------------------------------------------------------------------------------+
          |
          v
   1. Ingest post-route signoff timing graph from Tempus (positive slack paths > +20ps)
          |
          v
   2. Identify non-critical overdriven standard cells (e.g. BUFX16 -> BUFX4)
          |
          v
   3. Downsize gates and swap LVT -> HVT cells without degrading WNS / TNS
          |
          v
   4. Recover 15% - 25% total dynamic and leakage power
          |
          v
   5. Generate foundry-certified signoff documentation & export voltage maps (.vdb)
\`\`\`

## Production Voltus Signoff & Power Recovery Script
CODE tcl
# 1. Post-Route Power Recovery ECO
set_db opt_power_recovery true
set_db opt_power_recovery_slack_margin 0.020
opt_design -post_route -power_recovery -expanded_views

# 2. Export Voltage Maps for Tempus Voltage-Aware STA
write_power_data -format voltage -out_file signoff/full_chip_power.vdb
report_power -hierarchy -by_category -out_file signoff/full_chip_power.rpt
report_rail_results -type dynamic_ir -out_file signoff/dynamic_ir_final.rpt
ENDCODE
`
    ]
  ),

  practical(
    "cadence-power",
    "master",
    "voltus-practical-lab",
    "Master Practical: Cadence Voltus Power Integrity & Crisis Studio",
    35,
    "Interactive troubleshooting studio covering 70 production power failure scenarios, static/dynamic rail analysis, EM signoff, and get_db query exploration.",
    [
      "Diagnose static IR drop bottlenecks and missing via stack connections.",
      "Mitigate dynamic L·di/dt simultaneous switching noise with localized decaps.",
      "Enforce Black's equation electromigration limits on power stripes and clock nets.",
      "Size MTCMOS power switches and daisy-chained cascades for inrush current control.",
      "Execute Common UI get_db database queries for power domains and rail violators.",
    ],
    {
      language: "tcl",
      starter: `# Cadence Voltus Full-Chip Power Integrity Signoff Script
# TODO: Step 1 - Ingest Power Grid Model Libraries (.pgv)
# TODO: Step 2 - Configure dynamic vector-based power analysis mode
# TODO: Step 3 - Read switching activity waveform (FSDB/VCD)
# TODO: Step 4 - Execute dynamic rail analysis and report worst IR drops
# TODO: Step 5 - Perform signal and power electromigration (EM) verification
`,
      checks: [
        { id: "pgv", label: "power_grid_library setup", kind: "includes", pattern: "power_grid_library" },
        { id: "pwr_mode", label: "set_power_analysis_mode", kind: "includes", pattern: "set_power_analysis_mode" },
        { id: "vcd", label: "read_activity_file", kind: "includes", pattern: "read_activity_file" },
        { id: "rail", label: "analyze_rail", kind: "includes", pattern: "analyze_rail" },
        { id: "em", label: "analyze_power_grid_em or analyze_signal_em", kind: "includes", pattern: "analyze_" },
      ],
      solution: `# Cadence Voltus Full-Chip Power Integrity Signoff Script
set_db power_grid_library { tech.pgv stdcells_asap7.pgv sram_512k.pgv }
set_power_analysis_mode -method dynamic_vectorbased -glitch_filter true
read_activity_file -format fsdb -start 100ns -end 300ns -activity_scope "tb/dut" ./sim/active_workload.fsdb
report_power -hierarchy -out_file reports/full_chip_power.rpt

set_rail_analysis_mode -method dynamic -accuracy hd -voltage_threshold 0.040
analyze_rail -type dynamic -results_dir reports/dynamic_rail_signoff
report_rail_results -type dynamic_ir -limit 50 -out_file reports/dynamic_ir_worst.rpt

set_rail_analysis_mode -temperature 125.0 -em_derate_with_temperature true
analyze_power_grid_em -results_dir reports/power_grid_em_signoff
analyze_signal_em -out_file reports/signal_em_signoff.rpt
write_power_data -format voltage -out_file signoff/voltus_voltage_map.vdb
`,
    }
  ),

  quiz("cadence-power", "master", "voltus-quiz", "Cadence Voltus Power & IR Drop — Master Exam", [
    { id: "vol_q1", prompt: "What is the primary physical cause of Static IR drop in an SoC power grid?", choices: ["Time-averaged DC current flowing through cumulative series resistance of metal power stripes and via stacks (Ohm's Law: V = I_avg · R_mesh)", "Radio frequency radiation from on-chip antennas", "Nuclear magnetic resonance in copper wires", "Thermal expansion of the silicon substrate"], answer: 0, explain: "Static IR drop is purely governed by Ohm's Law (V = I_avg · R_mesh), representing DC resistive voltage loss across the metal power grid." },
    { id: "vol_q2", prompt: "How does Dynamic IR drop differ from Static IR drop?", choices: ["Dynamic IR drop accounts for instantaneous peak current surges (L·di/dt + I_peak·R) caused by simultaneous clock-edge switching, while static measures time-averaged DC current", "Dynamic IR drop only affects unclocked asynchronous gates", "Static IR drop only occurs at 0 Kelvin", "Dynamic IR drop ignores metal wire resistance"], answer: 0, explain: "Dynamic IR drop captures localized L·(di/dt) inductive voltage drops and peak RC drops occurring simultaneously on active clock transitions." },
    { id: "vol_q3", prompt: "What is Black's Equation used for in Voltus electromigration (EM) signoff?", choices: ["Predicting conductor Mean Time to Failure (MTTF = A · J^-n · exp(Ea/kT)) based on current density and temperature", "Calculating total chip gate count", "Measuring SRAM read latency", "Generating clock tree buffer insertion delays"], answer: 0, explain: "Black's Equation models the physical rate of atomic transport in metal conductors under electrical current density and thermal stress." },
    { id: "vol_q4", prompt: "Why are thick upper metal layers (M7-M9) preferred for global power distribution over lower thin metals (M1-M3)?", choices: ["Upper thick metals have an order-of-magnitude lower sheet resistance (0.02-0.04 Ω/sq), minimizing global voltage drops and freeing lower metals for local signal routing", "Upper metals are transparent to optical microscopes", "Lower metals cannot conduct electricity", "Upper metals prevent cosmic ray interference"], answer: 0, explain: "Thick top metals have large cross-sectional area and ultra-low sheet resistance, making them ideal for carrying amperes of current across millimeters with minimal IR drop." },
    { id: "vol_q5", prompt: "What is a Power Grid View (PGV) in Cadence Voltus?", choices: ["A cell-level model containing internal parasitic resistances, capacitances, and non-linear current tap profiles necessary for accurate transistor-level rail analysis", "A JPEG screenshot of the floorplan", "An SDC constraint file for clock definitions", "A SPICE simulation waveform log"], answer: 0, explain: "PGVs provide the detailed power grid RC network and current distribution inside standard cells and IP macros to model IR drop accurately without full SPICE extraction." },
    { id: "vol_q6", prompt: "Why must inrush current (I_inrush = C_virtual · dV/dt) be strictly controlled during power-gated domain wake-up?", choices: ["To prevent a massive transient current surge from collapsing the always-on power supply (VDD_AON) and crashing active neighboring cores", "To heat up the silicon die faster", "To erase on-chip Flash memory", "To double the clock frequency"], answer: 0, explain: "An uncontrolled inrush current spike creates severe inductive supply collapse on neighboring active domains, corrupting running CPU and memory states." },
    { id: "vol_q7", prompt: "How do daisy-chained MTCMOS power switch cascades mitigate inrush current spikes?", choices: ["By staggering the turn-on sequence across multiple switch stages over tens of nanoseconds, charging the virtual power rail gradually with controlled dV/dt slew rate", "By shorting VDD directly to ground", "By converting all PMOS switches to resistors", "By turning off the external power supply"], answer: 0, explain: "Daisy-chained sleep cascades turn on power switches in successive stages (e.g. Stage 1 to 4), spreading charge transfer over time and dampening inrush current." },
    { id: "vol_q8", prompt: "What is the consequence of a missing Low-to-High level shifter on a cross-domain signal (0.65V to 0.95V)?", choices: ["The 0.65V high level cannot turn OFF the PMOS pull-up transistor in the 0.95V receiver gate, causing continuous crowbar short-circuit current from VDD to VSS", "The signal propagates at light speed", "The receiver gate turns into an inductor", "The clock tree stops oscillating"], answer: 0, explain: "A 0.65V signal into a 0.95V gate leaves the PMOS transistor partially ON, creating a direct low-resistance path between 0.95V and ground (crowbar current)." },
    { id: "vol_q9", prompt: "Why must isolation cells (ISO) clamp un-powered domain outputs to a defined logical state (0 or 1) during sleep mode?", choices: ["To prevent floating mid-rail inputs from entering active domains and causing massive crowbar leakage and meta-stable logic states", "To make output pins switch at 10 GHz", "To discharge battery power faster", "To satisfy I/O pad slew limits"], answer: 0, explain: "When a domain powers down, its outputs float (~0.4V); isolation cells clamp these nets to clean 0 or 1 levels to protect receiving active logic." },
    { id: "vol_q10", prompt: "Why should active-low control signals (e.g., rst_n, enable_n) be clamped to logical '1' instead of '0' in UPF isolation rules?", choices: ["Clamping active-low signals to '0' asserts the active reset/enable condition during sleep, causing post-wakeup lockup or unintended resets", "Clamping to '1' saves more metal routing", "Active-low signals cannot conduct zero volts", "UPF only allows clamping to '1'"], answer: 0, explain: "Clamping an active-low reset to '0' asserts reset during sleep mode, causing state machine lockup upon wake-up." },
    { id: "vol_q11", prompt: "Why are thick-oxide (thick-OD) decoupling capacitors preferred over thin-oxide decaps in advanced FinFET nodes?", choices: ["Thick-oxide decaps have negligible quantum gate oxide tunneling leakage, avoiding standby thermal runaway while providing necessary dynamic charge storage", "Thick-oxide decaps are made of pure gold", "Thin-oxide decaps cannot store electrical charge", "Thick-oxide decaps double chip operating frequency"], answer: 0, explain: "Thin-oxide decaps leak severely due to gate tunneling; thick-oxide decaps eliminate standby leakage while stabilizing dynamic IR drops." },
    { id: "vol_q12", prompt: "What is the primary limitation of vectorless power analysis compared to vector-driven (VCD/FSDB) analysis?", choices: ["Vectorless mode assumes uniform statistical toggle probabilities and fails to capture synchronized peak current bursts (e.g., crypto rounds or FFT transforms)", "Vectorless mode takes 100x longer to compute", "Vectorless mode cannot calculate static leakage", "Vectorless mode does not support Liberty files"], answer: 0, explain: "Vectorless mode relies on average probabilities, hiding localized cycle-accurate switching bursts that cause real dynamic IR drop failures." },
    { id: "vol_q13", prompt: "What causes the LC anti-resonance peak in a Power Distribution Network (PDN)?", choices: ["The parallel resonance between package lead inductance (L_pkg) and on-die decoupling capacitance (C_die), creating an impedance spike at f_res = 1 / (2π√(L·C))", "Electromagnetic interference from Wi-Fi routers", "Thermal heating of copper pins", "Chemical-Mechanical Polishing erosion"], answer: 0, explain: "Package inductance and on-die capacitance form an LC tank circuit; if switching current aligns with its resonant frequency, impedance spikes and causes severe supply ringing." },
    { id: "vol_q14", prompt: "What does the Blech short-length effect establish in electromigration reliability?", choices: ["Metal wire segments shorter than (J·L)_critical develop mechanical compressive back-stress that balances electron wind force, making short wires immune to EM voiding", "Short wires melt faster than long wires", "Wires under 20 µm carry infinite current", "Short wires have zero resistance"], answer: 0, explain: "The Blech effect dictates that short conductors under mechanical back-stress are physically immune to electromigration damage." },
    { id: "vol_q15", prompt: "Why must PMOS header switch N-wells always be tied to permanent un-gated VDD_PERM rather than the switched virtual rail?", choices: ["Tying N-wells to virtual VDD forward-biases the source-well p-n junction when the virtual rail drops, triggering destructive CMOS latch-up", "Virtual VDD has higher voltage than permanent VDD", "N-wells cannot be connected to PMOS transistors", "It saves one mask layer during fabrication"], answer: 0, explain: "N-wells must be biased at the highest potential (VDD_PERM) to prevent forward-biasing internal p-n junctions and firing parasitic SCR latch-up." },
    { id: "vol_q16", prompt: "How does post-route power recovery (opt_design -power_recovery) reduce dynamic and leakage power without degrading timing closure?", choices: ["By systematically downsizing standard cells on non-critical paths with positive timing slack (e.g., BUFX16 -> BUFX4) and swapping LVT to HVT cells", "By deleting all flip-flops in the design", "By reducing the supply voltage to 0V", "By replacing copper wires with aluminum"], answer: 0, explain: "Power recovery downsizes gates with positive slack margins, shedding dynamic switching and leakage power while preserving worst-case setup/hold timing." },
    { id: "vol_q17", prompt: "Why does subthreshold leakage power increase exponentially with junction temperature at high operating corners (125°C)?", choices: ["Thermal energy (kT/q) broadens the Fermi-Dirac electron distribution, lowering the effective potential barrier for subthreshold channel conduction (I_sub ∝ exp(-qVth/kT))", "Copper wire resistance becomes zero at 125°C", "Transistor gate oxides evaporate at 125°C", "FinFET fins bend under high temperature"], answer: 0, explain: "Subthreshold leakage is an exponential function of temperature; at 125°C, leakage can increase by 8x to 15x compared to room temperature." },
    { id: "vol_q18", prompt: "What is the primary advantage of Multi-Bit Flip-Flops (MBFFs) in low-power design?", choices: ["Merging 2 or 4 adjacent registers shares internal clock inverters and reduces total clock pin capacitance, cutting clock distribution dynamic power by up to 30%", "MBFFs eliminate the need for clock trees entirely", "MBFFs run on zero volts", "MBFFs store 64 bits per transistor"], answer: 0, explain: "MBFFs share internal clock buffering logic across multiple bit slices, shrinking clock pin capacitance and saving dynamic power." },
    { id: "vol_q19", prompt: "How does Voltus voltage-aware STA in Tempus improve timing closure accuracy?", choices: ["It annotates localized IR drop voltage maps (.vdb) directly into cell delay calculation, modeling realistic gate slowdowns and clock jitter caused by power grid droop", "It speeds up synthesis by 1,000x", "It disables all setup timing checks", "It guarantees zero power consumption"], answer: 0, explain: "Voltage-aware STA models the exact propagation delay degradation caused by localized supply droop along data and clock paths." },
    { id: "vol_q20", prompt: "What database command in Cadence Voltus Common UI extracts all configured power domains and their switchable MTCMOS gating statuses?", choices: ["get_db power_domains .name .voltage .primary_power_net.name .is_switchable", "report_domains -all_voltages", "find_power_nets -show_switches", "select_power_domains -verbose"], answer: 0, explain: "Voltus Common UI utilizes object-attribute querying: get_db power_domains .name .voltage .primary_power_net.name .is_switchable directly queries domain attributes." },
  ]),


  // ——— Subject 4: Cadence Static Timing Analysis (Tempus) ———
  theory(
    "cadence-sta",
    "master",
    "tempus-mmmc-parasitics",
    "Master: Tempus STA Architecture, MMMC Views & Parasitic Handling",
    25,
    "Massively parallel STA architecture, SPEF reading across corners, and update_timing graph generation.",
    [
      `## 1. Cadence Tempus Architecture & Massive Parallelism

Cadence Tempus is the industry-standard signoff Static Timing Analysis (STA) and Signal Integrity (SI) engine designed for advanced FinFET nodes (16nm down to 2nm). Tempus utilizes a distributed, massively parallel compute architecture capable of analyzing hundreds of Multi-Mode Multi-Corner (MMMC) views concurrently across server farms.

### Core Processing Pipeline:
\`\`\`
[Netlist/DEF] + [Liberty (.lib/LVF)] + [SPEF Parasitics]
                      │
                      ▼
             [init_design / MMMC]
                      │
                      ▼
         [update_timing -full (Graph)]
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[report_timing -late]      [report_timing -early]
   (Setup Max Delay)          (Hold Min Delay)
        │                           │
        └─────────────┬─────────────┘
                      ▼
    [opt_signoff / eco_opt (Closed-Loop ECO)]
\`\`\`

---

## 2. Multi-Mode Multi-Corner (MMMC) Ingestion

At advanced nodes, timing closure requires validating dozens of operational modes (e.g. High-Performance Functional, Low-Power DVFS, Scan Shift, Scan At-Speed Capture) across process-voltage-temperature (PVT) delay corners.

\`\`\`tcl
# 1. Initialize MMMC Configuration
read_netlist design_post_route.v.gz -top soc_top
read_view_definition mmmc_signoff_views.tcl
init_design

# 2. Ingest Quantus Golden SPEF Across RC Corners
read_spef -rc_corner rc_worst -view view_setup_ssgnp_0p72v_m40c ./spef/func_cworst.spef.gz
read_spef -rc_corner rc_best  -view view_hold_ffgnp_0p88v_125c  ./spef/func_cbest.spef.gz
read_spef -rc_corner rc_typical -view view_func_tt_0p80v_25c   ./spef/func_typical.spef.gz

# 3. Propagated Clock Mode Enforced
set_propagated_clock [all_clocks]
update_timing -full
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-sta",
    "master",
    "tempus-setup-hold-closure",
    "Master: Setup (Late) & Hold (Early) Timing Optimization & Path Breakdown",
    25,
    "Analyzing Data Arrival vs Required Time, critical slack breakdowns, clock skew impact, and Multi-Vth cell swapping.",
    [
      `## 1. Mathematical Physics of Setup & Hold Signoff

Static timing analysis breaks every sequential register-to-register path into launch clock, data path, and capture clock segments.

\`\`\`
Launch Edge                             Capture Edge
    │                                        │
    ▼                                        ▼
 [Reg A] ──( T_cq + T_comb + T_wire )──> [Reg B]
    ▲                                        ▲
    │                                        │
Launch Clock Tree (T_launch)       Capture Clock Tree (T_capture)
\`\`\`

### Setup (Max Delay / Late Path) Equation:
$$\\text{Arrival Time} = T_{\\text{launch}} + T_{\\text{cq}} + T_{\\text{comb}} + T_{\\text{wire}}$$
$$\\text{Required Time} = T_{\\text{period}} + T_{\\text{capture}} - T_{\\text{setup}} - T_{\\text{uncertainty}}$$
$$\\text{Slack}_{\\text{setup}} = \\text{Required Time} - \\text{Arrival Time} \\ge 0$$

### Hold (Min Delay / Early Path) Equation:
$$\\text{Arrival Time} = T_{\\text{launch}} + T_{\\text{cq}} + T_{\\text{comb,min}} + T_{\\text{wire,min}}$$
$$\\text{Required Time} = T_{\\text{capture}} + T_{\\text{hold}} + T_{\\text{uncertainty}}$$
$$\\text{Slack}_{\\text{hold}} = \\text{Arrival Time} - \\text{Required Time} \\ge 0$$

---

## 2. Common UI Database Inspection & Path Queries

\`\`\`tcl
# Report Worst 50 Setup (Late) Timing Violators
report_timing -late -max_paths 50 -slack_lesser_than 0.000 > reports/setup_violators.rpt

# Report Worst 50 Hold (Early) Timing Violators
report_timing -early -max_paths 50 -slack_lesser_than 0.000 > reports/hold_violators.rpt

# Query Database for Slack and Endpoints directly via get_db
set worst_setup_paths [get_db timing_paths -max_slack 0.0 -check_type setup]
foreach path $worst_setup_paths {
    puts "Failing Endpoint: [get_db $path .endpoint.name] | Slack: [get_db $path .slack] ps"
}
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-sta",
    "master",
    "tempus-si-crosstalk-glitch",
    "Master: Signal Integrity, Crosstalk Delta Delay & Noise Glitch Signoff",
    25,
    "Aggressor-victim capacitive coupling, Miller multiplier effects, crosstalk delta delay slowdown/speedup, and dynamic noise glitch verification.",
    [
      `## 1. Physics of Capacitive Cross-Coupling & Miller Effect

When adjacent metal wires run parallel for long distances, lateral capacitance ($C_c$) dominates over ground capacitance ($C_g$). Switching on aggressor nets injects displacement current into the victim net:

$$I_{\\text{inject}} = C_c \\cdot \\frac{d(V_{\\text{aggressor}} - V_{\\text{victim}})}{dt}$$

\`\`\`
Aggressor:  ───[ Driver ]───────────────────────────────>
                               ││ Cc (Coupling Cap)
Victim:     ───[ Driver ]──────┴────────────────────────> [ Receiver ]
                               │
                               ╀ Cg (Ground Cap)
\`\`\`

### Three Crosstalk Phenomena:
1. **Opposite-Direction Switching (Setup Slowdown)**: When victim rises and aggressor falls, $\\Delta V = 2 V_{DD}$ (Miller factor 2.0x), increasing effective capacitance ($C_{\\text{eff}} = C_g + 2C_c$) and adding up to 200 ps of **Delta Delay Slowdown**.
2. **Same-Direction Switching (Hold Speedup)**: When victim and aggressor switch simultaneously in the same direction, $\\Delta V = 0$, reducing effective capacitance ($C_{\\text{eff}} = C_g$) and accelerating arrival, creating severe **Hold Races**.
3. **Static Noise Glitch (Functional Hazard)**: When a quiet victim is held at logic 0 or 1, switching aggressors inject a voltage glitch. If the glitch peak exceeds receiver $V_{IL}$ or $V_{IH}$, illegal logic transitions or spurious resets occur.

---

## 2. Tempus SI Configuration & Signoff Commands

\`\`\`tcl
# 1. Enable Full-Coupled Signal Integrity Delay & Glitch Engine
set_db delaycal_enable_si true
set_db delaycal_si_mode signoff
set_db delaycal_si_glitch_analysis true

# 2. Enable Temporal Switching Window Awareness (Avoid false overlap penalties)
set_db si_delay_enable_timing_windows true
set_db si_glitch_enable_timing_windows true

# 3. Update Timing with Coupled Iterations
update_timing -full

# 4. Generate Signal Integrity Signoff Reports
report_noise -violators -out_file reports/crosstalk_noise_glitch.rpt
report_timing -late -net -si -max_paths 100 > reports/setup_crosstalk_si.rpt
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-sta",
    "master",
    "tempus-ocv-pocv-pba",
    "Master: AOCV, Statistical POCV (μ±3σ) & PBA Slew Pessimism Removal",
    25,
    "Stage-depth AOCV derating, Gaussian Parametric OCV (POCV) with Liberty Variation Format (LVF), and Path-Based Analysis (PBA) pessimism reduction.",
    [
      `## 1. Advanced On-Chip Variation (AOCV) vs Statistical POCV

At sub-16nm nodes, manufacturing process variations (random dopant fluctuation, line edge roughness, fin height variation) cannot be captured by uniform flat derates (e.g. 1.10 / 0.90) without massive over-pessimism.

### Comparison Matrix:
| Variation Methodology | Derating Mechanism | Statistical Realism | Signoff Standard |
|---|---|---|---|
| **Flat OCV** | Uniform ±10% margin applied to all gates | Highly Pessimistic (Assumes 100% correlated worst-case) | Legacy (>65nm) |
| **AOCV** | Derates scale with logic stage depth ($1/\\sqrt{N}$) and spatial bounding box | Moderate (Accounts for statistical averaging on deep paths) | 28nm / 16nm |
| **Statistical POCV** | Each gate delay is a Gaussian random variable ($\mu, \\sigma$); path variance $\\sigma_{\\text{path}} = \\sqrt{\\sum \\sigma_i^2}$ | True $3\\sigma$ ($99.87\\%$) physical yield modeling | 7nm / 5nm / 3nm |

---

## 2. Graph-Based Analysis (GBA) vs Path-Based Analysis (PBA)

- **Graph-Based Analysis (GBA)**: Propagates the worst-case (slowest) slew across all incoming inputs at multi-input logic gates. Extremely fast for full-chip timing, but introduces artificial slew-merging pessimism.
- **Path-Based Analysis (PBA)**: Re-propagates the exact, path-specific transition times along individual critical paths, eliminating GBA slew-merging pessimism and recovering 50–150 ps of negative slack.

\`\`\`tcl
# 1. Enable Statistical POCV with Liberty Variation Format (LVF)
set_db timing_pocv_enable true
set_db timing_pocv_sigma 3.0
set_db timing_pocv_spatial_correlation true
set_db timing_pocv_cppr_mode statistical

# 2. Run Path-Based Analysis (PBA) on Top Failing Paths
report_timing -pba_mode path -slack_lesser_than 0.050 -max_paths 5000 > reports/signoff_pba.rpt
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-sta",
    "master",
    "tempus-cdc-reset-signoff",
    "Master: Clock Domain Crossing, Asynchronous Resets & Recovery/Removal Checks",
    25,
    "Metastability resolution time (MTBF), 2-FF/3-FF synchronizers, Gray pointer skew constraints, and asynchronous reset recovery/removal checks.",
    [
      `## 1. Clock Domain Crossing (CDC) & Metastability

When an asynchronous signal transitions during the setup/hold aperture of a capturing flip-flop, the internal bistable latch enters **metastability**.

$$\\text{MTBF} = \\frac{\\exp(T_{\\text{res}} / \\tau)}{T_0 \\cdot f_{\\text{src}} \\cdot f_{\\text{dest}}}$$

- $T_{\\text{res}}$: Time available for metastability resolution (clock period minus wire delay).
- $\\tau$: Technology-dependent latch time constant (gain parameter).
- **Physical Design Rules**: Synchronizer flip-flops (\`DFF_METASYNC_X4\`) must be placed in abutted clusters ($< 10\\,\\mu\\text{m}$ distance) with zero combinational logic between stages.

---

## 2. Asynchronous Reset Recovery & Removal Timing Checks

\`\`\`
Reset Line (RN)   ──┐   Recovery Time (Setup)          Removal Time (Hold)
                    │  <─────────────────>           <──────────────>
                    └───┐                 ┌────────────────────────────
                        │                 │
Clock (CLK)       ──────┴─────────────────┼──────┐
                                          │      │
                                          ▼      ▼
                                       Active Clock Edge
\`\`\`

- **Recovery Check (Setup Equivalent)**: Reset must be released at least $T_{\\text{recovery}}$ *before* the active clock edge so the flip-flop can cleanly exit reset.
- **Removal Check (Hold Equivalent)**: Reset must remain deasserted for at least $T_{\\text{removal}}$ *after* the active clock edge to prevent multi-register state divergence across clock domains.

\`\`\`tcl
# 1. Constrain Gray Code CDC Pointer Bus
set_max_skew 0.050 -from [get_pins u_fifo/rptr_gray_reg[*]/CLK] -to [get_pins u_fifo/rptr_sync_reg[*]/D]

# 2. Verify Reset Recovery and Removal Checks
report_timing -check_type recovery -to [get_pins *_reg*/RN] -max_paths 50
report_timing -check_type removal  -to [get_pins *_reg*/RN] -max_paths 50
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-sta",
    "master",
    "tempus-eco-timing-closure",
    "Master: Automated Multi-Corner Timing ECO Flow & Signoff Reports",
    25,
    "Closed-loop Tempus-Innovus ECO optimization, size-only in-place swaps, leakage recovery, metal-only spare cells, and golden signoff packages.",
    [
      `## 1. Automated Closed-Loop Timing ECO Architecture

The Tempus-Innovus closed-loop ECO engine analyzes multi-corner setup, hold, and design rule violations (DRVs) and generates surgical, layout-safe engineering change order (ECO) scripts.

\`\`\`
[Tempus Signoff STA] ──> [opt_signoff / eco_opt] ──> [write_eco_opt_db]
                                                            │
                                                            ▼ (Golden Tcl Patch)
[Innovus Physical PnR] <── [eco_change_cell / eco_route] <──┘
\`\`\`

### Signoff ECO Optimization Modes:
1. **Size-Only In-Place Swaps**: Upgrades/downgrades gate drive strengths on matching standard cell footprints (zero placement displacement, zero re-routing).
2. **Hold Buffer Cushioning**: Inserts delay cells (\`DLY_X2\`) on legal whitespace sites with setup margin protection (\`eco_opt_hold_setup_slack_margin 0.040\`).
3. **Multi-Vth Leakage Recovery**: Swaps non-critical gates with positive slack from LVT to HVT, saving 30–40% leakage power.
4. **Metal-Only Spare Cell ECO**: Rewires pre-placed uncommitted spare cells using only metal layers, fixing post-mask silicon bugs without base layer (FEOL) re-spin costs.

---

## 2. Complete Production ECO Signoff Script

\`\`\`tcl
# 1. Configure Closed-Loop Signoff ECO Targets
set_db opt_signoff_setup_target_slack 0.020
set_db opt_signoff_hold_target_slack  0.015
set_db eco_opt_hold_setup_slack_margin 0.035

# 2. Run Multi-Corner Setup, Hold, and DRC Fixes
opt_signoff -drv
opt_signoff -setup
opt_signoff -hold

# 3. Recover Leakage Power on Positive Slack Paths
opt_leakage_power -post_route -eco -expanded_views

# 4. Export Golden ECO Layout Package
write_eco_opt_db -dir ./signoff_eco_patch_r1 -format {tcl text}
report_signoff -dir ./reports/signoff_executive_summary
\`\`\`
`,
    ]
  ),

  practical(
    "cadence-sta",
    "master",
    "tempus-practical-lab",
    "Master Practical: Tempus Signoff STA & opt_signoff Timing ECOs",
    25,
    "Write a Tempus signoff STA script enabling crosstalk SI delay calculation, updating full timing, generating late/early timing reports, and executing opt_signoff.",
    [
      "Enable SI delay calculation with set_db delaycal_enable_si true.",
      "Execute update_timing -full.",
      "Generate late (setup) and early (hold) timing reports.",
      "Execute opt_signoff for setup and hold timing closure.",
    ],
    {
      language: "tcl",
      starter: `# Tempus Signoff STA Script
# TODO: delaycal_enable_si, update_timing, report_timing -late/-early, opt_signoff
`,
      checks: [
        { id: "si", label: "delaycal_enable_si", kind: "includes", pattern: "delaycal_enable_si" },
        { id: "ut", label: "update_timing", kind: "includes", pattern: "update_timing" },
        { id: "late", label: "report_timing -late", kind: "regex", pattern: "report_timing[\\s\\S]*-late" },
        { id: "early", label: "report_timing -early", kind: "regex", pattern: "report_timing[\\s\\S]*-early" },
        { id: "eco", label: "opt_signoff", kind: "includes", pattern: "opt_signoff" },
      ],
      solution: `set_db delaycal_enable_si true
update_timing -full
report_timing -late  -max_paths 50 > reports/setup_late.rpt
report_timing -early -max_paths 50 > reports/hold_early.rpt
set_db opt_signoff_eco_file_prefix SIGNOFF_ECO
opt_signoff -setup
opt_signoff -hold
`,
    }
  ),

  quiz("cadence-sta", "master", "tempus-quiz", "Cadence Tempus STA & SI — Master Exam", [
    { id: "sta_q1", prompt: "What is the naming convention for Setup and Hold path queries in Cadence Tempus?", choices: ["-late for Setup (worst-case late arrival) and -early for Hold (fastest early arrival)", "-max for Setup and -min for Hold", "-setup and -hold only", "-pass and -fail"], answer: 0, explain: "Cadence Common UI timing tools use -late for Setup (late arrival checks) and -early for Hold (early arrival checks)." },
    { id: "sta_q2", prompt: "What does Path-Based Analysis (PBA) do to reduce Graph-Based Analysis (GBA) pessimism?", choices: ["It re-propagates exact path-specific transition times along individual critical paths rather than using worst-case merged slews", "It deletes all failing flip-flops from the netlist", "It increases clock frequency automatically", "It sets clock jitter to zero"], answer: 0, explain: "GBA bounds slews with the worst-case among all incoming paths; PBA propagates exact slews for the specific evaluated path, recovering artificial slack pessimism." },
    { id: "sta_q3", prompt: "How does opposite-direction switching on an adjacent parallel wire affect victim setup timing?", choices: ["It creates an effective Miller coupling factor of 2.0x (dV/dt = 2·VDD), injecting displacement current and causing severe Delta Delay Slowdown", "It speeds up the victim by 50%", "It eliminates wire resistance", "It turns the victim wire into a superconducting coil"], answer: 0, explain: "Opposite switching doubles the voltage delta across the coupling capacitor, injecting charge that slows down the victim transition." },
    { id: "sta_q4", prompt: "Why is hold time independent of clock period (T_period)?", choices: ["Hold checks ensure data launched on the current clock edge does not overwrite capture data before its hold time expires on the SAME cycle edge; T_period is not in the equation", "Hold checks only run when the clock is turned off", "Hold time is an imaginary number", "Hold checks are disabled in modern EDA tools"], answer: 0, explain: "Hold timing checks fast-path data racing against the same clock edge: T_launch + T_cq + T_comb >= T_capture + T_hold + T_uncertainty." },
    { id: "sta_q5", prompt: "What is the primary benefit of Statistical Parametric On-Chip Variation (POCV) over flat OCV derating?", choices: ["It models stage delay variations as independent Gaussian random variables (μ, σ) and adds them root-sum-square (RSS), removing massive flat OCV over-pessimism on deep paths", "It doubles total chip power dissipation", "It eliminates the need for Liberty timing models", "It guarantees 0 ps clock skew everywhere"], answer: 0, explain: "Statistical POCV computes exact root-sum-square variance across independent stages, modeling true 3-sigma (99.87%) silicon bounds without artificial over-derating." },
    { id: "sta_q6", prompt: "Why does Inverted Temperature Dependence (ITD) make -40°C the critical setup corner at near-threshold voltages (0.65V)?", choices: ["At low VDD, carrier mobility gains at -40°C are overwhelmed by the increase in threshold voltage (Vth), causing transistors to switch slower at cold temperatures", "At -40°C copper wires freeze and stop conducting electricity", "Standard cell libraries melt at -40°C", "Transistors only operate above 100°C"], answer: 0, explain: "At low voltages near threshold, the increase in Vth at low temperature dominates over mobility gains, making -40°C slower than 125°C." },
    { id: "sta_q7", prompt: "What is the purpose of Common Path Pessimism Removal (CPPR)?", choices: ["To eliminate fictitious clock skew caused by applying different early and late OCV deratings to the shared physical clock tree path", "To remove all clock buffers from the netlist", "To replace clock trees with wireless transmission", "To make setup and hold slacks equal"], answer: 0, explain: "A physical buffer on a shared clock path cannot be simultaneously early and late; CPPR credits back this mathematical OCV penalty." },
    { id: "sta_q8", prompt: "What is the consequence of missing 'set_multicycle_path (N-1) -hold' when declaring an N-cycle setup path?", choices: ["Tempus places the hold check at Edge (N-1), checking hold against multi-cycle old data and reporting massive false hold violations (~1.5 ns)", "The chip immediately explodes in simulation", "Tempus converts all flip-flops to latches", "The clock period is multiplied by N"], answer: 0, explain: "SDC requires 'set_multicycle_path (N-1) -hold' to realign the hold check back to the launch clock edge (Edge 0)." },
    { id: "sta_q9", prompt: "Why must 'set_clock_groups -asynchronous' be declared between unrelated clock domains?", choices: ["To prevent STA from performing meaningless sub-picosecond synchronous timing checks across asynchronous clocks that drift arbitrarily in phase", "To force all clocks to run at 10 GHz", "To delete the clock trees during synthesis", "To connect all clock pins directly to VDD"], answer: 0, explain: "Asynchronous clocks have no fixed phase relationship; declaring them asynchronous stops false cross-clock timing checks." },
    { id: "sta_q10", prompt: "What is Recovery Time in asynchronous reset timing analysis?", choices: ["The minimum time the asynchronous reset signal must remain deasserted before the next active clock edge to prevent flip-flop metastability", "The time required to reboot the server", "The duration of power domain sleep mode", "The delay of an external voltage regulator"], answer: 0, explain: "Recovery timing is the setup-equivalent check on asynchronous reset deassertion, ensuring internal latches exit reset before clocking." },
    { id: "sta_q11", prompt: "What is Removal Time in asynchronous reset timing analysis?", choices: ["The minimum time the asynchronous reset signal must remain asserted/stable after the active clock edge to ensure all registers exit reset on the same cycle", "The time taken to remove a chip from its package", "The delay of an input pad buffer", "The time needed to delete a timing constraint"], answer: 0, explain: "Removal timing is the hold-equivalent check on reset release, preventing race conditions where registers exit reset on different cycles." },
    { id: "sta_q12", prompt: "How does Mean Time Between Failures (MTBF) scale in a 2-FF synchronizer?", choices: ["Exponentially with available metastability resolution time (T_res = T_period - T_wire - T_setup) and latch gain (1/τ)", "Linearly with wire length", "Inversely with supply voltage squared", "Randomly without mathematical basis"], answer: 0, explain: "Metastability decay is exponential: MTBF = exp(T_res / τ) / (T0 · f_src · f_dest); increasing resolution time yields exponential MTBF gains." },
    { id: "sta_q13", prompt: "Why must Gray-code pointer buses across asynchronous FIFOs be constrained with max_skew?", choices: ["To ensure physical wire routing skew between bits is smaller than the capture clock period, preserving the 1-bit-change-per-cycle property", "To make the FIFO store infinite data", "To double the FIFO read bandwidth", "To convert Gray code into ASCII characters"], answer: 0, explain: "If inter-bit skew exceeds the capture period, multiple bits change simultaneously from the receiver's perspective, causing FIFO depth corruption." },
    { id: "sta_q14", prompt: "What is a Size-Only in-place ECO in Tempus?", choices: ["Swapping standard cell drive strengths or Vt types on exact matching footprints without moving cells or ripping up wires", "Re-synthesizing the entire design from Verilog", "Replacing copper wires with optical fibers", "Changing the silicon die dimensions"], answer: 0, explain: "Size-only ECO replaces standard cells with footprint-matched equivalents in-place, fixing timing with zero placement disruption." },
    { id: "sta_q15", prompt: "How does switching window awareness reduce crosstalk pessimism in Tempus SI?", choices: ["It only applies delta delay and glitch penalties if the aggressor's switching time window physically overlaps with the victim's switching window", "It assumes all signals switch simultaneously at 0.0 ps", "It disables all crosstalk analysis on data buses", "It increases receiver noise margins to 1.0V"], answer: 0, explain: "Signals that switch at non-overlapping times cannot couple dynamically; timing window analysis removes false crosstalk penalties." },
    { id: "sta_q16", prompt: "Why are Metal-Only spare cell ECOs used for post-mask silicon bug fixes?", choices: ["Because base layers (FEOL/transistors) are already fabricated; rewiring pre-placed uncommitted spare cells using only metal masks saves millions in mask costs", "Because metal layers are free of charge", "Because spare cells run 10x faster than standard cells", "Because base masks never contain design errors"], answer: 0, explain: "Metal-only ECOs modify only upper metal masks (BEOL) to rewire spare gates, avoiding full FEOL wafer fabrication re-spins." },
    { id: "sta_q17", prompt: "What does 'set_propagated_clock [all_clocks]' do in Tempus STA?", choices: ["It instructs the timing engine to compute real clock insertion delays and clock skew from extracted clock tree parasitics rather than ideal latency", "It turns all clocks into radio transmitters", "It disables clock tree synthesis", "It sets clock frequency to 1 MHz"], answer: 0, explain: "Propagated clock mode replaces ideal clock assumptions with real post-CTS wire and buffer propagation delays." },
    { id: "sta_q18", prompt: "What is the primary danger of a dynamic crosstalk noise glitch on an asynchronous reset line?", choices: ["If the glitch peak exceeds receiver V_IL and has sufficient pulse width, it triggers a false asynchronous reset and crashes the chip", "It increases dynamic power by 1%", "It changes the package lead inductance", "It turns off the external power supply"], answer: 0, explain: "Asynchronous reset pins are level-sensitive; a crosstalk glitch crossing threshold immediately resets registers, crashing running execution." },
    { id: "sta_q19", prompt: "Why must static software configuration registers be declared with 'set_false_path'?", choices: ["They are programmed once during boot and held stable during execution; declaring them false paths stops the optimizer from wasting area on unnecessary buffers", "They do not conduct electrical current", "They run on a 0 Hz clock", "They are implemented outside the silicon chip"], answer: 0, explain: "Static CSRs do not toggle dynamically during execution; false path constraints prevent tool optimizer cell bloating." },
    { id: "sta_q20", prompt: "What database command in Cadence Tempus Common UI returns all timing paths with negative slack under 3-sigma POCV?", choices: ["get_db [get_db timing_paths -max_slack 0.0].endpoint.name", "report_all_paths -show_failing", "find_violators -slack_below_zero", "select_paths -negative_slack"], answer: 0, explain: "Tempus Common UI uses object-attribute querying: get_db [get_db timing_paths -max_slack 0.0].endpoint.name retrieves failing endpoint names directly." },
  ]),


  // ——— Subject 5: Cadence Logic Equivalence Checking (Conformal LEC) ———
  theory(
    "cadence-lec",
    "master",
    "conformal-setup-mapping",
    "Master: Conformal LEC Architecture, Setup Mode & fv_map Ingestion",
    25,
    "System setup mode, library loading, reading Golden (RTL) vs Revised (Gate Netlist), and Genus fv_map implementation guidance.",
    [
      `## 1. Cadence Conformal LEC Architecture

Cadence Conformal Logic Equivalence Checker (LEC) mathematically proves that two circuit representations (Golden RTL vs Revised Netlist, or Post-Synthesis Netlist vs Post-Route Netlist) are functionally identical across all possible $2^N$ input combinations without requiring dynamic simulation test vectors.

### Formal Verification Pipeline:
\`\`\`
[set_system_mode setup]
         │
         ▼
[read_library -both] + [read_design -golden] + [read_design -revised]
         │
         ▼
[elaborate_design -both] + [add_pin_constraints]
         │
         ▼
[set_system_mode lec]
         │
         ▼
[map_key_points] ──> [add_compared_points -all] ──> [compare]
                                                        │
                                                        ▼
                                       [EQUIVALENT / DIAGNOSE ECO]
\`\`\`

---

## 2. Setup Mode & Implementation Guidance

\`\`\`tcl
# 1. Initialize Setup Mode & Load Standard Cell Models
set_system_mode setup
read_library -both -statetable -liberty { /pdk/sky130/stdcells.lib /pdk/sky130/macros.lib }

# 2. Ingest Golden RTL & Revised Gate Netlist
read_design -golden -sv -f ./filelist_golden.f
elaborate_design -golden -root soc_top

read_design -revised -verilog ./netlist/soc_post_route.v.gz
elaborate_design -revised -root soc_top

# 3. Read Synthesis Implementation Guidance from Genus
read_implementation_information genus/fv/soc_top -golden fv_map -revised soc_top_netlist
set_flatten_model -seq_constant -gated_clock

# 4. Constrain Test Mode Pins to Functional Mode
add_pin_constraints 0 scan_enable -both
add_pin_constraints 0 test_mode_i -both
add_pin_constraints 1 scan_rst_n -both
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-lec",
    "master",
    "conformal-keypoint-unmapped",
    "Master: Key Point Mapping Heuristics, Unmapped Points & MBFF Resolution",
    25,
    "Topological key point signatures, phase-inverted registers, state machine re-encoding, and Multi-Bit Flip-Flop (MBFF) slice decomposition.",
    [
      `## 1. Key Point Classification & Comparison Cones

Conformal divides every digital design into independent combinational logic cones bounded by **Key Points**:
1. **Primary Inputs (PI)** & **Primary Outputs (PO)**
2. **Sequential Elements**: D Flip-Flops (DFF), Latches (DLAT)
3. **Blackbox Boundary Pins (BBOX)**: Hard analog macros, PLLs, ADCs, PHYs

\`\`\`
Key Point (DFF A) ───[ Combinational Logic Cone ]───> Key Point (DFF B)
Golden: F(A1..An)  ─────────────────────────────────┐
                                                    ├──[ XOR Comparator ] ──> 0 (EQUIV)
Revised: G(B1..Bn) ─────────────────────────────────┘
\`\`\`

---

## 2. Advanced Mapping Heuristics

\`\`\`tcl
set_system_mode lec

# 1. Automatic Key Point Mapping with Phase Inversion & MBFF Decomposition
set_mapping_method -invert -sensitive
set_naming_rule -mbff "%s_mbff%d_reg[%d]" -revised
map_key_points

# 2. Inspect Mapping Quality
report_key_points -summary
report_unmapped_points -summary

# 3. Add All Mapped Compare Points to Proof Engine
add_compared_points -all
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-lec",
    "master",
    "conformal-datapath-arithmetic",
    "Master: Complex Datapath, Carry-Save Trees & BDD/SAT Solvers",
    25,
    "Word-level algebraic rewriting, Booth-Wallace multiplier verification, CSA tree restructuring, and SAT-based non-linear division solvers.",
    [
      `## 1. Arithmetic Transformation Complexity

Standard Binary Decision Diagrams (BDD) suffer from exponential memory explosion ($O(2^N)$) when verifying non-linear datapath operators such as 64-bit Booth-Wallace multipliers and SRT dividers.

### Conformal Solver Portfolio:
| Solver Engine | Target Logic Type | Mathematical Mechanism | Verification Speed |
|---|---|---|---|
| **BDD Solver** | General Control Logic & FSMs | Canonical Directed Acyclic Graphs | Milliseconds |
| **SAT Solver** | Deep Combinational Cones | Boolean Satisfiability (DPLL / CDCL) | Seconds |
| **Arithmetic Solver** | Adders, Multipliers, CSA Trees | Word-Level Polynomial Rewriting ($GF(2^k)$) | Seconds |
| **Linear XOR Solver** | CRC-32, LFSR, Cryptographic Ciphers | Gaussian Elimination over GF(2) | Sub-Second |

---

## 2. Datapath Solver Configuration

\`\`\`tcl
# 1. Enable Advanced Word-Level Datapath & Multiplier Engines
set_analyze_option -auto -datapath -word_level -linear

# 2. Configure Parallel Multi-Threaded Compare
set_compare_options -threads 8 -solver sat -timeout 300
compare

# 3. Report Verification Summary
report_verification -summary
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-lec",
    "master",
    "conformal-low-power-upf",
    "Master: Low-Power UPF Verification, Isolation & Retention (SRPG) Proofs",
    25,
    "UPF power intent formal proof, level shifter crowbar prevention, isolation clamp polarity (0/1), and retention shadow latch validation.",
    [
      `## 1. Low-Power UPF & IEEE 1801 Formal Modeling

When chips incorporate multi-voltage domains and power gating, the gate-level netlist contains specialized low-power primitives that must match UPF intent:
1. **Level Shifters (L2H)**: Verify that 0.65V signals crossing to 0.95V pass through level shifters to eliminate PMOS crowbar leakage.
2. **Isolation Cells (ISO)**: Verify that unpowered domain outputs clamp to defined clean states (1 for active-low resets, 0 for active-high enables) to prevent floating mid-rail receiver states.
3. **State Retention Registers (SRPG)**: Verify shadow latch connectivity to save/restore control pins and permanent VDD_AON power rails.

\`\`\`
Low-Voltage (0.65V)       Isolation Barrier          High-Voltage (0.95V)
[ Logic Cone ] ──> [ ISO_OR Cell (Clamp 1) ] ──> [ Level Shifter L2H ] ──> [ Receiver ]
                           ▲
                           │ (iso_en)
\`\`\`

---

## 2. Formal UPF Verification Commands

\`\`\`tcl
# 1. Load UPF Power Intent for Both Designs
read_power_intent -both ./upf/soc_power.upf
set_power_state -both

# 2. Run Comprehensive Formal Power Intent Audits
verify_power_intent -level_shifter -isolation -retention -always_on -power_switch
set_system_mode lec
compare
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-lec",
    "master",
    "conformal-scan-dft-bypass",
    "Master: Scan Chain Reordering Invariance & DFT Logic Mode Clamping",
    25,
    "Scan chain insertion formal bypass, pin constraints for scan_enable/test_mode, scan compression decompressor bypass, and MBIST collar isolation.",
    [
      `## 1. Physical Scan Reordering vs Functional Invariance

During physical P&R, Innovus reorders flip-flops across scan chains to minimize wire length and congestion. If \`scan_enable\` is floating or unconstrained, Conformal attempts to compare test-shift connections, reporting thousands of false non-equivalent points.

\`\`\`
Mission (Functional) Mode: scan_enable = 0
Data Port (D) ───────────────────────────> [ DFF ] ──> Output (Q)

Test Shift Mode: scan_enable = 1 (Bypassed in Functional LEC)
Scan In (SI)  ───────────────────────────> [ DFF ] ──> Scan Out (SO)
\`\`\`

---

## 2. Production Pin Clamping Commands

\`\`\`tcl
# 1. Constrain All Test Control Pins to Mission (Functional) Mode
add_pin_constraints 0 scan_enable -both
add_pin_constraints 0 test_mode_i -both
add_pin_constraints 0 edt_mode -both
add_pin_constraints 0 mbist_en -both
add_pin_constraints 0 lbist_en -both

# 2. Constrain JTAG TAP Controller to Test-Logic-Reset State
add_pin_constraints 0 trst_n -both
add_pin_constraints 1 tms -both

# 3. Compare Functional Logic
set_system_mode lec
compare
\`\`\`
`,
    ]
  ),

  theory(
    "cadence-lec",
    "master",
    "conformal-debug-functional-eco",
    "Master: Counter-Example Diagnosis, Root Cause & Automated Functional ECOs",
    25,
    "Diagnosing failing compare points, counter-example vector analysis, error cone isolation, and generating automated surgical ECO patches for Innovus.",
    [
      `## 1. Counter-Example Vector Diagnosis & Error Cones

When a compare point evaluates as **NON-EQUIVALENT**, Conformal generates a counter-example input stimulus that demonstrates boolean divergence.

\`\`\`
[Golden Cone]  ──> F({A=1, B=0, C=1}) = 1  ──┐
                                             ├──> Boolean Mismatch (Diff = 1)
[Revised Cone] ──> G({A=1, B=0, C=1}) = 0  ──┘
\`\`\`

### Automated Functional ECO Flow:
1. **Diagnosis**: \`diagnose -point <instance>\` traces fanin cones to isolate the exact gate where logic polarity or connection fails.
2. **Boolean Synthesis**: Conformal computes the minimal boolean difference patch.
3. **Patch Generation**: \`write_eco_script\` outputs footprint-matched in-place cell swaps or spare cell patches for Innovus.

---

## 2. Complete Production Functional ECO Script

\`\`\`tcl
# 1. Diagnose Non-Equivalent Failing Point
diagnose -point u_ctrl/fsm_next_state[2] -view

# 2. Read Pre-Placed Spare Cell List for Post-Mask ECO
read_spare_cells ./pnr/spare_cell_list.txt
map_spare_cells -eco_dir ./metal_eco_patch

# 3. Export Automated Golden ECO Patch for Innovus
write_eco_script -replace -eco_dir ./eco_patch_r1 -format innovus
report_compare_data -class {non_equivalent unmapped} -out_file reports/lec_signoff_audit.rpt
\`\`\`
`,
    ]
  ),

  practical(
    "cadence-lec",
    "master",
    "conformal-practical-lab",
    "Master Practical: Conformal LEC Setup, Mapping & Non-Equivalence Debug",
    25,
    "Construct a Conformal LEC verification dofile switching between setup and lec modes, loading golden/revised designs, adding compare points, and running compare.",
    [
      "Set system mode to setup.",
      "Read golden and revised designs.",
      "Switch system mode to lec.",
      "Add all compare points and execute compare.",
    ],
    {
      language: "tcl",
      starter: `# Conformal LEC Dofile
# TODO: setup mode, read golden/revised, lec mode, add_compared_points, compare
`,
      checks: [
        { id: "setup", label: "setup mode", kind: "includes", pattern: "set_system_mode setup" },
        { id: "gold", label: "read_design golden", kind: "regex", pattern: "read_design[\\s\\S]*-golden" },
        { id: "rev", label: "read_design revised", kind: "regex", pattern: "read_design[\\s\\S]*-revised" },
        { id: "lec", label: "lec mode", kind: "includes", pattern: "set_system_mode lec" },
        { id: "add", label: "add_compared_points", kind: "includes", pattern: "add_compared_points" },
        { id: "cmp", label: "compare", kind: "includes", pattern: "compare" },
      ],
      solution: `set_system_mode setup
read_library -both -statetable -liberty /pdk/sky130/stdcells.lib
read_design -golden -sv -f ./filelist_golden.f
elaborate_design -golden -root soc_top
read_design -revised -verilog ./netlist/soc_post_route.v
elaborate_design -revised -root soc_top
add_pin_constraints 0 scan_enable -both
add_pin_constraints 0 test_mode -both
set_system_mode lec
map_key_points
add_compared_points -all
compare
report_verification -summary
`,
    }
  ),

  quiz("cadence-lec", "master", "conformal-quiz", "Cadence Conformal LEC — Master Exam", [
    { id: "lec_q1", prompt: "What are the primary Key Points classified by Cadence Conformal LEC?", choices: ["Primary Inputs (PI), Primary Outputs (PO), Sequential Elements (DFF/DLAT), and Blackbox boundary pins", "Only clock pins and reset pins", "Copper metal wires and via stacks", "Power stripes and ground rings"], answer: 0, explain: "Conformal breaks circuits into combinational logic cones bounded by PIs, POs, flip-flops, latches, and blackbox boundary pins." },
    { id: "lec_q2", prompt: "Why must 'scan_enable' be constrained to 0 (add_pin_constraints 0 scan_enable -both) during functional LEC?", choices: ["To isolate scan shift data paths and ensure Conformal evaluates pure functional datapath equivalence without false shift failures", "To delete the scan chains permanently", "To increase clock frequency", "To convert flip-flops into latches"], answer: 0, explain: "Scan chains are reordered during physical PnR; tying scan_enable to 0 evaluates the design in mission mode without test shift noise." },
    { id: "lec_q3", prompt: "What does 'set_mapping_method -invert' do in Conformal LEC?", choices: ["It enables automatic recognition and mapping of phase-inverted registers where synthesis flipped reset polarity and inverted output cones", "It inverts the primary power supply voltage", "It reverses the direction of all primary inputs", "It switches the clock from 1 GHz to -1 GHz"], answer: 0, explain: "Synthesis often inverts register polarity to save area; -invert maps registers whose phase and output cones were inverted." },
    { id: "lec_q4", prompt: "How does Conformal LEC handle Multi-Bit Flip-Flops (MBFFs)?", choices: ["It decomposes 2-bit or 4-bit merged MBFF cell pins into individual 1-bit Golden register compare points using naming rule heuristics", "It treats MBFFs as undefined blackboxes", "It fails equivalence immediately", "It replaces MBFFs with combinational AND gates"], answer: 0, explain: "MBFF mapping decomposes multi-bit register pins into discrete bit-slice compare points to match 1-bit Golden RTL registers." },
    { id: "lec_q5", prompt: "Why do 64-bit Booth multipliers cause standard BDD solvers to time out or run out of memory?", choices: ["The Binary Decision Diagram (BDD) representation of non-linear multiplication grows exponentially O(2^N) with bit-width", "Multipliers do not follow boolean algebra", "Liberty files cannot model arithmetic gates", "SPICE simulators cannot model multipliers"], answer: 0, explain: "Multipliers have exponential BDD graph complexity; Conformal uses word-level arithmetic and polynomial rewriting solvers instead." },
    { id: "lec_q6", prompt: "What is the purpose of reading the synthesis 'fv_map' record in Conformal?", choices: ["To guide Conformal through complex sequential transformations such as FSM re-encoding, register retiming, and multibit merging", "To generate GDSII layout masks", "To calculate dynamic IR drop", "To simulate analog PLL jitter"], answer: 0, explain: "The formal verification map (fv_map) logs non-trivial structural transformations made during logic synthesis." },
    { id: "lec_q7", prompt: "What is a Counter-Example Vector in Conformal non-equivalent debug?", choices: ["A specific binary input stimulus pattern that proves Golden and Revised logic cones evaluate to different boolean outputs", "A SPICE voltage waveform file", "A list of syntax errors in Verilog", "A physical DRC design rule violation"], answer: 0, explain: "A counter-example provides the exact input values (e.g. A=1, B=0) where Golden and Revised logic cones diverge." },
    { id: "lec_q8", prompt: "Why must low-to-high voltage crossings (0.65V to 0.95V) contain verified level shifter cells in UPF verification?", choices: ["To prevent a 0.65V high level from leaving the PMOS pull-up transistor partially ON in 0.95V gates, which causes continuous crowbar short-circuit current", "To double the operating clock frequency", "To convert digital bits into analog voltages", "To invert clock edge polarity"], answer: 0, explain: "0.65V is insufficient to turn off 0.95V PMOS gates, creating severe crowbar static leakage without low-to-high level shifters." },
    { id: "lec_q9", prompt: "Why should active-low control signals (rst_n) be clamped to 1 in UPF isolation rules?", choices: ["Clamping to 0 asserts active reset during sleep mode, causing state machine lockup or unintended resets upon domain wake-up", "Clamping to 1 saves more metal routing", "Active-low signals cannot conduct zero volts", "UPF only allows clamping to 1"], answer: 0, explain: "Clamping an active-low reset to 0 asserts reset during sleep, causing functional deadlock when the domain wakes up." },
    { id: "lec_q10", prompt: "What is the primary advantage of automated functional ECO generation ('write_eco_script') over full re-synthesis?", choices: ["It generates minimal surgical netlist patches using existing whitespace or spare cells, preserving post-route timing closure and avoiding full PnR re-runs", "It reduces clock period to 0 ps", "It eliminates the need for physical design tools", "It converts the netlist to C++ code"], answer: 0, explain: "write_eco_script creates localized, DRC-clean gate changes without disrupting closed physical placement and routing." },
    { id: "lec_q11", prompt: "What is the difference between pre-mask and post-mask functional ECOs?", choices: ["Pre-mask ECOs can instantiate new standard cells before base wafers are made; post-mask ECOs must use ONLY pre-placed spare gates to restrict changes to metal masks", "Pre-mask ECOs are free of charge", "Post-mask ECOs require re-fabricating the entire silicon wafer", "There is no difference"], answer: 0, explain: "Post-mask ECOs rewire uncommitted spare cells using metal-only masks, saving millions in base FEOL wafer re-spin costs." },
    { id: "lec_q12", prompt: "How does Conformal LEC handle Integrated Clock Gating (ICG) cells?", choices: ["'set_flatten_model -gated_clock' proves that gating the clock with an active-low latch matches holding register state via recirculating multiplexers", "It deletes all ICG cells from the netlist", "It converts clock gating into software sleep commands", "It forces clock gating to be permanently enabled"], answer: 0, explain: "Clock gating formal modeling proves that disabling the clock via ICG latches is mathematically identical to RTL recirculating multiplexer feedback." },
    { id: "lec_q13", prompt: "What does 'set_blackbox <module> -both' do in Conformal setup mode?", choices: ["It treats the specified module boundary as a blackbox in both Golden and Revised netlists, verifying connections to its boundary pins without descending inside", "It deletes the module from the silicon die", "It converts the module into pure copper wires", "It turns off electrical power to the module"], answer: 0, explain: "Blackbox declarations allow Conformal to verify top-level connectivity around analog IP, memories, and PHYs lacking synthesizable RTL." },
    { id: "lec_q14", prompt: "Why must asynchronous memory BIST (MBIST) collars be constrained during functional LEC?", choices: ["To clamp mbist_en=0 so memory address/data multiplexers select functional CPU/DMA bus paths rather than test pattern generators", "To make SRAM operate at 10 GHz", "To erase on-chip Flash memory", "To convert SRAM into DRAM"], answer: 0, explain: "MBIST collars must be clamped to mission mode so memory macros receive functional system bus transactions during verification." },
    { id: "lec_q15", prompt: "What is Sequential Retiming in logic synthesis?", choices: ["Moving pipeline registers across combinational logic gates to balance stage delays while preserving input-to-output cycle latency", "Changing the clock crystal frequency", "Replacing flip-flops with resistors", "Deleting pipeline stages to save power"], answer: 0, explain: "Retiming shifts registers across logic gates to optimize timing without changing the sequential input-output transfer function." },
    { id: "lec_q16", prompt: "What does 'diagnose -point <instance>' do in Conformal LEC?", choices: ["It isolates the fanin cone of a failing compare point and identifies the specific gate or net where boolean divergence originates", "It repairs the physical silicon with a laser", "It reports the junction temperature of the transistor", "It runs a static timing report on the path"], answer: 0, explain: "The diagnose command traces logic cones back to the exact root-cause gate causing the non-equivalence." },
    { id: "lec_q17", prompt: "How does Conformal prove equivalence on bubble-pushed logic cones (De Morgan's Laws)?", choices: ["Its canonical boolean solvers prove !(A & B) is identical to (!A | !B) algebraically regardless of gate primitive choices", "By running 10,000 random test vectors", "By measuring wire resistance in SPICE", "By checking gate fanout counts"], answer: 0, explain: "Boolean canonical representations (BDD/SAT) evaluate De Morgan transformations as identically equivalent boolean functions." },
    { id: "lec_q18", prompt: "What happens if a floating internal net in the Revised netlist is not constrained?", choices: ["Conformal models floating nets as non-deterministic free variables (can be 0 or 1), which can produce false non-equivalent compare points", "The EDA tool crashes immediately", "The computer processor overheats", "The floating net is converted to a clock"], answer: 0, explain: "Floating nets are treated as unconstrained variables unless tied to 0 using set_undriven_signal." },
    { id: "lec_q19", prompt: "What is an In-Place Cell Swap in functional ECOs?", choices: ["Replacing a standard cell with an equivalent footprint cell (e.g. BUFX2 -> INVX2) without moving cell coordinates or ripping up routed wires", "Moving a cell to a different floorplan corner", "Swapping PMOS and NMOS transistors on silicon", "Replacing flip-flops with latches"], answer: 0, explain: "In-place swaps change cell logic or drive strength on exact matching footprints with zero placement disruption." },
    { id: "lec_q20", prompt: "What criteria must be satisfied for Formal Tapeout Signoff in Cadence Conformal LEC?", choices: ["100% Compare Points verified EQUIVALENT with 0 Non-Equivalent points and 0 Unmapped functional points", "At least 80% passing points", "Passing 100 simulation test vectors", "Zero DRC errors only"], answer: 0, explain: "Formal tapeout signoff requires 100% mathematically proven equivalence across all compare points with zero unresolved points." },
  ]),

  // ==========================================================================
  // 🟣 2. SYNOPSYS EDA
  // ==========================================================================

  // ——— Subject 1: Synopsys Synthesis (Design Compiler) ———
  theory(
    "synopsys-synthesis",
    "master",
    "dc-arch-libraries",
    "Synopsys: Design Compiler Architecture & Library Linking",
    22,
    "target_library vs link_library, synthetic_library (DesignWare), GTECH elaboration, and SDC application.",
    [
      `## Synopsys Design Compiler Architecture

Synopsys Design Compiler (DC / DC NXT) converts synthesizable Verilog/VHDL into gate-level netlists mapped to technology target libraries (.db).

FLOW: set target/link_library → read_file / analyze & elaborate → apply SDC → set_clock_gating_style → compile_ultra → write_file

## Library Configuration & Elaboration
CODE tcl
set_app_var search_path "$search_path ./libs ./rtl"
set_app_var target_library "sc_12nm_tt_0p8v.db"
set_app_var link_library "* $target_library io_pads.db sram_macro.db"
set_app_var synthetic_library "dw_foundation.sldb"

analyze -format sverilog [glob rtl/*.sv]
elaborate soc_top -architecture verilog
current_design soc_top
link
check_design > reports/check_design.rpt
ENDCODE
`
    ]
  ),

  theory(
    "synopsys-synthesis",
    "master",
    "dc-ultra-gating-svf",
    "Synopsys: compile_ultra, Automated Clock Gating & SVF Recording",
    22,
    "Integrated Clock Gating (ICG) insertion, compile_ultra timing/leakage optimization, and SVF generation for Formality.",
    [
      `## Clock Gating & Ultra Compilation

CODE tcl
set_svf outputs/dc_synthesis.svf

read_sdc sdc/soc_top.sdc

# Automatic Integrated Clock Gating (ICG) Insertion
set_clock_gating_style -sequential_cell latch -positive_edge_logic {integrated:TLATNTSCA} -control_point before
insert_clock_gating -module soc_top
propagate_constraints -gate_clock

# High-effort multi-Vth optimization
compile_ultra -gate_clock -scan -retime -no_autoungroup

report_qor > reports/dc_qor.rpt
report_clock_gating > reports/dc_clock_gating.rpt

write_file -format verilog -hierarchy -output outputs/soc_top_synth.v
set_svf -off
ENDCODE
`
    ]
  ),

  practical(
    "synopsys-synthesis",
    "master",
    "dc-practical-lab",
    "Synopsys Practical: Design Compiler Ultra Synthesis & Constraints Setup",
    20,
    "Write a complete Design Compiler synthesis script configuring target/link libraries, SVF recording, elaboration, compile_ultra with clock gating, and netlist export.",
    [
      "Set target_library and link_library variables.",
      "Initialize SVF tracking with set_svf.",
      "Analyze and elaborate the top design.",
      "Execute compile_ultra with -gate_clock.",
      "Export mapped Verilog and disable SVF.",
    ],
    {
      language: "tcl",
      starter: `# Synopsys Design Compiler Script
# TODO: target/link_library, set_svf, elaborate, compile_ultra, write_file
`,
      checks: [
        { id: "lib", label: "target_library setup", kind: "includes", pattern: "target_library" },
        { id: "svf", label: "set_svf tracking", kind: "includes", pattern: "set_svf" },
        { id: "elab", label: "elaborate", kind: "includes", pattern: "elaborate" },
        { id: "cu", label: "compile_ultra", kind: "includes", pattern: "compile_ultra" },
        { id: "wf", label: "write_file export", kind: "includes", pattern: "write_file" },
      ],
      solution: `set_app_var target_library "stdcells_12nm.db"
set_app_var link_library "* $target_library"
set_svf ./outputs/dc_record.svf

analyze -format sverilog {./rtl/soc_top.sv}
elaborate soc_top
current_design soc_top
link

compile_ultra -gate_clock -scan

write_file -format verilog -hierarchy -output ./outputs/soc_top_synth.v
set_svf -off
`,
    }
  ),

  quiz("synopsys-synthesis", "master", "dc-quiz", "Synopsys Design Compiler — Quiz", [
    { id: "sd1", prompt: "Why is set_svf essential during Design Compiler synthesis runs?", choices: ["It generates the Formality Automated Setup File recording complex optimizations (ungrouping, retiming, state encoding) for formal equivalence proof", "It creates the SPICE netlist", "It converts RTL directly to GDSII", "It configures the synthesis GUI window"], answer: 0, explain: "The .svf file logs guidance instructions so Formality can match registers and verify transformed architectures without false non-equivalences." },
    { id: "sd2", prompt: "What is the primary benefit of compile_ultra -gate_clock in DC?", choices: ["It automatically instantiates Integrated Clock Gating (ICG) cells on multi-bit register enable conditions, drastically reducing dynamic clock power", "It removes all clock nets from the design", "It disables static timing checks", "It forces all flops to trigger on both edges"], answer: 0, explain: "Clock gating cuts clock network power by disabling clock pulses to idle registers when their enable inputs are inactive." },
    { id: "sd3", prompt: "How does Synopsys link_library differ from target_library?", choices: ["target_library is the cell library DC maps logic into; link_library includes target_library plus memory macros, IO pads, and IP blocks needed to resolve structural references", "They are identical in all regards", "target_library is written in Python, link_library in C", "link_library is only used for analog simulation"], answer: 0, explain: "target_library defines the pool of standard cells for logic mapping, while link_library resolves all existing instantiated black boxes and hard IPs." },
  ]),

  // ——— Subject 2: Synopsys Physical Design (IC Compiler II) ———
  theory(
    "synopsys-pnr",
    "master",
    "icc2-ndm-floorplan",
    "Synopsys: IC Compiler II NDM Architecture & Floorplan/PNS",
    25,
    "New Data Model (NDM) containers, initialize_floorplan, and Power Network Synthesis (PNS).",
    [
      `## IC Compiler II (ICC2) Architecture

ICC2 is built on a high-capacity unified multi-corner multi-mode data model (NDM - New Data Model).

FLOW: open_lib / open_block → initialize_floorplan → place_opt → clock_opt → route_auto → route_opt

## NDM Setup & Floorplanning
CODE tcl
create_lib soc_top.ndm -ref_libs {tech.ndm stdcells.ndm sram.ndm} -technology tech.tf
read_verilog -top soc_top outputs/soc_top_synth.v
load_upf power_intent.upf
read_sdc constraints.sdc

initialize_floorplan -core_utilization 0.70 -side_ratio {1.0 1.0} -core_offset {15 15 15 15}
create_pg_ring_pattern ring_pat -horizontal_layer M7 -horizontal_width 4 -vertical_layer M8 -vertical_width 4
set_pg_strategy core_ring -pattern {{name: ring_pat} {nets: {VDD VSS}}} -core
compile_pg -strategies core_ring
ENDCODE
`
    ]
  ),

  theory(
    "synopsys-pnr",
    "master",
    "icc2-place-cts-route",
    "Synopsys: ICC2 Placement, NDR Clock Routing & Zroute route_opt",
    25,
    "Analytical placement (place_opt), Non-Default Routing (NDR 2W2S) clock rules, clock_opt, route_auto, and route_opt.",
    [
      `## Placement, CTS, and Routing

CODE tcl
# Analytical Placement
set_app_options -name place_opt.congestion.effort -value high
place_opt

# CTS with Non-Default Routing (NDR) Shielding
create_routing_rule CLK_NDR_RULE -multiplier_width 2 -multiplier_spacing 2
set_clock_routing_rules -rules CLK_NDR_RULE -min_routing_layer M4 -max_routing_layer M7
clock_opt

# Routing and DRC Closure
route_auto
route_opt
check_drc
write_gds -design soc_top outputs/soc_top.gds
ENDCODE
`
    ]
  ),

  practical(
    "synopsys-pnr",
    "master",
    "icc2-practical-lab",
    "Synopsys Practical: ICC2 Stage Commands & NDR Clock Routing",
    25,
    "Write an ICC2 implementation sequence configuring floorplan initialization, place_opt, NDR clock rules, clock_opt, route_auto, and route_opt.",
    [
      "Initialize floorplan with target utilization.",
      "Execute place_opt for standard cell placement.",
      "Define routing rule and apply to clock nets.",
      "Run clock_opt and detailed route_auto.",
      "Finish with route_opt for timing/DRC signoff.",
    ],
    {
      language: "tcl",
      starter: `# Synopsys ICC2 Implementation Script
# TODO: initialize_floorplan, place_opt, create_routing_rule, clock_opt, route_auto, route_opt
`,
      checks: [
        { id: "fp", label: "initialize_floorplan", kind: "includes", pattern: "initialize_floorplan" },
        { id: "place", label: "place_opt", kind: "includes", pattern: "place_opt" },
        { id: "ndr", label: "create_routing_rule", kind: "includes", pattern: "create_routing_rule" },
        { id: "cts", label: "clock_opt", kind: "includes", pattern: "clock_opt" },
        { id: "ra", label: "route_auto", kind: "includes", pattern: "route_auto" },
        { id: "ro", label: "route_opt", kind: "includes", pattern: "route_opt" },
      ],
      solution: `initialize_floorplan -core_utilization 0.70 -side_ratio {1.0 1.0}
place_opt
create_routing_rule 2W2S_CLK_RULE -multiplier_width 2 -multiplier_spacing 2
set_clock_routing_rules -rules 2W2S_CLK_RULE -clocks [all_clocks]
clock_opt
route_auto
route_opt
`,
    }
  ),

  quiz("synopsys-pnr", "master", "icc2-quiz", "Synopsys ICC2 Physical Design — Quiz", [
    { id: "si1", prompt: "What is the primary purpose of applying Non-Default Routing (NDR) rules (e.g. 2W2S) to clock nets in ICC2?", choices: ["Shielding and spacing clock lines to drastically reduce crosstalk noise, delay variability, and coupling capacitance from neighboring switching signals", "Reducing clock resistance to zero ohms", "Eliminating standard cell power consumption", "Preventing clock buffers from being placed"], answer: 0, explain: "2W2S (double width, double spacing) lowers resistance and isolates clock tracks from aggressor signal nets, minimizing clock jitter and SI-induced delay shifts." },
    { id: "si2", prompt: "In ICC2, what does the NDM (New Data Model) format replace?", choices: ["Legacy CEL/FRAM Milkyway database structures, providing a single consolidated database for logical and physical views", "SPICE models", "Verilog syntax", "SystemC testbenches"], answer: 0, explain: "NDM consolidates timing, logical, and physical data into a high-performance modern container, replacing the outdated Synopsys Milkyway format." },
    { id: "si3", prompt: "What is the key objective of route_opt in the ICC2 flow?", choices: ["Resolving remaining timing slacks, crosstalk delta delays, antenna violations, and DRC/LVS cleanups post detailed routing", "Floorplanning macro blocks", "Running logic synthesis from RTL", "Converting Verilog to VHDL"], answer: 0, explain: "route_opt operates on the detailed-routed database with true extracted parasitics to close setup/hold timing and fix manufacturing DRCs." },
  ]),

  // ——— Subject 3: Synopsys Power Analysis (PrimePower) ———
  theory(
    "synopsys-power",
    "master",
    "primepower-modes-basics",
    "Synopsys: PrimePower & PTPX Architecture & Power Components",
    25,
    "PrimeTime PX integration, time_based vs averaged power modes, switching, internal, and static leakage breakdown.",
    [
      `## PrimePower (PTPX) Architecture

PrimePower is integrated directly into the PrimeTime STA environment (PrimeTime PX), calculating power using accurate timing slews and parasitic loads.

FLOW: read_db → read_verilog → read_spef → set_power_analysis_mode → read_vcd / read_saif → check_power → update_power → report_power

## Enabling Power Analysis in PrimeTime
CODE tcl
set_app_var power_enable_analysis TRUE
set_app_var power_analysis_mode time_based

read_verilog outputs/soc_top_routed.v
current_design soc_top
link

read_sdc constraints.sdc
read_parasitics -format SPEF ./spef/soc_top.spef
update_timing -full
ENDCODE
`
    ]
  ),

  theory(
    "synopsys-power",
    "master",
    "primepower-activity-peaks",
    "Synopsys: PrimePower Activity Annotation (VCD/SAIF) & Peak Power",
    25,
    "Annotating simulation waveforms, identifying unannotated nets, calculating dynamic peak current, and hierarchical reporting.",
    [
      `## Activity Annotation & Peak Current Profiles

CODE tcl
read_vcd -strip_path tb_top/dut -time {1000 5000} waves.vcd
report_switching_activity -list_not_annotated > reports/unannotated_nets.rpt

check_power
update_power

report_power -hierarchy -levels 2 > reports/power_hierarchical.rpt
report_power -cell_power -sort_by total_power > reports/power_top_cells.rpt
report_threshold_voltage_group > reports/vth_distribution.rpt
ENDCODE
`
    ]
  ),

  practical(
    "synopsys-power",
    "master",
    "primepower-practical-lab",
    "Synopsys Practical: PrimePower Activity Annotation & Dynamic Power Calculation",
    25,
    "Construct a complete PrimeTime PX power analysis script enabling power analysis, linking design, reading SPEF and VCD activity, and reporting hierarchical power.",
    [
      "Enable power_enable_analysis in PrimeTime.",
      "Link design and read parasitic SPEF.",
      "Annotate switching activity from VCD waveform.",
      "Execute update_power and report_power.",
    ],
    {
      language: "tcl",
      starter: `# PrimeTime PX (PrimePower) Script
# TODO: power_enable_analysis, read_parasitics, read_vcd, update_power, report_power
`,
      checks: [
        { id: "en", label: "power_enable_analysis", kind: "includes", pattern: "power_enable_analysis" },
        { id: "spef", label: "read_parasitics", kind: "includes", pattern: "read_parasitics" },
        { id: "vcd", label: "read_vcd", kind: "includes", pattern: "read_vcd" },
        { id: "up", label: "update_power", kind: "includes", pattern: "update_power" },
        { id: "rp", label: "report_power", kind: "includes", pattern: "report_power" },
      ],
      solution: `set_app_var power_enable_analysis TRUE
set_app_var power_analysis_mode averaged

read_verilog ./outputs/soc_top_routed.v
current_design soc_top
link

read_parasitics -format SPEF ./spef/soc_top.spef
read_vcd -strip_path testbench/dut ./sim/activity.vcd

check_power
update_power
report_power -hierarchy > ./reports/hierarchical_power.rpt
`,
    }
  ),

  quiz("synopsys-power", "master", "primepower-quiz", "Synopsys PrimePower — Quiz", [
    { id: "sp1", prompt: "What are the three components of total power calculated by PrimePower?", choices: ["Switching Power (external load charging), Internal Power (short-circuit & internal node charging), and Static Leakage Power", "Solar power, thermal radiation, and kinetic energy", "AC power, DC power, and imaginary power", "Clock power only"], answer: 0, explain: "Total power consists of Dynamic Power (Switching + Internal) and Static Leakage Power across all transistors." },
    { id: "sp2", prompt: "What is the advantage of 'time_based' power analysis mode over 'averaged' mode in PrimePower?", choices: ["It evaluates cycle-by-cycle instantaneous peak power surges, enabling identification of di/dt events and thermal hotspots", "It runs 1000x faster than averaged mode", "It does not require library models", "It only measures static leakage"], answer: 0, explain: "Time-based mode calculates power in fine time slices across the simulation duration to reveal maximum peak instantaneous currents." },
    { id: "sp3", prompt: "What happens if a net is not annotated in the switching activity file (VCD/SAIF)?", choices: ["PrimePower falls back to default probabilistic toggle rates and static probabilities defined in the tool or library", "The tool crashes immediately", "The net is assumed to have zero voltage", "PrimePower deletes the net from the design"], answer: 0, explain: "Unannotated nets receive default switching activities (e.g. set_switching_activity or 0.1 toggle rate defaults) to ensure power calculations proceed." },
  ]),

  // ——— Subject 4: Synopsys Static Timing Analysis (PrimeTime) ———
  theory(
    "synopsys-sta",
    "master",
    "primetime-dmsa-setup",
    "Synopsys: PrimeTime Signoff & Distributed Multi-Scenario Analysis (DMSA)",
    25,
    "DMSA host management, parallel corner loading, coupled SPEF reading, and update_timing.",
    [
      `## PrimeTime Signoff STA Architecture

PrimeTime (PT) is the golden silicon industry standard signoff Static Timing Analysis tool.

FLOW: read_lib → read_verilog → link → read_sdc → read_parasitics → enable_si → update_timing → report_timing

## Distributed Multi-Scenario Analysis (DMSA)
CODE tcl
set_host_options -num_processes 16
create_scenario -name func_ss_0p72v -specific_variables {MODE func CORNER ss_0p72v_125c}
create_scenario -name func_ff_0p88v -specific_variables {MODE func CORNER ff_0p88v_m40c}
start_hosts
ENDCODE
`
    ]
  ),

  theory(
    "synopsys-sta",
    "master",
    "primetime-si-pba-eco",
    "Synopsys: PT-SI Crosstalk, Path-Based Analysis (PBA) & fix_eco_timing",
    25,
    "Signal integrity delta delay, Miller effect, PBA slew re-propagation, and automated ECO generation.",
    [
      `## Crosstalk Noise & Path-Based Analysis (PBA)

CODE tcl
set_app_var si_enable_analysis TRUE
read_parasitics -format SPEF -keep_capacitive_coupling ./spef/soc_top.spef
update_timing -full

# PBA Exact Slew Timing Report
report_timing -delay_type max -max_paths 50 -pba_mode path > pba_setup.rpt
report_timing -delay_type min -max_paths 50 > hold_signoff.rpt

# Automated Timing ECO Closure
fix_eco_drc -type max_transition -method size_cell
fix_eco_timing -type setup -slack_margin 0.05
fix_eco_timing -type hold  -slack_margin 0.02
write_changes -format icctcl -output outputs/pt_eco_fixes.tcl
ENDCODE
`
    ]
  ),

  practical(
    "synopsys-sta",
    "master",
    "primetime-practical-lab",
    "Synopsys Practical: PrimeTime Scenario Setup, SI Bottleneck Debug & Eco Fixes",
    25,
    "Write a PrimeTime signoff script enabling PT-SI, reading coupled SPEF parasitics, performing Path-Based Analysis (PBA), and executing fix_eco_timing.",
    [
      "Enable SI analysis with si_enable_analysis TRUE.",
      "Read coupled SPEF with read_parasitics -keep_capacitive_coupling.",
      "Generate Path-Based Analysis (PBA) setup timing report.",
      "Execute fix_eco_timing and write change script.",
    ],
    {
      language: "tcl",
      starter: `# PrimeTime Signoff STA & ECO
# TODO: si_enable_analysis, read_parasitics, report_timing -pba_mode, fix_eco_timing
`,
      checks: [
        { id: "si", label: "si_enable_analysis", kind: "includes", pattern: "si_enable_analysis" },
        { id: "spef", label: "read_parasitics", kind: "includes", pattern: "read_parasitics" },
        { id: "pba", label: "pba_mode path", kind: "includes", pattern: "pba_mode" },
        { id: "eco", label: "fix_eco_timing", kind: "includes", pattern: "fix_eco_timing" },
      ],
      solution: `set_app_var si_enable_analysis TRUE
read_verilog ./outputs/soc_top_routed.v
current_design soc_top
link

read_sdc ./sdc/signoff.sdc
read_parasitics -format SPEF -keep_capacitive_coupling ./spef/soc_top.spef
update_timing -full

report_timing -delay_type max -max_paths 50 -pba_mode path > ./reports/setup_pba.rpt
report_timing -delay_type min -max_paths 50 > ./reports/hold_signoff.rpt

fix_eco_timing -type setup -slack_margin 0.05
write_changes -format icctcl -output ./outputs/pt_eco_changes.tcl
`,
    }
  ),

  quiz("synopsys-sta", "master", "primetime-quiz", "Synopsys PrimeTime Signoff — Master Exam", [
    { id: "pt1", prompt: "How does PrimeTime SI calculate crosstalk delta delay on a victim net?", choices: ["By evaluating mutual coupling capacitances (Cc) to active neighboring aggressor nets and calculating dynamic Miller capacitance multipliers based on switching alignment", "By setting all net capacitances to 0", "By increasing clock period by 2x", "By simulating testbenches in ModelSim"], answer: 0, explain: "PT-SI identifies switching windows where aggressor nets transition simultaneously with the victim net, modulating the effective capacitive load and causing speedup or slowdown." },
    { id: "pt2", prompt: "What is the difference between PrimeTime Graph-Based Analysis (GBA) and Path-Based Analysis (PBA)?", choices: ["GBA merges worst-case slews at multi-input gates (fast & pessimistic), while PBA traces the specific path to propagate realistic unmerged slews (slower & accurate)", "GBA is for analog circuits and PBA is for digital", "PBA only checks hold time", "There is no functional difference"], answer: 0, explain: "PBA eliminates artificial pessimism from multi-fanin worst-case slew assumptions, recovering valuable picoseconds of timing slack." },
    { id: "pt3", prompt: "What does fix_eco_timing do in PrimeTime?", choices: ["Performs targeted, timing-driven sizing, buffer insertion, and threshold-voltage (Vth) swapping on failing paths and outputs an executable Tcl change script for P&R", "Deletes all violated timing paths", "Re-synthesizes the RTL", "Turns off static timing checks"], answer: 0, explain: "fix_eco_timing calculates minimum-impact cell swaps and buffer insertions to resolve setup/hold violations without disturbing routed layout." },
  ]),

  // ——— Subject 5: Synopsys Logic Equivalence Checking (Formality) ———
  theory(
    "synopsys-lec",
    "master",
    "formality-containers-libs",
    "Synopsys: Formality Architecture, Containers (r:/i:) & Libraries",
    25,
    "Reference (r:) and Implementation (i:) containers, target technology library loading, and top design linking.",
    [
      `## Formality Architecture

Formality is Synopsys's golden Formal Equivalence Checking (LEC) tool that mathematically proves RTL matches Gate-level netlists with 100% vectorless coverage.

FLOW: set_svf → load reference → load implementation → set_top → match → verify

## Container Setup
CODE tcl
# Load Automated Setup File (.svf) from DC
set_svf ./outputs/dc_synthesis.svf

# Load Standard Cell Technology Libraries
read_db { tech_stdcells.db sram_macro.db }

# Container 1: Reference (Golden RTL)
read_verilog -container r -libname WORK -vcs "-f ./rtl/filelist.f"
set_top r:/WORK/soc_top

# Container 2: Implementation (Synthesized Gate Netlist)
read_verilog -container i -libname WORK ./outputs/soc_top_synth.v
set_top i:/WORK/soc_top
ENDCODE
`
    ]
  ),

  theory(
    "synopsys-lec",
    "master",
    "formality-svf-verification",
    "Synopsys: Formality SVF Guidance, Compare Points & Counterexample Diagnosis",
    25,
    "Cut point matching, BDD/SAT solver execution, unmapped points, and counterexample pattern debug.",
    [
      `## Matching & Formal Proof

CODE tcl
match
report_unmatched_points

verify
report_status

# If failing:
report_failing_points
diagnose -pattern_display
ENDCODE
`
    ]
  ),

  practical(
    "synopsys-lec",
    "master",
    "formality-practical-lab",
    "Synopsys Practical: Formality Container Setup, Guide Loading & Equivalence Proof",
    25,
    "Write a Formality verification script configuring SVF guidance, loading Reference and Implementation containers, matching compare points, and executing verify.",
    [
      "Set SVF guidance with set_svf.",
      "Read Reference RTL into container r and set_top.",
      "Read Implementation netlist into container i and set_top.",
      "Execute match and verify commands.",
    ],
    {
      language: "tcl",
      starter: `# Synopsys Formality LEC Script
# TODO: set_svf, read_verilog -container r/i, set_top, match, verify
`,
      checks: [
        { id: "svf", label: "set_svf guidance", kind: "includes", pattern: "set_svf" },
        { id: "r", label: "container r", kind: "includes", pattern: "-container r" },
        { id: "i", label: "container i", kind: "includes", pattern: "-container i" },
        { id: "match", label: "match points", kind: "includes", pattern: "match" },
        { id: "ver", label: "verify command", kind: "includes", pattern: "verify" },
      ],
      solution: `set_svf ./outputs/dc_synthesis.svf
read_db ./libs/stdcells.db

read_verilog -container r -libname WORK ./rtl/soc_top.sv
set_top r:/WORK/soc_top

read_verilog -container i -libname WORK ./outputs/soc_top_synth.v
set_top i:/WORK/soc_top

match
verify
report_status
`,
    }
  ),

  quiz("synopsys-lec", "master", "formality-quiz", "Synopsys Formality — Master Exam", [
    { id: "sf1", prompt: "How does Formality represent the golden RTL and synthesized gate netlist in memory?", choices: ["In two separate containers: container 'r' (Reference) and container 'i' (Implementation)", "In a single flat text buffer", "Inside MySQL database tables", "In temporary WAV audio files"], answer: 0, explain: "Formality keeps the golden design in the Reference container ('r') and the revised design in the Implementation container ('i')." },
    { id: "sf2", prompt: "What is a 'Cut Point' in Formality's verification algorithm?", choices: ["Boundary signals (inputs, registers, black boxes) that divide cyclic synchronous circuits into acyclic combinational cones for independent mathematical proof", "A wire cut on the silicon chip", "A deleted register", "A clock gating disable pin"], answer: 0, explain: "Cut points break state feedback loops, converting sequential verification into bounded combinational Boolean equivalence proofs." },
    { id: "sf3", prompt: "When Formality reports a failing compare point, what diagnostic artifact does it generate?", choices: ["A Boolean counterexample pattern showing the exact binary input combination where reference and implementation logic outputs disagree", "A thermal map", "A SPICE deck", "A new Verilog file"], answer: 0, explain: "A counterexample pattern pinpoints the exact logical conditions under which the two designs produce divergent outputs, accelerating root-cause debug." },
  ]),

  // ==========================================================================
  // 🟢 3. OPEN-SOURCE EDA
  // ==========================================================================

  // ——— Subject 1: Open-Source Synthesis (Yosys & ABC) ———
  theory(
    "opensource-synthesis",
    "master",
    "yosys-ast-elaboration",
    "Open-Source: Yosys Synthesis Architecture & AST Elaboration",
    20,
    "Parsing Verilog-2005/SV, AST generation, RTLIL representation, and the proc pass.",
    [
      `## Yosys Open-Source Synthesis Architecture

Yosys is the leading open-source framework for Verilog RTL synthesis and formal verification.

FLOW: read_verilog → proc → opt → fsm → opt → memory → opt → techmap → abc -liberty → clean → write_verilog

## The Core Yosys Pass Architecture
- **read_verilog**: Parses Verilog/SV into AST.
- **hierarchy -top <design>**: Resolves parameter values and module hierarchies.
- **proc**: Converts Verilog procedural \`always\` blocks into flip-flops, latches, and multiplexers.
`
    ]
  ),

  theory(
    "opensource-synthesis",
    "master",
    "yosys-passes-abc",
    "Open-Source: Yosys High-Level Passes & ABC Technology Mapping",
    20,
    "FSM extraction/encoding, memory mapping, and target cell mapping via Berkeley ABC.",
    [
      `## Technology Mapping with ABC

CODE tcl
read_verilog -sv ./rtl/alu_top.sv
hierarchy -check -top alu_top

# High-level synthesis passes
proc; opt; fsm; opt; memory; opt

# Target cell technology mapping using Berkeley ABC
techmap; opt
dfflibmap -liberty sky130_fd_sc_hd__tt_025C_1v80.lib
abc -liberty sky130_fd_sc_hd__tt_025C_1v80.lib

clean
write_verilog -noattr outputs/alu_top_synth.v
stat -liberty sky130_fd_sc_hd__tt_025C_1v80.lib
ENDCODE
`
    ]
  ),

  practical(
    "opensource-synthesis",
    "master",
    "yosys-practical-lab",
    "Open-Source Practical: Yosys RTL Synthesis Script & Target Techlib Mapping",
    20,
    "Write a complete Yosys synthesis script reading Verilog, executing core elaboration passes (proc, opt, fsm, memory), mapping flip-flops and gates via ABC, and generating cell statistics.",
    [
      "Read Verilog and set design hierarchy.",
      "Execute high-level passes: proc, opt, fsm, memory.",
      "Map flip-flops using dfflibmap and combinational gates via abc -liberty.",
      "Print area and cell statistics using stat.",
    ],
    {
      language: "tcl",
      starter: `# Yosys Synthesis Script
# TODO: read_verilog, hierarchy, proc/opt/fsm/memory, dfflibmap, abc, stat
`,
      checks: [
        { id: "rv", label: "read_verilog", kind: "includes", pattern: "read_verilog" },
        { id: "proc", label: "proc pass", kind: "includes", pattern: "proc" },
        { id: "fsm", label: "fsm pass", kind: "includes", pattern: "fsm" },
        { id: "dff", label: "dfflibmap", kind: "includes", pattern: "dfflibmap" },
        { id: "abc", label: "abc -liberty", kind: "includes", pattern: "abc" },
        { id: "stat", label: "stat report", kind: "includes", pattern: "stat" },
      ],
      solution: `read_verilog -sv ./rtl/counter.sv
hierarchy -top counter -check

proc
opt
fsm
opt
memory
opt

techmap
dfflibmap -liberty ./sky130.lib
abc -liberty ./sky130.lib
clean

stat -liberty ./sky130.lib
write_verilog -noattr ./outputs/counter_mapped.v
`,
    }
  ),

  quiz("opensource-synthesis", "master", "yosys-quiz", "Open-Source Yosys Synthesis — Quiz", [
    { id: "oy1", prompt: "What is the role of the 'proc' pass in Yosys?", choices: ["Translating Verilog procedural 'always' blocks into explicit multiplexers, latches, and flip-flop primitives", "Compiling C++ code", "Running physical placement", "Synthesizing power rings"], answer: 0, explain: "The proc pass converts procedural AST expressions into concrete RTLIL multiplexers and registers." },
    { id: "oy2", prompt: "How does Yosys perform combinational technology mapping into Liberty standard cell libraries?", choices: ["By invoking Berkeley ABC (abc -liberty <libfile>), which performs AIG optimization and technology cut mapping", "By doing regular expression string replacement", "By calling Python scripts", "By asking the user to manually type gates"], answer: 0, explain: "Yosys integrates the ABC logic synthesis system to perform DAG/AIG boolean rewriting and cell mapping." },
    { id: "oy3", prompt: "What does the 'stat -liberty' command display in Yosys?", choices: ["A breakdown of cell instances, total gate count, sequential vs combinational area, and chip footprint based on the Liberty file", "CPU temperature and fan speed", "Git repository commit log", "Network transfer speed"], answer: 0, explain: "stat calculates total standard cell area and instance counts mapped to target technology library gates." },
  ]),

  // ——— Subject 2: Open-Source Physical Design (OpenROAD) ———
  theory(
    "opensource-pnr",
    "master",
    "openroad-arch-floorplan",
    "Open-Source: OpenROAD Architecture, PDK Ingestion & Tapcells",
    25,
    "OpenROAD no-human-in-the-loop flow, LEF/DEF ingestion, floorplanning, and tapcell insertion for latchup prevention.",
    [
      `## OpenROAD Autonomous ASIC Implementation

OpenROAD provides a completely open-source RTL-to-GDSII autonomous physical design flow.

FLOW: read_lef / read_def → initialize_floorplan → tapcell → global_placement (RePlAce) → detailed_placement (OpenDP) → clock_tree_synthesis (TritonCTS) → global_route (FastRoute) → detailed_route (TritonRoute)

## PDK Loading & Floorplanning
CODE tcl
read_lef sky130_fd_sc_hd.tlef
read_lef sky130_fd_sc_hd.lef
read_liberty sky130_fd_sc_hd__tt_025C_1v80.lib

read_verilog outputs/soc_top_synth.v
link_design soc_top

initialize_floorplan -site unithd -utilization 45 -core_space 20
tapcell -endcap_cpp "sky130_fd_sc_hd__decap_3" -distance 14 -tapcell_master "sky130_fd_sc_hd__tapvpwrvgnd_1"
ENDCODE
`
    ]
  ),

  theory(
    "opensource-pnr",
    "master",
    "openroad-place-cts-route",
    "Open-Source: RePlAce Placement, TritonCTS & TritonRoute",
    25,
    "Electrostatics global placement (RePlAce), legalizer (OpenDP), H-tree clock synthesis (TritonCTS), FastRoute, and TritonRoute DRC closure.",
    [
      `## Placement, CTS, and Detailed Route

CODE tcl
# Analytical Global Placement with RePlAce
global_placement -density 0.65 -pad_left 2 -pad_right 2
detailed_placement

# TritonCTS
clock_tree_synthesis -root_buf "sky130_fd_sc_hd__clkbuf_16" \\
  -buf_list "sky130_fd_sc_hd__clkbuf_8 sky130_fd_sc_hd__clkbuf_4"
detailed_placement

# Routing
global_route -guide_file route.guide -congestion_iterations 50
detailed_route -guide route.guide -output_drc drc.rpt

write_def outputs/soc_top_routed.def
write_db outputs/soc_top_final.odb
ENDCODE
`
    ]
  ),

  practical(
    "opensource-pnr",
    "master",
    "openroad-practical-lab",
    "Open-Source Practical: OpenROAD Automation Script from Floorplan to GDSII",
    25,
    "Write an OpenROAD automation script executing floorplan initialization, tapcell insertion, global placement (RePlAce), TritonCTS, and detailed routing.",
    [
      "Initialize floorplan and PDK libraries.",
      "Insert latchup protection tapcells.",
      "Execute global_placement and detailed_placement.",
      "Synthesize clock tree with clock_tree_synthesis.",
      "Execute global_route and detailed_route.",
    ],
    {
      language: "tcl",
      starter: `# OpenROAD Physical Design Script
# TODO: initialize_floorplan, tapcell, global_placement, clock_tree_synthesis, global_route, detailed_route
`,
      checks: [
        { id: "fp", label: "initialize_floorplan", kind: "includes", pattern: "initialize_floorplan" },
        { id: "tap", label: "tapcell", kind: "includes", pattern: "tapcell" },
        { id: "gp", label: "global_placement", kind: "includes", pattern: "global_placement" },
        { id: "cts", label: "clock_tree_synthesis", kind: "includes", pattern: "clock_tree_synthesis" },
        { id: "gr", label: "global_route", kind: "includes", pattern: "global_route" },
        { id: "dr", label: "detailed_route", kind: "includes", pattern: "detailed_route" },
      ],
      solution: `initialize_floorplan -site unithd -utilization 45 -core_space 20
tapcell -distance 14 -tapcell_master sky130_fd_sc_hd__tapvpwrvgnd_1
global_placement -density 0.60
detailed_placement
clock_tree_synthesis -root_buf sky130_fd_sc_hd__clkbuf_16
detailed_placement
global_route
detailed_route
write_def ./outputs/soc_top_routed.def
`,
    }
  ),

  quiz("opensource-pnr", "master", "openroad-quiz", "Open-Source OpenROAD Flow — Quiz", [
    { id: "oo1", prompt: "Why must 'tapcell' insertion be executed prior to global and detailed placement in OpenROAD?", choices: ["To guarantee maximum substrate and N-well tap spacing across standard cell rows, preventing CMOS latchup breakdown", "To route the reset net", "To create clock pins", "To shrink the silicon area"], answer: 0, explain: "Tap cells bias the substrate and N-wells to ground and VDD at regular physical intervals, preventing parasitic PNPN thyristor latchup." },
    { id: "oo2", prompt: "What algorithm does RePlAce use for global placement in OpenROAD?", choices: ["An electrostatics-based continuous density optimization analogy (treating cells as charged particles that repel each other to achieve uniform density)", "Random simulated annealing", "Alphabetical sorting of instance names", "Manual human drag-and-drop"], answer: 0, explain: "RePlAce solves global placement using an electrostatics analogy (ePlace algorithm) where potential energy minimization spreads cells uniformly without overlap." },
    { id: "oo3", prompt: "What engine performs Clock Tree Synthesis in the OpenROAD flow?", choices: ["TritonCTS", "OpenSTA", "Yosys", "FastRoute"], answer: 0, explain: "TritonCTS is the specialized CTS engine in OpenROAD that builds balanced clock buffer trees with minimal skew and insertion delay." },
  ]),

  // ——— Subject 3: Open-Source Power Analysis (OpenROAD PSM) ———
  theory(
    "opensource-power",
    "master",
    "psm-grid-formulation",
    "Open-Source: Power Grid Analysis (PSM) & Conductance Matrix Formulation",
    22,
    "OpenROAD Power Supply Module (PSM), metal resistance extraction, and sparse matrix G*V = I formulation.",
    [
      `## OpenROAD Power Grid Analysis (PSM)

The Power Supply Module (PSM) inside OpenROAD calculates voltage drop (IR drop) across VDD and VSS power distribution networks.

FLOW: read_db → set_pdn_source → check_power_grid → analyze_power_grid (PSM) → report_ir_drop

## Sparse Matrix System
PSM solves the linearized sparse matrix equation $G \\cdot V = I$, where:
- $G$ is the conductance matrix of the power metal grid and vias.
- $V$ is the node voltage vector across the chip surface.
- $I$ is the current consumption vector drawn by standard cell instances.

CODE tcl
check_power_grid -net VDD
check_power_grid -net VSS
ENDCODE
`
    ]
  ),

  theory(
    "opensource-power",
    "master",
    "psm-ir-drop-analysis",
    "Open-Source: Static IR Drop Extraction, Ground Bounce & Heatmaps",
    22,
    "Executing analyze_power_grid, voltage drop threshold violations, and GUI heatmap rendering.",
    [
      `## Static IR Drop & Ground Bounce Analysis

CODE tcl
# VDD Static IR Drop Analysis (Sky130 1.8V nominal)
analyze_power_grid -net VDD -vsrc ./vsrc_vdd.loc -outfile reports/vdd_ir_drop.rpt

# VSS Ground Bounce Analysis
analyze_power_grid -net VSS -vsrc ./vsrc_vss.loc -outfile reports/vss_ground_bounce.rpt

# GUI Heatmap
gui::show_heatmap "IR Drop (VDD)"
ENDCODE
`
    ]
  ),

  practical(
    "opensource-power",
    "master",
    "psm-practical-lab",
    "Open-Source Practical: OpenROAD PDN Grid Resistance & Voltage Drop Verification",
    20,
    "Write an OpenROAD PSM script verifying power grid continuity, defining voltage supply sources, and running analyze_power_grid for VDD and VSS nets.",
    [
      "Check power grid integrity using check_power_grid.",
      "Execute analyze_power_grid for VDD supply net.",
      "Execute analyze_power_grid for VSS ground net.",
    ],
    {
      language: "tcl",
      starter: `# OpenROAD PSM Script
# TODO: check_power_grid, analyze_power_grid for VDD and VSS
`,
      checks: [
        { id: "chk", label: "check_power_grid", kind: "includes", pattern: "check_power_grid" },
        { id: "vdd", label: "analyze_power_grid VDD", kind: "regex", pattern: "analyze_power_grid[\\s\\S]*-net VDD" },
        { id: "vss", label: "analyze_power_grid VSS", kind: "regex", pattern: "analyze_power_grid[\\s\\S]*-net VSS" },
      ],
      solution: `check_power_grid -net VDD
check_power_grid -net VSS
analyze_power_grid -net VDD -vsrc ./vsrc_vdd.loc -outfile ./reports/psm_vdd.rpt
analyze_power_grid -net VSS -vsrc ./vsrc_vss.loc -outfile ./reports/psm_vss.rpt
`,
    }
  ),

  quiz("opensource-power", "master", "psm-quiz", "Open-Source Power Integrity — Quiz", [
    { id: "op1", prompt: "What mathematical system does OpenROAD PSM solve to determine voltage drop across the PDN?", choices: ["A linear nodal conductance matrix equation G * V = I modeling metal stripe resistors and cell current sinks", "A Fourier transform", "An image classification neural network", "A quadratic equation with one variable"], answer: 0, explain: "PSM builds a network conductance matrix G from extracted metal layer/via resistances and solves for nodal voltages V under load current vector I." },
    { id: "op2", prompt: "What is 'Ground Bounce' in physical design rail analysis?", choices: ["A rise in local VSS potential above true 0V caused by resistance and current surges in the ground return network", "A physical bouncing of the silicon wafer on the conveyor belt", "An antenna violation on metal 1", "A clock frequency error"], answer: 0, explain: "Ground bounce occurs when current passing through ground net resistances elevates local VSS, reducing the effective voltage differential across logic gates." },
    { id: "op3", prompt: "How does OpenROAD represent voltage sources (pads/bumps) during PSM rail analysis?", choices: ["Via voltage source location files (.loc) defining X/Y coordinates and nominal supply voltages", "Inside Verilog comments", "In JPEG images", "Through manual solder pin entries"], answer: 0, explain: "Location files specify coordinates where package bond pads or C4 bump power connections contact the top metal stripes." },
  ]),

  // ——— Subject 4: Open-Source Static Timing Analysis (OpenSTA) ———
  theory(
    "opensource-sta",
    "master",
    "opensta-arch-liberty",
    "Open-Source: OpenSTA Architecture, Liberty LUTs & SDC Parsing",
    25,
    "Non-Linear Delay Model (NLDM) 2D lookup tables, SDC parser, and graph construction.",
    [
      `## OpenSTA Timing Analysis Architecture

OpenSTA is an open-source, full-featured Static Timing Analysis (STA) tool designed by Parallax Software and integrated into OpenROAD.

FLOW: read_liberty → read_verilog → link_design → read_sdc → set_propagated_clock → report_checks

## Library Ingestion & SDC Loading
CODE tcl
read_liberty -min sky130_fd_sc_hd__ff_n40C_1v95.lib
read_liberty -max sky130_fd_sc_hd__ss_100C_1v60.lib

read_verilog outputs/soc_top_routed.v
link_design soc_top

read_sdc sdc/soc_top.sdc
ENDCODE
`
    ]
  ),

  theory(
    "opensource-sta",
    "master",
    "opensta-delays-reports",
    "Open-Source: Propagated Clocks, Delay Calculations & WNS/TNS Reports",
    25,
    "Propagated clock networks, SPEF delay calculation, setup/hold slack reports, WNS, and TNS.",
    [
      `## Clock Propagation & Timing Slack Reports

CODE tcl
set_propagated_clock [all_clocks]
read_spef outputs/soc_top_routed.spef

# Worst Setup (Max) Timing Paths
report_checks -path_delay max -fields {slew cap input_pins nets} -digits 3 > reports/sta_setup.rpt

# Worst Hold (Min) Timing Paths
report_checks -path_delay min -fields {slew cap input_pins nets} -digits 3 > reports/sta_hold.rpt

report_tns
report_wns
report_check_types -max_slew -max_capacitance -max_fanout
ENDCODE
`
    ]
  ),

  practical(
    "opensource-sta",
    "master",
    "opensta-practical-lab",
    "Open-Source Practical: OpenSTA Timing Report Scripting & Path Grouping",
    25,
    "Write an OpenSTA script reading Liberty libraries, linking netlist, applying SDC constraints, reading SPEF parasitics, and generating setup/hold reports.",
    [
      "Load Liberty timing libraries with read_liberty.",
      "Link design and read SDC constraints.",
      "Read parasitic SPEF file.",
      "Propagate clocks and generate report_checks.",
    ],
    {
      language: "tcl",
      starter: `# OpenSTA Timing Script
# TODO: read_liberty, read_verilog, link_design, read_sdc, read_spef, report_checks
`,
      checks: [
        { id: "lib", label: "read_liberty", kind: "includes", pattern: "read_liberty" },
        { id: "link", label: "link_design", kind: "includes", pattern: "link_design" },
        { id: "sdc", label: "read_sdc", kind: "includes", pattern: "read_sdc" },
        { id: "spef", label: "read_spef", kind: "includes", pattern: "read_spef" },
        { id: "rc", label: "report_checks", kind: "includes", pattern: "report_checks" },
      ],
      solution: `read_liberty ./libs/sky130_hd.lib
read_verilog ./netlist/soc_top_routed.v
link_design soc_top
read_sdc ./sdc/soc_top.sdc
read_spef ./spef/soc_top.spef
set_propagated_clock [all_clocks]

report_checks -path_delay max -fields {slew cap nets} -digits 3 > ./reports/setup.rpt
report_checks -path_delay min -fields {slew cap nets} -digits 3 > ./reports/hold.rpt
report_wns
report_tns
`,
    }
  ),

  quiz("opensource-sta", "master", "opensta-quiz", "Open-Source OpenSTA — Quiz", [
    { id: "os1", prompt: "What does the 'set_propagated_clock [all_clocks]' command do in OpenSTA?", choices: ["Instructs the timing engine to compute actual buffer/net insertion delays through the synthesized clock tree rather than assuming ideal zero-delay clock arrival", "Deletes the clock tree buffers", "Converts the design to asynchronous logic", "Multiplies clock frequency by 2"], answer: 0, explain: "Prior to CTS, clocks are ideal (0 delay); post-CTS, set_propagated_clock calculates actual arrival times from the extracted clock tree network." },
    { id: "os2", prompt: "What do WNS and TNS stand for in OpenSTA signoff reports?", choices: ["Worst Negative Slack (the single most violated path slack) and Total Negative Slack (the sum of all negative slacks across all violating endpoints)", "Wire Net Size and Total Net Size", "Waveform Noise Scale and Transistor Net Structure", "World Node Standard and Test Net Suite"], answer: 0, explain: "WNS indicates the critical path delay shortfall, while TNS quantifies the cumulative magnitude of timing violations across the whole design." },
    { id: "os3", prompt: "How does OpenSTA calculate gate propagation delays from Liberty (.lib) lookup tables (LUTs)?", choices: ["Using 2D Non-Linear Delay Model (NLDM) interpolation based on input transition time (slew) and output capacitive load", "By measuring gate area on layout", "Through random number generation", "By asking the compiler to estimate SPICE files"], answer: 0, explain: "OpenSTA performs 2D bilinear interpolation across Liberty NLDM tables indexed by input slew and output pin capacitance." },
  ]),

  // ——— Subject 5: Open-Source Logic Equivalence (Formal Verification) ———
  theory(
    "opensource-lec",
    "master",
    "yosys-miter-formulation",
    "Open-Source: Formal Equivalence Fundamentals & Miter Formulation",
    25,
    "Miter circuit construction ($Output = A \\oplus B$), equiv_make, and Boolean satisfiability (SAT).",
    [
      `## Open-Source Formal Equivalence Checking

Using Yosys and integrated SAT solvers (PicoSAT, MiniSAT, Yices), developers can formally verify that an optimized or synthesized gate netlist is 100% equivalent to reference RTL.

FLOW: read golden → read revised → equiv_make → equiv_simple → equiv_status → equiv_induct

## Constructing the Formal Miter Circuit
A **Miter** connects identical inputs of the Golden ($A$) and Revised ($B$) circuits and XORs their corresponding outputs:
$$Output_{miter} = A_{out} \\oplus B_{out}$$

CODE tcl
# Read Golden RTL Design
read_verilog -sv ./rtl/alu_core.sv
prep -top alu_core
design -save golden

# Read Synthesized Gate Netlist
design -reset
read_liberty -ignore_miss_dir -ignore_miss_data sky130.lib
read_verilog ./outputs/alu_core_gate.v
prep -top alu_core
design -save revised

# Construct the Miter Circuit
design -copy-from golden -as gold alu_core
design -copy-from revised -as gate alu_core
equiv_make gold gate miter_design
design -load miter_design
ENDCODE
`
    ]
  ),

  theory(
    "opensource-lec",
    "master",
    "yosys-sat-induct-proofs",
    "Open-Source: SAT Verification via equiv_simple & equiv_induct",
    25,
    "Structural equivalence solving (equiv_simple), temporal induction on state registers (equiv_induct), and asserting equivalence.",
    [
      `## Proving Equivalence via SAT Solvers

CODE tcl
# Fast structural matching
equiv_simple -seq

# Inductive SAT Solver for Sequential Loops
equiv_induct
equiv_status -assert
ENDCODE

If \`equiv_status -assert\` returns 0 unproven compare points, equivalence is **proven**.
`
    ]
  ),

  practical(
    "opensource-lec",
    "master",
    "yosys-miter-practical-lab",
    "Open-Source Practical: Yosys Formal Miter Construction & Equivalence Proof",
    25,
    "Write a Yosys formal verification script copying golden and revised designs, constructing a formal miter with equiv_make, running equiv_simple and equiv_induct, and checking status.",
    [
      "Copy golden and revised modules into the workspace.",
      "Construct miter circuit using equiv_make gold gate miter.",
      "Execute structural solver with equiv_simple.",
      "Prove sequential equivalence with equiv_induct.",
      "Assert equivalence with equiv_status -assert.",
    ],
    {
      language: "tcl",
      starter: `# Yosys Formal Equivalence Script
# TODO: equiv_make, equiv_simple, equiv_induct, equiv_status -assert
`,
      checks: [
        { id: "em", label: "equiv_make", kind: "includes", pattern: "equiv_make" },
        { id: "es", label: "equiv_simple", kind: "includes", pattern: "equiv_simple" },
        { id: "ei", label: "equiv_induct", kind: "includes", pattern: "equiv_induct" },
        { id: "est", label: "equiv_status", kind: "includes", pattern: "equiv_status -assert" },
      ],
      solution: `design -copy-from golden -as gold alu_top
design -copy-from revised -as gate alu_top
equiv_make gold gate miter_top
design -load miter_top

equiv_simple
equiv_induct
equiv_status -assert
`,
    }
  ),

  quiz("opensource-lec", "master", "yosys-formal-quiz", "Open-Source Formal Equivalence — Quiz", [
    { id: "ol1", prompt: "What is a 'Miter' in formal equivalence checking?", choices: ["A circuit that feeds identical inputs into both the Golden and Revised designs and XORs their corresponding outputs to test for discrepancy", "A physical heatsink on the chip", "A clock divider circuit", "A power stripe geometry"], answer: 0, explain: "A miter transforms equivalence verification into a SAT problem: finding whether any input assignment can cause the output XOR gate to evaluate to 1." },
    { id: "ol2", prompt: "What does the 'equiv_induct' pass perform in Yosys?", choices: ["Proves sequential equivalence across state register holding points using k-induction mathematical algorithms", "Installs C++ compilers", "Measures dynamic power consumption", "Converts Verilog into GDSII"], answer: 0, explain: "equiv_induct uses mathematical induction on register state transitions to prove equivalence across all reachable states." },
    { id: "ol3", prompt: "If 'equiv_status -assert' returns a non-zero count of unproven points, what does it mean?", choices: ["The two designs are either functionally non-equivalent or the SAT solver requires additional helper invariants/cut-points to complete the proof", "The simulation ran too long", "The file was deleted", "The library had no timing tables"], answer: 0, explain: "Unproven points indicate either a functional design discrepancy (bug introduced during optimization) or solver timeout requiring structural cut points." },
  ]),

  // ——— Master VLSI Engineering Calculators Suite ———
  practical(
    "cadence-pnr",
    "master",
    "vlsi-calculators",
    "Master Practical: VLSI Production Engineering Calculator Suite (34 Calculators)",
    30,
    "Explore 34 production calculators covering Floorplanning, Power Planning, CTS Useful Skew, Process Antenna Diodes, Dynamic IR Drop, and RTL Logic Synthesis.",
    [
      "Size Core and Die dimensions with pad-limited vs core-limited analyzers.",
      "Calculate Power Ring widths, Mesh Stripe pitches, and Multi-Cut Via arrays.",
      "Optimize Clock Tree insertion delays, dynamic clock power, and useful skew.",
      "Evaluate Process Antenna Ratios (PAR) and capacitively coupled crosstalk glitches.",
      "Compute Logic Depth, FO4 metrics, Logical Effort, and CDC Asynchronous FIFO depths.",
    ],
    {
      language: "tcl",
      starter: `# Interactive VLSI Production Engineering Calculator Suite
# Select any calculator in the interactive hub above to generate production Tcl commands.
`,
      checks: [
        { id: "calc", label: "VLSI Calculator Execution", kind: "includes", pattern: "create_" },
      ],
      solution: `# Example: Generated Floorplan and Power Ring Commands
create_floorplan -site CoreSite -core_density_size {0.70 1.0 20 20 20 20}
add_rings -nets {VDD VSS} -type core_rings -width 4.5 -spacing 2.25 -layer {M7 M8}
add_stripes -nets {VDD VSS} -layer M6 -width 2.5 -spacing 2.5 -set_to_set_distance 35.0
`,
    }
  ),
];

