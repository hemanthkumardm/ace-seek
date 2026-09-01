export type RtlExample = {
  id: string;
  name: string;
  dut: string;
  tb: string;
};

export const RTL_EXAMPLES: RtlExample[] = [
  {
    id: "counter",
    name: "4-bit counter",
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
    name: "2:1 mux",
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
  {
    id: "dff",
    name: "D flip-flop",
    dut: `module dff (
  input  wire clk, rst_n, d,
  output reg  q
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 1'b0;
    else        q <= d;
  end
endmodule
`,
    tb: `\`timescale 1ns/1ps
module tb;
  reg clk, rst_n, d;
  wire q;
  dff dut (.clk(clk), .rst_n(rst_n), .d(d), .q(q));

  initial begin
    clk = 0;
    forever #5 clk = ~clk;
  end

  initial begin
    $dumpfile("wave.vcd");
    $dumpvars(0, tb);
    rst_n = 0; d = 0;
    #12 rst_n = 1;
    d = 1; #10;
    d = 0; #10;
    d = 1; #20;
    $display("PASS dff q=%0d", q);
    $finish;
  end
endmodule
`,
  },
];
