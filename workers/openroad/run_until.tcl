# Ace-Seek: run OpenLane only up to ACE_OPENLANE_UNTIL.
# Invoked by: flow.tcl -interactive -file /openlane/ace_run_until.tcl
#
# Resume model:
# - Fresh / overwrite: prep -overwrite, then run steps through until=
# - Existing ace_run tag: do NOT call prep (OpenLane errors "already exists").
#   Instead source runs/<tag>/config.tcl and continue remaining steps.

# Allow minor PDK version differences (e.g. newer Volare build)
set ::env(MISMATCHES_OK) 1
set ::env(PDK_MISMATCHES_OK) 1

# Inherit module path from parent if missing
if { ![info exists ::env(OPENLANE_ROOT)] || $::env(OPENLANE_ROOT) eq "" } {
    foreach cand {
        /root/.nix-profile/bin
        /openlane
    } {
        if { [file exists "$cand/flow.tcl"] || [file exists "$cand/.flow.tcl-wrapped"] } {
            set ::env(OPENLANE_ROOT) $cand
            break
        }
    }
}
if { [info exists ::env(OPENLANE_ROOT)] } {
    if { [info exists ::env(TCL8_5_TM_PATH)] } {
        set ::env(TCL8_5_TM_PATH) "$::env(OPENLANE_ROOT)/scripts:$::env(TCL8_5_TM_PATH)"
    } else {
        set ::env(TCL8_5_TM_PATH) "$::env(OPENLANE_ROOT)/scripts"
    }
}

package require openlane

set until "all"
if { [info exists ::env(ACE_OPENLANE_UNTIL)] && $::env(ACE_OPENLANE_UNTIL) ne "" } {
    set until $::env(ACE_OPENLANE_UNTIL)
}

set design_dir "/openlane/designs/ace_design"
if { [info exists ::env(DESIGN_SLUG)] && $::env(DESIGN_SLUG) ne "" } {
    set design_dir "/openlane/designs/$::env(DESIGN_SLUG)"
}

set tag "ace_run"
if { [info exists ::env(OPENLANE_TAG)] && $::env(OPENLANE_TAG) ne "" } {
    set tag $::env(OPENLANE_TAG)
}

set overwrite 0
if { [info exists ::env(ACE_OPENLANE_OVERWRITE)] && $::env(ACE_OPENLANE_OVERWRITE) eq "1" } {
    set overwrite 1
}
# Fresh synth / full flow always wipe
if { $until eq "synthesis" || $until eq "all" } {
    set overwrite 1
}

set run_dir [file normalize "$design_dir/runs/$tag"]
set resumed 0

puts "ACE-Seek OpenLane stage runner: until=$until overwrite=$overwrite design=$design_dir tag=$tag"

proc ace_run_step {name body} {
    puts "ACE-Seek: === step $name ==="
    if { [catch { uplevel 1 $body } err] } {
        puts "ACE-Seek: step $name FAILED: $err"
        error $err
    }
    # OpenLane run_floorplan can swallow place_io failures and still return.
    # Treat known IO placer failures as hard errors so we never print OK falsely.
    if { $name eq "floorplan" && [info exists ::env(floorplan_logs)] } {
        set pio [glob -nocomplain -directory $::env(floorplan_logs) *place_io*.log]
        foreach f $pio {
            if { ![file exists $f] } { continue }
            set fh [open $f r]
            set txt [read $fh]
            close $fh
            if { [string match "*Only one entry allowed per line*" $txt] || \
                 [string match "*\[ERROR\]*" $txt] && [string match "*unmatched*" [string tolower $txt]] } {
                puts "ACE-Seek: step floorplan FAILED: IO placement error in [file tail $f]"
                error "IO placement failed — see $f"
            }
        }
    }
    puts "ACE-Seek: === step $name OK ==="
}

# Reusable STA + power report runner for every stage.
# Generates ace_<stage>_sta.log under the stage's log directory so
# pack_stage_reports.sh can extract timing, power, and area data uniformly.
proc ace_run_sta_reports {stage} {
    puts "ACE-Seek: === step ${stage}_sta ==="
    set log_dir ""
    if { [info exists ::env(${stage}_logs)] } {
        set log_dir $::env(${stage}_logs)
    } elseif { [info exists ::env(RUN_DIR)] } {
        set log_dir "$::env(RUN_DIR)/logs/$stage"
        catch { file mkdir $log_dir }
    }
    set log_file "ace_${stage}_sta.log"
    if { $log_dir ne "" } {
        set log_file "$log_dir/ace_${stage}_sta.log"
    }
    puts "ACE-Seek: STA log → $log_file"

    switch -exact -- $stage {
        synthesis - floorplan - placement {
            # Pre-CTS: ideal clocks, estimated placement parasitics
            run_sta -pre_cts -estimate_placement -no_save -log $log_file
        }
        cts {
            # Post-CTS: propagated clock, estimated parasitics
            run_sta -log $log_file
        }
        routing {
            # Post-route: propagated clock, wire parasitics from global route
            run_sta -log $log_file
        }
        default {
            # signoff and others — run_parasitics_sta handles SPEF-loaded STA
            puts "ACE-Seek: skipping generic run_sta for stage $stage (handled separately)"
        }
    }
    puts "ACE-Seek: === step ${stage}_sta OK ==="
}

# ── prep or resume ──────────────────────────────────────────────
if { $overwrite || ![file isdirectory $run_dir] } {
    puts "ACE-Seek: prep (fresh/overwrite) → $run_dir"
    prep -design $design_dir -tag $tag -overwrite
} else {
    # Tag already exists — OpenLane prep without -overwrite always errors.
    # Load saved env from previous stage-limited run and continue.
    if { ![file exists "$run_dir/config.tcl"] } {
        puts "ACE-Seek: existing run missing config.tcl — falling back to overwrite prep"
        prep -design $design_dir -tag $tag -overwrite
    } else {
        puts "ACE-Seek: resume existing run (no wipe): $run_dir"
        set ::env(DESIGN_DIR) [file normalize $design_dir]
        set ::env(RUN_DIR) $run_dir
        # config.tcl is pure "set ::env(...)" from last save_state
        if { [catch { source "$run_dir/config.tcl" } serr] } {
            puts "ACE-Seek: source config.tcl failed: $serr — overwrite prep"
            prep -design $design_dir -tag $tag -overwrite
        } else {
            set resumed 1
            puts "ACE-Seek: resumed CURRENT_INDEX=$::env(CURRENT_INDEX) CURRENT_DEF=$::env(CURRENT_DEF)"
            puts "ACE-Seek: CURRENT_NETLIST=$::env(CURRENT_NETLIST)"
            # Ensure design dir / PDK still correct after host remount
            set ::env(DESIGN_DIR) [file normalize $design_dir]
            set ::env(RUN_DIR) $run_dir
        }
    }
}

# Decide which steps already finished (resume) via result artifacts / CURRENT_INDEX
# OpenLane indices after floorplan typically CURRENT_INDEX=6 (pdn/tap done)
proc ace_has_synth {} {
    if { [info exists ::env(CURRENT_NETLIST)] && [file exists $::env(CURRENT_NETLIST)] } {
        return 1
    }
    if { [info exists ::env(synthesis_results)] && [file exists "$::env(synthesis_results)/$::env(DESIGN_NAME).v"] } {
        return 1
    }
    return 0
}
proc ace_has_floorplan {} {
    if { [info exists ::env(CURRENT_DEF)] && [file exists $::env(CURRENT_DEF)] } {
        if { [string match "*floorplan*" $::env(CURRENT_DEF)] || [string match "*placement*" $::env(CURRENT_DEF)] || [string match "*cts*" $::env(CURRENT_DEF)] || [string match "*routing*" $::env(CURRENT_DEF)] } {
            return 1
        }
    }
    if { [info exists ::env(floorplan_results)] && [file exists "$::env(floorplan_results)/$::env(DESIGN_NAME).def"] } {
        return 1
    }
    return 0
}
proc ace_has_placement {} {
    if { [info exists ::env(placement_results)] && [file exists "$::env(placement_results)/$::env(DESIGN_NAME).def"] } {
        return 1
    }
    if { [info exists ::env(CURRENT_DEF)] && [string match "*placement*" $::env(CURRENT_DEF)] } {
        return 1
    }
    return 0
}
proc ace_has_cts {} {
    if { [info exists ::env(cts_results)] && [file exists "$::env(cts_results)/$::env(DESIGN_NAME).def"] } {
        return 1
    }
    if { [info exists ::env(CURRENT_DEF)] && [string match "*cts*" $::env(CURRENT_DEF)] } {
        return 1
    }
    return 0
}
proc ace_has_routing {} {
    if { [info exists ::env(routing_results)] && [file exists "$::env(routing_results)/$::env(DESIGN_NAME).def"] } {
        return 1
    }
    if { [info exists ::env(CURRENT_DEF)] && [string match "*routing*" $::env(CURRENT_DEF)] } {
        return 1
    }
    return 0
}

# Skip only *earlier* finished stages when advancing. NEVER skip the stage the
# user asked to run (until=). Old bug: until=floorplan + existing placement DEF
# → skip_fp=1 → instant exit, leftover placement still looked like "placement ran".
proc ace_until_rank {u} {
    switch -exact -- $u {
        synthesis { return 1 }
        floorplan - powerplan { return 2 }
        placement { return 3 }
        cts { return 4 }
        routing - route { return 5 }
        drc { return 6 }
        lvs { return 7 }
        gds - all { return 99 }
        default { return 99 }
    }
}
set until_rank [ace_until_rank $until]

set skip_synth [expr { $resumed && [ace_has_synth] && $until_rank > 1 }]
set skip_fp    [expr { $resumed && [ace_has_floorplan] && $until_rank > 2 }]
set skip_place [expr { $resumed && [ace_has_placement] && $until_rank > 3 }]
set skip_cts   [expr { $resumed && [ace_has_cts] && $until_rank > 4 }]
set skip_route [expr { $resumed && [ace_has_routing] && $until_rank > 5 }]

puts "ACE-Seek: until=$until rank=$until_rank skip_synth=$skip_synth skip_fp=$skip_fp skip_place=$skip_place skip_cts=$skip_cts skip_route=$skip_route"

# Resume sources runs/*/config.tcl which often LACKS FP_PIN_ORDER_CFG even when
# designs/.../pin_order.cfg + config.json have it. Without the env var, OpenLane
# calls OpenROAD place_pins (anneal) → all IOs pile on one edge (usually South).
# With FP_PIN_ORDER_CFG set, it uses place_io_ol / odbpy/io_place.py (N/E/S/W).
proc ace_ensure_pin_order_cfg {} {
    set candidates {}
    if { [info exists ::env(DESIGN_DIR)] } {
        lappend candidates [file normalize "$::env(DESIGN_DIR)/pin_order.cfg"]
    }
    if { [info exists ::env(DESIGN_NAME)] } {
        # common Ace-Seek layout
        lappend candidates "/openlane/designs/ace_design/pin_order.cfg"
    }
    if { [info exists ::env(FP_PIN_ORDER_CFG)] && $::env(FP_PIN_ORDER_CFG) ne "" } {
        set p $::env(FP_PIN_ORDER_CFG)
        if { [string match "dir::*" $p] } {
            set rel [string range $p 5 end]
            if { [info exists ::env(DESIGN_DIR)] } {
                lappend candidates [file normalize "$::env(DESIGN_DIR)/$rel"]
            }
        } else {
            lappend candidates $p
        }
    }
    foreach c $candidates {
        if { $c ne "" && [file exists $c] && [file size $c] > 0 } {
            set ::env(FP_PIN_ORDER_CFG) $c
            puts "ACE-Seek: FP_PIN_ORDER_CFG=$c (IO sides from pin_order.cfg)"
            return 1
        }
    }
    catch { unset ::env(FP_PIN_ORDER_CFG) }
    puts "ACE-Seek: WARNING — no pin_order.cfg found; IO placer may put all pins on one edge"
    return 0
}

# Core rings live in the die↔core halo. OpenLane only builds them when BOTH
# FP_PDN_CORE_RING=1 and FP_PDN_MULTILAYER=1 (met4 vertical + met5 horizontal).
# Resume config.tcl often still has CORE_RING=0 / MULTILAYER=0 from older runs.
proc ace_ensure_pdn_rings {} {
    # Default rings ON for Studio; honor explicit 0/false from merged user config.
    set want_ring 1
    if { [info exists ::env(FP_PDN_CORE_RING)] && \
         ($::env(FP_PDN_CORE_RING) eq "0" || [string tolower $::env(FP_PDN_CORE_RING)] eq "false") } {
        set want_ring 0
    }
    if { $want_ring } {
        set ::env(FP_PDN_CORE_RING) 1
        set ::env(FP_PDN_MULTILAYER) 1
        # Only fill geometry defaults if missing — do NOT clobber user Stage Inputs
        if { ![info exists ::env(FP_PDN_CORE_RING_VWIDTH)] || $::env(FP_PDN_CORE_RING_VWIDTH) eq "" } {
            set ::env(FP_PDN_CORE_RING_VWIDTH) 1.6
        }
        if { ![info exists ::env(FP_PDN_CORE_RING_HWIDTH)] || $::env(FP_PDN_CORE_RING_HWIDTH) eq "" } {
            set ::env(FP_PDN_CORE_RING_HWIDTH) 1.6
        }
        if { ![info exists ::env(FP_PDN_CORE_RING_VSPACING)] || $::env(FP_PDN_CORE_RING_VSPACING) eq "" } {
            set ::env(FP_PDN_CORE_RING_VSPACING) 1.7
        }
        if { ![info exists ::env(FP_PDN_CORE_RING_HSPACING)] || $::env(FP_PDN_CORE_RING_HSPACING) eq "" } {
            set ::env(FP_PDN_CORE_RING_HSPACING) 1.7
        }
        if { ![info exists ::env(FP_PDN_CORE_RING_VOFFSET)] || $::env(FP_PDN_CORE_RING_VOFFSET) eq "" } {
            set ::env(FP_PDN_CORE_RING_VOFFSET) 6
        }
        if { ![info exists ::env(FP_PDN_CORE_RING_HOFFSET)] || $::env(FP_PDN_CORE_RING_HOFFSET) eq "" } {
            set ::env(FP_PDN_CORE_RING_HOFFSET) 6
        }
        puts "ACE-Seek: PDN rings ON multilayer=1 Vw=$::env(FP_PDN_CORE_RING_VWIDTH) Hw=$::env(FP_PDN_CORE_RING_HWIDTH) Voff=$::env(FP_PDN_CORE_RING_VOFFSET) Hoff=$::env(FP_PDN_CORE_RING_HOFFSET)"
    } else {
        puts "ACE-Seek: PDN core rings OFF (FP_PDN_CORE_RING=0)"
    }
}

# When re-running floorplan from a later resume point, OpenLane still has
# CURRENT_NETLIST=results/routing/top.nl.v — if we prune or that file is gone,
# initial_fp fails with "cannot read file …/routing/top.nl.v".
# Always rewind to the synthesis netlist before run_floorplan.
proc ace_rewind_to_synthesis_netlist {} {
    set design ""
    if { [info exists ::env(DESIGN_NAME)] } {
        set design $::env(DESIGN_NAME)
    }
    set candidates {}
    if { [info exists ::env(synthesis_results)] && $design ne "" } {
        lappend candidates "$::env(synthesis_results)/${design}.v"
        lappend candidates "$::env(synthesis_results)/${design}.nl.v"
    }
    if { [info exists ::env(RUN_DIR)] && $design ne "" } {
        lappend candidates "$::env(RUN_DIR)/results/synthesis/${design}.v"
        lappend candidates "$::env(RUN_DIR)/results/synthesis/${design}.nl.v"
    }
    if { [info exists ::env(CURRENT_NETLIST)] && [file exists $::env(CURRENT_NETLIST)] \
         && [string match "*synthesis*" $::env(CURRENT_NETLIST)] } {
        lappend candidates $::env(CURRENT_NETLIST)
    }
    set synth_v ""
    foreach c $candidates {
        if { $c ne "" && [file exists $c] } {
            set synth_v $c
            break
        }
    }
    if { $synth_v eq "" } {
        error "ACE-Seek: no synthesis netlist found to rewind before floorplan (need results/synthesis/<design>.v). Re-run Synthesis first."
    }
    set prev_nl ""
    if { [info exists ::env(CURRENT_NETLIST)] } { set prev_nl $::env(CURRENT_NETLIST) }
    set prev_def ""
    if { [info exists ::env(CURRENT_DEF)] } { set prev_def $::env(CURRENT_DEF) }
    puts "ACE-Seek: rewind for floorplan — CURRENT_NETLIST: $prev_nl → $synth_v"
    set ::env(CURRENT_NETLIST) $synth_v
    # Drop any post-synth layout pointers (routing/placement leftovers break initial_fp)
    foreach var {
        CURRENT_DEF CURRENT_ODB CURRENT_GUIDE CURRENT_POWERED_NETLIST
        CURRENT_SDC CURRENT_SDF CURRENT_SPEF CURRENT_LIB CURRENT_DIR
    } {
        if { [info exists ::env($var)] } {
            puts "ACE-Seek: clearing $var (was $::env($var))"
            unset -nocomplain ::env($var)
        }
    }
    # Keep step IDs sane (was 32 after a long place/cts/route run)
    if { [info exists ::env(CURRENT_INDEX)] } {
        puts "ACE-Seek: reset CURRENT_INDEX $::env(CURRENT_INDEX) → 2"
        set ::env(CURRENT_INDEX) 2
    }
}

# Drop later OpenLane results so GUI/harvest cannot show stale placement/CTS/route.
proc ace_prune_after_floorplan {} {
    foreach key {placement_results cts_results routing_results} {
        if { [info exists ::env($key)] && [file isdirectory $::env($key)] } {
            puts "ACE-Seek: pruning later stage dir $::env($key)"
            foreach f [glob -nocomplain -directory $::env($key) *] {
                catch { file delete -force $f }
            }
        }
    }
    # Clear final leftovers that confuse re-runs. Recreate empty signoff/ —
    # placement STA (multi_corner.tcl) writes results/signoff/top.sdf and
    # fails with "cannot write file …/signoff/top.sdf" if the dir is missing.
    if { [info exists ::env(RUN_DIR)] } {
        set d "$::env(RUN_DIR)/results/final"
        if { [file isdirectory $d] } {
            puts "ACE-Seek: pruning $d"
            catch { file delete -force $d }
        }
        set so "$::env(RUN_DIR)/results/signoff"
        catch { file delete -force $so }
        file mkdir $so
        puts "ACE-Seek: recreated empty $so (needed for post-place SDF/STA)"
    }
    if { [file isdirectory /openlane/results_out] } {
        foreach f [glob -nocomplain /openlane/results_out/placement_* \
                         /openlane/results_out/cts_* \
                         /openlane/results_out/routing_* \
                         /openlane/results_out/final_* \
                         /openlane/results_out/*_top.odb \
                         /openlane/results_out/*_top.def] {
            set bn [file tail $f]
            if { [string match "floorplan_*" $bn] || [string match "synthesis_*" $bn] } {
                continue
            }
            if { [string match "placement_*" $bn] || [string match "cts_*" $bn] || \
                 [string match "routing_*" $bn] || [string match "final_*" $bn] } {
                catch { file delete -force $f }
                puts "ACE-Seek: removed stale harvest $bn"
            }
        }
    }
}

# ── synthesis ───────────────────────────────────────────────────
if { !$skip_synth } {
    ace_run_step synthesis { run_synthesis }
} else {
    puts "ACE-Seek: skip synthesis (resume — netlist present)"
}

# Post-synthesis STA: timing + power with ideal clocks, estimated parasitics
if { !$skip_synth || $until eq "synthesis" } {
    if { [catch { ace_run_sta_reports synthesis } serr] } {
        puts "ACE-Seek: synthesis_sta warning: $serr"
    }
}

if { $until eq "synthesis" } {
    puts "ACE-Seek: stopped after synthesis (as requested)"
    catch { save_final_views }
    catch { save_state }
    exit 0
}

# ── floorplan (+ PDN / powerplan — OpenLane has no separate PDN stop) ──
# run_floorplan = die/core + IO + tap/endcap + PDN rails/straps/rings
# It does NOT run global/detailed placement (GPL/DPL).
if { !$skip_fp } {
    # Critical: resume after place/route leaves CURRENT_NETLIST on routing/*.nl.v
    ace_rewind_to_synthesis_netlist
    # Critical: resume config.tcl often drops FP_PIN_ORDER_CFG → all pins on bottom
    ace_ensure_pin_order_cfg
    # Critical: resume often keeps FP_PDN_CORE_RING=0 / MULTILAYER=0 → no rings
    ace_ensure_pdn_rings
    ace_run_step floorplan { run_floorplan }
} else {
    puts "ACE-Seek: skip floorplan (resume — floorplan DEF present)"
}

# Post-floorplan STA: timing + power after die/IO/PDN, before any placement
if { !$skip_fp || $until eq "floorplan" || $until eq "powerplan" } {
    if { [catch { ace_run_sta_reports floorplan } ferr] } {
        puts "ACE-Seek: floorplan_sta warning: $ferr"
    }
}

if { $until eq "floorplan" || $until eq "powerplan" } {
    # Prune AFTER success so we never delete the netlist floorplan still needs
    ace_prune_after_floorplan
    puts "ACE-Seek: stopped after floorplan/PDN (as requested) — placement was NOT run"
    catch { save_final_views }
    catch { save_state }
    exit 0
}

# ── placement ───────────────────────────────────────────────────
# STA scripts always try to write results/signoff/*.sdf — ensure dir exists
if { [info exists ::env(RUN_DIR)] } {
    file mkdir "$::env(RUN_DIR)/results/signoff"
    file mkdir "$::env(RUN_DIR)/results/placement"
}
if { !$skip_place } {
    # Ensure post-place STA with estimated parasitics (gpl_sta / dpl_sta reports)
    set ::env(PL_ESTIMATE_PARASITICS) 1
    ace_run_step placement { run_placement }
} else {
    puts "ACE-Seek: skip placement (resume — placement DEF present)"
}

# Post-placement STA: timing + power with estimated parasitics, ideal clocks
# Report extraction is handled by pack_stage_reports.sh on the host side.
if { !$skip_place || $until eq "placement" || [ace_has_placement] } {
    set ::env(PL_ESTIMATE_PARASITICS) 1
    if { [catch { ace_run_sta_reports placement } perr] } {
        puts "ACE-Seek: placement_sta warning: $perr"
    }
}

if { $until eq "placement" } {
    puts "ACE-Seek: stopped after placement (as requested)"
    catch { save_final_views }
    catch { save_state }
    exit 0
}

# ── CTS ─────────────────────────────────────────────────────────
if { !$skip_cts } {
    ace_run_step cts { run_cts }
} else {
    puts "ACE-Seek: skip CTS (resume — cts DEF present)"
}

# Post-CTS STA: propagated clock timing + power reports
if { !$skip_cts || $until eq "cts" } {
    if { [catch { ace_run_sta_reports cts } cterr] } {
        puts "ACE-Seek: cts_sta warning: $cterr"
    }
}

if { $until eq "cts" } {
    puts "ACE-Seek: stopped after CTS (as requested)"
    catch { save_final_views }
    catch { save_state }
    exit 0
}

# ── routing ─────────────────────────────────────────────────────
if { !$skip_route } {
    ace_run_step routing { run_routing }
} else {
    puts "ACE-Seek: skip routing (resume — routing DEF present)"
}

# Post-routing STA: wire-parasitic-loaded timing + power reports
if { !$skip_route || $until eq "routing" || $until eq "route" } {
    if { [catch { ace_run_sta_reports routing } rterr] } {
        puts "ACE-Seek: routing_sta warning: $rterr"
    }
}

if { $until eq "routing" || $until eq "route" } {
    puts "ACE-Seek: stopped after routing (as requested)"
    catch { save_final_views }
    catch { save_state }
    exit 0
}

# ── signoff chain ───────────────────────────────────────────────
# Signoff STA: SPEF-extracted multi-corner parasitics
if { [catch {
    puts "ACE-Seek: === step signoff_parasitics_sta ==="
    run_parasitics_sta
    puts "ACE-Seek: === step signoff_parasitics_sta OK ==="
} spsta_err] } {
    puts "ACE-Seek: signoff_parasitics_sta warning: $spsta_err"
}

# IR drop analysis
if { [catch {
    puts "ACE-Seek: === step signoff_irdrop ==="
    run_irdrop_report
    puts "ACE-Seek: === step signoff_irdrop OK ==="
} irdrop_err] } {
    puts "ACE-Seek: signoff_irdrop warning: $irdrop_err"
}

if { [info exists ::env(RUN_MAGIC)] ? $::env(RUN_MAGIC) : 1 } {
    ace_run_step gds_magic { run_magic }
}

if { [info exists ::env(RUN_MAGIC_DRC)] ? $::env(RUN_MAGIC_DRC) : 1 } {
    if { [catch {
        puts "ACE-Seek: === step signoff_magic_drc ==="
        run_magic_drc
        puts "ACE-Seek: === step signoff_magic_drc OK ==="
    } drc_err] } {
        puts "ACE-Seek: signoff_magic_drc warning: $drc_err"
    }
}

if { [info exists ::env(RUN_ANTENNA_CHECK)] ? $::env(RUN_ANTENNA_CHECK) : 1 } {
    if { [catch {
        puts "ACE-Seek: === step signoff_antenna ==="
        run_antenna_check
        puts "ACE-Seek: === step signoff_antenna OK ==="
    } ant_err] } {
        puts "ACE-Seek: signoff_antenna warning: $ant_err"
    }
}

if { [catch {
    puts "ACE-Seek: === step signoff_klayout ==="
    run_klayout
    puts "ACE-Seek: === step signoff_klayout OK ==="
} kl_err] } {
    puts "ACE-Seek: signoff_klayout warning: $kl_err"
}

if { $until eq "drc" } {
    puts "ACE-Seek: stopped after DRC (as requested)"
    catch { save_final_views }
    catch { save_state }
    exit 0
}

if { [info exists ::env(RUN_LVS)] ? $::env(RUN_LVS) : 1 } {
    if { [catch {
        puts "ACE-Seek: === step signoff_spice_export ==="
        run_magic_spice_export
        puts "ACE-Seek: === step signoff_spice_export OK ==="
    } spice_err] } {
        puts "ACE-Seek: signoff_spice_export warning: $spice_err"
    }
    if { [catch {
        puts "ACE-Seek: === step signoff_lvs ==="
        run_lvs
        puts "ACE-Seek: === step signoff_lvs OK ==="
    } lvs_err] } {
        puts "ACE-Seek: signoff_lvs warning: $lvs_err"
    }
}

if { $until eq "lvs" } {
    puts "ACE-Seek: stopped after LVS (as requested)"
    catch { save_final_views }
    catch { save_state }
    exit 0
}

catch { save_final_views }
catch { save_state }
puts "ACE-Seek: flow complete (until=$until)"
exit 0
