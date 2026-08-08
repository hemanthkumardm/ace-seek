# How to Write UPF & CPF — Detailed Reference

**Purpose:** Industry power-intent authoring — every construct, multi-voltage, retention, Genus consumption. Not limited to one chip.  
**Primary standard:** **UPF (IEEE 1801)** for all new work.  
**Secondary:** **CPF** legacy map only.  
**Examples (optional):** `practice/upf/*.upf`.  
**Curriculum index:** `GENUS_COMPLETE_INDEX.md`.  
**Related:** `LOW_POWER_SYNTHESIS_REFERENCE.md`.

---

## Table of contents

1. [What power intent is (and is not)](#1-what-power-intent-is-and-is-not)
2. [Mental model before typing a single line](#2-mental-model-before-typing-a-single-line)
3. [Recommended order of writing a UPF](#3-recommended-order-of-writing-a-upf)
4. [Line-by-line: `pad_top_practice.upf`](#4-line-by-line-pad_top_practiceupf)
5. [UPF command encyclopedia](#5-upf-command-encyclopedia)
6. [Line-by-line: `pad_top_practice.cpf`](#6-line-by-line-pad_top_practicecpf)
7. [CPF command encyclopedia](#7-cpf-command-encyclopedia)
8. [UPF ↔ CPF concept map](#8-upf--cpf-concept-map)
9. [Multi-voltage UPF — full changes vs single-voltage](#9-multi-voltage-upf--full-changes-vs-single-voltage)
10. [Retention (SRPG) — when you need it](#10-retention-srpg--when-you-need-it)
11. [Authoring checklist & common mistakes](#11-authoring-checklist--common-mistakes)
12. [How Genus consumes the file](#12-how-genus-consumes-the-file)
13. [Worked “blank page” UPF template](#13-worked-blank-page-upf-template)

---

## 1. What power intent is (and is not)

### 1.1 Is

A **side file** (not RTL) that states:

- Which **instances** belong to which **power domain**
- Which **supply nets** power those domains
- When a domain can be **OFF**
- What happens on **signals crossing** domains (isolation, level shift)
- Which **power modes** are legal (PST)

It is the **golden contract** for Genus, Innovus, simulation, and formal power checks (CLP).

### 1.2 Is not

| Not power intent | Belongs in |
|------------------|------------|
| Clock trees / periods | SDC |
| Boolean function of design | RTL |
| Exact switch cell placement | Floorplan / power plan (later) |
| Clock gating enables | RTL + synth attrs (`lp_insert_clock_gating`) |

You can have **clock gating without UPF**.  
You need **UPF when power can be non-uniform** (gated islands, multi-rail, multi-V).

### 1.3 UPF vs CPF one-liner

| | UPF | CPF |
|--|-----|-----|
| Full name | Unified Power Format (IEEE 1801) | Common Power Format |
| Prefer | **Always for new designs** | Legacy flows |
| Genus | `read_power_intent -1801` | `read_power_intent -cpf` |

---

## 2. Mental model before typing a single line

Draw this for **every** chip before writing UPF:

```text
                    ┌─────────────────────────────────────┐
   Always-on        │  PD_TOP  (pads, wake, AO glue)      │
   VDD / VSS        │                                     │
                    │    ┌───────────────────────────┐    │
   Switchable       │    │ PD_CORE  (u_core)         │    │
   VDD_CORE         │    │  powered by VDD_CORE      │    │
                    │    └───────────┬───────────────┘    │
                    │                │ outputs (need ISO  │
                    │                │ when CORE is OFF)  │
                    └────────────────┼────────────────────┘
                                     ▼
                              clamp 0/1 into AO logic
```

Answer these **before** syntax:

| Question | Your lab answer |
|----------|-----------------|
| What is always on? | `pad_top` shell + pads → **PD_TOP** |
| What can power-gate? | Instance **`u_core`** → **PD_CORE** |
| Same voltage or multi-V? | Same 0.72 V class → **no level shifters** |
| Control signal for off? | **`sw_core_ctrl`** (logic port from UPF) |
| Clamp value when off? | **0** (safe static) |
| Modes? | **RUN** (core on), **SLEEP** (core off) |

If you cannot answer these, do not start coding UPF.

---

## 3. Recommended order of writing a UPF

Write **in this order** (tools and humans both follow it):

```text
1. upf_version
2. Supply nets + ports + connect
3. Power domains + set_domain_supply_net
4. Power switches + logic controls
5. Isolation (+ control)
6. Level shifters (if multi-V)
7. Retention (if needed)
8. Power states / PST
9. Port attributes (related supplies on top ports)
```

**Why this order:** Domains need supplies; switches need domains and supplies; isolation needs domains and often AO supplies; PST needs supplies defined; port attributes need domains.

---

## 4. Line-by-line: `pad_top_practice.upf`

Path: `practice/upf/pad_top_practice.upf`

### 4.1 Header comments (lines 1–24)

```tcl
# pad_top_practice.upf  —  IEEE 1801 ...
# Top design: pad_top
# Hierarchy: pad_top ... u_core → PD_CORE
```

| Why write this | So future-you and Genus users know **scope** (what is intentional vs omitted: no LS, no SRPG). |
| Not executed | Comments are ignored by tools. |

Also documents Genus load commands — operational, not UPF syntax.

---

### 4.2 `upf_version 2.0` (line 26)

```tcl
upf_version 2.0
```

| Item | Detail |
|------|--------|
| **Function** | Declares which UPF language version this file uses |
| **Why** | Commands differ across UPF 1.0 / 2.0 / 2.1 / 3.x; tools parse accordingly |
| **Lab choice** | `2.0` is widely supported for domain/switch/ISO/PST learning |
| **If missing** | Some tools assume a default; **always set it** for portability |
| **Alternatives** | `upf_version 2.1`, `3.0` depending on flow |

---

### 4.3 Supply nets (lines 31–33)

```tcl
create_supply_net  VDD
create_supply_net  VSS
create_supply_net  VDD_CORE
```

| Item | Detail |
|------|--------|
| **Function** | Creates **named electrical supply objects** in the intent database (logical rails) |
| **Why** | Domains, switches, ISO power pins, and PST all **reference** these names |
| **VDD** | Always-on primary digital power |
| **VSS** | Ground (shared) |
| **VDD_CORE** | **Switched** rail that feeds only `PD_CORE` |
| **Is this physical metal?** | No — abstract until power plan / PG in Innovus maps them |
| **If omitted** | Cannot define domain primary supplies or switches cleanly |

**Rule:** One `create_supply_net` per distinct rail name you will talk about.

---

### 4.4 Supply ports (lines 35–36)

```tcl
create_supply_port VDD
create_supply_port VSS
```

| Item | Detail |
|------|--------|
| **Function** | Declares **supply ports** of the design (where power **enters** the design intent) |
| **Why** | Real chips get VDD/VSS from package/pads; intent needs a **boundary** for those supplies |
| **Why not VDD_CORE port?** | In this lab, `VDD_CORE` is **derived** via a switch from `VDD` (internal), not a separate package pin |
| **Multi-V chips** | Often extra ports: `VDD_CPU`, `VDDIO`, etc. |

---

### 4.5 Connect supply net to ports (lines 38–39)

```tcl
connect_supply_net VDD -ports VDD
connect_supply_net VSS -ports VSS
```

| Item | Detail |
|------|--------|
| **Function** | Binds supply **net** object to supply **port** object(s) |
| **Why** | Port is the interface; net is the rail that domains use — they must be **linked** |
| **Pattern** | Usually same name for net and port (`VDD`↔`VDD`) for simplicity |
| **If skipped** | Orphan ports/nets; tools may error or leave supplies incomplete |

---

### 4.6 Domain supply for PD_TOP (lines 42–44) — early reference

```tcl
set_domain_supply_net PD_TOP \
  -primary_power_net  VDD \
  -primary_ground_net VSS
```

| Item | Detail |
|------|--------|
| **Function** | Sets **primary power and ground** for domain `PD_TOP` |
| **Why early?** | Can appear after domain create; in our file domain is created next — some tools want domain first. Order in lab: supply set appears before `create_power_domain PD_TOP` in comments section 1, but **PD_TOP must exist**. |

**Important:** In the actual file, `set_domain_supply_net PD_TOP` is at lines 42–44 **before** `create_power_domain PD_TOP` at line 50. Some tools accept forward reference; **safer authoring order** is:

```tcl
create_power_domain PD_TOP -include_scope
set_domain_supply_net PD_TOP -primary_power_net VDD -primary_ground_net VSS
```

If Genus ever complains, **move** `set_domain_supply_net PD_TOP` to immediately after `create_power_domain PD_TOP`.

| Option | Meaning |
|--------|---------|
| `-primary_power_net VDD` | Logic in this domain is intended to be powered by VDD |
| `-primary_ground_net VSS` | Ground for that domain |

---

### 4.7 Create always-on domain (line 50)

```tcl
create_power_domain PD_TOP -include_scope
```

| Item | Detail |
|------|--------|
| **Function** | Creates power domain **PD_TOP** |
| **`-include_scope`** | Everything in the **current design scope** (top module `pad_top`) that is **not** explicitly put in another domain becomes part of this domain |
| **Why** | Pads + shell logic default into AO domain without listing every pad instance |
| **Alternative** | `-elements {inst1 inst2 …}` to list members only (no default catch-all) |
| **`-default` (older style)** | Similar idea of default domain — version-dependent |

**Without this:** No home for pad cells; intent incomplete.

---

### 4.8 Create switchable domain (line 53)

```tcl
create_power_domain PD_CORE -elements {u_core}
```

| Item | Detail |
|------|--------|
| **Function** | Creates **PD_CORE** and **assigns hierarchical instance** `u_core` to it |
| **`-elements {u_core}`** | Exact instance path relative to top (`pad_top.u_core` in hierarchy terms; in UPF often just `u_core` at top) |
| **Why** | This is the **block you intend to power-gate** |
| **Critical** | Name must match elaborated hierarchy — wrong name → empty domain / check errors |
| **Nested** | Can list more: `{u_core u_other}` or deeper paths `u_core/u_cpu` |

**How to find the name in Genus:**

```tcl
get_db hinsts *u_core*
# or report_hierarchy
```

---

### 4.9 Domain supply for PD_CORE (lines 55–57)

```tcl
set_domain_supply_net PD_CORE \
  -primary_power_net  VDD_CORE \
  -primary_ground_net VSS
```

| Item | Detail |
|------|--------|
| **Function** | Core domain is powered by **switched** net `VDD_CORE`, ground still `VSS` |
| **Why VDD_CORE not VDD** | So turning off the switch removes power from core only |
| **Why shared VSS** | Typical single-ground design; split ground is rare/special |

---

### 4.10 Power switch (lines 63–69)

```tcl
create_power_switch sw_core \
  -domain PD_CORE \
  -input_supply_port  {vin VDD} \
  -output_supply_port {vout VDD_CORE} \
  -control_port       {ssctrl sw_core_ctrl} \
  -on_state  {full_on  vin  {ssctrl}} \
  -off_state {full_off {~ssctrl}}
```

Break down **each option**:

| Option | Value in lab | Function | Why |
|--------|--------------|----------|-----|
| (name) | `sw_core` | Switch object name | Referenced in reports/debug |
| `-domain` | `PD_CORE` | Domain this switch serves | Associates switch with gated domain |
| `-input_supply_port {vin VDD}` | Local port name `vin` tied to net **VDD** | Always-on source of power | Power comes from AO rail |
| `-output_supply_port {vout VDD_CORE}` | Local `vout` → **VDD_CORE** | Gated rail output | Feeds domain primary power |
| `-control_port {ssctrl sw_core_ctrl}` | Local control `ssctrl` linked to net/port **sw_core_ctrl** | On/off pin of switch | PMU drives this in real silicon |
| `-on_state {full_on vin {ssctrl}}` | State name `full_on`: output connected to `vin` when `ssctrl` true | Defines **ON** boolean | When control active → rail on |
| `-off_state {full_off {~ssctrl}}` | OFF when control false | Defines **OFF** | When control inactive → rail off |

| Concept | Meaning |
|---------|---------|
| **Abstract switch** | Not yet a library header cell — implementation maps it later |
| **Polarity** | Here active-high `ssctrl` = ON; isolation uses **low** sense on same signal carefully — see isolation section |
| **Why required for gating** | Without switch (or equivalent), `VDD_CORE` has no defined path from `VDD` |

**Polarity consistency note:**  
If `ssctrl` true = power ON, then isolation when OFF should activate when control is **low** (`-isolation_sense low`). That matches this lab.

---

### 4.11 Logic port / net for control (lines 72–74)

```tcl
create_logic_port -direction in sw_core_ctrl
create_logic_net sw_core_ctrl
connect_logic_net sw_core_ctrl -ports sw_core_ctrl
```

| Command | Function | Why |
|---------|----------|-----|
| `create_logic_port -direction in sw_core_ctrl` | Creates a **logic** input port on the design (not a supply port) | Switch/ISO need a **digital control** signal; may not exist in RTL |
| `create_logic_net sw_core_ctrl` | Creates a logic net of that name | Connectable object for control |
| `connect_logic_net … -ports …` | Ties net to port | Completes connectivity in intent |

| Item | Detail |
|------|--------|
| **Why not only RTL pin?** | Teaching design has no PMU pin; UPF can **inject** control |
| **Silicon reality** | PMU / always-on FSM drives this pin |
| **Simulation** | TB must drive `sw_core_ctrl` for power-aware sim |
| **If you already have RTL pin** | Use that name in `-control_port` / isolation; skip create_logic_port or map to existing |

---

### 4.12 Isolation strategy (lines 80–85)

```tcl
set_isolation iso_core_out \
  -domain PD_CORE \
  -applies_to outputs \
  -clamp_value 0 \
  -isolation_power_net  VDD \
  -isolation_ground_net VSS
```

| Option | Value | Function | Why |
|--------|-------|----------|-----|
| (name) | `iso_core_out` | Strategy name | Matched by `set_isolation_control` |
| `-domain PD_CORE` | Switched domain | Domain whose boundary is protected | ISO applies to this domain’s interface |
| `-applies_to outputs` | Core **outputs** | Only signals **leaving** PD_CORE | When core is off, outputs would float into AO — **clamp them** |
| `-clamp_value 0` | Logic 0 | Value forced when isolation active | Safe static; use 1 if protocol needs pull-up idle |
| `-isolation_power_net VDD` | AO power | ISO cell powered from **always-on** rail | ISO must work when core is off |
| `-isolation_ground_net VSS` | Ground | ISO ground | Shared ground |

**Why isolation exists (physics):**  
Power-gated domain outputs go **X/Z** when rail collapses. AO flops sampling X → corruption, leakage, shoot-through. ISO cells **clamp** to known 0/1 using AO supply.

**`-applies_to` values (typical):**

| Value | Meaning |
|-------|---------|
| `outputs` | Signals out of domain |
| `inputs` | Signals into domain |
| `both` | Both directions |

Lab optional block (commented) shows **input** isolation with `-location parent`.

---

### 4.13 Isolation control (lines 87–91)

```tcl
set_isolation_control iso_core_out \
  -domain PD_CORE \
  -isolation_signal sw_core_ctrl \
  -isolation_sense low \
  -location self
```

| Option | Value | Function | Why |
|--------|-------|----------|-----|
| (name) | `iso_core_out` | Links to strategy above | Must match `set_isolation` name |
| `-domain` | `PD_CORE` | Domain context | Same domain as strategy |
| `-isolation_signal` | `sw_core_ctrl` | Digital pin that enables isolation | Usually related to power-switch control |
| `-isolation_sense low` | Active when signal is **0** | When control low → isolate | Align with “control low = power off” if that is your convention |
| `-location self` | ISO cells **inside** the switched domain | Placement policy | Common: ISO in OFF domain at boundary; alternative `parent` puts ISO in AO domain |

**Sense vs switch polarity (must be consistent):**

```text
Example convention in this lab:
  sw_core_ctrl = 1  →  switch ON  →  core powered  →  isolation DISABLED
  sw_core_ctrl = 0  →  switch OFF →  core off      →  isolation ENABLED
⇒ isolation_sense low  (isolate when control is 0)
```

If you invert the switch control, invert isolation sense too.

**`-location`:**

| Value | ISO placed in | Use when |
|-------|----------------|----------|
| `self` | Switched domain | Classic “clamp at source” |
| `parent` | Receiving AO domain | Sometimes preferred for bias/rail of ISO |
| `automatic` | Tool decides | If supported |

---

### 4.14 Commented dual-sided isolation (lines 93–105)

```tcl
# set_isolation iso_core_in ... -applies_to inputs ... -location parent
```

| Function if enabled | Isolate **inputs** into core when off |
| Why optional | Reduces leakage into off domain / clamps drivers into dead rail |
| Why `location parent` | Input ISO often lives on AO side driving into core |
| Why commented | Keep first lab minimal; enable as exercise |

---

### 4.15 `add_power_state` on domain primary (lines 110–115)

```tcl
add_power_state PD_TOP.primary \
  -state {TOP_ON  -supply_expr {VDD == FULL_ON  && VSS == FULL_ON}}

add_power_state PD_CORE.primary \
  -state {CORE_ON  -supply_expr {VDD_CORE == FULL_ON  && VSS == FULL_ON}} \
  -state {CORE_OFF -supply_expr {VDD_CORE == OFF      && VSS == FULL_ON}}
```

| Item | Detail |
|------|--------|
| **Function** | Names legal **states** of a supply set (`PD_*.primary`) using supply expressions |
| **`PD_TOP.primary`** | Handle for the domain’s primary supply pair |
| **`FULL_ON` / `OFF`** | Abstract supply states (not volts yet) |
| **Why** | Tools reason about “is this domain on?” for ISO/sim |
| **CORE_OFF** | Explicit off state for gated rail |

---

### 4.16 Port states with voltages (lines 118–120)

```tcl
add_port_state VDD      -state {ON 0.72}
add_port_state VSS      -state {ON 0.00}
add_port_state VDD_CORE -state {ON 0.72} -state {OFF off}
```

| Item | Detail |
|------|--------|
| **Function** | Assigns **named states with voltage** (or off) to supply ports/nets |
| **0.72** | Example SS-ish core voltage for learning (match your library story) |
| **`OFF off`** | Explicit powered-down state for `VDD_CORE` |
| **Why** | PST and analysis tools need numeric or symbolic levels |

---

### 4.17 Power State Table (lines 122–124)

```tcl
create_pst pst_practice -supplies {VDD VSS VDD_CORE}
add_pst_state RUN   -pst pst_practice -state {ON ON ON}
add_pst_state SLEEP -pst pst_practice -state {ON ON OFF}
```

| Command | Function | Why |
|---------|----------|-----|
| `create_pst` | Creates a table whose columns are supplies (order matters) | Defines the **coordinate system** of modes |
| `-supplies {VDD VSS VDD_CORE}` | Column order | Each `add_pst_state` list must match this order |
| `add_pst_state RUN … {ON ON ON}` | All rails on | Normal operation |
| `add_pst_state SLEEP … {ON ON OFF}` | Core rail off | Sleep / power-gated mode |

| Item | Detail |
|------|--------|
| **Illegal combinations** | Anything not listed may be treated as illegal (e.g. VDD off while core on) |
| **Why PST matters** | Verification and multi-mode analysis only consider **legal** states |
| **Naming** | `RUN` / `SLEEP` are human labels — use project conventions |

```text
PST columns:     VDD    VSS    VDD_CORE
RUN              ON     ON     ON
SLEEP            ON     ON     OFF     ← core gated
```

---

### 4.18 Port attributes (lines 129–135)

```tcl
set_port_attributes \
  -ports {pad_clk pad_rst_n ... pad_carry_flag} \
  -receiver_supply PD_TOP.primary \
  -driver_supply   PD_TOP.primary
```

| Option | Function | Why |
|--------|----------|-----|
| `-ports {…}` | List of **top-level design ports** | Pads are chip interface |
| `-driver_supply` | Supply of the **driver** side for that port | Outputs driven by AO domain |
| `-receiver_supply` | Supply of the **receiver** side | Inputs received into AO domain |
| **Both primary of PD_TOP** | All chip pins belong electrically to AO pad domain | Correct for pad-ring style top |

| Item | Detail |
|------|--------|
| **Why needed** | Tools infer related supplies for STA, ISO insertion, sim corruption checks |
| **If wrong** | False ISO requirements or missing isolation |
| **Buses** | Port names without bit indices often apply to whole bus (tool-dependent); bit-blast if required |

---

### 4.19 End of UPF file

No `end` keyword required. Last effective command is `set_port_attributes`.

---

## 5. UPF command encyclopedia

For each: **what / why / typical options / when to use / pitfalls**.

---

### 5.1 `upf_version`

```tcl
upf_version 2.0
```

| | |
|--|--|
| **What** | Language version |
| **Why** | Correct parsing of later commands |
| **Pitfall** | Mixing 1.0-only commands with 2.x semantics |

---

### 5.2 `create_supply_net`

```tcl
create_supply_net <net_name>
# sometimes: create_supply_net <net> -domain <pd>   ;# version-specific
```

| | |
|--|--|
| **What** | Creates a supply net object |
| **Why** | Named rail for domains/switches/ISO |
| **When** | Every distinct rail |
| **Pitfall** | Typos → later commands fail to resolve net |

---

### 5.3 `create_supply_port`

```tcl
create_supply_port <port_name>
# create_supply_port VDD -direction in   ;# if supported
```

| | |
|--|--|
| **What** | Supply port on design boundary |
| **Why** | Models package/power entry |
| **When** | External supplies |
| **Pitfall** | Creating a port for a purely internal switched net (usually unnecessary) |

---

### 5.4 `connect_supply_net`

```tcl
connect_supply_net <net> -ports {port1 port2 ...}
```

| | |
|--|--|
| **What** | Connects net to port(s) |
| **Why** | Completes supply graph |
| **Pitfall** | Connecting wrong net to wrong port |

---

### 5.5 `create_power_domain`

```tcl
create_power_domain <pd_name> -include_scope
create_power_domain <pd_name> -elements {hinst1 hinst2}
create_power_domain <pd_name> -elements {.}     ;# sometimes top itself
```

| Option | Meaning |
|--------|---------|
| `-include_scope` | Default membership = current scope minus other domains |
| `-elements` | Explicit instance list |
| `-supply {…}` | Some versions set supplies at create time |

| | |
|--|--|
| **What** | Defines a power region |
| **Why** | Unit of on/off and primary supplies |
| **Pitfall** | Wrong instance path; overlapping elements in two domains |

---

### 5.6 `set_domain_supply_net`

```tcl
set_domain_supply_net <pd> \
  -primary_power_net  <vdd_net> \
  -primary_ground_net <vss_net>
```

| | |
|--|--|
| **What** | Binds domain to its primary rails |
| **Why** | Tools know what powers the cells |
| **Also (advanced)** | Secondary supplies, well supplies — process-specific |
| **Pitfall** | Switched domain still pointing at always-on VDD |

---

### 5.7 `create_power_switch`

```tcl
create_power_switch <name> \
  -domain <pd> \
  -input_supply_port  {<local> <net>} \
  -output_supply_port {<local> <net>} \
  -control_port       {<local> <net_or_port>} \
  -on_state  {<state_name> <out_or_in> {<bool_expr>}} \
  -off_state {<state_name> {<bool_expr>}}
```

| | |
|--|--|
| **What** | Models power gating device |
| **Why** | Defines how gated rail turns on/off |
| **Implementation later** | Mapped to header/footer switch cells |
| **Pitfall** | Control polarity inconsistent with isolation |

---

### 5.8 `create_logic_port` / `create_logic_net` / `connect_logic_net`

```tcl
create_logic_port -direction in|out|inout <name>
create_logic_net <name>
connect_logic_net <net> -ports {p1 p2}
```

| | |
|--|--|
| **What** | Logic (signal) objects in UPF, not supplies |
| **Why** | Controls for switches, ISO, retention without RTL pins |
| **Pitfall** | Forgetting TB must drive them; name clashes with RTL |

---

### 5.9 `set_isolation`

```tcl
set_isolation <strategy> \
  -domain <pd> \
  -applies_to inputs|outputs|both \
  -clamp_value 0|1 \
  -isolation_power_net <ao_vdd> \
  -isolation_ground_net <vss> \
  [-diff_supply_only true|false] \
  [-elements {list}] \
  [-no_elements {list}]
```

| | |
|--|--|
| **What** | Declares isolation **policy** |
| **Why** | Prevent X/float on domain crossings when source is off |
| **`-diff_supply_only`** | Only isolate if supplies differ (useful multi-V) |
| **`-elements`** | Restrict to listed ports/nets |
| **Pitfall** | ISO powered from **gated** rail (fails when off) |

---

### 5.10 `set_isolation_control`

```tcl
set_isolation_control <strategy> \
  -domain <pd> \
  -isolation_signal <sig> \
  -isolation_sense high|low \
  -location self|parent|automatic
```

| | |
|--|--|
| **What** | When isolation is **active** and where cells sit |
| **Why** | Completes the strategy with a control pin |
| **Pitfall** | Sense inverted → ISO on when domain on (functional fail) |

---

### 5.11 `set_level_shifter` (not in lab file — multi-V)

```tcl
set_level_shifter <strategy> \
  -domain <pd> \
  -applies_to inputs|outputs|both \
  -rule low_to_high|high_to_low|both \
  [-location self|parent|automatic] \
  [-input_supply_set ...] [-output_supply_set ...]
```

| | |
|--|--|
| **What** | Policy for voltage crossing |
| **Why** | Protect gates from illegal voltage levels |
| **When** | Domains at **different** voltages |
| **Pitfall** | Missing LS between 0.72 and 1.8 → reliability/fail |

---

### 5.12 `set_level_shifter_control` (if used)

Pairs with strategy for enable if required (tool/version specific). Often LS is inferred from supplies without extra control.

---

### 5.13 `set_retention` / `set_retention_control` (not in lab)

```tcl
set_retention <strategy> -domain <pd> \
  -retention_power_net <ao_or_ret_vdd> \
  -retention_ground_net <vss>
set_retention_control <strategy> -domain <pd> \
  -save_signal {sig high|low} \
  -restore_signal {sig high|low}
```

| | |
|--|--|
| **What** | Keep sequential state while domain power is off |
| **Why** | Faster wake than full reload; lower AO area than all-AO flops |
| **When** | Power gating with state retention requirement |
| **Pitfall** | Save/restore protocol wrong → corrupt state |

---

### 5.14 `add_power_state`

```tcl
add_power_state <object> -state {NAME -supply_expr {expr}}
```

| | |
|--|--|
| **What** | Named legal states of a supply set |
| **Why** | Formalize ON/OFF combinations for analysis |

---

### 5.15 `add_port_state`

```tcl
add_port_state <port_or_net> -state {NAME <voltage>|off}
```

| | |
|--|--|
| **What** | Voltage (or off) labels for PST columns |
| **Why** | Numeric meaning for states |

---

### 5.16 `create_pst` / `add_pst_state`

```tcl
create_pst <pst_name> -supplies {s1 s2 s3}
add_pst_state <mode> -pst <pst_name> -state {st_s1 st_s2 st_s3}
```

| | |
|--|--|
| **What** | Table of legal simultaneous supply states |
| **Why** | Multi-mode verification / illegal state exclusion |
| **Pitfall** | Column order ≠ `-supplies` order |

---

### 5.17 `set_port_attributes`

```tcl
set_port_attributes -ports {p1 p2} \
  -driver_supply <supply_set> \
  -receiver_supply <supply_set>
```

| | |
|--|--|
| **What** | Related supplies for design ports |
| **Why** | Correct ISO/LS inference and corruption analysis |
| **Pitfall** | Leaving chip ports with no related supply |

---

### 5.18 Other UPF commands you will meet later

| Command | Role |
|---------|------|
| `set_design_attributes` | Design-level attrs |
| `set_partial_on_translation` | Partial on behavior |
| `create_supply_set` | Group power+ground as a set (newer style) |
| `associate_supply_set` | Bind supply set to domain |
| `map_power_switch` / `map_isolation_cell` | Map abstract to library cells |
| `use_interface_cell` | Force specific ISO/LS cell |
| `set_related_supply_net` | Related supply on pins/ports (variant) |
| `load_upf` / `find_objects` | Hierarchical / scripting helpers |
| `name_format` | Naming of inserted cells |
| `set_scope` / `with_start_up` | Hierarchical UPF composition |

Exact options vary by UPF version and tool — always check project IEEE 1801 profile.

---

## 6. Line-by-line: `pad_top_practice.cpf`

Path: `practice/upf/pad_top_practice.cpf`

### 6.1 `set_design pad_top` (line 10)

```tcl
set_design pad_top
```

| | |
|--|--|
| **What** | Declares which HDL top this CPF applies to |
| **Why** | CPF is design-scoped; tools attach intent to this module |
| **UPF analog** | Implicit when `read_power_intent -module pad_top` |

---

### 6.2 Create domains (lines 15–16)

```tcl
create_power_domain -name PD_TOP  -default
create_power_domain -name PD_CORE -instances {u_core}
```

| Option | Function | UPF cousin |
|--------|----------|------------|
| `-name PD_TOP` | Domain name | `create_power_domain PD_TOP` |
| `-default` | Default domain for unlisted logic | ≈ `-include_scope` |
| `-instances {u_core}` | Members | ≈ `-elements {u_core}` |

---

### 6.3 Power / ground nets (lines 21–22)

```tcl
create_power_nets  -nets {VDD VDD_CORE}
create_ground_nets -nets {VSS}
```

| | |
|--|--|
| **What** | Create power nets and ground nets |
| **Why** | Same as UPF supply nets (CPF splits power vs ground commands) |
| **UPF** | `create_supply_net` for each |

---

### 6.4 Power switch (lines 24–28)

```tcl
create_power_switch -name sw_core \
  -domain PD_CORE \
  -output_power_net VDD_CORE \
  -input_power_net VDD \
  -enable_condition_pin sw_core_ctrl
```

| Option | Function | UPF cousin |
|--------|----------|------------|
| `-input_power_net VDD` | Source rail | `-input_supply_port {… VDD}` |
| `-output_power_net VDD_CORE` | Gated rail | `-output_supply_port {… VDD_CORE}` |
| `-enable_condition_pin` | Control pin | `-control_port` + on/off states |

CPF often folds polarity into isolation condition rather than verbose on/off states.

---

### 6.5 Update domain primary supplies (lines 30–31)

```tcl
update_power_domain -name PD_TOP  -primary_power_net VDD      -primary_ground_net VSS
update_power_domain -name PD_CORE -primary_power_net VDD_CORE -primary_ground_net VSS
```

| | |
|--|--|
| **What** | Assign primary power/ground after domain create |
| **UPF** | `set_domain_supply_net` |
| **Why `update_*`** | CPF style: create domain first, then update attributes |

---

### 6.6 Isolation rule (lines 36–42)

```tcl
create_isolation_rule -name iso_core_out \
  -from PD_CORE \
  -to   PD_TOP \
  -isolation_condition {!sw_core_ctrl} \
  -isolation_output low \
  -isolation_power_net VDD \
  -isolation_ground_net VSS
```

| Option | Function | UPF cousin |
|--------|----------|------------|
| `-from PD_CORE` | Source domain | `-domain PD_CORE` + outputs toward AO |
| `-to PD_TOP` | Destination domain | Implicit AO receiver |
| `-isolation_condition {!sw_core_ctrl}` | Active when expression true | `-isolation_sense low` with signal `sw_core_ctrl` |
| `-isolation_output low` | Clamp 0 | `-clamp_value 0` |
| `-isolation_power_net VDD` | AO power for ISO | same |

**`{!sw_core_ctrl}`:** isolate when control is **false** (same intent as sense low).

---

### 6.7 Nominal conditions (lines 47–48)

```tcl
create_nominal_condition -name nom_on  -voltage 0.72
create_nominal_condition -name nom_off -voltage 0.0
```

| | |
|--|--|
| **What** | Named voltage corners for modes |
| **Why** | CPF modes reference conditions, not only abstract ON/OFF |
| **UPF** | Roughly `add_port_state` voltages + power states |

---

### 6.8 Power modes (lines 50–54)

```tcl
create_power_mode -name RUN \
  -domain_conditions {PD_TOP@nom_on PD_CORE@nom_on}

create_power_mode -name SLEEP \
  -domain_conditions {PD_TOP@nom_on PD_CORE@nom_off}
```

| | |
|--|--|
| **What** | Named chip modes with per-domain voltage conditions |
| **Why** | Analysis/verification modes |
| **UPF** | ≈ PST states `RUN` / `SLEEP` |
| **Syntax** | `Domain@condition` pairs |

---

## 7. CPF command encyclopedia

| CPF command | Function | Why used |
|-------------|----------|----------|
| `set_design` | Bind CPF to top module | Scope intent |
| `create_power_domain` | Create domain (`-default`, `-instances`) | Partition power |
| `create_power_nets` | Create VDD-like nets | Rails |
| `create_ground_nets` | Create VSS-like nets | Ground |
| `create_power_switch` | Power gate model | Gating |
| `update_power_domain` | Set primary power/ground | Bind rails to domain |
| `create_isolation_rule` | ISO policy from→to | Clamp crossings |
| `create_level_shifter_rule` | LS policy | Multi-V |
| `create_state_retention_rule` | Retention policy | Keep state |
| `create_nominal_condition` | Named voltage | Mode building block |
| `create_power_mode` | Mode = domain conditions | Legal operating modes |
| `update_isolation_rules` | Modify ISO | ECO of intent |
| `identify_secondary_domain` etc. | Advanced | Secondary supplies |

Genus load:

```tcl
read_power_intent -cpf -module pad_top -verbose pad_top_practice.cpf
```

---

## 8. UPF ↔ CPF concept map

| Concept | UPF | CPF |
|---------|-----|-----|
| Top binding | `-module` on read | `set_design` |
| Default AO domain | `create_power_domain … -include_scope` | `create_power_domain … -default` |
| Instance → domain | `-elements {u_core}` | `-instances {u_core}` |
| Supply net | `create_supply_net` | `create_power_nets` / `create_ground_nets` |
| Domain rails | `set_domain_supply_net` | `update_power_domain -primary_*` |
| Switch | `create_power_switch` + on/off states | `create_power_switch` + enable pin |
| Isolation policy | `set_isolation` | `create_isolation_rule` |
| Isolation enable | `set_isolation_control` | `-isolation_condition {…}` |
| Clamp 0 | `-clamp_value 0` | `-isolation_output low` |
| Level shifter | `set_level_shifter` | `create_level_shifter_rule` |
| Retention | `set_retention` | `create_state_retention_rule` |
| Modes / PST | `create_pst` / `add_pst_state` | `create_power_mode` |
| Voltages | `add_port_state` | `create_nominal_condition -voltage` |

**Prefer writing UPF;** use this table when reading old CPF.

---

## 9. Multi-voltage UPF — full changes vs single-voltage

> **Yes — multi-voltage is covered here in detail.**  
> Your **practice lab UPF** (`pad_top_practice.upf`) is **same-voltage power gating** (no level shifters).  
> This section is what **changes** when domains run at **different voltages**.  
> Worked example file: `practice/upf/pad_top_multivoltage_EXAMPLE.upf`.

### 9.1 Single-voltage power gate vs multi-voltage (concept)

| Topic | Same-voltage multi-domain (your lab) | Multi-voltage multi-domain |
|-------|--------------------------------------|----------------------------|
| Goal | Turn a region **OFF** | Regions at **different V** (and maybe also OFF) |
| Extra rails | Switched copy of same V (e.g. VDD_CORE) | Distinct ports: VDD_CORE, VDD_AO, VDDIO, … |
| Isolation | **Required** when a domain can be OFF | Still required if any domain can be OFF |
| Level shifters | **Not needed** (same V) | **Required** on paths between different V |
| PST | ON/OFF combinations | ON/OFF **and** voltage combinations |
| Liberty for commit | ISO cells | ISO **and** LS cells (LH / HL / bidirectional) |
| STA | One voltage library set per view often | Multi-lib / multi-corner often voltage-aware |

```text
SAME VOLTAGE (lab):
  VDD 0.72 ──► switch ──► VDD_CORE 0.72
  Crossing: need ISO if core OFF; no LS

MULTI-VOLTAGE:
  VDD_L 0.72  (PD_CORE)
  VDD_H 0.90  (PD_MEM)     or  VDDIO 1.8 (PD_IO)
  Crossing L↔H: need LEVEL SHIFTERS
  If either can power-gate: also ISO (+ maybe retention)
```

### 9.2 What you **add** to UPF for multi-voltage

Walk through each change.

#### A) Extra supply nets and ports

```tcl
# Always-on low / high / IO examples
create_supply_net  VDD_0P72
create_supply_net  VDD_0P90
create_supply_net  VDDIO_1P8
create_supply_net  VSS

create_supply_port VDD_0P72
create_supply_port VDD_0P90
create_supply_port VDDIO_1P8
create_supply_port VSS

connect_supply_net VDD_0P72  -ports VDD_0P72
connect_supply_net VDD_0P90  -ports VDD_0P90
connect_supply_net VDDIO_1P8 -ports VDDIO_1P8
connect_supply_net VSS       -ports VSS
```

| Why | Each **distinct voltage** that enters the chip is usually a **supply port** |
| Diff from lab | Lab only exposed VDD/VSS; VDD_CORE was **internal** via switch |

#### B) Domains bound to **different** primary powers

```tcl
create_power_domain PD_CORE -elements {u_core}
set_domain_supply_net PD_CORE \
  -primary_power_net  VDD_0P72 \
  -primary_ground_net VSS

create_power_domain PD_MEM -elements {u_mem_ss}
set_domain_supply_net PD_MEM \
  -primary_power_net  VDD_0P90 \
  -primary_ground_net VSS

create_power_domain PD_IO -include_scope   ;# or pad-only elements
set_domain_supply_net PD_IO \
  -primary_power_net  VDDIO_1P8 \
  -primary_ground_net VSS
```

| Why | Cells in a domain are **electrically** on that rail’s voltage |
| Critical | Wrong primary power → wrong LS direction and wrong STA story |

#### C) Level shifter strategies (the main multi-V addition)

```tcl
# Low → High (e.g. 0.72 core driving 0.90 mem inputs)
set_level_shifter ls_lh_core_to_mem \
  -domain PD_CORE \
  -applies_to outputs \
  -rule low_to_high \
  -location automatic

# High → Low (mem driving core)
set_level_shifter ls_hl_mem_to_core \
  -domain PD_MEM \
  -applies_to outputs \
  -rule high_to_low \
  -location automatic
```

| Option | Meaning |
|--------|---------|
| `-domain` | Domain whose **boundary** is being shifted (often the driving domain) |
| `-applies_to outputs` | Shift signals **leaving** that domain |
| `-rule low_to_high` | Driver is lower V than receiver |
| `-rule high_to_low` | Driver is higher V than receiver |
| `-rule both` | Bidirectional / both directions as tool allows |
| `-location self\|parent\|automatic` | Where LS cell is inserted |

**Why LS is required**

| Direction | Risk without LS |
|-----------|-----------------|
| Low → High | Slow/weak high at receiver; reliability |
| High → Low | Overvoltage stress on low-V gate oxide; leakage; failure |

**LS vs ISO**

| Cell | Problem it solves |
|------|-------------------|
| **Level shifter** | Different **voltages**, both sides powered |
| **Isolation** | Source domain **OFF** (float/X), clamp using AO supply |

A path may need **both** if a multi-V domain can also power-gate (LS for voltage, ISO for off — tool/rules define order and combo cells).

#### D) Optional: name input/output supply sets (UPF 2.x style)

Some flows use **supply sets** instead of only primary nets:

```tcl
# Illustrative — syntax varies slightly by UPF version / tool profile
create_supply_set ss_core -function {power VDD_0P72} -function {ground VSS}
create_supply_set ss_mem  -function {power VDD_0P90} -function {ground VSS}
associate_supply_set ss_core -handle PD_CORE.primary
associate_supply_set ss_mem  -handle PD_MEM.primary
```

| Why | Cleaner multi-rail bookkeeping; required by some tool recipes |
| Lab | Not used in simple `pad_top_practice.upf` |

#### E) PST must list **every** supply column

```tcl
add_port_state VDD_0P72  -state {ON 0.72} -state {OFF off}
add_port_state VDD_0P90  -state {ON 0.90} -state {OFF off}
add_port_state VDDIO_1P8 -state {ON 1.80}
add_port_state VSS       -state {ON 0.00}

create_pst pst_mv -supplies {VDD_0P72 VDD_0P90 VDDIO_1P8 VSS}
add_pst_state RUN_ALL   -pst pst_mv -state {ON  ON  ON ON}
add_pst_state CORE_OFF  -pst pst_mv -state {OFF ON  ON ON}
add_pst_state MEM_OFF   -pst pst_mv -state {ON  OFF ON ON}
```

| Why | Illegal combos (e.g. IO off while core talks to pads) must be excluded or defined carefully |
| Diff from lab | Lab PST had 3 columns; multi-V has **one column per rail** |

#### F) Port attributes per interface voltage

```tcl
# Core-side chip ports (if any at 0.72)
set_port_attributes -ports {clk rst_n ...} \
  -driver_supply PD_CORE.primary -receiver_supply PD_CORE.primary

# IO pads at 1.8 V
set_port_attributes -ports {pad_*} \
  -driver_supply PD_IO.primary -receiver_supply PD_IO.primary
```

| Why | Tools know which supply a top port “belongs to” for LS/ISO inference |

#### G) Isolation still needed if any domain power-gates

```tcl
set_isolation iso_core_out \
  -domain PD_CORE -applies_to outputs -clamp_value 0 \
  -isolation_power_net VDD_0P90 \    ;# or true AO rail that stays on
  -isolation_ground_net VSS
set_isolation_control iso_core_out \
  -domain PD_CORE -isolation_signal sw_core_ctrl \
  -isolation_sense low -location self
```

| Note | ISO **power net must stay ON** when the gated domain is OFF (often AO or always-on higher rail) |

### 9.3 Side-by-side UPF skeleton

**Same-voltage (lab-style)**

```tcl
create_supply_net VDD
create_supply_net VDD_CORE     ;# same voltage, switched
create_power_domain PD_TOP -include_scope
create_power_domain PD_CORE -elements {u_core}
set_domain_supply_net PD_CORE -primary_power_net VDD_CORE ...
create_power_switch ...        ;# VDD → VDD_CORE
set_isolation ...              ;# YES
# set_level_shifter ...        ;# NO
```

**Multi-voltage**

```tcl
create_supply_net VDD_0P72
create_supply_net VDD_0P90
create_power_domain PD_CORE -elements {u_core}
create_power_domain PD_MEM  -elements {u_mem}
set_domain_supply_net PD_CORE -primary_power_net VDD_0P72 ...
set_domain_supply_net PD_MEM  -primary_power_net VDD_0P90 ...
# create_power_switch ...      ;# only if a domain also gates
set_level_shifter ...          ;# YES — LH and/or HL
set_isolation ...              ;# YES if power-down exists
```

### 9.4 Genus multi-V commands (after UPF)

```tcl
read_power_intent -1801 -module <top> -verbose multi_v.upf
apply_power_intent -summary
check_power_intent -level_shifter -isolation -detail
commit_power_intent

report_power_intent -level_shifter_rule_only
report_power_intent_instances -level_shifter_only -detail
check_power_structure -level_shifter -post_synthesis   ;# if licensed
```

| Requirement | Level-shifter **and** isolation cells in the library (and not dont_use) |

### 9.5 Multi-voltage checklist (add to basic checklist)

- [ ] One supply port/net per distinct voltage rail  
- [ ] Each domain primary power matches real library voltage  
- [ ] **LH** and/or **HL** `set_level_shifter` for every direction that crosses voltages  
- [ ] PST columns include all rails; legal modes listed  
- [ ] Top ports tagged with correct related supply  
- [ ] If power gating + multi-V: ISO + LS both defined; ISO powered from always-on rail  
- [ ] Synthesis libs include LS (and ISO) cells for `commit_power_intent`  
- [ ] STA/MMMC views match voltage corners (methodology beyond UPF text)  

### 9.6 Common multi-V mistakes

| Mistake | What goes wrong |
|---------|-----------------|
| Forget LS, only define domains | `commit` may insert nothing; silicon/sim fail |
| Wrong LH vs HL rule | Wrong cell type / functional fail |
| ISO powered from gated low-V rail | Clamp dead when off |
| PST missing a rail | Illegal or incomplete modes |
| IO domain 1.8 V but ports related to core 0.72 | Bad LS inference |
| Same net name for two voltages | Intent collision |

### 9.7 Example file for learning

See **`practice/upf/pad_top_multivoltage_EXAMPLE.upf`** — illustrative multi-V + LS (+ optional gate).  
It is a **teaching template**, not necessarily drop-in for your current single-rail pad kit without multi-V libs.

---

## 10. Retention (SRPG) — when you need it

Power gate **without** retention → state lost → software reload or hard reset.  
With retention:

```tcl
set_retention ret_core -domain PD_CORE \
  -retention_power_net VDD \
  -retention_ground_net VSS
set_retention_control ret_core -domain PD_CORE \
  -save_signal {save_n low} \
  -restore_signal {restore_n low}
```

| When | Domain off but must remember configuration/state quickly |
| Cost | Special flops + AO retention rail + protocol |
| Lab | Omitted for simplicity |

---

## 11. Authoring checklist & common mistakes

### 11.1 Checklist (every UPF)

- [ ] `upf_version` set  
- [ ] All rails `create_supply_net`  
- [ ] External rails have ports + `connect_supply_net`  
- [ ] Every instance is in exactly one domain (default + elements)  
- [ ] Each domain has `set_domain_supply_net`  
- [ ] Each gated rail has a path (switch) from an always-on source  
- [ ] Isolation on **outputs** of gated domains into AO  
- [ ] Isolation control polarity matches switch OFF  
- [ ] ISO cells powered from **AO** supply  
- [ ] PST lists only legal states  
- [ ] Top ports have related supplies (`set_port_attributes`)  
- [ ] Instance names match elaborated hierarchy  

### 11.1b Extra checklist (multi-voltage only) — see §9

- [ ] Distinct supply port/net per voltage  
- [ ] `set_level_shifter` LH and/or HL for every voltage-crossing direction  
- [ ] PST includes all rails  
- [ ] LS (+ ISO) cells available in liberty for commit  
- [ ] Port attributes match IO vs core voltages  

### 11.2 Common mistakes

| Mistake | Result | Fix |
|---------|--------|-----|
| Wrong `u_core` path | Empty PD_CORE | `report_hierarchy` / fix elements |
| ISO powered by VDD_CORE | ISO dead when off | Use VDD (AO) for ISO power |
| Sense high vs low inverted | ISO when powered | Align with switch |
| No isolation | X-prop into AO | Add `set_isolation` |
| Multi-V without LS | Electrical/protocol fail | `set_level_shifter` |
| PST column order wrong | Wrong modes | Match `-supplies` order |
| Only CPF knowledge | Legacy-only | Learn UPF as primary |
| Expect UPF to insert CG | Wrong tool | CG is synth attr, not UPF |

---

## 12. How Genus consumes the file

```tcl
elaborate pad_top

read_power_intent -1801 -module pad_top -verbose upf/pad_top_practice.upf
apply_power_intent -design pad_top -summary
check_power_intent -design pad_top -detail

# Inserts ISO/LS/SRPG cells if libs + rules allow
commit_power_intent -design pad_top

report_power_intent -power_domain_only
report_power_intent_instances -isolation_only -detail

# Then SDC + syn_generic / syn_map / syn_opt
write_power_intent -1801 -base_name out/pad_top_pi -overwrite
```

| Stage | UPF role |
|-------|----------|
| `read` | Parse file into tool DB |
| `apply` | Attach constraints to design objects |
| `check` | Flag incomplete/inconsistent intent |
| `commit` | Build real ISO/LS/retention instances |
| `write` | Emit updated intent after implementation |

Script: `scripts/run_genus_pad_top_upf.tcl`

---

## 13. Worked “blank page” UPF template

Copy and fill:

```tcl
upf_version 2.0

# --- Supplies ---
create_supply_net  VDD
create_supply_net  VSS
create_supply_net  VDD_SW
create_supply_port VDD
create_supply_port VSS
connect_supply_net VDD -ports VDD
connect_supply_net VSS -ports VSS

# --- Always-on domain ---
create_power_domain PD_AO -include_scope
set_domain_supply_net PD_AO \
  -primary_power_net VDD -primary_ground_net VSS

# --- Switchable domain ---
create_power_domain PD_SW -elements { <INSTANCE> }
set_domain_supply_net PD_SW \
  -primary_power_net VDD_SW -primary_ground_net VSS

# --- Switch ---
create_power_switch sw0 \
  -domain PD_SW \
  -input_supply_port  {vin VDD} \
  -output_supply_port {vout VDD_SW} \
  -control_port       {c sw_ctrl} \
  -on_state  {on  vin {c}} \
  -off_state {off {~c}}
create_logic_port -direction in sw_ctrl
create_logic_net sw_ctrl
connect_logic_net sw_ctrl -ports sw_ctrl

# --- Isolation outputs of SW domain ---
set_isolation iso_out \
  -domain PD_SW -applies_to outputs -clamp_value 0 \
  -isolation_power_net VDD -isolation_ground_net VSS
set_isolation_control iso_out \
  -domain PD_SW -isolation_signal sw_ctrl \
  -isolation_sense low -location self

# --- PST ---
add_port_state VDD    -state {ON 0.72}
add_port_state VSS    -state {ON 0.00}
add_port_state VDD_SW -state {ON 0.72} -state {OFF off}
create_pst pst0 -supplies {VDD VSS VDD_SW}
add_pst_state RUN   -pst pst0 -state {ON ON ON}
add_pst_state SLEEP -pst pst0 -state {ON ON OFF}

# --- Top ports (edit list) ---
# set_port_attributes -ports { ... } \
#   -driver_supply PD_AO.primary -receiver_supply PD_AO.primary
```

Replace `<INSTANCE>`, voltages, and port lists for each new design.

---

## Appendix — Quick “what does this line do?” index

| Line pattern | One-line meaning |
|--------------|------------------|
| `upf_version` | Dialect version |
| `create_supply_net X` | Create rail X |
| `create_supply_port X` | Power enters design at X |
| `connect_supply_net` | Bind rail to port |
| `create_power_domain … -include_scope` | Default AO bucket |
| `create_power_domain … -elements` | Put instances in domain |
| `set_domain_supply_net` | Domain’s VDD/VSS |
| `create_power_switch` | How gated rail turns on/off |
| `create_logic_port` | Digital control pin from UPF |
| `set_isolation` | Clamp policy |
| `set_isolation_control` | When/where ISO active |
| `add_port_state` | Voltage labels |
| `create_pst` / `add_pst_state` | Legal mode table |
| `set_port_attributes` | Related supplies on pins |
| CPF `set_design` | Which top |
| CPF `create_isolation_rule` | ISO from→to + condition |
| CPF `create_power_mode` | Mode = domain voltages |

---

## Related files

| File | Role |
|------|------|
| `upf/pad_top_practice.upf` | Full lab UPF |
| `upf/pad_top_practice.cpf` | Full lab CPF |
| `docs/LOW_POWER_SYNTHESIS_REFERENCE.md` | LP flows + Genus commands + issues |
| `docs/UPF_CPF_PRACTICE.md` | How to run the lab |
| `scripts/run_genus_pad_top_upf.tcl` | Genus automation |

---

*Use this document when writing or debugging power intent. Prefer UPF; treat CPF as a translation skill. When a tool rejects a construct, check `upf_version` and that project’s IEEE 1801 subset.*

