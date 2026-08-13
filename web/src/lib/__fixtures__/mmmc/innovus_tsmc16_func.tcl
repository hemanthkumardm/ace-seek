################################################################################
# Constraints (Modes)
################################################################################
create_constraint_mode -name func \
    -sdc_files [list top_func.sdc]

################################################################################
# Library sets
################################################################################

# FFGNP - Best Case
create_library_set -name ffgnp_0p88v_125c \
    -timing [list \
        /mnt/data/pdk/generic_7nm/libs/stdcell_ulvt_ffgnp0p88v125c_ccs.lib \
        /mnt/data/pdk/generic_7nm/libs/stdcell_lvt_ffgnp0p88v125c_ccs.lib \
        /mnt/data/pdk/generic_7nm/libs/stdcell_rvt_ffgnp0p88v125c_ccs.lib \
        /mnt/data/pdk/generic_7nm/libs/sram_ffgnp0p88v125c.lib \
    ]

# SSGNP - Worst Case
create_library_set -name ssgnp_0p72v_m40c \
    -timing [list \
        /mnt/data/pdk/generic_7nm/libs/stdcell_ulvt_ssgnp0p72vm40c_ccs.lib \
        /mnt/data/pdk/generic_7nm/libs/stdcell_lvt_ssgnp0p72vm40c_ccs.lib \
        /mnt/data/pdk/generic_7nm/libs/stdcell_rvt_ssgnp0p72vm40c_ccs.lib \
        /mnt/data/pdk/generic_7nm/libs/sram_ssgnp0p72vm40c.lib \
    ]

################################################################################
# RC Corners
################################################################################
create_rc_corner -name cbest_125c \
    -temperature 125 \
    -qrc_tech /mnt/data/pdk/generic_7nm/rc/cbest/qrcTechFile

create_rc_corner -name rcworst_m40c \
    -temperature -40 \
    -qrc_tech /mnt/data/pdk/generic_7nm/rc/rcworst/qrcTechFile

################################################################################
# Operating Conditions
################################################################################
create_opcond -name ffgnp_op_best_125c \
    -process 1 \
    -voltage 0.88 \
    -temperature 125

create_opcond -name ssgnp_op_worst_m40c \
    -process 1 \
    -voltage 0.72 \
    -temperature -40

################################################################################
# Delay Corners
################################################################################
create_delay_corner -name ffgnp_hold_corner \
    -library_set ffgnp_0p88v_125c \
    -opcond ffgnp_op_best_125c \
    -rc_corner cbest_125c

create_delay_corner -name ssgnp_setup_corner \
    -library_set ssgnp_0p72v_m40c \
    -opcond ssgnp_op_worst_m40c \
    -rc_corner rcworst_m40c

################################################################################
# Analysis Views
################################################################################
create_analysis_view -name func_setup_view \
    -constraint_mode func \
    -delay_corner ssgnp_setup_corner

create_analysis_view -name func_hold_view \
    -constraint_mode func \
    -delay_corner ffgnp_hold_corner

################################################################################
# Set Analysis Views (Global Execution)
################################################################################
set_analysis_view \
    -setup {func_setup_view} \
    -hold {func_hold_view} \
    -leakage {func_hold_view} \
    -dynamic {func_setup_view}

puts "INFO: MMMC analysis views have been successfully initialized."
