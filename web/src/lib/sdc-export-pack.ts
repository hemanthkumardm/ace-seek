/**
 * SDC & ECO Export Pack Engine.
 * Pure zero-dependency client-side ZIP archive generator and export bundler.
 */

import { SdcStudioState, generateSdcCode } from "./sdc-engine";
import { TimingStudioState, EcoAction } from "./timing-engine";
import {
  EcoVendor,
  exportVendorEcoScript,
  exportGenusSynthFlow,
} from "./eco-scripts/index";
import { computePredictedMetrics } from "./eco-session-model";

export interface ExportPackFile {
  filename: string;
  content: string;
}

export interface ExportPackResult {
  files: ExportPackFile[];
  zipBytes: Uint8Array;
}

/** Standard CRC-32 checksum calculation for ZIP file entries. */
function crc32(str: string): number {
  const bytes = new TextEncoder().encode(str);
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Pure zero-dependency uncompressed (Store method) ZIP archive builder.
 * Produces valid PKZIP 2.0 archives loadable by standard zip tools and browsers.
 */
export function buildZipArchive(files: ExportPackFile[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords: {
    filenameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const bufferParts: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Write Local File Headers & File Data
  files.forEach((f) => {
    const filenameBytes = encoder.encode(f.filename);
    const contentBytes = encoder.encode(f.content);
    const crc = crc32(f.content);
    const offset = currentOffset;

    fileRecords.push({ filenameBytes, contentBytes, crc, offset });

    // Local file header (30 bytes + filename + extra + data)
    const header = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract (2.0)
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = Store / Uncompressed)
    view.setUint16(10, 0, true); // Last mod file time
    view.setUint16(12, 0, true); // Last mod file date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, contentBytes.length, true); // Compressed size
    view.setUint32(22, contentBytes.length, true); // Uncompressed size
    view.setUint16(26, filenameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length

    header.set(filenameBytes, 30);

    bufferParts.push(header);
    bufferParts.push(contentBytes);

    currentOffset += header.length + contentBytes.length;
  });

  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;

  // 2. Write Central Directory Headers
  fileRecords.forEach((rec) => {
    const cdHeader = new Uint8Array(46 + rec.filenameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed
    view.setUint16(8, 0, true); // Bit flag
    view.setUint16(10, 0, true); // Compression method
    view.setUint16(12, 0, true); // File time
    view.setUint16(14, 0, true); // File date
    view.setUint32(16, rec.crc, true); // CRC-32
    view.setUint32(20, rec.contentBytes.length, true); // Compressed size
    view.setUint32(24, rec.contentBytes.length, true); // Uncompressed size
    view.setUint16(28, rec.filenameBytes.length, true); // File name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // Comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, rec.offset, true); // Relative offset of local header

    cdHeader.set(rec.filenameBytes, 46);

    bufferParts.push(cdHeader);
    centralDirectorySize += cdHeader.length;
    currentOffset += cdHeader.length;
  });

  // 3. Write End of Central Directory Record (EOCD - 22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Disk number
  eocdView.setUint16(6, 0, true); // Start disk
  eocdView.setUint16(8, fileRecords.length, true); // Number of central directory records on disk
  eocdView.setUint16(10, fileRecords.length, true); // Total central directory records
  eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // ZIP comment length

  bufferParts.push(eocd);

  // Combine into single Uint8Array
  const totalLength = bufferParts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of bufferParts) {
    result.set(part, pos);
    pos += part.length;
  }

  return result;
}

/**
 * Generate complete SDC & ECO Export Pack (constraints.sdc + eco.tcl + README.txt).
 */
export function generateExportPack(
  sdcState: SdcStudioState,
  timingState: TimingStudioState,
  selectedActions: EcoAction[],
  vendor: EcoVendor = "innovus"
): ExportPackResult {
  const sdcContent = generateSdcCode(sdcState);
  const validStage =
    timingState.flowStage === "pnr" || timingState.flowStage === "signoff"
      ? timingState.flowStage
      : "synthesis";

  const ecoContent = exportVendorEcoScript(selectedActions, {
    vendor,
    stage: validStage,
    designName: timingState.designName || "pad_top",
    commentHeader: true,
  });

  const predicted = computePredictedMetrics(timingState.paths, selectedActions);

  const readmeLines: string[] = [
    `======================================================================`,
    `  ACE-SEEK VLSI PORTAL — ECO & SDC EXPORT PACK`,
    `======================================================================`,
    `Design Name:     ${timingState.designName || "pad_top"}`,
    `Flow Stage:      ${validStage}`,
    `Target Vendor:   ${vendor.toUpperCase()}`,
    `Generated On:    ${new Date().toISOString()}`,
    ``,
    `----------------------------------------------------------------------`,
    `1. PACK CONTENTS`,
    `----------------------------------------------------------------------`,
    `- constraints.sdc : Synthesizable SDC 2.1 constraint file`,
    `- eco.tcl         : Vendor-specific TCL ECO script (${vendor.toUpperCase()})`,
    ...(vendor === "genus"
      ? [
          `- genus_synth_flow.tcl : Full Genus Common UI synth flow (libs→map→opt→write)`,
        ]
      : []),
    `- README.txt      : Execution instructions and ECO impact summary`,
    ``,
    `----------------------------------------------------------------------`,
    `2. TIMING METRICS & PREDICTED IMPACT`,
    `----------------------------------------------------------------------`,
    `Baseline Setup WNS:   ${predicted.baselineWnsSetup.toFixed(3)} ns`,
    `Baseline Setup TNS:   ${predicted.baselineTnsSetup.toFixed(3)} ns`,
    `Predicted Setup WNS:  ${predicted.predictedWnsSetup.toFixed(3)} ns`,
    `Predicted Setup TNS:  ${predicted.predictedTnsSetup.toFixed(3)} ns`,
    `Effective Total Gain: +${predicted.effectiveTotalGainNs.toFixed(3)} ns`,
    `ECO Actions Count:    ${predicted.selectedActionCount}`,
    ``,
    `----------------------------------------------------------------------`,
    `3. EXECUTION INSTRUCTIONS`,
    `----------------------------------------------------------------------`,
  ];

  if (vendor === "genus") {
    readmeLines.push(`In Cadence Genus (Common UI — set_db / get_db):`);
    readmeLines.push(`  Full flow:  source genus_synth_flow.tcl  (libs→RTL→SDC→syn_*→write)`);
    readmeLines.push(`  Or incremental ECO on an open session:`);
    readmeLines.push(`  1. Open session: genus`);
    readmeLines.push(`  2. set_db library {...}; read_hdl ...; elaborate <top>`);
    readmeLines.push(`  3. read_sdc constraints.sdc ; check_design ; check_timing`);
    readmeLines.push(`  4. source eco.tcl  (exceptions / size / path groups / syn_opt -incremental)`);
    readmeLines.push(`  5. report_qor ; report_timing ; LEC if netlist changed`);
  } else if (vendor === "innovus") {
    readmeLines.push(`In Cadence Innovus:`);
    readmeLines.push(`  1. Open session: innovus -files init.tcl`);
    readmeLines.push(`  2. Sourced constraints: read_sdc constraints.sdc`);
    readmeLines.push(`  3. Source ECO script: source eco.tcl`);
  } else if (vendor === "primetime" || vendor === "pt_shell") {
    readmeLines.push(`In Synopsys PrimeTime (pt_shell):`);
    readmeLines.push(`  1. Open session: pt_shell`);
    readmeLines.push(`  2. Source SDC: read_sdc constraints.sdc`);
    readmeLines.push(`  3. Apply ECOs: source eco.tcl`);
  } else if (vendor === "tempus") {
    readmeLines.push(`In Cadence Tempus:`);
    readmeLines.push(`  1. Open session: tempus`);
    readmeLines.push(`  2. Source SDC: read_sdc constraints.sdc`);
    readmeLines.push(`  3. Apply ECOs: source eco.tcl`);
  } else if (vendor === "dc_shell") {
    readmeLines.push(`In Synopsys Design Compiler (dc_shell):`);
    readmeLines.push(`  1. Open session: dc_shell`);
    readmeLines.push(`  2. Source SDC: read_sdc constraints.sdc`);
    readmeLines.push(`  3. Apply ECOs: source eco.tcl`);
  } else {
    readmeLines.push(`In ${vendor}:`);
    readmeLines.push(`  1. Load design + liberty + SDC`);
    readmeLines.push(`  2. Source SDC: read_sdc constraints.sdc (or equivalent)`);
    readmeLines.push(`  3. Apply ECOs: source eco.tcl`);
  }

  readmeLines.push(``);
  readmeLines.push(`======================================================================`);

  const files: ExportPackFile[] = [
    { filename: "constraints.sdc", content: sdcContent },
    { filename: "eco.tcl", content: ecoContent },
  ];

  if (vendor === "genus") {
    files.push({
      filename: "genus_synth_flow.tcl",
      content: exportGenusSynthFlow({
        designName: timingState.designName || "pad_top",
        sdcFile: "constraints.sdc",
        effort: "medium",
        ecoActions: selectedActions.slice(0, 12),
      }),
    });
  }

  files.push({ filename: "README.txt", content: readmeLines.join("\n") });

  const zipBytes = buildZipArchive(files);

  return { files, zipBytes };
}

/**
 * Trigger client-side browser file download of a Uint8Array ZIP archive.
 */
export function downloadZipFile(zipBytes: Uint8Array, filename = "ace_seek_eco_pack.zip"): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([new Uint8Array(zipBytes)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger client-side browser file download of a text file.
 */
export function downloadTextFile(content: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
