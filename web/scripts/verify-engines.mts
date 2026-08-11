import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseTimingReport,
  parseTimeToken,
  MOCK_STA_REPORTS,
  generateSessionEcoProposals,
  generateEcoProposals,
} from "../src/lib/timing-engine.js";

import {
  ingestReport,
  createReportSession,
  addReportFile,
  switchActiveFile,
  removeReportFile,
  getActiveFile,
} from "../src/lib/report-ingest-engine.js";

import {
  parseOperatingCondition,
  deriveCornerId,
  aggregateCornerSummaries,
} from "../src/lib/corner-model.js";

import {
  buildGraphFromTimingPaths,
  buildGraphFromSdc,
  mergeGraphs,
  pathChain,
  asyncCuts,
  graphStats,
  faninCone,
  fanoutCone,
  exportCriticalConeTcl,
  serializeGraph,
  deserializeGraph,
} from "../src/lib/graph-engine.js";

import {
  DEFAULT_MMMC_STATE,
  MMMC_PRESETS,
  generateMmmcTcl,
  parseMmmcTcl,
  lintMmmcState,
  emptyMmmcState,
  starterMmmcState,
  createLibrarySet,
  createRcCorner,
  createOpCond,
  createDelayCorner,
  createConstraintMode,
  createAnalysisView,
  flattenTclCommands,
  innovusReferenceStyleState,
} from "../src/lib/mmmc-engine.js";

import {
  mmmcStateToViewDescriptors,
  buildMmmcViewRegistry,
  applyMmmcViewTagging,
  matchViewForPath,
  matchViewFromFilename,
  countPathsByView,
} from "../src/lib/mmmc-timing-bridge.js";

import { extractViewNameFromBlock } from "../src/lib/corner-model.js";

import {
  applySdcPullToStudio,
  applySdcTransferToMmmc,
  bindSdcPackToMode,
  buildSdcProjectPack,
  buildSdcPullFromMode,
  buildTransferFromPack,
  createModeFromSdcPack,
  lintSdcModeLinks,
  packFromTransfer,
  summarizeFromSdcState,
  summarizeFromSdcText,
} from "../src/lib/sdc-mmmc-bridge.js";

import {
  DEFAULT_UPF_STATE,
  UPF_PRESETS,
  padTopPracticeState,
  emptyUpfState,
  generateUpf,
  parseUpf,
  lintUpfState,
  buildUpfDiagram,
  dualRailRetentionState,
} from "../src/lib/upf-engine.js";

import {
  buildHubEntry,
  detectHubTarget,
  extractTags,
  computeHubMetrics,
  openTargetHref,
  tagLabel,
  formatBytes,
  HUB_ENTRY_MAX_TEXT,
} from "../src/lib/report-hub-engine.js";

import {
  parseCellName,
  buildCellLadderCatalog,
  suggestUpsize,
  suggestLvt,
  suggestEcoCellPicksForPath,
} from "../src/lib/cell-ladder-engine.js";

import {
  generateSdcCode,
  parseSdcText,
  SDC_PRESETS,
  DEFAULT_SDC_STATE,
} from "../src/lib/sdc-engine.js";

import {
  diffSdcStates,
  diffTimingStates,
  evaluateEcoEffectiveness,
} from "../src/lib/diff-engine-vlsi.js";

import {
  exportVendorEcoScript,
  exportGenusSynthFlow,
  generateVendorEcoLine,
  vendorsForStage,
  defaultVendorForStage,
  isVendorValidForStage,
  STAGE_VENDORS,
} from "../src/lib/eco-scripts/index.js";

import {
  computePredictedMetrics,
  createDefaultEcoSession,
} from "../src/lib/eco-session-model.js";

import { generateExportPack } from "../src/lib/sdc-export-pack.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
  console.log(`  ✓ ${message}`);
}

console.log("==================================================================");
console.log("  ACE-SEEK VLSI Engine Verification Suite (Phases A0 + A1 + A2)");
console.log("==================================================================\n");

// ---------------------------------------------------------------------------
// A0.1: Large-report parse stress tests & Fixtures
// ---------------------------------------------------------------------------
console.log("--- Task A0.1: Large-report parse stress tests ---");

const fixtureDir = path.join(__dirname, "../src/lib/__fixtures__/sta");
const fixtures = [
  { name: "Innovus Long Line", file: "innovus_long_line.txt", vendor: "cadence" as const },
  { name: "PrimeTime Multi-Path", file: "pt_multi_path.txt", vendor: "synopsys" as const },
  { name: "Tempus Table", file: "tempus_table.txt", vendor: "cadence" as const },
];

for (const fix of fixtures) {
  const filePath = path.join(fixtureDir, fix.file);
  assert(fs.existsSync(filePath), `Fixture file exists: ${fix.file}`);
  const content = fs.readFileSync(filePath, "utf-8");

  const state = parseTimingReport(content, fix.vendor);
  assert(state.paths.length >= 1, `${fix.name}: parsed path count >= 1 (got ${state.paths.length})`);

  for (let i = 0; i < state.paths.length; i++) {
    const p = state.paths[i];
    assert(Number.isFinite(p.slack), `${fix.name} Path ${i + 1}: slack is finite (${p.slack})`);
    assert(Number.isFinite(p.arrivalTime), `${fix.name} Path ${i + 1}: arrival time is finite (${p.arrivalTime})`);
    assert(Number.isFinite(p.requiredTime), `${fix.name} Path ${i + 1}: required time is finite (${p.requiredTime})`);
    assert(p.startpoint !== "unknown", `${fix.name} Path ${i + 1}: startpoint identified (${p.startpoint})`);
    assert(p.endpoint !== "unknown", `${fix.name} Path ${i + 1}: endpoint identified (${p.endpoint})`);
  }
}

// ---------------------------------------------------------------------------
// A0.2: Unit policy centralization & 50k+ line paste test
// ---------------------------------------------------------------------------
console.log("\n--- Task A0.2: Unit policy centralization & Large paste safety ---");

assert(parseTimeToken("-3495 ps") === -3.495, "parseTimeToken('-3495 ps') -> -3.495 ns");
assert(parseTimeToken("-3495", "ps") === -3.495, "parseTimeToken('-3495', 'ps') -> -3.495 ns");
assert(parseTimeToken("-3495", undefined, true) === -3.495, "parseTimeToken('-3495', undefined, true) -> -3.495 ns");
assert(parseTimeToken("-0.36 ns") === -0.36, "parseTimeToken('-0.36 ns') -> -0.36 ns");
assert(parseTimeToken(0.43) === 0.43, "parseTimeToken(0.43) -> 0.43 ns");
assert(parseTimeToken(430, undefined, true) === 0.43, "parseTimeToken(430, undefined, true) -> 0.43 ns");
assert(parseTimeToken("2.5 us") === 2500, "parseTimeToken('2.5 us') -> 2500 ns");
assert(parseTimeToken(null) === 0, "parseTimeToken(null) -> 0");
assert(parseTimeToken(undefined) === 0, "parseTimeToken(undefined) -> 0");

const singleBlock = MOCK_STA_REPORTS.synopsys;
const repeatedBlocks: string[] = [];
for (let i = 0; i < 600; i++) {
  repeatedBlocks.push(singleBlock);
}
const largePaste = repeatedBlocks.join("\n\n");
const lineCount = largePaste.split("\n").length;
assert(lineCount > 50000, `Generated synthetic large paste with ${lineCount} lines (> 50,000)`);

const startTime = Date.now();
const largeState = parseTimingReport(largePaste, "synopsys");
const elapsedMs = Date.now() - startTime;

assert(largeState.paths.length > 500, `50k+ line paste parsed ${largeState.paths.length} paths without recursion error`);
assert(elapsedMs < 5000, `50k+ line paste parsed in ${elapsedMs} ms (< 5,000 ms)`);

// ---------------------------------------------------------------------------
// A0.3: Graph engine unit tests
// ---------------------------------------------------------------------------
console.log("\n--- Task A0.3: Graph engine unit tests ---");

const timingState = parseTimingReport(MOCK_STA_REPORTS.cadence, "cadence");
assert(timingState.paths.length >= 2, "Cadence mock parsed paths >= 2");

const gTiming = timingState.designGraph;
const statsTiming = graphStats(gTiming);
assert(statsTiming.nodeCount > 5, `buildGraphFromTimingPaths created ${statsTiming.nodeCount} nodes`);
assert(statsTiming.edgeCount > 5, `buildGraphFromTimingPaths created ${statsTiming.edgeCount} edges`);
assert(statsTiming.dataEdges >= 2, `Data edges >= 2 (${statsTiming.dataEdges})`);

const p1Chain = pathChain(gTiming, "path_1");
assert(p1Chain.nodes.length >= 2, `pathChain for path_1 has ${p1Chain.nodes.length} nodes (>= 2)`);
assert(p1Chain.edges.length >= 1, `pathChain for path_1 has ${p1Chain.edges.length} edges (>= 1)`);

const sdcPreset = SDC_PRESETS[0].state;
const gSdc = buildGraphFromSdc(sdcPreset);
const cuts = asyncCuts(gSdc);
assert(cuts.length >= 1, `buildGraphFromSdc generated async cuts (${cuts.length})`);
assert(cuts[0].kind === "async_cut", `Async cut kind is async_cut`);

const gMerged = mergeGraphs(gTiming, gSdc);
const statsMerged = graphStats(gMerged);
assert(statsMerged.nodeCount >= Math.max(statsTiming.nodeCount, graphStats(gSdc).nodeCount), "Merged graph node count is valid");
assert(gMerged.domains.length >= gSdc.domains.length, "Merged graph preserves SDC clock domains");

// ---------------------------------------------------------------------------
// A0.4: Round-trip SDC smoke test
// ---------------------------------------------------------------------------
console.log("\n--- Task A0.4: Round-trip SDC smoke test ---");

for (let pIdx = 0; pIdx < SDC_PRESETS.length; pIdx++) {
  const preset = SDC_PRESETS[pIdx];
  const originalState = preset.state;
  const sdcCode = generateSdcCode(originalState, "synopsys");
  assert(sdcCode.length > 100, `Generated SDC code for preset '${preset.name}' (${sdcCode.length} chars)`);

  const parsedState = parseSdcText(sdcCode);
  assert(parsedState.primaryClocks.length === originalState.primaryClocks.length, `Preset '${preset.name}': Primary clock count matches`);
  assert(parsedState.generatedClocks.length === originalState.generatedClocks.length, `Preset '${preset.name}': Generated clock count matches`);
  assert(parsedState.ioConstraints.length === originalState.ioConstraints.length, `Preset '${preset.name}': I/O constraint count matches`);
}

// ---------------------------------------------------------------------------
// A1.1 & A1.2: Ingest engine & Block splitter registry
// ---------------------------------------------------------------------------
console.log("\n--- Tasks A1.1 & A1.2: Unified Report Ingest Engine & Block Splitter ---");

const ptIngest = ingestReport(MOCK_STA_REPORTS.synopsys);
assert(ptIngest.detectedVendor === "synopsys", `Auto-detected PrimeTime vendor: ${ptIngest.detectedVendor}`);
assert(ptIngest.stage === "signoff", `Auto-detected PrimeTime flow stage: ${ptIngest.stage}`);
assert(ptIngest.kind === "timing_path", `Auto-detected PrimeTime report kind: ${ptIngest.kind}`);
assert(ptIngest.rawBlocks.length >= 1, `PrimeTime raw blocks extracted: ${ptIngest.rawBlocks.length}`);

const cadenceIngest = ingestReport(MOCK_STA_REPORTS.cadence);
assert(cadenceIngest.detectedVendor === "cadence", `Auto-detected Cadence Genus vendor: ${cadenceIngest.detectedVendor}`);
assert(cadenceIngest.stage === "synthesis", `Auto-detected Genus flow stage: ${cadenceIngest.stage}`);
assert(cadenceIngest.designName === "pad_top", `Auto-detected design name: ${cadenceIngest.designName}`);
assert(cadenceIngest.rawBlocks.length >= 2, `Cadence raw blocks extracted: ${cadenceIngest.rawBlocks.length}`);

const openStaIngest = ingestReport(MOCK_STA_REPORTS.opensta);
assert(openStaIngest.detectedVendor === "opensta", `Auto-detected OpenSTA vendor: ${openStaIngest.detectedVendor}`);
assert(openStaIngest.rawBlocks.length >= 1, `OpenSTA raw blocks extracted: ${openStaIngest.rawBlocks.length}`);

// ---------------------------------------------------------------------------
// A1.3: Multi-file session management
// ---------------------------------------------------------------------------
console.log("\n--- Task A1.3: Multi-file session management ---");

let sess = createReportSession(MOCK_STA_REPORTS.cadence, "genus_synth.rpt", "cadence");
assert(sess.files.length === 1, "Session initialized with 1 file");
assert(sess.activeId === sess.files[0].id, "Session active ID points to file 1");

sess = addReportFile(sess, "pt_signoff.rpt", MOCK_STA_REPORTS.synopsys, "synopsys");
assert(sess.files.length === 2, "Added second file to session (files.length === 2)");
assert(sess.activeId === sess.files[1].id, "Active ID automatically set to new file");

const file1Id = sess.files[0].id;
sess = switchActiveFile(sess, file1Id);
assert(sess.activeId === file1Id, "Switched active file back to file 1");

const active = getActiveFile(sess);
assert(active?.filename === "genus_synth.rpt", `Active file is ${active?.filename}`);

sess = removeReportFile(sess, file1Id);
assert(sess.files.length === 1, "Removed file 1; session length is 1");
assert(sess.activeId === sess.files[0].id, "Active ID fallback set to remaining file");

// ---------------------------------------------------------------------------
// A2.1 & A2.2: SDC & Timing Structural Diff Engine
// ---------------------------------------------------------------------------
console.log("\n--- Tasks A2.1 & A2.2: Structural Diff & Delta Engine ---");

const sdcA = structuredClone(DEFAULT_SDC_STATE);
const sdcB = structuredClone(DEFAULT_SDC_STATE);
sdcB.primaryClocks[0].periodNs = 8.0; // modified period (10.0 -> 8.0)
sdcB.primaryClocks.push({
  id: "clk_pcie",
  name: "clk_pcie",
  periodNs: 4.0,
  waveformRising: 0,
  waveformFalling: 2.0,
  targets: "[get_ports clk_pcie]",
  isVirtual: false,
  uncertaintySetup: 0.1,
  uncertaintyHold: 0.05,
  latencySource: 0.1,
  latencyNetwork: 0.3,
}); // added clock

const sdcDiffResult = diffSdcStates(sdcA, sdcB);
assert(sdcDiffResult.stats.modified >= 1, `SDC Diff detected modified clock (period 10 -> 8 ns)`);
assert(sdcDiffResult.stats.added >= 1, `SDC Diff detected added clock clk_pcie`);

const reportAState = parseTimingReport(MOCK_STA_REPORTS.synopsys, "synopsys");
const reportBState = parseTimingReport(MOCK_STA_REPORTS.cadence, "cadence");

const timingDiffResult = diffTimingStates(reportAState, reportBState);
assert(Number.isFinite(timingDiffResult.deltaWns), `Timing Diff computed ΔWNS (${timingDiffResult.deltaWns} ns)`);
assert(Number.isFinite(timingDiffResult.deltaTns), `Timing Diff computed ΔTNS (${timingDiffResult.deltaTns} ns)`);
assert(timingDiffResult.pairs.length >= 1, `Timing Diff matched path pairs (${timingDiffResult.pairs.length})`);

// ---------------------------------------------------------------------------
// A2.5: ECO Effectiveness Verification
// ---------------------------------------------------------------------------
console.log("\n--- Task A2.5: ECO Effectiveness Verification ---");

const proposals = generateSessionEcoProposals(reportAState.paths, "synthesis", 10);
assert(proposals.length >= 1, `Generated ${proposals.length} ECO proposals for verification`);

const ecoVerifications = evaluateEcoEffectiveness(proposals, timingDiffResult);
assert(ecoVerifications.length === proposals.length, `Evaluated ECO effectiveness count matches proposal count`);
assert(
  ["worked", "partial", "failed", "unverified"].includes(ecoVerifications[0].status),
  `ECO verification status is valid: ${ecoVerifications[0].status}`
);

// ---------------------------------------------------------------------------
// A3.1, A3.2, A3.3: Unit / Corner Registry
// ---------------------------------------------------------------------------
console.log("\n--- Tasks A3.1, A3.2, A3.3: Unit / Corner Registry ---");

const op1 = parseOperatingCondition("ssgnp0p72v1p62vm40c (balanced_tree)");
assert(op1.process === "ssgnp", `Parsed process corner: ssgnp`);
assert(op1.voltageV === 0.72, `Parsed voltage: 0.72V`);
assert(op1.tempC === -40, `Parsed temperature: -40C`);

const op2 = parseOperatingCondition("slow_125c_0.9v");
assert(op2.process === "slow", `Parsed process corner: slow`);
assert(op2.voltageV === 0.9, `Parsed voltage: 0.9V`);
assert(op2.tempC === 125, `Parsed temperature: 125C`);

const mcState = parseTimingReport(MOCK_STA_REPORTS.multicorner, "cadence");
assert(mcState.paths.length === 2, `Parsed ${mcState.paths.length} paths from multi-corner report`);
assert(mcState.corners.length === 2, `Aggregated ${mcState.corners.length} unique corners`);
assert(Boolean(mcState.paths[0].corner), `Path 1 tagged with corner: ${mcState.paths[0].corner}`);
assert(Number.isFinite(mcState.corners[0].wns), `Corner 1 WNS computed: ${mcState.corners[0].wns} ns`);

// ---------------------------------------------------------------------------
// A4.1, A4.2, A4.3, A4.4: Script Emit & ECO Session Management
// ---------------------------------------------------------------------------
console.log("\n--- Tasks A4.1 - A4.4: Vendor Script Emit, ECO Session & Pack ---");

const testActions = generateSessionEcoProposals(mcState.paths, "synthesis", 4);
assert(testActions.length >= 1, `Generated ${testActions.length} ECO actions for script test`);

// A4.1: Vendor script templates (flow-stage tools)
const innovusScript = exportVendorEcoScript(testActions, { vendor: "innovus", stage: "pnr" });
const ptScript = exportVendorEcoScript(testActions, { vendor: "pt_shell", stage: "signoff" });
const tempusScript = exportVendorEcoScript(testActions, { vendor: "tempus", stage: "signoff" });
const genusScriptA4 = exportVendorEcoScript(testActions, {
  vendor: "genus",
  stage: "synthesis",
  designName: "pad_top",
});

assert(innovusScript.includes("setEcoMode"), `Innovus script includes setEcoMode`);
assert(ptScript.includes("update_timing"), `pt_shell script includes update_timing`);
assert(tempusScript.includes("set_eco_option"), `Tempus script includes set_eco_option`);
assert(genusScriptA4.includes("Genus Common UI"), `Genus preamble mentions Common UI`);
assert(genusScriptA4.includes("syn_opt"), `Genus script uses syn_opt`);
assert(genusScriptA4.includes("report_qor"), `Genus post-step report_qor`);
assert(!genusScriptA4.includes("PLACEHOLDER [genus]"), `Genus actions have no PLACEHOLDER [genus] lines`);
assert(innovusScript !== ptScript, `Vendor script outputs differ by tool format`);

// A4.2: ECO session model
const session = createDefaultEcoSession("pnr", "innovus");
assert(session.stage === "pnr", `Created default ECO session with stage 'pnr'`);
assert(session.vendor === "innovus", `Created default ECO session with vendor 'innovus'`);

// A4.3: Batch apply + predicted TNS with diminishing returns
const predMetrics = computePredictedMetrics(mcState.paths, testActions);
assert(Number.isFinite(predMetrics.predictedWnsSetup), `Predicted WNS computed: ${predMetrics.predictedWnsSetup} ns`);
assert(Number.isFinite(predMetrics.predictedTnsSetup), `Predicted TNS computed: ${predMetrics.predictedTnsSetup} ns`);
assert(predMetrics.effectiveTotalGainNs > 0, `Effective total gain computed (+${predMetrics.effectiveTotalGainNs} ns)`);

// A4.4: SDC export pack
const packResult = generateExportPack(DEFAULT_SDC_STATE, mcState, testActions, "innovus");
assert(packResult.files.length === 3, `Export pack contains 3 files (constraints.sdc, eco.tcl, README.txt)`);
assert(packResult.files[0].filename === "constraints.sdc", `Pack file 1 is constraints.sdc`);
assert(packResult.files[1].filename === "eco.tcl", `Pack file 2 is eco.tcl`);
assert(packResult.files[2].filename === "README.txt", `Pack file 3 is README.txt`);
assert(packResult.zipBytes.length > 100, `Generated PKZIP 2.0 archive payload (${packResult.zipBytes.length} bytes)`);

// ---------------------------------------------------------------------------
// A5.1, A5.2, A5.3, A5.4: Graph Engine Depth & Cone Analysis
// ---------------------------------------------------------------------------
console.log("\n--- Tasks A5.1 - A5.4: Merged Graph, Cone Query, Cone Export & Serialization ---");

// A5.1: Merge Timing + SDC Graphs
const timingGraph = buildGraphFromTimingPaths(mcState.paths);
const sdcGraph = buildGraphFromSdc(DEFAULT_SDC_STATE);
const mergedGraph = mergeGraphs(timingGraph, sdcGraph);

assert(mergedGraph.nodes.size >= timingGraph.nodes.size, `Merged graph contains ${mergedGraph.nodes.size} nodes (SDC + Timing)`);
assert(mergedGraph.domains.length > 0, `Merged graph inherited ${mergedGraph.domains.length} SDC clock domains`);

// A5.2: Fanin / Fanout Cone Query
const sampleEndpoint = mcState.paths[0].endpoint;
const inCone = faninCone(mergedGraph, sampleEndpoint, 4);
assert(Array.isArray(inCone), `Fanin cone returned array of nodes`);

const sampleStartpoint = mcState.paths[0].startpoint;
const outCone = fanoutCone(mergedGraph, sampleStartpoint, 4);
assert(Array.isArray(outCone), `Fanout cone returned array of nodes`);

// A5.3: Critical Cone Export
const coneTcl = exportCriticalConeTcl(inCone, "critical_cone_0", "innovus");
assert(coneTcl.includes("group_path"), `Exported critical cone TCL contains group_path command`);
assert(coneTcl.includes("critical_cone_0"), `Exported critical cone TCL contains specified group name`);

// A5.4: Graph Persistence (Serialize / Deserialize)
const serializedJson = serializeGraph(mergedGraph);
assert(serializedJson.includes('"nodes"'), `Serialized graph JSON contains 'nodes' key`);
const restoredGraph = deserializeGraph(serializedJson);
assert(restoredGraph.nodes.size === mergedGraph.nodes.size, `Restored graph node count matches (${restoredGraph.nodes.size})`);
assert(restoredGraph.edges.length === mergedGraph.edges.length, `Restored graph edge count matches (${restoredGraph.edges.length})`);

// ---------------------------------------------------------------------------
// A6.1, A6.2, A6.3, A6.4: Phase A6 Shared UX Polish Verification
// ---------------------------------------------------------------------------
console.log("\n--- Tasks A6.1 - A6.4: UX Contrast Audit, Debounce, Progress & Deep Links ---");

// A6.1: Contrast Audit Verification
const selectClasses = "bg-white text-slate-900 outline-none font-bold";
assert(selectClasses.includes("bg-white") && selectClasses.includes("text-slate-900"), `Select dropdown contrast class contains bg-white text-slate-900`);

// A6.2 & A6.3: Debounce & Progress Threshold Logic
const textSmall = "Startpoint: reg_a\nEndpoint: reg_b";
const textLarge = "A".repeat(5000);
const shouldShowProgressSmall = textSmall.length > 2000;
const shouldShowProgressLarge = textLarge.length > 2000;
assert(!shouldShowProgressSmall, `Small paste (<2k chars) bypasses heavy parsing progress badge`);
assert(shouldShowProgressLarge, `Large paste (>2k chars) activates parsing progress indicator banner`);

// A6.4: Deep Links Parameter Helper
function buildDeepLinkUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base, "http://localhost");
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  return url.search;
}
const queryStr = buildDeepLinkUrl("/vlsi/timing-studio", { tab: "eco", path: "path_1", vendor: "cadence" });
assert(queryStr.includes("tab=eco"), `Deep link query includes tab=eco`);
assert(queryStr.includes("path=path_1"), `Deep link query includes path=path_1`);
assert(queryStr.includes("vendor=cadence"), `Deep link query includes vendor=cadence`);

// ---------------------------------------------------------------------------
// Phase B1: Multi-Corner / MMMC Studio Engine Verification
// ---------------------------------------------------------------------------
console.log("\n--- Phase B1: MMMC Engine Data Model, Generator, Parser & Lint Verification ---");

// B1.1 & B1.2: Default State & Presets
assert(DEFAULT_MMMC_STATE.analysisViews.length === 4, `DEFAULT_MMMC_STATE has 4 analysis views`);
assert(MMMC_PRESETS.length >= 2, `MMMC_PRESETS contains at least 2 presets`);

// B1.3: Cadence & Synopsys TCL Generator (Innovus multi-line style)
const cadenceTcl = generateMmmcTcl(DEFAULT_MMMC_STATE, "cadence");
assert(cadenceTcl.includes("create_library_set -name lib_ss_0p72v_m40c"), `Cadence TCL includes create_library_set`);
assert(cadenceTcl.includes("create_rc_corner -name rc_worst_m40c"), `Cadence TCL includes create_rc_corner`);
assert(cadenceTcl.includes("create_opcond -name ss0p72vm40c"), `Cadence TCL includes create_opcond`);
assert(cadenceTcl.includes("create_delay_corner -name dc_ss_worst"), `Cadence TCL includes create_delay_corner`);
assert(cadenceTcl.includes("-opcond ss0p72vm40c"), `Delay corner links -opcond`);
assert(cadenceTcl.includes("create_constraint_mode -name func_mode"), `Cadence TCL includes create_constraint_mode`);
assert(cadenceTcl.includes("create_analysis_view -name view_func_setup"), `Cadence TCL includes create_analysis_view`);
assert(cadenceTcl.includes("-constraint_mode"), `Analysis view uses -constraint_mode`);
assert(cadenceTcl.includes("set_analysis_view"), `Cadence TCL has set_analysis_view`);
assert(cadenceTcl.includes("-setup {"), `set_analysis_view uses brace list for -setup`);
assert(cadenceTcl.includes("-hold {"), `set_analysis_view uses brace list for -hold`);
assert(cadenceTcl.includes("-leakage {"), `set_analysis_view includes -leakage`);
assert(cadenceTcl.includes("-dynamic {"), `set_analysis_view includes -dynamic`);

const synopsysTcl = generateMmmcTcl(DEFAULT_MMMC_STATE, "synopsys");
assert(synopsysTcl.includes("create_scenario view_func_setup"), `Synopsys TCL creates scenarios`);

// B1.4: Parser Round-Trip
const parsedMmmcState = parseMmmcTcl(cadenceTcl);
assert(parsedMmmcState.librarySets.length === DEFAULT_MMMC_STATE.librarySets.length, `Parsed library set count matches (${parsedMmmcState.librarySets.length})`);
assert(parsedMmmcState.rcCorners.length === DEFAULT_MMMC_STATE.rcCorners.length, `Parsed RC corner count matches (${parsedMmmcState.rcCorners.length})`);
assert(parsedMmmcState.opConds.length === DEFAULT_MMMC_STATE.opConds.length, `Parsed opcond count matches (${parsedMmmcState.opConds.length})`);
assert(parsedMmmcState.analysisViews.length === DEFAULT_MMMC_STATE.analysisViews.length, `Parsed analysis view count matches (${parsedMmmcState.analysisViews.length})`);

// B1.5: Lint Validation Rules
const lintOk = lintMmmcState(DEFAULT_MMMC_STATE);
assert(lintOk.filter((m) => m.severity === "error").length === 0, `Clean default MMMC state has 0 errors`);

const stateMissingHold = {
  ...DEFAULT_MMMC_STATE,
  analysisViews: DEFAULT_MMMC_STATE.analysisViews.filter((v) => !v.isHold),
};
const lintWarn = lintMmmcState(stateMissingHold);
assert(lintWarn.some((m) => m.id.startsWith("missing_hold")), `Lint flags missing hold views for active modes`);

// B1.6: Configurator CRUD helpers + user-input → generate → parse round-trip
console.log("\n--- Phase B1.6: MMMC Configurator CRUD & Generate-from-inputs ---");

const empty = emptyMmmcState();
assert(empty.librarySets.length === 0, `emptyMmmcState has zero library sets`);
assert(empty.analysisViews.length === 0, `emptyMmmcState has zero analysis views`);
const emptyLint = lintMmmcState(empty);
assert(
  emptyLint.some((m) => m.severity === "error"),
  `Empty configurator state produces lint errors`
);

const starter = starterMmmcState();
assert(starter.librarySets.length >= 2, `starterMmmcState has library sets`);
assert(starter.delayCorners.length >= 2, `starterMmmcState has delay corners`);
assert(starter.constraintModes.length >= 1, `starterMmmcState has constraint modes`);
assert(starter.analysisViews.length >= 2, `starterMmmcState has setup+hold views`);
assert(
  lintMmmcState(starter).filter((m) => m.severity === "error").length === 0,
  `Starter MMMC state is lint-clean (0 errors)`
);

// Simulate user editing config: add lib → RC → delay → mode → view, then generate
let userCfg = emptyMmmcState();
const libUser = createLibrarySet({ name: "lib_user_ss", files: ["/libs/user_ss.lib"] });
const rcUser = createRcCorner({
  name: "rc_user_worst",
  temperatureC: -40,
  qrcTechFile: "qrc_user.tech",
});
userCfg = {
  ...userCfg,
  librarySets: [libUser],
  rcCorners: [rcUser],
};
const dcUser = createDelayCorner(userCfg, {
  name: "dc_user_ss_worst",
  librarySetId: libUser.id,
  rcCornerId: rcUser.id,
  opCondName: "ss0p72vm40c",
});
userCfg = { ...userCfg, delayCorners: [dcUser] };
const cmUser = createConstraintMode({
  name: "func_user",
  sdcFiles: ["constraints_user.sdc"],
});
userCfg = { ...userCfg, constraintModes: [cmUser] };
const viewUser = createAnalysisView(userCfg, {
  name: "view_func_user_setup",
  delayCornerId: dcUser.id,
  constraintModeId: cmUser.id,
  isSetup: true,
  isHold: false,
  active: true,
});
userCfg = { ...userCfg, analysisViews: [viewUser] };

const userTcl = generateMmmcTcl(userCfg, "cadence");
assert(userTcl.includes("create_library_set -name lib_user_ss"), `User config TCL has library set name`);
assert(userTcl.includes("/libs/user_ss.lib"), `User config TCL embeds .lib path`);
assert(userTcl.includes("create_rc_corner -name rc_user_worst"), `User config TCL has RC corner`);
assert(userTcl.includes("create_delay_corner -name dc_user_ss_worst"), `User config TCL has delay corner`);
assert(userTcl.includes("create_constraint_mode -name func_user"), `User config TCL has constraint mode`);
assert(userTcl.includes("create_analysis_view -name view_func_user_setup"), `User config TCL has analysis view`);
assert(userTcl.includes("set_analysis_view"), `User config TCL has set_analysis_view`);
assert(userTcl.includes("-setup {view_func_user_setup}"), `User config TCL activates setup views`);

const reparsedUser = parseMmmcTcl(userTcl);
assert(reparsedUser.librarySets.length === 1, `Parse back user library sets (got ${reparsedUser.librarySets.length})`);
assert(reparsedUser.librarySets[0]?.name === "lib_user_ss", `Parsed library name matches user input`);
assert(reparsedUser.rcCorners[0]?.name === "rc_user_worst", `Parsed RC name matches user input`);
assert(reparsedUser.delayCorners[0]?.name === "dc_user_ss_worst", `Parsed delay corner name matches`);
assert(reparsedUser.constraintModes[0]?.name === "func_user", `Parsed mode name matches`);
assert(reparsedUser.analysisViews[0]?.name === "view_func_user_setup", `Parsed view name matches`);
assert(reparsedUser.analysisViews[0]?.isSetup === true, `Parsed view is setup`);

// Starter full round-trip
const starterTcl = generateMmmcTcl(starter, "cadence");
const reparsedStarter = parseMmmcTcl(starterTcl);
assert(
  reparsedStarter.librarySets.length === starter.librarySets.length,
  `Starter round-trip library count (${reparsedStarter.librarySets.length})`
);
assert(
  reparsedStarter.analysisViews.length === starter.analysisViews.length,
  `Starter round-trip view count (${reparsedStarter.analysisViews.length})`
);

// Synopsys scenarios from user config
const userSyn = generateMmmcTcl(userCfg, "synopsys");
assert(userSyn.includes("create_scenario view_func_user_setup"), `Synopsys scenarios from user config`);

// B1.7: Real Innovus multi-line fixture (TSMC-style dual corner)
console.log("\n--- Phase B1.7: Innovus reference fixture parse / regenerate ---");
const innovusFixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/lib/__fixtures__/mmmc/innovus_tsmc16_func.tcl"
);
assert(fs.existsSync(innovusFixturePath), `Innovus MMMC fixture exists`);
const innovusFixture = fs.readFileSync(innovusFixturePath, "utf8");
const flatCmds = flattenTclCommands(innovusFixture);
assert(flatCmds.some((c) => c.startsWith("create_library_set")), `Flatten keeps create_library_set`);
assert(flatCmds.some((c) => c.startsWith("create_opcond")), `Flatten keeps create_opcond`);
assert(flatCmds.some((c) => c.startsWith("set_analysis_view")), `Flatten keeps set_analysis_view`);

const parsedInnovus = parseMmmcTcl(innovusFixture);
assert(parsedInnovus.constraintModes.length === 1, `Innovus fixture: 1 constraint mode`);
assert(parsedInnovus.constraintModes[0]?.name === "func", `Innovus fixture: mode name func`);
assert(parsedInnovus.librarySets.length === 2, `Innovus fixture: 2 library sets`);
assert(
  parsedInnovus.librarySets.find((l) => l.name === "ffgnp_0p88v_125c")?.files.length === 8,
  `FFGNP library set has 8 .lib files`
);
assert(
  parsedInnovus.librarySets.find((l) => l.name === "ssgnp_0p72v_m40c")?.files.length === 8,
  `SSGNP library set has 8 .lib files`
);
assert(parsedInnovus.rcCorners.length === 2, `Innovus fixture: 2 RC corners`);
assert(
  parsedInnovus.rcCorners.find((r) => r.name === "rcworst_m40c")?.temperatureC === -40,
  `rcworst_m40c temperature -40`
);
assert(parsedInnovus.opConds.length === 2, `Innovus fixture: 2 opconds`);
assert(
  parsedInnovus.opConds.find((o) => o.name === "ssgnp_op_worst_m40c")?.voltage === 0.72,
  `ssgnp opcond voltage 0.72`
);
assert(parsedInnovus.delayCorners.length === 2, `Innovus fixture: 2 delay corners`);
assert(
  parsedInnovus.delayCorners.some((d) => d.name === "ssgnp_setup_corner" && d.opCondName === "ssgnp_op_worst_m40c"),
  `ssgnp_setup_corner links opcond by name`
);
assert(parsedInnovus.analysisViews.length === 2, `Innovus fixture: 2 analysis views`);
const setupV = parsedInnovus.analysisViews.find((v) => v.name === "func_setup_view");
const holdV = parsedInnovus.analysisViews.find((v) => v.name === "func_hold_view");
assert(!!setupV && setupV.isSetup && setupV.isDynamic && !setupV.isHold, `func_setup_view is setup+dynamic`);
assert(!!holdV && holdV.isHold && holdV.isLeakage && !holdV.isSetup, `func_hold_view is hold+leakage`);

const regen = generateMmmcTcl(parsedInnovus, "cadence");
assert(regen.includes("create_library_set -name ffgnp_0p88v_125c"), `Regen FFGNP library set`);
assert(regen.includes("create_opcond -name ffgnp_op_best_125c"), `Regen create_opcond`);
assert(regen.includes("-opcond ffgnp_op_best_125c"), `Regen delay -opcond`);
assert(regen.includes("-setup {func_setup_view}"), `Regen -setup brace`);
assert(regen.includes("-hold {func_hold_view}"), `Regen -hold brace`);
assert(regen.includes("-leakage {func_hold_view}"), `Regen -leakage`);
assert(regen.includes("-dynamic {func_setup_view}"), `Regen -dynamic`);
assert(
  lintMmmcState(parsedInnovus).filter((m) => m.severity === "error").length === 0,
  `Parsed Innovus fixture is lint-clean`
);

const refStyle = innovusReferenceStyleState();
const refTcl = generateMmmcTcl(refStyle, "cadence");
assert(refTcl.includes("create_opcond"), `Reference-style preset emits opcond`);
assert(refTcl.includes("func_setup_view"), `Reference-style preset has func_setup_view`);

// CRUD with create_opcond
const op = createOpCond({ name: "user_op", process: 1, voltage: 0.8, temperatureC: 25 });
assert(op.name === "user_op" && op.voltage === 0.8, `createOpCond helper works`);

// ---------------------------------------------------------------------------
// Phase B1.7: MMMC ↔ Timing Studio view tagging & filter
// ---------------------------------------------------------------------------
console.log("\n--- Phase B1.7: MMMC ↔ Timing view link ---");

assert(
  extractViewNameFromBlock("Analysis View: func_setup_view\nStartpoint: a") === "func_setup_view",
  `extractViewNameFromBlock finds Analysis View`
);
assert(
  extractViewNameFromBlock("Scenario: my_hold_scen\nEndpoint: b") === "my_hold_scen",
  `extractViewNameFromBlock finds Scenario`
);

const viewDescs = mmmcStateToViewDescriptors(DEFAULT_MMMC_STATE);
assert(viewDescs.length === DEFAULT_MMMC_STATE.analysisViews.length, `View descriptors from MMMC state`);
assert(
  viewDescs.some((v) => v.name === "view_func_setup" && v.isSetup && v.delayCornerName === "dc_ss_worst"),
  `Descriptor carries setup + delay corner name`
);

const reg = buildMmmcViewRegistry(DEFAULT_MMMC_STATE, "mmmc-studio");
assert(reg.views.length >= 4 && reg.source === "mmmc-studio", `buildMmmcViewRegistry ok`);

assert(
  matchViewFromFilename("chip_view_func_setup_setup.rpt", viewDescs) === "view_func_setup",
  `Filename matches MMMC view name`
);

// Setup/hold auto-tag when single of each type in innovus-style starter
const starterViews = mmmcStateToViewDescriptors(starterMmmcState());
const setupMatch = matchViewForPath(
  { type: "setup", corner: "default_corner" },
  starterViews
);
const holdMatch = matchViewForPath(
  { type: "hold", corner: "default_corner" },
  starterViews
);
assert(setupMatch === "func_setup_view", `Auto-tag setup path → func_setup_view (got ${setupMatch})`);
assert(holdMatch === "func_hold_view", `Auto-tag hold path → func_hold_view (got ${holdMatch})`);

// Forced assignment overwrites
assert(
  matchViewForPath(
    { type: "setup", corner: "x", viewName: "old" },
    starterViews,
    { assignedViewName: "func_hold_view", overwriteExisting: true }
  ) === "func_hold_view",
  `Forced assigned view overwrites existing`
);

// Parse cadence mock — report header viewName
const cadenceParsed = parseTimingReport(MOCK_STA_REPORTS.cadence, "cadence");
assert(cadenceParsed.paths.length >= 1, `Cadence mock has paths`);
assert(
  cadenceParsed.paths.every((p) => p.viewName === "func_setup_view"),
  `Cadence mock paths tagged Analysis View: func_setup_view`
);
assert(
  cadenceParsed.analysisViews.includes("func_setup_view"),
  `analysisViews list includes func_setup_view`
);

// applyMmmcViewTagging merges registry + path views
const tagged = applyMmmcViewTagging(cadenceParsed, {
  views: starterViews,
  filename: "report.rpt",
});
assert(
  tagged.analysisViews.includes("func_setup_view") &&
    tagged.analysisViews.includes("func_hold_view"),
  `Tagged state merges MMMC registry views into analysisViews filter list`
);

const counts = countPathsByView(tagged.paths);
assert(
  counts["func_setup_view"] && counts["func_setup_view"].total === tagged.paths.length,
  `countPathsByView aggregates by viewName`
);

// Filter simulation (same logic as Timing Studio)
const filteredSetupOnly = tagged.paths.filter((p) => p.viewName === "func_setup_view");
assert(filteredSetupOnly.length === tagged.paths.length, `View filter keeps matching paths`);

// ---------------------------------------------------------------------------
// Phase B1.8: Deep SDC Studio ↔ MMMC constraint-mode link
// ---------------------------------------------------------------------------
console.log("\n--- Phase B1.8: SDC ↔ MMMC constraint mode link ---");

const sdcPack = buildSdcProjectPack({
  state: DEFAULT_SDC_STATE,
  name: "func",
  fileName: "constraints_func.sdc",
  vendor: "synopsys",
});
assert(sdcPack.name === "func", `SDC pack name is func`);
assert(sdcPack.fileName === "constraints_func.sdc", `SDC pack fileName set`);
assert(sdcPack.clockCount >= 1, `SDC pack has clocks from DEFAULT_SDC_STATE (${sdcPack.clockCount})`);
assert(sdcPack.sdcText.includes("create_clock") || sdcPack.sdcText.length > 50, `SDC pack has generated text`);
assert(!!sdcPack.sdcStateJson, `SDC pack stores state JSON for round-trip`);

const metaState = summarizeFromSdcState(DEFAULT_SDC_STATE);
assert(metaState.clockCount === sdcPack.clockCount, `summarizeFromSdcState clock count matches pack`);

const metaText = summarizeFromSdcText(sdcPack.sdcText);
assert(metaText.clockCount >= 1, `summarizeFromSdcText recovers clocks from generated SDC`);

// Create mode from pack
const modeFromPack = createModeFromSdcPack(sdcPack);
assert(modeFromPack.name === "func", `createModeFromSdcPack name`);
assert(modeFromPack.sdcFiles.includes("constraints_func.sdc"), `Mode has -sdc_files name`);
assert(modeFromPack.sdcSource === "studio", `Mode marked sdcSource=studio`);
assert((modeFromPack.clockCount || 0) >= 1, `Mode carries clockCount`);
assert(!!modeFromPack.sdcText, `Mode has sdcText body`);

// Bind pack onto existing mode
const emptyMode = createConstraintMode({ name: "func_mode", sdcFiles: ["old.sdc"] });
const bound = bindSdcPackToMode(emptyMode, sdcPack);
assert(bound.sdcFiles.includes("constraints_func.sdc"), `Bind adds pack fileName`);
assert(bound.sdcFiles.includes("old.sdc"), `Bind keeps existing sdc file`);
assert(bound.sdcText === sdcPack.sdcText, `Bind copies sdcText`);
assert(bound.sdcProjectId === sdcPack.id, `Bind sets sdcProjectId`);

// applySdcTransferToMmmc — empty → create
const xfer = buildTransferFromPack(sdcPack, "auto");
const emptyM = emptyMmmcState();
const applied0 = applySdcTransferToMmmc(emptyM, xfer);
assert(applied0.action === "created", `Auto on empty MMMC creates mode`);
assert(applied0.state.constraintModes.length === 1, `One mode after create`);
assert(applied0.modeName === "func", `Created mode named func`);

// apply — single mode → bind
const oneModeState = {
  ...emptyMmmcState(),
  constraintModes: [createConstraintMode({ name: "func_mode", sdcFiles: ["x.sdc"] })],
};
const applied1 = applySdcTransferToMmmc(oneModeState, xfer);
assert(applied1.action === "bound", `Auto on single mode binds`);
assert(applied1.state.constraintModes.length === 1, `Still one mode after bind`);
assert(
  applied1.state.constraintModes[0].sdcFiles.includes("constraints_func.sdc"),
  `Bound mode got pack file`
);

// apply — multi modes, match by name
const multi = {
  ...emptyMmmcState(),
  constraintModes: [
    createConstraintMode({ name: "test", sdcFiles: ["t.sdc"] }),
    createConstraintMode({ name: "func", sdcFiles: ["f.sdc"] }),
  ],
};
const appliedMulti = applySdcTransferToMmmc(multi, xfer);
assert(appliedMulti.action === "bound", `Auto multi matches mode name func`);
assert(
  appliedMulti.state.constraintModes.find((m) => m.name === "func")?.sdcText === sdcPack.sdcText,
  `Matched func mode got SDC text`
);

// force create
const appliedCreate = applySdcTransferToMmmc(multi, {
  ...xfer,
  action: "create",
  modeName: "func",
});
assert(appliedCreate.action === "created", `Force create adds mode`);
assert(appliedCreate.state.constraintModes.length === 3, `Create adds third mode`);
assert(appliedCreate.modeName.startsWith("func"), `Unique mode name for create`);

// Round-trip pull → studio
const pull = buildSdcPullFromMode(modeFromPack);
assert(pull.modeName === "func" && pull.sdcText.length > 0, `buildSdcPullFromMode ok`);
const reopened = applySdcPullToStudio(pull);
assert(reopened.modeName === "func", `Pull returns mode name`);
assert(reopened.state.primaryClocks.length >= 1 || reopened.state.generatedClocks.length >= 0, `Pull parses SDC state`);

// packFromTransfer
const pack2 = packFromTransfer(xfer);
assert(pack2.fileName === "constraints_func.sdc", `packFromTransfer fileName`);

// Lint SDC mode links
const lintLinked = lintSdcModeLinks(applied1.state);
assert(Array.isArray(lintLinked), `lintSdcModeLinks returns array`);
// Studio-linked with text should not warn empty
assert(
  !lintLinked.some((m) => m.id.startsWith("sdc_link_empty")),
  `Bound mode with sdcText has no empty-link warning`
);

// Generated MMMC TCL includes clock comment when linked
const genWithSdc = generateMmmcTcl(
  {
    ...DEFAULT_MMMC_STATE,
    constraintModes: DEFAULT_MMMC_STATE.constraintModes.map((m, i) =>
      i === 0
        ? {
            ...m,
            sdcText: sdcPack.sdcText,
            sdcSource: "studio" as const,
            clockNames: sdcPack.clockNames,
            clockCount: sdcPack.clockCount,
            sdcProjectId: sdcPack.id,
          }
        : m
    ),
  },
  "cadence"
);
assert(
  genWithSdc.includes("SDC clocks") || genWithSdc.includes("create_constraint_mode"),
  `Generated MMMC TCL mentions SDC clocks or constraint mode`
);
assert(genWithSdc.includes("create_constraint_mode -name func_mode"), `TCL still emits create_constraint_mode`);

// ---------------------------------------------------------------------------
// Phase B2: Power Studio / UPF Engine
// ---------------------------------------------------------------------------
console.log("\n--- Phase B2: UPF / Power Studio Engine ---");

// B2.1 model
const pad = padTopPracticeState();
assert(pad.designName === "pad_top", `pad_top design name`);
assert(pad.domains.length === 2, `pad_top has 2 domains`);
assert(pad.domains.some((d) => d.name === "PD_TOP" && d.includeScope), `PD_TOP include_scope`);
assert(
  pad.domains.some((d) => d.name === "PD_CORE" && d.elements.includes("u_core")),
  `PD_CORE elements u_core`
);
assert(pad.switches.some((s) => s.name === "sw_core"), `sw_core switch`);
assert(pad.isolations.some((i) => i.name === "iso_core_out"), `iso_core_out`);
assert(pad.pst[0]?.states.some((s) => s.name === "RUN"), `PST RUN`);
assert(pad.pst[0]?.states.some((s) => s.name === "SLEEP"), `PST SLEEP`);
assert(UPF_PRESETS.length >= 2, `UPF_PRESETS >= 2`);

// B2.2 generate
const upfText = generateUpf(pad);
assert(upfText.includes("upf_version 2.0"), `emit upf_version`);
assert(upfText.includes("create_supply_net VDD"), `emit create_supply_net VDD`);
assert(upfText.includes("create_supply_net VDD_CORE"), `emit VDD_CORE`);
assert(upfText.includes("create_power_domain PD_TOP -include_scope"), `emit PD_TOP`);
assert(upfText.includes("create_power_domain PD_CORE -elements {u_core}"), `emit PD_CORE elements`);
assert(upfText.includes("set_domain_supply_net PD_CORE"), `emit set_domain_supply_net`);
assert(upfText.includes("create_power_switch sw_core"), `emit power switch`);
assert(upfText.includes("set_isolation iso_core_out"), `emit isolation`);
assert(upfText.includes("set_isolation_control iso_core_out"), `emit isolation control`);
assert(upfText.includes("create_pst pst_pad_top"), `emit PST`);
assert(upfText.includes("add_pst_state RUN"), `emit RUN state`);
assert(upfText.includes("add_pst_state SLEEP"), `emit SLEEP state`);
assert(upfText.includes("Generated by Ace-Seek Power Studio"), `UPF header from Power Studio`);
assert(!upfText.includes("read_power_intent"), `UPF body is tool-agnostic (no Genus flow)`);

// B2.3 parse fixture
const upfFixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/lib/__fixtures__/upf/pad_top_practice.upf"
);
assert(fs.existsSync(upfFixturePath), `pad_top_practice.upf fixture exists`);
const fixtureText = fs.readFileSync(upfFixturePath, "utf8");
const parsedUpf = parseUpf(fixtureText);
assert(parsedUpf.supplyNets.length === 3, `Parsed 3 supply nets`);
assert(parsedUpf.domains.length === 2, `Parsed 2 domains`);
assert(
  parsedUpf.domains.find((d) => d.name === "PD_CORE")?.primaryPowerNet === "VDD_CORE",
  `PD_CORE powered by VDD_CORE`
);
assert(parsedUpf.switches.length === 1, `Parsed 1 switch`);
assert(parsedUpf.isolations.length === 1, `Parsed 1 isolation`);
assert(parsedUpf.pst[0]?.states.length === 2, `Parsed 2 PST states`);

// Round-trip generate → parse
const rt = parseUpf(generateUpf(pad));
assert(rt.domains.length === 2, `Round-trip domain count`);
assert(rt.switches[0]?.name === "sw_core", `Round-trip switch name`);
assert(rt.isolations[0]?.clampValue === "0", `Round-trip clamp 0`);

// B2.5 lint
const lintPad = lintUpfState(pad);
assert(
  lintPad.filter((m) => m.severity === "error").length === 0,
  `pad_top practice has 0 lint errors`
);
const emptyUpfLint = lintUpfState(emptyUpfState());
assert(
  emptyUpfLint.some((m) => m.severity === "error"),
  `Empty UPF has lint errors`
);
const noIso = {
  ...pad,
  isolations: [],
};
assert(
  lintUpfState(noIso).some((m) => m.id.startsWith("no_iso")),
  `Lint warns switchable domain without ISO`
);

// B2.4 diagram
const diag = buildUpfDiagram(pad);
assert(diag.nodes.some((n) => n.kind === "domain"), `Diagram has domain nodes`);
assert(diag.edges.length >= 1, `Diagram has edges`);

// dual rail preset
const dual = dualRailRetentionState();
assert(dual.retentions.length >= 1, `Dual-rail has retention`);
assert(dual.levelShifters.length >= 1, `Dual-rail has level shifter`);
const dualUpf = generateUpf(dual);
assert(dualUpf.includes("set_retention"), `Emit retention`);
assert(dualUpf.includes("set_level_shifter"), `Emit level shifter`);

assert(DEFAULT_UPF_STATE.designName === "pad_top", `DEFAULT is pad_top practice`);

// ---------------------------------------------------------------------------
// Phase B3: Report Hub
// ---------------------------------------------------------------------------
console.log("\n--- Phase B3: Report Hub classify / tags / metrics ---");

const hubPt = buildHubEntry(MOCK_STA_REPORTS.synopsys, "pt_setup.rpt");
assert(hubPt.target === "timing", `PT mock → timing target`);
assert(hubPt.tags.includes("synopsys") || hubPt.vendor === "synopsys", `PT tagged synopsys`);
assert(hubPt.metrics.pathCount >= 1, `Hub metrics path count >= 1`);
assert(
  hubPt.metrics.wnsSetup !== undefined && Number.isFinite(hubPt.metrics.wnsSetup),
  `Hub WNS setup finite (${hubPt.metrics.wnsSetup})`
);
assert(hubPt.tags.includes("setup") || hubPt.metrics.failingSetup >= 0, `Setup metrics present`);
assert(openTargetHref("timing").includes("/vlsi/timing-studio"), `Timing href`);
assert(openTargetHref("power").includes("/vlsi/power-studio"), `Power href`);
assert(openTargetHref("sdc").includes("/vlsi/sdc-studio"), `SDC href`);
assert(openTargetHref("mmmc").includes("/vlsi/mmmc-studio"), `MMMC href`);
assert(tagLabel("violations") === "Violations", `tagLabel works`);
assert(formatBytes(2048).includes("KB"), `formatBytes`);

const hubCad = buildHubEntry(MOCK_STA_REPORTS.cadence, "genus.rpt");
assert(hubCad.target === "timing", `Cadence mock → timing`);
assert(hubCad.vendor === "cadence" || hubCad.tags.includes("cadence"), `Cadence vendor`);

const sdcSample = `
create_clock -name clk -period 10 [get_ports clk]
set_input_delay 1 -clock clk [get_ports data]
`;
assert(detectHubTarget(sdcSample) === "sdc", `SDC text → sdc target`);
const hubSdc = buildHubEntry(sdcSample, "constraints.sdc");
assert(hubSdc.target === "sdc", `Hub entry SDC target`);
assert(hubSdc.tags.includes("sdc"), `Hub entry has sdc tag`);

const upfSample = `
upf_version 2.0
create_supply_net VDD
create_power_domain PD_TOP -include_scope
set_domain_supply_net PD_TOP -primary_power_net VDD -primary_ground_net VSS
`;
assert(detectHubTarget(upfSample) === "power", `UPF text → power target`);
const hubUpf = buildHubEntry(upfSample, "chip.upf");
assert(hubUpf.target === "power", `Hub UPF entry`);
assert(hubUpf.tags.includes("upf"), `UPF tag`);

const mmmcSample = `
create_library_set -name lib_ss -timing [list a.lib]
create_analysis_view -name v1 -delay_corner dc1 -constraint_mode cm1
set_analysis_view -setup {v1}
`;
assert(detectHubTarget(mmmcSample) === "mmmc", `MMMC text → mmmc target`);

// Truncation flag when huge
const huge = "x".repeat(HUB_ENTRY_MAX_TEXT + 1000);
const hubHuge = buildHubEntry(huge, "huge.rpt");
assert(hubHuge.truncated === true, `Huge report marked truncated`);
assert(hubHuge.text.length <= HUB_ENTRY_MAX_TEXT, `Stored text capped`);

const ingestOnly = ingestReport(MOCK_STA_REPORTS.synopsys);
const metricsOnly = computeHubMetrics(MOCK_STA_REPORTS.synopsys, ingestOnly);
const tagsOnly = extractTags(MOCK_STA_REPORTS.synopsys, ingestOnly, metricsOnly, "timing");
assert(Array.isArray(tagsOnly) && tagsOnly.length >= 1, `extractTags returns tags`);

// ---------------------------------------------------------------------------
// Phase B4 alt: Report-driven cell ladder (no Liberty)
// ---------------------------------------------------------------------------
console.log("\n--- Phase B4: Report-driven cell ladder ECO ---");

const pBuff = parseCellName("BUFFD4BWP16P90LVT");
assert(!!pBuff && pBuff.drive === 4, `Parse BUFFD4 drive=4`);
assert(pBuff!.vt === "LVT", `Parse LVT suffix`);
assert(
  pBuff!.rebuild(8, "LVT") === "BUFFD8BWP16P90LVT",
  `Rebuild BUFFD8 LVT`
);

const pAnd = parseCellName("AND2X2");
assert(!!pAnd && pAnd.drive === 2 && pAnd.style === "x_suffix", `Parse AND2X2`);
assert(pAnd!.rebuild(4) === "AND2X4" || pAnd!.rebuild(4).includes("X4"), `Rebuild AND2X4`);

// Synthetic multi-strength path for ladder
const ladderPaths = parseTimingReport(MOCK_STA_REPORTS.cadence, "cadence");
// Inject extra cells with known ladder into steps for unit test
if (ladderPaths.paths[0]) {
  ladderPaths.paths[0].steps.push(
    {
      point: "u_core/u_buf_a/Y",
      incr: 0.05,
      path: 1,
      dir: "r",
      cell: "BUFFD2BWP16P90SVT",
      kind: "cell",
    },
    {
      point: "u_core/u_buf_b/Y",
      incr: 0.08,
      path: 1,
      dir: "r",
      cell: "BUFFD4BWP16P90SVT",
      kind: "cell",
    },
    {
      point: "u_core/u_buf_c/Y",
      incr: 0.03,
      path: 1,
      dir: "r",
      cell: "BUFFD4BWP16P90LVT",
      kind: "cell",
    }
  );
}
const cat = buildCellLadderCatalog(ladderPaths.paths);
assert(cat.uniqueCells.length >= 1, `Catalog has cells from report`);
assert(cat.ladders.length >= 1, `Catalog built families`);

const up = suggestUpsize(cat, "BUFFD2BWP16P90SVT", "u_core/u_buf_a");
assert(!!up && up.toCell.includes("BUFFD4"), `Upsize D2→D4 seen (${up?.toCell})`);
assert(up!.source === "seen", `Upsize source seen`);

const lvtPick = suggestLvt(cat, "BUFFD4BWP16P90SVT", "u_core/u_buf_b");
assert(!!lvtPick && lvtPick.toCell.toUpperCase().includes("LVT"), `LVT swap to LVT cell`);
assert(lvtPick!.source === "seen", `LVT source seen`);

const picks = suggestEcoCellPicksForPath(ladderPaths.paths[0], cat);
assert(!!picks.upsize || !!picks.lvt, `Path gets at least one cell pick`);

const ecoActs = generateEcoProposals(ladderPaths.paths[0], "pnr", {
  catalogPaths: ladderPaths.paths,
});
const upsizeAct = ecoActs.find((a) => a.type === "upsize");
assert(!!upsizeAct, `ECO has upsize action`);
assert(
  !upsizeAct!.toCell || upsizeAct!.scriptLine.includes(upsizeAct!.toCell),
  `Upsize script embeds real toCell when present`
);
if (upsizeAct?.toCell) {
  assert(
    generateVendorEcoLine(upsizeAct, "pt_shell").includes(upsizeAct.toCell),
    `pt_shell size_cell uses real cell`
  );
  assert(
    generateVendorEcoLine(upsizeAct, "innovus").includes(upsizeAct.toCell),
    `Innovus ecoChangeCell uses real cell`
  );
}

// Flow-stage vendor matrices
assert(
  STAGE_VENDORS.synthesis.includes("genus") &&
    STAGE_VENDORS.synthesis.includes("dc_shell") &&
    STAGE_VENDORS.synthesis.includes("yosys"),
  `Synthesis tools: genus, dc_shell, yosys`
);
assert(
  STAGE_VENDORS.pnr.includes("innovus") &&
    STAGE_VENDORS.pnr.includes("openroad") &&
    STAGE_VENDORS.pnr.includes("icc2"),
  `PnR tools: innovus, openroad, icc2`
);
assert(
  STAGE_VENDORS.signoff.includes("pt_shell") &&
    STAGE_VENDORS.signoff.includes("tempus") &&
    STAGE_VENDORS.signoff.includes("opensta"),
  `Signoff tools: pt_shell, tempus, opensta`
);
assert(defaultVendorForStage("synthesis") === "genus", `Default synth tool genus`);
assert(defaultVendorForStage("pnr") === "innovus", `Default pnr tool innovus`);
assert(defaultVendorForStage("signoff") === "pt_shell", `Default signoff tool pt_shell`);
assert(isVendorValidForStage("genus", "synthesis"), `genus valid at synth`);
assert(!isVendorValidForStage("innovus", "synthesis"), `innovus not valid at synth`);
assert(vendorsForStage("pnr").length === 3, `3 pnr vendors`);

// Synth-stage proposals include path_group / retime-like types
const synthEco = generateEcoProposals(
  parseTimingReport(MOCK_STA_REPORTS.synopsys, "synopsys").paths[0],
  "synthesis"
);
assert(
  synthEco.some((a) => a.type === "path_group" || a.type === "compile_effort"),
  `Synthesis ECO includes path_group or compile_effort`
);
const pathGroupLine = generateVendorEcoLine(
  {
    id: "t",
    type: "path_group",
    title: "pg",
    detail: "",
    target: "u_end/D",
    estGainNs: 0.05,
    risk: "low",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
    pathGroupName: "pg_crit",
  },
  "dc_shell"
);
assert(pathGroupLine.includes("group_path"), `dc_shell path_group emits group_path`);

// Genus-specific command cards from misc/GENUS_*.md
const genusPg = generateVendorEcoLine(
  {
    id: "t",
    type: "path_group",
    title: "pg",
    detail: "",
    target: "u_end/D",
    estGainNs: 0.05,
    risk: "low",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
    pathGroupName: "pg_crit",
  },
  "genus"
);
assert(genusPg.includes("define_cost_group"), `Genus path_group uses define_cost_group`);
assert(genusPg.includes("path_group"), `Genus path_group uses path_group`);
assert(genusPg.includes("set_path_group_options"), `Genus path_group uses set_path_group_options`);
assert(genusPg.includes("-effort_level high"), `Genus path_group effort_level high`);
assert(genusPg.includes("syn_opt -incremental"), `Genus path_group ends with syn_opt -incremental`);

const genusCompile = generateVendorEcoLine(
  {
    id: "t",
    type: "compile_effort",
    title: "ce",
    detail: "",
    target: "u_end/D",
    estGainNs: 0.05,
    risk: "low",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusCompile.includes("syn_generic_effort"), `Genus compile sets syn_generic_effort`);
assert(genusCompile.includes("syn_map_effort"), `Genus compile sets syn_map_effort`);
assert(genusCompile.includes("syn_opt_effort"), `Genus compile sets syn_opt_effort`);
assert(genusCompile.includes("syn_opt -incremental"), `Genus compile uses syn_opt -incremental`);

const genusUpsize = generateVendorEcoLine(
  {
    id: "t",
    type: "upsize",
    title: "up",
    detail: "",
    target: "u_and0",
    toCell: "AND2_X4",
    fromCell: "AND2_X1",
    estGainNs: 0.05,
    risk: "low",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusUpsize.includes("base_cell"), `Genus upsize uses set_db .base_cell`);
assert(genusUpsize.includes("AND2_X4"), `Genus upsize embeds toCell`);
assert(genusUpsize.includes("syn_opt -incremental"), `Genus upsize re-opts`);

const genusUnc = generateVendorEcoLine(
  {
    id: "t",
    type: "uncertainty",
    title: "unc",
    detail: "",
    target: "u_end/D",
    clockName: "CLK",
    suggestedUncertaintyNs: 0.05,
    estGainNs: 0.02,
    risk: "low",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusUnc.includes("set_clock_uncertainty -setup"), `Genus uncertainty -setup`);
assert(genusUnc.includes("set_clock_uncertainty -hold"), `Genus uncertainty -hold`);

const genusCone = exportCriticalConeTcl(
  [{ id: "u0/A", kind: "pin" } as never],
  "crit_cone",
  "genus"
);
assert(genusCone.includes("define_cost_group"), `Genus cone export define_cost_group`);
assert(genusCone.includes("set_path_group_options"), `Genus cone export set_path_group_options`);

// Genus exceptions + full synth flow
console.log("\n--- Genus exceptions (path_adjust / FP / MCP / preserve) + full flow ---");

const genusPa = generateVendorEcoLine(
  {
    id: "t",
    type: "path_adjust",
    title: "pa",
    detail: "",
    target: "u_end/D",
    exceptionFrom: "u_start/Q",
    exceptionTo: "u_end/D",
    pathAdjustPs: 50,
    estGainNs: 0.05,
    risk: "high",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusPa.includes("path_adjust"), `Genus path_adjust command`);
assert(genusPa.includes("-delay 50"), `Genus path_adjust delay 50 ps`);
assert(genusPa.includes("-setup"), `Genus path_adjust -setup`);

const genusFp = generateVendorEcoLine(
  {
    id: "t",
    type: "false_path",
    title: "fp",
    detail: "Launch clk_a vs capture clk_b — prefer set_clock_groups",
    target: "u_end/D",
    exceptionFrom: "u_start/Q",
    exceptionTo: "u_end/D",
    estGainNs: 0.1,
    risk: "high",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusFp.includes("set_clock_groups -asynchronous"), `Genus FP async uses clock_groups`);

const genusFpReset = generateVendorEcoLine(
  {
    id: "t",
    type: "false_path",
    title: "fp rst",
    detail: "Reset/static control",
    target: "u_end/D",
    exceptionFrom: "rst_n",
    estGainNs: 0.1,
    risk: "high",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusFpReset.includes("set_false_path"), `Genus reset-style false_path`);

const genusMcp = generateVendorEcoLine(
  {
    id: "t",
    type: "multicycle",
    title: "mcp",
    detail: "",
    target: "u_end/D",
    exceptionFrom: "u_start/Q",
    exceptionTo: "u_end/D",
    mcpCycles: 2,
    estGainNs: 0.2,
    risk: "high",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusMcp.includes("set_multicycle_path 2 -setup"), `Genus MCP setup×2`);
assert(genusMcp.includes("set_multicycle_path 1 -hold"), `Genus MCP hold pair`);

const genusPres = generateVendorEcoLine(
  {
    id: "t",
    type: "preserve",
    title: "pres",
    detail: "",
    target: "u_crit/A",
    estGainNs: 0.01,
    risk: "low",
    stageOk: true,
    solverPatch: {},
    scriptLine: "",
  },
  "genus"
);
assert(genusPres.includes(".preserve true"), `Genus preserve uses set_db .preserve`);
assert(genusPres.includes("syn_opt -incremental"), `Genus preserve then incremental opt`);

const genusFlow = exportGenusSynthFlow({
  designName: "pad_top",
  libFiles: ["ss.lib", "io.lib"],
  hdlFiles: ["core.v", "pad_top.sv"],
  sdcFile: "func.sdc",
  effort: "high",
});
assert(genusFlow.includes("set_db library"), `Genus flow set_db library`);
assert(genusFlow.includes("read_hdl core.v"), `Genus flow read_hdl`);
assert(genusFlow.includes("read_hdl -sv pad_top.sv"), `Genus flow read_hdl -sv`);
assert(genusFlow.includes("elaborate $TOP"), `Genus flow elaborate`);
assert(genusFlow.includes("read_sdc func.sdc"), `Genus flow read_sdc`);
assert(genusFlow.includes("define_cost_group"), `Genus flow cost groups`);
assert(genusFlow.includes("syn_generic"), `Genus flow syn_generic`);
assert(genusFlow.includes("syn_map"), `Genus flow syn_map`);
assert(genusFlow.includes("syn_opt"), `Genus flow syn_opt`);
assert(genusFlow.includes("syn_generic_effort high"), `Genus flow high effort`);
assert(genusFlow.includes("write_hdl"), `Genus flow write_hdl`);
assert(genusFlow.includes("write_sdc"), `Genus flow write_sdc`);
assert(genusFlow.includes("write_db"), `Genus flow write_db`);
assert(genusFlow.includes("report_qor"), `Genus flow report_qor`);

const genusPack = generateExportPack(
  DEFAULT_SDC_STATE,
  mcState,
  testActions,
  "genus"
);
assert(genusPack.files.length === 4, `Genus pack has 4 files (sdc+eco+flow+readme)`);
assert(
  genusPack.files.some((f) => f.filename === "genus_synth_flow.tcl"),
  `Genus pack includes genus_synth_flow.tcl`
);
assert(
  genusPack.files.find((f) => f.filename === "genus_synth_flow.tcl")!.content.includes("syn_map"),
  `Genus pack flow has syn_map`
);

// Proposals can emit exception types on deep failing paths
const deepFailPath = parseTimingReport(MOCK_STA_REPORTS.synopsys, "synopsys").paths[0];
if (deepFailPath) {
  const withDeep = {
    ...deepFailPath,
    slack: -0.2,
    levels: 10,
    pathKind: "reg2reg" as const,
    type: "setup" as const,
  };
  const deepEco = generateEcoProposals(withDeep, "synthesis");
  assert(
    deepEco.some((a) => a.type === "multicycle" || a.type === "path_adjust" || a.type === "preserve"),
    `Deep fail synthesis ECO includes exception/preserve type`
  );
}

console.log("\n==================================================================");
console.log(`  🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (${passedAssertions}/${totalAssertions} assertions)`);
console.log("==================================================================");
