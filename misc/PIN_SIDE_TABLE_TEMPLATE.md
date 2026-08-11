# Pin / pad side table (fill for your chip)

Die sides: **N** north, **E** east, **S** south, **W** west.

| # | Package name | Core net | In/Out | Cell name | H/V | Side | Order from corner | Notes |
|---|--------------|----------|--------|-----------|-----|------|-------------------|-------|
| 1 | (corner) | — | — | PCORNER | — | NW | 0 | |
| 2 | (vdd) | — | pwr | PVDD1CDGM_V | V | W | 1 | |
| 3 | pad_clk | core_clk | in | PDIDWUWSWCDG_V | V | W | 2 | |
| 4 | pad_rst_n | core_rst_n | in | PDIDWUWSWCDG_V | V | W | 3 | |
| … | | | | | | | | |
| | pad_busy | core_busy | out | PDDWUWSWCDG_V | V | E | | OEN=0? |
| | pad_result_o[0] | core_result_o[0] | out | PDDWUWSWCDG_V | V | E | | |
| | (fill) | — | — | PFILLER01008 | | | | |
| | (corner) | — | — | PCORNER | — | NE | 0 | |

Count signals on your chip:

- Inputs: clk, rst_n, start, cmd×3, data×8, addr_i×3, addr_b×3, alu_op×3, wb_en → **24 inputs**
- Outputs: busy, done, err, result×16, fifo_empty, fifo_full, zero, carry → **23 outputs**
- Total signal pads ≈ **47** + power + corners + fillers
