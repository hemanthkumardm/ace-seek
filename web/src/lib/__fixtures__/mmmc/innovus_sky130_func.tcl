################################################################################
# Constraints (Modes)
################################################################################
create_constraint_mode -name func \
    -sdc_files [list top_func.sdc]

################################################################################
# Library sets
################################################################################

# Best Case Library Set
create_library_set -name ff_0p88v_125c \
    -timing [list \
        ./libs/stdcells_ulvt_fast_0p88v_125c.lib \
        ./libs/stdcells_lvt_fast_0p88v_125c.lib \
        ./libs/stdcells_rvt_fast_0p88v_125c.lib \
        ./libs/sram_macros_fast_0p88v_125c.lib \
    ]

# Worst Case Library Set
create_library_set -name ss_0p72v_m40c \
    -timing [list \
        ./libs/stdcells_ulvt_slow_0p72v_m40c.lib \
        ./libs/stdcells_lvt_slow_0p72v_m40c.lib \
        ./libs/stdcells_rvt_slow_0p72v_m40c.lib \
        ./libs/sram_macros_slow_0p72v_m40c.lib \
    ]

################################################################################
# RC Corners
################################################################################
create_rc_corner -name cbest_125c \
    -temperature 125 \
    -qrc_tech ./tech/qrc_cbest.tch

create_rc_corner -name rcworst_m40c \
    -temperature -40 \
    -qrc_tech ./tech/qrc_rcworst.tch

################################################################################
# Operating Conditions
################################################################################
create_opcond -name op_best_125c \
    -process 1 \
    -voltage 0.88 \
    -temperature 125

create_opcond -name op_worst_m40c \
    -process 1 \
    -voltage 0.72 \
    -temperature -40

################################################################################
# Delay Corners
################################################################################
create_delay_corner -name hold_corner \
    -library_set ff_0p88v_125c \
    -opcond op_best_125c \
    -rc_corner cbest_125c

create_delay_corner -name setup_corner \
    -library_set ss_0p72v_m40c \
    -opcond op_worst_m40c \
    -rc_corner rcworst_m40c

################################################################################
# Analysis Views
################################################################################
create_analysis_view -name func_setup_view \
    -constraint_mode func \
    -delay_corner setup_corner

create_analysis_view -name func_hold_view \
    -constraint_mode func \
    -delay_corner hold_corner

################################################################################
# Set Analysis Views (Global Execution)
################################################################################
set_analysis_view \
    -setup {func_setup_view} \
    -hold {func_hold_view} \
    -leakage {func_hold_view} \
    -dynamic {func_setup_view}

puts "INFO: MMMC analysis views have been successfully initialized."

