# Ace-Seek Advanced VLSI Engines: Architecture & Algorithmic Blueprint

**Author:** Ace-Seek Core Architecture Team  
**Status:** Under Verification / Proposed Implementation  
**Target Flow:** OpenROAD Studio & Autonomous Physical Implementation  

---

## 1. Executive Summary

In modern Application-Specific Integrated Circuit (ASIC) and System-on-Chip (SoC) design, **Floorplanning and Macro Placement is the single most critical determinant of final Power, Performance, and Area (PPA)**. Suboptimal macro placement leads directly to:
1. **Irrecoverable Routing Congestion**: Pin access channels between adjacent SRAM/macro blocks choke detailed routing, leading to DRC violations.
2. **Timing Closure Failure**: Excessive wirelength on critical control and datapath lines crossing across macro clusters destroys setup and hold slack.
3. **Power Strapping Inefficiencies**: Broken standard-cell power rails and excessive IR drop around macro boundaries.

Current open-source engines in OpenROAD (such as **TritonMacroPlace** and **Hier-RTLMP**) rely primarily on rigid perimeter placement and stochastic simulated annealing. They struggle when:
- Macro count exceeds 10–16 blocks.
- The design exhibits tight datapath coupling between macros and standard cells.
- Macros have asymmetric pin distributions.

This blueprint specifies the architecture, mathematics, and integration strategy for building Ace-Seek's proprietary EDA engines:
* **Ace-AutoMacro**: A GPU/CPU-accelerated continuous mixed-size macro placer based on 2D Poisson electrostatic field theory, dynamic virtual bloating, and differentiable pin orientation (inspired by AutoDMP / DREAMPlace).
* **Ace-Carta**: A topological datapath and hypergraph clustering engine that reconstructs algorithmic dataflow hierarchies before placement.
* **Ace-RoutePredict**: An instant neural surrogate predicting detailed routing DRC and congestion hotspots in <500ms before running full routing.

---

## 2. Comparative Engine Landscape

| Feature | OpenROAD TritonMacroPlace | Google Circuit Training | NVIDIA AutoDMP | **Ace-Seek Ace-AutoMacro** |
|---|---|---|---|---|
| **Core Method** | Perimeter Annealing / Heuristics | Reinforcement Learning (PPO) | Continuous Electrostatics + BO | **Continuous Electrostatics + Dataflow Graphs** |
| **Cell-Macro Optimization** | Decoupled (Macros first, cells later) | Mixed (Coarse grid representation) | Concurrent (DREAMPlace mixed-size) | **Concurrent (Mixed-size + Pin Torque)** |
| **Runtime** | 10–30 min | 24–48 hours (Massive GPU compute) | 2–5 min (GPU) / 10 min (CPU) | **1–3 min (CPU / GPU hybrid)** |
| **Scalability** | Fails above ~16 macros | High (requires heavy training) | High (>100 macros) | **High (1 to 128+ macros)** |
| **Hardware Required** | CPU only | Cloud TPU / Multi-GPU cluster | NVIDIA GPU | **CPU native + optional PyTorch/CUDA** |
| **OpenROAD Integration** | Native | External wrapper | External PyTorch script | **Direct ODB / DEF Native Plugin** |

---

## 3. Algorithmic Formulation of Ace-AutoMacro

### 3.1 Unconstrained Continuous Optimization Formulation

Rather than solving a discrete combinatorial problem over legal grid locations, **Ace-AutoMacro** maps macro placement into an unconstrained, continuous non-linear optimization problem.

Let:
* $\mathcal{M} = \{m_1, m_2, \dots, m_K\}$ be the set of macro blocks with widths $w_k$, heights $h_k$, and center coordinates $\mathbf{p}_k = (x_k, y_k)$.
* $\mathcal{C} = \{c_1, c_2, \dots, c_N\}$ be the standard cells with dimensions $(w_i, h_i)$ and coordinates $(x_i, y_i)$.
* $\mathcal{E}$ be the set of hyperedges (nets) connecting pins of macros and standard cells.

We minimize the composite objective function $\mathcal{L}(\mathbf{x}, \mathbf{y})$:

$$\min_{\mathbf{x}, \mathbf{y}} \mathcal{L}(\mathbf{x}, \mathbf{y}) = \mathcal{W}(\mathbf{x}, \mathbf{y}) + \lambda \cdot \mathcal{D}(\mathbf{x}, \mathbf{y}) + \beta \cdot \mathcal{B}(\mathbf{x}, \mathbf{y}) + \gamma \cdot \mathcal{T}(\mathbf{x}, \mathbf{y})$$

Where:
1. $\mathcal{W}(\mathbf{x}, \mathbf{y})$: Differentiable Wirelength Approximation
2. $\mathcal{D}(\mathbf{x}, \mathbf{y})$: Electrostatic Overlap & Density Penalty
3. $\mathcal{B}(\mathbf{x}, \mathbf{y})$: Boundary Guiding & Channel Allocation Potential
4. $\mathcal{T}(\mathbf{x}, \mathbf{y})$: Differentiable Pin-Orienting Torque

---

### 3.2 Differentiable Wirelength: Weighted-Average (WA) Model

The traditional Half-Perimeter Wirelength (HPWL) for a net $e \in \mathcal{E}$:
$$\text{HPWL}(e) = \left( \max_{i \in e} x_i - \min_{i \in e} x_i \right) + \left( \max_{i \in e} y_i - \min_{i \in e} y_i \right)$$
is non-differentiable due to the $\max$ and $\min$ operations.

We use the **Weighted-Average (WA)** wirelength formulation with smoothing factor $\gamma$:

$$\mathcal{W}_e(\mathbf{x}) = \left( \frac{\sum_{i \in e} x_i \cdot \exp(x_i / \gamma)}{\sum_{i \in e} \exp(x_i / \gamma)} - \frac{\sum_{i \in e} x_i \cdot \exp(-x_i / \gamma)}{\sum_{i \in e} \exp(-x_i / \gamma)} \right)$$

$$\mathcal{W}(\mathbf{x}, \mathbf{y}) = \sum_{e \in \mathcal{E}} q(e) \cdot \left[ \mathcal{W}_e(\mathbf{x}) + \mathcal{W}_e(\mathbf{y}) \right]$$

Where $q(e)$ is the net-degree bounding box normalization factor:
$$q(e) = \frac{1}{|e| - 1} \quad \text{for } |e| > 3$$

The gradient $\nabla \mathcal{W}_e(x_i)$ is continuous, smooth, and easily vectorized across all nets using PyTorch or C++ Eigen.

---

### 3.3 Electrostatic Density Field & 2D Poisson Equation

To eliminate cell and macro overlap without rigid grid snapping during optimization, we model all cells and macros as **electrostatic charges**:
- Standard cells have charge proportional to their area.
- Macros have charge proportional to their inflated bounding box.
- The chip canvas is a dielectric medium of size $W_{\text{core}} \times H_{\text{core}}$.

The electrostatic potential field $\psi(x, y)$ satisfies the **2D Poisson Equation**:

$$\nabla^2 \psi(x, y) = -\left( \rho(x, y) - \rho_{\text{target}} \right)$$

With Neumann boundary conditions:
$$\mathbf{n} \cdot \nabla \psi = 0 \quad \text{at core boundaries}$$

#### Solving via 2D Fast Cosine Transform (DCT):
Discretizing the core into an $M \times N$ grid (typically $512 \times 512$ or $1024 \times 1024$ bins):
1. Compute the bin density $\rho_{u, v}$ by projecting cell/macro shapes with smooth B-spline or bell-shaped smoothing kernels:
   $$K(x) = \begin{cases} 1 - 2x^2 & 0 \le |x| \le 0.5 \\ 2(1 - |x|)^2 & 0.5 < |x| \le 1 \\ 0 & |x| > 1 \end{cases}$$
2. Compute the 2D DCT-II of the zero-mean charge density:
   $$\hat{\rho}_{u, v} = \text{DCT-2D}(\rho - \bar{\rho})$$
3. Compute the spectral potential field:
   $$\hat{\psi}_{u, v} = \frac{\hat{\rho}_{u, v}}{\omega_u^2 + \omega_v^2} \quad \forall (u, v) \neq (0, 0)$$
   where $\omega_u = 2 \sin\left(\frac{u \pi}{2M}\right)$ and $\omega_v = 2 \sin\left(\frac{v \pi}{2N}\right)$.
4. Invert to obtain the spatial potential and electric field $\mathbf{E} = -\nabla \psi$:
   $$\psi = \text{IDCT-2D}(\hat{\psi})$$
   $$\mathbf{E}_x = -\frac{\partial \psi}{\partial x}, \quad \mathbf{E}_y = -\frac{\partial \psi}{\partial y}$$

The repulsive force driving apart overlapping macros and dense cell clusters is simply:
$$\mathbf{F}_{\text{density}}(i) = q_i \cdot \mathbf{E}(\mathbf{p}_i)$$

Complexity: $\mathcal{O}(M N \log(MN))$ per iteration, executing in **<15 milliseconds** per step on a modern CPU/GPU.

---

### 3.4 Dynamic Macro Virtual Bloating

In real chip floorplans, macros must not only avoid overlapping with each other; they must also leave wide enough **routing channels** and **keepout halos** for:
1. Power distribution straps (VDD / VSS rings).
2. Pin access routing escape.
3. Standard-cell buffer insertion along long bus lines.

**Ace-AutoMacro** introduces an automated **Dynamic Virtual Bloating** schedule:
$$w_k^{(t)} = w_k + 2 \cdot H_x^{(t)}, \quad h_k^{(t)} = h_k + 2 \cdot H_y^{(t)}$$

$$H_x^{(t)} = H_{\text{min}} + H_{\text{virtual}} \cdot \exp(-t / \tau_H)$$

- In the initial placement phase ($t < 100$), macros are virtually inflated by up to 200%, pushing surrounding logic away and carving wide routing corridors.
- As the system cools ($t \to t_{\text{final}}$), the virtual inflation decays to the target manufacturing halo $H_{\text{min}}$ (e.g., $10\,\mu\text{m}$ for Sky130).

---

### 3.5 Differentiable Macro Orientation & Pin Escape Torque

A major defect in existing placers is that macros are placed with suboptimal orientations—e.g., placing a macro such that its address/data pins face directly against the die edge, forcing routing wires to loop 180 degrees around the macro.

**Ace-AutoMacro** models macro orientation continuously:
For each macro $k$, we compute the net pulling force on its external pins:
$$\mathbf{F}_{\text{pins}}(k) = \sum_{p \in \text{pins}(k)} \sum_{j \in \text{net}(p)} \nabla \mathcal{W}(\mathbf{p}_p, \mathbf{p}_j)$$

The rotational moment (torque) around the macro center is:
$$\tau_k = \sum_{p \in \text{pins}(k)} (\mathbf{r}_p - \mathbf{p}_k) \times \mathbf{F}_{\text{pins}}(p)$$

At discrete checkpoints during global optimization, macro orientations are evaluated across legal symmetries $\{R0, R90, R180, R270, MX, MY\}$ against:
$$\Delta \mathcal{W} = \mathcal{W}(O_{\text{new}}) - \mathcal{W}(O_{\text{current}})$$
If $\Delta \mathcal{W} < 0$ and does not increase overlap penalty, the orientation is committed.

---

### 3.6 Continuous Optimization Solver: Nesterov's Accelerated Gradient Descent

We solve the continuous system using **Nesterov's Accelerated Gradient Descent with Adaptive Line Search and Momentum**:

$$\mathbf{v}^{(t+1)} = \mathbf{p}^{(t)} - \eta_t \cdot \nabla \mathcal{L}(\mathbf{p}^{(t)})$$
$$\mathbf{p}^{(t+1)} = (1 + \mu_t) \cdot \mathbf{v}^{(t+1)} - \mu_t \cdot \mathbf{v}^{(t)}$$

Where:
- $\eta_t$ is dynamically scaled inversely to the maximum gradient norm $\max_i \|\nabla \mathcal{L}_i\|$.
- Density penalty weight $\lambda_t$ is updated adaptively:
  $$\lambda_{t+1} = \lambda_t \cdot \min\left(1.05, \max\left(0.95, \frac{\text{overflow}_t}{\text{target\_overflow}}\right)\right)$$

---

## 4. Macro Legalization & Geometry Snapping

Continuous optimization produces continuous coordinates $(x_k^*, y_k^*)$ where macros may have slight residual overlaps or misalignments with the chip grid.

The legalization pipeline operates in three deterministic stages:

1. **Boundary Attraction & Corner Docking**:
   Macros near edges are snapped to the outer ring boundaries if the distance is within threshold $\delta_{\text{dock}}$, ensuring standard cell placement retains large contiguous rectangular regions.
2. **Topological Constraint Graphs**:
   Construct horizontal constraint graph $G_H = (\mathcal{M}, E_H)$ and vertical constraint graph $G_V = (\mathcal{M}, E_V)$:
   $$x_j - x_i \ge w_i + W_{\text{channel}} \quad \forall (i, j) \in E_H$$
   $$y_j - y_i \ge h_i + H_{\text{channel}} \quad \forall (i, j) \in E_V$$
   Solved via Bellman-Ford or Longest Path on DAG to eliminate all overlaps with minimal deviation from continuous positions:
   $$\min \sum_{k \in \mathcal{M}} \|\mathbf{p}_k - \mathbf{p}_k^*\|^2$$
3. **Power Grid & Manufacturing Pitch Alignment**:
   Snap all macro bounds to standard cell site rows ($y = n \cdot H_{\text{row}}$) and vertical power strap pitches ($x = m \cdot P_{\text{VDD}}$).

---

## 5. Software Architecture & OpenROAD Studio Integration

The engine is architected as a modular component inside the Ace-Seek platform:

```text
ace-seek/
├── workers/
│   └── engines/
│       └── macro_placer/
│           ├── __init__.py
│           ├── core/
│           │   ├── wirelength.py        # Differentiable WA/LSE wirelength kernels
│           │   ├── electrostatics.py    # 2D DCT Poisson solver (NumPy/PyTorch)
│           │   ├── inflation.py         # Dynamic virtual bloating schedule
│           │   ├── orientation.py       # Pin torque evaluation & rotation
│           │   └── optimizer.py         # Nesterov gradient descent
│           ├── legalizer/
│           │   ├── constraint_graph.py  # DAG longest-path overlap remover
│           │   └── snap_grid.py         # PDK site row & PDN pitch alignment
│           ├── io/
│           │   ├── lef_def_parser.py    # High-speed LEF/DEF reader & writer
│           │   └── odb_bridge.py        # Direct OpenROAD Python C++ binding
│           └── cli.py                   # ace-macro-place entry point
```

### Flow Execution Hook
In `workers/openroad/run_until.tcl` and `ace-seek-flow.json`, the user can toggle the engine:
```json
{
  "macroPlacementEngine": "ace_automacro",
  "macroOptions": {
    "haloX": 10.0,
    "haloY": 10.0,
    "channelMin": 15.0,
    "boundaryDocking": true
  }
}
```

When invoked:
1. OpenROAD exports floorplanned DEF + LEF after IO pin placement.
2. `ace-macro-place` optimizes macro positions in <60 seconds.
3. OpenROAD reads the optimized DEF, locks macro positions (`PLACED / LOCKED`), and continues directly to standard-cell global placement.

---

## 6. Verification & Implementation Roadmap

### Primary Validation Metrics
- **Half-Perimeter Wirelength (HPWL)**: Target $\ge 12\%$ reduction compared to TritonMacroPlace.
- **Worst Negative Slack (WNS)**: Zero timing degradation; target $\ge 15\%$ slack improvement due to shorter critical datapath links.
- **Routing DRC Violations**: Zero macro channel shorts; $>30\%$ reduction in routing congestion hotspots (RUDY).
- **Runtime**: $<90$ seconds on CPU for designs with up to 32 macros and 100k standard cells.
