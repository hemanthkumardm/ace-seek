/**
 * VLSI Interview Masterclass — Additional Question Banks
 * Auto-generated from docs/interview-masterclass markdown packs.
 * Total additional questions: 199
 */

import type { InterviewQuestion } from "./vlsi-interview-masterclass-data";

export const ADDITIONAL_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    "id": "apt-01",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Two fair dice are rolled. What is P(sum = 7)? P(sum ≥ 10)? P(sum = 7 | first die shows 3)?",
    "shortSummary": "P(sum=7)=6/36=1/6. P(sum≥10)=6/36=1/6. P(sum=7|first=3)=1/6 (second must be 4).",
    "detailedAnswer": "Sample space size 36.\n\n  Sum=7 outcomes: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) → **6/36 = 1/6**.\n\n  Sum≥10: sum10 (3), sum11 (2), sum12 (1) → **6/36 = 1/6**.\n\n  Conditional: given first die = 3 (6 equally likely second faces), only second=4 works → **1/6**.\n\n  Note: P(sum=7) equals P(sum=7|first=3) here by symmetry of the complementary face.",
    "commonPitfalls": [
      "Counting (3,4) and (4,3) as one outcome.",
      "Using 12 as denominator (sums) instead of 36 (ordered pairs)."
    ],
    "interviewerFollowups": [
      "P(both same | sum even)?",
      "Expected value of the sum?"
    ],
    "tags": [
      "probability",
      "dice",
      "conditional"
    ],
    "isFreeSample": true
  },
  {
    "id": "apt-02",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "From a 52-card deck, you draw 5 cards. Approximate P(all 5 same suit) (flush including straight-flush). Compute exactly using combinations.",
    "shortSummary": "Exact: \\(4\\cdot\\binom{13}{5}/\\binom{52}{5} = 5148 / 2598960 ≈ 0.198\\%\\).",
    "detailedAnswer": "\\(\\binom{52}{5} = 2598960\\).\n\n  Per suit: \\(\\binom{13}{5} = 1287\\). Four suits → \\(4×1287 = 5148\\).\n\n  \\(P = 5148 / 2598960 = 1287 / 649740 ≈ 0.001981\\).\n\n  Poker “flush” excludes straight-flushes; interview usually wants the combination setup, not poker taxonomy.",
    "commonPitfalls": [
      "Using \\(4/52 × 3/51 ...\\) without ordering correction inconsistently.",
      "\\(\\binom{13}{5}×4!\\) incorrectly."
    ],
    "interviewerFollowups": [
      "P(exactly 3 aces in 5 cards)?",
      "Hypergeometric general form?"
    ],
    "tags": [
      "combinatorics",
      "cards",
      "hypergeometric"
    ],
    "isFreeSample": true
  },
  {
    "id": "apt-03",
    "company": "intel",
    "companyName": "Intel",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Line A makes 70% of chips, Line B 30%. P(defect|A)=1%, P(defect|B)=3%. Given a defective chip, what is P(from B)?",
    "shortSummary": "By Bayes: P(B|D) = 0.09 / 0.016 = **0.5625 (56.25%)**.",
    "detailedAnswer": "\\(P(D) = 0.7·0.01 + 0.3·0.03 = 0.007 + 0.009 = 0.016\\).\n\n  \\(P(B|D) = \\dfrac{P(D|B)P(B)}{P(D)} = \\dfrac{0.03·0.3}{0.016} = \\dfrac{0.009}{0.016} = 0.5625\\).\n\n  Despite B making fewer chips, its higher defect rate means most observed defectives still come from B.",
    "commonPitfalls": [
      "Answering 30% or 3% without Bayes.",
      "Mixing up P(B|D) vs P(D|B)."
    ],
    "interviewerFollowups": [
      "If prior on B becomes 10%, recompute.",
      "How does this relate to yield triage across fabs?"
    ],
    "tags": [
      "bayes",
      "yield",
      "probability"
    ]
  },
  {
    "id": "apt-04",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "For antipodal BPSK in AWGN, BER = Q(\\(\\sqrt{2E_b/N_0}\\)). If SNR (\\(E_b/N_0\\)) improves by 3 dB from 7 dB to 10 dB, does BER drop by ~2×, ~10×, or more? Explain using the Q-function tail.",
    "shortSummary": "Roughly **more than 10×** improvement in this region — Q-tail decays super-exponentially in the argument, not linearly with linear SNR.",
    "detailedAnswer": "3 dB ⇒ double linear \\(E_b/N_0\\). Argument of Q grows by \\(\\sqrt{2}\\approx1.414×\\).\n\n  At ~7 dB, \\(E_b/N_0≈5.0\\), \\(\\sqrt{2E_b/N_0}\\approx\\sqrt{10}\\approx3.16\\), Q(3.16)≈7.9e-4.\n\n  At 10 dB, \\(E_b/N_0≈10\\), \\(\\sqrt{20}\\approx4.47\\), Q(4.47)≈3.9e-6.\n\n  Ratio ≈ 200× — order-of-magnitude “much more than 10×.” Staff point: never assume BER scales like 1/SNR in the error-floor region; coding/SNR margins are nonlinear.",
    "commonPitfalls": [
      "Saying BER halves when SNR doubles.",
      "Confusing \\(E_b/N_0\\) with channel SNR including rate."
    ],
    "interviewerFollowups": [
      "What does 0.1 dB mean at 1e-15 BER for SerDes?",
      "Relation of Q to erfc: \\(Q(x)=\\tfrac{1}{2}\\mathrm{erfc}(x/\\sqrt{2})\\)?"
    ],
    "tags": [
      "ber",
      "snr",
      "q-function",
      "serdes"
    ]
  },
  {
    "id": "apt-05",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "A 6-stage pipeline runs at 1 GHz, one instruction issue per cycle (ideal). (a) Latency of one instruction? (b) Steady-state throughput? (c) Time to finish 1000 instructions assuming fill penalty only at start and no stalls?",
    "shortSummary": "(a) 6 ns. (b) 1 instr/ns = 1 GIPS. (c) 6 + 999 = 1005 ns (fill then 999 more completions).",
    "detailedAnswer": "Clock period \\(T=1\\) ns.\n\n  (a) Latency = \\(6T = 6\\) ns.\n\n  (b) After fill, throughput = \\(1/T = 1\\) instruction/ns.\n\n  (c) First instruction completes at t=6 ns; thereafter one completion per ns → remaining 999 complete at t=6+999=**1005 ns**.\n\n  Equivalently: \\(T_{total} = (N + D - 1)T\\) for depth D, N items, no stalls → \\((1000+6-1)·1 = 1005\\) ns.",
    "commonPitfalls": [
      "Saying throughput is 1/6 GIPS (confusing latency with throughput).",
      "Using \\(N·D\\) cycles."
    ],
    "interviewerFollowups": [
      "With 10% stall cycles, effective CPI?",
      "Dual-issue: how do formulas change?"
    ],
    "tags": [
      "pipeline",
      "throughput",
      "latency",
      "cpi"
    ]
  },
  {
    "id": "apt-06",
    "company": "intel",
    "companyName": "Intel",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "In 8-bit two’s complement, what are the decimal values of `0x7F`, `0x80`, `0xFF`? Compute `0x80 - 0x01` and explain overflow. What is the range of an n-bit two’s complement integer?",
    "shortSummary": "127, −128, −1. `0x80−0x01=0x7F=+127` (modular wrap; overflow from −128). Range: \\([-2^{n-1}, 2^{n-1}-1]\\).",
    "detailedAnswer": "MSB weight \\(-2^{7}\\) for signed interpretation.\n\n  - `0111_1111` = 127  \n  - `1000_0000` = −128  \n  - `1111_1111` = −1  \n\n  \\(-128 - 1\\) is not representable; hardware add of `0x80 + 0xFF` (two’s complement of 1) = `0x7F` with overflow flag.\n\n  Range n-bit: \\([-2^{n-1}, 2^{n-1}-1]\\). Asymmetric: one more negative value.",
    "commonPitfalls": [
      "Claiming `0x80` is −127.",
      "Saying signed range is ±127 for 8-bit."
    ],
    "interviewerFollowups": [
      "How do you detect overflow in signed add using sign bits?",
      "Absolute value of `0x80` in 8-bit?"
    ],
    "tags": [
      "twos-complement",
      "overflow",
      "binary"
    ]
  },
  {
    "id": "apt-07",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How many 1-bits in `0xF0F0` (16-bit)? Give an O(k) algorithm clearing lowest set bits, and state hardware popcount complexity vs width.",
    "shortSummary": "Eight ones. Algorithm: loop `x &= x-1` counting iterations until 0 — O(popcount). Hardware: parallel reduction tree O(log n) depth, O(n) Xor/Add area.",
    "detailedAnswer": "`0xF0F0 = 1111_0000_1111_0000` → 8 ones.\n\n  Kernighan:\n  ```c\n  for (c = 0; x; c++) x &= x - 1;\n  ```\n  Each step clears the lowest set bit.\n\n  HW: pairwise sum bits → CSA/adder tree; depth \\(\\lceil\\log_2 n\\rceil\\) adder stages (more precisely log of reduction). Big-O area Θ(n).",
    "commonPitfalls": [
      "Counting hex digits F as 4 without zeros.",
      "Claiming software O(1) for arbitrary width."
    ],
    "interviewerFollowups": [
      "Isolate lowest set bit with `x & -x`?",
      "Parity vs popcount mod 2?"
    ],
    "tags": [
      "popcount",
      "bit-manipulation",
      "complexity"
    ]
  },
  {
    "id": "apt-08",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Give asymptotic area and delay (in gate delays / logic levels, ignoring wire) for: (a) N-bit ripple adder, (b) N-bit carry-lookahead (ideal), (c) N×N combinational multiplier array, (d) N-input one-hot mux tree.",
    "shortSummary": "(a) Area O(N), delay O(N). (b) Area O(N), delay O(log N). (c) Area O(N²), delay O(N) (array) or better with trees. (d) Area O(N), delay O(log N).",
    "detailedAnswer": "| Structure | Area | Delay |\n  |---|---|---|\n  | Ripple-carry adder | Θ(N) | Θ(N) |\n  | CLA / parallel-prefix (Kogge-Stone) | Θ(N log N) typically | Θ(log N) |\n  | Array multiplier | Θ(N²) | Θ(N) |\n  | Wallace/Dadda + CPA | Θ(N²) | Θ(log N) to CPA |\n  | Mux tree N:1 | Θ(N) | Θ(log N) |\n  | Full crossbar N×N width W | Θ(N² W) | Θ(1) logic / wire-dominated |\n\n  Staff caveat: wire RC and fanout make “O(1) crossbar” false in silicon — state both gate model and physical reality.",
    "commonPitfalls": [
      "Saying CLA is O(1) delay.",
      "Ignoring that Kogge-Stone is O(N log N) area with huge wiring."
    ],
    "interviewerFollowups": [
      "Priority encoder delay?",
      "CAM search latency vs size?"
    ],
    "tags": [
      "big-o",
      "adder",
      "multiplier",
      "architecture"
    ]
  },
  {
    "id": "apt-09",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "A NoC input buffer sees arrival rate λ = 0.4 flits/cycle. Average time in system (queue+service) W = 5 cycles. What is average occupancy L? If service rate μ = 0.5 flits/cycle (stable), estimate M/M/1 average queueing delay beyond service.",
    "shortSummary": "Little’s Law: L = λW = 0.4×5 = **2.0 flits**. M/M/1: W = 1/(μ−λ) = 1/0.1 = 10 cycles total; service 1/μ=2; queue wait 8 cycles.",
    "detailedAnswer": "Little’s Law \\(L=\\lambda W\\) holds in steady state without needing Markov assumptions — critical for buffer sizing intuition.\n\n  M/M/1: utilization \\(\\rho=\\lambda/\\mu=0.8\\).  \n  \\(W=1/(\\mu-\\lambda)=10\\) cycles.  \n  \\(W_q=W-1/\\mu=10-2=8\\) cycles.  \n  \\(L=\\rho/(1-\\rho)=4\\) flits average in system.\n\n  Note the two scenarios are separate numeric setups (first gave W=5; M/M/1 predicts W=10 at those λ,μ).",
    "commonPitfalls": [
      "Applying M/M/1 when traffic is highly bursty (underestimates tails).",
      "Using L=λ/μ."
    ],
    "interviewerFollowups": [
      "Why size buffers for tail latency not mean L?",
      "What is ρ→1 behavior?"
    ],
    "tags": [
      "queueing",
      "littles-law",
      "noc",
      "buffers"
    ]
  },
  {
    "id": "apt-10",
    "company": "intel",
    "companyName": "Intel",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Die area 100 mm², defect density D0 = 0.5 defects/cm². Using Poisson yield \\(Y=e^{-A D_0}\\), compute Y. If 80% of good die pass final test, what is overall take-home yield from wafers?",
    "shortSummary": "A = 1 cm² → Y = e^{-0.5} ≈ **60.65%**. With test: 0.6065×0.80 ≈ **48.5%**.",
    "detailedAnswer": "100 mm² = 1 cm².  \n  \\(Y = e^{-A D_0} = e^{-0.5} ≈ 0.60653066\\).\n\n  After test: \\(Y_{out} = 0.6065 × 0.80 ≈ 0.4852\\) (**48.5%**).\n\n  Murphy/Seeds models differ; Poisson is the usual interview baseline. Larger die → exponential yield hit — why chiplet economics matter.",
    "commonPitfalls": [
      "Unit mismatch mm² vs cm² (100× error).",
      "Using Y=1−A·D0 (only small AD0 approximation: 1−0.5=0.5 vs 0.607)."
    ],
    "interviewerFollowups": [
      "How does splitting into 2 chiplets of 50 mm² change Poisson yield (ignore packaging)?",
      "What is critical area vs raw area?"
    ],
    "tags": [
      "yield",
      "poisson",
      "defect-density"
    ]
  },
  {
    "id": "apt-11",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "List 3-bit binary and Gray codes from 0..7. Convert binary `0b1011` to Gray and Gray `0b1110` to binary. Why does ±1 gray pointer change only one bit?",
    "shortSummary": "Gray = binary ⊕ (binary >> 1). `1011`→`1110`. Gray `1110`→ binary `1001`. Adjacent counts differ by one bit by construction — safe to CDC-sync multi-bit counters.",
    "detailedAnswer": "| Dec | Binary | Gray |\n  |---|---|---|\n  | 0 | 000 | 000 |\n  | 1 | 001 | 001 |\n  | 2 | 010 | 011 |\n  | 3 | 011 | 010 |\n  | 4 | 100 | 110 |\n  | 5 | 101 | 111 |\n  | 6 | 110 | 101 |\n  | 7 | 111 | 100 |\n\n  Binary `1011`: `1011 ⊕ 0101 = 1110`.\n\n  Gray→binary: b3=g3; b2=b3⊕g2; b1=b2⊕g1; b0=b1⊕g0.  \n  For `1110`: b=1,1⊕1=0,0⊕1=1,1⊕0=1 → wait: g=`1110` = g3..g0.  \n  b3=1; b2=1⊕1=0; b1=0⊕1=1; b0=1⊕0=1 → **1011**.  \n  (Inverse of the earlier conversion — consistent.)\n\n  Interview note: only unit-stride counting is single-bit; arbitrary loads are not.",
    "commonPitfalls": [
      "XOR with <<1 instead of >>1.",
      "Using Gray for arbitrary multi-bit CDC buses."
    ],
    "interviewerFollowups": [
      "Inverse algorithm iterative vs closed form?",
      "Reflected Gray property?"
    ],
    "tags": [
      "gray-code",
      "cdc",
      "counting"
    ]
  },
  {
    "id": "apt-12",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Writer clock 1 GHz writes a burst of 16 beats then idle 16 cycles. Reader clock 800 MHz reads continuously when not empty. Ignoring metastability margin, estimate minimum FIFO depth so the writer never sees full during the burst (start empty).",
    "shortSummary": "During 16 ns of writing, reader gets \\(16×0.8=12.8\\) beats ≈12 reads; backlog ≈16−12.8=3.2 → depth **≥4** (plus margin for sync/full flag latency; practical answer often 5–8).",
    "detailedAnswer": "Writer period 1 ns; burst length 16 ns; 16 writes.\n\n  Reader period 1.25 ns; reads in 16 ns: \\(16/1.25=12.8\\). If only whole beats, in 16 ns reader completes 12 reads (at t=1.25…15), possibly 13 depending on alignment — use continuous rate model: net fill rate = 1.0−0.8=0.2 beats/ns ×16 ns = **3.2**.\n\n  Minimum integer depth ≥4. Staff add: gray pointer sync latency (2–3 dest cycles) and almost-full watermark → inflate depth. Worst-case phase alignment can reduce reads during the window by nearly one beat.",
    "commonPitfalls": [
      "Sizing depth=16 (treating clocks unrelated without rate math).",
      "Forgetting empty start assumption."
    ],
    "interviewerFollowups": [
      "If reader is 1.2 GHz, is depth 1 enough?",
      "How do credits change the calculation?"
    ],
    "tags": [
      "fifo-depth",
      "cdc",
      "rate-matching"
    ]
  },
  {
    "id": "apt-13",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "MTBF ≈ \\(e^{t_s/\\tau} / (T_w · f_{clk} · f_{data})\\) for a flip-flop synchronizer stage. Given τ=30 ps, Tw=50 ps, fclk=1 GHz, fdata=100 MHz, resolution time ts=1 ns (one full period for 2nd stage). Compute MTBF order of magnitude. What if ts is only 200 ps?",
    "shortSummary": "With ts=1 ns: exp(1000/30)=exp(33.33)≈3×10¹⁴; denominator 50ps×1e9×1e8=5×10⁻³; MTBF≈6×10¹⁶ s (~2×10⁹ years). With ts=200 ps: exp(6.67)≈790; MTBF≈1.6×10⁵ s (~2 days) — catastrophic.",
    "detailedAnswer": "Denominator: \\(T_w f_{clk} f_{data} = (50×10^{-12})(10^9)(10^8) = 5×10^{-3}\\) s⁻¹.\n\n  Case A: \\(t_s/\\tau=1\\text{ns}/30\\text{ps}=33.333\\), \\(e^{33.333}≈2.9×10^{14}\\).  \n  MTBF ≈ \\(2.9×10^{14}/5×10^{-3} ≈ 5.8×10^{16}\\) seconds ≈ **1.8×10⁹ years**.\n\n  Case B: \\(200/30=6.667\\), \\(e^{6.667}≈786\\).  \n  MTBF ≈ \\(786/5×10^{-3} ≈ 1.57×10^5\\) s ≈ **1.8 days**.\n\n  Staff takeaway: depth/period margin dominates; never starve synchronizer resolution time at GHz with tiny τ processes.",
    "commonPitfalls": [
      "Mixing units (ps vs s) in exp.",
      "Using fdata=fclk always (async events often rarer — but don’t assume)."
    ],
    "interviewerFollowups": [
      "Why multi-stage sync increases ts roughly by (N−1) periods?",
      "How does Tw relate to setup/hold window?"
    ],
    "tags": [
      "mtbf",
      "metastability",
      "synchronizer",
      "staff"
    ]
  },
  {
    "id": "apt-14",
    "company": "amd",
    "companyName": "AMD",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "5 pending requests, 3 identical server ports. In how many ways can you assign distinct requests to ports (order among chosen matters as ports are distinguishable)? If ports are indistinguishable, how many?",
    "shortSummary": "Distinguishable ports: \\(P(5,3)=5×4×3=60\\). Indistinguishable: \\(\\binom{5}{3}=10\\).",
    "detailedAnswer": "Distinguishable: injectively assign ports ← requests: \\(5!/(5-3)! = 60\\).\n\n  Indistinguishable: only choose which 3 of 5 are served: \\(\\binom{5}{3}=10\\).\n\n  If all 5 must be ordered in a sequence for round-robin: \\(5!=120\\).",
    "commonPitfalls": [
      "Using \\(5^3\\) (with replacement / allowing duplicates).",
      "Confusing P vs C."
    ],
    "interviewerFollowups": [
      "Stars and bars for identical credit tokens into bins?",
      "Number of onto mappings if 3 requests to 3 ports?"
    ],
    "tags": [
      "combinatorics",
      "permutations",
      "scheduling"
    ]
  },
  {
    "id": "apt-15",
    "company": "broadcom",
    "companyName": "Broadcom",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "A path has 180 ps logic, 40 ps setup, 25 ps clock uncertainty, 30 ps clock-to-Q, and useful skew of +20 ps (launch late). Max frequency? If hold requires 25 ps min delay and clock-to-Q min is 15 ps with −10 ps skew (hold critical), is hold OK with 20 ps logic min?",
    "shortSummary": "Setup available: T − t_cq − t_logic − t_su − t_unc + t_skew ≥ 0 → T ≥ 180+40+25+30−20=255 ps → **fmax≈3.92 GHz**. Hold: t_cq,min + t_logic,min ≥ t_hold + t_skew_hold → 15+20=35 ≥ 25+10=35 → **marginally OK (0 ps)**.",
    "detailedAnswer": "Setup: \\(T \\ge t_{cq}^{max}+t_{logic}^{max}+t_{su}+t_{unc}-t_{skew,useful}\\)  \n  \\(T \\ge 30+180+40+25-20 = 255\\) ps → \\(f=1/0.255\\text{ns}≈3.921\\) GHz.\n\n  Hold (same edge): \\(t_{cq}^{min}+t_{logic}^{min} \\ge t_{hold}+t_{skew,hold}\\)  \n  with adverse skew 10 ps: \\(15+20=35\\), \\(25+10=35\\) → **0 ps slack**.",
    "commonPitfalls": [
      "Adding useful skew to both setup and hold incorrectly.",
      "Frequency in Hz with ps units mismanaged."
    ],
    "interviewerFollowups": [
      "How does CPPR change uncertainty?",
      "Half-cycle path equations?"
    ],
    "tags": [
      "timing-math",
      "setup",
      "hold",
      "frequency"
    ]
  },
  {
    "id": "apt-16",
    "company": "intel",
    "companyName": "Intel",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Hamming distance between `0b1011001` and `0b1001011`? For SECDED, why do you need distance ≥4? How many check bits for 64 data bits roughly (Hamming bound intuition)?",
    "shortSummary": "Distance = 2. SEC needs \\(d_{min}\\ge3\\); SECDED needs \\(d_{min}\\ge4\\). For 64-bit data, SECDED typically uses 8 check bits (72-bit codeword).",
    "detailedAnswer": "XOR: `1011001 ⊕ 1001011 = 0010010` → **two** 1s ⇒ Hamming distance **2**.\n\n  SEC corrects 1-bit ⇒ spheres of radius 1 disjoint ⇒ \\(d_{min}\\ge3\\). Double-error detect on top (SECDED) ⇒ \\(d_{min}\\ge4\\).\n\n  Hamming SEC for \\(m\\) data bits: find \\(r\\) with \\(2^r \\ge m+r+1\\). For \\(m=64\\), \\(r=7\\) works (\\(128 \\ge 72\\)). Extra overall parity → **8** check bits for SECDED — the familiar (72,64) DIMM code. Overhead = 8/64 = 12.5%.",
    "commonPitfalls": [
      "Confusing detect vs correct distance requirements.",
      "Using r=6 for 64-bit (insufficient)."
    ],
    "interviewerFollowups": [
      "Chipkill / symbol ECC vs SECDED?",
      "Overhead % of 8/64?"
    ],
    "tags": [
      "hamming",
      "ecc",
      "secded"
    ]
  },
  {
    "id": "apt-17",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Staff / Principal",
    "round": "Onsite Technical Round 1",
    "question": "Hit time 1 cycle, miss penalty 100 cycles, hit rate 95%. Average memory access time (AMAT)? What hit rate is needed for AMAT≤3 if penalty stays 100?",
    "shortSummary": "AMAT = 1 + 0.05×100 = **6 cycles**. For AMAT≤3: 1+(1−h)×100≤3 ⇒ (1−h)≤0.02 ⇒ **h≥98%**.",
    "detailedAnswer": "\\(\\mathrm{AMAT} = t_{hit} + (1-h)t_{miss} = 1 + 0.05×100 = 6\\).\n\n  Target: \\(1+(1-h)100 \\le 3 \\Rightarrow 1-h \\le 0.02 \\Rightarrow h \\ge 0.98\\).\n\n  Staff: AMAT ignores overlapping misses / MSHRs; still the interview baseline. Show sensitivity: from 95%→98% halves miss contribution from 5 to 2.",
    "commonPitfalls": [
      "AMAT = h×1 + (1−h)×100 forgetting hit time also paid on miss path variants — state the model used.",
      "Mixing rate vs ratio terminology."
    ],
    "interviewerFollowups": [
      "Two-level cache AMAT expansion?",
      "How does prefetch change effective h?"
    ],
    "tags": [
      "cache",
      "amat",
      "performance"
    ]
  },
  {
    "id": "apt-18",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "A memory interface is 256-bit wide at 1.5 GHz DDR (data on both edges). Peak bandwidth in GB/s? If efficiency is 70%, sustained bandwidth? How many 64B lines per second sustained?",
    "shortSummary": "Peak: 256/8 × 1.5 × 2 = **96 GB/s**. Sustained: 0.7×96 = **67.2 GB/s**. Lines: 67.2e9/64 ≈ **1.05×10⁹** lines/s.",
    "detailedAnswer": "Bytes per edge transfers: \\(256/8=32\\) bytes per transfer edge.  \n  DDR at 1.5 GHz clock → 3×10⁹ transfers/s.  \n  Peak = \\(32 × 3×10^9 = 96×10^9\\) B/s = **96 GB/s** (decimal GB).\n\n  Sustained = \\(0.7×96 = 67.2\\) GB/s.  \n  64B lines/s: \\(67.2×10^9 / 64 = 1.05×10^9\\).\n\n  Note GB vs GiB interview clarification if pedantic.",
    "commonPitfalls": [
      "Forgetting ×2 for DDR.",
      "Using 256 bits as bytes."
    ],
    "interviewerFollowups": [
      "HBM stack bandwidth aggregation?",
      "How do turnarounds kill efficiency?"
    ],
    "tags": [
      "bandwidth",
      "ddr",
      "memory"
    ]
  },
  {
    "id": "apt-19",
    "company": "amd",
    "companyName": "AMD",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "If each async arrival independently violates the aperture with probability p=10^{-4} per clock, what is the probability of at least one violation in 10^6 clocks? Approximate with 1−e^{−λ}.",
    "shortSummary": "Expected violations λ=10^6×10^{-4}=100. P(at least one)=1−(1−p)^N≈1−e^{−100}≈**1** (certainty). For λ=0.01 (e.g., N=100), ≈0.01.",
    "detailedAnswer": "Exact: \\(1-(1-p)^N = 1-(0.9999)^{10^6}\\).  \n  \\(\\approx 1-e^{-Np}=1-e^{-100}≈1-3.7×10^{-44}≈1\\).\n\n  This is why raw single-FF async inputs fail; synchronizers reduce effective p exponentially via resolution time, not by hoping N is small.\n\n  For λ=0.01: \\(1-e^{-0.01}≈0.00995\\).",
    "commonPitfalls": [
      "Answering Np=100 as a probability.",
      "Using e^{−N} without p."
    ],
    "interviewerFollowups": [
      "Connect p to Tw·fdata formula.",
      "Birthday paradox analogy for collision?"
    ],
    "tags": [
      "probability",
      "metastability",
      "poisson-approx"
    ]
  },
  {
    "id": "apt-20",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "A 4-way set-associative cache has 64 sets and 64-byte lines. How large is the data array? Bits for set index and offset? For a 32-bit address, how many tag bits?",
    "shortSummary": "Data array = 4×64×64 = **16384 B = 16 KB**. Offset=6 bits, index=6 bits, tag=32−6−6=**20 bits**.",
    "detailedAnswer": "Capacity = ways × sets × line size = \\(4×64×64=16384\\) bytes.\n\n  Offset: \\(\\log_2 64=6\\). Index: \\(\\log_2 64=6\\). Tag: \\(32-12=20\\).\n\n  Number of lines total = 256; tags stored per line separately from data array.",
    "commonPitfalls": [
      "Using 4×64 as size without line bytes.",
      "Forgetting offset bits in tag calculation."
    ],
    "interviewerFollowups": [
      "Physically indexed vs virtually indexed set bits?",
      "Victim cache size intuition?"
    ],
    "tags": [
      "cache",
      "addressing",
      "powers-of-two"
    ]
  },
  {
    "id": "apt-21",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "A GPU kernel launches 100 wavefronts. Each needs 40 cycles to fill a pipe before producing, then produces 200 useful beats. Rough fraction of cycles spent in fill vs useful if they run strictly one after another on one SM pipe? How does occupancy of 10 concurrent wavefronts change the story qualitatively?",
    "shortSummary": "Serial: fill 100×40=4000; useful 100×200=20000; fill fraction=4000/24000≈**16.7%**. With 10-way overlap, fills hide under others’ useful work — effective fill tax drops dramatically (bounded by depth/concurrency).",
    "detailedAnswer": "Serial total = \\(100(40+200)=24000\\) cycles; fill%=\\(4000/24000=1/6≈16.7\\%\\).\n\n  With concurrency C=10, the pipeline stays full after initial fill of ~40 cycles while wavefronts round-robin; fill overhead amortized ≈ 40/(40+200×10) on a saturated pipe — much smaller. This is why occupancy / latency hiding is a numeric interview theme at Nvidia.",
    "commonPitfalls": [
      "Adding fills without considering overlap.",
      "Assuming fill%=40/200 always."
    ],
    "interviewerFollowups": [
      "Little’s Law for in-flight waves: L=λW?",
      "When does memory latency dominate fill?"
    ],
    "tags": [
      "pipeline",
      "occupancy",
      "gpu",
      "geometric"
    ]
  },
  {
    "id": "apt-22",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "A 4:1 mux randomly picks an input each cycle uniformly. Inputs toggle at rates 0.1, 0.2, 0.3, 0.4 transitions/cycle. Expected output toggle rate? If select is frozen, what’s the output rate?",
    "shortSummary": "With random independent select each cycle, output toggle depends on select changes and data — if select re-chosen every cycle independently of data, E[toggle] is not the average of input rates. If select is static uniform random once, E[rate]=**(0.1+0.2+0.3+0.4)/4=0.25**.",
    "detailedAnswer": "**Static select** (typical activity estimation with fixed config):  \n  \\(E[\\alpha_{out}]=\\sum p_i \\alpha_i=0.25\\).\n\n  **Reselect every cycle independent:** output equals a randomly chosen input each cycle; P(out differs from previous) requires joint model of previous select/data. If inputs are independent Bernoulli toggles and select i.i.d., computation expands — interview often wants the static case plus awareness that muxing increases activity when select switches among uncorrelated sources (can approach 0.5 for random data).\n\n  Staff answer: for power, use SAIF/VCD; closed form average is OK only under stated select policy.",
    "commonPitfalls": [
      "Always averaging rates regardless of select dynamics.",
      "Claiming mux always halves activity."
    ],
    "interviewerFollowups": [
      "Clock gate enable duty → dynamic power scale?",
      "Why \\(P=½CV^2αf\\) uses α≤1?"
    ],
    "tags": [
      "expected-value",
      "activity-factor",
      "power"
    ]
  },
  {
    "id": "apt-23",
    "company": "intel",
    "companyName": "Intel",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "A net is stuck-at-0 with prior probability 10^{-6} (rare defect model). A test pattern fails (observes 0 when 1 expected) with likelihood 0.9 if stuck-at-0, and false fail probability 10^{-4} if healthy. Given fail, posterior P(stuck-at-0|fail)?",
    "shortSummary": "Bayes: P(F)=0.9×10^{-6}+10^{-4}×(1−10^{-6})≈1.0009×10^{-4}. Posterior≈\\(9×10^{-7}/1.0009×10^{-4}≈0.009\\) (**~0.9%**). One fail is weak evidence when false-fail rate ≫ defect prior.",
    "detailedAnswer": "Let D = defective SA0. P(D)=1e-6.\n\n  \\(P(F)=P(F|D)P(D)+P(F|¬D)P(¬D)=0.9×1e-6 + 1e-4×(1-1e-6)≈9e-7+1e-4=1.000009e-4\\).\n\n  \\(P(D|F)=\\dfrac{0.9×1e-6}{1.000009e-4}≈0.008999≈\\mathbf{0.90\\%}\\).\n\n  Staff DFT interview: volume diagnosis needs multiple patterns / syndrome consistency because single fails are dominated by noise/false fails at leading-edge rates.",
    "commonPitfalls": [
      "Answering 90% (the likelihood, not posterior).",
      "Ignoring base rate of defects."
    ],
    "interviewerFollowups": [
      "How many independent fails to push posterior >0.5?",
      "Relate to ATPG quality vs spurious fails on ATE?"
    ],
    "tags": [
      "bayes",
      "dft",
      "base-rate",
      "staff"
    ]
  },
  {
    "id": "apt-24",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "An SM has 4 schedulers, each can issue 1 instruction/cycle. A warp needs an instruction every 4 cycles on average (latency hiding). How many resident warps are needed to fully utilize one scheduler in the mean? If each warp uses 128 registers and the SM has 65536 registers, what’s the register-limited occupancy cap?",
    "shortSummary": "Mean occupancy need ≈4 warps per scheduler (Little’s L=λW with W=4, λ=1 issue/warp/cycle when ready). Register cap: 65536/128=**512 warps** theoretical — but per-SM architectural warp slots usually smaller (e.g., 64); registers often bind first at high RF usage.",
    "detailedAnswer": "For one scheduler: desired issue rate 1/cycle. Each warp contributes ~0.25 issues/cycle if it issues once per 4 cycles → need **~4 warps** per scheduler, **~16** across 4 schedulers, ignoring stalls.\n\n  Register limit: \\(\\lfloor 65536/128\\rfloor=512\\) warps — far above typical `max_warps` hardware limit, so this RF footprint is fine; if 256 regs/warp → 256 warps still may exceed slot limits or not.\n\n  Interview: occupancy = resident warps / max warps; link to latency hiding math L=λW.",
    "commonPitfalls": [
      "Equating occupancy % directly to performance (non-monotonic sometimes).",
      "Ignoring shared memory as another limiter."
    ],
    "interviewerFollowups": [
      "Shared memory 64 KB with 1 KB per block — occupancy?",
      "Why 50% occupancy can beat 100%?"
    ],
    "tags": [
      "occupancy",
      "gpu",
      "littles-law",
      "registers"
    ]
  },
  {
    "id": "apt-25",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "aptitude-quantitative",
    "domainName": "Quantitative Aptitude & Engineering Math",
    "role": "Hardware Engineering Candidate",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "Sustained write rate 0.8 beats/clk_w, read rate 0.8 beats/clk_r, but clocks are plesiochronous with long-term rate equal. Bursts: writer may run at 1.0 for up to 50 cycles while reader stalls for 10 cycles (worst aligned). Bound the FIFO depth. Discuss leftover margin for CDC pointer sync latency of 4 cycles each side.",
    "shortSummary": "Worst backlog ≈50 writes during a window where reads miss 10 → need roughly 50+10 plus sync margin; more cleanly: integrate max(∫(w−r)dt) over adversary schedules. A bound: depth ≥ 50 + 10 + 4 + 4 = **68** beats (conservative), then round to power-of-two **128** for gray FIFO.",
    "detailedAnswer": "Long-term rates match ⇒ finite depth exists. Worst-case excursion is the maximum cumulative write−read difference.\n\n  Conservative envelope:\n  - 50 consecutive write-only cycles → +50  \n  - 10 reader stall cycles overlapping → additional +10 if writer still active  \n  - Full/empty flags delayed by pointer sync (~4 wr + 4 rd cycles of uncertainty) → +8  \n\n  Bound ≈68. Implement depth 128 for gray code simplicity and margin.\n\n  Staff story: sizing from rate averages alone (depth 2) fails bursty traffic; use credit watermarks and formal/sim stress with phase sweep.",
    "commonPitfalls": [
      "Depth=1 because average rates match.",
      "Ignoring almost-full reaction latency."
    ],
    "interviewerFollowups": [
      "How do you derive depth from a token-bucket traffic shaper?",
      "Elastic buffer in SATA/PCIe — same integral bound?"
    ],
    "tags": [
      "fifo-depth",
      "burst",
      "cdc",
      "staff"
    ]
  },
  {
    "id": "cdc-06",
    "company": "arm",
    "companyName": "Arm",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Design a 4-phase (return-to-zero) asynchronous handshake to transfer a multi-bit payload between two unrelated clocks. Which signals are synchronized, and when is the data bus allowed to change?",
    "shortSummary": "Synchronize only the 1-bit `req` into the destination and 1-bit `ack` back into the source. Hold `data` stable from req assert until ack is seen (and typically until req deassert completes). Never synchronize the data bits with independent 2-FF banks.",
    "detailedAnswer": "**Phases:**\n  1. Source drives stable `data`, asserts `req`.\n  2. Dest synchronizes `req`, captures `data` into dest-domain regs, asserts `ack`.\n  3. Source synchronizes `ack`, deasserts `req` (data may hold or go don't-care per protocol).\n  4. Dest sees `req` low (synced), deasserts `ack`. Idle when both low.\n\n  Throughput ≈ several destination+source cycles per word — slower than a deep async FIFO but simple and robust for sparse control/config writes.\n\n  **Stability window:** data must remain unchanged while dest might sample it — i.e., from before synced req is observed through capture. SDC often uses `set_max_delay` on the data envelope with the req as a control qualifier, or treats data as quasi-static relative to the handshake event.",
    "tclOrVerilogSnippet": {
      "lang": "verilog",
      "code": "// Source: wait (!ack_sync); data<=payload; req<=1;\n  //         wait (ack_sync); req<=0; wait (!ack_sync);\n  // Dest:   if (req_sync && !ack) begin data_q<=data; ack<=1; end\n  //         else if (!req_sync) ack<=0;"
    },
    "commonPitfalls": [
      "Synchronizing every data bit independently (reconvergence).",
      "Changing data while `req` remains asserted."
    ],
    "interviewerFollowups": [
      "2-phase (NRZ toggle) handshake vs 4-phase tradeoffs.",
      "Ready/valid async adaptation of AXI — why it is hard."
    ],
    "tags": [
      "handshake",
      "four-phase",
      "multi-bit-cdc",
      "req-ack"
    ]
  },
  {
    "id": "cdc-07",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Producer writes at up to $f_w$ with bursts of $B$ beats and minimum idle $G$ cycles; consumer reads at $f_r$. How do you size an async FIFO depth to guarantee no overflow, including pointer sync latency?",
    "shortSummary": "Depth must cover worst-case accumulated excess writes during the time the consumer is slow **plus** gray-pointer synchronization latency (typically 2–3 dest cycles of “stale” emptiness/fullness). Power-of-two depths simplify gray pointers.",
    "detailedAnswer": "Ignoring CDC latency first: integrate write−read over the worst window (often a burst). Example: if $f_w=f_r$ but writer bursts $B$ back-to-back while reader stalls $S$ cycles, need depth $\\ge B+S$ (minus overlap if any).\n\n  **CDC pessimism:** full/empty flags use **synchronized, delayed** pointers ⇒ the writer may think the FIFO is not full for 2–3 write clocks after it actually filled from the reader’s view (and vice versa for empty). Add margin $M_{\\text{sync}}$ (commonly ≥3–4 entries, design-dependent).\n\n  Formal: prove `!(full && write)` and `!(empty && read)` under async assumptions, or bound with rate-credit math. Depth must be $2^n$ for standard gray full/empty equations.",
    "commonPitfalls": [
      "Sizing from average rates only (bursts overflow).",
      "Forgetting sync latency margin."
    ],
    "interviewerFollowups": [
      "Almost-full / almost-empty thresholds for credit protocols.",
      "Why bi-synchronous FIFO IP still needs correct gray width $n+1$."
    ],
    "tags": [
      "async-fifo",
      "depth-sizing",
      "burst",
      "sync-latency"
    ]
  },
  {
    "id": "cdc-08",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Gray encoding protects single-step pointer increments. What fails if the producer jumps the write pointer by more than 1 (multi-beat update, flush, or non-power-of-two wrap tricks)? What alternatives exist?",
    "shortSummary": "Multi-bit gray transitions can have Hamming distance >1 ⇒ sampler may see illegal intermediate codes. Alternatives: handshake per word, binary pointers with handshake of a “valid snapshot,” or counted token credits; do not async-sample arbitrary binary vectors.",
    "detailedAnswer": "Gray’s safety theorem requires **unit-distance** transitions. A flush that adds 8 to a pointer can flip many gray bits. Metastability/sampling can then construct a code that is neither old nor new — false full/empty.\n\n  Fixes:\n  - Restrict hardware to +1 increments (normal FIFO).\n  - For jumps: pass an absolute binary pointer under an explicit multi-cycle handshake (data stable while req toggles).\n  - Or send delta counts with a synchronized strobe and reconstruct in the receiver (careful with lost strobes).\n\n  Interviewers look for recognition that gray is not magic — it is a unit-distance code.",
    "commonPitfalls": [
      "Gray-converting a free-running binary counter that sometimes loads mid-stream."
    ],
    "interviewerFollowups": [
      "Gray counter vs gray **encoder** on binary register — same property only if +1.",
      "Johnson / one-hot rings as unit-distance alternatives for small state."
    ],
    "tags": [
      "gray-code",
      "hamming-distance",
      "pointer-jump"
    ]
  },
  {
    "id": "cdc-09",
    "company": "texas-instruments",
    "companyName": "Texas Instruments",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "An SoC has 12 asynchronous clocks and one chip-level async reset. How do you architect reset distribution? Why is a single shared synchronizer insufficient?",
    "shortSummary": "One **async-assert / sync-deassert** reset bridge **per clock domain** (sometimes per reset domain). A single synchronizer’s output is async to other clocks and recreates recovery/removal hazards there. Manage reset sequencing between domains that share interfaces.",
    "detailedAnswer": "Hierarchy:\n  1. POR / pin reset → cleaned (filter) → fanout.\n  2. Per-domain `rst_sync` bridges.\n  3. Optional software-controllable soft resets per block, also synced on deassert.\n\n  **Ordering:** bring up lowest-level PHY clocks first, release reset after clocks are stable (PLL lock). For CDC links, hold sources in reset until dest bridges are ready, or design links to tolerate X during bring-up (isolation).\n\n  RDC tools check reset assertion/deassertion crossings analogous to CDC.",
    "commonPitfalls": [
      "One global synced reset used as async reset into all domains.",
      "Releasing domain A while domain B still drives X into A’s sync inputs."
    ],
    "interviewerFollowups": [
      "Reset tree buffering vs clock tree — STA recovery/removal.",
      "“Reset domain crossing” false failures from intentional async assert."
    ],
    "tags": [
      "multi-clock-reset",
      "rdc",
      "reset-bridge",
      "bring-up"
    ]
  },
  {
    "id": "cdc-10",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "A single-cycle pulse in a **slow** clock domain must be observed in a **fast** domain. Why can a plain 2-FF level synchronizer work here when it fails fast→slow, and when do you still need an edge detector / stretcher?",
    "shortSummary": "If the slow pulse width $\\ge 1.5$–$2$ fast clocks, the fast domain will sample it at least once — level sync works. Still use stretch/edge logic if you need a **single-cycle** fast pulse, or if pulse width is only one slow cycle but ratios vary with DVFS.",
    "detailedAnswer": "Sampling criterion: pulse high time $W$ must exceed destination period with margin. Slow→fast usually satisfies $W \\gg T_{\\text{fast}}$.\n\n  To regenerate a 1-cycle fast pulse: sync the level, then `(sync & ~sync_d)` edge detect. If the slow pulse can be longer than one slow cycle, decide whether to pulse once or hold while level is high.\n\n  DVFS hazard: frequencies change; a design that “usually” works at nominal ratio may fail at corner ratios — prefer toggle/handshake protocols when ratios are not guaranteed.",
    "commonPitfalls": [
      "Assuming slow→fast never loses edges under DFS.",
      "Double-pulsing from noisy async inputs without hysteresis."
    ],
    "interviewerFollowups": [
      "Closed-loop ACK so slow domain knows fast saw the event.",
      "Stretching with a counter in the fast domain vs source-side stretch."
    ],
    "tags": [
      "pulse-stretch",
      "slow-to-fast",
      "edge-detect",
      "dvfs"
    ]
  },
  {
    "id": "cdc-11",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Besides an open-loop toggle synchronizer, describe a **closed-loop** pulse/event transfer from fast→slow that prevents event overrun. When is an async FIFO mandatory?",
    "shortSummary": "Req/ack or toggle-with-busy: source may not issue another event until synchronized ACK returns. If events can queue faster than the round-trip allows, use a FIFO (depth >1) or drop/coalesce policy.",
    "detailedAnswer": "Open-loop toggle fails when a second toggle occurs before the slow domain samples the first (back-to-back fast events). Closed-loop:\n\n  1. Source toggles/asserts req only if `!busy`.\n  2. Busy set until ACK synchronized back from slow domain.\n  3. Minimum spacing ≥ sync latency round trip (often ≥ 3 slow + 3 fast cycles).\n\n  If the application cannot stall the source (e.g., line-rate packets), depth-$N$ async FIFO or elastic buffer is mandatory; handshake alone cannot create storage.",
    "commonPitfalls": [
      "Using open-loop toggle for interrupt storms.",
      "ACK path without its own synchronizer."
    ],
    "interviewerFollowups": [
      "Credit-based vs ack-based event channels.",
      "Coalescing multiple fast interrupts into one slow IRQ bit."
    ],
    "tags": [
      "closed-loop-cdc",
      "busy-ack",
      "event-overrun",
      "fifo"
    ]
  },
  {
    "id": "cdc-12",
    "companyName": "JasperGold / SpyGlass CDC",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Categorize major CDC lint findings (not just “missing sync”). Give examples of structural, scheme, and reconvergence classes and how you disposition waivers.",
    "shortSummary": "Typical classes: unsynchronized crossings, missing/partial sync cells, multi-bit bus reconvergence, combinational logic before sync, pulse/glitch hazards, reset crossings, clock-group mismatches, and quasi-static violations. Waive only with documented scheme + SDC evidence.",
    "detailedAnswer": "| Class | Example | Typical fix |\n  |---|---|---|\n  | Structural | Combo cloud into sync D pin | Register in source domain |\n  | Scheme | Multi-bit with per-bit sync | Handshake/FIFO |\n  | Reconvergence | Divergent synced controls | Common sync / gray / FSM redesign |\n  | Naming/cell | Inferred sync without hardened cell | Instantiate sync IP + dont_touch |\n  | Reset | Async reset into other domain data | RDC bridges |\n  | Constraint | Path still timed or unconstrained wrongly | clock_groups / max_delay |\n\n  Waivers need owner, rationale, and review expiry. “Tool false positive” without waveform/scheme proof is not acceptable at staff level.",
    "commonPitfalls": [
      "Mass-waiving reconvergence.",
      "Sync cell optimized away / retimed apart in PnR."
    ],
    "interviewerFollowups": [
      "How do you verify sync pair placement max distance?",
      "CDC on DFT scan paths — special case?"
    ],
    "tags": [
      "cdc-lint",
      "jaspergold",
      "spyglass",
      "waivers"
    ]
  },
  {
    "id": "cdc-13",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What is a quasi-static (software-static) CDC signal? What constraints and runtime rules make it legal without a full handshake on every bit?",
    "shortSummary": "A multi-bit value that changes rarely, with a guarantee it is stable for a long window and that consumers sample it only under a synchronized “update” qualifier—or after reset/config quiet periods. SDC often `set_false_path` or loose `set_max_delay` on the data with functional guarantees.",
    "detailedAnswer": "Examples: MMIO configuration programmed long before use; strap pins sampled once after reset.\n\n  Rules:\n  1. Writer updates only when reader is known idle / gated off, **or**\n  2. Writer toggles a synchronized `cfg_update` after data has been stable for $N$ cycles; reader samples data only on detecting update.\n\n  Without (1) or (2), quasi-static is just an unsynchronized multi-bit bug with a fancy name. Document in CDC waivers and verify with assertions (`$stable(data)` until update).",
    "commonPitfalls": [
      "Labeling a streaming video bus “quasi-static.”",
      "Changing cfg while the block runs without an update event."
    ],
    "interviewerFollowups": [
      "How do UVM RAL sequences enforce quiet windows?",
      "Distinction from false-path clock crossings that still need glitch-free muxing."
    ],
    "tags": [
      "quasi-static",
      "config-cdc",
      "waiver",
      "set_max_delay"
    ]
  },
  {
    "id": "cdc-14",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Explain mux-recoding (control recoding) as a multi-bit CDC technique. How does it differ from gray coding a counter?",
    "shortSummary": "Recode a multi-bit control field into a 1-hot or unit-distance representation so that asynchronous sampling cannot create a dangerous illegal combination; or send an index with a synchronized enable. Gray is a special unit-distance code for counters; recoding is the general FSM/control analogue.",
    "detailedAnswer": "Example hazard: 2-bit `{mode0,mode1}` changing $00\\to11$ may be sampled as $01$ or $10$, enabling two illegal modes briefly.\n\n  Recoding approaches:\n  - **One-hot modes** with synchronized bit-by-bit only if transitions are guaranteed one-hot adjacent (still risky) — better: synchronize a single “token” bit and keep payload stable (handshake).\n  - **Priority encode** after sync of a one-hot vector with care (multi-hot glitch) — usually inferior to handshake.\n  - Industry “mux recode”: transform controls so intermediate values are safe no-ops; destination re-encodes to local binary.\n\n  Staff answer emphasizes **safe intermediate states**, not merely “use gray for everything.”",
    "commonPitfalls": [
      "Gray-encoding arbitrary enums that do not traverse gray adjacencies."
    ],
    "interviewerFollowups": [
      "Safe FSM encoding across async boundaries.",
      "Recoding vs async FIFO of command descriptors."
    ],
    "tags": [
      "mux-recode",
      "unit-distance",
      "control-cdc"
    ]
  },
  {
    "id": "cdc-15",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What dynamic verification (simulation) checkers prove CDC protocols beyond static lint? Give assertions for handshake and for “no change while crossing.”",
    "shortSummary": "Assertions: data stable while req asserted; req/ack 4-phase sequencing; toggle spacing; FIFO no write-when-full; sync input not driven by combo glitches. Plus dual-clock constrained-random and CDC-aware formal (check_cdc).",
    "detailedAnswer": "Example properties:\n  ```systemverilog\n  // Data stable from req rise until ack rise (src view)\n  assert property (@(posedge clk_s)\n    $rose(req) |-> $stable(data) until $rose(ack_sync));\n  ```\n  Also check destination does not capture unless `req_sync` is asserted.\n\n  Stimulus must inject async phase sweep (offset clocks) — aligned TB clocks miss bugs. Formal CDC apps prove absence of structural issues; protocol assertions prove scheme correctness.",
    "commonPitfalls": [
      "Only running lint, never async phase simulation.",
      "Assertions clocked on the wrong domain."
    ],
    "interviewerFollowups": [
      "How do you model metastability in sim (nondeterministic delay)?",
      "Cover bins for min toggle spacing."
    ],
    "tags": [
      "assertions",
      "cdc-dv",
      "formal",
      "sva"
    ]
  },
  {
    "id": "cdc-16",
    "companyName": "STA + CDC",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "When is `set_max_delay -datapath_only` used for CDC instead of `set_clock_groups -asynchronous`? What value do you pick, and what still must be synchronized?",
    "shortSummary": "For synchronized control + multi-bit data that must arrive within a bounded skew window (handshake data, gray pointers sometimes), max_delay budgets combinational/routing skew between bits. Control/event bits still need proper sync flops; max_delay does not fix metastability.",
    "detailedAnswer": "`set_clock_groups -asynchronous` ignores timing entirely — fine for pure async with synchronizers, but then bit skew on a handshake payload is unchecked.\n\n  `set_max_delay $T -datapath_only -from src_reg -to dst_reg` constrains skew so all bits of a static bus arrive within $T$ (often a fraction of dest period). `-datapath_only` excludes clock path insertion from the check.\n\n  Still required: synchronizers on req/ack; data must be stable; ignore max_delay as a substitute for 2-FF on an async control.",
    "commonPitfalls": [
      "Max_delay on free-running async controls without sync.",
      "Overly tight max_delay causing impossible PnR."
    ],
    "interviewerFollowups": [
      "Interaction with `set_false_path` waivers on the same nets.",
      "Point-to-point vs fanout max_delay."
    ],
    "tags": [
      "set-max-delay",
      "datapath-cdc",
      "sta",
      "skew"
    ]
  },
  {
    "id": "cdc-17",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "When do you choose a 3-FF synchronizer over 2-FF? Quantify the MTBF intuition and the latency cost.",
    "shortSummary": "When $f_{\\text{clk}}$ is high, $\\tau$ is poor (slow library / low V), or safety goals demand huge MTBF. Extra stage adds one more destination cycle of latency but multiplies MTBF roughly by $e^{T/\\tau}$.",
    "detailedAnswer": "Resolution time grows from $\\sim T$ to $\\sim 2T$ (minus setup). Because MTBF $\\propto e^{t_r/\\tau}$, one extra stage is exponential gain. Automotive / high-reliability / multi-GHz domains often standardize on 3FF or library-hardened sync cells with special circuit design (not just three flops).\n\n  Cost: +1 cycle latency on controls; throughput protocols must budget it. Never mix 2FF and 3FF carelessly on related controls (reconvergence depth mismatch).",
    "commonPitfalls": [
      "Adding a 3rd flop far away without `dont_touch` / grouping — PnR breaks the chain."
    ],
    "interviewerFollowups": [
      "Synopsys/Cadence hardened synchronizer cells vs RTL flops.",
      "MTBF at 0.6 V deep sleep vs nominal."
    ],
    "tags": [
      "3ff",
      "mtbf",
      "latency",
      "hardened-sync"
    ]
  },
  {
    "id": "cdc-18",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Describe a 2-phase (NRZ) toggle handshake for data transfer. How do phase wires encode requests without return-to-zero?",
    "shortSummary": "Each level **transition** on `req` means a new transaction; `ack` transitions to complete. Idle can be either level. Faster than 4-phase (fewer transitions) but edge-sensitive and harder to debug reset polarity.",
    "detailedAnswer": "Protocol:\n  - Source puts data, toggles `req` when it differs from `ack` (phase unequal means outstanding).\n  - Dest captures on detecting `req_sync != ack`, then toggles `ack`.\n  - Source sees phases equal again ⇒ can issue next.\n\n  Compared to 4-phase: half the phase events per word. Reset must define initial equal phases; a mismatch after reset causes a spurious transaction — initialize carefully.",
    "commonPitfalls": [
      "Interpreting level high as “request valid” (that is 4-phase thinking).",
      "Losing a toggle when DVFS violates spacing."
    ],
    "interviewerFollowups": [
      "Convert 2-phase to AXI-valid/ready in one domain.",
      "Why async FIFO often preferred for streaming anyway."
    ],
    "tags": [
      "two-phase",
      "nrz-handshake",
      "toggle-phase"
    ]
  },
  {
    "id": "cdc-19",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "You must qualify a counter in domain B with an enable generated in domain A. Compare: (1) synchronize enable, (2) generate a pulse event, (3) move the counter to domain A. Failure modes?",
    "shortSummary": "Sync’ing a multi-cycle enable level is OK if width meets sampling rules; 1-cycle enables need pulse sync. Related counters in two domains diverge under lost enables — prefer single domain or gray-coded shared count with proper sync.",
    "detailedAnswer": "Hazards:\n  - Narrow enable pulse lost (fast→slow).\n  - Enable synchronized but data associated with it is not (partial scheme).\n  - Stretching enable causes multiple increments in a fast domain when only one was intended — use edge detect.\n\n  Best practice: keep coherent state in one clock; cross events or snapshots, not “continuous enables” for shared mathematical state.",
    "commonPitfalls": [
      "Level-sync a 1-cycle enable into a slower clock."
    ],
    "interviewerFollowups": [
      "Sample-and-hold of an entire register file on an enable event.",
      "Credit returns as enables."
    ],
    "tags": [
      "clock-enable",
      "pulse-vs-level",
      "coherent-state"
    ]
  },
  {
    "id": "cdc-20",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Why do CDC guidelines forbid combinational clouds feeding the first synchronizer flop? What about an AND of two already-async signals?",
    "shortSummary": "Combo logic glitches can produce runt pulses that set metastability or be sampled as false events. AND/OR of two unsynchronized async sources creates untimed glitch windows — synchronize each source first (or in source domains), then combine in the destination.",
    "detailedAnswer": "Glitch may violate pulse-width assumptions of the sync cell. Even without glitches, the arrival time is untimed relative to dest clock.\n\n  Pattern: register in source → sync chain → combo in destination. Exception: vendor sync cells with specified input filtering still want clean source-registered inputs.",
    "commonPitfalls": [
      "“It’s only an inverter” — still a delay path; usually OK electrically but lint flags; consistent methodology prefers registered.",
      "Muxing two clocks’ data into sync D with select async."
    ],
    "interviewerFollowups": [
      "Glitch filtering synchronizers — when allowed?",
      "Multi-input XOR of many async IRQs."
    ],
    "tags": [
      "glitch",
      "sync-input",
      "lint",
      "combo-cloud"
    ]
  },
  {
    "id": "cdc-21",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How do you implement a reusable synchronizer module so synthesis/PnR cannot destroy MTBF (retiming, resizing apart, scan replacement issues)?",
    "shortSummary": "Instantiate library hardened sync or a module with `dont_touch`/`size_only`, adjacent placement constraints / bounds, no combo between stages, and documented scan strategy (lock sync stages or use approved scanable sync cells).",
    "detailedAnswer": "Risks: retiming moves logic across FF1; physical distance increases wire delay between FF1–FF2 eating resolution time; scan muxes add delay on D; useful-skew optimizations move clocks.\n\n  Controls: `set_dont_retime`, placement halo, max wire length between stages, preserve hierarchy, and CDC tools recognizing sync pairs by cell type/name.",
    "commonPitfalls": [
      "Inferring sync from generic RTL without attributes.",
      "Different Vt/size on FF1 vs FF2 causing unmatched $\\tau$."
    ],
    "interviewerFollowups": [
      "Should sync flops be on scan chains?",
      "CPFs of synchronizer vs functional flops."
    ],
    "tags": [
      "dont-touch",
      "placement",
      "hardened-ip",
      "mtbf"
    ]
  },
  {
    "id": "cdc-22",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Build a decision matrix: for a given crossing, when do you apply `set_false_path`, `set_clock_groups -asynchronous`, or `set_max_delay`? What is dangerous about stacking them inconsistently?",
    "shortSummary": "Clock groups: default for fully async domains with sync schemes. False path: specific exceptions (quasi-static statics). Max delay: bounded skew buses under handshake. Inconsistent mixes can leave paths both ignored and required, or double-waived real bugs.",
    "detailedAnswer": "Prefer **one** coherent methodology documented in the SDC cookbook:\n  - Async domains → `set_clock_groups -asynchronous` between clocks.\n  - Then selectively **re-constrain** handshake data with `set_max_delay` where needed (overrides must be understood per tool).\n  - Point false paths for rare static straps.\n\n  Audits: `check_timing`, CDC-SDC consistency reports, and ensuring sync cells are not false-pathed into oblivion so recovery checks disappear incorrectly.",
    "commonPitfalls": [
      "False-pathing the entire dest sync first flop (hides real issues).",
      "Relying on tool defaults when clock groups omitted (GIGO timing)."
    ],
    "interviewerFollowups": [
      "Physically vs logically exclusive interaction with CDC.",
      "Generated clocks from same PLL — not async."
    ],
    "tags": [
      "sdc",
      "false-path",
      "max-delay",
      "clock-groups",
      "methodology"
    ]
  },
  {
    "id": "cdc-23",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Explain the “data + synchronized valid” pattern: multi-bit data free-runs in the source, destination samples only when a synced qualifier says the window is safe. What SDC and RTL rules apply?",
    "shortSummary": "Source asserts `valid` only after data has been stable long enough; `valid` is synchronized (or is a toggle event). Destination captures `data` only on synced valid. Data lines use max_delay/false_path per methodology; they are not independently synchronized bit-wise.",
    "detailedAnswer": "This is the practical family behind handshakes and quasi-static updates. Critical RTL bug: destination using `data` combinationally while `valid_sync` is low (X or torn values). Gate all use by the qualifier.\n\n  If valid is level-held for many slow cycles, fast dest may resample many times — use edge detect if one-shot capture is required.",
    "commonPitfalls": [
      "Sampling data on the same dest cycle valid first becomes 1 without a hold delay from source (need stability before valid)."
    ],
    "interviewerFollowups": [
      "Valid/ready with async — why ready must also close the loop.",
      "Using gray code for the payload itself vs for pointers only."
    ],
    "tags": [
      "valid-qualifier",
      "multi-bit",
      "handshake-family"
    ]
  },
  {
    "id": "cdc-24",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How does an RDC problem differ from a classic data CDC problem? Give an example where reset assertion is safe but reset release ordering across two domains corrupts a shared interface.",
    "shortSummary": "RDC concerns resets as asynchronous controls into flops (recovery/removal, partial reset). Example: domain A out of reset drives start-up transactions while domain B still holds reset — B’s sync/FIFO logic is X or stuck, causing deadlock or metastability on ack lines.",
    "detailedAnswer": "Tools analyze reset assertion sources vs clock domains. Fixes: per-domain bridges, reset controllers with sequence enables, isolation defaults on inter-domain interfaces during reset, and explicit “ready for traffic” status bits synchronized between domains.\n\n  Soft reset of only one side of an async FIFO is a classic foot-gun — pointers diverge forever unless both sides reset coherently or soft-reset is forbidden.",
    "commonPitfalls": [
      "Soft-resetting only the write side of an async FIFO.",
      "Treating RDC waivers like CDC data waivers."
    ],
    "interviewerFollowups": [
      "Partial reset of a CPU vs fabric.",
      "Scan clear vs functional reset interactions."
    ],
    "tags": [
      "rdc",
      "reset-ordering",
      "async-fifo-reset",
      "isolation"
    ]
  },
  {
    "id": "cdc-25",
    "domain": "clock-domain-crossing",
    "domainName": "Clock Domain Crossing & Metastability",
    "role": "CDC & SoC Integration Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "Some legacy designs AND a synchronized “select” with multi-bit async data into a dest register (recirculation mux). What is the intended idea, and why do modern CDC methodologies usually reject it for high-speed SoCs?",
    "shortSummary": "Intent: freeze the dest register until select says data is stable, avoiding bit tearing. Reality: timing of data vs select is fragile, glitches and max_delay burdens are high, and handshakes/FIFOs are clearer. Acceptable only for slow quasi-static cases with hard proof.",
    "detailedAnswer": "Recirculation: `q <= sel_sync ? async_data : q`. If `sel_sync` rises only when `async_data` has been stable for a full dest period + skew budget, capture is coherent.\n\n  Failure modes: select arrives while data still transitioning; data transitions while sel stays high; STA can’t prove stability without rigorous max_delay + design discipline. At GHz rates, proving this is harder than building a FIFO.\n\n  Staff stance: prefer standard schemes; if recirculation remains, treat as quasi-static with assertions + lint waiver package.",
    "commonPitfalls": [
      "Using recirculation for streaming buses.",
      "Synchronizing `sel` but changing `async_data` every source cycle."
    ],
    "interviewerFollowups": [
      "Compare to Intel/ARM recommended sync libraries.",
      "How would you formally prove the stability window?"
    ],
    "tags": [
      "recirculation",
      "quasi-static",
      "methodology",
      "anti-pattern"
    ]
  },
  {
    "id": "dv-01",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Explain the UVM factory. How do `set_type_override_by_type` and `set_inst_override_by_type` differ? When would you override a driver instance under one agent but leave sibling agents untouched?",
    "shortSummary": "The factory creates objects by registered type name so tests can substitute derived types without editing the environment. Type override replaces every create of that type; instance override matches a hierarchical instance path and substitutes only there.",
    "detailedAnswer": "UVM components and objects register with the factory via `uvm_component_param_utils` / `uvm_object_utils`. Environments call `type_id::create(\"name\", parent)` instead of `new`, so the factory can return a derived class.\n\n  - **Type override:** `set_type_override_by_type(base::get_type(), derived::get_type())` — every subsequent create of `base` yields `derived`. Use for global substitutions (e.g., all agents use an error-injecting driver).\n  - **Instance override:** `set_inst_override_by_type(\"env.agt[0].drv\", base::get_type(), derived::get_type())` — only the named path is overridden. Sibling `agt[1].drv` stays base.\n\n  Override resolution prefers the most specific instance match, then type override. Overrides must be set **before** `create` of the target. Parameterized classes need `*_by_type` with `get_type()`, not string names alone, to avoid type identity bugs.\n\n  Staff expectation: explain why hardcoding `new derived_driver(...)` inside the agent breaks reuse and why factory + config_db is the standard extensibility pattern for VIP and SoC benches.",
    "tclOrVerilogSnippet": {
      "lang": "systemverilog",
      "code": "// Global: all my_driver creates become err_driver\nmy_driver::type_id::set_type_override(err_driver::get_type());\n\n// Local: only agent 0\nmy_driver::type_id::set_inst_override(err_driver::get_type(), \"uvm_test_top.env.agt[0].drv\");"
    },
    "commonPitfalls": [
      "Setting overrides after `build_phase` creates have already run.",
      "Using string type names with parameterized classes and getting silent base-type creates.",
      "Overriding the agent type when only the driver needed replacement (unnecessary blast radius)."
    ],
    "interviewerFollowups": [
      "How does `factory.print()` help debug a “my override didn’t take” bug?",
      "Difference between `set_type_override` and `set_type_override_by_type`?"
    ],
    "tags": [
      "uvm",
      "factory",
      "override",
      "vip",
      "reuse"
    ],
    "isFreeSample": true
  },
  {
    "id": "dv-02",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "In UVM RAL, what are `mirror`, `predict`, `update`, and `write`? How do frontdoor vs backdoor accesses interact with the mirrored value, and when is `UVM_CHECK` vs `UVM_NO_CHECK` appropriate after reset?",
    "shortSummary": "RAL keeps a mirrored model of DUT registers. `write`/`read` go through a map (frontdoor bus or backdoor peek/poke). `predict` updates the mirror from observed bus activity; `mirror` reads DUT and optionally compares to the mirror; `update` writes DUT from desired values that differ from mirrored.",
    "detailedAnswer": "A `uvm_reg_block` holds `uvm_reg` / `uvm_reg_field` objects with access policies (`RW`, `RO`, `W1C`, `RC`, etc.), reset values, and one or more `uvm_reg_map`s binding registers to addresses and adapters.\n\n  - **`write` / `read`:** Explicit frontdoor (via sequencer/adapter) or backdoor (`UVM_BACKDOOR`) access. Frontdoor exercises the real bus protocol; backdoor uses HDL paths for speed.\n  - **`predict`:** Updates mirrored/desired based on a bus operation observed by a predictor (monitor → `reg_predict`). Critical for keeping the model coherent when the DUT or another master writes registers outside the RAL sequence.\n  - **`mirror(status, UVM_CHECK)`:** Reads DUT (front or back) and compares against mirrored value; fails on mismatch.\n  - **`update`:** Writes only fields whose desired ≠ mirrored — useful after batching desired changes.\n\n  After async reset, mirrored values may be stale. Typical flow: `reset` callback or explicit `mirror(..., UVM_NO_CHECK)` / `set_reset` then `reset()`, then enable checking. `W1C`/`W1S` fields need correct `predict` semantics or scoreboards will false-fail.\n\n  Staff angle: multiple maps (APB vs AHB vs backdoor), byte-enable sparse writes, and locking `uvm_reg_field` access during concurrent sequences.",
    "commonPitfalls": [
      "Calling `mirror(UVM_CHECK)` immediately after reset before the model’s reset values are applied.",
      "Forgetting a predictor when software/CPU also writes the same CSR space.",
      "Treating backdoor write as covering bus protocol bugs (it does not)."
    ],
    "interviewerFollowups": [
      "How do you model a `W1C` interrupt status bit correctly in RAL?",
      "How does `uvm_reg_adapter` `bus2reg`/`reg2bus` interact with your APB VIP?"
    ],
    "tags": [
      "ral",
      "uvm-reg",
      "mirror",
      "predict",
      "frontdoor",
      "backdoor"
    ],
    "isFreeSample": true
  },
  {
    "id": "dv-03",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Distinguish `uvm_sequence`, `uvm_sequencer`, and a virtual sequence. Why should protocol sequences not call `starting_phase.raise_objection` in modern UVM, and where should objections live instead?",
    "shortSummary": "Sequences generate transactions; sequencers arbitrate and deliver them to drivers; virtual sequences coordinate multiple sequencers without driving pins. Objections belong in the test (or a top-level virtual sequence started from the test), not buried in leaf protocol sequences.",
    "detailedAnswer": "- **`uvm_sequence #(REQ)`:** Procedural stimulus — `body()` calls `start_item`/`finish_item` or `uvm_do` macros. Can be layered (sequence calls sub-sequences).\n  - **`uvm_sequencer #(REQ)`:** TLM consumer connected to the driver’s `seq_item_port`. Implements arbitration (`SEQ_ARB_FIFO`, `SEQ_ARB_WEIGHTED`, `SEQ_ARB_RANDOM`, etc.).\n  - **Virtual sequence:** A sequence that holds handles to multiple sequencers (`p_sequencer` cast or explicit `uvm_sequencer_base` pointers) and starts sub-sequences on each. It does **not** connect to a driver.\n\n  Objection hygiene: if every leaf sequence raises/drops objections, early-finishing sequences can drop the last objection while others still run, or nested sequences double-count. UVM recommends raising in the test’s `run_phase` (or one controlling virtual sequence) around `seq.start(sqr)`.\n\n  Layered stimulus (e.g., PCIe TLP sequence on top of DLL/PHY sequences) uses virtual sequences plus sequence libraries for constrained-random scenarios at each layer.",
    "commonPitfalls": [
      "Putting pin-level waits inside a virtual sequence instead of in the driver.",
      "Starting a sequence on the wrong sequencer type (compile-time param mismatch).",
      "Relying on deprecated `raising_objection` inside every `pre_body`."
    ],
    "interviewerFollowups": [
      "How does `set_arbitration(SEQ_ARB_STRICT_FIFO)` change starvation behavior?",
      "What is a sequence library and when do you use `uvm_sequence_library`?"
    ],
    "tags": [
      "uvm",
      "sequences",
      "virtual-sequence",
      "objections",
      "arbitration"
    ]
  },
  {
    "id": "dv-04",
    "company": "intel",
    "companyName": "Intel",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Compare `uvm_blocking_put_port`, `uvm_blocking_get_port`, and `uvm_analysis_port`. Which connection style do monitors use to broadcast to scoreboards and coverage collectors, and why must analysis exports be non-blocking?",
    "shortSummary": "Put/get are point-to-point request/response style TLM-1 interfaces (often blocking). Analysis ports are broadcast (1:N) and call `write()` which must not block, so monitors never stall the DUT interface timing model.",
    "detailedAnswer": "UVM TLM builds on SystemVerilog interfaces:\n\n  | Port | Direction semantics | Typical use |\n  |---|---|---|\n  | `put_port` → `put_imp` | Initiator pushes transaction | Sequencer→driver is actually `seq_item_pull`; put used in custom channels |\n  | `get_port` → `get_imp` | Initiator pulls | Passive consumer fetching from a FIFO |\n  | `analysis_port` → `analysis_imp` / `analysis_export` | Broadcast `write(T)` | Monitor → scoreboard, coverage, predictor |\n\n  Monitor pattern:\n  ```systemverilog\n  uvm_analysis_port #(axi_item) ap;\n  // in run: ap.write(item); // non-blocking fanout\n  ```\n  Scoreboard implements `write(axi_item t)` via `uvm_analysis_imp`. For multiple analysis imps in one component, use `uvm_analysis_imp_decl(_expected)` macros to create distinct `write_expected` methods.\n\n  Blocking `put`/`get` can deadlock if both sides wait. Analysis must be non-blocking because the monitor samples on clock edges; blocking would desynchronize sampling and break cycle accuracy.",
    "commonPitfalls": [
      "Connecting analysis_port to a blocking put_imp.",
      "Forgetting `ap = new(\"ap\", this)` in `build_phase`.",
      "Deep-copy vs handle: writing the same object reference that the monitor mutates next cycle."
    ],
    "interviewerFollowups": [
      "Why clone or copy the transaction before `ap.write`?",
      "How does `uvm_tlm_analysis_fifo` help decouple producer/consumer rates?"
    ],
    "tags": [
      "tlm",
      "analysis-port",
      "monitor",
      "scoreboard"
    ]
  },
  {
    "id": "dv-05",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "What is the difference between `|→` and `|=>` in SystemVerilog Assertions? Write an assertion: when `req` rises, `ack` must be high within 1 to 3 cycles, and explain vacuity.",
    "shortSummary": "`|→` (overlapping) checks the consequent starting in the **same** cycle as the antecedent match; `|=>` (non-overlapping) starts one cycle later. Vacuous success occurs when the antecedent never matches — coverage of the antecedent matters.",
    "detailedAnswer": "Concurrent assertions sample values in the preponed region relative to the clocking event.\n\n  - `a |-> b` ≡ if `a` is true at cycle T, evaluate `b` starting at T.\n  - `a |=> b` ≡ `a |-> ##1 b`.\n\n  For “`req` rose ⇒ `ack` in 1..3 cycles”:\n  ```systemverilog\n  property p_req_ack;\n    @(posedge clk) disable iff (rst_n === 1'b0)\n      $rose(req) |-> ##[1:3] ack;\n  endproperty\n  assert property (p_req_ack);\n  cover property (p_req_ack); // non-vacuous hits\n  ```\n  Use `$rose(req)` so a multi-cycle sticky `req` does not retrigger every cycle unless intended. If protocol allows same-cycle ack, use `|→ ##[0:3] ack`.\n\n  **Vacuity:** If `req` never rises, the assertion passes vacuously. Formal tools and simulators report vacuous passes; always pair critical asserts with `cover property` on the antecedent or use `not`/`accept_on` carefully.",
    "tclOrVerilogSnippet": {
      "lang": "systemverilog",
      "code": "assert property (@(posedge clk) disable iff (!rst_n)\n  $rose(req) |-> ##[1:3] ack)\nelse $error(\"ack window miss\");"
    },
    "commonPitfalls": [
      "Using `|→` when the designer meant “next cycle” (`|=>`).",
      "Forgetting `disable iff` for reset, causing false failures during X/reset.",
      "Asserting on `req` level instead of `$rose(req)` for pulse protocols."
    ],
    "interviewerFollowups": [
      "How do `s_eventually` and `##[1:3]` differ in formal completeness?",
      "What does `intersect` buy you versus `and` in sequences?"
    ],
    "tags": [
      "sva",
      "implication",
      "vacuity",
      "handshake"
    ]
  },
  {
    "id": "dv-06",
    "company": "amd",
    "companyName": "AMD",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Define `$rose(sig)`, `$fell(sig)`, and `$past(sig, n)`. Why can `$rose` be true when `sig` goes `X→1`, and how do you write a stable-data assertion relative to a handshake?",
    "shortSummary": "`$rose` is true when the sampled LSB was 0 and is now 1; `$fell` is the inverse; `$past(sig,n)` returns the value n cycles ago (default clock). X/Z transitions can create unexpected `$rose`/`$fell`. For stable data: when `valid&&ready`, data must equal `$past(data)` under appropriate conditions, or data must be stable while `valid&&!ready`.",
    "detailedAnswer": "In concurrent assertions / sampled value functions, values are from the **preponed** region of the clocking event — matching NBA-updated flops visually on waveform rising edges.\n\n  - `$rose(s)` ⇔ `!$past(sLSB) && sLSB` (roughly; X handling is tool-defined carefully).\n  - `$stable(s)` ⇔ `s === $past(s)`.\n  - `$changed(s)` ⇔ `!$stable(s)`.\n\n  Classic valid/ready stability (AXI-style):\n  ```systemverilog\n  property p_data_stable;\n    @(posedge clk) disable iff (!rst_n)\n      (valid && !ready) |=> $stable(data) && valid;\n  endproperty\n  ```\n  Meaning: if transfer stalled, data and valid must hold until ready.\n\n  Gotcha: comparing with `==` instead of `===` hides X. During reset release, `$past` may still see X — gate with `disable iff` or `$past(rst_n)`.",
    "commonPitfalls": [
      "Using `$rose` in a procedural `always_ff` without understanding it needs a clock context (use `$rose(sig, @(posedge clk))`).",
      "Expecting `$past` depth beyond tool/formal limits without declaring."
    ],
    "interviewerFollowups": [
      "Difference between `$sampled(sig)` and reading `sig` in the action block?",
      "How does clocking block input skew interact with `$rose` in a testbench checker?"
    ],
    "tags": [
      "sva",
      "sampled-value",
      "rose",
      "past",
      "axi"
    ]
  },
  {
    "id": "dv-07",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Explain `s_eventually`, `eventually`, `until`, and `s_until`. Why are strong properties important for liveness (“ack must eventually come”), and what happens to strong properties in bounded simulation?",
    "shortSummary": "Weak operators can pass at end-of-time if the obligation was never discharged; strong operators (`s_*`) require the eventuality to occur within the finite trace. Formal proves unbounded liveness; simulation can only falsify or vacuously/weakly pass.",
    "detailedAnswer": "Liveness example: `req |-> s_eventually ack`. If `req` happens and `ack` never arrives, formal fails; in simulation, a weak `eventually` may pass when `$finish` occurs before ack.\n\n  - `seq1 until prop` — prop becomes true sometime, and seq1 holds until then (weak: if prop never comes, still OK at EOT).\n  - `s_until` — requires prop to occur.\n  - `go_to` / `nonconsecutive repetition` (`[=]`, `[->]`) encode “next occurrence” patterns for intermittent ready.\n\n  Staff practice: use strong properties in formal; in sim use bounded windows `##[1:MAX]` with a documented MAX from latency contracts. Mix safety (`assert`) and liveness (`assert` strong / formal-only) with `assume` on inputs.",
    "commonPitfalls": [
      "Claiming simulation “proved” unbounded `eventually`.",
      "Using weak `until` for grant-must-happen arbitration specs."
    ],
    "interviewerFollowups": [
      "How do you set a formal proof radius / bound for a strong property?",
      "When do you prefer `assume property` on inputs vs constraining a UVM sequence?"
    ],
    "tags": [
      "sva",
      "liveness",
      "eventually",
      "formal",
      "strong-property"
    ]
  },
  {
    "id": "dv-08",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Design a covergroup for an AXI write address channel sampling `awlen`, `awburst`, and `awsize`. How does a `cross` explode bin count, and how do you use `ignore_bins` / `illegal_bins` to keep closure meaningful?",
    "shortSummary": "Define coverpoints with explicit bins for architecturally meaningful values, then `cross` only legal combinations. `ignore_bins` drop don’t-care combos from denominator; `illegal_bins` flag forbidden hits as errors.",
    "detailedAnswer": "```systemverilog\n  covergroup cg_aw @(posedge clk);\n    option.per_instance = 1;\n    cp_len: coverpoint awlen {\n      bins single = {0};\n      bins burst_2_16 = {[1:15]};\n      bins max = {255};\n    }\n    cp_burst: coverpoint awburst {\n      bins fixed = {0}; bins incr = {1}; bins wrap = {2};\n    }\n    cp_size: coverpoint awsize {\n      bins sz[] = {[0:3]}; // up to 8B if bus=64b\n    }\n    cx: cross cp_len, cp_burst, cp_size {\n      ignore_bins wrap_non_pow2 =\n        binsof(cp_burst.wrap) && binsof(cp_len) intersect {[1:255]};\n      // refine: WRAP requires len=2^n-1 — encode properly\n      illegal_bins reserved_burst = binsof(cp_burst) intersect {3};\n    }\n  endgroup\n  ```\n  Cross bin count ≈ product of constituent bins. Uncontrolled crosses with auto-bins on 32-bit data are worthless. Prefer goal-driven coverage: protocol legal space + interesting corners (unaligned, 4K boundary, narrow transfers).\n\n  Sample in monitor via analysis export calling `cg.sample()`, not in the driver (driver never sees slave backpressure the same way).",
    "commonPitfalls": [
      "Crossing raw 32-bit address without bins → millions of empty bins.",
      "Using `illegal_bins` for “not yet interested” (should be `ignore_bins`)."
    ],
    "interviewerFollowups": [
      "`option.weight` / `type_option.goal` — how do they affect report closure %?",
      "Covergroup vs cover property — when each?"
    ],
    "tags": [
      "coverage",
      "covergroup",
      "cross",
      "axi",
      "functional-coverage"
    ]
  },
  {
    "id": "dv-09",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Technical Round 1",
    "question": "Sketch a scoreboard for an out-of-order CPU-to-memory interconnect with tagged transactions. Should the reference model be in-order predictive or transactional? How do you handle dropped vs reordered responses without false fails?",
    "shortSummary": "Use a transactional predictor keyed by ID/tag: expected responses live in an associative array/queue per ID. Compare on response arrival; separately check completion/fairness. In-order FIFOs alone false-fail under legitimate reorder.",
    "detailedAnswer": "Architecture:\n  1. **Ingress analysis** from master monitor: push request into reference model.\n  2. **Reference model:** functional abstract (SystemVerilog class, DPI-C, or TLMs) computes expected payload/status.\n  3. **Store expected** in `expected[id][$]` preserving per-ID order (AXI: responses for same ID remain ordered; across IDs may reorder).\n  4. **Egress analysis:** on response, pop matching ID queue head and compare; mismatch → error with full txn dump.\n  5. **End-of-test:** drain check — all expected queues empty; optional in-flight timeout.\n\n  For lossy or filtered designs, explicit “drop” events must retire expected entries. For partial writes / byte strobes, compare only active bytes.\n\n  Staff topics: in-order vs OOP reference, symbolic predictors for formal assist, and using `uvm_tlm_analysis_fifo` for rate decoupling when the RM is slow (DPI).",
    "commonPitfalls": [
      "Global in-order queue for an OoO interconnect.",
      "Comparing X-containing DUT outputs with `==` instead of masking unknowns where RTL allows them."
    ],
    "interviewerFollowups": [
      "How do you scoreboard a DUT that merges writes to the same address?",
      "Where does RAL predict fit vs a packet scoreboard?"
    ],
    "tags": [
      "scoreboard",
      "predictor",
      "ooo",
      "axi-id",
      "reference-model"
    ]
  },
  {
    "id": "dv-10",
    "company": "intel",
    "companyName": "Intel",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "What constitutes a reusable protocol VIP agent? Describe active vs passive modes, configuration object contents, and how a chip-level env instantiates 40+ identical agents without code duplication.",
    "shortSummary": "A VIP agent packages sequencer, driver, monitor, config, and coverage behind a stable API. Active = drive + monitor; passive = monitor only. Config_db + factory + parameterized env arrays scale to many ports.",
    "detailedAnswer": "Standard agent:\n  - `uvm_sequencer`, `driver`, `monitor`, optional `coverage` subscriber\n  - `uvm_active_passive_enum is_active`\n  - Virtual interface handle(s) and protocol knobs in a `uvm_object` config (data width, ID width, outstanding depth, timing delays)\n  - Analysis ports for monitored items\n\n  Chip env:\n  ```systemverilog\n  axi_agent agt[];\n  // build: foreach port create agent; set config is_active based on whether TB drives that port\n  ```\n  Use instance overrides for fault-injection agents. Separate **protocol VIP** (compliant) from **test sequences** (scenario intent) so VIP updates do not break tests.\n\n  Compliance: include protocol SVA bind files inside the VIP, enable/disable via config for gate-level where X’s explode assertions.",
    "commonPitfalls": [
      "Baking test-specific knobs into the driver instead of the sequence/config.",
      "Passive agent that still instantiates a driver (wasted, or worse, drives contention)."
    ],
    "interviewerFollowups": [
      "How do you version a VIP against a changing RTL interface via adaptors?",
      "Master vs slave agent differences for ready generation?"
    ],
    "tags": [
      "vip",
      "agent",
      "active-passive",
      "config-db",
      "reuse"
    ]
  },
  {
    "id": "dv-11",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "In SystemVerilog CRV, what is the difference between hard and soft constraints? Explain `dist`, `solve before`, and a classic pitfall when constraining `len` and `addr` for a burst that must not cross a 4K boundary.",
    "shortSummary": "Hard constraints must be satisfied or randomization fails; soft may be dropped if conflicting. `dist` sets weighted value likelihood. `solve before` orders variable decisions to bias conditional distributions. Address/length coupling needs a joint constraint, not independent uniform picks.",
    "detailedAnswer": "```systemverilog\n  class axi_aw;\n    rand bit [31:0] addr;\n    rand bit [7:0]  len;\n    rand burst_e    burst;\n    constraint c_4k {\n      burst == INCR ->\n        addr[11:0] + ((len+1) << awsize) <= 13'h1000;\n    }\n    constraint c_soft_pref {\n      soft len < 16; // tests may disable with randomize() with { len == 255; }\n    }\n    constraint c_dist {\n      awsize dist {0:=10, 1:=20, 2:=50, 3:=20};\n    }\n  endclass\n  ```\n  Without the joint 4K constraint, independently random `addr` near page end and large `len` produce illegal AXI bursts — VIP assertions fire and you waste cycles.\n\n  `solve addr before len` changes statistical shape: solver picks addr first, then len conditioned on remaining page budget. It does **not** add a constraint; it only affects distribution under existing constraints.\n\n  `randomize() with {}` inline constraints are hard. Use `constraint_mode(0)` to disable named constraints for directed cases.",
    "commonPitfalls": [
      "Believing `solve before` “fixes” illegal combos without writing the real constraint.",
      "Soft constraints silently dropped — thinking the preference always applied."
    ],
    "interviewerFollowups": [
      "How do `unique` constraints work for an array of IDs?",
      "What does a randomization failure (`randomize()==0`) imply for debug?"
    ],
    "tags": [
      "crv",
      "constraints",
      "dist",
      "solve-before",
      "axi-4k"
    ]
  },
  {
    "id": "dv-12",
    "company": "amd",
    "companyName": "AMD",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "How do phase objections control simulation end? What is `phase.phase_done.set_drain_time`, and why might a scoreboard still have pending expected transactions when the run phase ends?",
    "shortSummary": "A phase ends when all raised objections are dropped. Drain time keeps the phase alive after the last drop so pipelines can flush. Pending scoreboard entries usually mean stimulus stopped objections too early or responses never returned.",
    "detailedAnswer": "In `run_phase`, the test raises an objection, starts sequences, then drops. Components that need extra time (scoreboard waiting for last response) should raise their own objections or the test should wait on an explicit end-of-test event.\n\n  Drain time: after objection count hits 0, UVM waits `drain_time` before ending the phase — a blunt instrument. Prefer explicit handshake: scoreboard sets `final_drain` objection until queues empty or timeout.\n\n  Common bug: sequences drop objections in `post_body` while the driver still has items in flight / slave still responding. Fix: objection in test around `seq.start`, plus scoreboard activity objection, or `wait fork` on in-flight counters.",
    "commonPitfalls": [
      "Multiple sequences each raising/dropping → last drop ends test prematurely.",
      "Relying only on drain_time instead of modeling in-flight count."
    ],
    "interviewerFollowups": [
      "Difference between objections in `run_phase` vs `main_phase` (with phase jumping)?",
      "How does `uvm_objection` tracing (`+UVM_OBJECTION_TRACE`) help?"
    ],
    "tags": [
      "uvm",
      "objections",
      "drain-time",
      "eot"
    ]
  },
  {
    "id": "dv-13",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Explain UVM runtime phases (`reset`, `configure`, `main`, `shutdown`) and phase jumping. How would you model a mid-test warm reset that kills in-flight sequences and restarts stimulus without `\\$finish`?",
    "shortSummary": "UVM splits run into schedules of sub-phases with objections. Phase jump moves the current phase to another (e.g., `main` → `reset`), aborting the prior phase’s threads. Warm reset: jump to reset phase, re-init RAL/VIP, then continue to main.",
    "detailedAnswer": "The common phase domain includes `pre_reset → reset → post_reset → pre_configure → configure → ... → main → ... → shutdown`. Each has objection semantics like `run_phase`.\n\n  **Phase jump:** `phase.jump(uvm_pre_reset_phase::get())` from a component when a reset event is detected (or injected). Active `main_phase` sequences receive kill; drivers must be written to be restartable (interfaces return to idle, semaphores cleared).\n\n  Staff checklist for warm reset:\n  1. Detect reset assertion in monitor or dedicated reset agent.\n  2. Jump phases; drop stale objections carefully.\n  3. Clear scoreboard expected queues / mark in-flight as cancelled.\n  4. `reg_model.reset()` and re-`mirror`.\n  5. Re-apply configs; restart virtual sequence library.\n\n  Many teams still use a single `run_phase` with an explicit reset task for simplicity — know both and defend tradeoffs (jumping is powerful but easy to deadlock if objections leak).",
    "commonPitfalls": [
      "Phase jump without cleaning TLM FIFOs → ghost transactions after reset.",
      "Not killing sequences → post-reset stimulus corruption."
    ],
    "interviewerFollowups": [
      "How do domains and schedules interact with multiple clocks/tests?",
      "Why do some VIPs forbid phase jumping and require `run_phase` only?"
    ],
    "tags": [
      "uvm-phases",
      "phase-jump",
      "warm-reset",
      "staff"
    ]
  },
  {
    "id": "dv-14",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "You need a random array of 8 distinct AXI IDs from 0..15, each with a burst length from a weighted distribution, and one “poison” constraint that is usually on but disabled in a directed test. Write the constraint strategy and explain failure modes.",
    "shortSummary": "Use `unique {ids}` or pairwise inequality, `dist` on lengths, and a named constraint toggled via `constraint_mode`. Watch array size vs value space (8 unique from 0..15 is fine; 17 unique is unsatisfiable).",
    "detailedAnswer": "```systemverilog\n  class multi_id_seq_item;\n    rand bit [3:0] id[8];\n    rand bit [7:0] len[8];\n    constraint c_unique_ids { unique {id}; }\n    constraint c_len_dist {\n      foreach (len[i]) len[i] dist {[0:3]:=50, [4:15]:=40, [16:255]:=10};\n    }\n    constraint c_poison { // usually: forbid id==0\n      foreach (id[i]) id[i] != 0;\n    }\n  endclass\n  // directed test:\n  item.c_poison.constraint_mode(0);\n  assert(item.randomize());\n  ```\n  Unsatisfiable sets (`unique` with more elements than domain) cause `randomize()` to return 0 — always check return value. Nested `foreach` with cross-index relations can blow up solver time; simplify with intermediate random vars.",
    "commonPitfalls": [
      "Ignoring `randomize()` return value.",
      "Using `soft unique` thinking it partially applies (uniqueness is all-or-nothing for the set)."
    ],
    "interviewerFollowups": [
      "How does `randc` differ from `unique` over multiple randomize calls?",
      "Solver performance: when do you switch to procedural randomization?"
    ],
    "tags": [
      "crv",
      "unique",
      "constraint-mode",
      "solver"
    ]
  },
  {
    "id": "dv-15",
    "company": "intel",
    "companyName": "Intel",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What problem do SystemVerilog clocking blocks solve in reactive testbenches? Explain input/output skew and why driving DUT inputs with `#0` or NBA from a clocking block avoids races with DUT flops.",
    "shortSummary": "Clocking blocks define synchronous sampling/driving points with explicit skews relative to a clock, removing TB/DUT race ambiguity. Inputs sample before the edge (or with skew); outputs drive after the edge via NBA semantics.",
    "detailedAnswer": "```systemverilog\n  clocking cb @(posedge clk);\n    default input #1step output #0;\n    input  ready, rdata;\n    output valid, wdata;\n  endclocking\n  // driver:\n  @(cb);\n  cb.valid <= 1'b1;\n  cb.wdata <= data;\n  ```\n  `#1step` input skew samples in the postponed region of the previous time slot — sees stable DUT outputs after NBAs. Output `#0` schedules drives in the NBA region of the current cycle, aligning with RTL `<=` flops that sample those signals next edge.\n\n  Without clocking blocks, `@ (posedge clk) vif.valid = 1;` (blocking) can race: some simulators sample DUT flops before TB assign, others after. Clocking + virtual interface is the standard VIP pattern.",
    "commonPitfalls": [
      "Mixing absolute `#delay` drives with clocking drives on the same signals.",
      "Using clocking block in design RTL (usually TB-only discipline)."
    ],
    "interviewerFollowups": [
      "`##1` cycle delays inside clocking vs program blocks?",
      "How do you handle asynchronous resets alongside a clocking block?"
    ],
    "tags": [
      "clocking-block",
      "race",
      "testbench",
      "skew"
    ]
  },
  {
    "id": "dv-16",
    "company": "amd",
    "companyName": "AMD",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Why bundle DUT connections in a SystemVerilog `interface` with `modport`s? How do modports enforce directionality for master vs slave, and how does a virtual interface get from top-level to a UVM driver?",
    "shortSummary": "Interfaces group signals + concurrent assertions + clocking; modports declare directions per role. The testbench top sets `uvm_config_db#(virtual axi_if.drv_mp)::set(...)`; the driver `get`s it in `build_phase`.",
    "detailedAnswer": "```systemverilog\n  interface axi_if(input logic clk, rst_n);\n    logic valid, ready;\n    logic [31:0] data;\n    clocking drv_cb @(posedge clk);\n      output valid, data; input ready;\n    endclocking\n    modport drv_mp (clocking drv_cb, input clk, rst_n);\n    modport mon_mp (input clk, rst_n, valid, ready, data);\n  endinterface\n  ```\n  Modports prevent a slave TB from accidentally driving `ready` the wrong way when using the wrong modport type. Virtual interfaces are references — necessary because UVM classes cannot contain hierarchical signal references directly.\n\n  Bind: `config_db` set from TB top using the concrete instance path; drivers use parameterized virtual types matching the modport.",
    "commonPitfalls": [
      "Passing the interface without modport and losing direction checks.",
      "`config_db::get` failing due to wrong instance path / type mismatch (virtual vs non-virtual)."
    ],
    "interviewerFollowups": [
      "`interface` parametric with `parameter DATA_W` — how does that type-match in config_db?",
      "Assertions inside interface vs `bind` of an SVA module?"
    ],
    "tags": [
      "interface",
      "modport",
      "virtual-interface",
      "config-db"
    ]
  },
  {
    "id": "dv-17",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "When do you choose formal (property checking / connectivity / sequential equivalence) over constrained-random UVM, and vice versa? How do you partition an SoC verification plan across both?",
    "shortSummary": "Formal excels at control-path safety/liveness with bounded state, exhaustive corner coverage, and EC (RTL vs netlist). CRV/UVM excels at long traffic scenarios, software-driven flows, performance, and analog-mixed timing. Use both: formal on protocol engines/arbiters/CDC gates; UVM on system scenarios.",
    "detailedAnswer": "**Formal strengths:** complete proof of assertions under assumptions; great for arbiters, FIFOs, FSM deadlock, scoreboarding-free safety, connectivity, X-prop bounded checks. **Limits:** state explosion on large datapaths/caches; needs careful `assume` to avoid over-constraints that prove nonsense.\n\n  **Simulation strengths:** real VIP traffic shapes, multi-agent coordination, HW/SW co-sim, GF coverage closure with software. **Limits:** cannot exhaust rare arbitration interleavings.\n\n  Partition example (GPU/SoC):\n  - Formal: NoC router credit protocol, interrupt controller, power-state FSM, CDC gray pointer checks.\n  - UVM: full application traffic, QoS, multi-clock integration, performance KPIs.\n  - Sequential equivalence: ECO netlist vs golden RTL.\n\n  Staff signal: speak to **coverage unification** — formal covered properties map into the same verification plan DB as functional covergroups.",
    "commonPitfalls": [
      "Over-constraining formal (assumes hide bugs).",
      "Using formal alone on a CPU core without simulation regressions."
    ],
    "interviewerFollowups": [
      "What is a bounded proof vs full proof?",
      "How do you validate that assumptions are not vacuously killing the cone?"
    ],
    "tags": [
      "formal",
      "simulation",
      "methodology",
      "planning",
      "staff"
    ]
  },
  {
    "id": "dv-18",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How do you verify asynchronous assert / synchronous deassert reset trees in DV? List stimulus cases (power-on, warm, mid-transaction) and checkers you require.",
    "shortSummary": "Assert reset asynchronously in TB; release synchronously to the destination clock. Check that outputs go to defined reset values, no X leakage on control, in-flight txns are dropped/replayed per spec, and re-init sequences restore RAL/software visible state.",
    "detailedAnswer": "Cases:\n  1. **Cold reset:** apply before clocks; release after clocks stable; check reset values via backdoor + frontdoor.\n  2. **Warm reset mid-idle:** clean re-entry.\n  3. **Warm reset mid-transaction:** randomize phase of reset vs valid handshake; expect bus to terminate without deadlock; VIP protocol FSMs reset.\n  4. **Reset during different power states** (if UPF): isolation interaction.\n  5. **Staggered resets** across domains: ensure CDC paths don’t propagate X forever.\n\n  Checkers: SVA on reset values; X checkers on control after N cycles; scoreboard cancel policy; coverage on reset timing bins relative to protocol phases.\n\n  Deassert sync: TB should model the sync flops or release only on clock edges to match silicon intent — releasing async in TB can hide bugs the sync cells exist to prevent.",
    "commonPitfalls": [
      "Only testing reset at time 0.",
      "Failing to clear scoreboard on mid-test reset."
    ],
    "interviewerFollowups": [
      "How do you verify reset minimum pulse width requirements?",
      "Scan reset vs functional reset interactions?"
    ],
    "tags": [
      "reset",
      "async-assert",
      "warm-reset",
      "x-check"
    ]
  },
  {
    "id": "dv-19",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Explain X-optimism and X-pessimism in RTL simulation. How do X-prop tools / `xprop` methodologies differ from naive 4-state sim, and what DV practices catch reset/X bugs before silicon?",
    "shortSummary": "Verilog `if (x)` takes the else path (optimism) and may hide bugs; pessimistic merging makes more Xs than silicon. X-prop instrumentation forces unknowns through control to reveal reliance on Xs. Combine with init-to-X, random init, and formal X checks.",
    "detailedAnswer": "Example optimism:\n  ```systemverilog\n  if (ready)  // ready=X → treated as 0 in sim\n    state <= NEXT;\n  ```\n  Silicon might sample 0 or 1; sim silently takes not-taken path.\n\n  Approaches:\n  - **Synopsys/other xprop:** instruments RTL so control Xs propagate to outputs.\n  - **Explicit X asserts:** `assert (!$isunknown(ctrl))` after reset window.\n  - **Random initialization:** `$urandom` on memories/flops at start to approximate silicon.\n  - **Gate-level sim with SDF:** Xs from timing, but expensive.\n\n  Staff practice: classify signals — control must be 0/1 after reset+N; datapath Xs may be OK until qualified by valid. Don’t blanket-`0` initialize everything in TB and claim X-clean silicon.",
    "commonPitfalls": [
      "Using `==` comparisons that mask X (`===` needed).",
      "Disabling X checks in GLS “because too noisy” without triage."
    ],
    "interviewerFollowups": [
      "How does `unique case` interact with X?",
      "Memory read X before write — scoreboard policy?"
    ],
    "tags": [
      "x-prop",
      "x-optimism",
      "reset",
      "gls",
      "staff"
    ]
  },
  {
    "id": "dv-20",
    "company": "broadcom",
    "companyName": "Broadcom",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "How does `uvm_config_db` work? What are the lookup rules for field name and instance path, and when would you use `uvm_resource_db` instead?",
    "shortSummary": "`config_db` is a typed wrapper over the resource database for hierarchical configuration. `set(cntxt, inst_name, field, value)` and `get(cntxt, inst_name, field, value)` match by type + field + scope. Use it for VIF and config objects; resource_db for low-level/sharing tricks — prefer config_db in modern UVM.",
    "detailedAnswer": "Lookup walks from the getting component upward, matching wildcards in instance paths (`*`, `*.agt[*]`). Last-write / priority rules can surprise you when multiple sets apply — debug with `uvm_config_db_options::set_trace(1)` / print resources.\n\n  Pattern:\n  ```systemverilog\n  uvm_config_db#(virtual apb_if)::set(null, \"uvm_test_top.env.agt*\", \"vif\", vif);\n  // in agent build:\n  if (!uvm_config_db#(virtual apb_if)::get(this, \"\", \"vif\", vif))\n    `uvm_fatal(...)\n  ```\n  Passing `null` context means top-level. Prefer setting from the parent targeting children rather than globals when possible for reuse.",
    "commonPitfalls": [
      "Wrong field string `\"vif\"` vs `\"virtual_if\"`.",
      "Getting before set (build order) — parents build before children, so set in parent `build_phase` before `super` creates children carefully, or set from test before `env`."
    ],
    "interviewerFollowups": [
      "How does `set_config_object` (deprecated) relate?",
      "Wildcard performance with thousands of agents?"
    ],
    "tags": [
      "config-db",
      "resource-db",
      "uvm",
      "vif"
    ]
  },
  {
    "id": "dv-21",
    "company": "arm",
    "companyName": "Arm",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Why must protocol checking and transaction extraction live in the monitor (or bound SVA), not the driver? What does the driver do when the slave inserts wait states?",
    "shortSummary": "Drivers are active and absent in passive mode; monitors always observe true pin behavior including DUT-as-master traffic. Driver applies sequence items and reacts to backpressure (`ready` low) by holding stable outputs per protocol; it does not “check” the DUT’s correctness.",
    "detailedAnswer": "Separation of concerns:\n  - **Driver:** convert `seq_item` → timed pin wiggles; honor clocking block; handle wait states; optional reactive slave driver generates `ready`/responses from a slave sequence.\n  - **Monitor:** sample pins → create transactions → analysis port; independent of active/passive.\n  - **SVA bind:** cycle-accurate protocol legality.\n\n  If checks live only in the driver, passive monitoring of RTL-driven buses (e.g., DUT master) gets zero checking. Scoreboards subscribe to monitors on both ends of a link.",
    "commonPitfalls": [
      "Driver emitting analysis transactions that never saw the wire (predicted, not observed).",
      "Slave driver with fixed `#delay` ready instead of constrained-random wait states (weak coverage)."
    ],
    "interviewerFollowups": [
      "What is a reactive slave sequence?",
      "Should coverage sample in monitor or a separate subscriber?"
    ],
    "tags": [
      "driver",
      "monitor",
      "separation",
      "vip"
    ]
  },
  {
    "id": "dv-22",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "A block is at 92% functional coverage with 8 stubborn cross bins. How do you decide whether to write directed tests, refine bins, or waive? Tie your answer to project risk and tapeout criteria.",
    "shortSummary": "First verify bins are legal and valuable; drop/ignore meaningless bins; for real holes, analyze constraint bias and add directed or shaped random tests; waive only with written risk signoff. Closure is risk management, not a vanity percentage.",
    "detailedAnswer": "Process:\n  1. **Bin audit:** illegal? unreachable due to arch? duplicate of another cover? → `ignore_bins` / remove.\n  2. **Reachability:** prove with formal hit or explain structural impossibility.\n  3. **Stimulus gap:** review CRV distributions (`dist`, solve order); add sequence that forces the corner (e.g., wrap burst at 4K-8).\n  4. **Regression shaping:** increase weight of scenario library entries that hit near-miss bins.\n  5. **Waive:** document residual risk, owners, and why silicon/errata acceptable.\n\n  Staff metric: cover **spec-derived** items linked to requirements IDs; raw % without peer review is insufficient for Apple/Nvidia-style audits.",
    "commonPitfalls": [
      "Inflating closure by deleting hard bins.",
      "Infinite random cycles hoping for a 1-in-2^40 hit."
    ],
    "interviewerFollowups": [
      "How do you merge coverage across distributed regressions?",
      "Code coverage vs functional coverage — can one replace the other?"
    ],
    "tags": [
      "coverage-closure",
      "methodology",
      "risk",
      "staff"
    ]
  },
  {
    "id": "dv-23",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Write SVA properties for AXI-style channels: (1) valid must stay asserted until ready; (2) payload stable while stalled; (3) no X on valid after reset. Discuss `assume` vs `assert` for master vs slave ports in a formal TB.",
    "shortSummary": "Assert stability/X-clean on the DUT-driven side; assume the same on TB-driven side in formal so the tool doesn’t generate illegal stimulus. Simulation VIP usually asserts both directions.",
    "detailedAnswer": "```systemverilog\n  property p_valid_hold;\n    @(posedge clk) disable iff (!rst_n)\n      valid && !ready |=> valid;\n  endproperty\n\n  property p_payload_stable;\n    @(posedge clk) disable iff (!rst_n)\n      valid && !ready |=> $stable(data) && $stable(keep);\n  endproperty\n\n  property p_valid_known;\n    @(posedge clk) disable iff (!rst_n)\n      !$isunknown(valid);\n  endproperty\n\n  assert property (p_valid_hold);\n  assert property (p_payload_stable);\n  assert property (p_valid_known);\n  ```\n  Formal: if TB drives `ready`, `assume property` on ready liveness/`s_eventually ready` carefully — over-strong assumes can prove false confidence. Prefer bounded `##[0:MAX] ready` as assume if fairness needed.",
    "commonPitfalls": [
      "Forgetting KEEP/STROBE in stability set.",
      "Asserting against unconstrained formal inputs without assumes."
    ],
    "interviewerFollowups": [
      "How do you encode “ready can be X only in reset”?",
      "AXI AW/W/B coupling properties?"
    ],
    "tags": [
      "sva",
      "axi",
      "handshake",
      "formal-assume"
    ]
  },
  {
    "id": "dv-24",
    "company": "intel",
    "companyName": "Intel",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "How do UVM RAL sequences (`uvm_reg_hw_reset_seq`, bit-bash, mem walk) complement functional traffic? When is backdoor mem init mandatory for reasonable sim time, and what coverage do you still require via frontdoor?",
    "shortSummary": "Built-in RAL sequences catch reset value and access-policy bugs quickly. Backdoor-load large memories for bringing up data-path tests; still frontdoor-cover CSR programming paths software will use and at least sample mem address ranges via bus.",
    "detailedAnswer": "- **`uvm_reg_hw_reset_seq`:** reads all registers, compares reset values.\n  - **Bit bash:** writes walking 1s/0s where RW; checks side effects.\n  - **Access sequence:** validates RO/W1C policies.\n  - **Mem walk:** address/data marches — often too slow frontdoor for multi-MB SRAMs → backdoor init + targeted frontdoor spots.\n\n  Mix: backdoor preload frame buffers; frontdoor program DMA descriptors (the SW path); scoreboard checks data plane. Explicitly cover “CPU writes CFG enables path” — backdoor-only bring-up misses decoder/bus faults.",
    "commonPitfalls": [
      "Shipping with only backdoor CSR writes in tests.",
      "Bit-bash on volatile status registers without predict hooks."
    ],
    "interviewerFollowups": [
      "How do you skip unsupported built-in tests for WO/reserved fields?",
      "Concurrent RAL sequence locking (`uvm_reg_map` semaphore)?"
    ],
    "tags": [
      "ral",
      "reg-sequences",
      "backdoor",
      "mem-walk"
    ]
  },
  {
    "id": "dv-25",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "design-verification",
    "domainName": "Design Verification (DV / UVM & SVA)",
    "role": "Staff Design Verification / UVM Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Design a layered UVM stimulus architecture for a GPU command processor: software-visible PM4 packets → privileged register programming → PCIe TLP sequences → PHY link layer. Where do constraints live at each layer, and how do you debug a failure attributed to the wrong layer?",
    "shortSummary": "Each layer exposes sequence APIs and constraints for its abstraction only; higher layers call lower via virtual sequences or translation sequences. Debug with transaction logging at every analysis port and layer-specific protocol checkers to localize the first failing layer.",
    "detailedAnswer": "Layering:\n  1. **PHY/link VIP sequences:** ordered sets, SKP, flow control credits.\n  2. **TLP sequences:** memory WR/RD, completion reassembly constraints (byte count, lower address).\n  3. **Register/RAL layer:** BAR-mapped CSR programming.\n  4. **Command packet layer:** random PM4 with architectural constraints (opcode, dword count).\n  5. **Scenario virtual sequences:** “submit kick → wait irq → check fence” using all layers.\n\n  Constraints at packet layer must not re-implement PCIe 4K rules already in TLP layer — translate and let lower layers enforce/legalize with hooks for intentional illicit tests (`error_inject` flag).\n\n  Debug: tag transactions with `sequence_id` / `parent_sequence`; scoreboard errors dump the originating layer. Formal on lower FSMs + UVM on system scenarios remains the staff-level split.\n\n  Deliverable in interview: a block diagram of agents, analysis paths, and which objections/coverage live where.",
    "commonPitfalls": [
      "God-sequence that wiggles every layer’s pins directly.",
      "Duplicating protocol legality in five places that drift."
    ],
    "interviewerFollowups": [
      "How do you inject a poisoned TLP and still keep upper-layer sequences alive?",
      "Virtual interface vs DPI for co-sim with C models at the packet layer?"
    ],
    "tags": [
      "layered-stimulus",
      "virtual-sequence",
      "gpu",
      "vip",
      "staff"
    ]
  },
  {
    "id": "dft-06",
    "companyName": "DFT architecture",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Compare stuck-at (SA), transition delay fault (TDF), and path-delay fault (PDF) models. What defect physics does each target, and why is PDF rarely the workhorse production model?",
    "shortSummary": "SA: static node 0/1. TDF: slow $0\\to1$ or $1\\to0$ at a gate output (gross delay). PDF: a specific structural path misses timing. PDF count explodes combinatorially; TDF + at-speed LOC gives practical coverage of most delay defects.",
    "detailedAnswer": "| Model | Fault site count | Detects | Pattern style |\n  |---|---|---|---|\n  | SA0/SA1 | ~2 per node | Opens/shorts DC | Single capture, slow OK |\n  | TDF slow-to-rise/fall | ~2 per node | Resistive opens, weak vias | Two-vector at-speed |\n  | PDF | Enormous path set | Specific critical-path delay | Two-vector, path-targeted |\n\n  TDF assumes a lumped delay at a gate sufficient to miss a capture latch under robust/launch tests. PDF requires enumerating paths (or critical subsets) — great for characterizing speed paths, expensive as a full production fault universe.\n\n  Cell-aware / bridge / interconnect fault models further refine below SA/TDF for advanced nodes.",
    "commonPitfalls": [
      "Claiming SA testing at slow speed catches all delay defects.",
      "Equating “at-speed scan” automatically with full PDF coverage."
    ],
    "interviewerFollowups": [
      "Robust vs non-robust path-delay tests.",
      "Small-delay defect (SDD) timing-aware ATPG."
    ],
    "tags": [
      "stuck-at",
      "transition-fault",
      "path-delay",
      "fault-models"
    ]
  },
  {
    "id": "dft-07",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Beyond the textbook LOC vs LOS comparison: when might a project still choose LOS (or hybrid)? What fails in LOC when launch stateability is poor, and how do dead cycles / SE timing interact?",
    "shortSummary": "LOS can raise coverage when functional launch cannot justify care-bits, but needs at-speed SE. Hybrids exist (LOS in some domains). LOC fails patterns when the functional cone cannot reach the needed launch value; ATPG aborts or needs test points. Dead cycles allow SE to settle before LOC capture pulses.",
    "detailedAnswer": "LOC launch uses functional dependency $V_2 = \\delta(V_1)$ with SE=0 — if $\\delta$ cannot produce the transition, fault is ATPG-untestable under LOC.\n\n  LOS launches from last shift (SE=1) ⇒ higher controllability, but SE must deassert in $<1$ functional period for skewed-load capture — SE becomes a high-speed distribution network (power, skew, SI).\n\n  Edge cases:\n  - Mixed LOC/LOS by partition.\n  - False paths / multi-cycle paths confuse at-speed fault grading.\n  - Power droop during capture mimics delay faults — need power-aware ATPG.\n\n  Dead cycles: after shift, hold SE low for $N$ slow cycles before OPCG fires launch/capture — not optional on large dies.",
    "commonPitfalls": [
      "Enabling LOS chip-wide without SE timing budget.",
      "Zero dead cycles causing SE still transitioning into capture."
    ],
    "interviewerFollowups": [
      "Double-pulse vs multi-clock capture for sequential depth.",
      "Why hold-time on scan paths still matters in at-speed modes."
    ],
    "tags": [
      "loc",
      "los",
      "edge-cases",
      "se-timing",
      "dead-cycles"
    ]
  },
  {
    "id": "dft-08",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Where exactly should lockup latches sit on a multi-clock scan chain (launch side vs capture side)? Active-high vs active-low? What about edge-mixing (posedge→negedge) segments?",
    "shortSummary": "Place lockups at the **driving/launch** domain boundary so the half-cycle shield is referenced to the launch clock. Use polarity matching the edge relationship (commonly active-low lockup after posedge launch). Edge-mix segments need lockups even inside one named chain.",
    "detailedAnswer": "Hold race is caused by positive skew into the capture flop. Delaying data by ~½ shift period at the launch side absorbs large skew.\n\n  Placement near launch also localizes routing: lockup output can travel farther without hold risk relative to launch edge. Captureside-only delay buffers are inferior (P&R variability, no half-cycle guarantee).\n\n  Genus/Innovus: terminal lockup at chain end when exiting a domain; internal lockups when `dft_mix_clock_edges` stitches edges/domains. Verify with scan-shift STA at hold corners.",
    "commonPitfalls": [
      "Wrong lockup polarity reintroducing races.",
      "Relying on buffer chains across domains."
    ],
    "interviewerFollowups": [
      "Lockup flop vs latch tradeoffs.",
      "Scan enable skew creating similar races on SE→flop paths."
    ],
    "tags": [
      "lockup-latch",
      "placement",
      "edge-mix",
      "hold"
    ]
  },
  {
    "id": "dft-09",
    "company": "synopsys",
    "companyName": "Synopsys",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Detail On-Chip Clocking (OCC/OPCG) beyond “two pulses from PLL.” How are shift clocks muxed vs capture pulses gated? What synchronization is needed between ATE and internal PLL clocks?",
    "shortSummary": "OCC FSM, controlled by slow tester bits, switches from external/slow shift clock to PLL-derived capture pulses. Pulse suppressors emit exact launch/capture counts. Clock domain crossings between TCK control and PLL domain need proper sync; IJTAG/1500 often programs OCC.",
    "detailedAnswer": "Blocks:\n  1. Clock mux: `scan_shift_clk` vs `pll_clk`.\n  2. Programmable pulse counter / waveform generator.\n  3. Chain of ICGs / clock gates forcing known enable during shift vs capture.\n  4. Lock/lossy bypass for debug.\n\n  Control registers loaded via JTAG/1500 sit in slow domain; outputs synchronized into PLL domain before affecting gates — else OCC itself has CDC bugs.\n\n  Multi-domain OCC: staggered capture across domains to manage IR; or synchronous aligned pulses when paths cross generated clocks from same PLL (not async).",
    "commonPitfalls": [
      "Treating OCC enables as static without STA.",
      "Forgetting PLL lock as a test precondition."
    ],
    "interviewerFollowups": [
      "Internal vs external clocking for transition tests at package test vs wafer sort.",
      "OCC scan to measure $F_{\\max}$ shmoo."
    ],
    "tags": [
      "occ",
      "opcg",
      "pll",
      "at-speed",
      "clock-control"
    ]
  },
  {
    "id": "dft-10",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "For Embedded Deterministic Test–style compression, relate compression ratio, care-bit density, and pattern count. When does “higher compression” increase tester time?",
    "shortSummary": "Decompressor solves linear equations for care-bits. If care-bits per cycle exceed channel degrees of freedom, ATPG splits patterns or fails encoding ⇒ pattern inflation that can erase shift-length gains from short chains.",
    "detailedAnswer": "Rough intuition: with $c$ external channels and XOR/LFSR free variables per shift cycle, you can satisfy on the order of $O(c)$ independent cares per cycle (architecture-dependent). Compression ratio $\\gamma = N_{\\text{int}}/N_{\\text{ext}}$ shortens shift length by ~$\\gamma$, but encoding capacity per cycle does not grow with $\\gamma$.\n\n  High $\\gamma$ + high care density (e.g., after test points poorly planned, or dense sequential patterns) ⇒ many loads, longer total test time. X-control / masking bits also consume bandwidth.\n\n  Engineering: sweep $\\gamma$ (30×–100× typical), measure total cycles = patterns × (load+unload shift + captures), pick minimum tester time, not max $\\gamma$.",
    "commonPitfalls": [
      "Equating compression ratio with tester-time reduction 1:1.",
      "Ignoring unload masking cost."
    ],
    "interviewerFollowups": [
      "Ring generator vs MISR tradeoffs.",
      "Adaptive scan / Illinois scan as historical context."
    ],
    "tags": [
      "edt",
      "compression-math",
      "care-bits",
      "test-time"
    ]
  },
  {
    "id": "dft-11",
    "companyName": "board DFT",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Explain TAP controller states (briefly), IR/DR scan, and how boundary-scan cells enable board interconnect test without bed-of-nails on every pin.",
    "shortSummary": "1149.1 defines TCK/TMS/TDI/TDO (+ optional TRST). TAP FSM (16 states) sequences Instruction and Data registers. Boundary cells between IO pads and core can EXTEST to drive/capture pin values for interconnect shorts/opens.",
    "detailedAnswer": "Instructions: `BYPASS`, `EXTEST`, `SAMPLE/PRELOAD`, `IDCODE`, plus design-specific (`INTEST`, BIST run). BSDL describes cell order for ATPG/board tools.\n\n  Board test: park TAP in Shift-DR with EXTEST, serially load pin stimulus, update, capture neighbors — finds solder opens/shorts.\n\n  Limit: does not replace at-speed core scan; it’s board/package interconnect centric (plus useful debug access).",
    "commonPitfalls": [
      "Confusing JTAG with functional high-speed SerDes test.",
      "Wrong BSDL vs silicon cell order."
    ],
    "interviewerFollowups": [
      "1149.6 for AC-coupled differential links.",
      "How IJTAG (1687) networks instruments on-chip."
    ],
    "tags": [
      "jtag",
      "1149.1",
      "boundary-scan",
      "tap",
      "bsdl"
    ]
  },
  {
    "id": "dft-12",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How does LBIST generate patterns and compact results on-chip? Why are X-states and indefinite cycles problematic, and how is LBIST used in automotive in-system test?",
    "shortSummary": "PRPG (LFSR) → scan channels; MISR compacts responses into a signature compared to golden. Xs corrupt MISR; need X-bounding/masking. In-system LBIST runs at power-on / periodic safety checks with known seeds and expected signatures.",
    "detailedAnswer": "Autonomous test reduces ATE pattern storage. Coverage is statistical — may need STUMPS architecture, phase shifters, and multiple seeds to reach SA/TDF targets. At-speed LBIST needs on-chip clocks similar to OCC.\n\n  Challenges: deterministic diagnosis harder from signature alone; power during PRPG-heavy toggles; undefined states after reset must be bounded.\n\n  ISO 26262-style flows use LBIST as a safety mechanism with diagnostic coverage metrics — not a full replacement for production ATPG in many ASICs, but complementary.",
    "commonPitfalls": [
      "Shipping LBIST without X-bounding on RAMs/analog.",
      "Ignoring IR drop under PRPG stress."
    ],
    "interviewerFollowups": [
      "Weighted random patterns vs flat LFSR.",
      "Signature aliasing probability."
    ],
    "tags": [
      "lbist",
      "prpg",
      "misr",
      "in-system-test"
    ]
  },
  {
    "id": "dft-13",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Describe MBIST controllers, common March algorithms, and how BIRA/BISR repair uses spare rows/columns. How does MBIST interact with scan compression Xs?",
    "shortSummary": "On-chip MBIST runs March C-/GO/etc. through memory collars. Fail maps feed Built-In Redundancy Analysis; fuses/eFuse allocate spares (BISR). Memories must be isolated/X-bounded during logic scan so outputs don’t poison compactors.",
    "detailedAnswer": "Collar: mux functional vs BIST ports, compare expected read data. Algorithms trade coverage of coupling/stuck faults vs time.\n\n  Repair: analyze fail bitmap → assign spare rows/cols → program fuses → permanent remap. Soft repair for bring-up vs hard fuse at package test.\n\n  At-speed memory test may use memory BIST with functional clocks; retention tests add pause elements.\n\n  DFT integration: `write_memory_test` flows, shared JTAG go/no-go, and ensuring scan modes force memory outputs to known values.",
    "commonPitfalls": [
      "Leaving SRAM Q floating into scan during logic test.",
      "Forgetting retention / disturb patterns for advanced SRAM."
    ],
    "interviewerFollowups": [
      "ECC vs repair — complementary roles.",
      "Shared vs dedicated MBIST controllers area tradeoff."
    ],
    "tags": [
      "mbist",
      "march",
      "bira",
      "bisr",
      "x-bounding"
    ]
  },
  {
    "id": "dft-14",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Why balance scan chain lengths? How do lockups, clock domains, and compression channels constrain balancing?",
    "shortSummary": "Tester time is gated by the **longest** chain (or longest compressed segment). Unbalanced chains waste IO bandwidth. Balance under domain/lockup/ hierarchical wrapper constraints — not purely by flop count if shift clocks differ.",
    "detailedAnswer": "Ideal: lengths within a few percent. Compression: balance internal chains feeding the compactor. Hierarchical DFT: balance within wrappers then at top.\n\n  Constraints preventing perfect balance: flop clock domains that shouldn’t mix without lockups, physically distant regions (wire), and power domains. Tools pack chains with min/max length knobs.\n\n  After Innovus reorder, lengths stay constant but wire length drops — balancing is logical, reordering is physical.",
    "commonPitfalls": [
      "Balancing only by count while one chain runs a half-speed test clock."
    ],
    "interviewerFollowups": [
      "Segmented scan / dynamic chain length.",
      "Why very short chains can hurt compression encoding."
    ],
    "tags": [
      "chain-balancing",
      "test-time",
      "compression",
      "hierarchy"
    ]
  },
  {
    "id": "dft-15",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Distinguish ATPG-untestable, redundant, and aborted faults. What design fixes raise test coverage when ATPG is “stuck”?",
    "shortSummary": "Redundant: fault cannot alter any output (logic dominance) — often OK or cleaned by optimization. ATPG-untestable: blocked by constraints (X, uncontrollable clocks, bus contention rules). Aborted: tool effort timeout. Fixes: test points, controllability on resets/clocks, X-bounding, constraint review.",
    "detailedAnswer": "Coverage reporting: collapse vs uncollapsed; stuck-at vs transition separately. Don’t celebrate 99% if the missing 1% sits on critical control.\n\n  Test points: control points (force values) and observe points (XOR into scan) raise controllability/observability. Cost: area, timing, possible functional intrusion if mis-gated.\n\n  Formal can prove redundancy; don’t add test points for truly redundant faults.",
    "commonPitfalls": [
      "Forcing coverage % by waiving without classification.",
      "Test points on false paths only."
    ],
    "interviewerFollowups": [
      "Hard vs soft test points vs EDT observe sites.",
      "Coverage vs DPM correlation realities."
    ],
    "tags": [
      "untestable",
      "redundant",
      "test-points",
      "coverage"
    ]
  },
  {
    "id": "dft-16",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Why is scan shift often the worst power mode? List ATPG and DFT architectural mitigations and their coverage/test-time costs.",
    "shortSummary": "High correlated toggling of most flops each shift cycle. Mitigate with constant/adjacent fill, shift clock staggering, reduced chain activity modes, blocking nontesting flops, and lower shift frequency. Tradeoffs: more patterns or longer time.",
    "detailedAnswer": "IR drop during shift can corrupt chain contents ⇒ false fails or damaged signatures. Capture power is a separate (often worse for delay test) problem.\n\n  Techniques:\n  - **Fill strategies:** 0-fill, 1-fill, adjacent-fill to cut transitions.\n  - **Clock gating in shift:** only active chain segments clocked.\n  - **Multi-duty shift** / burst-pause for thermal.\n  - **Low-power ATPG** cost functions.\n\n  Verify with power-aware simulation / rail analysis on shift vectors.",
    "commonPitfalls": [
      "Slowing shift until throughput kills economics without fill improvements.",
      "Ignoring shift-hold interactions when inserting stagger."
    ],
    "interviewerFollowups": [
      "Capture power vs shift power budgeting.",
      "Why random fill maximizes toggle (sometimes wanted for stress, not production)."
    ],
    "tags": [
      "shift-power",
      "low-power-atpg",
      "ir",
      "fill"
    ]
  },
  {
    "id": "dft-17",
    "companyName": "hierarchical SoC DFT",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "What problem do IEEE 1500 core wrappers solve? Explain wrapper serial/parallel ports, inward vs outward test, and why wrappers enable core-based hierarchical ATPG.",
    "shortSummary": "Wrappers isolate reused cores so the SoC can test inward (core internals) or outward (surrounding interconnect) with standardized WSP/WPP controls. Enables modular ATPG, black-box patterns, and reduced top-level complexity.",
    "detailedAnswer": "Wrapper boundary register (WBR) cells at core terminals: bypass functional path in external test, or isolate core during internal test. WIR instruction analogous to JTAG IR.\n\n  Flows: generate patterns per core with wrapper; at SoC, schedule cores, manage TAM (test access mechanism) bandwidth, and test interconnect between wrappers.\n\n  Without wrappers, soft-IP integration forces flattened ATPG that doesn’t scale to multi-billion-gate SoCs.",
    "commonPitfalls": [
      "Wrapping but leaving uncontrolled clocks/resets into the core.",
      "Starving TAM bandwidth so wrapper parallel ports sit idle."
    ],
    "interviewerFollowups": [
      "IJTAG 1687 instrument access vs 1500.",
      "Hierarchical EDT — compression inside wrappers."
    ],
    "tags": [
      "ieee-1500",
      "wrapper",
      "hierarchical-dft",
      "tam"
    ]
  },
  {
    "id": "dft-18",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Integrated clock gates (ICGs) can block scan shift if test overrides are missing. What DFT hooks are required, and how do LOC capture and shift differ in ICG control?",
    "shortSummary": "Force ICGs on (transparent) during shift via `test_mode`/`scan_en` OR into enable. During LOC capture, often allow functional enables so at-speed paths are realistic — or force-on for max coverage depending on methodology.",
    "detailedAnswer": "TDRC flags ungated controllability failures when clocks cannot toggle flops in shift. Fix: test OR-pin on ICG (`TE`/`SE`).\n\n  Capture: if all ICGs forced on, activity/power and some functional false/re timing paths differ from mission mode. Many flows force-on for shift only; capture uses functional EN with ATPG justifying enables.\n\n  Also ensure PLL/OCC clocks actually reach the ICG during at-speed.",
    "commonPitfalls": [
      "Tying TE to 0 permanently after scan insertion bugs.",
      "Async reset of ICG latch state mid-shift."
    ],
    "interviewerFollowups": [
      "Latch-based ICG vs AND-gate gating in test.",
      "Power intent UPF retention vs scan clocks."
    ],
    "tags": [
      "icg",
      "clock-gating",
      "shift",
      "loc-capture"
    ]
  },
  {
    "id": "dft-19",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "A production fail shows unload mismatches. How do you distinguish a chain integrity fail (shift path) from a logic/capture fail? What is chain diagnosis?",
    "shortSummary": "Chain tests (flush patterns) toggle shift path without relying on combinational capture. If flush fails, diagnose broken chain segment via special chain diagnosis; if flush passes but ATPG fails, do logic diagnosis with fault dictionaries / layout-aware callouts.",
    "detailedAnswer": "Flush / chain pattern: shift known values through with capture disabled or trivial. Isolates SI↔SO path, lockups, hold races.\n\n  Chain diagnosis algorithms locate likely broken flop positions from failing unload bits. Physical FA uses emission / e-beam on that region.\n\n  Compression complicates diagnosis — bypass mode or unload masking logs needed for volume diagnosis.",
    "commonPitfalls": [
      "Running expensive logic diagnosis on a broken chain.",
      "No bypass path on compressed designs."
    ],
    "interviewerFollowups": [
      "Volume diagnosis statistical stacking for yield excursions.",
      "Cell-aware diagnosis vs stuck-at dictionaries."
    ],
    "tags": [
      "diagnosis",
      "chain-flush",
      "yield",
      "compression-bypass"
    ]
  },
  {
    "id": "dft-20",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "How does timing-aware or small-delay defect ATPG differ from classic TDF? When would you invest in it?",
    "shortSummary": "Timing-aware ATPG biases tests toward long/sensitized paths and small slack, catching small delay defects that gross TDF metrics miss. Use on speed-critical products, late speed-path yield limiters, or when TDF coverage is high but $F_{\\max}$ fallout remains.",
    "detailedAnswer": "Classic TDF may detect via short paths that still fail the fault model mathematically but don’t stress real timing. SDD/timing-aware uses STA slack data to prefer paths with little margin.\n\n  Cost: heavier ATPG CPU, more patterns, needs accurate timing views (including IR-aware ideally). Complements functional speed sorting / LOS/LOC at-speed suites.",
    "commonPitfalls": [
      "Running timing-aware on inaccurate early STA.",
      "Expecting it to replace structural TDF entirely."
    ],
    "interviewerFollowups": [
      "N-detect TDF as a cheaper alternative.",
      "Correlation to silicon speed path fails."
    ],
    "tags": [
      "timing-aware",
      "sdd",
      "path-delay",
      "atpg"
    ]
  },
  {
    "id": "dft-21",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "What is IDDQ testing, why did it weaken at advanced nodes, and what replaced/augmented it?",
    "shortSummary": "Measure quiescent $I_{DD}$ after vectors to find shorts/leakage defects. Deep submicron leakage variance and massive SoC leakage drown defect deltas. Augmented by voltage stress, mini-IDDQ, and better structural/at-speed tests; still used selectively.",
    "detailedAnswer": "Classic CMOS: defect shorts raise $I_{DDQ}$ orders of magnitude above leakage. FinFET/advanced nodes: high normal leakage, wide distribution ⇒ poor SNR.\n\n  Adaptations: delta-IDDQ between states, colder test, power-domain partitioned measurement, and reliance on SA/TDF/cell-aware. Burn-in / Vstress remain related screens.",
    "commonPitfalls": [
      "Declaring IDDQ dead universally — still useful in some analog/MCU contexts."
    ],
    "interviewerFollowups": [
      "How does power gating invalidate a naive global IDDQ?",
      "Very-low-voltage testing as defect screen."
    ],
    "tags": [
      "iddq",
      "leakage",
      "defect-screen"
    ]
  },
  {
    "id": "dft-22",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Contrast Muxed-D scan with LSSD and with scan flip-flops that use separate scan clocks. When does each appear?",
    "shortSummary": "Muxed-D: single clock + SE mux — industry ASIC default. LSSD: dual non-overlapping clocks, level-sensitive, avoids mux setup penalty, IBM heritage. Separate scan clock designs simplify some hold issues but add clock distribution complexity.",
    "detailedAnswer": "LSSD master/slave latches clocked by A/B clocks — shift uses alternating pulses; functional uses system clocks. Benefits: robust race control, no SE at-speed for some styles. Cost: latch-based design methodology unfamiliar to many CMOS ASIC teams; library/tooling.\n\n  Muxed-D dominates commercial CMOS for ecosystem reasons (ATPG, compression, OCC recipes) despite mux penalty.",
    "commonPitfalls": [
      "Claiming muxed-D has zero functional timing cost."
    ],
    "interviewerFollowups": [
      "Pulsed latches + scan.",
      "Soft vs hard scan mapping in synthesis."
    ],
    "tags": [
      "lssd",
      "muxed-d",
      "scan-styles"
    ]
  },
  {
    "id": "dft-23",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "Field returns show “delay defects” that only fail certain LOC patterns. How do you triage real delay defects vs IR-induced false fails vs pattern sensitivity?",
    "shortSummary": "Re-run with reduced activity patterns / lower frequency / higher V; correlate with dynamic IR movies; use chain-safe power-aware regenerations. Real defects persist under low-power patterns; IR fails disappear when toggle density drops or V rises slightly.",
    "detailedAnswer": "Triage matrix:\n  - **V/F shmoo:** IR often steep in V; hard defects may differ.\n  - **Power-aware regenerate:** if fail vanishes, suspect IR.\n  - **Layout-aware diagnosis:** clusters near weak PG ⇒ PI; random cell distribution ⇒ random defect.\n  - **Same pattern across temperature:** thermal × EM/IR interactions.\n\n  Process fix may be PDN ECO or ATPG power constraints rather than logic redesign — staff-level judgment call with yield $$.",
    "commonPitfalls": [
      "Immediate metal ECO for delay when PDN is the root cause.",
      "Shipping low-power patterns that hide real speed paths needed for quality."
    ],
    "interviewerFollowups": [
      "How do you set capture power thresholds in ATPG?",
      "Communication between DFT and PI teams’ signoff metrics."
    ],
    "tags": [
      "false-fail",
      "ir",
      "triage",
      "loc",
      "yield"
    ]
  },
  {
    "id": "dft-24",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Why must compressed scan architectures include a bypass / streaming diagnose mode? What else do you instrument for bring-up?",
    "shortSummary": "Bypass restores 1:1 external visibility for chain diagnosis and FA when compactors lose information. Also provide skip-compactor unload, seed control, OCC debug, and memory bypass modes.",
    "detailedAnswer": "Compactors destroy spatial mapping of fails (many-to-few). Volume diagnosis algorithms help, but early bring-up needs deterministic chain visibility.\n\n  Hooks: JTAG instructions to disable EDT, select single chain, freeze MISR, read intermediate signatures, and clock-step OCC. Document in DFT spec — not an afterthought post-silicon.",
    "commonPitfalls": [
      "Compression-only silicon with no bypass (undiagnosable chains)."
    ],
    "interviewerFollowups": [
      "Bandwidth cost of always-on bypass pins vs instructional bypass.",
      "Security locks on test access in production vs RMA."
    ],
    "tags": [
      "bypass",
      "diagnosis",
      "edt",
      "bring-up"
    ]
  },
  {
    "id": "dft-25",
    "domain": "dft-atpg",
    "domainName": "DFT, Scan Chains & Testability",
    "role": "DFT & Testability Design Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Sketch an end-to-end hierarchical DFT architecture that combines 1500 wrappers, EDT compression, OCC at-speed, MBIST, and top-level JTAG. What are the top five signoff checks before tapeout?",
    "shortSummary": "Top JTAG/IJTAG programs TAMs into wrappers; cores contain EDT+OCC+scan; memories have MBIST collars X-bounded from logic compactors. Signoff: TDRC clean, coverage targets, shift/capture STA, power budgets, SDC modes, ScanDEF/ATPG models match LEC, and package-test pattern bring-up plan.",
    "detailedAnswer": "Architecture layers:\n  1. **Access:** 1149.1 / 1687 network.\n  2. **Core wrappers:** 1500 isolation + TAM.\n  3. **Inside core:** compressed scan + OCC + test points.\n  4. **Memories:** MBIST + repair fuse controller.\n  5. **Analog/IO:** boundary scan / IBIST as applicable.\n\n  **Top signoff checks:**\n  1. `check_dft_rules` / uncontrollable clocks/resets = 0 blockers.\n  2. SA & TDF coverage ≥ gate; untestables classified.\n  3. Shift + capture + OCC timing closed (including lockups).\n  4. Shift/capture power < IR budget; patterns power-audited.\n  5. Handoff: ScanDEF, ATPG models, BSDL, compression macros, LEC vs netlist, and known-fail bring-up suite on tester.\n\n  Staff candidates should speak across DFT–STA–PI–ATE boundaries, not only ATPG switches.",
    "commonPitfalls": [
      "Optimizing only coverage % while pattern power fails on ATE.",
      "Hierarchical schedule deadlocks (cannot access core B while A holds TAM)."
    ],
    "interviewerFollowups": [
      "How do you validate DFT on a multi-die / chiplet package?",
      "Security: disabling test access after provisioning."
    ],
    "tags": [
      "hierarchical-dft",
      "signoff",
      "edt",
      "occ",
      "1500",
      "mbist"
    ]
  },
  {
    "id": "puz-01",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "You have 1000 wine bottles. Exactly one is poisoned. You have 10 lab rats and can run **one** test round (feed mixtures, wait for the outcome). How do you identify the poisoned bottle? Generalize to $N$ bottles and $k$ rats.",
    "shortSummary": "Encode each bottle index as a unique $k$-bit binary ID. Rat $i$ drinks from every bottle whose ID has bit $i$ set. The pattern of dead/alive rats is the binary index of the poisoned bottle. Capacity is $2^k$ bottles with $k$ rats (here $2^{10}=1024 \\ge 1000$).",
    "detailedAnswer": "Treat the outcome of each rat as one bit of information: alive $=0$, dead $=1$. With $k$ independent binary outcomes you learn exactly $k$ bits, so you can distinguish at most $2^k$ hypotheses.\n\n  Number bottles $0 \\ldots 999$. Assign bottle $n$ the binary representation $b_{k-1}\\ldots b_0$. For each rat $i \\in \\{0,\\ldots,k-1\\}$:\n  - Feed rat $i$ a sip from every bottle $n$ where bit $b_i(n)=1$.\n  - After the incubation window, read the $k$-bit death vector $d_{k-1}\\ldots d_0$.\n  - That integer is the poisoned bottle index.\n\n  Example with 8 bottles and 3 rats: bottle $5 = 101_2$ is tasted by rats 0 and 2. If rats 0 and 2 die and rat 1 lives, the code is $101_2=5$.\n\n  Information-theoretic bound: one round $\\Rightarrow$ at most $2^k$ distinguishable states. Multiple rounds, or “three-state” outcomes, change the bound (e.g. ternary weighing puzzles).",
    "commonPitfalls": [
      "Trying one-rat-per-bottle sequential tests (needs 1000 rats or 1000 rounds).",
      "Forgetting bottle 0 (all-zero) — no rat drinks it; all alive correctly identifies bottle 0.",
      "Claiming capacity is $k$ or $k(k-1)$ instead of $2^k$."
    ],
    "interviewerFollowups": [
      "How many rats for 1,000,000 bottles in one round?",
      "What if up to **two** bottles are poisoned (same one-round model)?",
      "Map this to finding a stuck-at-1 net with a parallel XOR signature."
    ],
    "tags": [
      "binary-encoding",
      "information-theory",
      "interview-classic",
      "hardware-analogy"
    ],
    "isFreeSample": true
  },
  {
    "id": "puz-02",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "25 horses; you can race 5 at a time. Find the **top 3** fastest horses with the minimum number of races. Assume transitive, distinct speeds.",
    "shortSummary": "8 races: 5 initial heats, 1 race among the 5 heat winners to rank groups, then 1 final among the only 5 remaining candidates for 2nd/3rd.",
    "detailedAnswer": "1. Split into 5 heats of 5: races R1–R5. Label horses by heat and finish: $A_1>A_2>A_3>A_4>A_5$, similarly $B,C,D,E$ (subscript 1 = heat winner).\n  2. Race the five winners: assume $A_1 > B_1 > C_1 > D_1 > E_1$ (race R6). Then $A_1$ is overall #1 (beat every other group’s best, transitively).\n  3. Eliminate anyone who cannot possibly be top-3:\n     - Entire groups $D$ and $E$ (at least three horses strictly faster than any of them: $A_1,B_1,C_1$).\n     - $C_2,C_3,\\ldots$ and $B_3,B_4,\\ldots$ similarly.\n  4. Remaining candidates for #2/#3 besides known #1 $A_1$: $\\{A_2, A_3, B_1, B_2, C_1\\}$ — exactly five horses. Race them (R7). Top two of that race are overall #2 and #3.\n\n  Total = **8**. You cannot do better in the worst case with this model: after ranking groups you still need one comparison among five contenders.",
    "commonPitfalls": [
      "Stopping after 7 races and declaring $B_1$ as #2 without racing $A_2$ vs $B_1$ vs $C_1$.",
      "Including $D_1$ in the final (already eliminated).",
      "Assuming you need a full sort (far more races)."
    ],
    "interviewerFollowups": [
      "Find top-5 instead of top-3 — how does the candidate set grow?",
      "Relate to tournament method / comparison lower bounds $\\lceil \\log_2(n!)\\rceil$."
    ],
    "tags": [
      "tournament",
      "elimination",
      "sorting-lower-bound",
      "classic"
    ],
    "isFreeSample": true
  },
  {
    "id": "puz-03",
    "companyName": "Amazon / Microsoft",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Four people need to cross a bridge at night with one flashlight. Crossing times: 1, 2, 5, and 10 minutes. At most two cross at a time; anytime someone crosses, the flashlight must be carried. The pair moves at the slower person’s speed. Minimize total time.",
    "shortSummary": "Optimal total is **17** minutes. Two canonical strategies; pick the better of “slow pair + fast return” vs “two slow solos with fast shuttle.”",
    "detailedAnswer": "Denote people $A=1, B=2, C=5, D=10$.\n\n  **Strategy 1 (often optimal here):**\n  1. $A,B$ cross (2); $A$ returns (1) → 3\n  2. $C,D$ cross (10); $B$ returns (2) → 15\n  3. $A,B$ cross (2) → **17**\n\n  **Strategy 2:**\n  1. $A,B$ cross (2); $A$ returns (1) → 3\n  2. $A,D$ cross (10); $A$ returns (1) → 14\n  3. $A,C$ cross (5) → **19** (worse here)\n\n  General rule: when two slow people are much slower than the second-fastest, Strategy 1 wins; otherwise Strategy 2 can win. Always compare both.",
    "commonPitfalls": [
      "Forgetting the flashlight must return (under-counting).",
      "Sending $C$ and $D$ separately without optimizing returns."
    ],
    "interviewerFollowups": [
      "Times 1, 2, 6, 10 — which strategy wins?",
      "Model as a graph shortest path on subset states."
    ],
    "tags": [
      "state-space",
      "optimization",
      "classic-puzzle"
    ]
  },
  {
    "id": "puz-04",
    "company": "google-silicon",
    "companyName": "Google Silicon",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "12 balls, identical except one has different weight (heavier **or** lighter, unknown). Find the odd ball **and** whether it is heavy or light in 3 weighings on a balance scale.",
    "shortSummary": "Each weighing has 3 outcomes (L/R/balance) ⇒ $3^3=27$ leaves; need to distinguish $12\\times 2=24$ cases — feasible. Partition into thirds and adaptive ternary search with sign tracking.",
    "detailedAnswer": "Information bound: 27 distinguishable outcome sequences; 24 hypotheses + “all equal” unused ⇒ solvable.\n\n  Classic first weighing: weigh $\\{1,2,3,4\\}$ vs $\\{5,6,7,8\\}$.\n  - **Balance:** odd ball in $\\{9,10,11,12\\}$. Second weighing e.g. $9,10,11$ vs $1,2,3$ (known good). Unbalance tells which side and polarity; third isolates.\n  - **Unbalance:** 8 suspect balls with known “possibly heavy on left / possibly light on right” labels. Remap and weigh a carefully chosen mix of “possibly heavy” vs “possibly light” so each outcome shrinks the hypothesis set by ~3×.\n\n  The invariant: always keep the remaining hypothesis count $\\le 3^{w}$ for $w$ weighings left.",
    "commonPitfalls": [
      "Weighing 6 vs 6 first (leaves too many hypotheses for 2 weighings).",
      "Finding the ball but not determining heavy vs light."
    ],
    "interviewerFollowups": [
      "Maximum $n$ for 3 weighings with heavy-or-light? ($(3^k-3)/2$ if “all equal” possible, else $(3^k-1)/2$ variants).",
      "Only-heavier case: how many balls with 3 weighings? ($3^3=27$)."
    ],
    "tags": [
      "ternary-search",
      "balance-scale",
      "information-theory"
    ]
  },
  {
    "id": "puz-05",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "9 balls; exactly one is heavier. Find it in 2 weighings.",
    "shortSummary": "Ternary split: weigh 3 vs 3. The heavy group (or the untouched 3 if balance) is searched with one more 1-vs-1 weighing.",
    "detailedAnswer": "Weighing 1: balls $\\{1,2,3\\}$ vs $\\{4,5,6\\}$.\n  - Left heavy ⇒ heavy in $\\{1,2,3\\}$.\n  - Right heavy ⇒ heavy in $\\{4,5,6\\}$.\n  - Balance ⇒ heavy in $\\{7,8,9\\}$.\n\n  Weighing 2: take two from the suspect trio; heavier is the answer, or if balance the third is heavy.\n\n  General: with $w$ weighings and heavier-only, capacity $3^w$.",
    "commonPitfalls": [
      "Starting with 4 vs 4 (works for 9? leaves 1 aside but unbalanced case has 4 suspects — not solvable in one weighing)."
    ],
    "interviewerFollowups": [
      "Extend to 27 balls / 3 weighings.",
      "What changes if the odd ball could be lighter?"
    ],
    "tags": [
      "ternary-split",
      "balance-scale",
      "warmup"
    ]
  },
  {
    "id": "puz-06",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Divide an input clock by an **odd** integer $N$ (e.g. 3, 5) and produce a **50% duty cycle** output using only flip-flops and combo logic — no PLL/DLL. How?",
    "shortSummary": "Generate a /N pulse stream on posedge, a delayed /N stream on negedge (or dual-edge technique), then OR/XOR them so high time equals low time of $N/2$ input periods.",
    "detailedAnswer": "A naive mod-$N$ counter toggled on one edge yields duty $1/N$ (or $\\lfloor N/2\\rfloor/N$), not 50% for odd $N$.\n\n  **Standard digital technique for /3 with 50%:**\n  1. Posedge FSM produces a signal high for 1.5 input periods worth of “intent.”\n  2. Sample/extend using **negedge** flop so transitions occur on both edges.\n  3. OR the posedge-derived and negedge-derived pulses: output period $=3\\,T_{in}$, high time $=1.5\\,T_{in}$.\n\n  More generally for odd $N$: create a pulse of width $(N+1)/2$ cycles from posedge logic and width $(N-1)/2$ from negedge (or vice versa) and combine so high duration $= N/2$ input half-cycles.\n\n  **Constraints:** need a clean duty-cycle input clock; negedge paths need STA on both edges; glitch-free OR requires registered one-sided pulses. For even $N$, a simple toggle every $N/2$ posedges already gives 50%.",
    "tclOrVerilogSnippet": {
      "lang": "verilog",
      "code": "// Conceptual /3 50% duty (illustrative)\n  // cnt on posedge: 0,1,2,0,...\n  // q_pos high when cnt==0 || cnt==1  (2 cycles)\n  // q_neg samples delayed version on negedge\n  // clk_out = q_pos | q_neg  → high for 1.5 Tin"
    },
    "commonPitfalls": [
      "Claiming “just use a PLL.”",
      "Combo XOR of delayed clocks without analyzing glitches.",
      "Ignoring that both-edge circuits complicate STA and DFT."
    ],
    "interviewerFollowups": [
      "How do you divide by 2.5 or 1.5?",
      "Glitch-free clock mux vs divider output used as a clock — what SDC is needed?"
    ],
    "tags": [
      "clock-divider",
      "duty-cycle",
      "dual-edge",
      "digital-design"
    ]
  },
  {
    "id": "puz-07",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Write a constant-time check that unsigned integer $x$ is a power of two (including discussing $x=0$). Give the bit-twiddling form and a hardware gate view.",
    "shortSummary": "$x \\neq 0$ and $(x \\,\\&\\, (x-1)) = 0$. In hardware: OR-reduce of bits is 1 and population count is 1 (or the same $x \\& (x-1)$ trick).",
    "detailedAnswer": "Powers of two have exactly one bit set: $1,2,4,8,\\ldots$  \n  Subtracting 1 clears that bit and sets all lower bits: e.g. $8=1000_2$, $7=0111_2$.  \n  Bitwise AND is zero iff there was exactly one set bit.\n\n  $x=0$ must be excluded: $0 \\& (-1)$ depends on width; define explicitly `x && !(x & (x-1))`.\n\n  Hardware: for one-hot decode validation, the same property checks legal one-hot selects. Priority encoders often assert an “valid” if popcount==1.",
    "tclOrVerilogSnippet": {
      "lang": "c",
      "code": "int is_pow2(unsigned x) { return x && !(x & (x - 1)); }"
    },
    "commonPitfalls": [
      "Accepting 0 as a power of two.",
      "Using loops / `__builtin_popcount` without discussing HW cost."
    ],
    "interviewerFollowups": [
      "Detect if $x$ is $2^n-1$ (all-ones) instead.",
      "Floor log2 via leading-zero count in synthesis."
    ],
    "tags": [
      "bit-twiddling",
      "one-hot",
      "digital-check"
    ]
  },
  {
    "id": "puz-08",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Swap two registers/variables without a temporary storage element. Discuss XOR, arithmetic, and why HW usually still uses a temp or enable mux.",
    "shortSummary": "XOR triple: $a&=a\\oplus b;\\ b&=a\\oplus b;\\ a&=a\\oplus b$. Arithmetic: $a=a+b;\\ b=a-b;\\ a=a-b$. In RTL, a 2:1 mux pair with enables is clearer and safer.",
    "detailedAnswer": "**XOR method** works iff $a$ and $b$ are distinct storage (same address destroys data). Properties: $x\\oplus x=0$, $x\\oplus 0=x$.\n\n  **Hardware reality:** a flop cannot read-modify-write three XOR steps in one cycle without intermediate state; synthesizers implement swaps as parallel loads: $a' = b, b' = a$ using two flops’ next-state muxes — no “temp RTL variable” needed because both next-state nets exist physically.\n\n  Interviewers want XOR cleverness **and** the recognition that single-cycle HW swap is just crossed muxing.",
    "tclOrVerilogSnippet": {
      "lang": "verilog",
      "code": "always_ff @(posedge clk) if (swap) begin\n    a <= b;\n    b <= a; // both NBs sample old values — legal swap\n  end"
    },
    "commonPitfalls": [
      "XOR-swapping a variable with itself / same memory location.",
      "Overflow comments on arithmetic swap without modular rings."
    ],
    "interviewerFollowups": [
      "Swap two wires in a netlist without a temp buffer — possible?",
      "Register renaming vs architectural swap in a CPU."
    ],
    "tags": [
      "xor-swap",
      "rtl-nba",
      "bit-twiddling"
    ]
  },
  {
    "id": "puz-09",
    "companyName": "FAANG phone screen",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Array of $2n+1$ integers where every value appears twice except one. Find the unique value in $O(n)$ time and $O(1)$ space. Map to a hardware reduction tree.",
    "shortSummary": "XOR all elements; duplicates cancel ($x\\oplus x=0$), unique remains. Hardware: balanced XOR tree over the bus/cycle stream.",
    "detailedAnswer": "Associativity/commutativity of XOR ⇒ order irrelevant.  \n  Extension: if every value appears $3\\times$ except one appearing $1\\times$, use mod-3 bit counters (two bits per bit-position), not plain XOR.\n\n  In HW signature / MISR thinking: folding XOR is a compact parity fingerprint — same algebra as DFT compaction (but X-states poison it).",
    "tclOrVerilogSnippet": {
      "lang": "c",
      "code": "int uniq(int *a, int n) {\n    int x = 0; for (int i = 0; i < n; i++) x ^= a[i]; return x;\n  }"
    },
    "commonPitfalls": [
      "Using a hash set (violates $O(1)$ space).",
      "Trying XOR when frequency is $3k\\pm1$ without mod-3 logic."
    ],
    "interviewerFollowups": [
      "Exactly two unique numbers, all others duplicated — how? (partition by a set bit of `x^y`).",
      "Streaming unique detection with limited on-chip SRAM."
    ],
    "tags": [
      "xor-fold",
      "streaming",
      "hardware-reduction"
    ]
  },
  {
    "id": "puz-10",
    "company": "arm",
    "companyName": "Arm",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Design a fair 2-client hardware mutex (or traffic light) so both requesters eventually get the resource, with no combo loop, and define grant timing. Extend to $N$ clients.",
    "shortSummary": "Registered round-robin arbiter: track `last_grant`, compute next grant from rotating priority mask; assert grant one cycle after request sample; never form combo ACK loops through clients.",
    "detailedAnswer": "Requirements: mutual exclusion (≤1 grant), deadlock freedom, starvation freedom (weak fairness).\n\n  **2-client RR:**\n  - State bit `pri` prefers A or B.\n  - If preferred requests → grant preferred; else grant the other if requesting.\n  - On grant, flip `pri` (or set to loser).\n\n  **N-client:** thermometer / rotating priority: `grant = req & -req` style masked by rotate of last winner; use `fixed_pri = ffs(masked_req)` then update pointer.\n\n  **Traffic light analogy:** two roads; green = grant; yellow = pipeline drain (must account for in-flight transactions before releasing).\n\n  Avoid pure combo mutex (`grant_a = req_a & ~grant_b`) — can glitch or livelock under simultaneous requests.",
    "tclOrVerilogSnippet": {
      "lang": "verilog",
      "code": "always_ff @(posedge clk or negedge rst_n) begin\n    if (!rst_n) begin g_a<=0; g_b<=0; pri<=0; end\n    else begin\n      g_a <= pri ? (req_a | ~req_b) && req_a : (req_a & ~req_b);\n      g_b <= pri ? (req_b & ~req_a) : (req_b | ~req_a) && req_b;\n      if (g_a) pri <= 1'b1; else if (g_b) pri <= 1'b0;\n    end\n  end"
    },
    "commonPitfalls": [
      "Combo cross-coupled grants.",
      "Priority always fixed → starvation.",
      "Forgetting to hold grant until `done`/`release`."
    ],
    "interviewerFollowups": [
      "Weighted RR / deficit RR for QoS.",
      "Async mutex (arbiter) for two clock domains — metastability on requests?"
    ],
    "tags": [
      "arbiter",
      "round-robin",
      "mutex",
      "rtl"
    ]
  },
  {
    "id": "puz-11",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Find the critical floor in a 100-story building with 2 eggs, minimizing worst-case drops.",
    "shortSummary": "Equalize worst-case remaining drops: jump intervals of size $k, k-1, \\ldots, 1$ with $k(k+1)/2 \\ge 100$ ⇒ $k=14$. Worst case = 14 drops.",
    "detailedAnswer": "With 2 eggs, after first egg breaks at attempt $i$, you linear-search at most $(s_i-1)$ floors with the second egg. Let worst-case budget be $k$ drops. Then first-egg attempts should leave $k-1, k-2, \\ldots$ remaining drops ⇒ interval lengths $k, k-1, \\ldots, 1$.\n\n  Solve $k(k+1)/2 \\ge 100$ → $k=14$ since $14\\times15/2=105$.\n\n  Strategy: drop first egg from floors 14, 27, 39, … Then linear scan with second egg.",
    "commonPitfalls": [
      "Binary search (optimal for ∞ eggs, bad worst-case with 2).",
      "Fixed interval 10 → worst case 19."
    ],
    "interviewerFollowups": [
      "Generalize to $e$ eggs (dynamic programming).",
      "Relate to minimizing worst-case ATPG diagnostic depth."
    ],
    "tags": [
      "minimax",
      "dynamic-programming",
      "classic"
    ]
  },
  {
    "id": "puz-12",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Jugs of 3L and 5L (unmarked). Measure exactly 4L. State the theorem that governs solvability.",
    "shortSummary": "Yes. Bezout: you can measure any multiple of $\\gcd(3,5)=1$. One sequence ends with 4L in the 5L jug.",
    "detailedAnswer": "Operations: fill, empty, pour until empty/full. Reachable volumes are multiples of $\\gcd(a,b)$ capped by jug sizes.\n\n  Example sequence:\n  1. Fill 5 → `(0,5)`\n  2. Pour into 3 → `(3,2)`\n  3. Empty 3 → `(0,2)`\n  4. Pour remaining 2 into 3 → `(2,0)`\n  5. Fill 5 → `(2,5)`\n  6. Pour into 3 until full (needs 1) → `(3,4)` ← **4L in the 5L jug**",
    "commonPitfalls": [
      "Claiming impossible because neither jug is 4L capacity alone (5L holds 4)."
    ],
    "interviewerFollowups": [
      "Can you measure 4 with 6 and 9? (No — gcd=3 ∤? wait 3|4? No.)",
      "Model as BFS on state graph."
    ],
    "tags": [
      "bezout",
      "bfs-state",
      "classic"
    ]
  },
  {
    "id": "puz-13",
    "companyName": "DSP / networking ASIC",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Reverse the bits of a 32-bit word. Give $O(1)$ SWAR steps and discuss HW wiring cost.",
    "shortSummary": "Parallel swap masks: swap adjacent bits, then 2-bit fields, then nibbles, bytes, 16-bit halves — 5 stages. In silicon, bit-reverse is pure wiring (barrel) or a muxed crossbar if selectable.",
    "detailedAnswer": "Classic SWAR:\n  ```text\n  x = (x >> 1)  & 0x55555555 | (x & 0x55555555) << 1;\n  x = (x >> 2)  & 0x33333333 | (x & 0x33333333) << 2;\n  x = (x >> 4)  & 0x0F0F0F0F | (x & 0x0F0F0F0F) << 4;\n  x = (x >> 8)  & 0x00FF00FF | (x & 0x00FF00FF) << 8;\n  x = (x >> 16) | (x << 16);\n  ```\n  FFT bit-reversed addressing and CRC path reflections use this. ASIC: if always-on reverse, route bits physically; if runtime endian/bit-order modes, pay mux delay.",
    "commonPitfalls": [
      "Looping bit-by-bit in RTL without considering critical path."
    ],
    "interviewerFollowups": [
      "Reverse bytes only (endian swap) vs reverse all bits.",
      "Cost in an FPGA carry chain vs ASIC metal."
    ],
    "tags": [
      "swar",
      "bit-reverse",
      "dsp"
    ]
  },
  {
    "id": "puz-14",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Count the number of 1-bits in a word. Compare Brian Kernighan iteration vs parallel SWAR adder tree; what does HW synthesis usually build?",
    "shortSummary": "Kernighan: `for (;x; cnt++) x &= x-1;` runs popcount times. SWAR sums adjacent fields in $O(\\log n)$ steps. HW: compressor tree / `popcount` operator → balanced adder tree.",
    "detailedAnswer": "$x \\& (x-1)$ clears the lowest set bit ⇒ Kernighan is optimal among bit-serial methods when density is sparse.\n\n  Parallel:\n  ```text\n  x = x - ((x>>1) & 0x55555555);\n  x = (x & 0x33333333) + ((x>>2) & 0x33333333);\n  ...\n  ```\n  In IEEE 754 / crypto / ECC HW, popcount is a first-class datapath. ATPG care-bit density estimation is the same statistic.",
    "commonPitfalls": [
      "Claiming Kernighan is always faster (dense ones hurt)."
    ],
    "interviewerFollowups": [
      "Implement `ctz`/`clz` with similar tricks.",
      "Hamming distance = popcount(a^b)."
    ],
    "tags": [
      "popcount",
      "kernighan",
      "compressor-tree"
    ]
  },
  {
    "id": "puz-15",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "For unsigned $x$, compute the smallest power of two $\\ge x$ (define behavior at 0 and overflow).",
    "shortSummary": "Decrement, smear MSBs via `x|=x>>1; >>2; …`, then increment. Or `1 << ceil_log2(x)`.",
    "detailedAnswer": "Algorithm (32-bit):\n  ```c\n  uint32_t next_pow2(uint32_t x) {\n    if (x == 0) return 1;\n    x--; // so powers of two stay themselves\n    x |= x >> 1; x |= x >> 2; x |= x >> 4;\n    x |= x >> 8; x |= x >> 16;\n    return x + 1; // undefined/0 on overflow past 2^31 if x>2^31\n  }\n  ```\n  HW: leading-zero count → `1 << (32-clz(x-1))`. Used for FIFO depth sizing and memory bank alignment.",
    "commonPitfalls": [
      "Forgetting `x--` causes doubling true powers of two."
    ],
    "interviewerFollowups": [
      "Floor power of two (`x & -x` isolate / smear differently).",
      "Why async FIFO depths are forced to $2^n$."
    ],
    "tags": [
      "bit-smear",
      "alignment",
      "fifo-depth"
    ]
  },
  {
    "id": "puz-16",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "How do you detect little-endian vs big-endian in C? How does a bus bridge perform endian conversion without CPU help?",
    "shortSummary": "Store `uint32_t x=1` and inspect the first byte via `char*`. HW bridge byte-swaps lanes with a static crossbar controlled by a mode bit (`{b0,b1,b2,b3}↔{b3,b2,b1,b0}`).",
    "detailedAnswer": "SW:\n  ```c\n  int little = (*(char*)&(int){1}) == 1;\n  ```\n  HW: AXI/AHB downsizers must define byte-lane steering. Endian conversion is wiring + mux, but **address invariance** vs **data invariance** conventions differ — get the bus protocol rule right or sparse writes corrupt bytes.\n\n  Note: bit-endianness inside a byte is separate from byte-endianness of a word.",
    "commonPitfalls": [
      "Confusing bit order on a serial wire with memory endianness."
    ],
    "interviewerFollowups": [
      "How does PCIe define endianness?",
      "Endian swap on a streaming CRC datastream — where to place it?"
    ],
    "tags": [
      "endianness",
      "interconnect",
      "byte-swap"
    ]
  },
  {
    "id": "puz-17",
    "companyName": "SerDes / PLL-less SoC",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Design a divide-by-5 clock with 50% duty using only posedge and negedge flops. Sketch waveforms for $T_{in}$.",
    "shortSummary": "Posedge counter period-5 creates a 3-high/2-low enable; OR with a negedge-shifted replica so edges fall mid-cycle → high time $=2.5\\,T_{in}$, period $=5\\,T_{in}$.",
    "detailedAnswer": "Target: $T_{out}=5T_{in}$, duty 50% ⇒ high $=2.5T_{in}$.\n\n  1. Posedge mod-5 counter `c`.\n  2. `p = (c==0)||(c==1)||(c==2)` // 3 cycles high intent\n  3. Negedge flop captures a phase-shifted version `n` aligned so `clk_out = p | n` stretches by half a cycle and clips to 2.5.\n\n  Exact Boolean recipes vary; interviewers expect waveform sketches showing transitions on **both** edges and discussion of:\n  - duty distortion under asymmetric $T_{clk_qh}$ vs $T_{clk_ql}$\n  - using output only as generated clock with `create_generated_clock`\n  - testability (scan cannot easily exercise negedge path unless LOC covers it)",
    "commonPitfalls": [
      "Duty 40/60 from posedge-only /5 toggle."
    ],
    "interviewerFollowups": [
      "Spread-spectrum friendly dividers?",
      "Divide-by-1.5 for DDR-style clocks."
    ],
    "tags": [
      "clock-divider",
      "duty-50",
      "waveforms"
    ]
  },
  {
    "id": "puz-18",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Array contains $n$ distinct numbers from $0..n$ with one missing (length $n$). Find the missing number in $O(n)$ time, $O(1)$ space.",
    "shortSummary": "XOR all indices and values, or use sum $n(n+1)/2 - \\sum a_i$ with overflow care. XOR preferred in HW.",
    "detailedAnswer": "```c\n  int missing(int *a, int n) {\n    int x = n;\n    for (int i = 0; i < n; i++) x ^= i ^ a[i];\n    return x;\n  }\n  ```\n  Sum method needs wide accumulators. In HW packet checkers, XOR parity lanes are cheaper than adders.",
    "commonPitfalls": [
      "Sorting first ($O(n\\log n)$).",
      "Ignoring overflow on 32-bit sum for large $n$."
    ],
    "interviewerFollowups": [
      "Two missing numbers.",
      "Duplicate **and** missing simultaneously."
    ],
    "tags": [
      "xor",
      "gauss-sum",
      "streaming"
    ]
  },
  {
    "id": "puz-19",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Find the majority element (>⌊n/2⌋ occurrences) in linear time, constant space. How would an HW voter for TMR look different?",
    "shortSummary": "Boyer–Moore voting: keep `cand` and `cnt`; increment on match else decrement; reset cand when cnt hits 0. TMR majority is bitwise `(a&b)|(a&c)|(b&c)` — constant 3 inputs, not streaming.",
    "detailedAnswer": "Streaming algorithm cancels minority pairs. Guaranteed correct when a majority exists; otherwise verify with a second pass.\n\n  HW TMR: triple modular redundancy voters are **spatial** majority gates per bit, often with fault-tolerant latching. Not the same as Boyer–Moore (which is algorithmic over a sequence).",
    "commonPitfalls": [
      "Returning Boyer–Moore candidate without verifying when majority is not promised."
    ],
    "interviewerFollowups": [
      "Find element appearing $>n/3$ times (pair of candidates).",
      "Soft-error hardened voter placement after SEU-prone flops."
    ],
    "tags": [
      "boyer-moore",
      "tmr",
      "voting"
    ]
  },
  {
    "id": "puz-20",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Design a glitch-free mux between two asynchronous clocks. Why is a plain `assign clk = sel ? clk_a : clk_b` illegal for clock nets?",
    "shortSummary": "Plain mux glitches when select toggles while either clock is high. Use a registered handshake clock switch: deassert current clock’s enable synchronously, wait for both enables low, then enable the new clock — typically with negedge sensing so switches occur when clocks are low.",
    "detailedAnswer": "Glitch = runt pulse shorter than a legal period → metastability storms downstream.\n\n  **Canonical glitch-free clock switch:**\n  1. Synchronize `sel` into each clock domain.\n  2. For the active clock, synchronously clear its AND-enable.\n  3. Cross-detect that the other domain’s enable is low (sync).\n  4. Assert the new clock’s enable only when both paths guarantee no overlap.\n\n  ICGs with carefully timed `EN` are related but assume same-domain enable timing. For fully async sources, use specialized clock-switch cells from the library.\n\n  SDC: generated clocks on mux output; exclusive clock groups for modes; never trust synthesis to “just mux” clocks.",
    "tclOrVerilogSnippet": {
      "lang": "verilog",
      "code": "// Conceptual: enables registered, clocks AND-gated, OR combined\n  // clk_out = (clk_a & en_a) | (clk_b & en_b);\n  // with en_a/en_b mutually exclusive and break-before-make"
    },
    "commonPitfalls": [
      "Select switching on posedge without waiting for inactive level.",
      "Using LUT mux on FPGA clocks without BUFGMUX primitive."
    ],
    "interviewerFollowups": [
      "How does `set_clock_groups -logically_exclusive` interact?",
      "Bypass modes for scan clocks through the same mux."
    ],
    "tags": [
      "clock-mux",
      "glitch-free",
      "icg",
      "soc"
    ]
  },
  {
    "id": "puz-21",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Onsite Technical Round 1",
    "question": "Given an $N$-bit one-hot-or-more request vector, design a priority encoder returning the index of the least-significant set bit. Discuss timing vs area (linear cascade vs tree).",
    "shortSummary": "LSB-first find-first-set: `idx = ffs(req)`, `oh = req & -req` in two’s complement. Tree prefix OR reduces $O(N)$ delay to $O(\\log N)$.",
    "detailedAnswer": "Isolate lowest set bit: `lsb = req & -req` (two’s complement). Then encode that one-hot to binary via OR-of-bits with weights.\n\n  Timing: naive for-loop priority is a long OR chain — bad at $N=256$. Use hierarchical priority (bytes then among bytes).\n\n  Round-robin reuse: mask off bits ≤ last grant, FFS on masked, if zero FFS on unmasked.",
    "commonPitfalls": [
      "Returning X when req=0 without a `valid` flag."
    ],
    "interviewerFollowups": [
      "Leading-zero count vs trailing-zero count silicon cells.",
      "Thermometer encode for thermometer ADCs."
    ],
    "tags": [
      "priority-encoder",
      "ffs",
      "arbitration"
    ]
  },
  {
    "id": "puz-22",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Convert between one-hot and binary. Why do FSMs sometimes prefer one-hot encoding in ASICs/FPGAs?",
    "shortSummary": "Binary→one-hot: decoder. One-hot→binary: priority/OR encoder. One-hot FSMs simplify next-state (often single bit set) at cost of more flops; FPGAs with abundant FFs like one-hot.",
    "detailedAnswer": "Illegal multi-hot states need detection for safety-critical FSMs (`popcount!=1`). Sparse one-hot can reduce combo depth on next-state logic: transition logic becomes “if bit_i and cond then bit_j.”\n\n  Area trade: $S$ states need $S$ flops (one-hot) vs $\\lceil\\log_2 S\\rceil$ (binary). For small $S$, one-hot often wins timing.",
    "commonPitfalls": [
      "No illegal-state recovery reset path."
    ],
    "interviewerFollowups": [
      "Gray-coded FSM vs one-hot for async outputs.",
      "Safe FSM encoding in DO-254 flows."
    ],
    "tags": [
      "one-hot",
      "fsm-encoding",
      "decoder"
    ]
  },
  {
    "id": "puz-23",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Every element appears twice except two unique numbers $p$ and $q$. Find both in $O(n)$ time / $O(1)$ space.",
    "shortSummary": "XOR all → `x = p^q`. Pick any set bit of `x`; partition the array by that bit; XOR each partition to recover $p$ and $q$ separately.",
    "detailedAnswer": "Because $p\\neq q$, $x\\neq 0$ has a distinguishing bit $b$.  \n  For each element, bucket by whether bit $b$ is set. Duplicates land in the same bucket and cancel; $p$ and $q$ fall into different buckets.\n\n  Hardware map: two parallel XOR trees steered by bit $b$ from a first-pass XOR (needs two passes or stored stream).",
    "commonPitfalls": [
      "Trying to divide `x` arithmetically.",
      "Picking bit 0 always — fails when $p^q$ has bit0 clear (still OK if you pick **a** set bit of `x`)."
    ],
    "interviewerFollowups": [
      "Three uniques — what’s the lower bound?",
      "Same problem modulo sorting / bloom filters under memory caps."
    ],
    "tags": [
      "xor-partition",
      "streaming",
      "bit-twiddling"
    ]
  },
  {
    "id": "puz-24",
    "company": "texas-instruments",
    "companyName": "Texas Instruments",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Medium",
    "round": "Hiring Manager Round",
    "question": "Design a 4-way traffic light controller FSM: G→Y→R with pedestrian walk request, guaranteeing no green-green conflict and bounded wait for walk. What hazard exists if outputs are combo-decoded from state?",
    "shortSummary": "Use registered outputs (Moore) with explicit all-red clearance states; walk request sticky flag; max timers. Mealy combo outputs can glitch → brief green-green hazard on state transitions.",
    "detailedAnswer": "States include `NS_G, NS_Y, ALL_RED1, EW_G, EW_Y, ALL_RED2, WALK`.  \n  Mutual exclusion via one-hot state + registered lamp outputs. Pedestrian `WALK_REQ` is sticky until serviced. Deadlock avoidance: free-run timers always advance; walk has priority after next all-red.\n\n  **Hazard:** if lamps = combo function of state bits during one-hot transition (brief multi-hot from skew), two greens can glitch high. Fix: registered outputs or Gray/safe encoding with synchronized enables.",
    "commonPitfalls": [
      "No all-red interval (intersection conflict under slow cars).",
      "Combo lamp decode without glitch analysis."
    ],
    "interviewerFollowups": [
      "How to formally prove exclusion with assertions?",
      "Degraded night-flash mode."
    ],
    "tags": [
      "fsm",
      "safety",
      "registered-outputs",
      "traffic-light"
    ]
  },
  {
    "id": "puz-25",
    "companyName": "CPU / allocator HW",
    "domain": "logical-reasoning-puzzles",
    "domainName": "Logical Reasoning & Hardware Puzzles",
    "role": "Hardware Logic & Architecture Candidate",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "In allocator / free-list hardware, you often need (a) isolate lowest free way, (b) clear it, (c) test if exactly one bit remains. Give a gate-efficient bit toolkit combining `x & -x`, `x & (x-1)`, and discuss two’s complement assumption.",
    "shortSummary": "`lowest = x & -x` isolates LSB set; `x & (x-1)` clears it; both zero-checks classify empty / singleton / multi. Requires reliable two’s complement negation (`-x = ~x+1`).",
    "detailedAnswer": "Toolkit:\n  | Expression | Meaning |\n  |---|---|\n  | `x & -x` | lowest set bit one-hot |\n  | `x & (x-1)` | clear lowest set bit |\n  | `x ^ (x-1)` | mask through lowest set bit |\n  | `x \\| (x-1)` | smear right through lowest set |\n\n  Free-list pop: `grant_oh = req & -req; req_next = req & ~grant_oh`.  \n  Exact one-hot check: `x && !(x & (x-1))`.\n\n  Synthesis: modern tools map `-x` to efficient increment/invert; still document signedness. In formal, prove `popcount(grant_oh)==1` when `req!=0`.",
    "commonPitfalls": [
      "Using unsigned negation incorrectly in narrow widths.",
      "Forgetting `req==0` valid=0 path."
    ],
    "interviewerFollowups": [
      "Find **highest** set bit without `clz` cell.",
      "Parallel prefix “priority mask” for multi-grant."
    ],
    "tags": [
      "bit-toolkit",
      "allocator",
      "two’s-complement",
      "one-hot"
    ]
  },
  {
    "id": "upf-18",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "What is a Power State Table (PST)? Give an example of an **illegal** simultaneous supply state that silicon must never enter, how `add_pst_state` / `add_power_state` encode legality, and how CLP / power-aware simulation uses the PST to flag protocol bugs that logic simulation alone will miss.",
    "shortSummary": "A PST enumerates allowed combinations of supply net/port states (voltage or OFF). Illegal example: a domain ON while its isolation control still clamps, or a downstream AO domain OFF while an upstream switchable domain drives it. Verification tools flag transitions and static combinations outside the PST — your PMU RTL can be “logically fine” yet power-illegal.",
    "detailedAnswer": "### PST role\n  Supplies: `{ VDD_AO, VDD_CORE, VDD_MEM, VSS }`  \n  Legal states might be:\n\n  | Name | VDD_AO | VDD_CORE | VDD_MEM |\n  | :--- | :--- | :--- | :--- |\n  | RUN | 0.8 | 0.8 | 0.8 |\n  | MEM_RET | 0.8 | OFF | 0.6 |\n  | DEEP_SLP | 0.8 | OFF | OFF |\n\n  Anything else (e.g. `VDD_CORE=0.8` while `VDD_AO=OFF`) is **illegal** — AO logic couldn’t control switches/isolation.\n\n  ### Classic illegal classes\n  1. **Control supply OFF, controlled supply ON** — can’t sequence\n  2. **Driver ON, receiver OFF without isolation armed**\n  3. **Level-shifter rails biased in an unsupported combo** (HV rail down, LV active)\n  4. **Retention rail OFF while retention asserted**\n\n  ### UPF sketch\n  ```tcl\n  create_pst chip_pst -supplies {VDD_AO VDD_CORE VDD_MEM}\n  add_pst_state RUN     -pst chip_pst -state {0.80 0.80 0.80}\n  add_pst_state MEM_RET -pst chip_pst -state {0.80 OFF  0.60}\n  add_pst_state DEEP    -pst chip_pst -state {0.80 OFF  OFF }\n  # Unlisted combinations are illegal by omission\n  ```\n\n  ### Why staff care\n  PST is the contract between architects, PMU designers, and implementation. Missing states cause tools to over-constrain; extra accidental states allow silicon gunshots (crowbar, latch-up, flash corruption).",
    "commonPitfalls": [
      "Encoding voltages as strings inconsistently (`0.8` vs `0.80` vs `ON`) across tools.",
      "PST at top only — hierarchical blocks with local supplies need aligned states."
    ],
    "interviewerFollowups": [
      "How do `create_power_state_group` / IEEE 1801-2015 power states relate to classic PST?",
      "Can two PSTs exist for test vs functional modes?"
    ],
    "tags": [
      "pst",
      "illegal-state",
      "pmu",
      "clp",
      "power-aware-sim",
      "ieee-1801"
    ]
  },
  {
    "id": "upf-19",
    "company": "texas-instruments",
    "companyName": "Texas Instruments",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Contrast **balloon / shadow-latch retention flops**, **live-slave retention**, and **save/restore scan-like retention** methodologies. How do Synopsys (`set_retention` / UPFf save-restore controls) and Cadence Genus/Innovus retention flows typically differ in control-pin conventions (`save`/`restore` vs `ret_n`), and what STA/UPF checks must still be common across vendors?",
    "shortSummary": "Shadow-latch SRPG keeps state on an always-on balloon latch while the main master powers down — usually a single retention sense pin. Save/restore protocols pulse explicit save then power-down, restore on power-up (two-phase). Vendor UPF flavors differ in default pin names and inference, but all require: retention rail always on during sleep, correct isolation/sequencing, and no X-corruption on restore. Don’t memorize GUI clicks — memorize electrical contracts.",
    "detailedAnswer": "### Architectural options\n\n  | Style | Mechanism | Control | Area/Power |\n  | :--- | :--- | :--- | :--- |\n  | Shadow/balloon SRPG | AO latch mirrors data | Often active-low `RET` | Cell larger; fast wake |\n  | Live-slave | Slave portion AO | Similar | Library-specific |\n  | Save/restore | Checkpoint to AO memory / scan | `save`, `restore` pulses | Flexible; longer latency |\n\n  ### Vendor practical differences (interview-safe framing)\n  - **Synopsys-oriented** flows often emphasize UPF retention with `set_retention` + `set_retention_control` and Liberty retention attributes; save/restore protocols appear in UPF 2.x extensively.\n  - **Cadence-oriented** flows consume the same IEEE 1801 intent in Genus (`read/apply/commit_power_intent`) but library retention pin naming (`RET`, `NRET`, `SAVE`, `RESTORE`) and PLC checks are Cadence-reported.\n  - Both require matching **Liberty** `retention_cell` / power-gating attributes — UPF alone won’t invent silicon.\n\n  ### Common electrical contract (must say this)\n  1. Retention supply present in sleep PST state\n  2. Assert retention **before** primary rail collapse\n  3. Release retention **after** rails stable and isolation sequenced\n  4. Clock stable / gated per library diagram during save/restore windows\n  5. STA: retention control pins timed (not casually false-pathed)\n\n  ### Pitfall across vendors\n  Mixing a save/restore UPF strategy with a library that only implements balloon SRPG (or vice versa) → commit_power_intent / MLP check failures or silent wrong cells.",
    "tclOrVerilogSnippet": {
      "lang": "tcl",
      "code": "set_retention ret_core -domain PD_CORE -retention_power_net VDD_AO \\\n    -retention_ground_net VSS\n  set_retention_control ret_core -domain PD_CORE \\\n    -save_signal    {save_core high} \\\n    -restore_signal {restore_core high}\n  # Balloon-style libraries may use -retention_signal {ret_n low} instead"
    },
    "commonPitfalls": [
      "Powering retention rail from the gated primary net.",
      "Assuming Genus will infer retention without `set_db` library enables / correct `.lib` attrs."
    ],
    "interviewerFollowups": [
      "Partial retention (only some regs) — how do you list elements vs use UPF strategies?",
      "DFT: how does retention interact with scan shift in sleep-capable modes?"
    ],
    "tags": [
      "retention",
      "srpg",
      "save-restore",
      "balloon-latch",
      "genus",
      "synopsys",
      "liberty"
    ]
  },
  {
    "id": "upf-20",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How do you choose isolation **clamp value** (`0`, `1`, `latch`, hold) for each net leaving a switchable domain? Give examples where clamping to the wrong level causes enable-active stuck-on, reset storms, or bus contention, and explain why clamp value must match receiver polarity *and* power-on defaults.",
    "shortSummary": "Clamp to the **safe inactive** level of the receiving logic: active-high enables → clamp `0`; active-low resets → clamp `1` (keep deasserted) or carefully architect sync reset; bidirectional buses need contention-free clamps / isolation strategies. Wrong clamps are functional bugs invisible in ON-mode simulation.",
    "detailedAnswer": "### Decision tree\n  1. What does the receiver interpret as **active**?\n  2. What is the safe idle during driver power-down?\n  3. Is the net a clock, reset, enable, data, or bus?\n  4. Does AO logic require sticky last-value (`latch` isolation) for protocol continuity?\n\n  ### Examples\n  | Net | Safe clamp | Why |\n  | :--- | :--- | :--- |\n  | Active-high clock gate EN | `0` | Prevent accidental wake clocks |\n  | Active-low async reset | `1` | Keep deasserted while sleeping domain is off |\n  | Chip select to external | Inactive polarity | Avoid false transactions |\n  | Shared bus driver | Special ISO / buffered strategy | Avoid fighting AO drivers |\n\n  ### Latch isolation\n  Stores pre-power-down value — useful for configuration that must persist visibly, dangerous if that value was an armed enable.\n\n  ### Verification\n  Power-aware sim + CLP: when domain OFF, probe isolation outputs equal clamp. Formal power apps check “enable not stuck active.”",
    "commonPitfalls": [
      "Global `clamp_value 0` policy on all outputs — resets/active-low controls break.",
      "Clamping clocks to 1 accidentally feeding free-running toggles into AO."
    ],
    "interviewerFollowups": [
      "Isolation `location` self vs parent vs sibling — who owns the clamp cell electrically?",
      "Different clamps in DFT vs functional PST states?"
    ],
    "tags": [
      "isolation",
      "clamp-value",
      "enable-polarity",
      "reset",
      "power-gating"
    ]
  },
  {
    "id": "upf-21",
    "company": "arm",
    "companyName": "Arm",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Hard",
    "round": "Technical Phone Screen",
    "question": "In IEEE 1801, contrast **supply net**, **supply port**, and **supply set** (functions like `power`/`ground`/`nwell`). Why did supply sets appear, how do they simplify multi-rail cells (level shifters, isolation, retention), and what breaks if you only create nets but never update strategies to reference sets?",
    "shortSummary": "Supply nets are named electrical rails; ports are boundary connection points; supply sets bundle related functions (primary power, ground, well, retention) into one abstract object for strategies. Sets reduce errors when a cell needs multiple rails — strategies bind to sets instead of scattering net names. Modern UPF styles prefer sets; legacy net-only UPF still exists but maps poorly to complex libraries.",
    "detailedAnswer": "### Objects\n  - `create_supply_net VDD_CORE` — logical rail\n  - `create_supply_port` + `connect_supply_net` — hierarchical interface\n  - `create_supply_set ss_core -function {power VDD_CORE} -function {ground VSS}` — typed bundle\n\n  ### Why sets matter\n  A level shifter may need `vin`, `vout`, `ground` functions. Binding `set_level_shifter ... -input_supply_set ss_a -output_supply_set ss_b` is clearer and less error-prone than remembering six net flags.\n\n  ### Migration hazard\n  Mixed UPF: some strategies use `-isolation_power_net`, others use supply sets inconsistently → tools accept file but MLP insertion picks wrong rail (classic AO isolation powered from gated net bug returns in a new costume).\n\n  ### Staff practice\n  Pick one style per project (preferably supply sets for new 1801.2015+), document wrappers for IP deliveries still in net style.",
    "tclOrVerilogSnippet": {
      "lang": "tcl",
      "code": "create_supply_net VDD_AO\n  create_supply_net VDD_CORE\n  create_supply_net VSS\n  create_supply_set ss_ao   -function {power VDD_AO}   -function {ground VSS}\n  create_supply_set ss_core -function {power VDD_CORE} -function {ground VSS}\n  set_domain_supply_net PD_CORE -primary_power_net VDD_CORE -primary_ground_net VSS\n  # or associate supply sets with domains per 1801 style used by the project"
    },
    "commonPitfalls": [
      "Creating supply sets but leaving `set_domain_supply_net` pointing at stale nets.",
      "Forgetting well/bulk functions on advanced nodes."
    ],
    "interviewerFollowups": [
      "How do supply sets appear in PST / power states models?",
      "Supply set handles vs hierarchical `connect_supply_set`?"
    ],
    "tags": [
      "supply-set",
      "supply-net",
      "supply-port",
      "ieee-1801",
      "multi-rail"
    ]
  },
  {
    "id": "upf-22",
    "company": "amd",
    "companyName": "AMD",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What is the difference between a **hard** power domain boundary and a **soft** (or extent-based / same-voltage logical) domain practice in implementation? When do you require physical contiguous voltage areas with switch arrays versus logical UPF domains that share a rail? How does this choice affect level shifters, floorplan, and UPF element lists?",
    "shortSummary": "Hard domains map to physically contiguous voltage islands with explicit switch/ISO/LS at the geometric boundary. Soft/logical domains may group hierarchy for intent or analysis while still sharing the same physical rail — useful for accounting or partial retention, dangerous if engineers assume physical shutdown that silicon can’t do. Implementation must match the **electrical** truth, not only the UPF name.",
    "detailedAnswer": "### Hard domain\n  - Unique primary supply (possibly switched)\n  - Physical region(s) in floorplan\n  - Boundary cells: switches, ISO, LS, AO buffers\n  - PST states include OFF\n\n  ### Soft / logical partitioning\n  - May share `VDD_CORE` with siblings\n  - Used for: retention subgroups, power reporting buckets, clock-gate regions mislabeled as “domains”\n  - **No** true rail collapse unless separate supply exists\n\n  ### Interview landmine\n  Architect says “power-gate the USB block” but UPF only `create_power_domain` on hierarchy without `create_power_switch` / gated net → synthesis won’t insert switches; silicon never gates.\n\n  ### Floorplan link\n  Hard domains need contiguous placement + switch daisy/parallel planning; fragmenting a hard domain into 20 sprinkles of cells explodes AO buffer/ISO count and IR.",
    "commonPitfalls": [
      "Nested domains without clear primary supply inheritance.",
      "Reusing one gated net name for two hard islands that must shut down independently."
    ],
    "interviewerFollowups": [
      "How do you UPF a hard macro with internal power domains?",
      "Multi-bit always-on vs switchable mix inside one Verilog module — element lists vs HDL change?"
    ],
    "tags": [
      "hard-domain",
      "soft-domain",
      "voltage-island",
      "floorplan",
      "power-switch"
    ]
  },
  {
    "id": "upf-23",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Beyond basic low-to-high and high-to-low, explain **enable level shifters**, **isolation+LS combined cells**, **bidirectional / bus LS**, and **strategy location** (`self`/`parent`/`fanout`). How do you pick `-rule` / `-elements` strategies when two domains have complex crossing graphs, and what STA complex arises when LS cells introduce large asymmetric delays?",
    "shortSummary": "LS strategy must cover every voltage crossing net with the correct cell type for direction and whether the driver can be OFF (needs ISO or enable-LS). Location decides which domain physically owns the cell (rail availability). Combined ISO+LS saves area on power-gated MV boundaries. STA must path-group LS-heavy crossings — a single wrong location leaves a thin-oxide gate driven by an illegal voltage.",
    "detailedAnswer": "### Cell classes\n  | Type | Use |\n  | :--- | :--- |\n  | LH / L2H | Low driver → high receiver |\n  | HL / H2L | High → low (protect low oxide / fix VIH) |\n  | Enable LS | Pass when enabled; safe when driver domain down |\n  | ISO+LS | Clamp + shift in one cell |\n  | Bidirectional | Careful pad/bus cases |\n\n  ### Location semantics\n  - **self**: inside the domain owning the strategy (driver domain often)\n  - **parent**: in parent hierarchical extent\n  - **fanout**: at receivers\n  Choose so the cell’s **required rails exist** when either side is OFF — same fatal class as ISO powered from gated rail.\n\n  ### Strategy authorship\n  Prefer default domain strategies + explicit exceptions for special nets (analog, retention controls, clocks). Clock crossings may need AO buffers + LS with MPW budgets.\n\n  ### STA impact\n  LS delays can be hundreds of ps and highly voltage-dependent — put MV crossings in dedicated path groups; never bury them only in R2R noise.",
    "commonPitfalls": [
      "Inserting H2L buffers that are electrically just thin gates (not true shifters).",
      "Forgetting LS on clock and reset crossings while fixing only data buses."
    ],
    "interviewerFollowups": [
      "How do you verify completeness: every crossing has ISO/LS as required?",
      "Multi-voltage SDC: set_voltage / related supply in Liberty vs UPF?"
    ],
    "tags": [
      "level-shifter",
      "enable-ls",
      "iso-ls",
      "location",
      "multi-voltage",
      "sta"
    ]
  },
  {
    "id": "upf-24",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Compare **daisy-chained** power-switch enable chains vs **parallel** (globally buffered) switch arrays for a large power-gated island. Discuss inrush current, wake latency, IR drop during ramp, and UPF `create_power_switch` abstraction versus physical array implementation in PnR.",
    "shortSummary": "Parallel switches turning on together minimize wake latency but maximize inrush/`L·di/dt` and supply droop. Daisy/chain or staged enables soften inrush at the cost of longer wake and asymmetric IR during ramp. UPF usually models one logical switch; physical design instantiates thousands of header/footer cells with staged enable routing — the abstraction gap is a classic staff topic.",
    "detailedAnswer": "### Parallel\n  - Pros: fast wake, uniform rail rise if sized well\n  - Cons: huge inrush, package bounce, AO rail dip killing neighbors\n\n  ### Daisy / staged\n  - Enable ripples through buffer chain or weighted stages (10% → 30% → 100%)\n  - Pros: controlled inrush, friendlier PDN\n  - Cons: longer wake; must still meet software latency; partial-on IR can stress cells if logic unlocks early\n\n  ### UPF vs physical\n  ```tcl\n  create_power_switch sw_core -domain PD_CORE \\\n    -input_supply_port {vin VDD_AO} \\\n    -output_supply_port {vout VDD_CORE} \\\n    -control_port {ssctrl pwr_en} \\\n    -on_state {on_state vin {ssctrl}} \\\n    -off_state {off_state {~ssctrl}}\n  ```\n  PnR maps this to a **switch cell array** + enable tree. Acknowledgement (`ack`) signals often added for software/PMU — may be UPF `ack_port` or design RTL.\n\n  ### Staff closure criteria\n  - Inrush within PDN budget (simulation)\n  - No data release until `ack` / timed delay\n  - Isolation remains asserted through ramp\n  - Switch cell EM under repeated cycling (mobile SoCs)",
    "commonPitfalls": [
      "Enabling logic clocks before rail reaches `Vmin` characterization voltage.",
      "Putting switch enables on the gated domain (can’t turn itself back on)."
    ],
    "interviewerFollowups": [
      "Header vs footer switches — leakage and body-bias interactions?",
      "How do you test power switches in production (DFT)?"
    ],
    "tags": [
      "power-switch",
      "daisy-chain",
      "inrush",
      "ir-drop",
      "ack",
      "pnr-array"
    ]
  },
  {
    "id": "upf-25",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "low-power-upf",
    "domainName": "Low Power UPF & Multi-Voltage",
    "role": "Low-Power Methodology & UPF Architect",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "List the top industrial mismatches between **power-aware RTL simulation**, **synthesis power intent commit**, and **physical UPF implementation**. How do you build a signoff checklist so that “sim passed UPF” doesn’t still tape out with missing isolation or wrong clamp rails?",
    "shortSummary": "Simulation may use behavioral isolation/supply models; synthesis inserts real cells from Liberty; PnR places them on real rails and may legally move/optimize. Mismatches: element list coverage, strategy location, library mapping, PST not imported equally, and ECO netlists dropping LP cells. Signoff requires the same UPF binary contract plus structural LP checks (CLP/MVRC), Conformal LP, and gate-level power-aware sim on the **final** netlist.",
    "detailedAnswer": "### Mismatch catalog\n  | Area | Sim | Synth | PnR |\n  | :--- | :--- | :--- | :--- |\n  | ISO insertion | Behavioral force/clamp | Real ISO cells | Moved to boundary legal sites |\n  | Supplies | Abstract ON/OFF | Supply nets connected | PG routing / vias real |\n  | Retention | Model state keep | Mapped SRPG cells | Replacement / spare ECO risk |\n  | PST | Testbench sequences | Optimization modes | Same file? or stale copy |\n  | Hierarchy | HDL paths | Uniquify/ungroup renames | ILM/abstract loss |\n\n  ### High-risk bugs\n  1. Sim UPF path lists outdated after RTL rename → silent missing ISO\n  2. Synth commits intent; late `ungroup` dissolves domain elements\n  3. PnR power-route connects ISO `VDD` pin to gated follow-pin (DRC-clean, electrically wrong)\n  4. Different UPF versions in DV vs implementation repos\n\n  ### Signoff checklist (staff answer)\n  1. Single golden UPF revision in config management\n  2. `check_power_intent` / MLP reports **zero** unexpected opens after commit\n  3. Structural LP static checks on synth and post-route netlists\n  4. Power-aware GLS on post-route with SDF + UPF\n  5. PG connectivity LVS / soft-check: ISO/LS/retention rails\n  6. ECO policy: LP cells `dont_touch`; re-run LP checks after every metal ECO\n  7. PST scenarios covered in both PMU DV and PA-sim regressions",
    "commonPitfalls": [
      "Trusting RTL PA-sim as sufficient for tapeout LP signoff.",
      "Maintaining “DV UPF” and “impl UPF” as divergent forks."
    ],
    "interviewerFollowups": [
      "How do you handle hard-IP vendor UPF that disagrees with SoC top PST?",
      "What LP regressions gate a functional ECO late in the schedule?"
    ],
    "tags": [
      "upf-mismatch",
      "power-aware-sim",
      "clp",
      "conformal-lp",
      "signoff",
      "eco"
    ]
  },
  {
    "id": "pd-14",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "You inherit a floorplan where two tall SRAM stacks leave a 15 µm “channel” of standard-cell rows between them. Congestion is red after global route, and timing through the channel is failing. How do you decide among widening the channel, punching feedthrough blockages, adding soft routing blockages, or moving macros — and what is the difference between **placement** blockage and **routing** blockage in that channel?",
    "shortSummary": "Channels are scarce horizontal/vertical conduits for both cells and wires. Placement blockages stop std-cell packing (preserve white space for routes or buffers); routing blockages stop metal use (or specific layers). Soft blockages discourage but allow overflow; hard blockages are absolute. Fix root cause: macro spacing vs pin faces, layer budget, and buffer sites — don’t only inflate utilization targets.",
    "detailedAnswer": "### Why channels form\n  Abutted or narrowly spaced macros create corridors where:\n  - All east-west nets between left/right logic must pass\n  - Clock and power straps may also claim tracks\n  - Buffer/inverter sites for long nets compete with random logic\n\n  ### Blockage taxonomy (channel toolkit)\n\n  | Type | Effect | Typical use in channel |\n  | :--- | :--- | :--- |\n  | Hard placement blockage | No std cells | Reserve pure routing conduit |\n  | Soft placement blockage | Cells only if needed | Prefer keep-out, allow buffer insert |\n  | Partial / density screen | Cap local utilization | Prevent packing solid walls of cells |\n  | Hard routing blockage | No routes on listed layers | Protect analog / keep-out |\n  | Soft routing blockage | Cost penalty | Detour non-critical nets |\n\n  ### Decision ladder\n  1. **Pin orientation**: Are SRAM data pins facing the channel? Rotate/flip macros before touching cell density.\n  2. **Channel width vs metal pitch**: Estimate tracks needed ≈ net count × via/pin tax; compare to available tracks on preferred layers.\n  3. If tracks insufficient → **widen channel** or **split macros** with a second conduit.\n  4. If tracks OK but cells stuffed the channel → **soft/hard placement blockage** + explicit buffer box.\n  5. Only then consider route guides / layer promotion for critical buses.\n\n  ### Staff insight\n  A “15 µm channel” that looks fine at floorplan review can be dead after power straps + M2 must-join + clock spine steal 40% of tracks. Always overlay PDN + CTS plan on channel cross-sections.",
    "commonPitfalls": [
      "Hard-routing-blocking the only escape layer “to force upper metal” without leaving vias.",
      "Fixing congestion with `set_congestion_options` alone while macros still kiss."
    ],
    "interviewerFollowups": [
      "How do halo vs keep-out margin differ from channel placement blockage?",
      "When do you allow std-cell feedthroughs *under* macro overhang vs forbid them?"
    ],
    "tags": [
      "floorplan",
      "channel",
      "blockage",
      "macro-spacing",
      "congestion"
    ]
  },
  {
    "id": "pd-15",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "When is **macro abutment** (zero gap) acceptable versus mandatory halo/keep-out? Explain pin accessibility failures that abutment creates, how abutment interacts with well/tap and PODE rules at advanced nodes, and your checklist before approving a sea-of-SRAM floorplan.",
    "shortSummary": "Abutment saves area when facing sides have no pins / legal abutment rules in LEF and foundry deck. It is fatal when signal pins, soft-macro straps, or tap requirements need edge access. Halos reserve placement/routing margin for buffers and pin escape. Approve abutment only with LEF edge types, pin-side audits, and PDN continuity plans.",
    "detailedAnswer": "### Abutment OK when\n  - Facing edges are abutment-legal in abstract (usually power ring / no signal pins)\n  - Foundry allows touching implants / continuous nwell as per deck\n  - Escape routing for all ports still exists on open sides\n  - MBIST / repair ports aren’t trapped inward\n\n  ### Abutment not OK when\n  - Data/address/control pins face each other → zero escape tracks\n  - Need buffer sites for timing on macro-to-macro nets\n  - Power mesh needs stitch columns between macros\n  - Antenna diode / spare cell columns planned at edges\n\n  ### Halo vs blockage\n  - **Halo**: typically moves with macro; keeps std cells away from macro boundary\n  - Sized by max buffer depth you expect near pins + DRC margin\n  - Too large → artificial congestion elsewhere; too small → pin DRC and timing\n\n  ### Sea-of-SRAM checklist\n  1. Pin-side map (color-coded) before placement freeze\n  2. Channel width math per bus\n  3. Power strap alignment across abutments\n  4. Tap / endcap / boundary cell insertion plan\n  5. Test access (MBIST) and physical-only cells",
    "commonPitfalls": [
      "Abutting because “utilization looked better” in a spreadsheet.",
      "Forgetting that flipped macros reverse pin faces relative to channels."
    ],
    "interviewerFollowups": [
      "How do soft macros (hierarchical blocks) change halo strategy vs hard SRAM?",
      "Via-ladder access on buried pin layers?"
    ],
    "tags": [
      "macro-abutment",
      "halo",
      "keep-out",
      "pin-accessibility",
      "sram-floorplan"
    ]
  },
  {
    "id": "pd-16",
    "company": "broadcom",
    "companyName": "Broadcom",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Give a field guide to blockage and region types used in Innovus-class tools: hard/soft placement blockages, partial placement blockages, routing blockages (layer-aware), screen/density screens, exclusive soft vs hard fences/regions, and **buffer-only** / **macro-only** areas. For each, one sentence on when you create it during the flow.",
    "shortSummary": "Placement controls *what cells* may sit somewhere; routing controls *which metals* may cross; regions/fences bind *which hierarchy* may sit somewhere. Use the lightest restriction that encodes intent — overusing hard blockages is how floorplans become unroutable or unoptimizable.",
    "detailedAnswer": "| Construct | Intent | When to create |\n  | :--- | :--- | :--- |\n  | Hard placement blockage | Absolutely no std cells | Analog keep-out, reserved routes, macro channels |\n  | Soft placement blockage | Avoid cells unless optimizer needs | Preferential routing space near buses |\n  | Partial placement blockage | Cap local density (e.g. 60%) | Hotspot smoothing pre-CTS |\n  | Routing blockage (per layer) | Forbid metal | Mask shielded IP, ESD keep-outs |\n  | Soft routing blockage | Expensive detour | Guide non-critical away from critical corridor |\n  | Fence (hard) | Instances *must* stay inside | Hard partition physical boundary |\n  | Region (soft) | Prefer inside | Gentle hierarchy clustering |\n  | Buffer-only blockage/area | Only buffers/inverters | Long-net repeater corridors |\n  | Macro keep-out / halo | No std cells near macro | Pin escape + DRC |\n\n  ### Staff heuristic\n  Encode **design intent**, not yesterday’s congestion screenshot. Blockages that immortalize a bad floorplan make every ECO worse.",
    "commonPitfalls": [
      "Hard fencing a block smaller than its legal cell area + PDN.",
      "Layer-all routing blockage left over from an old IP revision."
    ],
    "interviewerFollowups": [
      "Difference between `create_place_blockage` and density screens in your tool?",
      "How do blockages interact with useful-skew buffer insertion?"
    ],
    "tags": [
      "blockages",
      "fences",
      "regions",
      "density-screen",
      "buffer-box"
    ]
  },
  {
    "id": "pd-17",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Define **useful skew**. Show with equations how delaying the capture clock (or advancing launch) can heal setup without a data-path ECO, what happens to hold, and how you *safely* enable useful skew in CTS (path groups, skew groups, bounds) without creating a hold disaster at min corner.",
    "shortSummary": "Useful skew deliberately imbalances clock arrivals to transfer slack from paths that have margin to paths that don’t. Setup: extra capture latency helps; extra launch latency hurts. Hold moves in the opposite direction — every ps of setup-friendly skew must be budgeted against hold and MPW. Safe flows use bounded skew groups on critical endpoints with multi-corner CTS optimization.",
    "detailedAnswer": "### Equations (edge-triggered)\n  $$\n  S_{\\text{setup}} = T + T_{C,\\text{capture}} - T_{C,\\text{launch}} - T_{\\text{cq}} - T_{\\text{logic}} - T_{\\text{su}}\n  $$\n  $$\n  S_{\\text{hold}} = T_{\\text{cq,min}} + T_{\\text{logic,min}} - T_{\\text{hold}} - (T_{C,\\text{capture}} - T_{C,\\text{launch}})\n  $$\n\n  Increasing $(T_{C,\\text{capture}} - T_{C,\\text{launch}})$ **helps setup, hurts hold**.\n\n  ### CTS implementation patterns\n  1. **Automatic useful skew**: CTS/CCOpt schedules sinks within `max_skew` / latency budgets targeting WNS\n  2. **Manual skew groups**: critical capture flops allowed extra latency bound\n  3. **Interactive**: `set_interactive_constraint` latency adjust → legalize with local clock ECO\n\n  ### Safety checklist\n  - Optimize useful skew with **setup and hold views active** (MMMC)\n  - Exclude async / hard-macro clocks with zero flexibility\n  - Re-check SI on clock nets (skewed spines can become aggressors)\n  - Re-check CRPR pairs — divergence points move when trees reshape\n  - Cap per-sink delta (e.g. ±50–100 ps) unless architecture planned for more\n\n  ### When *not* to use it\n  Data path is slew/DRV limited — skew won’t fix Liberty derating from horrible transitions. Fix DRV first.",
    "tclOrVerilogSnippet": {
      "lang": "tcl",
      "code": "# Conceptual CCOpt / CTS useful skew enable (tool names vary):\n  set_ccopt_property enable_useful_skew true\n  set_ccopt_property useful_skew_max_sink_delay_offset 0.08\n  ccopt_design"
    },
    "commonPitfalls": [
      "Running useful skew in max-only CTS then discovering min-corner hold explosions post-route.",
      "Skewing scan flops differently in functional vs shift without mode-aware CTS."
    ],
    "interviewerFollowups": [
      "Useful skew vs datapath retiming — who owns which lever?",
      "How does useful skew interact with latch time borrow?"
    ],
    "tags": [
      "useful-skew",
      "cts",
      "ccopt",
      "setup-hold-tradeoff",
      "skew-group"
    ]
  },
  {
    "id": "pd-18",
    "company": "intel",
    "companyName": "Intel",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What is an NDR? Why do clock nets commonly get double-width double-spacing rules, and when do you apply NDRs to data buses instead of blindly upsizing cells? Discuss via rules, shielding NDRs, and the congestion cost of over-NDRing.",
    "shortSummary": "NDRs are per-net (or net-class) departures from default LEF routing rules — wider wires, larger spacing, mandatory shielding, specific via cuts. Clocks use them for RC matching, EM, and SI immunity. Critical data NDRs help when SI delta dominates; overuse starves tracks and creates worse congestion-driven detours than the problem you fixed.",
    "detailedAnswer": "### Typical clock NDR package\n  - 2× width / 2× spacing on intermediate clock metals\n  - Non-default via arrays (multi-cut) for reliability\n  - Optional parallel shield rails tied to VSS/VDD\n  - Applied via net class: `CLOCK`, `CTS_LEAF`, etc.\n\n  ### Data NDRs — when justified\n  - Long bus with measured SI delta ≫ cell delay\n  - Analog-adjacent digital control\n  - High-current nets (EM), not just timing\n\n  ### Cost model\n  Each 2× spaced net consumes ~2–3× track resources. If 5% of nets get clock-class NDRs “just in case,” global route density can tip into irreparable overflow.\n\n  ### Staff practice\n  Start CTS with foundry-recommended clock NDRs only; add data NDRs from SI hotspot reports, not from fear. Re-run congestion after each NDR class expansion.",
    "commonPitfalls": [
      "NDR on leaf clusters where short locals don’t need it (wastes pin access).",
      "Shielding without PDN attachment → floating shields = coupling plates."
    ],
    "interviewerFollowups": [
      "Layer-specific NDRs (M3 only) vs all-layer — tradeoffs?",
      "How do NDRs interact with double patterning coloring?"
    ],
    "tags": [
      "ndr",
      "clock-routing",
      "shielding",
      "si",
      "em",
      "congestion"
    ]
  },
  {
    "id": "pd-19",
    "company": "mediatek",
    "companyName": "MediaTek",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Hard",
    "round": "Technical Phone Screen",
    "question": "Explain plasma **antenna** damage during BEOL processing. Define antenna ratio, why long metal connected to a gate before a diffusion jumper is dangerous, and contrast fixing via **antenna diodes**, **layer hopping / bridging**, and **jumper vias** to diffusion. When can diode insertion hurt timing/leakage?",
    "shortSummary": "During metal etch, floating wires collect charge; if connected only to thin-oxide gates, voltage can rupture the gate. Antenna ratio ≈ drawn metal area (or perimeter, recipe-dependent) / gate area. Fixes: break metal with upper-layer jumpers, connect early to diffusion (diode), or insert explicit antenna diode cells. Diodes add capacitance and leakage and can violate strict analog keep-outs.",
    "detailedAnswer": "### Process mechanism\n  Gate poly/fin oxides see antenna risk when a large metal island is tied to gate while diffusion hasn’t yet been connected in the process sequence (process-step dependent rules in the deck).\n\n  ### Ratio\n  $$\n  R_{\\text{ant}} = \\frac{A_{\\text{metal (or perimeter)}}}{A_{\\text{gate}}}\n  $$\n  Foundry sets max $R_{\\text{ant}}$ per layer; hierarchical check includes cumulative rules.\n\n  ### Fix preference order\n  1. **Router antenna avoidance** — hop to higher metal earlier (jumper)\n  2. **Incremental route ECO** on violators\n  3. **Diode insertion** near gate pins (`ANTENNA` cells)\n  4. Manual layout edit on stubborn IP pins\n\n  ### Timing / leakage impact\n  Diode on a critical input adds $C_{\\text{pin}}$ → slower slew → setup risk; off-state leakage matters in UPF retention islands. Prefer jumpers on timing-critical clocks when legal.",
    "commonPitfalls": [
      "Fixing antenna after filler/metal-fill freeze without re-checking density.",
      "Putting diodes inside power-gated domains that collapse — diode reference must be valid."
    ],
    "interviewerFollowups": [
      "Partial antenna rules with layered accumulation — how do you debug a multi-layer fail?",
      "Clock net diode vs NDR jumper preference?"
    ],
    "tags": [
      "antenna",
      "diode",
      "jumper",
      "beol",
      "dirc",
      "reliability"
    ]
  },
  {
    "id": "pd-20",
    "company": "intel",
    "companyName": "Intel",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "At nodes using LELE or SADP, what does **coloring** mean for the router, and how can a legally spaced layout still be unmanufacturable due to odd-cycle coloring conflicts? How should a PD lead think about same-color spacing, stitch risk, and ECO rip-up at color-aware signoff?",
    "shortSummary": "Multi-patterning assigns shapes to mask “colors.” Minimum spacing applies within a color; opposite colors may be closer per deck. Odd cycles in the conflict graph cannot be 2-colored → mandating layout change, not just DRC whitespace. ECOs that ignore color create late mask conflicts; always run color-aware DRC/LVS decks before tapeout milestones.",
    "detailedAnswer": "### Conflict graph intuition\n  Nodes = polygons on a DP layer; edges = “too close to be same mask.” 2-colorable ⇒ legal decomposition. Odd cycle ⇒ impossible without moving geometry or cutting with stitches (technology dependent).\n\n  ### Router implications\n  - Color-aware routing avoids creating odd cycles\n  - May prefer preferred-direction tracks already pre-colored\n  - Via farms and wrong-way jogs are frequent conflict sources\n\n  ### ECO reality\n  A 3-net timing ECO that “only moved M2 by 1 track” can introduce a mask conflict far from the timing path. Staff leads gate late ECOs with **incremental color DRC**.\n\n  ### SADP vs LELE (interview depth)\n  - LELE: two litho/etch passes; overlay error matters between colors\n  - SADP: spacer-defined; mandrels/spacers constrain widths/gaps differently — “color” mental model still used in EDA but rules differ",
    "commonPitfalls": [
      "Assuming “DRC clean in non-color deck” equals manufacturable.",
      "Metal fill inserted without color awareness re-breaking a clean route."
    ],
    "interviewerFollowups": [
      "How do you debug an odd-cycle report from the foundry deck?",
      "Interaction of NDR wide wires with DP spacing tables?"
    ],
    "tags": [
      "double-patterning",
      "coloring",
      "lele",
      "sadp",
      "dirc",
      "eco"
    ]
  },
  {
    "id": "pd-21",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Differentiate **filler**, **endcap/boundary**, **tap/well-tie**, and **decap** cells. When in the flow is each inserted? How do you size decap budgets for dynamic IR without destroying routing density, and why is filler-not-decap a common tapeout miss?",
    "shortSummary": "Fillers legalize empty site gaps (implant continuity); endcaps terminate rows/macros legally; taps tie wells/substrates to rails; decaps intentionally add MOS capacitance for PDN. Insert legalization fillers late but plan decap early from IR analysis. Using only non-cap fillers leaves IR/EM fragile even when density DRC is clean.",
    "detailedAnswer": "### Roles\n  | Cell | Primary job |\n  | :--- | :--- |\n  | Filler | Fill SITE gaps, poly/implant continuity |\n  | Endcap / boundary | Row ends, macro adjacency rules |\n  | Tap / well pickup | Latch-up, well bias integrity |\n  | Decap | Explicit $C$ between VDD–VSS for transient IR |\n\n  ### Flow timing\n  - Taps: per foundry max distance — often during placement legalization\n  - Endcaps: with row setup / post-macro\n  - Decap: iterative with Voltus-class IR — **before** final route freeze if possible\n  - Filler: after ECO freeze / before metal fill; use **ECO-friendly** filler that can swap to decap/spare\n\n  ### Decap budgeting intuition\n  Local charge $\\Delta Q = C_{\\text{decap}}\\Delta V$ must support instantaneous current until package/grid responds. Hotspots need local decap *within a radius*; global average % is not enough.\n\n  ### Density tradeoff\n  Blind 10% decap can steal buffer sites and routing tracks. Target IR-driven maps: dense near clocking/ALU, sparse near lightly switching IO control.",
    "commonPitfalls": [
      "Filling with non-swappable fillers then needing decap → painful rip-up.",
      "Decap in power-gated domains without retention bias strategy."
    ],
    "interviewerFollowups": [
      "Always-on decap islands vs gated-domain decap?",
      "How do filler ECOs interact with spare cell planning?"
    ],
    "tags": [
      "filler",
      "decap",
      "endcap",
      "tap",
      "ir-drop",
      "legalization"
    ]
  },
  {
    "id": "pd-22",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "Design a **spare cell** methodology for a 5 nm consumer SoC expecting functional ECOs. What mix of cells, distribution pattern, tie-off strategy, and routing-resource reservation do you use? How do you prevent spares from being optimized away, and how do you measure “ECO reachability” before tapeout?",
    "shortSummary": "Distribute a mix of inverters, buffers (several drives), NAND/NOR, AOI/OAI, and a few flops/ICGs across the die on a grid sized to metal hop budgets. Tie inputs to constant rails with ECO-breakable ties; protect with `dont_touch` / size_ok attributes. Reserve neighbor tracks; pre-validate that timing-critical regions have spare density proportional to risk. Pure corner-of-die spare farms fail real ECOs.",
    "detailedAnswer": "### Mix (illustrative)\n  - 40% INV/BUF ladder (X1–X8)\n  - 25% NAND2/NOR2\n  - 15% complex (AOI22, MUX2)\n  - 10% flops (scan-capable) + 5% ICG\n  - 5% diode / specials as needed\n\n  ### Distribution\n  - Uniform grid + **boost** near timing-hot and late-churn RTL modules\n  - Avoid only channel leftovers — those sites vanish when congestion rises\n  - Keep spare flops’ clock pins on lightly loaded, contactable clock stubs or plan clock ECO rules\n\n  ### Tie-offs\n  Inputs tied via explicit TIE cells or high-resistance ties so metal ECO can rewire without fighting optimization constants. Outputs left unconnected or capped per DFT rules.\n\n  ### Freeze\n  ```tcl\n  set_db <spare_inst> .dont_touch true\n  # prevent syn_opt / optDesign from deleting undriven logic\n  ```\n\n  ### Reachability metric\n  Before tapeout: sample hypothetical ECO sites; run “can I connect spare within N µm on layers M2–M4 without crossing hard macros?” Fail regions → add spare clusters.",
    "commonPitfalls": [
      "Spare flops without scan / without clock → useless for functional ECO.",
      "Densities quoted as % area but all spares trapped under thick PDN with zero pin access."
    ],
    "interviewerFollowups": [
      "Metal-only ECO vs base-layer ECO — how does spare strategy change?",
      "UPF: spare cells’ power domain membership and isolation?"
    ],
    "tags": [
      "spare-cells",
      "eco",
      "dont-touch",
      "metal-eco",
      "tapeout-readiness"
    ]
  },
  {
    "id": "pd-23",
    "company": "broadcom",
    "companyName": "Broadcom",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Contrast **route guides**, **net priorities**, **layer constraints**, and **NDRs**. When does a route guide help critical bus timing, and when does it cause a global congestion cascade? Describe a safe workflow to introduce guides after a congestion map.",
    "shortSummary": "Route guides spatially bias where a net *may* prefer to travel; priorities decide who wins disputes; layer constraints bind metal ranges; NDRs change geometry. Guides help when they encode floorplan intent (bus along a channel). They hurt when they force many nets through an already red bottleneck. Add guides surgically on SI/timing victims after measuring maps — never spray guides on all failing nets.",
    "detailedAnswer": "### Failure mode\n  200 nets with “must route in this 10 µm corridor” guides ≡ soft hardwall → detours explode elsewhere → new timing fails → more guides → death spiral.\n\n  ### Safe workflow\n  1. Congestion map + layer-by-layer overflow\n  2. Identify **root** choke (macro channel / PDN / clock spine)\n  3. Fix floorplan/PDN/NDR scope first\n  4. Apply guides only to top SI aggressor/victim pairs or top hierarchical buses with known pin faces\n  5. Rebalance priorities: clocks > async resets > critical data > general\n  6. Remove obsolete guides each milestone\n\n  ### Rule of thumb\n  If >2–3% of nets carry guides, you likely have a floorplan problem, not a guide shortage.",
    "commonPitfalls": [
      "Guides created from an old floorplan revision left enabled.",
      "Priority-999 on thousands of nets (everyone is VIP ⇒ no one is)."
    ],
    "interviewerFollowups": [
      "Early global route guides vs detail-route preferred layers?",
      "How do route guides interact with clock NDRs?"
    ],
    "tags": [
      "route-guide",
      "net-priority",
      "layer-constraint",
      "congestion",
      "bus-routing"
    ]
  },
  {
    "id": "pd-24",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "A global route congestion map shows a red hotspot at a soft-macro corner and a diffuse yellow band across a std-cell sea. How do you triage root causes (pin density, cell density, PDN, clock, layer missing), and what different fixes apply to “local red spike” vs “global yellow”?",
    "shortSummary": "Local red spikes are usually pin-access / macro-corner / cell-cluster problems — fix with placement density screens, spreads, halos, or reorientation. Diffuse yellow implies systemic track shortage — PDN over-stripe, excess NDRs, wrong layer directive, or utilization too high. Don’t apply the same `place_spread` hammer to both.",
    "detailedAnswer": "### Triage checklist\n  1. Overlay **macros + pin heat** on congestion\n  2. Overlay **power straps** — count tracks stolen\n  3. Overlay **clock NDR nets**\n  4. Check **cell density** vs **overflow** correlation\n  5. Check missing preferred routing layers (accidental blockage)\n  6. Demand vs supply: `overflow = demand - capacity` per GCell\n\n  ### Local red spike fixes\n  - Reduce local utilization (partial blockage / spread)\n  - Expand macro halo; rotate pin faces\n  - Create buffer-only corridors away from the corner\n  - Split a bundled bus into two channels\n\n  ### Diffuse yellow fixes\n  - Lower global utilization or add floorplan area\n  - Relax unnecessary NDRs / guides\n  - Re-pitch PDN (careful vs IR)\n  - Enable additional routing layers if stack allows\n  - Hierarchy: push some logic to another physical partition\n\n  ### Staff narrative\n  Interviewers listen for **overlay thinking** (multi-layer cause analysis), not for “I ran place denser again.”",
    "commonPitfalls": [
      "Fixing yellow global congestion by blasting soft blockages everywhere (moves the yellow).",
      "Ignoring that CTS hasn’t run — clock NDRs will re-redden a “clean” pre-CTS map."
    ],
    "interviewerFollowups": [
      "How do you quantify “acceptable” overflow entering detail route?",
      "Congestion after ECO — incremental vs full global route?"
    ],
    "tags": [
      "congestion",
      "gcell-overflow",
      "pin-density",
      "pdn-tracks",
      "placement-spread"
    ]
  },
  {
    "id": "pd-25",
    "company": "intel",
    "companyName": "Intel",
    "domain": "physical-design",
    "domainName": "Physical Design (Floorplan, CTS, PnR)",
    "role": "Physical Design & PnR Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Describe a classic multi-layer **power mesh**: follow-pins / std-cell rails, intermediate stripes, thick top straps, and bumps/TSVs. How do you co-optimize stripe pitch with IR/EM *and* routing congestion? What is “power grid track tax,” and how do you explain a late IR fail caused by signal NDRs stealing vias from the PDN?",
    "shortSummary": "PDN is a hierarchy of decreasing resistance toward the package. Stripe pitch denser → better IR/EM, fewer signal tracks. Track tax is the fraction of routing resources consumed by power/ground. Late IR fails often come from signal via farms / NDR shields punching holes in the mesh or from macro channels without stitch columns — not from “the IR tool being wrong.”",
    "detailedAnswer": "### Mesh hierarchy\n  1. **M1 follow-pins / standard rails**: feed every cell site\n  2. **Intermediate stripes** (Mx/My): reduce local IR, vertical staples\n  3. **Thick upper metal**: low-R distribution from bumps\n  4. **RDL / bumps / backside (PowerVia)**: package interface\n\n  ### Co-optimization\n  $$\n  \\text{IR} \\downarrow \\Leftarrow \\text{pitch} \\downarrow \\quad\\text{but}\\quad \\text{signal capacity} \\downarrow\n  $$\n  Use IR maps to **adaptively** densify under hot clocks/ALUs; keep sparser mesh over lightly switching control logic. Always re-check congestion after PDN change.\n\n  ### Track tax communication\n  Tell the floorplan review: “This 2× clock NDR + 1× shield class costs ~Y% of M3 capacity — PDN already took Z% — remaining for signal is …” Staff PDs quantify; juniors shrug.\n\n  ### Late IR failure patterns\n  - Signal ECO via arrays sever stripe continuity\n  - Missing staples under macro abutments\n  - Power-gated switch arrays undersized for wake-up inrush (UPF interaction)\n  - Decap removed during filler refill\n\n  ### Signoff loop\n  PDN → early IR → place/CTS → SI/timing → update PDN → final dynamic IR/EM → freeze straps before last metal ECO window.",
    "commonPitfalls": [
      "Designing PDN only for static IR average, ignoring dynamic wake-up / clock-gate enable storms.",
      "Forgetting ground return path symmetry (EM on VSS)."
    ],
    "interviewerFollowups": [
      "How does backside power delivery change stripe planning on the frontside?",
      "Power switch daisy-chain IR during ramp — PD responsibility or UPF architect?"
    ],
    "tags": [
      "power-grid",
      "pdn",
      "stripes",
      "ir-drop",
      "em",
      "track-tax",
      "congestion"
    ]
  },
  {
    "id": "ir-01",
    "company": "intel",
    "companyName": "Intel",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Define static IR drop. Write the simple resistive model for a power grid node and explain why worst-case static IR is usually reported at max average current corners, not peak transient.",
    "shortSummary": "Static IR is the DC voltage loss $V_{\\text{drop}}=I_{\\text{avg}}R_{\\text{eff}}$ from package bumps/pads to instance pins under sustained average current. It ignores $L\\,di/dt$ and time-varying switching; dynamic analysis covers those.",
    "detailedAnswer": "For a rail segment: $\\Delta V = IR$ with $R$ the effective resistance through straps, mesh, vias, and bumps. Instance pin voltage:\n  $$V_{\\text{pin}} = V_{\\text{source}} - I_{\\text{path}} R_{\\text{path}}$$\n  Static vectorless / average-power flows use instance duty-averaged currents from VCD/SAIF or vectorless activity annotations. Because inductance drops out at DC ($\\omega L \\to 0$), static IR underestimates high-frequency droop — it is necessary but not sufficient signoff.\n\n  Typical budgets: few % of $V_{DD}$ (e.g. 1–2% static on a 0.75 V rail ⇒ 7.5–15 mV). Hotspots cluster at high-power macros far from bumps or in resistive via bottlenecks.",
    "commonPitfalls": [
      "Treating static IR as full PDN signoff.",
      "Using peak instantaneous current inside a pure DC solver."
    ],
    "interviewerFollowups": [
      "How does temperature enter $R(T)$?",
      "Why might hold timing worsen when $V$ rises (less IR) at fast corners?"
    ],
    "tags": [
      "static-ir",
      "ohms-law",
      "average-current",
      "pdn"
    ],
    "isFreeSample": true
  },
  {
    "id": "ir-02",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Derive why package inductance dominates first-droop behavior. Write the inductive voltage term and relate di/dt to simultaneous switching.",
    "shortSummary": "$v_L = L_{\\text{pkg}}\\frac{di}{dt}$. Fast current steps from clock-edge simultaneous switching see package/BGA loop inductance before on-die decap can respond through its own $R$/$L$, causing first droop.",
    "detailedAnswer": "Full rail loop:\n  $$V_{\\text{die}}(t) = V_{\\text{reg}} - i(t)R - L\\frac{di}{dt} - \\text{(distributed RC mesh effects)}$$\n  At a clock edge, thousands of flops toggle within tens of ps ⇒ large $di/dt$. Even micro-ohms of $R$ may be secondary to $L\\,di/dt$ for the first ~100 ps–ns.\n\n  **First droop:** inductive, package-dominated, partially filled by local MOS decap.  \n  **Second/third droop:** mid-board / VRM resonance after charge is depleted from mid-frequency caps.\n\n  Mitigation: more bump/C4 inductance reduction (more power balls, shorter loops), on-die decap, staggered enable / clock spreading, package decap.",
    "commonPitfalls": [
      "Blaming only sheet resistance for GHz first droop.",
      "Ignoring return-path inductance (power **and** ground loops)."
    ],
    "interviewerFollowups": [
      "How does backside power delivery change $L$?",
      "Clock gating “storms” when a big domain wakes — IR signature?"
    ],
    "tags": [
      "dynamic-ir",
      "inductance",
      "first-droop",
      "ssi"
    ],
    "isFreeSample": true
  },
  {
    "id": "ir-03",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What is “decap radius”? Why does a MOS decap 200 µm away fail to help a 20 ps current spike at a CPU ALU?",
    "shortSummary": "Charge must travel through resistive (/inductive) grid; the RC time and IR along the path limit the distance from which charge arrives in time. Effective radius shrinks as transient edge rates get faster.",
    "detailedAnswer": "Model path as $R_{\\square}$ mesh: time to deliver charge scales with $R_{\\text{path}}C$ and the allowable $\\Delta V$. For a pulse width $t_p$, only decap within distance where propagation/RC delay $\\lesssim t_p$ participates.\n\n  Rough intuition: higher metal resistivity or sparse straps ⇒ smaller radius; denser power mesh + via pillars ⇒ larger useful radius. Intrinsic gate cap of nearby logic also acts as “free” decap but collapses when that logic is also switching.\n\n  Placement rule: sprinkle intentional decap (filler MOS caps / MIM) inside high $di/dt$ regions, not only in chip corners.",
    "commonPitfalls": [
      "One big decap farm at chip edge for all cores.",
      "Assuming package caps help 10 ps edges (they don’t — too much $L$)."
    ],
    "interviewerFollowups": [
      "How do you measure effective radius in Voltus/RedHawk movies?",
      "Tradeoff: decap area vs routing / device density."
    ],
    "tags": [
      "decap-radius",
      "rc-delay",
      "local-charge"
    ]
  },
  {
    "id": "ir-04",
    "companyName": "foundry signoff",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "State Black’s equation for MTTF under electromigration. How do IR-driven current densities couple to EM signoff? Distinguish power-EM vs signal-EM.",
    "shortSummary": "$$\\text{MTTF} = \\frac{A}{j^n}\\exp\\left(\\frac{E_a}{kT}\\right)$$\n  Higher $|j|$ from aggressive IR recovery (narrow straps) kills lifetime. Power rails see mostly DC / unipolar stress; signal nets see bidirectional recovery.",
    "detailedAnswer": "$j$ = current density, $n$≈1–2 (foundry-specific), $E_a$ activation energy, $T$ absolute temperature. Because lifetime $\\propto 1/j^n$, a 20% current density increase can slash lifetime by ~1.4–1.5× (for $n=2$, $1.2^2=1.44$).\n\n  **Power EM:** sustained average / RMS currents in VDD/VSS; blech length and via downstream effects matter.  \n  **Signal EM:** often peak RMS over switching; reverse-recovery pulse helps.\n\n  Design trade: widen straps / add vias to cut $R$ (helps IR **and** $j$) vs area. Peak transient currents used for IR must be reconciled with average used for EM — don’t mix metrics blindly.",
    "commonPitfalls": [
      "Using peak transient $I$ as EM DC average.",
      "Ignoring temperature acceleration in hotspots near voltage droop regions (thermal ↔ EM coupling)."
    ],
    "interviewerFollowups": [
      "What is Blech length / immortality?",
      "Via array downstream voiding vs line EM."
    ],
    "tags": [
      "blacks-equation",
      "electromigration",
      "current-density"
    ]
  },
  {
    "id": "ir-05",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How does C4/BGA bump allocation between PWR/GND and signals set package loop inductance? Give a qualitative formula for many parallel bumps.",
    "shortSummary": "Loop inductance falls roughly as bumps are added in parallel: $L_{\\text{eq}} \\approx L_{\\text{bump}}/N_{\\text{eff}}$ with mutual terms. Dense checkerboard PWR/GND minimizes loop area vs clustered power-only regions.",
    "detailedAnswer": "Single bump partial inductance is small, but the **loop** (PWR bump → die → GND bump → package plane) dominates. Increasing $N$ parallel PWR/GND pairs:\n  $$L_{\\text{loop,eq}} \\sim \\frac{L_{\\text{single}}}{N} + L_{\\text{mutual redistribution}}$$\n  Spreading power bumps under high-current blocks beats dumping all PWR balls on one edge (lateral die metallization then dominates).\n\n  Field solvers (package PI tools) extract S-parameter / RLC models consumed by chip-PDN co-sim.",
    "commonPitfalls": [
      "Counting PWR bumps without matching GND return bumps.",
      "Ignoring package plane discontinuities / antipads."
    ],
    "interviewerFollowups": [
      "Fan-out wafer-level packaging vs BGA inductance.",
      "Why core VDD often needs dedicated ball maps separate from IO."
    ],
    "tags": [
      "package-l",
      "c4",
      "bump-map",
      "loop-inductance"
    ]
  },
  {
    "id": "ir-06",
    "companyName": "system PI / Voltus",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Derive the PDN target impedance $Z_{\\text{target}}$. How do you use a $Z(f)$ plot against this target?",
    "shortSummary": "$$Z_{\\text{target}}(f) = \\frac{V_{DD}\\cdot (\\text{allowed ripple fraction})}{I_{\\text{transient}}}$$\n  Keep $|Z_{\\text{pdn}}(f)| \\le Z_{\\text{target}}$ across the band where load current has energy (clock harmonics, burst spectra).",
    "detailedAnswer": "If allowable droop is $\\Delta V = \\kappa V_{DD}$ (e.g. $\\kappa=5\\%$) under current step $\\Delta I$:\n  $$Z_{\\text{target}} = \\frac{\\Delta V}{\\Delta I} = \\frac{\\kappa V_{DD}}{\\Delta I}$$\n  Example: $V_{DD}=0.75\\,\\text{V}$, $\\kappa=0.05$, $\\Delta I=10\\,\\text{A}$ ⇒ $Z_{\\text{target}}=3.75\\,\\text{m}\\Omega$.\n\n  $Z(f)$ shows capacitive roll-off, package resonance peaks, VRM inductive rise. Peaks above $Z_{\\text{target}}$ predict frequency-aligned droop. Fix with staged decap (bulk → mid → HF → on-die) damping the resonance.",
    "commonPitfalls": [
      "Single $Z_{\\text{target}}$ number without frequency context.",
      "Using average $I_{\\text{dd}}$ instead of transient $\\Delta I$."
    ],
    "interviewerFollowups": [
      "How does DVFS change $Z_{\\text{target}}$?",
      "Impedance sensing / adaptive voltage for margin recovery."
    ],
    "tags": [
      "z-target",
      "pdn-impedance",
      "frequency-domain"
    ]
  },
  {
    "id": "ir-07",
    "company": "cadence",
    "companyName": "Cadence",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Contrast early (pre-route / prototype) vs late (post-route signoff) power integrity analysis. What fidelity do you gain at each stage?",
    "shortSummary": "Early: coarse PG, vectorless / estimated tech — catches floorplan / bump / strap issues. Late: extracted SPEF+PG parasitics, real switching windows — signoff IR/EM with instance-level accuracy.",
    "detailedAnswer": "**Early rail:** uses floorplan power domains, planned mesh density, sticky bump maps, default activity. Purpose: resize straps, move macros, add package balls before routing investment.\n\n  **Late rail:** consumes routed PG + instance placement + SPEF + timing windows / VCD. Captures via starvation, local pinch-offs, dynamic hotspot movies. Signoff ECO: add straps, vias, decap fillers, reduce local density.\n\n  Methodology mistake: skipping early analysis then discovering bump starvation after tapeout-level routing.",
    "commonPitfalls": [
      "Believing prototype IR numbers are signoff-correlated without calibration."
    ],
    "interviewerFollowups": [
      "What is a “power movie” / cycle-based dynamic plot?",
      "How do you correlate silicon vs tool (sense points)?"
    ],
    "tags": [
      "voltus",
      "early-rail",
      "late-rail",
      "methodology"
    ]
  },
  {
    "id": "ir-08",
    "company": "intel",
    "companyName": "Intel",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Explain backside power delivery (BSPDN / PowerVia) intuition: what IR/EM problems does it solve, and what new constraints appear?",
    "shortSummary": "Move PWR/GND to wafer backside with through-silicon vias so frontside metals free up for signals; vertical path shortens $R$/$L$ into standard cells. New issues: BSPDN alignment, thermal, backside EM, and ECO difficulty.",
    "detailedAnswer": "Frontside scaling starved power routes (thin locals, via resistance). Backside thick metals + nano-TSVs feed cells from below ⇒ lower static IR, more uniform voltage, better standard-cell pin access on frontside.\n\n  Dynamic benefit: reduced lateral frontside travel ⇒ smaller effective loop for mid-frequency components. Still need package-level PI.\n\n  Costs: process complexity, probe/test access, thermal path changes, design-rule decks for buried power rails (BPR) + backside metals, and tool readiness for extraction.",
    "commonPitfalls": [
      "Claiming BSPDN eliminates package inductance.",
      "Ignoring that signal return paths still matter."
    ],
    "interviewerFollowups": [
      "Buried power rail vs backside only — difference?",
      "How does DFT / probe touchdown change?"
    ],
    "tags": [
      "bspdn",
      "powervia",
      "buried-rail",
      "advanced-nodes"
    ]
  },
  {
    "id": "ir-09",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How does a local voltage droop translate into setup (and sometimes hold) timing impact? Why is a flat STA derate insufficient for pathological hotspots?",
    "shortSummary": "Delay $\\propto 1/(V-V_t)^\\alpha$ roughly — droop slows launch/capture paths (setup risk). Hold can fail if clock path slows less than data short path, or at high-V fast corners. Flat OCV/AOCV derates miss spatially correlated IR hotspots.",
    "detailedAnswer": "Instance delay sensitivity $\\partial d/\\partial V$ is steep near low $V_{DD}$. A 30 mV local droop on a critical cone can burn tens of ps.\n\n  **IR-aware STA:** annotate instance voltages from dynamic IR into timing engines (TEMPUS/PrimeTime with rail voltages) so path delays use local $V$.\n\n  Flat derate applies uniform margin — overpessimistic globally, yet still optimistic on a 50 mV hotspot. Clock and data may see different voltages (clock spine vs datapath), creating differential effects.",
    "commonPitfalls": [
      "Only applying IR margin to data paths, not clock uncertainty.",
      "Using static IR voltages for a dynamic-limited design."
    ],
    "interviewerFollowups": [
      "Adaptive clocking / droop detectors that stretch clocks.",
      "Path-based vs graph-based IR-aware timing."
    ],
    "tags": [
      "ir-aware-sta",
      "droop",
      "setup-hold",
      "derate"
    ]
  },
  {
    "id": "ir-10",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Compare sparse power stripes vs dense power mesh. When does each win for IR vs routing congestion?",
    "shortSummary": "Stripes: lower routing blockage on some layers, directional $R$ anisotropy. Mesh: lower $R_{\\text{eff}}$ and better current spreading, higher track blockage. High-current cores usually need mesh or dense orthogonal straps.",
    "detailedAnswer": "Unidirectional wide stripes on upper layers feed down through stacked vias. Without orthogonal stitching, current must travel long lateral distances on resistive lower metals.\n\n  Mesh (orthogonal M6/M7 etc.) equalizes potential, reduces hotspot gradients, helps EM by parallelizing paths. Cost: fewer signal tracks → congestion → detours → timing.\n\n  Hybrid: dense mesh over CPUs, striped over lightly loaded IO, with rings at boundaries.",
    "commonPitfalls": [
      "Copying mesh density chip-wide without congestion budgeting."
    ],
    "interviewerFollowups": [
      "How do you decide strap width vs pitch quantitatively?",
      "Via ladder under stripes — role?"
    ],
    "tags": [
      "power-mesh",
      "stripes",
      "congestion",
      "ir"
    ]
  },
  {
    "id": "ir-11",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Why do stacked via pillars under power straps dominate IR even when upper metal is wide? How do you analyze via EM separately?",
    "shortSummary": "Via resistance is high and localized; a wide M7 strap bottlenecked by few M7→M6→…→M1 vias still sees large IR. Parallel via arrays cut $R$ and $j$.",
    "detailedAnswer": "$$R_{\\text{stack}} = \\sum_i R_{\\text{via},i}$$\n  If $N$ vias in parallel, $R_{\\text{stack}}/N$. Missing vias after DRC cleanup create “via starvation” hotspots visible in rail maps as speckles under macros.\n\n  EM: each via has a max average current; tools report via EM separately from metal EM. Downstream via effects and current crowding at corners need foundry rules.\n\n  ECO: insert via ladders, widen landing pads, forbid signal routing that deletes PG vias.",
    "commonPitfalls": [
      "Widening straps without adding vias (false fix).",
      "Allowing filler/decap to block via legalization sites."
    ],
    "interviewerFollowups": [
      "Double-cut vs single-cut via reliability.",
      "Via pillar construction in Innovus PG commands."
    ],
    "tags": [
      "via-pillar",
      "via-em",
      "stacked-via",
      "ir-bottleneck"
    ]
  },
  {
    "id": "ir-12",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "A power-gated island wakes through header switches. What causes inrush, how does it droop the always-on rail, and how do daisy-chained / weak-strong switch sequences help?",
    "shortSummary": "Discharged domain cap $C_{\\text{island}}$ charges through headers: $i \\approx C\\,dV/dt$. Large simultaneous enable ⇒ huge inrush into shared package PDN ⇒ global droop. Sequence weak then strong switches / staggered enables to limit $di/dt$.",
    "detailedAnswer": "Energy to charge: $E=\\tfrac12 C V^2$. Peak inrush depends on switch Ron schedule and slew of enable.\n\n  Controls:\n  1. **Daisy-chain / sleep-FET staging:** turn on small headers first (precharge slowly), then large headers.\n  2. **Inrush limiters** / closed-loop current control.\n  3. **Stagger wake** of multiple islands.\n  4. On-die sensors pause wake if droop detected.\n\n  Analyze with power-up IR vectors; don’t only sign off steady functional modes.",
    "commonPitfalls": [
      "Enabling all headers in one cycle for “fast wake” without PDN budget.",
      "Forgetting retention clamps / isolation cell timing during ramp."
    ],
    "interviewerFollowups": [
      "How does UPF `power_switch` acknowledge (`ack`) interact?",
      "Rush current into SRAM arrays specifically."
    ],
    "tags": [
      "inrush",
      "power-gating",
      "headers",
      "wakeup"
    ]
  },
  {
    "id": "ir-13",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Sketch a typical PDN impedance peak from package $L$ and die $C$. How can a repetitive current spectrum at that frequency cause large voltage ripple even if average IR looks fine?",
    "shortSummary": "Parallel resonance $f_r \\approx 1/(2\\pi\\sqrt{L_{\\text{pkg}}C_{\\text{die}}})$ peaks $|Z|$. Periodic current at $f_r$ (e.g., bursty loops) excites ringing → second droop / sustained ripple.",
    "detailedAnswer": "Die capacitance and package inductance form a high-Q tank if ESR is low. Damping via intentional ESR or spread decap values flattens the peak.\n\n  Time domain: after a current step, voltage rings at $f_r$. Frequency domain: harmonics of the workload aligning with $f_r$ are amplified by $Q$.\n\n  Fixes: add mid-frequency package/PCB caps near resonance, reduce $L$, increase damping, scramble throttle patterns / DVFS dithering.",
    "commonPitfalls": [
      "Only adding HF on-die decap (misses mid-band peak).",
      "Over-damping with huge series R (hurts transient response)."
    ],
    "interviewerFollowups": [
      "How do you measure $f_r$ on silicon?",
      "Interaction with SSDM / clock modulation."
    ],
    "tags": [
      "resonance",
      "second-droop",
      "q-factor",
      "pdn"
    ]
  },
  {
    "id": "ir-14",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Compare intrinsic device capacitance, intentional MOS decap fillers, and MIM/MOM decap for PDN. Pros/cons?",
    "shortSummary": "Intrinsic: “free” but vanishes when gates switch. MOS fillers: dense, leaky, voltage-dependent $C$. MIM/MOM: higher quality / less leakage, needs special layers and area, better HF.",
    "detailedAnswer": "| Type | Density | Leakage | Notes |\n  |---|---|---|---|\n  | Intrinsic gate/diff | High opportunistically | Functional | Unreliable under activity |\n  | MOS decap cell | High | Gate leakage | Cheap fillers; thin-ox stress rules |\n  | MOM | Medium | Low | Metal fingers; process friendly |\n  | MIM | High quality | Low | Extra mask; excellent HF |\n\n  Place intentional decap near hotspots; respect ESD / antenna / density rules. Thin-oxide decap may be disallowed on high-voltage rails.",
    "commonPitfalls": [
      "Filling 100% with MOS decap → leakage power failure."
    ],
    "interviewerFollowups": [
      "Voltage dependence of MOS $C_{ox}$ under droop (capacitance collapses).",
      "Decap ECO late in PG legalization."
    ],
    "tags": [
      "mos-decap",
      "mim",
      "mom",
      "leakage"
    ]
  },
  {
    "id": "ir-15",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Which PVT / RC corners typically bound static IR, dynamic IR, and EM? Why are they not identical?",
    "shortSummary": "Static IR: high-$R$ (often hot + RC worst) with high average power. Dynamic: depends on edge rates / package $L$ (may be cold fast for $di/dt$). EM: hot, high average $j$. Different physics ⇒ different corners.",
    "detailedAnswer": "Resistance rises with temperature ⇒ hot corners hurt static IR & EM.  \n  Dynamic first droop may be worse when switching is fastest (cold) even if $R$ is lower — $L\\,di/dt$ dominates.  \n  Foundry techfiles define EM corners (Temp, lifetime years, duty).\n\n  Signoff matrix must explicitly list rail scenarios: vectorless stress, VCD hotspot, wakeup, DFT shift/capture power, etc.",
    "commonPitfalls": [
      "One corner for all PI checks.",
      "Using functional max-power vector that misses DFT capture storms."
    ],
    "interviewerFollowups": [
      "Why scan capture can be the dynamic IR limiter.",
      "Aging / BTI interaction with Vmin under droop."
    ],
    "tags": [
      "corners",
      "pvt",
      "signoff-matrix",
      "em"
    ]
  },
  {
    "id": "ir-16",
    "companyName": "board + chip co-design",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Medium",
    "round": "Hiring Manager Round",
    "question": "A VRM uses remote sense. Where should sense lines Kelvin-connect, and what IR illusion appears if sense is at the package edge while the hotspot is die-center?",
    "shortSummary": "Sense at the point-of-load you care about (die bumps / on-die sense). If sense is at a quiet package node, VRM regulates that node while die-center still droops — false confidence.",
    "detailedAnswer": "Kelvin sense excludes IR in delivery path from regulation loop. Wrong sense location ⇒ systematic offset. On-die PVT sensors / droop detectors complement VRM sense for fast local events the VRM cannot track (bandwidth limits).\n\n  Board design: route differential sense tightly coupled, avoid injecting noise.",
    "commonPitfalls": [
      "Single-ended noisy sense.",
      "Sensing a lightly loaded domain while regulating a heavy one sharing the rail."
    ],
    "interviewerFollowups": [
      "Multi-phase VRM current share under asymmetric bump maps.",
      "On-die digital LDO vs board VRM bandwidth partition."
    ],
    "tags": [
      "remote-sense",
      "vrm",
      "kelvin",
      "system-pi"
    ]
  },
  {
    "id": "ir-17",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Partition PDN design across die, package, and PCB. Which frequency band is each responsible for, roughly?",
    "shortSummary": "On-die: GHz / highest frequency. Package mid (≈10–200+ MHz depending). PCB bulk + VRM: kHz–low MHz. Caps staged to cover decades of frequency without impedance peaks.",
    "detailedAnswer": "Bode / $|Z(f)|$ handoff: each stage’s ESR/ESL shifts coverage. Gaps between stages create peaks. Co-sim with chip+pkg+board models prevents optimistic die-only analysis.\n\n  Floorplanning bumps without PCB ball compatibility causes layer transition inductance spikes. Early collaborative ball maps are a program-level PI activity, not a late ECO.",
    "commonPitfalls": [
      "Die team and board team optimizing $Z$ separately against inconsistent $Z_{\\text{target}}$."
    ],
    "interviewerFollowups": [
      "How do you validate with frequency-domain reflectometry / VNA?",
      "Interposer / EMIB / RDL power delivery twists."
    ],
    "tags": [
      "co-design",
      "frequency-partition",
      "pcb",
      "package"
    ]
  },
  {
    "id": "ir-18",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Congestion forces you to narrow a power strap. What happens to IR and EM, and what compensatory knobs exist?",
    "shortSummary": "Narrower ⇒ higher $R$ (worse IR) and higher $j$ (worse EM). Compensate with more parallel straps, thicker upper layers, more vias, lower local power, or move bumps closer.",
    "detailedAnswer": "$R \\propto 1/\\text{width}$, $j = I/\\text{area}$. Both degrade together when width drops — rare to hurt only one. Sometimes switching to a higher metal layer (thicker) restores both.\n\n  If only peak IR fails but EM average is fine, dynamic fixes (decap, stagger) may suffice without widening — diagnose which check failed first.",
    "commonPitfalls": [
      "Fixing IR with vias only while line $j$ still fails EM."
    ],
    "interviewerFollowups": [
      "Non-default rule widths / sparsing for DFM vs IR."
    ],
    "tags": [
      "tradeoff",
      "strap-width",
      "em",
      "ir"
    ]
  },
  {
    "id": "ir-19",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "After a current step, voltage recovers with what time constants? How do adaptive clock generators use recovery time?",
    "shortSummary": "Multiple exponentials / rings: local RC (ps–ns), package resonance (ns–tens ns), VRM loop (µs). Adaptive clocks stretch period while $V$ is low, then release as sensors see recovery.",
    "detailedAnswer": "Local decap refill from neighbors: fast partial recovery. Package L-C ring: oscillatory. Board VRM feedback: slow.\n\n  Droop detectors trigger instruction throttle or PLL/DLL freeze / stretch. Must avoid false triggers and ensure deterministic restart (formal on control FSMs).\n\n  Timing analysis needs a mode covering stretched clocks if used for signoff credit — or treat as soft margin only.",
    "commonPitfalls": [
      "Assuming VRM corrects GHz droop."
    ],
    "interviewerFollowups": [
      "Analog vs digital droop sensors.",
      "Interaction with synchronizers when clock pauses."
    ],
    "tags": [
      "recovery",
      "adaptive-clock",
      "droop-detect"
    ]
  },
  {
    "id": "ir-20",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Two voltage islands share package balls through split planes. How can activity in domain A induce droop in domain B? What isolation techniques exist?",
    "shortSummary": "Shared package/board inductance and finite plane impedance couple $di/dt$ noise. Isolate with separate balls/planes, ferrite/bead filters for analog, on-die LDOs, or carefully placed decoupling at the split.",
    "detailedAnswer": "Even with distinct on-die rails, package planes often share returns. Ground bounce is a common coupling path: domain A switching returns through shared GND inductance ⇒ $V$ reference moves for B.\n\n  Sensitive analog / PLL supplies need dedicated balls + star returns. Digital cores can share more aggressively with budgeted crosstalk IR analysis.",
    "commonPitfalls": [
      "Declaring domains isolated because UPF shows separate `supply_net` while balls are shared."
    ],
    "interviewerFollowups": [
      "Level shifter / isolation cell behavior during asymmetric droop.",
      "Cross-domain EM on shared ground mesh."
    ],
    "tags": [
      "multi-voltage",
      "coupling",
      "gnd-bounce",
      "isolation"
    ]
  },
  {
    "id": "ir-21",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Why do PG via arrays use redundant vias beyond pure resistance needs?",
    "shortSummary": "Yield and reliability: single-via voids from EM or process kill the connection; N+1 redundancy extends lifetime and reduces via resistance variance that creates IR outliers.",
    "detailedAnswer": "Foundries incentivize multi-cut vias with rule decks. For signal nets, double-cut improves yield; for PG, large arrays also cut $j$ per cut. Downstream voiding still possible — follow current-direction rules.\n\n  Tools: via pillar optimization, `add_redundant_vias` style P&R commands with PG awareness so signal via insertion does not delete PG cuts.",
    "commonPitfalls": [
      "Adding redundant signal vias that punch through and remove PG vias."
    ],
    "interviewerFollowups": [
      "Bar vias / long vias in advanced nodes."
    ],
    "tags": [
      "redundant-via",
      "reliability",
      "yield"
    ]
  },
  {
    "id": "ir-22",
    "company": "texas-instruments",
    "companyName": "Texas Instruments",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Why do shift and at-speed capture patterns often create worse dynamic IR than functional workloads? What mitigations exist (without abandoning coverage)?",
    "shortSummary": "Scan shifts many flops with high correlation; LOC capture launches wide switching. Functional gated clocks rarely toggle everything. Mitigate with low-power ATPG, fill-0/1/random control, staggered shift clocks, reduced chain activity, and IR-aware pattern rejection.",
    "detailedAnswer": "Shift: almost all scan flops switching at tester period with SE=1 — pathological toggle density.  \n  Capture: at-speed dual pulses with wide enable → first-droop fails that look like delay defects (false failures).\n\n  Mitigations: adjacent-fill, test scheduling, power-aware ATPG cost functions, on-chip clock control limiting active domains, decoupling DFT from functional Vmin assumptions (separate guard-bands).",
    "commonPitfalls": [
      "Interpreting IR-induced capture fails as real delay defects."
    ],
    "interviewerFollowups": [
      "How do you correlate pattern fails with Voltus movies?",
      "Shift vs capture power budgeting separately."
    ],
    "tags": [
      "dft-power",
      "capture-ir",
      "low-power-atpg"
    ]
  },
  {
    "id": "ir-23",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What must a PG extractor capture that a signal SPEF flow might under-model for rail analysis?",
    "shortSummary": "Dense mesh reduction, via arrays, bump/RDL parasitics, package macro models, and accurate local pin→rail connectivity — not only lumped net C for timing.",
    "detailedAnswer": "Rail tools build a huge R (sometimes RL) network, reduce it, and stamp instance current sources. Missing micro-vias or wrong bump models skew hotspots. Frequency-dependent package S-parameters matter for dynamic.\n\n  Validate with checksums: total power ≈ $\\sum I\\cdot V$, comparison to vectorless vs VCD totals, and unit-grid sanity tests.",
    "commonPitfalls": [
      "Using signal SPEF alone as PDN model."
    ],
    "interviewerFollowups": [
      "Hierarchical vs flat rail analysis for SoCs.",
      "Reduced-order modeling errors near resonance."
    ],
    "tags": [
      "extraction",
      "pg-network",
      "voltus",
      "spef"
    ]
  },
  {
    "id": "ir-24",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "Explain how product $V_{\\min}$ guard-banding absorbs IR drop, aging, and tester-to-system differences. What happens if marketing wants to cut guard band by 20 mV?",
    "shortSummary": "$V_{\\min}$ stack-up includes static/dynamic IR, sensor error, aging, PLL margins, and board tolerance. Cutting 20 mV requires proving PDN/timing/aging headroom or improving silicon (mesh, bins, adaptive schemes).",
    "detailedAnswer": "Typical stack: regulator tolerance + package IR + on-die static + dynamic first droop + aging + margin. Each owner must quantify. A 20 mV cut without PDN work shifts failures into the field (silent data corruption or hard fails under burst).\n\n  Data-driven path: silicon shmoo under worst workloads, correlate droop sensors, then either reduce workload $di/dt$, improve PDN, or use adaptive voltage/clocking to reclaim margin safely.",
    "commonPitfalls": [
      "Double-counting margins in STA and voltage stack.",
      "Cutting only based on average IR reports."
    ],
    "interviewerFollowups": [
      "How do AVS / DVFS closed loops change the stack?",
      "Automotive vs consumer guard-band philosophy."
    ],
    "tags": [
      "vmin",
      "guard-band",
      "productization",
      "reliability"
    ]
  },
  {
    "id": "ir-25",
    "domain": "power-integrity-ir",
    "domainName": "Power Integrity & Dynamic IR Drop",
    "role": "Power Integrity & Grid Signoff Engineer",
    "difficulty": "Medium",
    "round": "Onsite Technical Round 1",
    "question": "You receive a dynamic IR hotspot map three days before tapeout. Outline a prioritized ECO checklist that maximizes droop reduction per day of effort.",
    "shortSummary": "(1) Via starvation under hotspot (2) local strap opens / pinched mesh (3) add decap fillers (4) shift bump/package if still open (5) only then logic throttle / timing re-budget. Verify each ECO with incremental rail runs.",
    "detailedAnswer": "Priority rationale: via/strap fixes remove root $R$ bottlenecks cheaply; decap helps dynamic; package ball changes are expensive/late; architectural throttle is last resort (PPA hit).\n\n  Process: isolate whether hotspot is resistivity, inductance, or demand spike. Check DFT-only vs functional. Apply ECO, re-extract incremental PG, confirm no EM regressions, and re-time IR-aware paths near the ECO.",
    "commonPitfalls": [
      "Sprinkling decap while vias are missing.",
      "ECOs that break DRC density or antenna."
    ],
    "interviewerFollowups": [
      "How many incremental Voltus iterations fit in 72 hours?",
      "Signoff waiver criteria when residual hotspot is non-timing-critical."
    ],
    "tags": [
      "eco",
      "hotspot",
      "methodology",
      "tapeout"
    ]
  },
  {
    "id": "rtl-01",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Why do we use nonblocking `<=` in sequential `always_ff` and blocking `=` in combinational `always_comb`? What race occurs if you use blocking assigns to infer flops across two `always` blocks?",
    "shortSummary": "Nonblocking schedules NBA updates after all RHS evaluations, modeling parallel flop behavior. Blocking updates immediately, modeling combo logic. Mixing blocking flop assigns across blocks creates read/write race depending on always-block execution order.",
    "detailedAnswer": "At a clock edge, all RHS of `<=` in the design are computed from current values, then all LHS update — matching simultaneous flip-flop sampling. If `always @(posedge clk) q1 = d;` and another block does `q2 = q1;`, simulation order can make `q2` get old or new `q1` — not synthesizable intent for a 2-flop chain.\n\n  Guideline:\n  - `always_ff @(posedge clk)` → `<=` only\n  - `always_comb` → `=` only, complete LHS assignments to avoid latches\n  - Do not mix `=` and `<=` to the same variable\n\n  Staff note: `#0` and NBA scheduling regions matter in testbenches; RTL should stay simple so synthesis and sim agree.",
    "tclOrVerilogSnippet": {
      "lang": "systemverilog",
      "code": "always_ff @(posedge clk) begin\n  q1 <= d;\n  q2 <= q1; // shift register — correct with NBA\nend"
    },
    "commonPitfalls": [
      "Blocking assigns in sequential blocks “because it worked in one simulator.”",
      "Reading a reg written with `=` in the same combo block before assignment → stale/X."
    ],
    "interviewerFollowups": [
      "What does `always_latch` imply vs incomplete `always_comb`?",
      "Why is `a = a + 1` inside `always_ff` with blocking still a flop but poor style?"
    ],
    "tags": [
      "verilog",
      "nba",
      "blocking",
      "races",
      "rtl-style"
    ],
    "isFreeSample": true
  },
  {
    "id": "rtl-02",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Compare binary, one-hot, and gray FSM encodings for area, timing, and power. When does one-hot win on a high-frequency GPU control FSM?",
    "shortSummary": "Binary minimizes flops but needs wide decode; one-hot uses N flops for N states with trivial next-state OR-of-inputs and fast output decode; gray minimizes bit toggles on sequential state walks (good for low power / CDC of state). High-speed sparse control often prefers one-hot.",
    "detailedAnswer": "| Encoding | Flops | Next-state logic | Outputs | Notes |\n  |---|---|---|---|---|\n  | Binary | \\(\\lceil\\log_2 N\\rceil\\) | Compact but multi-level decode | Often slower | Default synthesis |\n  | One-hot | \\(N\\) | Per-state simple conditions | Outputs tap single bit | Excellent timing |\n  | Gray | \\(\\lceil\\log_2 N\\rceil\\) | Adjacent-only transitions | Medium | Soft-error / power |\n\n  One-hot: illegal states (`==0` or multi-bit) need recovery or X-checks. Synthesis `enum` + `syn_encoding` / `fsm_encoding` attributes guide mapping. For timing-critical APIs (issue control, credit return), one-hot’s output = state bit beats binary decode cones.",
    "commonPitfalls": [
      "Assuming one-hot always smaller — flop+routing cost can dominate at large N.",
      "Gray encoding when transitions are not adjacent — loses its benefit and complicates logic."
    ],
    "interviewerFollowups": [
      "How do you safely recover from illegal one-hot states in ISO 26262 designs?",
      "Sparse one-hot vs full?"
    ],
    "tags": [
      "fsm",
      "one-hot",
      "encoding",
      "timing"
    ],
    "isFreeSample": true
  },
  {
    "id": "rtl-03",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "List CDC-safe RTL patterns for (1) single-bit control, (2) multi-bit configuration, (3) data streaming between asynchronous clocks. What must never be done with a 2-FF synchronizer?",
    "shortSummary": "(1) 2-FF sync for single-bit. (2) Handshake or async FIFO / gray pointers for multi-bit. (3) Async FIFO or credited ready/valid with sync of controls only. Never independently 2-FF-sync each bit of a multi-bit bus — bits can skew into illegal combinations.",
    "detailedAnswer": "Patterns:\n  - **Pulse → level toggle** in src, sync level, edge-detect in dst for single-cycle pulses.\n  - **Req/ack handshake** for multi-bit payload stability while req is held.\n  - **Async FIFO:** binary counters locally, gray-sync pointers across domains, memory is dual-clock.\n  - **Mux-recirc / quasi-static:** config bits change only while consumer is held in reset or gated — documented false path.\n\n  Forbidden: `dst <= sync(src_bus[i])` per bit; `if (sync_valid) data <= unsynced_data` without holding data stable.\n\n  Staff: mention MTBF via sync depth, naming conventions for CDC tools (`_async`, `_meta`), and why gray code only works for counters that change by ±1.",
    "tclOrVerilogSnippet": {
      "lang": "systemverilog",
      "code": "// pulse stretch to toggle\nalways_ff @(posedge clk_src)\n  if (pulse) toggle <= ~toggle;\n// 2FF in dst + rise detect\nalways_ff @(posedge clk_dst)\n  {sync_ff2, sync_ff1} <= {sync_ff1, toggle};\nassign pulse_dst = sync_ff2 ^ sync_ff1;"
    },
    "commonPitfalls": [
      "Sync’ing a multi-bit counter in binary.",
      "Using the unsynchronized data with a synchronized valid from a different cycle."
    ],
    "interviewerFollowups": [
      "Why is gray(pointer+1) computed in binary then converted?",
      "3-FF vs 2-FF tradeoff?"
    ],
    "tags": [
      "cdc",
      "synchronizer",
      "async-fifo",
      "gray"
    ]
  },
  {
    "id": "rtl-04",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "In a 5-stage RISC-like pipeline (F/D/X/M/W), explain structural, data (RAW/WAR/WAW), and control hazards. How do you implement hazard detection and forwarding in RTL at a Staff level?",
    "shortSummary": "Structural: resource conflict (one mem port). Data RAW: use forwarding + stall if load-use. WAR/WAW rare in simple in-order with fixed writeback. Control: branch redirect + flush younger instructions; predictors reduce penalty.",
    "detailedAnswer": "RTL pieces:\n  - **Scoreboard / hazard unit:** compare D-stage source regs vs X/M/W destinations; generate `stall_f_d` and `forward_a/b` mux selects.\n  - **Forwarding muxes:** X-stage ALU inputs can take M or W results.\n  - **Load-use:** if M is load targeting X’s source → insert bubble (freeze F/D, inject NOP into X).\n  - **Control:** branch resolves in X; squash D/X instructions via `valid` clears; PC redirect.\n\n  Microarch interview bar: discuss delay slots (legacy), branch predictors, and why valid bits per stage beat “global stall” for multi-issue GPUs (per-lane scoreboarding).",
    "commonPitfalls": [
      "Forwarding from W while forgetting W also writes the regfile same cycle (bypass vs regfile timing).",
      "Stalling only PC but not freezing decode registers → duplicate issue."
    ],
    "interviewerFollowups": [
      "How does a dual-issue pipe change structural hazard logic?",
      "Store-load forwarding in the MEM stage?"
    ],
    "tags": [
      "pipeline",
      "hazards",
      "forwarding",
      "stall"
    ]
  },
  {
    "id": "rtl-05",
    "company": "intel",
    "companyName": "Intel",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "For a synchronous FIFO depth 8, how do you generate full and empty with binary pointers? Why do people use an extra pointer bit or count register? Extend to async FIFO gray pointers.",
    "shortSummary": "Empty when read==write pointer; full when pointers differ only in the MSB wrap bit (N+1 bit pointers) or when count==DEPTH. Async: keep local binary for mem addressing, convert to gray, sync gray, convert back for compare.",
    "detailedAnswer": "Depth-8 → 3-bit address. With 3-bit pointers alone, full and empty both look like equality after wrap — ambiguous. Fixes:\n  1. **4-bit pointers:** empty if equal; full if MSBs differ and LSBs equal.\n  2. **Count:** increment on write-only, decrement on read-only, hold on both/neither.\n\n  Async FIFO:\n  ```text\n  wr_bin -> wr_gray -> sync to rd clk -> compare with rd_gray\n  rd_bin -> rd_gray -> sync to wr clk -> compare with wr_gray\n  ```\n  Full checked in write domain; empty in read domain. Never compare binary across domains.",
    "commonPitfalls": [
      "Checking full in the wrong clock domain.",
      "Using combination gray increment without registering — multi-bit transitions."
    ],
    "interviewerFollowups": [
      "Exact gray code formula `g = b ^ (b>>1)` and inverse.",
      "Almost-full thresholds for cut-through flow control?"
    ],
    "tags": [
      "fifo",
      "pointers",
      "gray",
      "full-empty"
    ]
  },
  {
    "id": "rtl-06",
    "company": "amd",
    "companyName": "AMD",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Design a 4-port round-robin arbiter with grant / request. How do you ensure fairness under persistent requests, and how does a masked priority arbiter implement RR in RTL?",
    "shortSummary": "RR rotates priority to the peer after the last grant. Implement as two priority arbiters: one on requests masked above the pointer, one on unmasked; prefer upper mask hit else lower. Fixed priority starves low clients.",
    "detailedAnswer": "Classic Lamport/mask RR:\n  - Maintain `ptr` one-hot or binary of last grant.\n  - `req_masked = req & ~mask(ptr)` (requests strictly above last grant in ring order).\n  - If `|req_masked`, grant = priority_find_first(req_masked); else grant = priority_find_first(req).\n  - Update `ptr` from grant when any grant issues.\n\n  Properties: starvation-free if every granted client eventually drops req or is limited by quantum. For NoCs, weighted RR / age-based / credit-aware variants appear — know tradeoffs for QoS.\n\n  Formal: assert no two grants; assert that if req[i] held continuously, grant[i] within N cycles.",
    "tclOrVerilogSnippet": {
      "lang": "systemverilog",
      "code": "// priority encode example (LSB highest)\nalways_comb begin\n  grant = '0;\n  for (int i = 0; i < N; i++)\n    if (req_rot[i]) begin grant_rot[i] = 1'b1; break; end\nend"
    },
    "commonPitfalls": [
      "Updating pointer combinationally from grant causing loops.",
      "Granting when request already deasserted mid-cycle (need registered req or Mealy carefully)."
    ],
    "interviewerFollowups": [
      "How do you add preemption for a high-priority client?",
      "Matrix arbiter vs RR for 16×16?"
    ],
    "tags": [
      "arbiter",
      "round-robin",
      "fairness",
      "noc"
    ]
  },
  {
    "id": "rtl-07",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Why assert reset asynchronously but deassert synchronously? Draw the 2-flop reset synchronizer and explain recovery/removal timing on the first flop.",
    "shortSummary": "Async assert immediately forces known state even if clocks are off. Sync deassert ensures all flops exit reset on the same clock edge, avoiding partial release and metastability on deassert. A 2-FF sync chain releases `rst_n` cleanly in the clock domain.",
    "detailedAnswer": "```systemverilog\n  always_ff @(posedge clk or negedge rst_async_n)\n    if (!rst_async_n) {q2,q1} <= 2'b00;\n    else              {q2,q1} <= {q1,1'b1};\n  assign rst_sync_n = q2;\n  ```\n  First flop can go metastable when async release violates recovery/removal vs `clk`; second flop filters. All functional flops use `rst_sync_n` as async clear/preset.\n\n  Don’t OR unrelated async resets into one tree without synchronizing per domain. Reset tree buffering is a PD concern — RTL must still declare correct sensitivity.",
    "commonPitfalls": [
      "Deasserting async reset combinationally mid-cycle → some flops released, others not.",
      "Using sync-only reset when clocks may be gated at power-up."
    ],
    "interviewerFollowups": [
      "How do scan and async reset interact (`dft` mux)?",
      "Reset stretching across multiple clocks?"
    ],
    "tags": [
      "reset",
      "synchronizer",
      "async-assert",
      "rtl"
    ]
  },
  {
    "id": "rtl-08",
    "company": "intel",
    "companyName": "Intel",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "When do you use `generate for` vs arrayed module instantiations vs a single wide procedural block? What are elaboration-time vs simulation-time limitations of `generate if`?",
    "shortSummary": "`generate` elaborates structural hierarchy (instances, continuous assigns, assertions) based on parameters. Use it for scalable arrays of cells/FIFOs. `generate if` conditions must be constant at elaboration — not runtime signals.",
    "detailedAnswer": "```systemverilog\n  genvar i;\n  generate\n    for (i = 0; i < N; i++) begin : g_pipe\n      pipe_stage #(.W(W)) u (.clk(clk), .d(d[i]), .q(d[i+1]));\n    end\n  endgenerate\n  ```\n  Prefer generate when you need **named hierarchy** for binding SVA, or different instance types via `generate if (USE_ECC)`. For simple bitwise ops, a single `always_comb` with `for` loop is clearer and synthesizes fine.\n\n  Cannot put `generate` inside processes. `genvar` is elaboration-only.",
    "commonPitfalls": [
      "Trying to `generate if (runtime_signal)`.",
      "Accidental latch inference inside generated combo blocks with incomplete assigns."
    ],
    "interviewerFollowups": [
      "How do hierarchical names `g_pipe[2].u` appear in STA reports?",
      "`generate` vs array of instances with `.conn(bus[i])`?"
    ],
    "tags": [
      "generate",
      "elaboration",
      "parameterized-rtl"
    ]
  },
  {
    "id": "rtl-09",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How do you write a reusable parameterized FIFO with width/depth? Contrast `parameter`, `localparam`, and `#(parameter ...)` port-style. What breaks when depth is not a power of two?",
    "shortSummary": "Expose `WIDTH`/`DEPTH` as parameters; derive `ADDR_W=$clog2(DEPTH)` as localparam. Non-power-of-two depths need careful full/empty (count-based) rather than MSB-wrap pointer tricks that assume power-of-two.",
    "detailedAnswer": "```systemverilog\n  module sync_fifo #(\n    parameter int WIDTH = 32,\n    parameter int DEPTH = 8\n  )(\n    input  logic             clk, rst_n, we, re,\n    input  logic [WIDTH-1:0] din,\n    output logic [WIDTH-1:0] dout,\n    output logic             full, empty\n  );\n    localparam int ADDR_W = $clog2(DEPTH);\n    ...\n  endmodule\n  ```\n  `$clog2(8)=3`, `$clog2(7)=3` still — max index 6 needs 3 bits, but pointer wrap logic `+1` mod DEPTH ≠ mod 2^ADDR_W. Use modular arithmetic or count.\n\n  Overrides: `sync_fifo #(.WIDTH(64), .DEPTH(16)) u(...)`. Don’t allow contradictory parameters without elaboration asserts: `if (DEPTH<2) $error(...)`.",
    "commonPitfalls": [
      "Using `parameter ADDR_W = $clog2(DEPTH)` incorrectly for DEPTH=1.",
      "Mixing ANSI and non-ANSI parameter overrides confusingly."
    ],
    "interviewerFollowups": [
      "`parameter type T = logic [7:0]` — typed parameters?",
      "Why prefer `localparam` for derived constants?"
    ],
    "tags": [
      "parameter",
      "fifo",
      "clog2",
      "reuse"
    ]
  },
  {
    "id": "rtl-10",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Why is `casex` dangerous in RTL? How does `casez` treat Z vs X, and what is the safer modern alternative for decode with don’t-cares?",
    "shortSummary": "`casex` treats X and Z as don’t-care in both case item and expression — Xs in the select can match unexpected branches (X-optimism). `casez` only treats Z/`?` as don’t-care. Prefer `unique case` / `priority case` with explicit `?` in items only, or mask-based decode.",
    "detailedAnswer": "If `case (sel)` uses `casex` and `sel=4'b10xx`, it may match `4'b1001` item even though silicon `sel` isn’t don’t-care — sim/synth mismatch risk. Lint tools ban `casex` in synthesizable RTL.\n\n  Safer:\n  ```systemverilog\n  unique casez (opcode)\n    8'b0001_????: /* ... */;\n    8'b0010_????: /* ... */;\n    default: /* illegal */;\n  endcase\n  ```\n  `unique` adds runtime/formal check that exactly one item matches (no overlap). Overlaps with don’t-cares are a common bug.",
    "commonPitfalls": [
      "Using `casex` for APB decode with X on address during reset.",
      "Overlapping `casez` items without `unique`/`priority`."
    ],
    "interviewerFollowups": [
      "Difference between `unique` and `unique0`?",
      "How does synthesis treat overlapping case items?"
    ],
    "tags": [
      "casex",
      "casez",
      "decode",
      "x-optimism"
    ]
  },
  {
    "id": "rtl-11",
    "company": "amd",
    "companyName": "AMD",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "How does incomplete assignment in `always_comb` infer a latch? When are latches intentionally used (time borrowing), and why do most digital SoC flows forbid unintentional latches?",
    "shortSummary": "If a combo path doesn’t assign an output under all conditions, synthesis keeps prior value → latch. Intentional latches enable cycle stealing on critical paths but complicate STA (transparent windows, pulse generators). Unintentional latches fail lint and cause hold nightmares.",
    "detailedAnswer": "```systemverilog\n  always_comb\n    if (en) q = d; // missing else q = q; → latch\n  ```\n  Fix: assign default before if, or use `always_ff` for storage.\n\n  Intentional latch pipelines (Intel-style) need 2-phase non-overlap clocks and specialized methodology — not ad-hoc. For interviews: know detection (`check_design`, lint), and that `always_latch` documents intent.",
    "commonPitfalls": [
      "Case without default on enum FSM next-state.",
      "Assuming FPGA tools “optimize latches away” safely."
    ],
    "interviewerFollowups": [
      "How does STA time-borrow through a latch?",
      "Why are latch-based register files used in some CPUs?"
    ],
    "tags": [
      "latch",
      "flop",
      "inference",
      "sta"
    ]
  },
  {
    "id": "rtl-12",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Write a clean one-hot FSM using an `enum` of 1-hot literals. How do you compute next-state with parallel `if` on `state[S]` bits, and how do you assert illegal states?",
    "shortSummary": "Define states as one-hot enum values; register `state`; drive `next` combinationally from bit tests; assert `$onehot(state)` after reset. Outputs can be Moore (decode state) or Mealy (state+inputs).",
    "detailedAnswer": "```systemverilog\n  typedef enum logic [3:0] {\n    S0 = 4'b0001,\n    S1 = 4'b0010,\n    S2 = 4'b0100,\n    S3 = 4'b1000\n  } state_t;\n  state_t state, next;\n\n  always_ff @(posedge clk or negedge rst_n)\n    if (!rst_n) state <= S0;\n    else        state <= next;\n\n  always_comb begin\n    next = state;\n    unique case (state)\n      S0: if (go) next = S1;\n      S1: next = S2;\n      S2: if (done) next = S3; else next = S1;\n      S3: next = S0;\n      default: next = S0; // recovery\n    endcase\n  end\n  assert property (@(posedge clk) disable iff(!rst_n) $onehot(state));\n  ```\n  Synthesis may re-encode unless attributes preserve one-hot — verify in netlist if timing depended on it.",
    "commonPitfalls": [
      "Enum auto-sequential encoding accidentally binary.",
      "Forgetting default recovery — FSM lockup in illegal state."
    ],
    "interviewerFollowups": [
      "Safe FSM vs fully enumerated?",
      "Output registered vs combo from one-hot?"
    ],
    "tags": [
      "onehot",
      "fsm",
      "enum",
      "assert"
    ]
  },
  {
    "id": "rtl-13",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Explain valid/ready handshake rules. Who can wait for whom? When may data change? Implement a skid buffer and explain why it is needed between two registered ready-valid stages.",
    "shortSummary": "Transfer occurs when `valid&&ready` in the same cycle. Source must hold valid+data while valid&&!ready. Ready may depend on valid (combinational) but that risks combo loops — often register ready with a skid/elasticity buffer to break timing.",
    "detailedAnswer": "Skid buffer: when downstream deasserts ready, upstream may already have launched a beat; skid captures that beat so upstream ready can drop without combinatorial dependence.\n\n  Two back-to-back `if (ready) q<=d` stages with `ready=downstream_ready` registered incorrectly can drop data. Standard pattern: store pipeline with `valid` bits and bubble insertion when `~ready`.\n\n  AXI specifics: separate channels; AW/W ordering rules; ID-based response ordering — know at least channel independence and stability rules for interviews.",
    "commonPitfalls": [
      "Data changing while stalled.",
      "Combo path `ready = valid & ...` creating loops through both sides."
    ],
    "interviewerFollowups": [
      "Decouple with FIFO vs skid — when each?",
      "AXI-Stream vs AXI4-Lite differences?"
    ],
    "tags": [
      "axi",
      "valid-ready",
      "skid",
      "handshake"
    ]
  },
  {
    "id": "rtl-14",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "How must a clock-gate enable be timed relative to the clock? Why do we use an integrated clock gating cell (latch + AND) instead of a naked AND gate on clock?",
    "shortSummary": "Enable must be stable during the clock-high (for AND-high gates) so the latch in ICG captures enable when clock is low and freezes it while clock is high — glitch-free. Naked AND of `clk & enable` glitches when enable falls while clk is high.",
    "detailedAnswer": "ICG functional model:\n  - Transparent latch passes `en` when `clk=0`\n  - When `clk=1`, latch opaque — `en_latched` stable\n  - Gated clock = `clk & en_latched`\n\n  RTL: use `always_ff` enables and let synthesis insert ICGs via `clock_gating` / hierarchical CG. Explicit RTL ANDing clocks is a lint violation.\n\n  Functional enable may be OR of many conditions — register it and STA treats ICG enable like a setup path to the latch.",
    "commonPitfalls": [
      "Gating with XOR for “toggles” without glitch analysis.",
      "Glitchy combo enable into ICG (still setup, but functional hazards if used elsewhere)."
    ],
    "interviewerFollowups": [
      "How does DFT scan bypass ICGs?",
      "Clock gate overrides for debug?"
    ],
    "tags": [
      "clock-gating",
      "icg",
      "glitch",
      "low-power"
    ]
  },
  {
    "id": "rtl-15",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Design a glitch-free mux between two asynchronous clocks. Why is a plain data `mux` on clocks illegal, and how do synchronizers + “make-before-break / break-before-make” sequences avoid runt pulses?",
    "shortSummary": "A combinational mux on clocks produces glitches during select transitions. Glitch-free clock switchers disable both clocks (or use carefully sequenced enables) with sync handshakes before enabling the new source — break-before-make.",
    "detailedAnswer": "Approach:\n  1. Request switch to `clk_b`.\n  2. Deassert ICG enable for `clk_a` path; wait synced “off” confirmation.\n  3. Assert enable for `clk_b` after sync into `clk_b` domain.\n  4. Special cells (glitch-free clock mux IP) encapsulate this.\n\n  Never switch on a data mux cell. For related clocks (same PLL divided), glitch-free mux IP still recommended; phase relationships may allow simpler designs but need PD signoff.\n\n  Staff: discuss metastability on select path, lockup if both off forever, and DFT clock switching.",
    "commonPitfalls": [
      "Using `assign clk = sel ? clk1 : clk2;`.",
      "Switching without waiting for clock-off → OR of two clocks briefly."
    ],
    "interviewerFollowups": [
      "How do you switch among N>2 clocks?",
      "Relation to UPF clock isolation?"
    ],
    "tags": [
      "clock-mux",
      "glitch-free",
      "icg",
      "staff"
    ]
  },
  {
    "id": "rtl-16",
    "company": "intel",
    "companyName": "Intel",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Write a synthesizable priority encoder for an 8-bit request vector (LSB highest priority). Discuss timing depth vs a logarithmic tree encoder for wide vectors (64+).",
    "shortSummary": "A sequential `for` loop if-break yields a priority chain — simple but O(N) logic depth. Wide arbiters use hierarchical/tournament trees O(log N) for timing closure at GHz.",
    "detailedAnswer": "```systemverilog\n  always_comb begin\n    grant = '0;\n    found = 1'b0;\n    for (int i = 0; i < 8; i++) begin\n      if (!found && req[i]) begin\n        grant[i] = 1'b1;\n        found = 1'b1;\n      end\n    end\n  end\n  ```\n  Synthesis maps to AOI chains. For 128 requesters at high freq, break into groups of 8, encode locally, then encode group winners — same as RR building blocks.",
    "commonPitfalls": [
      "Multiple grants if forgetting to suppress after first hit.",
      "Using `casex` on req for priority — fragile."
    ],
    "interviewerFollowups": [
      "Find-first-one leading zero count circuits?",
      "One-hot vs binary grant output?"
    ],
    "tags": [
      "priority-encoder",
      "arbiter",
      "timing"
    ]
  },
  {
    "id": "rtl-17",
    "company": "amd",
    "companyName": "AMD",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Medium",
    "round": "Technical Phone Screen",
    "question": "Contrast Mealy and Moore output formation. Which is safer for CDC-facing control outputs, and how do registered outputs change the classification?",
    "shortSummary": "Moore outputs depend only on state (stable between edges); Mealy depends on state+inputs (can glitch when inputs glitch). Registered outputs (state → combo → flop) give synchronous clean outputs preferred at block boundaries.",
    "detailedAnswer": "Mealy can react same-cycle (lower latency) but creates combo paths from inputs to outputs — bad for timing budgets and glitch-sensitive enables. Moore adds at least one cycle latency.\n\n  Best practice at IP boundary: registered Moore-style outputs. Internally Mealy OK if contained. For CDC, only synchronized, glitch-free level signals may cross — never raw Mealy pulses.",
    "commonPitfalls": [
      "Decoding Mealy grant into another clock domain.",
      "Calling a registered-output FSM “pure Mealy” incorrectly."
    ],
    "interviewerFollowups": [
      "Output registered in parallel with state vs after?",
      "How do FPGA tools report FSM style?"
    ],
    "tags": [
      "mealy",
      "moore",
      "fsm",
      "glitch"
    ]
  },
  {
    "id": "rtl-18",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "What RTL coding patterns infer SRAM vs a bank of flops? Why might a “reg [W-1:0] mem [0:D-1];” still become flops, and how do you write vendor-friendly dual-port RAM inference?",
    "shortSummary": "Large arrays with synchronous read/write and no reset on every word infer RAM. Async read, per-word resets, or small depths often map to flops. Follow vendor templates for true dual-port (two clocks/addresses).",
    "detailedAnswer": "Flop-inferred when: depth small, async read `assign q = mem[a]`, or `mem[i] <= '0` under reset for all i. RAMs typically cannot clear all locations in one cycle — that pattern forces flops.\n\n  Sync read template:\n  ```systemverilog\n  always_ff @(posedge clk) begin\n    if (we) mem[addr] <= din;\n    dout <= mem[addr]; // read-old or read-new policies vary\n  end\n  ```\n  Document read-during-write behavior; mismatch vs simulation is a classic silicon bug. For multi-GHz GPUs, instantiate hardened SRAM macros via wrappers, not inference.",
    "commonPitfalls": [
      "Assuming inference always works across vendors.",
      "Mixing async and sync reads on same array."
    ],
    "interviewerFollowups": [
      "ECC wrapper around inferred RAM?",
      "Byte enables inference?"
    ],
    "tags": [
      "ram-inference",
      "sram",
      "memory",
      "rtl"
    ]
  },
  {
    "id": "rtl-19",
    "company": "intel",
    "companyName": "Intel",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "In SystemVerilog, how do `signed` types, `$signed()`, and width extension rules interact in an expression mixing signed and unsigned? Give a bug where a subtractor wraps unexpectedly.",
    "shortSummary": "If any operand is unsigned, the expression is unsigned — negative signed values become huge positives after zero-extension. Cast both sides with `$signed` or declare signed types consistently; match widths explicitly.",
    "detailedAnswer": "Example bug:\n  ```systemverilog\n  logic signed [7:0] a;\n  logic        [7:0] b;\n  logic signed [8:0] diff;\n  assign diff = a - b; // b unsigned ⇒ a treated unsigned\n  ```\n  If `a=-1` (8'hFF) and `b=1`, unsigned math gives `0xFF-0x01=0xFE`, not `-2`.\n\n  Fix: `assign diff = $signed(a) - $signed(b);` with wide enough LHS. For arithmetic right shift use `>>>` on signed values; `>>` always logical on unsigned.\n\n  Staff: know self-determined vs context-determined widths in Verilog LRM — intermediate widths surprise people in multiplies/adds.",
    "commonPitfalls": [
      "Comparing signed negative to unsigned threshold.",
      "Truncating multiply MSB product bits unintentionally."
    ],
    "interviewerFollowups": [
      "How do you saturating-add in RTL?",
      "Fixed-point Q-format alignment?"
    ],
    "tags": [
      "signed",
      "verilog-width",
      "arithmetic",
      "bugs"
    ]
  },
  {
    "id": "rtl-20",
    "company": "broadcom",
    "companyName": "Broadcom",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "A producer cannot throttle until 3 cycles after `almost_full`. Size the threshold for a depth-32 FIFO so it never overflows. Explain cut-through vs store-and-forward at the consumer.",
    "shortSummary": "Threshold must reserve at least the pipeline bubbles of in-flight writes after almost_full asserts: `almost_full when count >= DEPTH - LATENCY`. Cut-through starts reading before full packet arrives (lower latency); store-and-forward waits for complete packet (simpler flow control).",
    "detailedAnswer": "If after AF rises, up to L more writes can occur: set watermark at `DEPTH-L`. Example L=3, DEPTH=32 → AF when `count>=29`. Cover simultaneous read+write: if a read happens in the window, margin increases — worst-case sizing ignores beneficial reads unless guaranteed.\n\n  Cut-through: forward as soon as header/first beat available — needs packet-length/abort handling. Networking switches use cut-through; many on-chip FIFOs are beat-based ready/valid (neither packet notion).",
    "commonPitfalls": [
      "Watermark = DEPTH-1 with multi-cycle throttle latency → overflow.",
      "Forgetting simultaneous both-sides transactions in count update."
    ],
    "interviewerFollowups": [
      "How does credit-based flow control replace almost_full?",
      "Elastic buffer in SerDes PCS — similar math?"
    ],
    "tags": [
      "fifo",
      "almost-full",
      "watermark",
      "flow-control"
    ]
  },
  {
    "id": "rtl-21",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Describe an RTL pattern for a stallable pipeline using per-stage `valid` bits. How do you kill instructions on branch mispredict without leaving stale valids, and how does backpressure propagate?",
    "shortSummary": "Each stage register holds `{valid, payload}`. A stage accepts input when `~valid_q || ready_down` (can overwrite bubble or advancing). Stall freezes stage when valid and downstream not ready. Flush clears valid bits for younger stages.",
    "detailedAnswer": "```systemverilog\n  wire advance = valid_i && (!valid_q || ready_o);\n  always_ff @(posedge clk) begin\n    if (!rst_n) valid_q <= 0;\n    else if (flush) valid_q <= 0;\n    else if (advance) begin\n      valid_q <= 1'b1;\n      data_q  <= data_i;\n    end else if (ready_o) valid_q <= 1'b0; // optional drain\n  end\n  assign ready_i = !valid_q || ready_o;\n  ```\n  Backpressure is combinatorial `ready` chain — may need skid at timing-critical points. Flush must have clear priority over advance.",
    "commonPitfalls": [
      "Clearing data but not valid (or vice versa).",
      "Ready chain too long for timing — must pipeline ready with skids."
    ],
    "interviewerFollowups": [
      "Elastic vs inelastic pipelines?",
      "Multi-thread valid vectors (GPU warps)?"
    ],
    "tags": [
      "pipeline",
      "valid",
      "stall",
      "flush",
      "backpressure"
    ]
  },
  {
    "id": "rtl-22",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "How should RTL express a multicycle path so synthesis/STA can be constrained safely? What handshake guarantees are required before `set_multicycle_path` is legal?",
    "shortSummary": "Data must be stable for N cycles at the capture flop; enable/qualifiers must ensure launch changes only every N cycles. SDC MCP alone without RTL stability is a silicon bug. Prefer explicit qualifiers (`en` flop) over tribal knowledge.",
    "detailedAnswer": "Pattern: launching side updates `data` only when `issue` pulses every N cycles; capturing side samples on `capture_en` aligned to the same schedule. SDC: `set_multicycle_path N -setup; set_multicycle_path N-1 -hold` (details depend on methodology).\n\n  Staff failure mode: MCP applied to a path that still toggles every cycle under rare modes — must cover with assertions that `data` is stable between enables, and mode-based false paths when reconfigured.\n\n  Don’t use MCP to “fix” timing instead of pipelining unless protocol truly allows.",
    "commonPitfalls": [
      "MCP without hold adjustment.",
      "Forgetting secondary modes where the path becomes single-cycle."
    ],
    "interviewerFollowups": [
      "How do you verify MCP with formal stability properties?",
      "Interaction with retiming?"
    ],
    "tags": [
      "multicycle",
      "sdc",
      "rtl-intent",
      "staff"
    ]
  },
  {
    "id": "rtl-23",
    "company": "intel",
    "companyName": "Intel",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "Which flops must reset to known values, which can be left uninitialized, and how do you balance reset fanout power/area vs X risk? Tie to DV X-prop strategy.",
    "shortSummary": "Control FSMs, valids, credits, and security-sensitive state must reset. Datapath/pipeline payload flops often omit reset to save routing if valids ensure consumers ignore them — but DV must prove no X leakage into control. Document and lint.",
    "detailedAnswer": "Cost: async reset nets are high-fanout; resetting every pipeline data flop is expensive. Industry pattern: reset `valid`/tag/FSM; leave `data` payload alone; assert `valid → !$isunknown(control_fields)`.\n\n  Memories: typically no reset of contents — software/RTL initializes. Sparse resets need ECO-awareness.\n\n  Interview: show you can negotiate with DV/PD — not “reset everything” or “reset nothing.”",
    "commonPitfalls": [
      "Unreset valid bits → permanent phantom transactions after power-up.",
      "Assuming synthesis ties unreset flops to 0 (it may not)."
    ],
    "interviewerFollowups": [
      "Retention flops in UPF — reset semantics across power cycles?",
      "Soft reset vs hard reset subsets?"
    ],
    "tags": [
      "reset",
      "x-init",
      "area",
      "methodology",
      "staff"
    ]
  },
  {
    "id": "rtl-24",
    "company": "amd",
    "companyName": "AMD",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Can glitches on combinational logic into a flop D-pin cause functional errors if setup/hold to the next edge are met? When do glitches matter (async set/clear, clock gates, latch enables, CDC)?",
    "shortSummary": "Into a synchronous D input, mid-cycle glitches are OK if D is stable before the setup window at the active edge. Glitches are fatal on clocks, async resets, latch enables, and as CDC pulses.",
    "detailedAnswer": "Synchronous discipline: evaluate combo between edges; sample once. Static hazards in SOP logic may pulse D mid-cycle — ignored if settled by setup time.\n\n  Dangerous endpoints: ICG enables (handled by latch window), async clear, mux select on clocks, single-FF pulse synchronizer sources. For those, register then use.\n\n  STA doesn’t “simulate glitches”; use design rules + CDC/RDC tools.",
    "commonPitfalls": [
      "Generating a 1-cycle pulse from combo decode and sending across clocks.",
      "Using XOR of gray bits as a pulse without care."
    ],
    "interviewerFollowups": [
      "Hazard coverage in ATPG vs functional?",
      "When does retiming move a flop past glitchy logic dangerously?"
    ],
    "tags": [
      "glitch",
      "hazard",
      "synchronous",
      "cdc"
    ]
  },
  {
    "id": "rtl-25",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "rtl-verilog-architecture",
    "domainName": "Verilog & Digital Architecture",
    "role": "Digital RTL & Microarchitecture Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Architect an N×M crossbar for a GPU/NoC tile: mux-tree vs matrix, one-hot vs binary select, registered stages, and fairness under contention. What is the Big-O of area and of combo delay for a flat mux matrix?",
    "shortSummary": "Flat matrix: area \\(O(N\\cdot M\\cdot W)\\), delay \\(O(1)\\) mux depth theoretically but wire RC dominates. Tree muxes: delay \\(O(\\log N)\\), area similar order with better PPA at scale. Arbitration separate from datapath; pipeline at floorplan cuts.",
    "detailedAnswer": "Datapath: for each output j, mux among N inputs based on grant one-hot — one-hot mux folds to AND-OR without decode. Binary select needs decode → extra layer.\n\n  Control: N requestors × M resources → often decompose as request to destination, output-side arbiter per column (or input-side). RR per output for fairness.\n\n  Physical: pure combo crossbar fails timing for large N — insert pipe stages, use crossbar networks (Clos, mesh) instead of full connect when \\(N\\) large.\n\n  Staff whiteboard: draw request → arb → one-hot → data mux → optional skid; discuss fanout on broadcast inputs and clocking.",
    "commonPitfalls": [
      "Ignoring wiring congestion — schematic O(1) delay fantasy.",
      "Centralized arbiter critical path at high N."
    ],
    "interviewerFollowups": [
      "How does a folded Beneš network reduce area vs full crossbar?",
      "Virtual channels interaction with output arb?"
    ],
    "tags": [
      "crossbar",
      "noc",
      "mux-tree",
      "architecture",
      "staff"
    ]
  },
  {
    "id": "sta-17",
    "company": "intel",
    "companyName": "Intel",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Derive why flat OCV without CRPR (CPPR) double-counts on-chip variation on the common clock path. Given launch network delay $D_L$, capture network delay $D_C$, common path delay $D_{\\text{common}}$, and flat late/early derates $k_L$ / $k_E$, write the setup slack with and without common-path credit, and state the exact credit term tools remove.",
    "shortSummary": "Flat OCV derates the entire launch path late and the entire capture path early, including the shared trunk. That shared segment cannot be simultaneously late *and* early, so CRPR/CPPR restores the illegal pessimism $D_{\\text{common}}(k_L - k_E)$ (setup) back into slack.",
    "detailedAnswer": "### Setup without CRPR (naive flat OCV)\n  Ideal period $T$, data path delay $D_{\\text{data}}$, library setup $T_{\\text{su}}$:\n\n  $$\n  \\begin{aligned}\n  T_{\\text{launch}}^{\\text{late}} &= k_L\\,(D_{\\text{common}} + D_{L,\\text{unique}}) \\\\\n  T_{\\text{capture}}^{\\text{early}} &= k_E\\,(D_{\\text{common}} + D_{C,\\text{unique}}) \\\\\n  S_{\\text{setup}}^{\\text{no CRPR}} &= T + T_{\\text{capture}}^{\\text{early}} - T_{\\text{launch}}^{\\text{late}} - D_{\\text{data}}^{\\text{late}} - T_{\\text{su}}\n  \\end{aligned}\n  $$\n\n  Expanding the clock terms:\n\n  $$\n  T_{\\text{capture}}^{\\text{early}} - T_{\\text{launch}}^{\\text{late}}\n  = k_E D_{C,\\text{u}} - k_L D_{L,\\text{u}} - D_{\\text{common}}(k_L - k_E)\n  $$\n\n  The last term $-D_{\\text{common}}(k_L-k_E)$ is **physically impossible** pessimism: one physical net cannot be both late-derated and early-derated in the same analysis edge pair.\n\n  ### With CRPR / CPPR\n  Tools compute the common segment (same cells/nets from root to divergence point) and **credit** that illegal delta:\n\n  $$\n  \\text{CRPR}_{\\text{setup}} = D_{\\text{common}}(k_L - k_E)\n  $$\n\n  $$\n  S_{\\text{setup}}^{\\text{CRPR}} = S_{\\text{setup}}^{\\text{no CRPR}} + \\text{CRPR}_{\\text{setup}}\n  $$\n\n  Hold CRPR is analogous but with early launch / late capture; credit still removes double-counting on the shared trunk.\n\n  ### Industrial notes\n  - **Graph-based** CRPR uses a single divergence point per path pair; reconvergent clock trees need careful LCA (lowest common ancestor) selection.\n  - **POCV / LVF** still uses CRPR-like common-path handling, but sigma combination is statistical rather than min/max derate arithmetic.\n  - Disabling CRPR for “conservative” signoff is usually wrong: you are signing off against an **impossible** corner, not a real silicon corner.",
    "tclOrVerilogSnippet": {
      "lang": "tcl",
      "code": "# PrimeTime / Tempus style (names vary by tool):\n  set_app_var timing_remove_clock_reconvergence_pessimism true\n  # or Tempus:\n  set_db timing_analysis_cppr true\n  report_timing -path_type full_clock_expanded  ;# inspect common clock segment"
    },
    "commonPitfalls": [
      "Confusing CRPR with AOCV stage-count derating — they address different pessimism sources.",
      "Assuming CRPR always makes hold *worse*; hold also receives common-path credit (different edge combination).",
      "Looking only at Ideal clocks where CRPR is zero because network latency is not propagated."
    ],
    "interviewerFollowups": [
      "How does CRPR interact with generated clocks and clock mux divergence?",
      "Why can over-aggressive clock gating / ICG placement change the CRPR divergence point overnight?"
    ],
    "tags": [
      "crpr",
      "cppr",
      "ocv",
      "common-path",
      "setup-hold",
      "signoff"
    ]
  },
  {
    "id": "sta-18",
    "company": "intel",
    "companyName": "Intel",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Technical Round 1",
    "question": "Contrast flat OCV, Advanced OCV (AOCV / SBOCV), and Parametric OCV (POCV / SOCV / LVF). For a 12-stage data path and a 3-stage clock path, explain qualitatively why flat derates over-penalize long paths, how distance/depth tables correct that, and what mean/sigma Liberty Variation Format changes in path combination.",
    "shortSummary": "Flat OCV applies one late/early constant to every arc — long paths accumulate absurd pessimism. AOCV indexes derate by path depth and/or spatial distance so deep paths get milder per-stage derate. POCV replaces deterministic min/max with statistical mean + sigma (LVF) and combines variances along the path (RSS-like), yielding less global guardband at iso-yield.",
    "detailedAnswer": "### Flat OCV\n  Single scalars, e.g. `set_timing_derate -late 1.05 -early 0.95`. Every cell/net arc is scaled. A 40-stage path is treated as if *every* stage is simultaneously at the same extreme — physically correlated variation does not behave that way → **guardband explosion** on deep logic, while short hold paths are inconsistently treated.\n\n  ### AOCV / stage-based / distance-based\n  Libraries or side tables provide derate as a function of:\n  - **Path depth** (stage count from clock root or from path startpoint)\n  - **Spatial distance** (bounding-box diagonal between launch and capture)\n  - Often separate clock vs data, cell vs net tables\n\n  Intuition: random local variation averages out over many independent stages → per-stage derate **shrinks** with depth. Systematic / global components remain in the corner (PVT) itself.\n\n  ### POCV / SOCV / LVF\n  Liberty Variation Format annotates per-arc **nominal delay + sensitivity / sigma** (and often slew/load dependence). Path slack becomes a statistical quantity:\n  - Means add along a path\n  - Independent random sigmas combine approximately as $\\sigma_{\\text{path}} \\approx \\sqrt{\\sum \\sigma_i^2}$ (tool-specific correlation models apply)\n  - Signoff targets a quantile (e.g. mean + $k\\sigma$) instead of pure corner stacking\n\n  ### Practical comparison table\n\n  | Method | What varies | Combination | Typical use |\n  | :--- | :--- | :--- | :--- |\n  | Flat OCV | Constant % | Min/max stack | Legacy / early floorplan |\n  | AOCV | Depth/distance table | Still min/max, milder tables | Mid-node production |\n  | POCV/LVF | Per-arc sigma | Statistical RSS + CRPR | Advanced FinFET signoff |\n\n  ### Correlation rule of thumb\n  Closing timing with flat 8–10% OCV then “hoping” AOCV/POCV will magically recover is backwards: choose the **signoff derate methodology first**, then budget architecture frequency.",
    "commonPitfalls": [
      "Mixing AOCV tables from the wrong metal stack / voltage in MMMC.",
      "Forgetting clock-path AOCV tables (data-only AOCV leaves clock skew over-pessimistic).",
      "Treating POCV “mean path” reports as if they were GBA worst-corner numbers."
    ],
    "interviewerFollowups": [
      "How do you validate AOCV/POCV tables against silicon / ring-oscillator correlation?",
      "What breaks if hierarchical ILMs were characterized under flat OCV but top-level signs off POCV?"
    ],
    "tags": [
      "aocv",
      "pocv",
      "lvf",
      "socv",
      "derate",
      "variation",
      "mmmc"
    ]
  },
  {
    "id": "sta-19",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Explain why graph-based analysis (GBA) is pessimistic versus path-based analysis (PBA). Give a concrete slew-propagation example where GBA reports negative slack but PBA recovers, and state when you *must not* waive GBA violations solely because PBA is green.",
    "shortSummary": "GBA stores one worst slew/arrival per node for *all* fanouts, so a side-path’s horrible slew can poison the critical path’s arc delay. PBA re-propagates slew along each path individually. PBA is the right recovery tool for slew-poisoned endpoints, but never for missing constraints, DRV failures, or physical SI that PBA wasn’t configured to see.",
    "detailedAnswer": "### GBA mechanics\n  At each pin, the timer keeps:\n  - Worst (latest) arrival for setup\n  - Worst slew (usually slowest) used to index Liberty delay tables for *every* outgoing arc\n\n  If net $N$ fans out to a lightly loaded critical flop **and** a huge poorly buffered side load, GBA may use the slow slew from the side-load transition to evaluate the critical arc → inflated $T_{\\text{cq}}$ / combo delay → **false** WNS.\n\n  ### PBA mechanics\n  For a selected path (or path group), the tool:\n  1. Recomputes slew along *that* path’s arcs only\n  2. Re-evaluates Liberty delays with path-specific slew/load\n  3. Often re-applies CRPR / AOCV with path-specific stage counts\n\n  Result: critical path sees its true fast slew → recovered slack.\n\n  ### When PBA recovery is legitimate\n  - Endpoint fails GBA by tens of ps, PBA recovers after slew re-prop\n  - Path is real (not false), clocks constrained, SI mode consistent\n  - You re-run PBA after ECO because slew topology changed\n\n  ### When “PBA green” is a trap\n  - **Constraint bugs** (missing clock, wrong multicycle) — PBA won’t invent correctness\n  - **Max-transition / capacitance DRVs** still fail even if slack recovers\n  - **Hold** at min corner with SI — PBA without crosstalk can lie\n  - Selective PBA on 100 paths while 50k GBA violators remain — not tapeout signoff\n\n  ### Signoff policy (staff answer)\n  Use GBA for optimization and full-chip triage; use exhaustive or “PBA on failing endpoints” for recovery **with a documented delta budget** (e.g. allow ≤X ps GBA→PBA recovery, else fix physically).",
    "tclOrVerilogSnippet": {
      "lang": "tcl",
      "code": "# Conceptual Tempus / PT flow:\n  report_timing -max_paths 200           ;# GBA\n  report_timing -path_type full -pba_mode exhaustive  ;# tool-specific PBA switch"
    },
    "commonPitfalls": [
      "Running PBA before clocks are propagated / before SI is enabled.",
      "Comparing GBA WNS from view A to PBA WNS from view B."
    ],
    "interviewerFollowups": [
      "How does path-based AOCV depth differ from graph-based depth?",
      "Incremental PBA vs exhaustive PBA — runtime vs risk?"
    ],
    "tags": [
      "gba",
      "pba",
      "slew-propagation",
      "pessimism",
      "signoff-policy"
    ]
  },
  {
    "id": "sta-20",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Deconstruct signal-integrity timing: what is crosstalk **delta delay** on a victim net, how do aggressor switching windows create setup vs hold hits, and when does SI analysis report a **glitch** rather than a delay change? Outline a physical ECO ladder when SI delta dominates cell delay.",
    "shortSummary": "Capacitively coupled aggressors inject current into the victim, speeding or slowing its transition (delta delay) depending on relative direction and overlap of switching windows. Setup is hurt by late-increasing delta on data or clock shrink; hold is hurt by early-decreasing data delay or clock push-out. A glitch is a noise pulse that can falsely trigger a latch/async pin even if delay slack is positive.",
    "detailedAnswer": "### Delta delay physics\n  Victim net transition sees effective capacitance:\n  - **Same-direction** aggressor switch → Miller-like reduction → **faster** victim (hold risk on data paths)\n  - **Opposite-direction** aggressor switch → inflated $C_{\\text{eff}}$ → **slower** victim (setup risk)\n\n  STA folds this into an incremental delay $\\Delta_{\\text{xtalk}}$ annotated on the victim arc after parasitic extraction + aggressor filtering.\n\n  ### Switching windows\n  Tools need arrival windows on aggressors. Infinite windows (unknown) → maximum pessimism. Clock uncertainty, false paths, and multicycle exceptions reshape windows; **wrong exceptions create wrong SI**.\n\n  ### Glitch vs delta delay\n  - **Delta delay**: monotonic transition slowed/sped — classical setup/hold math.\n  - **Glitch / noise**: pulse height vs receiver noise immunity / $V_{\\text{IL}}$/$V_{\\text{IH}}$; critical on:\n    - Async set/reset\n    - Latch enables / clock pins\n    - Narrow pulses feeding ICG EN paths\n\n  ### ECO ladder (when $\\Delta_{\\text{xtalk}}$ dominates)\n  1. **Spacing / double-spacing** victim vs worst aggressors (NDR)\n  2. **Shielding** with VDD/VSS rails\n  3. **Buffering** to harden slew (faster edges → less vulnerable window, but watch aggressor creation)\n  4. **Layer promotion** (fatter upper metal, lower R, often less relative coupling %)\n  5. **Aggressor timing** — useful skew or schedule so aggressors miss victim window (advanced)\n  6. Last resort: logic ECO to break coupling-critical topology\n\n  ### Report hygiene\n  Always separate “cell delay vs net delay vs SI delta” columns. If SI delta is 40% of path delay, upsizing every gate is cargo cult.",
    "commonPitfalls": [
      "Closing SI-unaware timing then enabling SI at the last week.",
      "Fixing victim drive strength into a wall of unfixed aggressors (you become the aggressor elsewhere)."
    ],
    "interviewerFollowups": [
      "How do incremental SI updates interact with ECO routing?",
      "Difference between CCSN noise libraries and older NLDM noise models?"
    ],
    "tags": [
      "crosstalk",
      "si",
      "delta-delay",
      "glitch",
      "ndr",
      "shielding"
    ]
  },
  {
    "id": "sta-21",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "For a positive level-sensitive latch transparent while clock=1, explain **time borrowing**: when is borrowing legal, how does the borrow amount appear in STA reports, and how do you constrain max borrow so you don’t steal the entire next half-cycle?",
    "shortSummary": "If data arrives after the latch opening edge but before the closing edge, the latch still captures — the lateness is **borrowed** from the next stage’s timing budget. STA shows reduced slack on the downstream path. Illegal borrow past the closing edge is a setup failure at the latch; unbounded borrow without `set_max_time_borrow` (or equivalent) can hide architectural cycle theft.",
    "detailedAnswer": "### Transparency window\n  For an active-high latch:\n  - Opens on rising edge (or after $T_{\\text{dq}}$ opening)\n  - Closes on falling edge\n\n  Data arriving at $t_{\\text{arr}}$ relative to the opening edge:\n  - If $t_{\\text{arr}} \\le 0$ (before open + setup-to-open modeling): no borrow\n  - If $0 < t_{\\text{arr}} < T_{\\text{high}} - T_{\\text{su,latch}}$: **legal borrow** $B = t_{\\text{arr}}$\n  - If past closing setup: **latch setup fail**\n\n  ### Cycle math intuition\n  Phase 1 combinational logic may use up to half-cycle + borrow into Phase 2. Phase 2 then has only half-cycle − borrow left. Borrow is a **zero-sum** transfer, not free performance.\n\n  ### STA controls\n  - `set_max_time_borrow` limits optimistic architectural stealing\n  - Pulse-width / duty-cycle constraints bound the transparency window\n  - Mixed flop-latch pipelines need explicit exceptions — default flop equations mis-model latches\n\n  ### Why interviewers love this\n  Candidates who only memorize edge-triggered $T \\ge T_{\\text{cq}}+T_{\\text{logic}}+T_{\\text{su}}$ fail latch questions. Staff candidates discuss closing-edge setup, borrow reports, and duty-cycle sensitivity (jitter eats borrow budget first).",
    "tclOrVerilogSnippet": {
      "lang": "tcl",
      "code": "set_max_time_borrow 0.150 [get_pins u_pipe/*/LAT*/D]  ;# 150 ps cap\n  report_timing -through [get_pins u_pipe/u_lat/Q]"
    },
    "commonPitfalls": [
      "Treating latch Q like a flop Q edge-triggered arrival.",
      "Ignoring that hold for latches is often checked to the **opening** edge / transparency start."
    ],
    "interviewerFollowups": [
      "How does useful skew on latch clocks differ from flop useful skew?",
      "Borrow across voltage islands with level shifters in the transparent path?"
    ],
    "tags": [
      "latch",
      "time-borrow",
      "transparency",
      "duty-cycle",
      "set_max_time_borrow"
    ]
  },
  {
    "id": "sta-22",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Hard",
    "round": "Technical Phone Screen",
    "question": "When do you use `set_data_check` instead of a flop setup/hold check? Give examples (clock-mux select vs clocks, analog enable vs data, memory latch self-timed interfaces). Write the setup/hold data-check forms and explain why forgetting the related clock / `-clock` association creates silent escapes.",
    "shortSummary": "Data checks constrain **pin-to-pin** relationships that are not implied by sequential library arcs — e.g. select stable before muxed clocks switch. `set_data_check -from A -to B -setup Ts` requires A to be stable Ts before B switches (setup-like); hold form requires A to remain stable after B. Without proper clock association, the check may be timed in the wrong mode or dropped.",
    "detailedAnswer": "### Why library arcs aren’t enough\n  Liberty timing arcs cover characterized cell behavior. Chip-level **intentional** constraints between arbitrary pins (RTL mux controls, soft-macro self-timed enables, DFT mode pins) often have **no** arc. SDC data checks close that hole.\n\n  ### Canonical forms\n  ```tcl\n  # Setup-like: constrained_pin must be ready BEFORE related_pin edge\n  set_data_check -from [get_pins u_mux/S] -to [get_pins u_mux/CLK0] -setup 0.20\n\n  # Hold-like: constrained_pin must remain stable AFTER related_pin edge\n  set_data_check -from [get_pins u_mux/S] -to [get_pins u_mux/CLK0] -hold 0.05\n  ```\n\n  Semantics (tool-documented carefully): setup data check fails if the “from” signal arrives too late relative to the “to” transition; hold fails if it changes too soon after.\n\n  ### Industrial examples\n  1. **Glitch-free clock mux**: select one-hot / select stable vs old/new clock edges\n  2. **Async FIFO gray pointer** sampled by companion logic with explicit separation\n  3. **Memory compiler** pins: `CLK` vs `WEN`/`ADDR` when .lib arcs incomplete at chip wrap\n  4. **Analog IP digital wrapper**: freeze/enable vs toggling data\n\n  ### Silent escape modes\n  - Data check declared but clocks ideal / wrong — check never arms\n  - `-clock` omitted in multi-clock cones — ambiguous related edge\n  - Check marked false by aggressive `set_false_path -to` covering the same pins\n  - Only setup data check coded; hold race on select still silicon-real",
    "commonPitfalls": [
      "Using `set_max_delay` as a lazy substitute without understanding edge directionality.",
      "Duplicating a check that already exists as a Liberty non-seq arc → double constraint / confusion."
    ],
    "interviewerFollowups": [
      "How do data checks appear in QoR vs regular path groups?",
      "Interaction with CPPR when both pins are clock-network endpoints?"
    ],
    "tags": [
      "set_data_check",
      "non-sequential",
      "clock-mux",
      "sdc",
      "interface-constraints"
    ]
  },
  {
    "id": "sta-23",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Define **recovery** and **removal** timing checks for asynchronous clear/preset. Why can a design meet all sync setup/hold yet still fail recovery? How do you constrain async resets properly in STA (including synchronized deassertion)?",
    "shortSummary": "Recovery is the minimum time between async pin release (inactive edge) and the next active clock edge — like setup for async→sync handoff. Removal is the minimum time async must remain asserted after a clock edge — like hold. Most silicon bugs are **async deassertion** releasing near a clock edge, putting flops into metastability even when D-pin timing is clean.",
    "detailedAnswer": "### Definitions\n  - **Recovery** ($T_{\\text{rec}}$): async control must be **released** at least $T_{\\text{rec}}$ before the capturing clock edge so the flop is cleanly in functional mode.\n  - **Removal** ($T_{\\text{rem}}$): async control must not release too soon after a clock edge (analogous to hold vs clock).\n\n  ### Why sync-only STA misses it\n  Classic R2R reports ignore async pins unless recovery/removal arcs exist in Liberty **and** the async network is timed (not set_false_path’d carelessly). Teams often:\n  ```tcl\n  set_false_path -to [get_pins */CLR]   ;# DANGER if used to hide recovery\n  ```\n  which silences the exact check that prevents reset-exit metastability.\n\n  ### Correct architecture\n  1. Assert async reset asynchronously (OK for init)\n  2. **Deassert synchronously** through a reset synchronizer in each clock domain\n  3. STA: time recovery from synchronizer Q to fanout flops’ async pins **or** prefer sync-only reset flops (`sync clear`) so recovery becomes ordinary setup\n\n  ### Constraint sketch\n  Prefer library recovery arcs. If custom:\n  - Don’t blanket false-path async pins\n  - Use timed reset trees with explicit uncertainty\n  - Separate power-on reset vs functional soft reset modes in MMMC",
    "commonPitfalls": [
      "Buffering reset trees for skew without re-checking recovery at leaves.",
      "One global async reset deasserted into 12 PLLs’ domains without per-domain synchronizers."
    ],
    "interviewerFollowups": [
      "How do scan-reset and functional-reset interact in DFT modes?",
      "Removal failures after useful-skew CTS — what changed?"
    ],
    "tags": [
      "recovery",
      "removal",
      "async-reset",
      "metastability",
      "reset-synchronizer"
    ]
  },
  {
    "id": "sta-24",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "Explain **minimum pulse width** (high and low) checks on clocks and on ICG outputs. How do high-frequency + high OCV + poor duty cycle create MPW failures even when setup WNS is positive? What is a **clock gating check** (setup/hold on ICG EN vs CK), and how does it differ from a data setup to a flop?",
    "shortSummary": "MPW ensures CK high/low phases at the pin meet Liberty `min_pulse_width`. Duty-cycle distortion, slow slew, and asymmetric derates shrink the effective pulse until flops/ICGs fail functionally. Clock gating checks ensure enable is stable around the sampling edge of the ICG so the gated clock doesn’t glitch — polarity depends on latch-based ICG architecture (typically EN setup to falling edge for neg-latch ICG).",
    "detailedAnswer": "### Min pulse width\n  For period $T$ and duty $d$ (high fraction):\n  $$\n  T_{\\text{high}} = d\\,T,\\quad T_{\\text{low}} = (1-d)\\,T\n  $$\n  After network latency asymmetry, OCV, and slew degradation at the leaf:\n  $$\n  T_{\\text{high,eff}} < T_{\\text{MPW,high}} \\Rightarrow \\text{MPW fail}\n  $$\n  Failures show up first on:\n  - Generated divide-by-2 clocks with skinny OR/AND logic\n  - Gated clocks after ICG with slow EN→GCK arcs\n  - Clock mux outputs\n\n  Setup can still be green because setup uses full period edges; MPW is a **separate functional correctness** check.\n\n  ### Clock gating check\n  Neg-latch ICG (common): latch opens on CK=0, samples EN, ANDs with CK.\n  - **Setup** on EN: must be stable before latch close (rising CK) by $T_{\\text{su,EN}}$\n  - **Hold** on EN: must remain stable after latch open appropriately\n\n  This is *not* the same as D-pin setup to the gated register — it’s a check **at the ICG cell** preventing runt pulses on GCK.\n\n  ### Debug ladder\n  1. `report_min_pulse_width` / clock pulse reports\n  2. Inspect duty at PLL vs at leaf (CTS insertion asymmetry)\n  3. ICG placement: EN logic depth vs CK arrival (gating check fails)\n  4. Don’t “fix path” EN — fix logic or use sync enable alignment",
    "tclOrVerilogSnippet": {
      "lang": "tcl",
      "code": "report_clock_timing -type pulse_width\n  report_timing -to [get_pins u_icg/EN]   ;# gating check path\n  set_clock_latency -source ...           ;# won't fix MPW alone"
    },
    "commonPitfalls": [
      "Fixing MPW by increasing uncertainty (doesn’t widen pulse).",
      "Upsizing flop CK pins without fixing upstream ICG pulse."
    ],
    "interviewerFollowups": [
      "How does POCV change MPW reporting vs flat OCV?",
      "Interaction of clock gating checks with multicycle EN updates?"
    ],
    "tags": [
      "min-pulse-width",
      "mpw",
      "icg",
      "clock-gating-check",
      "duty-cycle"
    ]
  },
  {
    "id": "sta-25",
    "company": "intel",
    "companyName": "Intel",
    "domain": "static-timing-analysis",
    "domainName": "Static Timing Analysis (STA & SI)",
    "role": "STA Timing Closure & Signoff Engineer",
    "difficulty": "Staff / Principal",
    "round": "Hiring Manager Round",
    "question": "Classic CRPR removes pessimism on a **shared clock** trunk. Explain **reconvergent fanout pessimism** on the **data** path (or mixed data/clock reconvergence): why graph-based min/max can still be overly pessimistic when two branches diverge and reconverge, and what modern timers do (path-based reconvergence / physical correlation / POCV) to avoid leaving performance on the table—or worse, over-fixing.",
    "shortSummary": "When a signal splits and later reconverges, GBA may pair a late arrival from branch A with an early slew or side status from branch B as if both extremes coexist. That correlation is illegal. Path-based analysis, reconvergence pessimism removal options, and statistical POCV reduce this; blindly waiving without proving mutual exclusivity of extremes is how chips escape.",
    "detailedAnswer": "### Clock CRPR vs data reconvergence\n  - **CRPR**: same physical clock cells cannot be late and early together.\n  - **Data RFP**: a fanout net drives two cones that meet at a gate/mux; GBA’s node-hardening can imply inconsistent extremes on the shared prefix.\n\n  Example: common logic $X$ fans out to path $X\\to A\\to Z$ and $X\\to B\\to Z$. GBA at $Z$ might combine late arc through $A$ with a slew assumption poisoned by $B$’s load, or apply derates as if $X$ were simultaneously at two PVT extremes feeding both branches.\n\n  ### Mitigations\n  1. **PBA** on the specific reconvergent endpoint — path-consistent slew/derate\n  2. **POCV** — shared prefix variance counted once in statistical combination\n  3. Tool settings for **data path reconvergence pessimism removal** (vendor-specific; know your timer)\n  4. Physical: buffer/clone to isolate critical branch from poison fanout (also helps SI)\n\n  ### Staff judgment\n  Interviewers want you to say: “I quantify GBA→PBA recovery attributable to reconvergence, confirm SI and constraints are clean, then either accept bounded PBA credit or clone/buffer the critical leg.” Not: “RFP means always disable derates.”",
    "commonPitfalls": [
      "Calling every GBA→PBA delta “CRPR” when the clock tree doesn’t even reconverge.",
      "Fixing with `set_timing_derate 1.0` globally to hide RFP."
    ],
    "interviewerFollowups": [
      "How do mux select case_analysis values interact with reconvergent pessimism?",
      "Does useful skew create new reconvergent clock pairs that change CRPR credit overnight?"
    ],
    "tags": [
      "reconvergence",
      "rfp",
      "gba-pba",
      "pocv",
      "pessimism-removal",
      "correlation"
    ]
  },
  {
    "id": "syn-32",
    "company": "qualcomm",
    "companyName": "Qualcomm",
    "domain": "synthesis-sdc",
    "domainName": "Logic Synthesis & SDC Constraints",
    "role": "Synthesis & Timing Constraints Engineer",
    "difficulty": "Hard",
    "round": "Onsite Technical Round 1",
    "question": "Write production-quality SDC using `set_data_check` for a glitch-free clock mux: select must be stable before the losing clock’s edge and remain stable (hold) after switchover. Contrast this with `set_max_delay` between the same pins, and explain when Liberty already has a non-sequential arc so a data check would double-constrain.",
    "shortSummary": "Data checks express pin-to-pin setup/hold-like relationships outside normal flop arcs. For mux select vs clock pins, use paired `-setup` and `-hold` data checks (with explicit clocks when multi-clock). `set_max_delay` is a path-delay budget without the same edge semantics — weaker / different. If the mux `.lib` already defines non-seq checks, don’t duplicate blindly.",
    "detailedAnswer": "### Why synthesis/SDC owners care\n  RTL clock muxes and soft-IP wrappers often lack complete sequential arcs at the chip level. Without data checks, Genus/Innovus may report green R2R while select races clocks.\n\n  ### Example\n  ```sdc\n  # Select must settle before CLK_A samples the mux (setup-like)\n  set_data_check -from [get_pins u_cmux/S] \\\n                 -to   [get_pins u_cmux/CLK_A] \\\n                 -setup 0.200\n\n  # Select must not change too soon after the switch event (hold-like)\n  set_data_check -from [get_pins u_cmux/S] \\\n                 -to   [get_pins u_cmux/CLK_A] \\\n                 -hold 0.050\n\n  # Repeat vs CLK_B as architecture requires; associate -clock when needed\n  ```\n\n  ### `set_max_delay` contrast\n  `set_max_delay 0.2 -from S -to CLK_A` constrains combinational delay along paths but does **not** cleanly replace recovery-style “stable before edge” semantics for arbitrary pins, and can fight clock-path timing.\n\n  ### Double-constraint hazard\n  Read Liberty: if `timing_type : non_seq_setup|non_seq_hold` exists on those pins, prefer library arcs; extra SDC may create impossible requirements.",
    "commonPitfalls": [
      "Only coding setup data check — hold select races still ship.",
      "Data checks then `set_false_path -to` the same pins “to clean QoR.”"
    ],
    "interviewerFollowups": [
      "How do data checks show up in synthesis vs signoff STA path groups?",
      "Interaction with `set_case_analysis` on mux select in test modes?"
    ],
    "tags": [
      "set_data_check",
      "clock-mux",
      "non-sequential",
      "sdc",
      "synthesis"
    ]
  },
  {
    "id": "syn-33",
    "company": "nvidia",
    "companyName": "Nvidia",
    "domain": "synthesis-sdc",
    "domainName": "Logic Synthesis & SDC Constraints",
    "role": "Synthesis & Timing Constraints Engineer",
    "difficulty": "Hard",
    "round": "Technical Phone Screen",
    "question": "What does `set_max_skew` constrain, and how is it different from `set_max_delay` / `set_min_delay` on a bus? Give a use case for source-synchronous DDR-style data vs strobe balance and a use case for bounded skew among clock sinks before CTS. What goes wrong if you apply tight max skew too early in logic synthesis with ideal clocks?",
    "shortSummary": "`set_max_skew` limits the **arrival difference** among a set of related pins/nets, not the absolute path delay. Absolute max/min delay bound each path independently; skew bounds the spread. Ideal-clock synthesis cannot meaningfully close leaf-level clock skew — apply sink skew targets primarily to CTS/PnR, while data-bus skew constraints need real propagated delays / physical context.",
    "detailedAnswer": "### Semantics\n  For pins $\\{p_i\\}$ in a skew group with limit $S$:\n  $$\n  \\max_i t_{\\text{arr}}(p_i) - \\min_j t_{\\text{arr}}(p_j) \\le S\n  $$\n\n  ### Use cases\n  1. **Source-synchronous**: data\\[63:0\\] vs `dqs` arrival skew within eye budget\n  2. **Reset tree** balance (sometimes) — careful with recovery\n  3. **Clock sinks** bounded skew (usually a CTS property; SDC max_skew may assist reporting)\n\n  ### Vs max/min delay\n  You can meet max delay on every bit yet still violate skew if one bit is fast and one is slow-but-still-under-max. Conversely, skew-only without max delay can allow all bits late together.\n\n  ### Ideal clock trap\n  In Genus pre-CTS, clock network latency is ideal/estimated — forcing tiny `set_max_skew` on flop CK pins either no-ops, fights the ideal model, or causes bizarre optimization. Prefer:\n  - Data-path skew groups on buses with physical awareness\n  - Clock skew budgets as CTS specs (`skew_group`, CCOpt properties), not fake pre-CTS SDC",
    "tclOrVerilogSnippet": {
      "lang": "sdc",
      "code": "set_max_skew 0.050 -from [get_ports {data[*]}] -to [get_ports dqs]\n  # Tool-specific variants exist for -group / objects; check reference manual"
    },
    "commonPitfalls": [
      "Using max skew as a substitute for IO timing windows (`set_input_delay` / output).",
      "Forgetting min-delay / hold when balancing a bus (skew fix inserts delay buffers that heal setup skew but can break hold)."
    ],
    "interviewerFollowups": [
      "How does SI delta delay destroy a skew-closed bus?",
      "Skew groups across voltage domains with level shifters?"
    ],
    "tags": [
      "set_max_skew",
      "source-synchronous",
      "bus-balance",
      "cts",
      "sdc"
    ]
  },
  {
    "id": "syn-34",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "synthesis-sdc",
    "domainName": "Logic Synthesis & SDC Constraints",
    "role": "Synthesis & Timing Constraints Engineer",
    "difficulty": "Hard",
    "round": "Onsite Deep-Dive",
    "question": "A designer inserts an inverting clock buffer and models it with a separate `create_clock` on the buffer output. Why is that often wrong? Explain correct use of `create_generated_clock -invert` / `-combinational`, how edge sense propagates into setup/hold equations, and what breaks in CRPR and clock-gating checks when invert sense is mis-modeled.",
    "shortSummary": "A physically derived inverted clock must remain in the **generated clock** relationship to its source so latency, uncertainty, and common-path credit stay consistent. A fresh `create_clock` treats it as an independent root — false asynchronous behavior, wrong edges, broken CRPR. `-invert` flips which source edge defines rising/falling of the generated clock.",
    "detailedAnswer": "### Correct modeling\n  ```sdc\n  create_clock -name CLK -period 2.0 [get_ports clk]\n  create_generated_clock -name CLK_N -source [get_ports clk] \\\n    -master_clock CLK -invert \\\n    [get_pins u_inv/Y]\n  ```\n\n  For a non-inverting divider:\n  ```sdc\n  create_generated_clock -name CLK_DIV2 -source [get_ports clk] \\\n    -divide_by 2 [get_pins u_div/Q]\n  ```\n\n  ### Edge sense in equations\n  Inversion swaps which master edge launches/captures for rising generated edges. Half-cycle paths between CLK and CLK_N become intentional — STA must see them as generated, not async.\n\n  ### Failure modes of “new create_clock”\n  - `set_clock_groups -asynchronous` accidentally applied → real paths false-pathed\n  - Network latency duplicated or zeroed incorrectly\n  - CRPR cannot see shared trunk through the inverter\n  - ICG gating checks use wrong related edge\n\n  ### Combinational generated clocks\n  Clock mux outputs often need `-combinational` generated clocks for each select path, plus exclusivity — not covered by inventing independent clocks.",
    "commonPitfalls": [
      "Modeling PLL feedback invert incorrectly → period/phase shift errors.",
      "Forgetting to update generated clock after CTS moves the invert buffer."
    ],
    "interviewerFollowups": [
      "How do you constrain both phases of a DDR clock pair?",
      "`set_clock_sense` vs generated `-invert` — when each applies?"
    ],
    "tags": [
      "generated-clock",
      "invert",
      "clock-sense",
      "crpr",
      "half-cycle"
    ]
  },
  {
    "id": "syn-35",
    "company": "intel",
    "companyName": "Intel",
    "domain": "synthesis-sdc",
    "domainName": "Logic Synthesis & SDC Constraints",
    "role": "Synthesis & Timing Constraints Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Technical Round 1",
    "question": "Explain `set_clock_sense` (positive/negative/stop) and broader `set_sense` usage on pins. When do you **stop** clock propagation through a gate, when do you force positive/negative sense, and how can wrong sense create false half-cycle paths or hide real ones? Contrast with `set_disable_timing` and `set_case_analysis`.",
    "shortSummary": "Clock sense controls how a clock is considered to propagate through a pin (non-inverting, inverting, or not at all). Use stop at intentional clock blockers (synced disables, scan-only logic) when case analysis isn’t enough. Forcing sense is for known unate/inversion the timer mis-infers. `set_disable_timing` kills arcs; `set_case_analysis` constants pins — different hammers.",
    "detailedAnswer": "### Typical controls\n  ```sdc\n  # Do not propagate clock beyond this pin\n  set_clock_sense -stop_propagation -clock CLK [get_pins u_gate/S]\n\n  # Force inverted sense through a logically inverting cell the timer got wrong\n  set_clock_sense -negative -clock CLK [get_pins u_odd_cell/Z]\n  ```\n\n  ### When stop_propagation is legitimate\n  - Clock feeds a data-only OR structure in test that is architecturally gated off\n  - Explicit documentation that functional clock cannot emerge at that pin\n  - Paired with physical/DFT review — never to silence QoR\n\n  ### Contrast\n  | Construct | Effect |\n  | :--- | :--- |\n  | `set_clock_sense -stop` | Clock identity stops; data may still time |\n  | `set_disable_timing` | Removes timing arc(s) entirely |\n  | `set_case_analysis` | Constants a pin → disables alternate arcs |\n  | `set_false_path` | Keeps arcs but excludes path checking |\n\n  ### Danger\n  Stopping sense on a real functional branch hides paths → silicon fails while STA is green. Staff answer always includes “prove mutual exclusivity / architecture sign-off.”",
    "commonPitfalls": [
      "Using stop_propagation instead of fixing a clock mux modeling problem.",
      "Global sense commands without `-clock` in multi-clock cones."
    ],
    "interviewerFollowups": [
      "How does sense interact with clock gating check generation?",
      "Tool differences: `set_sense` vs `set_clock_sense` naming?"
    ],
    "tags": [
      "set_clock_sense",
      "set_sense",
      "stop-propagation",
      "unate",
      "sdc"
    ]
  },
  {
    "id": "syn-36",
    "company": "apple",
    "companyName": "Apple Silicon",
    "domain": "synthesis-sdc",
    "domainName": "Logic Synthesis & SDC Constraints",
    "role": "Synthesis & Timing Constraints Engineer",
    "difficulty": "Staff / Principal",
    "round": "Onsite Deep-Dive",
    "question": "Derive how `set_input_delay` / `set_output_delay` interact with clock **source** and **network** latency. What do `-network_latency_included` and `-source_latency_included` mean, when must you set them, and what double-counting bug appears if board/source latency is already inside the external delay number *and* also applied via `set_clock_latency`?",
    "shortSummary": "By default, many flows treat external delay as **data path outside the chip**, while clock latency (source+network) still applies to the related clock. If your external delay number already bundled board clock tree delay, you must declare `*_latency_included` so STA does not add latency again. Wrong flags cause systematic I/O WNS or false optimism.",
    "detailedAnswer": "### Mental model (input setup)\n  Virtual or pad-referred clock $C$:\n  $$\n  S_{\\text{in,setup}} \\approx T - T_{\\text{input\\_delay}} - T_{\\text{combo_to_first_ff}} - T_{\\text{su}} + \\text{(capture clock arrival terms)}\n  $$\n\n  Capture arrival includes source/network latency unless excluded by modeling flags and ideal/propagated mode.\n\n  ### What the flags assert\n  - **`network_latency_included`**: the specified external delay already contains the on-chip (or specified) network latency portion of the related clock — don’t add network latency again when applying that delay.\n  - **`source_latency_included`**: similarly for source (board/PLL off-chip) latency already baked into the delay number.\n\n  Exact default semantics are tool-specific — **read the reference** — but the interview concept is **double-counting vs under-counting** of latency relative to how the delay was characterized.\n\n  ### Industrial scenarios\n  1. Timing budget spreadsheet gives “input delay = 0.6 ns including board clock tree 0.25 ns” → need source latency included flag **or** strip 0.25 ns out of the delay and model latency separately (prefer one source of truth).\n  2. Pure package delay with virtual clock and zero `set_clock_latency` → usually **no** included flags.\n  3. Post-CTS: network latency becomes propagated — revisit I/O constraints that assumed ideal network latency numbers.\n\n  ### Staff hygiene rule\n  Pick one accounting system:\n  - **A:** External delay = data-only; latency only via `set_clock_latency` / propagated clocks\n  - **B:** External delay bundles some latency; declare included flags accordingly  \n\n  Never mix A and B across interfaces on the same chip.",
    "tclOrVerilogSnippet": {
      "lang": "sdc",
      "code": "create_clock -name VCLK_SYS -period 2.0\n  set_clock_latency 0.25 [get_clocks VCLK_SYS]   ;# board source latency model\n\n  # If input_delay is data-path ONLY (preferred):\n  set_input_delay -clock VCLK_SYS -max 0.35 [get_ports rx_data*]\n\n  # If spreadsheet delay already includes that 0.25 source latency:\n  # set_input_delay -clock VCLK_SYS -max 0.60 \\\n  #   -source_latency_included [get_ports rx_data*]"
    },
    "commonPitfalls": [
      "Copy-pasting included flags from another project with different spreadsheet conventions.",
      "Forgetting hold external delays need the same accounting consistency."
    ],
    "interviewerFollowups": [
      "How do these flags interact with `set_clock_latency -source` vs `-network` separately?",
      "Virtual clock vs real pad clock as `-clock` reference for chip I/O?"
    ],
    "tags": [
      "set_input_delay",
      "set_output_delay",
      "network_latency_included",
      "source_latency_included",
      "io-timing",
      "virtual-clock"
    ]
  }
];
