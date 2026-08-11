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
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90cpdulvt_170a/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90cpdulvt_100f/tcbn16ffcllbwp16p90cpdulvtffgnp0p88v125c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90cpdlvt_170a/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90cpdlvt_100f/tcbn16ffcllbwp16p90cpdlvtffgnp0p88v125c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90_170b/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90_170b/tcbn16ffcllbwp16p90ffgnp0p88v125c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90cpd_170b/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90cpd_170b/tcbn16ffcllbwp16p90cpdffgnp0p88v125c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta64x64m4wbshoyd_130b/CCS/tsdn16ffcllulvta64x64m4wbshoyd_130b_ffgnp0p88v0p88v125c.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta256x64m4wbshoyd_130b/CCS/tsdn16ffcllulvta256x64m4wbshoyd_130b_ffgnp0p88v0p88v125c.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta512x32m4wbshoyd_130b/CCS/tsdn16ffcllulvta512x32m4wbshoyd_130b_ffgnp0p88v0p88v125c.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta1024x64m4wbshoyd_130b/CCS/tsdn16ffcllulvta1024x64m4wbshoyd_130b_ffgnp0p88v0p88v125c.lib \
    ]

# SSGNP - Worst Case
create_library_set -name ssgnp_0p72v_m40c \
    -timing [list \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90cpdulvt_170a/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90cpdulvt_100f/tcbn16ffcllbwp16p90cpdulvtssgnp0p72vm40c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90cpdlvt_170a/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90cpdlvt_100f/tcbn16ffcllbwp16p90cpdlvtssgnp0p72vm40c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90_170b/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90_170b/tcbn16ffcllbwp16p90ssgnp0p72vm40c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/StandardCell/base/tcbn16ffcllbwp16p90cpd_170b/TSMCHOME/digital/Front_End/timing_power_noise/CCS/tcbn16ffcllbwp16p90cpd_170b/tcbn16ffcllbwp16p90cpdssgnp0p72vm40c_ccs.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta64x64m4wbshoyd_130b/CCS/tsdn16ffcllulvta64x64m4wbshoyd_130b_ssgnp0p72v0p72vm40c.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta256x64m4wbshoyd_130b/CCS/tsdn16ffcllulvta256x64m4wbshoyd_130b_ssgnp0p72v0p72vm40c.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta512x32m4wbshoyd_130b/CCS/tsdn16ffcllulvta512x32m4wbshoyd_130b_ssgnp0p72v0p72vm40c.lib \
        /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/LibrariesAndIPs/SRAM/MACROS/tsdn16ffcllulvta1024x64m4wbshoyd_130b/CCS/tsdn16ffcllulvta1024x64m4wbshoyd_130b_ssgnp0p72v0p72vm40c.lib \
    ]

################################################################################
# RC Corners
################################################################################
create_rc_corner -name cbest_125c \
    -temperature 125 \
    -qrc_tech /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/RC_RCExtraction/cbest/Tech/cbest/qrcTechFile

create_rc_corner -name rcworst_m40c \
    -temperature -40 \
    -qrc_tech /mnt/data/ExSLerateV2_BKND/TSMC_16nm_FFC/RC_RCExtraction/rcworst/Tech/rcworst/qrcTechFile

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
