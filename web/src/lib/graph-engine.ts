/**
 * Shared Design Graph Engine for VLSI studios (SDC + Timing).
 *
 * Models clocks, cells, ports, data arcs, CDC cuts, and SI-risk links as a
 * graph so Timing schematic, CDC domain map, SI aggressors, and ECO can share
 * one connectivity backbone.
 *
 * No dependency on timing-engine / sdc-engine (adapters pass plain data).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GraphNodeKind =
  | "port"
  | "ff"
  | "gate"
  | "pad"
  | "clock"
  | "virtual_clock"
  | "generated_clock"
  | "io"
  | "net"
  | "other";

export type GraphEdgeKind =
  | "data"
  | "clock_tree"
  | "async_cut"
  | "exclusive_cut"
  | "io_ref"
  | "si_risk";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  cell?: string;
  delayNs?: number;
  fanout?: number;
  domainId?: string;
  pathIds: string[];
  /** Extra display / filter tags */
  tags: string[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: GraphEdgeKind;
  weightNs?: number;
  label?: string;
  pathIds: string[];
}

export interface GraphDomain {
  id: string;
  name: string;
  clockNames: string[];
  colorIndex: number;
  isVirtual: boolean;
  periodNs?: number;
}

export interface DesignGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  domains: GraphDomain[];
  meta: {
    pathCount: number;
    clockCount: number;
    builtAt: number;
  };
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  domainCount: number;
  dataEdges: number;
  cutEdges: number;
  siRiskEdges: number;
  ffCount: number;
  gateCount: number;
}

export interface SchematicViewNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  cell?: string;
  delayNs: number;
  fanout?: number;
  isCritical?: boolean;
  domainId?: string;
}

export interface SchematicViewEdge {
  from: string;
  to: string;
  delayNs: number;
  kind: GraphEdgeKind;
  label?: string;
}

export interface PathSchematicView {
  nodes: SchematicViewNode[];
  edges: SchematicViewEdge[];
  totalCellDelayNs: number;
  totalNetDelayNs: number;
  logicLevels: number;
}

// ---------------------------------------------------------------------------
// Construction helpers
// ---------------------------------------------------------------------------

export function createEmptyGraph(): DesignGraph {
  return {
    nodes: new Map(),
    edges: [],
    domains: [],
    meta: { pathCount: 0, clockCount: 0, builtAt: Date.now() },
  };
}

function nodeId(raw: string): string {
  return raw.trim() || "unknown";
}

export function upsertNode(
  g: DesignGraph,
  partial: Omit<GraphNode, "pathIds" | "tags"> & {
    pathIds?: string[];
    tags?: string[];
  }
): GraphNode {
  const id = nodeId(partial.id);
  const existing = g.nodes.get(id);
  if (existing) {
    if (partial.cell && !existing.cell) existing.cell = partial.cell;
    if (partial.delayNs !== undefined) {
      existing.delayNs = Math.max(existing.delayNs || 0, partial.delayNs);
    }
    if (partial.fanout !== undefined) {
      existing.fanout = Math.max(existing.fanout || 0, partial.fanout);
    }
    if (partial.domainId) existing.domainId = partial.domainId;
    if (partial.kind && existing.kind === "other") existing.kind = partial.kind;
    if (partial.pathIds) {
      for (const p of partial.pathIds) {
        if (!existing.pathIds.includes(p)) existing.pathIds.push(p);
      }
    }
    if (partial.tags) {
      for (const t of partial.tags) {
        if (!existing.tags.includes(t)) existing.tags.push(t);
      }
    }
    return existing;
  }
  const n: GraphNode = {
    id,
    label: partial.label || id,
    kind: partial.kind,
    cell: partial.cell,
    delayNs: partial.delayNs,
    fanout: partial.fanout,
    domainId: partial.domainId,
    pathIds: [...(partial.pathIds || [])],
    tags: [...(partial.tags || [])],
  };
  g.nodes.set(id, n);
  return n;
}

export function addEdge(
  g: DesignGraph,
  edge: Omit<GraphEdge, "id" | "pathIds"> & { id?: string; pathIds?: string[] }
): GraphEdge {
  const id =
    edge.id ||
    `${edge.kind}:${edge.from}->${edge.to}:${g.edges.length}`;
  // Dedupe identical structural edges (merge pathIds)
  const found = g.edges.find(
    (e) =>
      e.from === edge.from &&
      e.to === edge.to &&
      e.kind === edge.kind &&
      (e.label || "") === (edge.label || "")
  );
  if (found) {
    if (edge.weightNs !== undefined) {
      found.weightNs = Math.max(found.weightNs || 0, edge.weightNs);
    }
    for (const p of edge.pathIds || []) {
      if (!found.pathIds.includes(p)) found.pathIds.push(p);
    }
    return found;
  }
  const e: GraphEdge = {
    id,
    from: edge.from,
    to: edge.to,
    kind: edge.kind,
    weightNs: edge.weightNs,
    label: edge.label,
    pathIds: [...(edge.pathIds || [])],
  };
  g.edges.push(e);
  return e;
}

// ---------------------------------------------------------------------------
// Adapters — Timing paths
// ---------------------------------------------------------------------------

export interface TimingPathGraphInput {
  id: string;
  startpoint: string;
  endpoint: string;
  clock: string;
  captureClock?: string;
  steps: Array<{
    point: string;
    incr: number;
    cell?: string;
    fanout?: number;
    kind: string;
    dir?: string;
  }>;
  si?: {
    aggressors?: Array<{ label: string; contributionNs: number; fanout?: number }>;
  };
}

function kindFromStep(
  step: TimingPathGraphInput["steps"][0]
): GraphNodeKind {
  const k = step.kind;
  if (k === "port") return "port";
  if (k === "launch_ff" || k === "capture_ff") return "ff";
  if (step.cell && /pad|pdi|pdo|io/i.test(step.cell)) return "pad";
  if (k === "cell" || k === "other") return "gate";
  if (k === "clock" || k === "clock_network") return "clock";
  return "other";
}

export function buildGraphFromTimingPaths(
  paths: TimingPathGraphInput[]
): DesignGraph {
  const g = createEmptyGraph();
  g.meta.pathCount = paths.length;

  const clocks = new Set<string>();
  for (const path of paths) {
    if (path.clock) clocks.add(path.clock);
    if (path.captureClock) clocks.add(path.captureClock);

    // Clock nodes
    if (path.clock) {
      upsertNode(g, {
        id: `clk:${path.clock}`,
        label: path.clock,
        kind: "clock",
        pathIds: [path.id],
        tags: ["clock"],
      });
    }
    if (path.captureClock && path.captureClock !== path.clock) {
      upsertNode(g, {
        id: `clk:${path.captureClock}`,
        label: path.captureClock,
        kind: "clock",
        pathIds: [path.id],
        tags: ["clock"],
      });
    }

    const dataSteps = path.steps.filter(
      (s) =>
        s.kind === "cell" ||
        s.kind === "launch_ff" ||
        s.kind === "capture_ff" ||
        s.kind === "port" ||
        s.kind === "other"
    );

    let prevId: string | null = null;
    for (const step of dataSteps) {
      const id = nodeId(step.point);
      const kind = kindFromStep(step);
      upsertNode(g, {
        id,
        label: step.point.split("/").slice(-2).join("/") || step.point,
        kind,
        cell: step.cell,
        delayNs: step.incr,
        fanout: step.fanout,
        pathIds: [path.id],
        tags: [path.id, step.kind],
      });
      if (prevId) {
        addEdge(g, {
          from: prevId,
          to: id,
          kind: "data",
          weightNs: step.incr,
          pathIds: [path.id],
        });
      }
      prevId = id;
    }

    // Ensure start/end exist
    if (path.startpoint) {
      upsertNode(g, {
        id: path.startpoint,
        label: path.startpoint.split("/").slice(-2).join("/") || path.startpoint,
        kind: /\/(q|qn|cp|ck)$/i.test(path.startpoint) ? "ff" : "other",
        pathIds: [path.id],
      });
    }
    if (path.endpoint) {
      upsertNode(g, {
        id: path.endpoint,
        label: path.endpoint.split("/").slice(-2).join("/") || path.endpoint,
        kind: /\/d$/i.test(path.endpoint) ? "ff" : "port",
        pathIds: [path.id],
      });
    }

    // SI risk edges: aggressor label → path endpoint (soft link)
    if (path.si?.aggressors?.length && path.endpoint) {
      for (const ag of path.si.aggressors.slice(0, 8)) {
        const agId = nodeId(ag.label);
        upsertNode(g, {
          id: agId,
          label: ag.label.split("/").slice(-2).join("/") || ag.label,
          kind: "gate",
          fanout: ag.fanout,
          delayNs: ag.contributionNs,
          pathIds: [path.id],
          tags: ["si_risk"],
        });
        addEdge(g, {
          from: agId,
          to: path.endpoint,
          kind: "si_risk",
          weightNs: ag.contributionNs,
          label: "SI",
          pathIds: [path.id],
        });
      }
    }
  }

  g.meta.clockCount = clocks.size;
  return g;
}

// ---------------------------------------------------------------------------
// Adapters — SDC state
// ---------------------------------------------------------------------------

export interface SdcGraphInput {
  primaryClocks: Array<{
    id: string;
    name: string;
    periodNs: number;
    isVirtual: boolean;
  }>;
  generatedClocks: Array<{
    id: string;
    name: string;
    masterClockId: string;
    divideBy: number;
    multiplyBy: number;
  }>;
  clockGroups: Array<{
    group1Clocks: string[];
    group2Clocks: string[];
    relationType: "asynchronous" | "logically_exclusive" | "physically_exclusive";
  }>;
  ioConstraints: Array<{
    id: string;
    portName: string;
    clockName: string;
    delayType: "input" | "output";
    maxNs: number;
  }>;
}

export function buildGraphFromSdc(sdc: SdcGraphInput): DesignGraph {
  const g = createEmptyGraph();
  const domains: GraphDomain[] = [];
  let color = 0;

  for (const c of sdc.primaryClocks) {
    const domId = `dom:${c.id}`;
    const clocks = [c.name];
    for (const gen of sdc.generatedClocks) {
      if (gen.masterClockId === c.id || gen.masterClockId === c.name) {
        clocks.push(gen.name);
      }
    }
    domains.push({
      id: domId,
      name: c.name,
      clockNames: clocks,
      colorIndex: color++ % 8,
      isVirtual: c.isVirtual,
      periodNs: c.periodNs,
    });

    upsertNode(g, {
      id: `clk:${c.name}`,
      label: c.name,
      kind: c.isVirtual ? "virtual_clock" : "clock",
      domainId: domId,
      tags: ["clock", c.isVirtual ? "virtual" : "primary"],
    });
  }

  // Orphan generated
  for (const gen of sdc.generatedClocks) {
    const master =
      sdc.primaryClocks.find(
        (p) => p.id === gen.masterClockId || p.name === gen.masterClockId
      ) ||
      sdc.generatedClocks.find(
        (p) => p.id === gen.masterClockId || p.name === gen.masterClockId
      );
    let dom = domains.find((d) => d.clockNames.includes(gen.name));
    if (!dom && master) {
      const mName = "name" in master ? master.name : gen.masterClockId;
      dom = domains.find((d) => d.clockNames.includes(mName));
      if (dom && !dom.clockNames.includes(gen.name)) {
        dom.clockNames.push(gen.name);
      }
    }
    if (!dom) {
      dom = {
        id: `dom:${gen.id}`,
        name: gen.name,
        clockNames: [gen.name],
        colorIndex: color++ % 8,
        isVirtual: false,
      };
      domains.push(dom);
    }

    upsertNode(g, {
      id: `clk:${gen.name}`,
      label: gen.name,
      kind: "generated_clock",
      domainId: dom.id,
      tags: ["clock", "generated"],
    });

    const masterName =
      sdc.primaryClocks.find(
        (p) => p.id === gen.masterClockId || p.name === gen.masterClockId
      )?.name ||
      sdc.generatedClocks.find(
        (p) => p.id === gen.masterClockId || p.name === gen.masterClockId
      )?.name;
    if (masterName) {
      addEdge(g, {
        from: `clk:${masterName}`,
        to: `clk:${gen.name}`,
        kind: "clock_tree",
        label: `÷${gen.divideBy}×${gen.multiplyBy}`,
      });
    }
  }

  // CDC cuts
  for (const cg of sdc.clockGroups) {
    const kind: GraphEdgeKind =
      cg.relationType === "asynchronous" ? "async_cut" : "exclusive_cut";
    for (const a of cg.group1Clocks) {
      for (const b of cg.group2Clocks) {
        addEdge(g, {
          from: `clk:${a}`,
          to: `clk:${b}`,
          kind,
          label:
            cg.relationType === "asynchronous"
              ? "ASYNC"
              : cg.relationType === "logically_exclusive"
              ? "L_EX"
              : "P_EX",
        });
      }
    }
  }

  // I/O ports
  for (const io of sdc.ioConstraints) {
    const portLabel = io.portName
      .replace(/\[get_ports\s+/i, "")
      .replace(/\]/g, "")
      .slice(0, 40);
    const pid = `io:${io.id}`;
    const dom = domains.find((d) => d.clockNames.includes(io.clockName));
    upsertNode(g, {
      id: pid,
      label: portLabel || io.id,
      kind: "io",
      domainId: dom?.id,
      delayNs: io.maxNs,
      tags: ["io", io.delayType],
    });
    addEdge(g, {
      from: `clk:${io.clockName}`,
      to: pid,
      kind: "io_ref",
      weightNs: io.maxNs,
      label: io.delayType,
    });
  }

  g.domains = domains;
  g.meta.clockCount = sdc.primaryClocks.length + sdc.generatedClocks.length;
  return g;
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

export function crossLinkClocksAndDomains(g: DesignGraph): DesignGraph {
  const clkToDomain = new Map<string, string>();
  for (const d of g.domains) {
    for (const cName of d.clockNames) {
      clkToDomain.set(cName, d.id);
      clkToDomain.set(`clk:${cName}`, d.id);
    }
  }

  for (const node of g.nodes.values()) {
    if (!node.domainId) {
      if (clkToDomain.has(node.id)) {
        node.domainId = clkToDomain.get(node.id);
      } else {
        for (const tag of node.tags) {
          if (clkToDomain.has(tag)) {
            node.domainId = clkToDomain.get(tag);
            break;
          }
        }
      }
    }
  }
  return g;
}

export function mergeGraphs(a: DesignGraph, b: DesignGraph): DesignGraph {
  const g = createEmptyGraph();
  for (const n of a.nodes.values()) {
    upsertNode(g, { ...n, pathIds: [...n.pathIds], tags: [...n.tags] });
  }
  for (const n of b.nodes.values()) {
    upsertNode(g, { ...n, pathIds: [...n.pathIds], tags: [...n.tags] });
  }
  for (const e of a.edges) {
    addEdge(g, { ...e, pathIds: [...e.pathIds] });
  }
  for (const e of b.edges) {
    addEdge(g, { ...e, pathIds: [...e.pathIds] });
  }
  // Domains: prefer SDC domains (usually richer)
  const domMap = new Map<string, GraphDomain>();
  for (const d of [...a.domains, ...b.domains]) {
    if (!domMap.has(d.id)) domMap.set(d.id, { ...d, clockNames: [...d.clockNames] });
    else {
      const ex = domMap.get(d.id)!;
      for (const c of d.clockNames) {
        if (!ex.clockNames.includes(c)) ex.clockNames.push(c);
      }
    }
  }
  g.domains = [...domMap.values()];
  g.meta.pathCount = a.meta.pathCount + b.meta.pathCount;
  g.meta.clockCount = Math.max(a.meta.clockCount, b.meta.clockCount);
  return crossLinkClocksAndDomains(g);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function graphStats(g: DesignGraph): GraphStats {
  let dataEdges = 0;
  let cutEdges = 0;
  let siRiskEdges = 0;
  for (const e of g.edges) {
    if (e.kind === "data") dataEdges++;
    if (e.kind === "async_cut" || e.kind === "exclusive_cut") cutEdges++;
    if (e.kind === "si_risk") siRiskEdges++;
  }
  let ffCount = 0;
  let gateCount = 0;
  for (const n of g.nodes.values()) {
    if (n.kind === "ff") ffCount++;
    if (n.kind === "gate" || n.kind === "pad") gateCount++;
  }
  return {
    nodeCount: g.nodes.size,
    edgeCount: g.edges.length,
    domainCount: g.domains.length,
    dataEdges,
    cutEdges,
    siRiskEdges,
    ffCount,
    gateCount,
  };
}

export function getNode(g: DesignGraph, id: string): GraphNode | undefined {
  return g.nodes.get(nodeId(id)) || g.nodes.get(`clk:${id}`) || g.nodes.get(id);
}

export function neighbors(
  g: DesignGraph,
  id: string,
  dir: "in" | "out" | "both" = "both"
): { node: GraphNode; edge: GraphEdge }[] {
  const nid = nodeId(id);
  const out: { node: GraphNode; edge: GraphEdge }[] = [];
  for (const e of g.edges) {
    if ((dir === "out" || dir === "both") && e.from === nid) {
      const n = g.nodes.get(e.to);
      if (n) out.push({ node: n, edge: e });
    }
    if ((dir === "in" || dir === "both") && e.to === nid) {
      const n = g.nodes.get(e.from);
      if (n) out.push({ node: n, edge: e });
    }
  }
  return out;
}

export function edgesForPath(g: DesignGraph, pathId: string): GraphEdge[] {
  return g.edges.filter((e) => e.pathIds.includes(pathId) && e.kind === "data");
}

export function nodesForPath(g: DesignGraph, pathId: string): GraphNode[] {
  return [...g.nodes.values()].filter((n) => n.pathIds.includes(pathId));
}

/** Ordered path chain for schematic (follows data edges for pathId). */
export function pathChain(
  g: DesignGraph,
  pathId: string
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const pedges = edgesForPath(g, pathId);
  if (!pedges.length) {
    return { nodes: nodesForPath(g, pathId), edges: [] };
  }
  // Find start: node with no incoming data edge for this path
  const targets = new Set(pedges.map((e) => e.to));
  const sources = pedges.map((e) => e.from);
  let start = sources.find((s) => !targets.has(s)) || sources[0];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new Set<string>();
  let cur = start;
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    const n = g.nodes.get(cur);
    if (n) nodes.push(n);
    const next = pedges.find((e) => e.from === cur && !visited.has(e.to));
    if (!next) break;
    edges.push(next);
    cur = next.to;
  }
  // append last node if edge existed
  if (edges.length) {
    const last = g.nodes.get(edges[edges.length - 1].to);
    if (last && !visited.has(last.id)) nodes.push(last);
  }
  return { nodes, edges };
}

export function fanoutCone(
  g: DesignGraph,
  startId: string,
  maxDepth = 8
): GraphNode[] {
  const start = nodeId(startId);
  const seen = new Set<string>();
  const q: { id: string; d: number }[] = [{ id: start, d: 0 }];
  const result: GraphNode[] = [];
  while (q.length) {
    const { id, d } = q.shift()!;
    if (seen.has(id) || d > maxDepth) continue;
    seen.add(id);
    const n = g.nodes.get(id);
    if (n && d > 0) result.push(n);
    if (d === maxDepth) continue;
    for (const e of g.edges) {
      if (e.from === id && (e.kind === "data" || e.kind === "clock_tree")) {
        q.push({ id: e.to, d: d + 1 });
      }
    }
  }
  return result;
}

export function faninCone(
  g: DesignGraph,
  endId: string,
  maxDepth = 8
): GraphNode[] {
  const end = nodeId(endId);
  const seen = new Set<string>();
  const q: { id: string; d: number }[] = [{ id: end, d: 0 }];
  const result: GraphNode[] = [];
  while (q.length) {
    const { id, d } = q.shift()!;
    if (seen.has(id) || d > maxDepth) continue;
    seen.add(id);
    const n = g.nodes.get(id);
    if (n && d > 0) result.push(n);
    if (d === maxDepth) continue;
    for (const e of g.edges) {
      if (e.to === id && (e.kind === "data" || e.kind === "clock_tree")) {
        q.push({ id: e.from, d: d + 1 });
      }
    }
  }
  return result;
}

export function asyncCuts(
  g: DesignGraph
): { from: string; to: string; kind: GraphEdgeKind; label?: string }[] {
  return g.edges
    .filter((e) => e.kind === "async_cut" || e.kind === "exclusive_cut")
    .map((e) => ({
      from: e.from.replace(/^clk:/, ""),
      to: e.to.replace(/^clk:/, ""),
      kind: e.kind,
      label: e.label,
    }));
}

export function criticalNodes(g: DesignGraph, limit = 12): GraphNode[] {
  return [...g.nodes.values()]
    .filter((n) => (n.delayNs || 0) > 0 && (n.kind === "gate" || n.kind === "pad" || n.kind === "ff"))
    .sort((a, b) => (b.delayNs || 0) - (a.delayNs || 0))
    .slice(0, limit);
}

export function domainOfClock(
  g: DesignGraph,
  clockName: string
): GraphDomain | undefined {
  return g.domains.find((d) => d.clockNames.includes(clockName));
}

/** Build SVG-friendly path schematic from graph */
export function pathSchematicView(
  g: DesignGraph,
  pathId: string
): PathSchematicView {
  const { nodes, edges } = pathChain(g, pathId);
  const maxDelay = Math.max(0, ...nodes.map((n) => n.delayNs || 0));
  let totalCell = 0;
  let logicLevels = 0;
  const viewNodes: SchematicViewNode[] = nodes.map((n) => {
    if (n.kind === "gate" || n.kind === "ff") {
      totalCell += n.delayNs || 0;
      if (n.kind === "gate") logicLevels++;
    }
    return {
      id: n.id,
      label: n.label,
      kind: n.kind,
      cell: n.cell,
      delayNs: n.delayNs || 0,
      fanout: n.fanout,
      isCritical: (n.delayNs || 0) >= maxDelay * 0.6 && (n.delayNs || 0) > 0.01,
      domainId: n.domainId,
    };
  });
  const viewEdges: SchematicViewEdge[] = edges.map((e) => ({
    from: e.from,
    to: e.to,
    delayNs: e.weightNs || 0,
    kind: e.kind,
    label: e.label,
  }));
  const sumIncr = viewNodes.reduce((a, n) => a + n.delayNs, 0);
  const totalNet = Math.max(0, sumIncr - totalCell) * 0.2;
  return {
    nodes: viewNodes,
    edges: viewEdges,
    totalCellDelayNs: totalCell,
    totalNetDelayNs: totalNet,
    logicLevels,
  };
}

/** Clock-domain map view for SDC CDC UI */
export interface DomainMapView {
  domains: GraphDomain[];
  nodes: Array<{
    id: string;
    name: string;
    domainId: string;
    colorIndex: number;
    kind: "primary" | "virtual" | "generated" | "io";
  }>;
  treeEdges: Array<{ from: string; to: string; label?: string }>;
  cutEdges: Array<{ from: string; to: string; relation: string }>;
  stats: GraphStats;
}

export function domainMapView(g: DesignGraph): DomainMapView {
  const nodes: DomainMapView["nodes"] = [];
  for (const n of g.nodes.values()) {
    if (
      n.kind === "clock" ||
      n.kind === "virtual_clock" ||
      n.kind === "generated_clock"
    ) {
      const dom = g.domains.find((d) => d.id === n.domainId);
      nodes.push({
        id: n.label,
        name: n.label,
        domainId: n.domainId || n.id,
        colorIndex: dom?.colorIndex ?? 0,
        kind:
          n.kind === "virtual_clock"
            ? "virtual"
            : n.kind === "generated_clock"
            ? "generated"
            : "primary",
      });
    } else if (n.kind === "io") {
      const dom = g.domains.find((d) => d.id === n.domainId);
      nodes.push({
        id: n.id,
        name: n.label,
        domainId: n.domainId || n.id,
        colorIndex: dom?.colorIndex ?? 0,
        kind: "io",
      });
    }
  }

  const treeEdges = g.edges
    .filter((e) => e.kind === "clock_tree" || e.kind === "io_ref")
    .map((e) => ({
      from: e.from.replace(/^clk:/, "").replace(/^io:/, ""),
      to: e.to.replace(/^clk:/, "").replace(/^io:/, e.to.startsWith("io:") ? e.to : e.to),
      label: e.label,
    }));

  // Fix io_ref to use node labels for layout
  const treeFixed = g.edges
    .filter((e) => e.kind === "clock_tree")
    .map((e) => ({
      from: e.from.replace(/^clk:/, ""),
      to: e.to.replace(/^clk:/, ""),
      label: e.label,
    }));

  const ioEdges = g.edges
    .filter((e) => e.kind === "io_ref")
    .map((e) => {
      const toNode = g.nodes.get(e.to);
      return {
        from: e.from.replace(/^clk:/, ""),
        to: toNode?.id || e.to,
        label: e.label,
      };
    });

  const cutEdges = g.edges
    .filter((e) => e.kind === "async_cut" || e.kind === "exclusive_cut")
    .map((e) => ({
      from: e.from.replace(/^clk:/, ""),
      to: e.to.replace(/^clk:/, ""),
      relation:
        e.kind === "async_cut"
          ? "asynchronous"
          : e.label === "L_EX"
          ? "logically_exclusive"
          : "physically_exclusive",
    }));

  return {
    domains: g.domains,
    nodes,
    treeEdges: [...treeFixed, ...ioEdges],
    cutEdges,
    stats: graphStats(g),
  };
}

export const GRAPH_DOMAIN_COLORS = [
  { fill: "#dbeafe", stroke: "#2563eb", text: "#1e3a8a" },
  { fill: "#fce7f3", stroke: "#db2777", text: "#9d174d" },
  { fill: "#d1fae5", stroke: "#059669", text: "#065f46" },
  { fill: "#fef3c7", stroke: "#d97706", text: "#92400e" },
  { fill: "#e0e7ff", stroke: "#4f46e5", text: "#312e81" },
  { fill: "#ffedd5", stroke: "#ea580c", text: "#9a3412" },
  { fill: "#f3e8ff", stroke: "#9333ea", text: "#6b21a8" },
  { fill: "#ccfbf1", stroke: "#0d9488", text: "#115e59" },
];

export interface SerializedDesignGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  domains: GraphDomain[];
  meta: DesignGraph["meta"];
}

/** Serialize DesignGraph to JSON string for debug / persistence */
export function serializeGraph(g: DesignGraph): string {
  const data: SerializedDesignGraph = {
    nodes: Array.from(g.nodes.values()),
    edges: g.edges,
    domains: g.domains,
    meta: g.meta,
  };
  return JSON.stringify(data, null, 2);
}

/** Deserialize JSON string back to DesignGraph */
export function deserializeGraph(jsonStr: string): DesignGraph {
  const parsed = JSON.parse(jsonStr) as SerializedDesignGraph;
  const g = createEmptyGraph();
  g.domains = parsed.domains || [];
  g.meta = parsed.meta || { pathCount: 0, clockCount: 0, builtAt: Date.now() };
  if (Array.isArray(parsed.nodes)) {
    parsed.nodes.forEach((n) => g.nodes.set(n.id, n));
  }
  if (Array.isArray(parsed.edges)) {
    g.edges = parsed.edges;
  }
  return g;
}

/** Export critical cone instance/pin list for PnR group_path / path_group */
export function exportCriticalConeTcl(
  nodes: GraphNode[],
  groupName = "critical_cone",
  vendor:
    | "genus"
    | "dc_shell"
    | "yosys"
    | "innovus"
    | "openroad"
    | "icc2"
    | "pt_shell"
    | "primetime"
    | "tempus"
    | "opensta" = "innovus"
): string {
  const pins = Array.from(new Set(nodes.map((n) => n.id).filter(Boolean)));
  const instances = Array.from(
    new Set(
      nodes
        .map((n) => (n.cell ? n.id.split("/")[0] : n.id))
        .filter(Boolean)
    )
  );

  const header = `# Path Group / Constraint for Critical Logic Cone (${nodes.length} nodes, ${instances.length} instances) · tool=${vendor}`;
  const pinList = pins.slice(0, 20).join(" ");

  switch (vendor) {
    case "genus":
    case "dc_shell":
    case "innovus":
    case "icc2":
      return `${header}\ngroup_path -name ${groupName} -to [get_pins {${pinList}}] -weight 5.0`;
    case "pt_shell":
    case "primetime":
    case "tempus":
      return `${header}\ngroup_path -name ${groupName} -through [get_pins {${pinList}}] -priority 100`;
    case "openroad":
    case "opensta":
      return `${header}\n# OpenROAD / OpenSTA path group\ngroup_path -name ${groupName} -to [get_pins {${pinList}}]`;
    case "yosys":
      return `${header}\n# PLACEHOLDER [yosys] path groups are STA/SDC — export SDC group_path for OpenSTA/PT\n# group_path -name ${groupName} -to {${pinList}}`;
    default:
      return `${header}\ngroup_path -name ${groupName} -to [get_pins {${pinList}}]`;
  }
}
