import { runTcl, runPython, runPerl, runBash } from "../src/lib/lang-labs/run-lang";

const tcl = runTcl(`set clocks {clk_core clk_periph}
set period 2.0
proc emit {names t} {
  foreach n $names {
    puts "create_clock -name $n -period $t"
  }
}
emit $clocks $period
puts "count = [llength $clocks]"`);
console.log("TCL", tcl);

const py = runPython(`cells = ["dfxtp_1", "nand2_1"]
print(f"count={len(cells)}")
print(cells[0])`);
console.log("PY", py);

const pl = runPerl(`my $wns = "-0.42";
my @paths = ("alu/q", "mac/acc");
print "WNS=$wns\\n";
foreach my $p (@paths) {
  print "ep $p\\n";
}`);
console.log("PERL", pl);

const sh = runBash(`CORNER=ss_125c
echo "STA $CORNER"`);
console.log("BASH", sh);

if (!tcl.ok || !String(tcl.stdout).includes("create_clock") || !String(tcl.stdout).includes("count = 2")) {
  process.exit(1);
}
if (!pl.ok || !String(pl.stdout).includes("alu/q")) process.exit(1);
console.log("ok");
