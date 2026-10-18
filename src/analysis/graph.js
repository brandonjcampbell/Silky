/* Structure of a web: who holds it together, who sits at its edges, where
   it breaks into groups. Plain algorithms on a small undirected graph —
   webs are a few hundred nodes at most. */

/** Build adjacency from Cytoscape-style elements. */
export const buildGraph = (elements) => {
  const nodes = elements.filter((e) => !e.data.source).map((e) => e.data.id);
  const set = new Set(nodes);
  const adj = new Map(nodes.map((n) => [n, new Set()]));
  const edges = [];
  elements.filter((e) => e.data.source && set.has(e.data.source) && set.has(e.data.target) && e.data.source !== e.data.target).forEach((e) => {
    adj.get(e.data.source).add(e.data.target); adj.get(e.data.target).add(e.data.source);
    edges.push([e.data.source, e.data.target]);
  });
  return { nodes, adj, edges };
};

const bfs = (adj, s) => {
  const dist = new Map([[s, 0]]);
  const q = [s];
  for (let i = 0; i < q.length; i += 1) { const u = q[i]; adj.get(u).forEach((v) => { if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); q.push(v); } }); }
  return dist;
};

/** Connected components, largest first. */
export const components = ({ nodes, adj }) => {
  const seen = new Set(); const out = [];
  nodes.forEach((n) => { if (seen.has(n)) return; const d = bfs(adj, n); const comp = [...d.keys()]; comp.forEach((x) => seen.add(x)); out.push(comp); });
  return out.sort((a, b) => b.length - a.length);
};

/** Brandes betweenness, normalised to 0..1. */
export const betweenness = ({ nodes, adj }) => {
  const cb = new Map(nodes.map((n) => [n, 0]));
  nodes.forEach((s) => {
    const stack = []; const pred = new Map(nodes.map((n) => [n, []])); const sigma = new Map(nodes.map((n) => [n, 0])); const dist = new Map(nodes.map((n) => [n, -1]));
    sigma.set(s, 1); dist.set(s, 0);
    const q = [s];
    while (q.length) { const v = q.shift(); stack.push(v); adj.get(v).forEach((w) => { if (dist.get(w) < 0) { q.push(w); dist.set(w, dist.get(v) + 1); } if (dist.get(w) === dist.get(v) + 1) { sigma.set(w, sigma.get(w) + sigma.get(v)); pred.get(w).push(v); } }); }
    const delta = new Map(nodes.map((n) => [n, 0]));
    while (stack.length) { const w = stack.pop(); pred.get(w).forEach((v) => delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)))); if (w !== s) cb.set(w, cb.get(w) + delta.get(w)); }
  });
  const n = nodes.length; const scale = n > 2 ? 1 / ((n - 1) * (n - 2)) : 0; // undirected: counted twice, so (n-1)(n-2) not /2
  return new Map(nodes.map((v) => [v, cb.get(v) * scale]));
};

/** Closeness within a node's component, 0..1. */
export const closeness = ({ nodes, adj }) => new Map(nodes.map((n) => { const d = bfs(adj, n); const reach = d.size - 1; const sum = [...d.values()].reduce((a, b) => a + b, 0); return [n, reach && sum ? (reach / (nodes.length - 1 || 1)) * (reach / sum) : 0]; }));

/** PageRank on the undirected graph. */
export const pagerank = ({ nodes, adj }, d = 0.85, iters = 60) => {
  const n = nodes.length; if (!n) return new Map();
  let pr = new Map(nodes.map((x) => [x, 1 / n]));
  for (let k = 0; k < iters; k += 1) {
    const next = new Map(nodes.map((x) => [x, (1 - d) / n]));
    let dangling = 0;
    nodes.forEach((u) => { const deg = adj.get(u).size; if (!deg) { dangling += pr.get(u); return; } const share = (d * pr.get(u)) / deg; adj.get(u).forEach((v) => next.set(v, next.get(v) + share)); });
    nodes.forEach((x) => next.set(x, next.get(x) + (d * dangling) / n));
    pr = next;
  }
  const max = Math.max(...pr.values()) || 1;
  return new Map(nodes.map((x) => [x, pr.get(x) / max]));
};

/** Articulation points: nodes whose removal splits their component. */
export const articulationPoints = ({ nodes, adj }) => {
  const disc = new Map(), low = new Map(), out = new Set(); let time = 0;
  const dfs = (u, parent) => {
    disc.set(u, time); low.set(u, time); time += 1; let children = 0;
    adj.get(u).forEach((v) => {
      if (!disc.has(v)) { children += 1; dfs(v, u); low.set(u, Math.min(low.get(u), low.get(v))); if (parent !== null && low.get(v) >= disc.get(u)) out.add(u); }
      else if (v !== parent) low.set(u, Math.min(low.get(u), disc.get(v)));
    });
    if (parent === null && children > 1) out.add(u);
  };
  nodes.forEach((n) => { if (!disc.has(n)) dfs(n, null); });
  return out;
};

/** Communities by label propagation (deterministic order, a few sweeps). */
export const communities = ({ nodes, adj }) => {
  const label = new Map(nodes.map((n, i) => [n, i]));
  const order = [...nodes].sort((a, b) => adj.get(b).size - adj.get(a).size);
  for (let sweep = 0; sweep < 12; sweep += 1) {
    let changed = false;
    order.forEach((n) => {
      if (!adj.get(n).size) return;
      const count = new Map();
      adj.get(n).forEach((m) => count.set(label.get(m), (count.get(label.get(m)) || 0) + 1));
      let best = label.get(n), bestC = -1;
      [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).forEach(([l, c]) => { if (c > bestC) { best = l; bestC = c; } });
      if (best !== label.get(n)) { label.set(n, best); changed = true; }
    });
    if (!changed) break;
  }
  const groups = new Map();
  nodes.forEach((n) => { if (!adj.get(n).size) return; const l = label.get(n); if (!groups.has(l)) groups.set(l, []); groups.get(l).push(n); });
  return [...groups.values()].sort((a, b) => b.length - a.length);
};

/** Everything at once. */
export const analyseWeb = (elements) => {
  const g = buildGraph(elements);
  const { nodes, adj, edges } = g;
  const n = nodes.length;
  const degree = new Map(nodes.map((x) => [x, adj.get(x).size]));
  const comps = components(g);
  const orphans = nodes.filter((x) => !adj.get(x).size);
  const bt = n > 2 ? betweenness(g) : new Map(nodes.map((x) => [x, 0]));
  const cl = closeness(g);
  const pr = pagerank(g);
  const cuts = articulationPoints(g);
  const comms = communities(g);
  const density = n > 1 ? (2 * edges.length) / (n * (n - 1)) : 0;
  // diameter of the largest component, from a handful of far-apart starts
  let diameter = 0;
  if (comps[0] && comps[0].length > 1) { const starts = comps[0].slice(0, 6); starts.forEach((s) => { const d = bfs(adj, s); diameter = Math.max(diameter, ...d.values()); }); }
  const leaves = nodes.filter((x) => adj.get(x).size === 1);
  return { nodes, edges: edges.length, degree, betweenness: bt, closeness: cl, pagerank: pr, cuts, communities: comms, components: comps, orphans, leaves, density, diameter, avgDegree: n ? (2 * edges.length) / n : 0 };
};
