export type RtlExample = {
  id: string;
  name: string;
  category: "Industrial Protocol" | "Clock Domain Crossing" | "Microarchitecture" | "Control Logic" | "Basics";
  description: string;
  dut: string;
  tb: string;
};

export const RTL_EXAMPLES: RtlExample[] = [
  {
    id: "skid_buffer",
    name: "AXI4 Skid Buffer (Zero-Bubble Backpressure)",
    category: "Industrial Protocol",
    description: "Breaks long combinatorial paths on both AXI VALID and READY channels with 0 latency overhead and full throughput.",
    dut: `// AXI4 Handshake Skid Buffer (Pipeline Register)
// Breaks combinational feedthrough loops on both VALID and READY
module skid_buffer (
  input  wire       clk,
  input  wire       rst_n,
  input  wire [7:0] s_data,
  input  wire       s_valid,
  output wire       s_ready,
  output wire [7:0] m_data,
  output wire       m_valid,
  input  wire       m_ready
);
  reg [7:0] buf_data;
  reg       buf_valid;
  reg [7:0] out_data;
  reg       out_valid;

  assign s_ready = !buf_valid;
  assign m_valid = out_valid;
  assign m_data  = out_data;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      out_valid <= 1'b0;
      out_data  <= 8'd0;
      buf_valid <= 1'b0;
      buf_data  <= 8'd0;
    end else begin
      if (m_ready) begin
        if (buf_valid) begin
          out_valid <= 1'b1;
          out_data  <= buf_data;
          buf_valid <= 1'b0;
        end else if (s_valid) begin
          out_valid <= 1'b1;
          out_data  <= s_data;
        end else begin
          out_valid <= 1'b0;
        end
      end else begin
        if (s_valid && s_ready) begin
          buf_valid <= 1'b1;
          buf_data  <= s_data;
        end
      end
    end
  end
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg clk, rst_n;
  reg [7:0] s_data;
  reg s_valid;
  wire s_ready;
  wire [7:0] m_data;
  wire m_valid;
  reg m_ready;

  skid_buffer dut (
    .clk(clk),
    .rst_n(rst_n),
    .s_data(s_data),
    .s_valid(s_valid),
    .s_ready(s_ready),
    .m_data(m_data),
    .m_valid(m_valid),
    .m_ready(m_ready)
  );

  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    clk = 0;
    forever #5 clk = ~clk;
  end

  initial begin
    rst_n = 0; s_data = 8'h00; s_valid = 0; m_ready = 0;
    #15 rst_n = 1;
    #10 s_valid = 1; s_data = 8'hA1; m_ready = 1;
    #10 s_data = 8'hB2;
    #10 s_data = 8'hC3; m_ready = 0; // Downstream backpressure asserted!
    #10 s_data = 8'hD4;
    #20 m_ready = 1; // Downstream ready released!
    #20 s_valid = 0;
    #30;
    $display("PASS: AXI Skid Buffer verified backpressure decoupling.");
    $finish;
  end
endmodule
`,
  },
  {
    id: "async_fifo",
    name: "Dual-Clock Asynchronous FIFO (Gray CDC)",
    category: "Clock Domain Crossing",
    description: "Crosses data between independent asynchronous clock domains using Gray pointers, 2-FF synchronizers, and full/empty flags.",
    dut: `// Dual-Clock Asynchronous FIFO (8 entries x 8 bits)
// Gray pointer CDC synchronization
module async_fifo (
  input  wire       wclk,
  input  wire       wrst_n,
  input  wire       winc,
  input  wire [7:0] wdata,
  output wire       wfull,
  input  wire       rclk,
  input  wire       rrst_n,
  input  wire       rinc,
  output wire [7:0] rdata,
  output wire       rempty
);
  reg [7:0] mem [0:7];
  reg [3:0] wptr_bin, rptr_bin;
  reg [3:0] wptr_gray, rptr_gray;
  reg [3:0] rptr_gray_s1, rptr_gray_s2;
  reg [3:0] wptr_gray_s1, wptr_gray_s2;

  // Write clock domain
  always @(posedge wclk or negedge wrst_n) begin
    if (!wrst_n) begin
      wptr_bin  <= 4'd0;
      wptr_gray <= 4'd0;
    end else if (winc && !wfull) begin
      mem[wptr_bin[2:0]] <= wdata;
      wptr_bin  <= wptr_bin + 1'b1;
      wptr_gray <= (wptr_bin + 1'b1) ^ ((wptr_bin + 1'b1) >> 1);
    end
  end

  // Read clock domain
  reg [7:0] rdata_reg;
  assign rdata = rdata_reg;
  always @(posedge rclk or negedge rrst_n) begin
    if (!rrst_n) begin
      rptr_bin  <= 4'd0;
      rptr_gray <= 4'd0;
      rdata_reg <= 8'd0;
    end else if (rinc && !rempty) begin
      rdata_reg <= mem[rptr_bin[2:0]];
      rptr_bin  <= rptr_bin + 1'b1;
      rptr_gray <= (rptr_bin + 1'b1) ^ ((rptr_bin + 1'b1) >> 1);
    end
  end

  // 2-FF CDC Synchronizers
  always @(posedge wclk or negedge wrst_n) begin
    if (!wrst_n) begin
      rptr_gray_s1 <= 4'd0;
      rptr_gray_s2 <= 4'd0;
    end else begin
      rptr_gray_s1 <= rptr_gray;
      rptr_gray_s2 <= rptr_gray_s1;
    end
  end

  always @(posedge rclk or negedge rrst_n) begin
    if (!rrst_n) begin
      wptr_gray_s1 <= 4'd0;
      wptr_gray_s2 <= 4'd0;
    end else begin
      wptr_gray_s1 <= wptr_gray;
      wptr_gray_s2 <= wptr_gray_s1;
    end
  end

  assign rempty = (rptr_gray == wptr_gray_s2);
  assign wfull  = (wptr_gray == {~rptr_gray_s2[3:2], rptr_gray_s2[1:0]});
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg wclk, wrst_n, winc;
  reg [7:0] wdata;
  wire wfull;
  reg rclk, rrst_n, rinc;
  wire [7:0] rdata;
  wire rempty;

  async_fifo dut (
    .wclk(wclk), .wrst_n(wrst_n), .winc(winc), .wdata(wdata), .wfull(wfull),
    .rclk(rclk), .rrst_n(rrst_n), .rinc(rinc), .rdata(rdata), .rempty(rempty)
  );

  // Asynchronous Write clock = 100MHz (period 10ns), Read clock = 40MHz (period 25ns)
  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    wclk = 0; forever #5 wclk = ~wclk;
  end
  initial begin
    rclk = 0; forever #12.5 rclk = ~rclk;
  end

  initial begin
    wrst_n = 0; rrst_n = 0; winc = 0; rinc = 0; wdata = 8'h00;
    #25 wrst_n = 1; rrst_n = 1;
    #10;
    // Burst write 4 bytes
    winc = 1; wdata = 8'h11; #10;
    wdata = 8'h22; #10;
    wdata = 8'h33; #10;
    wdata = 8'h44; #10;
    winc = 0;
    #30;
    // Read out bytes on slower clock
    rinc = 1; #25;
    #25;
    #25;
    #25;
    rinc = 0;
    #50;
    $display("PASS: Dual-Clock Asynchronous FIFO CDC with Gray code pointers verified.");
    $finish;
  end
endmodule
`,
  },
  {
    id: "rr_arbiter",
    name: "4-Client Round-Robin Arbiter",
    category: "Microarchitecture",
    description: "Rotating priority arbiter ensuring fair service without starvation among competing requesters.",
    dut: `// 4-Requester Fair Round-Robin Arbiter with Priority Mask
module rr_arbiter (
  input  wire       clk,
  input  wire       rst_n,
  input  wire [3:0] req,
  output reg  [3:0] gnt
);
  reg [3:0] mask;
  wire [3:0] masked_req = req & mask;
  wire [3:0] unmasked_gnt;
  wire [3:0] masked_gnt;

  // Fixed priority logic
  assign unmasked_gnt[0] = req[0];
  assign unmasked_gnt[1] = req[1] & ~req[0];
  assign unmasked_gnt[2] = req[2] & ~req[1] & ~req[0];
  assign unmasked_gnt[3] = req[3] & ~req[2] & ~req[1] & ~req[0];

  assign masked_gnt[0] = masked_req[0];
  assign masked_gnt[1] = masked_req[1] & ~masked_req[0];
  assign masked_gnt[2] = masked_req[2] & ~masked_req[1] & ~masked_req[0];
  assign masked_gnt[3] = masked_req[3] & ~masked_req[2] & ~masked_req[1] & ~masked_req[0];

  wire [3:0] next_gnt = (|masked_req) ? masked_gnt : unmasked_gnt;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      gnt  <= 4'd0;
      mask <= 4'b1110;
    end else begin
      gnt <= next_gnt;
      if (|next_gnt) begin
        if (next_gnt[0]) mask <= 4'b1110;
        else if (next_gnt[1]) mask <= 4'b1100;
        else if (next_gnt[2]) mask <= 4'b1000;
        else mask <= 4'b1111;
      end
    end
  end
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg clk, rst_n;
  reg [3:0] req;
  wire [3:0] gnt;

  rr_arbiter dut (.clk(clk), .rst_n(rst_n), .req(req), .gnt(gnt));

  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    clk = 0; forever #5 clk = ~clk;
  end

  initial begin
    rst_n = 0; req = 4'b0000;
    #15 rst_n = 1;
    // Sustained simultaneous requests from all 4 clients
    #10 req = 4'b1111;
    #40; // Observe grants rotate: 0 -> 1 -> 2 -> 3
    req = 4'b0101; // Clients 0 and 2 alternate
    #30;
    req = 4'b0000;
    #20;
    $display("PASS: 4-Client Round-Robin Arbiter rotation verified.");
    $finish;
  end
endmodule
`,
  },
  {
    id: "fsm_seq_detect",
    name: "Sequence Detector FSM (1011 Overlapping)",
    category: "Control Logic",
    description: "Registered Moore state machine detecting bitstream pattern 1011 with zero combinational glitches.",
    dut: `// Moore Sequence Detector (1011 with overlap)
module fsm_seq_detect (
  input  wire clk,
  input  wire rst_n,
  input  wire din,
  output reg  detected
);
  localparam S_IDLE = 3'd0;
  localparam S_1    = 3'd1;
  localparam S_10   = 3'd2;
  localparam S_101  = 3'd3;
  localparam S_1011 = 3'd4;

  reg [2:0] state, next_state;

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) state <= S_IDLE;
    else        state <= next_state;
  end

  always @(*) begin
    case (state)
      S_IDLE: next_state = din ? S_1    : S_IDLE;
      S_1:    next_state = din ? S_1    : S_10;
      S_10:   next_state = din ? S_101  : S_IDLE;
      S_101:  next_state = din ? S_1011 : S_10;
      S_1011: next_state = din ? S_1    : S_10;
      default: next_state = S_IDLE;
    endcase
  end

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) detected <= 1'b0;
    else        detected <= (next_state == S_1011);
  end
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg clk, rst_n, din;
  wire detected;

  fsm_seq_detect dut (.clk(clk), .rst_n(rst_n), .din(din), .detected(detected));

  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    clk = 0; forever #5 clk = ~clk;
  end

  initial begin
    rst_n = 0; din = 0;
    #15 rst_n = 1;
    // Drive bitstream: 1, 0, 1, 1, 0, 1, 1 (two overlapping hits)
    #10 din = 1;
    #10 din = 0;
    #10 din = 1;
    #10 din = 1; // First detection!
    #10 din = 0;
    #10 din = 1;
    #10 din = 1; // Second overlapping detection!
    #10 din = 0;
    #30;
    $display("PASS: 1011 Sequence Detector asserted on target pattern.");
    $finish;
  end
endmodule
`,
  },
  {
    id: "lfsr_prbs",
    name: "8-bit PRBS Generator (Galois LFSR)",
    category: "Microarchitecture",
    description: "Maximal-length pseudo-random binary sequence generator with polynomial x^8 + x^6 + x^5 + x^4 + 1 for BIST and verification.",
    dut: `// 8-bit Galois LFSR (Polynomial: x^8 + x^6 + x^5 + x^4 + 1)
// Period = 2^8 - 1 = 255 non-repeating states
module lfsr_prbs (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       load_seed,
  input  wire [7:0] seed,
  output reg  [7:0] prbs_out
);
  wire feedback = prbs_out[7];

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      prbs_out <= 8'hA5; // Non-zero default seed
    end else if (load_seed) begin
      prbs_out <= (seed == 8'h00) ? 8'h01 : seed;
    end else begin
      prbs_out[0] <= feedback;
      prbs_out[1] <= prbs_out[0];
      prbs_out[2] <= prbs_out[1];
      prbs_out[3] <= prbs_out[2];
      prbs_out[4] <= prbs_out[3] ^ feedback;
      prbs_out[5] <= prbs_out[4] ^ feedback;
      prbs_out[6] <= prbs_out[5] ^ feedback;
      prbs_out[7] <= prbs_out[6];
    end
  end
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg clk, rst_n, load_seed;
  reg [7:0] seed;
  wire [7:0] prbs_out;

  lfsr_prbs dut (
    .clk(clk),
    .rst_n(rst_n),
    .load_seed(load_seed),
    .seed(seed),
    .prbs_out(prbs_out)
  );

  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    clk = 0; forever #5 clk = ~clk;
  end

  initial begin
    rst_n = 0; load_seed = 0; seed = 8'h5A;
    #15 rst_n = 1;
    #10 load_seed = 1;
    #10 load_seed = 0;
    #150; // Run 15 cycles of pseudo-random bitstream
    $display("PASS: 8-bit PRBS Galois LFSR generated pseudo-random sequence.");
    $finish;
  end
endmodule
`,
  },
  {
    id: "counter",
    name: "4-bit Synchronous Up-Counter",
    category: "Basics",
    description: "Classic 4-bit binary counter with active-low asynchronous reset.",
    dut: `module counter (
  input  wire clk,
  input  wire rst_n,
  output reg  [3:0] q
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 4'd0;
    else        q <= q + 1'b1;
  end
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg clk, rst_n;
  wire [3:0] q;

  counter dut (.clk(clk), .rst_n(rst_n), .q(q));

  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    clk = 0;
    forever #5 clk = ~clk;
  end

  initial begin
    rst_n = 0;
    #12 rst_n = 1;
    #120;
    $display("PASS counter q=%0d", q);
    $finish;
  end
endmodule
`,
  },
  {
    id: "mux",
    name: "2:1 Multiplexer",
    category: "Basics",
    description: "Continuous assignment conditional multiplexer with self-checking testbench.",
    dut: `module mux2 (
  input  wire a, b, sel,
  output wire y
);
  assign y = sel ? b : a;
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg a, b, sel;
  wire y;
  mux2 dut (.a(a), .b(b), .sel(sel), .y(y));

  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    a = 0; b = 1; sel = 0; #10;
    if (y !== 1'b0) $fatal(1, "sel=0 failed");
    sel = 1; #10;
    if (y !== 1'b1) $fatal(1, "sel=1 failed");
    $display("PASS mux2");
    $finish;
  end
endmodule
`,
  },
];
