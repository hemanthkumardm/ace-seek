# Logical Reasoning & Hardware Puzzles

Domain: `logical-reasoning-puzzles`  
New questions: **25** (`puz-01` … `puz-25`)

---

### Q01. 1000 Bottles and 10 Rats
- **Suggested id:** `puz-01`
- **Difficulty:** Hard
- **Company style:** Google / Apple hardware
- **Round:** Onsite Technical Round 1
- **Question:**
  You have 1000 wine bottles. Exactly one is poisoned. You have 10 lab rats and can run **one** test round (feed mixtures, wait for the outcome). How do you identify the poisoned bottle? Generalize to $N$ bottles and $k$ rats.
- **Short answer:**
  Encode each bottle index as a unique $k$-bit binary ID. Rat $i$ drinks from every bottle whose ID has bit $i$ set. The pattern of dead/alive rats is the binary index of the poisoned bottle. Capacity is $2^k$ bottles with $k$ rats (here $2^{10}=1024 \ge 1000$).
- **Detailed answer:**
  Treat the outcome of each rat as one bit of information: alive $=0$, dead $=1$. With $k$ independent binary outcomes you learn exactly $k$ bits, so you can distinguish at most $2^k$ hypotheses.

  Number bottles $0 \ldots 999$. Assign bottle $n$ the binary representation $b_{k-1}\ldots b_0$. For each rat $i \in \{0,\ldots,k-1\}$:
  - Feed rat $i$ a sip from every bottle $n$ where bit $b_i(n)=1$.
  - After the incubation window, read the $k$-bit death vector $d_{k-1}\ldots d_0$.
  - That integer is the poisoned bottle index.

  Example with 8 bottles and 3 rats: bottle $5 = 101_2$ is tasted by rats 0 and 2. If rats 0 and 2 die and rat 1 lives, the code is $101_2=5$.

  Information-theoretic bound: one round $\Rightarrow$ at most $2^k$ distinguishable states. Multiple rounds, or “three-state” outcomes, change the bound (e.g. ternary weighing puzzles).
- **Common pitfalls:**
  - Trying one-rat-per-bottle sequential tests (needs 1000 rats or 1000 rounds).
  - Forgetting bottle 0 (all-zero) — no rat drinks it; all alive correctly identifies bottle 0.
  - Claiming capacity is $k$ or $k(k-1)$ instead of $2^k$.
- **Interviewer follow-ups:**
  - How many rats for 1,000,000 bottles in one round?
  - What if up to **two** bottles are poisoned (same one-round model)?
  - Map this to finding a stuck-at-1 net with a parallel XOR signature.
- **Tags:** binary-encoding, information-theory, interview-classic, hardware-analogy

---

### Q02. 25 Horses, 5 Tracks
- **Suggested id:** `puz-02`
- **Difficulty:** Hard
- **Company style:** Google / NVIDIA
- **Round:** Onsite Technical Round 1
- **Question:**
  25 horses; you can race 5 at a time. Find the **top 3** fastest horses with the minimum number of races. Assume transitive, distinct speeds.
- **Short answer:**
  8 races: 5 initial heats, 1 race among the 5 heat winners to rank groups, then 1 final among the only 5 remaining candidates for 2nd/3rd.
- **Detailed answer:**
  1. Split into 5 heats of 5: races R1–R5. Label horses by heat and finish: $A_1>A_2>A_3>A_4>A_5$, similarly $B,C,D,E$ (subscript 1 = heat winner).
  2. Race the five winners: assume $A_1 > B_1 > C_1 > D_1 > E_1$ (race R6). Then $A_1$ is overall #1 (beat every other group’s best, transitively).
  3. Eliminate anyone who cannot possibly be top-3:
     - Entire groups $D$ and $E$ (at least three horses strictly faster than any of them: $A_1,B_1,C_1$).
     - $C_2,C_3,\ldots$ and $B_3,B_4,\ldots$ similarly.
  4. Remaining candidates for #2/#3 besides known #1 $A_1$: $\{A_2, A_3, B_1, B_2, C_1\}$ — exactly five horses. Race them (R7). Top two of that race are overall #2 and #3.

  Total = **8**. You cannot do better in the worst case with this model: after ranking groups you still need one comparison among five contenders.
- **Common pitfalls:**
  - Stopping after 7 races and declaring $B_1$ as #2 without racing $A_2$ vs $B_1$ vs $C_1$.
  - Including $D_1$ in the final (already eliminated).
  - Assuming you need a full sort (far more races).
- **Interviewer follow-ups:**
  - Find top-5 instead of top-3 — how does the candidate set grow?
  - Relate to tournament method / comparison lower bounds $\lceil \log_2(n!)\rceil$.
- **Tags:** tournament, elimination, sorting-lower-bound, classic

---

### Q03. Bridge Crossing with One Flashlight
- **Suggested id:** `puz-03`
- **Difficulty:** Medium
- **Company style:** Amazon / Microsoft
- **Round:** Technical Phone Screen
- **Question:**
  Four people need to cross a bridge at night with one flashlight. Crossing times: 1, 2, 5, and 10 minutes. At most two cross at a time; anytime someone crosses, the flashlight must be carried. The pair moves at the slower person’s speed. Minimize total time.
- **Short answer:**
  Optimal total is **17** minutes. Two canonical strategies; pick the better of “slow pair + fast return” vs “two slow solos with fast shuttle.”
- **Detailed answer:**
  Denote people $A=1, B=2, C=5, D=10$.

  **Strategy 1 (often optimal here):**
  1. $A,B$ cross (2); $A$ returns (1) → 3
  2. $C,D$ cross (10); $B$ returns (2) → 15
  3. $A,B$ cross (2) → **17**

  **Strategy 2:**
  1. $A,B$ cross (2); $A$ returns (1) → 3
  2. $A,D$ cross (10); $A$ returns (1) → 14
  3. $A,C$ cross (5) → **19** (worse here)

  General rule: when two slow people are much slower than the second-fastest, Strategy 1 wins; otherwise Strategy 2 can win. Always compare both.
- **Common pitfalls:**
  - Forgetting the flashlight must return (under-counting).
  - Sending $C$ and $D$ separately without optimizing returns.
- **Interviewer follow-ups:**
  - Times 1, 2, 6, 10 — which strategy wins?
  - Model as a graph shortest path on subset states.
- **Tags:** state-space, optimization, classic-puzzle

---

### Q04. Twelve Balls, One Odd, Three Weighings
- **Suggested id:** `puz-04`
- **Difficulty:** Hard
- **Company style:** Google / Jane Street-style
- **Round:** Onsite Deep-Dive
- **Question:**
  12 balls, identical except one has different weight (heavier **or** lighter, unknown). Find the odd ball **and** whether it is heavy or light in 3 weighings on a balance scale.
- **Short answer:**
  Each weighing has 3 outcomes (L/R/balance) ⇒ $3^3=27$ leaves; need to distinguish $12\times 2=24$ cases — feasible. Partition into thirds and adaptive ternary search with sign tracking.
- **Detailed answer:**
  Information bound: 27 distinguishable outcome sequences; 24 hypotheses + “all equal” unused ⇒ solvable.

  Classic first weighing: weigh $\{1,2,3,4\}$ vs $\{5,6,7,8\}$.
  - **Balance:** odd ball in $\{9,10,11,12\}$. Second weighing e.g. $9,10,11$ vs $1,2,3$ (known good). Unbalance tells which side and polarity; third isolates.
  - **Unbalance:** 8 suspect balls with known “possibly heavy on left / possibly light on right” labels. Remap and weigh a carefully chosen mix of “possibly heavy” vs “possibly light” so each outcome shrinks the hypothesis set by ~3×.

  The invariant: always keep the remaining hypothesis count $\le 3^{w}$ for $w$ weighings left.
- **Common pitfalls:**
  - Weighing 6 vs 6 first (leaves too many hypotheses for 2 weighings).
  - Finding the ball but not determining heavy vs light.
- **Interviewer follow-ups:**
  - Maximum $n$ for 3 weighings with heavy-or-light? ($(3^k-3)/2$ if “all equal” possible, else $(3^k-1)/2$ variants).
  - Only-heavier case: how many balls with 3 weighings? ($3^3=27$).
- **Tags:** ternary-search, balance-scale, information-theory

---

### Q05. Nine Balls, Heavier Only, Two Weighings
- **Suggested id:** `puz-05`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  9 balls; exactly one is heavier. Find it in 2 weighings.
- **Short answer:**
  Ternary split: weigh 3 vs 3. The heavy group (or the untouched 3 if balance) is searched with one more 1-vs-1 weighing.
- **Detailed answer:**
  Weighing 1: balls $\{1,2,3\}$ vs $\{4,5,6\}$.
  - Left heavy ⇒ heavy in $\{1,2,3\}$.
  - Right heavy ⇒ heavy in $\{4,5,6\}$.
  - Balance ⇒ heavy in $\{7,8,9\}$.

  Weighing 2: take two from the suspect trio; heavier is the answer, or if balance the third is heavy.

  General: with $w$ weighings and heavier-only, capacity $3^w$.
- **Common pitfalls:**
  - Starting with 4 vs 4 (works for 9? leaves 1 aside but unbalanced case has 4 suspects — not solvable in one weighing).
- **Interviewer follow-ups:**
  - Extend to 27 balls / 3 weighings.
  - What changes if the odd ball could be lighter?
- **Tags:** ternary-split, balance-scale, warmup

---

### Q06. 50% Duty Clock Divider Without PLL
- **Suggested id:** `puz-06`
- **Difficulty:** Hard
- **Company style:** Qualcomm / Apple silicon
- **Round:** Onsite Technical Round 1
- **Question:**
  Divide an input clock by an **odd** integer $N$ (e.g. 3, 5) and produce a **50% duty cycle** output using only flip-flops and combo logic — no PLL/DLL. How?
- **Short answer:**
  Generate a /N pulse stream on posedge, a delayed /N stream on negedge (or dual-edge technique), then OR/XOR them so high time equals low time of $N/2$ input periods.
- **Detailed answer:**
  A naive mod-$N$ counter toggled on one edge yields duty $1/N$ (or $\lfloor N/2\rfloor/N$), not 50% for odd $N$.

  **Standard digital technique for /3 with 50%:**
  1. Posedge FSM produces a signal high for 1.5 input periods worth of “intent.”
  2. Sample/extend using **negedge** flop so transitions occur on both edges.
  3. OR the posedge-derived and negedge-derived pulses: output period $=3\,T_{in}$, high time $=1.5\,T_{in}$.

  More generally for odd $N$: create a pulse of width $(N+1)/2$ cycles from posedge logic and width $(N-1)/2$ from negedge (or vice versa) and combine so high duration $= N/2$ input half-cycles.

  **Constraints:** need a clean duty-cycle input clock; negedge paths need STA on both edges; glitch-free OR requires registered one-sided pulses. For even $N$, a simple toggle every $N/2$ posedges already gives 50%.
- **Snippet:**
  ```verilog
  // Conceptual /3 50% duty (illustrative)
  // cnt on posedge: 0,1,2,0,...
  // q_pos high when cnt==0 || cnt==1  (2 cycles)
  // q_neg samples delayed version on negedge
  // clk_out = q_pos | q_neg  → high for 1.5 Tin
  ```
- **Common pitfalls:**
  - Claiming “just use a PLL.”
  - Combo XOR of delayed clocks without analyzing glitches.
  - Ignoring that both-edge circuits complicate STA and DFT.
- **Interviewer follow-ups:**
  - How do you divide by 2.5 or 1.5?
  - Glitch-free clock mux vs divider output used as a clock — what SDC is needed?
- **Tags:** clock-divider, duty-cycle, dual-edge, digital-design

---

### Q07. Detect Power-of-Two Integer
- **Suggested id:** `puz-07`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Write a constant-time check that unsigned integer $x$ is a power of two (including discussing $x=0$). Give the bit-twiddling form and a hardware gate view.
- **Short answer:**
  $x \neq 0$ and $(x \,\&\, (x-1)) = 0$. In hardware: OR-reduce of bits is 1 and population count is 1 (or the same $x \& (x-1)$ trick).
- **Detailed answer:**
  Powers of two have exactly one bit set: $1,2,4,8,\ldots$  
  Subtracting 1 clears that bit and sets all lower bits: e.g. $8=1000_2$, $7=0111_2$.  
  Bitwise AND is zero iff there was exactly one set bit.

  $x=0$ must be excluded: $0 \& (-1)$ depends on width; define explicitly `x && !(x & (x-1))`.

  Hardware: for one-hot decode validation, the same property checks legal one-hot selects. Priority encoders often assert an “valid” if popcount==1.
- **Snippet:**
  ```c
  int is_pow2(unsigned x) { return x && !(x & (x - 1)); }
  ```
- **Common pitfalls:**
  - Accepting 0 as a power of two.
  - Using loops / `__builtin_popcount` without discussing HW cost.
- **Interviewer follow-ups:**
  - Detect if $x$ is $2^n-1$ (all-ones) instead.
  - Floor log2 via leading-zero count in synthesis.
- **Tags:** bit-twiddling, one-hot, digital-check

---

### Q08. Swap Without Temporary Register
- **Suggested id:** `puz-08`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Swap two registers/variables without a temporary storage element. Discuss XOR, arithmetic, and why HW usually still uses a temp or enable mux.
- **Short answer:**
  XOR triple: $a&=a\oplus b;\ b&=a\oplus b;\ a&=a\oplus b$. Arithmetic: $a=a+b;\ b=a-b;\ a=a-b$. In RTL, a 2:1 mux pair with enables is clearer and safer.
- **Detailed answer:**
  **XOR method** works iff $a$ and $b$ are distinct storage (same address destroys data). Properties: $x\oplus x=0$, $x\oplus 0=x$.

  **Hardware reality:** a flop cannot read-modify-write three XOR steps in one cycle without intermediate state; synthesizers implement swaps as parallel loads: $a' = b, b' = a$ using two flops’ next-state muxes — no “temp RTL variable” needed because both next-state nets exist physically.

  Interviewers want XOR cleverness **and** the recognition that single-cycle HW swap is just crossed muxing.
- **Snippet:**
  ```verilog
  always_ff @(posedge clk) if (swap) begin
    a <= b;
    b <= a; // both NBs sample old values — legal swap
  end
  ```
- **Common pitfalls:**
  - XOR-swapping a variable with itself / same memory location.
  - Overflow comments on arithmetic swap without modular rings.
- **Interviewer follow-ups:**
  - Swap two wires in a netlist without a temp buffer — possible?
  - Register renaming vs architectural swap in a CPU.
- **Tags:** xor-swap, rtl-nba, bit-twiddling

---

### Q09. Find the Unique Number (XOR Fold)
- **Suggested id:** `puz-09`
- **Difficulty:** Medium
- **Company style:** FAANG phone screen
- **Round:** Technical Phone Screen
- **Question:**
  Array of $2n+1$ integers where every value appears twice except one. Find the unique value in $O(n)$ time and $O(1)$ space. Map to a hardware reduction tree.
- **Short answer:**
  XOR all elements; duplicates cancel ($x\oplus x=0$), unique remains. Hardware: balanced XOR tree over the bus/cycle stream.
- **Detailed answer:**
  Associativity/commutativity of XOR ⇒ order irrelevant.  
  Extension: if every value appears $3\times$ except one appearing $1\times$, use mod-3 bit counters (two bits per bit-position), not plain XOR.

  In HW signature / MISR thinking: folding XOR is a compact parity fingerprint — same algebra as DFT compaction (but X-states poison it).
- **Snippet:**
  ```c
  int uniq(int *a, int n) {
    int x = 0; for (int i = 0; i < n; i++) x ^= a[i]; return x;
  }
  ```
- **Common pitfalls:**
  - Using a hash set (violates $O(1)$ space).
  - Trying XOR when frequency is $3k\pm1$ without mod-3 logic.
- **Interviewer follow-ups:**
  - Exactly two unique numbers, all others duplicated — how? (partition by a set bit of `x^y`).
  - Streaming unique detection with limited on-chip SRAM.
- **Tags:** xor-fold, streaming, hardware-reduction

---

### Q10. Hardware Mutex / Traffic-Light Arbiter
- **Suggested id:** `puz-10`
- **Difficulty:** Hard
- **Company style:** Arm / networking ASIC
- **Round:** Onsite Technical Round 1
- **Question:**
  Design a fair 2-client hardware mutex (or traffic light) so both requesters eventually get the resource, with no combo loop, and define grant timing. Extend to $N$ clients.
- **Short answer:**
  Registered round-robin arbiter: track `last_grant`, compute next grant from rotating priority mask; assert grant one cycle after request sample; never form combo ACK loops through clients.
- **Detailed answer:**
  Requirements: mutual exclusion (≤1 grant), deadlock freedom, starvation freedom (weak fairness).

  **2-client RR:**
  - State bit `pri` prefers A or B.
  - If preferred requests → grant preferred; else grant the other if requesting.
  - On grant, flip `pri` (or set to loser).

  **N-client:** thermometer / rotating priority: `grant = req & -req` style masked by rotate of last winner; use `fixed_pri = ffs(masked_req)` then update pointer.

  **Traffic light analogy:** two roads; green = grant; yellow = pipeline drain (must account for in-flight transactions before releasing).

  Avoid pure combo mutex (`grant_a = req_a & ~grant_b`) — can glitch or livelock under simultaneous requests.
- **Snippet:**
  ```verilog
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin g_a<=0; g_b<=0; pri<=0; end
    else begin
      g_a <= pri ? (req_a | ~req_b) && req_a : (req_a & ~req_b);
      g_b <= pri ? (req_b & ~req_a) : (req_b | ~req_a) && req_b;
      if (g_a) pri <= 1'b1; else if (g_b) pri <= 1'b0;
    end
  end
  ```
- **Common pitfalls:**
  - Combo cross-coupled grants.
  - Priority always fixed → starvation.
  - Forgetting to hold grant until `done`/`release`.
- **Interviewer follow-ups:**
  - Weighted RR / deficit RR for QoS.
  - Async mutex (arbiter) for two clock domains — metastability on requests?
- **Tags:** arbiter, round-robin, mutex, rtl

---

### Q11. Two Eggs, 100 Floors
- **Suggested id:** `puz-11`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Find the critical floor in a 100-story building with 2 eggs, minimizing worst-case drops.
- **Short answer:**
  Equalize worst-case remaining drops: jump intervals of size $k, k-1, \ldots, 1$ with $k(k+1)/2 \ge 100$ ⇒ $k=14$. Worst case = 14 drops.
- **Detailed answer:**
  With 2 eggs, after first egg breaks at attempt $i$, you linear-search at most $(s_i-1)$ floors with the second egg. Let worst-case budget be $k$ drops. Then first-egg attempts should leave $k-1, k-2, \ldots$ remaining drops ⇒ interval lengths $k, k-1, \ldots, 1$.

  Solve $k(k+1)/2 \ge 100$ → $k=14$ since $14\times15/2=105$.

  Strategy: drop first egg from floors 14, 27, 39, … Then linear scan with second egg.
- **Common pitfalls:**
  - Binary search (optimal for ∞ eggs, bad worst-case with 2).
  - Fixed interval 10 → worst case 19.
- **Interviewer follow-ups:**
  - Generalize to $e$ eggs (dynamic programming).
  - Relate to minimizing worst-case ATPG diagnostic depth.
- **Tags:** minimax, dynamic-programming, classic

---

### Q12. Water Jug Measure Exactly 4L
- **Suggested id:** `puz-12`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Jugs of 3L and 5L (unmarked). Measure exactly 4L. State the theorem that governs solvability.
- **Short answer:**
  Yes. Bezout: you can measure any multiple of $\gcd(3,5)=1$. One sequence ends with 4L in the 5L jug.
- **Detailed answer:**
  Operations: fill, empty, pour until empty/full. Reachable volumes are multiples of $\gcd(a,b)$ capped by jug sizes.

  Example sequence:
  1. Fill 5 → `(0,5)`
  2. Pour into 3 → `(3,2)`
  3. Empty 3 → `(0,2)`
  4. Pour remaining 2 into 3 → `(2,0)`
  5. Fill 5 → `(2,5)`
  6. Pour into 3 until full (needs 1) → `(3,4)` ← **4L in the 5L jug**
- **Common pitfalls:**
  - Claiming impossible because neither jug is 4L capacity alone (5L holds 4).
- **Interviewer follow-ups:**
  - Can you measure 4 with 6 and 9? (No — gcd=3 ∤? wait 3|4? No.)
  - Model as BFS on state graph.
- **Tags:** bezout, bfs-state, classic

---

### Q13. Reverse Bits in a Word
- **Suggested id:** `puz-13`
- **Difficulty:** Medium
- **Company style:** DSP / networking ASIC
- **Round:** Technical Phone Screen
- **Question:**
  Reverse the bits of a 32-bit word. Give $O(1)$ SWAR steps and discuss HW wiring cost.
- **Short answer:**
  Parallel swap masks: swap adjacent bits, then 2-bit fields, then nibbles, bytes, 16-bit halves — 5 stages. In silicon, bit-reverse is pure wiring (barrel) or a muxed crossbar if selectable.
- **Detailed answer:**
  Classic SWAR:
  ```text
  x = (x >> 1)  & 0x55555555 | (x & 0x55555555) << 1;
  x = (x >> 2)  & 0x33333333 | (x & 0x33333333) << 2;
  x = (x >> 4)  & 0x0F0F0F0F | (x & 0x0F0F0F0F) << 4;
  x = (x >> 8)  & 0x00FF00FF | (x & 0x00FF00FF) << 8;
  x = (x >> 16) | (x << 16);
  ```
  FFT bit-reversed addressing and CRC path reflections use this. ASIC: if always-on reverse, route bits physically; if runtime endian/bit-order modes, pay mux delay.
- **Common pitfalls:**
  - Looping bit-by-bit in RTL without considering critical path.
- **Interviewer follow-ups:**
  - Reverse bytes only (endian swap) vs reverse all bits.
  - Cost in an FPGA carry chain vs ASIC metal.
- **Tags:** swar, bit-reverse, dsp

---

### Q14. Count Set Bits (Population Count)
- **Suggested id:** `puz-14`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Count the number of 1-bits in a word. Compare Brian Kernighan iteration vs parallel SWAR adder tree; what does HW synthesis usually build?
- **Short answer:**
  Kernighan: `for (;x; cnt++) x &= x-1;` runs popcount times. SWAR sums adjacent fields in $O(\log n)$ steps. HW: compressor tree / `popcount` operator → balanced adder tree.
- **Detailed answer:**
  $x \& (x-1)$ clears the lowest set bit ⇒ Kernighan is optimal among bit-serial methods when density is sparse.

  Parallel:
  ```text
  x = x - ((x>>1) & 0x55555555);
  x = (x & 0x33333333) + ((x>>2) & 0x33333333);
  ...
  ```
  In IEEE 754 / crypto / ECC HW, popcount is a first-class datapath. ATPG care-bit density estimation is the same statistic.
- **Common pitfalls:**
  - Claiming Kernighan is always faster (dense ones hurt).
- **Interviewer follow-ups:**
  - Implement `ctz`/`clz` with similar tricks.
  - Hamming distance = popcount(a^b).
- **Tags:** popcount, kernighan, compressor-tree

---

### Q15. Round Up to Next Power of Two
- **Suggested id:** `puz-15`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  For unsigned $x$, compute the smallest power of two $\ge x$ (define behavior at 0 and overflow).
- **Short answer:**
  Decrement, smear MSBs via `x|=x>>1; >>2; …`, then increment. Or `1 << ceil_log2(x)`.
- **Detailed answer:**
  Algorithm (32-bit):
  ```c
  uint32_t next_pow2(uint32_t x) {
    if (x == 0) return 1;
    x--; // so powers of two stay themselves
    x |= x >> 1; x |= x >> 2; x |= x >> 4;
    x |= x >> 8; x |= x >> 16;
    return x + 1; // undefined/0 on overflow past 2^31 if x>2^31
  }
  ```
  HW: leading-zero count → `1 << (32-clz(x-1))`. Used for FIFO depth sizing and memory bank alignment.
- **Common pitfalls:**
  - Forgetting `x--` causes doubling true powers of two.
- **Interviewer follow-ups:**
  - Floor power of two (`x & -x` isolate / smear differently).
  - Why async FIFO depths are forced to $2^n$.
- **Tags:** bit-smear, alignment, fifo-depth

---

### Q16. Detect Endianness in Hardware/Software
- **Suggested id:** `puz-16`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  How do you detect little-endian vs big-endian in C? How does a bus bridge perform endian conversion without CPU help?
- **Short answer:**
  Store `uint32_t x=1` and inspect the first byte via `char*`. HW bridge byte-swaps lanes with a static crossbar controlled by a mode bit (`{b0,b1,b2,b3}↔{b3,b2,b1,b0}`).
- **Detailed answer:**
  SW:
  ```c
  int little = (*(char*)&(int){1}) == 1;
  ```
  HW: AXI/AHB downsizers must define byte-lane steering. Endian conversion is wiring + mux, but **address invariance** vs **data invariance** conventions differ — get the bus protocol rule right or sparse writes corrupt bytes.

  Note: bit-endianness inside a byte is separate from byte-endianness of a word.
- **Common pitfalls:**
  - Confusing bit order on a serial wire with memory endianness.
- **Interviewer follow-ups:**
  - How does PCIe define endianness?
  - Endian swap on a streaming CRC datastream — where to place it?
- **Tags:** endianness, interconnect, byte-swap

---

### Q17. Odd Division with Dual Counters (50% Revisited)
- **Suggested id:** `puz-17`
- **Difficulty:** Hard
- **Company style:** SerDes / PLL-less SoC
- **Round:** Onsite Deep-Dive
- **Question:**
  Design a divide-by-5 clock with 50% duty using only posedge and negedge flops. Sketch waveforms for $T_{in}$.
- **Short answer:**
  Posedge counter period-5 creates a 3-high/2-low enable; OR with a negedge-shifted replica so edges fall mid-cycle → high time $=2.5\,T_{in}$, period $=5\,T_{in}$.
- **Detailed answer:**
  Target: $T_{out}=5T_{in}$, duty 50% ⇒ high $=2.5T_{in}$.

  1. Posedge mod-5 counter `c`.
  2. `p = (c==0)||(c==1)||(c==2)` // 3 cycles high intent
  3. Negedge flop captures a phase-shifted version `n` aligned so `clk_out = p | n` stretches by half a cycle and clips to 2.5.

  Exact Boolean recipes vary; interviewers expect waveform sketches showing transitions on **both** edges and discussion of:
  - duty distortion under asymmetric $T_{clk_qh}$ vs $T_{clk_ql}$
  - using output only as generated clock with `create_generated_clock`
  - testability (scan cannot easily exercise negedge path unless LOC covers it)
- **Common pitfalls:**
  - Duty 40/60 from posedge-only /5 toggle.
- **Interviewer follow-ups:**
  - Spread-spectrum friendly dividers?
  - Divide-by-1.5 for DDR-style clocks.
- **Tags:** clock-divider, duty-50, waveforms

---

### Q18. Missing Number in 1..N
- **Suggested id:** `puz-18`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Array contains $n$ distinct numbers from $0..n$ with one missing (length $n$). Find the missing number in $O(n)$ time, $O(1)$ space.
- **Short answer:**
  XOR all indices and values, or use sum $n(n+1)/2 - \sum a_i$ with overflow care. XOR preferred in HW.
- **Detailed answer:**
  ```c
  int missing(int *a, int n) {
    int x = n;
    for (int i = 0; i < n; i++) x ^= i ^ a[i];
    return x;
  }
  ```
  Sum method needs wide accumulators. In HW packet checkers, XOR parity lanes are cheaper than adders.
- **Common pitfalls:**
  - Sorting first ($O(n\log n)$).
  - Ignoring overflow on 32-bit sum for large $n$.
- **Interviewer follow-ups:**
  - Two missing numbers.
  - Duplicate **and** missing simultaneously.
- **Tags:** xor, gauss-sum, streaming

---

### Q19. Majority Element (Boyer–Moore)
- **Suggested id:** `puz-19`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Find the majority element (>⌊n/2⌋ occurrences) in linear time, constant space. How would an HW voter for TMR look different?
- **Short answer:**
  Boyer–Moore voting: keep `cand` and `cnt`; increment on match else decrement; reset cand when cnt hits 0. TMR majority is bitwise `(a&b)|(a&c)|(b&c)` — constant 3 inputs, not streaming.
- **Detailed answer:**
  Streaming algorithm cancels minority pairs. Guaranteed correct when a majority exists; otherwise verify with a second pass.

  HW TMR: triple modular redundancy voters are **spatial** majority gates per bit, often with fault-tolerant latching. Not the same as Boyer–Moore (which is algorithmic over a sequence).
- **Common pitfalls:**
  - Returning Boyer–Moore candidate without verifying when majority is not promised.
- **Interviewer follow-ups:**
  - Find element appearing $>n/3$ times (pair of candidates).
  - Soft-error hardened voter placement after SEU-prone flops.
- **Tags:** boyer-moore, tmr, voting

---

### Q20. Glitch-Free Clock Multiplexer
- **Suggested id:** `puz-20`
- **Difficulty:** Staff / Principal
- **Company style:** Apple / Qualcomm SoC
- **Round:** Onsite Deep-Dive
- **Question:**
  Design a glitch-free mux between two asynchronous clocks. Why is a plain `assign clk = sel ? clk_a : clk_b` illegal for clock nets?
- **Short answer:**
  Plain mux glitches when select toggles while either clock is high. Use a registered handshake clock switch: deassert current clock’s enable synchronously, wait for both enables low, then enable the new clock — typically with negedge sensing so switches occur when clocks are low.
- **Detailed answer:**
  Glitch = runt pulse shorter than a legal period → metastability storms downstream.

  **Canonical glitch-free clock switch:**
  1. Synchronize `sel` into each clock domain.
  2. For the active clock, synchronously clear its AND-enable.
  3. Cross-detect that the other domain’s enable is low (sync).
  4. Assert the new clock’s enable only when both paths guarantee no overlap.

  ICGs with carefully timed `EN` are related but assume same-domain enable timing. For fully async sources, use specialized clock-switch cells from the library.

  SDC: generated clocks on mux output; exclusive clock groups for modes; never trust synthesis to “just mux” clocks.
- **Snippet:**
  ```verilog
  // Conceptual: enables registered, clocks AND-gated, OR combined
  // clk_out = (clk_a & en_a) | (clk_b & en_b);
  // with en_a/en_b mutually exclusive and break-before-make
  ```
- **Common pitfalls:**
  - Select switching on posedge without waiting for inactive level.
  - Using LUT mux on FPGA clocks without BUFGMUX primitive.
- **Interviewer follow-ups:**
  - How does `set_clock_groups -logically_exclusive` interact?
  - Bypass modes for scan clocks through the same mux.
- **Tags:** clock-mux, glitch-free, icg, soC

---

### Q21. Priority Encoder from a Request Vector
- **Suggested id:** `puz-21`
- **Difficulty:** Medium
- **Round:** Onsite Technical Round 1
- **Question:**
  Given an $N$-bit one-hot-or-more request vector, design a priority encoder returning the index of the least-significant set bit. Discuss timing vs area (linear cascade vs tree).
- **Short answer:**
  LSB-first find-first-set: `idx = ffs(req)`, `oh = req & -req` in two’s complement. Tree prefix OR reduces $O(N)$ delay to $O(\log N)$.
- **Detailed answer:**
  Isolate lowest set bit: `lsb = req & -req` (two’s complement). Then encode that one-hot to binary via OR-of-bits with weights.

  Timing: naive for-loop priority is a long OR chain — bad at $N=256$. Use hierarchical priority (bytes then among bytes).

  Round-robin reuse: mask off bits ≤ last grant, FFS on masked, if zero FFS on unmasked.
- **Common pitfalls:**
  - Returning X when req=0 without a `valid` flag.
- **Interviewer follow-ups:**
  - Leading-zero count vs trailing-zero count silicon cells.
  - Thermometer encode for thermometer ADCs.
- **Tags:** priority-encoder, ffs, arbitration

---

### Q22. One-Hot ↔ Binary Conversion
- **Suggested id:** `puz-22`
- **Difficulty:** Medium
- **Round:** Technical Phone Screen
- **Question:**
  Convert between one-hot and binary. Why do FSMs sometimes prefer one-hot encoding in ASICs/FPGAs?
- **Short answer:**
  Binary→one-hot: decoder. One-hot→binary: priority/OR encoder. One-hot FSMs simplify next-state (often single bit set) at cost of more flops; FPGAs with abundant FFs like one-hot.
- **Detailed answer:**
  Illegal multi-hot states need detection for safety-critical FSMs (`popcount!=1`). Sparse one-hot can reduce combo depth on next-state logic: transition logic becomes “if bit_i and cond then bit_j.”

  Area trade: $S$ states need $S$ flops (one-hot) vs $\lceil\log_2 S\rceil$ (binary). For small $S$, one-hot often wins timing.
- **Common pitfalls:**
  - No illegal-state recovery reset path.
- **Interviewer follow-ups:**
  - Gray-coded FSM vs one-hot for async outputs.
  - Safe FSM encoding in DO-254 flows.
- **Tags:** one-hot, fsm-encoding, decoder

---

### Q23. Two Unique Numbers via XOR Partition
- **Suggested id:** `puz-23`
- **Difficulty:** Hard
- **Round:** Onsite Technical Round 1
- **Question:**
  Every element appears twice except two unique numbers $p$ and $q$. Find both in $O(n)$ time / $O(1)$ space.
- **Short answer:**
  XOR all → `x = p^q`. Pick any set bit of `x`; partition the array by that bit; XOR each partition to recover $p$ and $q$ separately.
- **Detailed answer:**
  Because $p\neq q$, $x\neq 0$ has a distinguishing bit $b$.  
  For each element, bucket by whether bit $b$ is set. Duplicates land in the same bucket and cancel; $p$ and $q$ fall into different buckets.

  Hardware map: two parallel XOR trees steered by bit $b$ from a first-pass XOR (needs two passes or stored stream).
- **Common pitfalls:**
  - Trying to divide `x` arithmetically.
  - Picking bit 0 always — fails when $p^q$ has bit0 clear (still OK if you pick **a** set bit of `x`).
- **Interviewer follow-ups:**
  - Three uniques — what’s the lower bound?
  - Same problem modulo sorting / bloom filters under memory caps.
- **Tags:** xor-partition, streaming, bit-twiddling

---

### Q24. Traffic Light Timing Puzzle (HW FSM)
- **Suggested id:** `puz-24`
- **Difficulty:** Medium
- **Company style:** embedded / SoC integration
- **Round:** Hiring Manager Round
- **Question:**
  Design a 4-way traffic light controller FSM: G→Y→R with pedestrian walk request, guaranteeing no green-green conflict and bounded wait for walk. What hazard exists if outputs are combo-decoded from state?
- **Short answer:**
  Use registered outputs (Moore) with explicit all-red clearance states; walk request sticky flag; max timers. Mealy combo outputs can glitch → brief green-green hazard on state transitions.
- **Detailed answer:**
  States include `NS_G, NS_Y, ALL_RED1, EW_G, EW_Y, ALL_RED2, WALK`.  
  Mutual exclusion via one-hot state + registered lamp outputs. Pedestrian `WALK_REQ` is sticky until serviced. Deadlock avoidance: free-run timers always advance; walk has priority after next all-red.

  **Hazard:** if lamps = combo function of state bits during one-hot transition (brief multi-hot from skew), two greens can glitch high. Fix: registered outputs or Gray/safe encoding with synchronized enables.
- **Common pitfalls:**
  - No all-red interval (intersection conflict under slow cars).
  - Combo lamp decode without glitch analysis.
- **Interviewer follow-ups:**
  - How to formally prove exclusion with assertions?
  - Degraded night-flash mode.
- **Tags:** fsm, safety, registered-outputs, traffic-light

---

### Q25. Is $n$ a Power of Two? + Isolate Lowest Set Bit (Hardware Combo)
- **Suggested id:** `puz-25`
- **Difficulty:** Hard
- **Company style:** CPU / allocator HW
- **Round:** Onsite Deep-Dive
- **Question:**
  In allocator / free-list hardware, you often need (a) isolate lowest free way, (b) clear it, (c) test if exactly one bit remains. Give a gate-efficient bit toolkit combining `x & -x`, `x & (x-1)`, and discuss two’s complement assumption.
- **Short answer:**
  `lowest = x & -x` isolates LSB set; `x & (x-1)` clears it; both zero-checks classify empty / singleton / multi. Requires reliable two’s complement negation (`-x = ~x+1`).
- **Detailed answer:**
  Toolkit:
  | Expression | Meaning |
  |---|---|
  | `x & -x` | lowest set bit one-hot |
  | `x & (x-1)` | clear lowest set bit |
  | `x ^ (x-1)` | mask through lowest set bit |
  | `x \| (x-1)` | smear right through lowest set |

  Free-list pop: `grant_oh = req & -req; req_next = req & ~grant_oh`.  
  Exact one-hot check: `x && !(x & (x-1))`.

  Synthesis: modern tools map `-x` to efficient increment/invert; still document signedness. In formal, prove `popcount(grant_oh)==1` when `req!=0`.
- **Common pitfalls:**
  - Using unsigned negation incorrectly in narrow widths.
  - Forgetting `req==0` valid=0 path.
- **Interviewer follow-ups:**
  - Find **highest** set bit without `clz` cell.
  - Parallel prefix “priority mask” for multi-grant.
- **Tags:** bit-toolkit, allocator, two’s-complement, one-hot
