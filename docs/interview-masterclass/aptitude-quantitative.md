# Quantitative Aptitude & Engineering Math

Domain id: `aptitude-quantitative`  
Audience: Nvidia / Qualcomm / Apple / Intel / AMD Staff–Principal VLSI interviews  
Questions: 25

---

### Q01. Two dice sum probability
- **Suggested id:** `apt-01`
- **Difficulty:** Medium
- **Company style:** Qualcomm
- **Round:** Technical Phone Screen
- **Question:**
  Two fair dice are rolled. What is P(sum = 7)? P(sum ≥ 10)? P(sum = 7 | first die shows 3)?
- **Short answer:**
  P(sum=7)=6/36=1/6. P(sum≥10)=6/36=1/6. P(sum=7|first=3)=1/6 (second must be 4).
- **Detailed answer:**
  Sample space size 36.

  Sum=7 outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) → **6/36 = 1/6**.

  Sum≥10: sum10 (3), sum11 (2), sum12 (1) → **6/36 = 1/6**.

  Conditional: given first die = 3 (6 equally likely second faces), only second=4 works → **1/6**.

  Note: P(sum=7) equals P(sum=7|first=3) here by symmetry of the complementary face.
- **Common pitfalls:**
  - Counting (3,4) and (4,3) as one outcome.
  - Using 12 as denominator (sums) instead of 36 (ordered pairs).
- **Interviewer follow-ups:**
  - P(both same | sum even)?
  - Expected value of the sum?
- **Tags:** probability, dice, conditional

---

### Q02. Cards: flush and combinations
- **Suggested id:** `apt-02`
- **Difficulty:** Medium
- **Company style:** Qualcomm
- **Round:** Technical Phone Screen
- **Question:**
  From a 52-card deck, you draw 5 cards. Approximate P(all 5 same suit) (flush including straight-flush). Compute exactly using combinations.
- **Short answer:**
  Exact: \(4\cdot\binom{13}{5}/\binom{52}{5} = 5148 / 2598960 ≈ 0.198\%\).
- **Detailed answer:**
  \(\binom{52}{5} = 2598960\).

  Per suit: \(\binom{13}{5} = 1287\). Four suits → \(4×1287 = 5148\).

  \(P = 5148 / 2598960 = 1287 / 649740 ≈ 0.001981\).

  Poker “flush” excludes straight-flushes; interview usually wants the combination setup, not poker taxonomy.
- **Common pitfalls:**
  - Using \(4/52 × 3/51 ...\) without ordering correction inconsistently.
  - \(\binom{13}{5}×4!\) incorrectly.
- **Interviewer follow-ups:**
  - P(exactly 3 aces in 5 cards)?
  - Hypergeometric general form?
- **Tags:** combinatorics, cards, hypergeometric

---

### Q03. Light Bayes: defective chips
- **Suggested id:** `apt-03`
- **Difficulty:** Hard
- **Company style:** Intel
- **Round:** Onsite Technical Round 1
- **Question:**
  Line A makes 70% of chips, Line B 30%. P(defect|A)=1%, P(defect|B)=3%. Given a defective chip, what is P(from B)?
- **Short answer:**
  By Bayes: P(B|D) = 0.09 / 0.016 = **0.5625 (56.25%)**.
- **Detailed answer:**
  \(P(D) = 0.7·0.01 + 0.3·0.03 = 0.007 + 0.009 = 0.016\).

  \(P(B|D) = \dfrac{P(D|B)P(B)}{P(D)} = \dfrac{0.03·0.3}{0.016} = \dfrac{0.009}{0.016} = 0.5625\).

  Despite B making fewer chips, its higher defect rate means most observed defectives still come from B.
- **Common pitfalls:**
  - Answering 30% or 3% without Bayes.
  - Mixing up P(B|D) vs P(D|B).
- **Interviewer follow-ups:**
  - If prior on B becomes 10%, recompute.
  - How does this relate to yield triage across fabs?
- **Tags:** bayes, yield, probability

---

### Q04. BER vs SNR intuition (AWGN BPSK)
- **Suggested id:** `apt-04`
- **Difficulty:** Staff / Principal
- **Company style:** Qualcomm
- **Round:** Onsite Deep-Dive
- **Question:**
  For antipodal BPSK in AWGN, BER = Q(\(\sqrt{2E_b/N_0}\)). If SNR (\(E_b/N_0\)) improves by 3 dB from 7 dB to 10 dB, does BER drop by ~2×, ~10×, or more? Explain using the Q-function tail.
- **Short answer:**
  Roughly **more than 10×** improvement in this region — Q-tail decays super-exponentially in the argument, not linearly with linear SNR.
- **Detailed answer:**
  3 dB ⇒ double linear \(E_b/N_0\). Argument of Q grows by \(\sqrt{2}\approx1.414×\).

  At ~7 dB, \(E_b/N_0≈5.0\), \(\sqrt{2E_b/N_0}\approx\sqrt{10}\approx3.16\), Q(3.16)≈7.9e-4.

  At 10 dB, \(E_b/N_0≈10\), \(\sqrt{20}\approx4.47\), Q(4.47)≈3.9e-6.

  Ratio ≈ 200× — order-of-magnitude “much more than 10×.” Staff point: never assume BER scales like 1/SNR in the error-floor region; coding/SNR margins are nonlinear.
- **Common pitfalls:**
  - Saying BER halves when SNR doubles.
  - Confusing \(E_b/N_0\) with channel SNR including rate.
- **Interviewer follow-ups:**
  - What does 0.1 dB mean at 1e-15 BER for SerDes?
  - Relation of Q to erfc: \(Q(x)=\tfrac{1}{2}\mathrm{erfc}(x/\sqrt{2})\)?
- **Tags:** ber, snr, q-function, serdes

---

### Q05. Pipeline throughput and latency
- **Suggested id:** `apt-05`
- **Difficulty:** Medium
- **Company style:** Nvidia
- **Round:** Technical Phone Screen
- **Question:**
  A 6-stage pipeline runs at 1 GHz, one instruction issue per cycle (ideal). (a) Latency of one instruction? (b) Steady-state throughput? (c) Time to finish 1000 instructions assuming fill penalty only at start and no stalls?
- **Short answer:**
  (a) 6 ns. (b) 1 instr/ns = 1 GIPS. (c) 6 + 999 = 1005 ns (fill then 999 more completions).
- **Detailed answer:**
  Clock period \(T=1\) ns.

  (a) Latency = \(6T = 6\) ns.

  (b) After fill, throughput = \(1/T = 1\) instruction/ns.

  (c) First instruction completes at t=6 ns; thereafter one completion per ns → remaining 999 complete at t=6+999=**1005 ns**.

  Equivalently: \(T_{total} = (N + D - 1)T\) for depth D, N items, no stalls → \((1000+6-1)·1 = 1005\) ns.
- **Common pitfalls:**
  - Saying throughput is 1/6 GIPS (confusing latency with throughput).
  - Using \(N·D\) cycles.
- **Interviewer follow-ups:**
  - With 10% stall cycles, effective CPI?
  - Dual-issue: how do formulas change?
- **Tags:** pipeline, throughput, latency, cpi

---

### Q06. Two’s complement arithmetic
- **Suggested id:** `apt-06`
- **Difficulty:** Medium
- **Company style:** Intel
- **Round:** Technical Phone Screen
- **Question:**
  In 8-bit two’s complement, what are the decimal values of `0x7F`, `0x80`, `0xFF`? Compute `0x80 - 0x01` and explain overflow. What is the range of an n-bit two’s complement integer?
- **Short answer:**
  127, −128, −1. `0x80−0x01=0x7F=+127` (modular wrap; overflow from −128). Range: \([-2^{n-1}, 2^{n-1}-1]\).
- **Detailed answer:**
  MSB weight \(-2^{7}\) for signed interpretation.

  - `0111_1111` = 127  
  - `1000_0000` = −128  
  - `1111_1111` = −1  

  \(-128 - 1\) is not representable; hardware add of `0x80 + 0xFF` (two’s complement of 1) = `0x7F` with overflow flag.

  Range n-bit: \([-2^{n-1}, 2^{n-1}-1]\). Asymmetric: one more negative value.
- **Common pitfalls:**
  - Claiming `0x80` is −127.
  - Saying signed range is ±127 for 8-bit.
- **Interviewer follow-ups:**
  - How do you detect overflow in signed add using sign bits?
  - Absolute value of `0x80` in 8-bit?
- **Tags:** twos-complement, overflow, binary

---

### Q07. Popcount and bit tricks
- **Suggested id:** `apt-07`
- **Difficulty:** Hard
- **Company style:** Apple
- **Round:** Onsite Technical Round 1
- **Question:**
  How many 1-bits in `0xF0F0` (16-bit)? Give an O(k) algorithm clearing lowest set bits, and state hardware popcount complexity vs width.
- **Short answer:**
  Eight ones. Algorithm: loop `x &= x-1` counting iterations until 0 — O(popcount). Hardware: parallel reduction tree O(log n) depth, O(n) Xor/Add area.
- **Detailed answer:**
  `0xF0F0 = 1111_0000_1111_0000` → 8 ones.

  Kernighan:
  ```c
  for (c = 0; x; c++) x &= x - 1;
  ```
  Each step clears the lowest set bit.

  HW: pairwise sum bits → CSA/adder tree; depth \(\lceil\log_2 n\rceil\) adder stages (more precisely log of reduction). Big-O area Θ(n).
- **Common pitfalls:**
  - Counting hex digits F as 4 without zeros.
  - Claiming software O(1) for arbitrary width.
- **Interviewer follow-ups:**
  - Isolate lowest set bit with `x & -x`?
  - Parity vs popcount mod 2?
- **Tags:** popcount, bit-manipulation, complexity

---

### Q08. Big-O of hardware structures
- **Suggested id:** `apt-08`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia
- **Round:** Onsite Deep-Dive
- **Question:**
  Give asymptotic area and delay (in gate delays / logic levels, ignoring wire) for: (a) N-bit ripple adder, (b) N-bit carry-lookahead (ideal), (c) N×N combinational multiplier array, (d) N-input one-hot mux tree.
- **Short answer:**
  (a) Area O(N), delay O(N). (b) Area O(N), delay O(log N). (c) Area O(N²), delay O(N) (array) or better with trees. (d) Area O(N), delay O(log N).
- **Detailed answer:**
  | Structure | Area | Delay |
  |---|---|---|
  | Ripple-carry adder | Θ(N) | Θ(N) |
  | CLA / parallel-prefix (Kogge-Stone) | Θ(N log N) typically | Θ(log N) |
  | Array multiplier | Θ(N²) | Θ(N) |
  | Wallace/Dadda + CPA | Θ(N²) | Θ(log N) to CPA |
  | Mux tree N:1 | Θ(N) | Θ(log N) |
  | Full crossbar N×N width W | Θ(N² W) | Θ(1) logic / wire-dominated |

  Staff caveat: wire RC and fanout make “O(1) crossbar” false in silicon — state both gate model and physical reality.
- **Common pitfalls:**
  - Saying CLA is O(1) delay.
  - Ignoring that Kogge-Stone is O(N log N) area with huge wiring.
- **Interviewer follow-ups:**
  - Priority encoder delay?
  - CAM search latency vs size?
- **Tags:** big-o, adder, multiplier, architecture

---

### Q09. Little’s Law / queueing light
- **Suggested id:** `apt-09`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  A NoC input buffer sees arrival rate λ = 0.4 flits/cycle. Average time in system (queue+service) W = 5 cycles. What is average occupancy L? If service rate μ = 0.5 flits/cycle (stable), estimate M/M/1 average queueing delay beyond service.
- **Short answer:**
  Little’s Law: L = λW = 0.4×5 = **2.0 flits**. M/M/1: W = 1/(μ−λ) = 1/0.1 = 10 cycles total; service 1/μ=2; queue wait 8 cycles.
- **Detailed answer:**
  Little’s Law \(L=\lambda W\) holds in steady state without needing Markov assumptions — critical for buffer sizing intuition.

  M/M/1: utilization \(\rho=\lambda/\mu=0.8\).  
  \(W=1/(\mu-\lambda)=10\) cycles.  
  \(W_q=W-1/\mu=10-2=8\) cycles.  
  \(L=\rho/(1-\rho)=4\) flits average in system.

  Note the two scenarios are separate numeric setups (first gave W=5; M/M/1 predicts W=10 at those λ,μ).
- **Common pitfalls:**
  - Applying M/M/1 when traffic is highly bursty (underestimates tails).
  - Using L=λ/μ.
- **Interviewer follow-ups:**
  - Why size buffers for tail latency not mean L?
  - What is ρ→1 behavior?
- **Tags:** queueing, littles-law, noc, buffers

---

### Q10. Yield percentage math
- **Suggested id:** `apt-10`
- **Difficulty:** Medium
- **Company style:** Intel
- **Round:** Technical Phone Screen
- **Question:**
  Die area 100 mm², defect density D0 = 0.5 defects/cm². Using Poisson yield \(Y=e^{-A D_0}\), compute Y. If 80% of good die pass final test, what is overall take-home yield from wafers?
- **Short answer:**
  A = 1 cm² → Y = e^{-0.5} ≈ **60.65%**. With test: 0.6065×0.80 ≈ **48.5%**.
- **Detailed answer:**
  100 mm² = 1 cm².  
  \(Y = e^{-A D_0} = e^{-0.5} ≈ 0.60653066\).

  After test: \(Y_{out} = 0.6065 × 0.80 ≈ 0.4852\) (**48.5%**).

  Murphy/Seeds models differ; Poisson is the usual interview baseline. Larger die → exponential yield hit — why chiplet economics matter.
- **Common pitfalls:**
  - Unit mismatch mm² vs cm² (100× error).
  - Using Y=1−A·D0 (only small AD0 approximation: 1−0.5=0.5 vs 0.607).
- **Interviewer follow-ups:**
  - How does splitting into 2 chiplets of 50 mm² change Poisson yield (ignore packaging)?
  - What is critical area vs raw area?
- **Tags:** yield, poisson, defect-density

---

### Q11. Gray code counting
- **Suggested id:** `apt-11`
- **Difficulty:** Hard
- **Company style:** Apple
- **Round:** Onsite Technical Round 1
- **Question:**
  List 3-bit binary and Gray codes from 0..7. Convert binary `0b1011` to Gray and Gray `0b1110` to binary. Why does ±1 gray pointer change only one bit?
- **Short answer:**
  Gray = binary ⊕ (binary >> 1). `1011`→`1110`. Gray `1110`→ binary `1001`. Adjacent counts differ by one bit by construction — safe to CDC-sync multi-bit counters.
- **Detailed answer:**
  | Dec | Binary | Gray |
  |---|---|---|
  | 0 | 000 | 000 |
  | 1 | 001 | 001 |
  | 2 | 010 | 011 |
  | 3 | 011 | 010 |
  | 4 | 100 | 110 |
  | 5 | 101 | 111 |
  | 6 | 110 | 101 |
  | 7 | 111 | 100 |

  Binary `1011`: `1011 ⊕ 0101 = 1110`.

  Gray→binary: b3=g3; b2=b3⊕g2; b1=b2⊕g1; b0=b1⊕g0.  
  For `1110`: b=1,1⊕1=0,0⊕1=1,1⊕0=1 → wait: g=`1110` = g3..g0.  
  b3=1; b2=1⊕1=0; b1=0⊕1=1; b0=1⊕0=1 → **1011**.  
  (Inverse of the earlier conversion — consistent.)

  Interview note: only unit-stride counting is single-bit; arbitrary loads are not.
- **Common pitfalls:**
  - XOR with <<1 instead of >>1.
  - Using Gray for arbitrary multi-bit CDC buses.
- **Interviewer follow-ups:**
  - Inverse algorithm iterative vs closed form?
  - Reflected Gray property?
- **Tags:** gray-code, cdc, counting

---

### Q12. FIFO depth sizing math
- **Suggested id:** `apt-12`
- **Difficulty:** Staff / Principal
- **Company style:** Qualcomm
- **Round:** Onsite Deep-Dive
- **Question:**
  Writer clock 1 GHz writes a burst of 16 beats then idle 16 cycles. Reader clock 800 MHz reads continuously when not empty. Ignoring metastability margin, estimate minimum FIFO depth so the writer never sees full during the burst (start empty).
- **Short answer:**
  During 16 ns of writing, reader gets \(16×0.8=12.8\) beats ≈12 reads; backlog ≈16−12.8=3.2 → depth **≥4** (plus margin for sync/full flag latency; practical answer often 5–8).
- **Detailed answer:**
  Writer period 1 ns; burst length 16 ns; 16 writes.

  Reader period 1.25 ns; reads in 16 ns: \(16/1.25=12.8\). If only whole beats, in 16 ns reader completes 12 reads (at t=1.25…15), possibly 13 depending on alignment — use continuous rate model: net fill rate = 1.0−0.8=0.2 beats/ns ×16 ns = **3.2**.

  Minimum integer depth ≥4. Staff add: gray pointer sync latency (2–3 dest cycles) and almost-full watermark → inflate depth. Worst-case phase alignment can reduce reads during the window by nearly one beat.
- **Common pitfalls:**
  - Sizing depth=16 (treating clocks unrelated without rate math).
  - Forgetting empty start assumption.
- **Interviewer follow-ups:**
  - If reader is 1.2 GHz, is depth 1 enough?
  - How do credits change the calculation?
- **Tags:** fifo-depth, cdc, rate-matching

---

### Q13. MTBF numeric for synchronizer
- **Suggested id:** `apt-13`
- **Difficulty:** Staff / Principal
- **Company style:** Apple
- **Round:** Onsite Deep-Dive
- **Question:**
  MTBF ≈ \(e^{t_s/\tau} / (T_w · f_{clk} · f_{data})\) for a flip-flop synchronizer stage. Given τ=30 ps, Tw=50 ps, fclk=1 GHz, fdata=100 MHz, resolution time ts=1 ns (one full period for 2nd stage). Compute MTBF order of magnitude. What if ts is only 200 ps?
- **Short answer:**
  With ts=1 ns: exp(1000/30)=exp(33.33)≈3×10¹⁴; denominator 50ps×1e9×1e8=5×10⁻³; MTBF≈6×10¹⁶ s (~2×10⁹ years). With ts=200 ps: exp(6.67)≈790; MTBF≈1.6×10⁵ s (~2 days) — catastrophic.
- **Detailed answer:**
  Denominator: \(T_w f_{clk} f_{data} = (50×10^{-12})(10^9)(10^8) = 5×10^{-3}\) s⁻¹.

  Case A: \(t_s/\tau=1\text{ns}/30\text{ps}=33.333\), \(e^{33.333}≈2.9×10^{14}\).  
  MTBF ≈ \(2.9×10^{14}/5×10^{-3} ≈ 5.8×10^{16}\) seconds ≈ **1.8×10⁹ years**.

  Case B: \(200/30=6.667\), \(e^{6.667}≈786\).  
  MTBF ≈ \(786/5×10^{-3} ≈ 1.57×10^5\) s ≈ **1.8 days**.

  Staff takeaway: depth/period margin dominates; never starve synchronizer resolution time at GHz with tiny τ processes.
- **Common pitfalls:**
  - Mixing units (ps vs s) in exp.
  - Using fdata=fclk always (async events often rarer — but don’t assume).
- **Interviewer follow-ups:**
  - Why multi-stage sync increases ts roughly by (N−1) periods?
  - How does Tw relate to setup/hold window?
- **Tags:** mtbf, metastability, synchronizer, staff

---

### Q14. Permutations: scheduling ports
- **Suggested id:** `apt-14`
- **Difficulty:** Medium
- **Company style:** AMD
- **Round:** Technical Phone Screen
- **Question:**
  5 pending requests, 3 identical server ports. In how many ways can you assign distinct requests to ports (order among chosen matters as ports are distinguishable)? If ports are indistinguishable, how many?
- **Short answer:**
  Distinguishable ports: \(P(5,3)=5×4×3=60\). Indistinguishable: \(\binom{5}{3}=10\).
- **Detailed answer:**
  Distinguishable: injectively assign ports ← requests: \(5!/(5-3)! = 60\).

  Indistinguishable: only choose which 3 of 5 are served: \(\binom{5}{3}=10\).

  If all 5 must be ordered in a sequence for round-robin: \(5!=120\).
- **Common pitfalls:**
  - Using \(5^3\) (with replacement / allowing duplicates).
  - Confusing P vs C.
- **Interviewer follow-ups:**
  - Stars and bars for identical credit tokens into bins?
  - Number of onto mappings if 3 requests to 3 ports?
- **Tags:** combinatorics, permutations, scheduling

---

### Q15. Clock period / frequency conversion
- **Suggested id:** `apt-15`
- **Difficulty:** Hard
- **Company style:** Broadcom
- **Round:** Onsite Technical Round 1
- **Question:**
  A path has 180 ps logic, 40 ps setup, 25 ps clock uncertainty, 30 ps clock-to-Q, and useful skew of +20 ps (launch late). Max frequency? If hold requires 25 ps min delay and clock-to-Q min is 15 ps with −10 ps skew (hold critical), is hold OK with 20 ps logic min?
- **Short answer:**
  Setup available: T − t_cq − t_logic − t_su − t_unc + t_skew ≥ 0 → T ≥ 180+40+25+30−20=255 ps → **fmax≈3.92 GHz**. Hold: t_cq,min + t_logic,min ≥ t_hold + t_skew_hold → 15+20=35 ≥ 25+10=35 → **marginally OK (0 ps)**.
- **Detailed answer:**
  Setup: \(T \ge t_{cq}^{max}+t_{logic}^{max}+t_{su}+t_{unc}-t_{skew,useful}\)  
  \(T \ge 30+180+40+25-20 = 255\) ps → \(f=1/0.255\text{ns}≈3.921\) GHz.

  Hold (same edge): \(t_{cq}^{min}+t_{logic}^{min} \ge t_{hold}+t_{skew,hold}\)  
  with adverse skew 10 ps: \(15+20=35\), \(25+10=35\) → **0 ps slack**.
- **Common pitfalls:**
  - Adding useful skew to both setup and hold incorrectly.
  - Frequency in Hz with ps units mismanaged.
- **Interviewer follow-ups:**
  - How does CPPR change uncertainty?
  - Half-cycle path equations?
- **Tags:** timing-math, setup, hold, frequency

---

### Q16. Hamming distance and ECC intuition
- **Suggested id:** `apt-16`
- **Difficulty:** Hard
- **Company style:** Intel
- **Round:** Onsite Technical Round 1
- **Question:**
  Hamming distance between `0b1011001` and `0b1001011`? For SECDED, why do you need distance ≥4? How many check bits for 64 data bits roughly (Hamming bound intuition)?
- **Short answer:**
  Distance = 2. SEC needs \(d_{min}\ge3\); SECDED needs \(d_{min}\ge4\). For 64-bit data, SECDED typically uses 8 check bits (72-bit codeword).
- **Detailed answer:**
  XOR: `1011001 ⊕ 1001011 = 0010010` → **two** 1s ⇒ Hamming distance **2**.

  SEC corrects 1-bit ⇒ spheres of radius 1 disjoint ⇒ \(d_{min}\ge3\). Double-error detect on top (SECDED) ⇒ \(d_{min}\ge4\).

  Hamming SEC for \(m\) data bits: find \(r\) with \(2^r \ge m+r+1\). For \(m=64\), \(r=7\) works (\(128 \ge 72\)). Extra overall parity → **8** check bits for SECDED — the familiar (72,64) DIMM code. Overhead = 8/64 = 12.5%.
- **Common pitfalls:**
  - Confusing detect vs correct distance requirements.
  - Using r=6 for 64-bit (insufficient).
- **Interviewer follow-ups:**
  - Chipkill / symbol ECC vs SECDED?
  - Overhead % of 8/64?
- **Tags:** hamming, ecc, secded

---

### Q17. Cache hit rate math
- **Suggested id:** `apt-17`
- **Difficulty:** Staff / Principal
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  Hit time 1 cycle, miss penalty 100 cycles, hit rate 95%. Average memory access time (AMAT)? What hit rate is needed for AMAT≤3 if penalty stays 100?
- **Short answer:**
  AMAT = 1 + 0.05×100 = **6 cycles**. For AMAT≤3: 1+(1−h)×100≤3 ⇒ (1−h)≤0.02 ⇒ **h≥98%**.
- **Detailed answer:**
  \(\mathrm{AMAT} = t_{hit} + (1-h)t_{miss} = 1 + 0.05×100 = 6\).

  Target: \(1+(1-h)100 \le 3 \Rightarrow 1-h \le 0.02 \Rightarrow h \ge 0.98\).

  Staff: AMAT ignores overlapping misses / MSHRs; still the interview baseline. Show sensitivity: from 95%→98% halves miss contribution from 5 to 2.
- **Common pitfalls:**
  - AMAT = h×1 + (1−h)×100 forgetting hit time also paid on miss path variants — state the model used.
  - Mixing rate vs ratio terminology.
- **Interviewer follow-ups:**
  - Two-level cache AMAT expansion?
  - How does prefetch change effective h?
- **Tags:** cache, amat, performance

---

### Q18. Bandwidth calculation
- **Suggested id:** `apt-18`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  A memory interface is 256-bit wide at 1.5 GHz DDR (data on both edges). Peak bandwidth in GB/s? If efficiency is 70%, sustained bandwidth? How many 64B lines per second sustained?
- **Short answer:**
  Peak: 256/8 × 1.5 × 2 = **96 GB/s**. Sustained: 0.7×96 = **67.2 GB/s**. Lines: 67.2e9/64 ≈ **1.05×10⁹** lines/s.
- **Detailed answer:**
  Bytes per edge transfers: \(256/8=32\) bytes per transfer edge.  
  DDR at 1.5 GHz clock → 3×10⁹ transfers/s.  
  Peak = \(32 × 3×10^9 = 96×10^9\) B/s = **96 GB/s** (decimal GB).

  Sustained = \(0.7×96 = 67.2\) GB/s.  
  64B lines/s: \(67.2×10^9 / 64 = 1.05×10^9\).

  Note GB vs GiB interview clarification if pedantic.
- **Common pitfalls:**
  - Forgetting ×2 for DDR.
  - Using 256 bits as bytes.
- **Interviewer follow-ups:**
  - HBM stack bandwidth aggregation?
  - How do turnarounds kill efficiency?
- **Tags:** bandwidth, ddr, memory

---

### Q19. Metastability probability light
- **Suggested id:** `apt-19`
- **Difficulty:** Hard
- **Company style:** AMD
- **Round:** Onsite Technical Round 1
- **Question:**
  If each async arrival independently violates the aperture with probability p=10^{-4} per clock, what is the probability of at least one violation in 10^6 clocks? Approximate with 1−e^{−λ}.
- **Short answer:**
  Expected violations λ=10^6×10^{-4}=100. P(at least one)=1−(1−p)^N≈1−e^{−100}≈**1** (certainty). For λ=0.01 (e.g., N=100), ≈0.01.
- **Detailed answer:**
  Exact: \(1-(1-p)^N = 1-(0.9999)^{10^6}\).  
  \(\approx 1-e^{-Np}=1-e^{-100}≈1-3.7×10^{-44}≈1\).

  This is why raw single-FF async inputs fail; synchronizers reduce effective p exponentially via resolution time, not by hoping N is small.

  For λ=0.01: \(1-e^{-0.01}≈0.00995\).
- **Common pitfalls:**
  - Answering Np=100 as a probability.
  - Using e^{−N} without p.
- **Interviewer follow-ups:**
  - Connect p to Tw·fdata formula.
  - Birthday paradox analogy for collision?
- **Tags:** probability, metastability, poisson-approx

---

### Q20. Power-of-two and address math
- **Suggested id:** `apt-20`
- **Difficulty:** Medium
- **Company style:** Apple
- **Round:** Technical Phone Screen
- **Question:**
  A 4-way set-associative cache has 64 sets and 64-byte lines. How large is the data array? Bits for set index and offset? For a 32-bit address, how many tag bits?
- **Short answer:**
  Data array = 4×64×64 = **16384 B = 16 KB**. Offset=6 bits, index=6 bits, tag=32−6−6=**20 bits**.
- **Detailed answer:**
  Capacity = ways × sets × line size = \(4×64×64=16384\) bytes.

  Offset: \(\log_2 64=6\). Index: \(\log_2 64=6\). Tag: \(32-12=20\).

  Number of lines total = 256; tags stored per line separately from data array.
- **Common pitfalls:**
  - Using 4×64 as size without line bytes.
  - Forgetting offset bits in tag calculation.
- **Interviewer follow-ups:**
  - Physically indexed vs virtually indexed set bits?
  - Victim cache size intuition?
- **Tags:** cache, addressing, powers-of-two

---

### Q21. Geometric series: pipeline fill / throughput tax
- **Suggested id:** `apt-21`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  A GPU kernel launches 100 wavefronts. Each needs 40 cycles to fill a pipe before producing, then produces 200 useful beats. Rough fraction of cycles spent in fill vs useful if they run strictly one after another on one SM pipe? How does occupancy of 10 concurrent wavefronts change the story qualitatively?
- **Short answer:**
  Serial: fill 100×40=4000; useful 100×200=20000; fill fraction=4000/24000≈**16.7%**. With 10-way overlap, fills hide under others’ useful work — effective fill tax drops dramatically (bounded by depth/concurrency).
- **Detailed answer:**
  Serial total = \(100(40+200)=24000\) cycles; fill%=\(4000/24000=1/6≈16.7\%\).

  With concurrency C=10, the pipeline stays full after initial fill of ~40 cycles while wavefronts round-robin; fill overhead amortized ≈ 40/(40+200×10) on a saturated pipe — much smaller. This is why occupancy / latency hiding is a numeric interview theme at Nvidia.
- **Common pitfalls:**
  - Adding fills without considering overlap.
  - Assuming fill%=40/200 always.
- **Interviewer follow-ups:**
  - Little’s Law for in-flight waves: L=λW?
  - When does memory latency dominate fill?
- **Tags:** pipeline, occupancy, gpu, geometric

---

### Q22. Expected value: random mux select
- **Suggested id:** `apt-22`
- **Difficulty:** Hard
- **Company style:** Qualcomm
- **Round:** Onsite Technical Round 1
- **Question:**
  A 4:1 mux randomly picks an input each cycle uniformly. Inputs toggle at rates 0.1, 0.2, 0.3, 0.4 transitions/cycle. Expected output toggle rate? If select is frozen, what’s the output rate?
- **Short answer:**
  With random independent select each cycle, output toggle depends on select changes and data — if select re-chosen every cycle independently of data, E[toggle] is not the average of input rates. If select is static uniform random once, E[rate]=**(0.1+0.2+0.3+0.4)/4=0.25**.
- **Detailed answer:**
  **Static select** (typical activity estimation with fixed config):  
  \(E[\alpha_{out}]=\sum p_i \alpha_i=0.25\).

  **Reselect every cycle independent:** output equals a randomly chosen input each cycle; P(out differs from previous) requires joint model of previous select/data. If inputs are independent Bernoulli toggles and select i.i.d., computation expands — interview often wants the static case plus awareness that muxing increases activity when select switches among uncorrelated sources (can approach 0.5 for random data).

  Staff answer: for power, use SAIF/VCD; closed form average is OK only under stated select policy.
- **Common pitfalls:**
  - Always averaging rates regardless of select dynamics.
  - Claiming mux always halves activity.
- **Interviewer follow-ups:**
  - Clock gate enable duty → dynamic power scale?
  - Why \(P=½CV^2αf\) uses α≤1?
- **Tags:** expected-value, activity-factor, power

---

### Q23. Conditional probability: stuck-at test
- **Suggested id:** `apt-23`
- **Difficulty:** Staff / Principal
- **Company style:** Intel
- **Round:** Onsite Deep-Dive
- **Question:**
  A net is stuck-at-0 with prior probability 10^{-6} (rare defect model). A test pattern fails (observes 0 when 1 expected) with likelihood 0.9 if stuck-at-0, and false fail probability 10^{-4} if healthy. Given fail, posterior P(stuck-at-0|fail)?
- **Short answer:**
  Bayes: P(F)=0.9×10^{-6}+10^{-4}×(1−10^{-6})≈1.0009×10^{-4}. Posterior≈\(9×10^{-7}/1.0009×10^{-4}≈0.009\) (**~0.9%**). One fail is weak evidence when false-fail rate ≫ defect prior.
- **Detailed answer:**
  Let D = defective SA0. P(D)=1e-6.

  \(P(F)=P(F|D)P(D)+P(F|¬D)P(¬D)=0.9×1e-6 + 1e-4×(1-1e-6)≈9e-7+1e-4=1.000009e-4\).

  \(P(D|F)=\dfrac{0.9×1e-6}{1.000009e-4}≈0.008999≈\mathbf{0.90\%}\).

  Staff DFT interview: volume diagnosis needs multiple patterns / syndrome consistency because single fails are dominated by noise/false fails at leading-edge rates.
- **Common pitfalls:**
  - Answering 90% (the likelihood, not posterior).
  - Ignoring base rate of defects.
- **Interviewer follow-ups:**
  - How many independent fails to push posterior >0.5?
  - Relate to ATPG quality vs spurious fails on ATE?
- **Tags:** bayes, dft, base-rate, staff

---

### Q24. Utilization / occupancy numeric
- **Suggested id:** `apt-24`
- **Difficulty:** Hard
- **Company style:** Nvidia
- **Round:** Onsite Technical Round 1
- **Question:**
  An SM has 4 schedulers, each can issue 1 instruction/cycle. A warp needs an instruction every 4 cycles on average (latency hiding). How many resident warps are needed to fully utilize one scheduler in the mean? If each warp uses 128 registers and the SM has 65536 registers, what’s the register-limited occupancy cap?
- **Short answer:**
  Mean occupancy need ≈4 warps per scheduler (Little’s L=λW with W=4, λ=1 issue/warp/cycle when ready). Register cap: 65536/128=**512 warps** theoretical — but per-SM architectural warp slots usually smaller (e.g., 64); registers often bind first at high RF usage.
- **Detailed answer:**
  For one scheduler: desired issue rate 1/cycle. Each warp contributes ~0.25 issues/cycle if it issues once per 4 cycles → need **~4 warps** per scheduler, **~16** across 4 schedulers, ignoring stalls.

  Register limit: \(\lfloor 65536/128\rfloor=512\) warps — far above typical `max_warps` hardware limit, so this RF footprint is fine; if 256 regs/warp → 256 warps still may exceed slot limits or not.

  Interview: occupancy = resident warps / max warps; link to latency hiding math L=λW.
- **Common pitfalls:**
  - Equating occupancy % directly to performance (non-monotonic sometimes).
  - Ignoring shared memory as another limiter.
- **Interviewer follow-ups:**
  - Shared memory 64 KB with 1 KB per block — occupancy?
  - Why 50% occupancy can beat 100%?
- **Tags:** occupancy, gpu, littles-law, registers

---

### Q25. FIFO vs throughput: MTBF-free depth with jitter
- **Suggested id:** `apt-25`
- **Difficulty:** Staff / Principal
- **Company style:** Apple
- **Round:** Hiring Manager Round
- **Question:**
  Sustained write rate 0.8 beats/clk_w, read rate 0.8 beats/clk_r, but clocks are plesiochronous with long-term rate equal. Bursts: writer may run at 1.0 for up to 50 cycles while reader stalls for 10 cycles (worst aligned). Bound the FIFO depth. Discuss leftover margin for CDC pointer sync latency of 4 cycles each side.
- **Short answer:**
  Worst backlog ≈50 writes during a window where reads miss 10 → need roughly 50+10 plus sync margin; more cleanly: integrate max(∫(w−r)dt) over adversary schedules. A bound: depth ≥ 50 + 10 + 4 + 4 = **68** beats (conservative), then round to power-of-two **128** for gray FIFO.
- **Detailed answer:**
  Long-term rates match ⇒ finite depth exists. Worst-case excursion is the maximum cumulative write−read difference.

  Conservative envelope:
  - 50 consecutive write-only cycles → +50  
  - 10 reader stall cycles overlapping → additional +10 if writer still active  
  - Full/empty flags delayed by pointer sync (~4 wr + 4 rd cycles of uncertainty) → +8  

  Bound ≈68. Implement depth 128 for gray code simplicity and margin.

  Staff story: sizing from rate averages alone (depth 2) fails bursty traffic; use credit watermarks and formal/sim stress with phase sweep.
- **Common pitfalls:**
  - Depth=1 because average rates match.
  - Ignoring almost-full reaction latency.
- **Interviewer follow-ups:**
  - How do you derive depth from a token-bucket traffic shaper?
  - Elastic buffer in SATA/PCIe — same integral bound?
- **Tags:** fifo-depth, burst, cdc, staff
