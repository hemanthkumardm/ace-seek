---
title: "md2pdf smoke test"
author: "local compiler"
date: "2026"
---

# Markdown + LaTeX math

This file checks dollar-math, backslash-math, tables, and code.

## Inline math (dollars)

Setup time \( t_{su} \) and hold time \( t_h \) must satisfy:

- Capture: $t_{clk\to q} + t_{pd} + t_{su} \le T_{clk}$
- Hold: $t_{clk\to q} + t_{cd} \ge t_h$

## Display math (dollars)

$$
T_{clk} \ge t_{cq} + t_{logic} + t_{su} + t_{skew}
$$

## Display math (single backslash — common in notes)

\[
WNS = \min_{p \in paths}\bigl(T_{clk} - t_{arrival}(p) + t_{required}(p)\bigr)
\]

Slack for path \(p\):

\[
slack(p) = t_{required}(p) - t_{arrival}(p)
\]

## Aligned equations

\begin{align}
t_{arrival} &= t_{launch} + t_{cq} + t_{pd} \\
t_{required} &= t_{capture} + T_{clk} - t_{su} - t_{uncertainty}
\end{align}

## Table

| Metric | Meaning              | Unit |
|--------|----------------------|------|
| WNS    | Worst Negative Slack | ns   |
| TNS    | Total Negative Slack | ns   |
| FEP    | Failing Endpoints    | —    |

## Code

```tcl
report_timing -max_paths 100 -nworst 1 -delay_type max
```

## Link

See [Pandoc manual](https://pandoc.org/MANUAL.html) for filter / template docs.
