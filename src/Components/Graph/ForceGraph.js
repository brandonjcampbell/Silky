import React, { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { readPalette, THEME_EVENT } from "../../theme";

/**
 * A live physics graph on a canvas: nodes repel, links pull, the whole
 * thing settles but never freezes, and dragging a node tugs its neighbours.
 *
 * props: nodes [{ id, label, name, icon, type, x?, y? }], links [{ source, target, label }],
 *        selected (id), onSelect(id|null), onOpen(id), showNodeText, showEdgeText
 * ref:   { positions(): {id:{x,y}}, fit(), reheat() }
 */
const TYPE_COLOR = { element: "accent", fact: "inkSoft", snippet: "inkMuted", thread: "accent", web: "ink" };
const RADIUS = { element: 9, fact: 7, snippet: 8, thread: 10, web: 10 };

const ForceGraph = forwardRef(({ nodes, links, selected, onSelect, onOpen, showNodeText = true, showEdgeText = false }, ref) => {
  const canvasRef = useRef(null);
  const sim = useRef({ nodes: [], links: [], byId: new Map(), alpha: 1, view: { x: 0, y: 0, z: 1 }, hover: null, drag: null, palette: readPalette(), fitted: false });
  const propsRef = useRef({ selected, onSelect, onOpen, showNodeText, showEdgeText });
  propsRef.current = { selected, onSelect, onOpen, showNodeText, showEdgeText };

  // (re)build the simulation when the graph changes; keep positions of nodes we already had
  useEffect(() => {
    const s = sim.current;
    const old = s.byId;
    const n = nodes.length;
    const list = nodes.map((nd, i) => {
      const prev = old.get(nd.id);
      const angle = (i / Math.max(1, n)) * Math.PI * 2;
      const r = 60 + Math.sqrt(n) * 40;
      return {
        ...nd,
        x: prev ? prev.x : Number.isFinite(nd.x) ? nd.x : Math.cos(angle) * r + (Math.random() - 0.5) * 20,
        y: prev ? prev.y : Number.isFinite(nd.y) ? nd.y : Math.sin(angle) * r + (Math.random() - 0.5) * 20,
        vx: 0, vy: 0, fx: null, fy: null, deg: 0,
      };
    });
    const byId = new Map(list.map((d) => [d.id, d]));
    const ls = links.map((l) => ({ ...l, a: byId.get(l.source), b: byId.get(l.target) })).filter((l) => l.a && l.b && l.a !== l.b);
    ls.forEach((l) => { l.a.deg += 1; l.b.deg += 1; });
    s.nodes = list; s.links = ls; s.byId = byId; s.alpha = 1;
    // keep the whole graph in view while it spreads out, until the writer takes over
    s.autoFit = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links]);

  useEffect(() => {
    const onTheme = () => { sim.current.palette = readPalette(); };
    window.addEventListener(THEME_EVENT, onTheme);
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);

  const fit = () => {
    const s = sim.current;
    const c = canvasRef.current;
    if (!c || !s.nodes.length) return;
    const xs = s.nodes.map((d) => d.x), ys = s.nodes.map((d) => d.y);
    const minX = Math.min(...xs) - 60, maxX = Math.max(...xs) + 60, minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 60;
    const w = c.clientWidth, h = c.clientHeight;
    const z = Math.min(3, Math.max(0.05, Math.min(w / (maxX - minX || 1), h / (maxY - minY || 1))));
    s.view = { z, x: w / 2 - ((minX + maxX) / 2) * z, y: h / 2 - ((minY + maxY) / 2) * z };
  };
  useImperativeHandle(ref, () => ({
    positions: () => { const p = {}; sim.current.nodes.forEach((d) => { p[d.id] = { x: d.x, y: d.y }; }); return p; },
    fit,
    reheat: () => { sim.current.alpha = 1; },
  }));

  /* ── the loop ── */
  useEffect(() => {
    let raf = 0;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const step = () => {
      const s = sim.current;
      s.frame = (s.frame || 0) + 1;
      if (s.autoFit && c.clientWidth > 0 && s.frame % 6 === 0) { fit(); if (s.alpha < 0.12) s.autoFit = false; }
      const N = s.nodes;
      const n = N.length;
      if (n) {
        const big = n > 250;
        // cool slowly toward a low floor so the graph breathes but doesn't jitter
        s.alpha = Math.max(0.02, s.alpha * 0.985);
        const k = s.alpha;
        // repulsion (O(n²); fine for a web of a few hundred)
        const maxD2 = big ? 250 * 250 : 400 * 400;
        for (let i = 0; i < n; i += 1) {
          const a = N[i];
          for (let j = i + 1; j < n; j += 1) {
            const b = N[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            let d2 = dx * dx + dy * dy;
            if (d2 > maxD2) continue;
            if (d2 < 1) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = 1; }
            const f = (big ? 900 : 1600) * k / d2;
            const fx = dx * f, fy = dy * f;
            a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
          }
        }
        // springs
        const rest = big ? 70 : 110;
        s.links.forEach((l) => {
          const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          const f = ((d - rest) / d) * 0.08 * k;
          const wa = l.b.deg / (l.a.deg + l.b.deg), wb = 1 - wa;
          l.a.vx += dx * f * wa; l.a.vy += dy * f * wa;
          l.b.vx -= dx * f * wb; l.b.vy -= dy * f * wb;
        });
        // gravity to the middle, damping, integrate
        N.forEach((d) => {
          d.vx -= d.x * 0.004 * k; d.vy -= d.y * 0.004 * k;
          d.vx *= 0.82; d.vy *= 0.82;
          if (d.fx != null) { d.x = d.fx; d.y = d.fy; d.vx = 0; d.vy = 0; }
          else { d.x += d.vx; d.y += d.vy; }
        });
      }
      draw(ctx, c);
      raf = requestAnimationFrame(step);
    };
    const draw = (g, cv) => {
      const s = sim.current;
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const { x: tx, y: ty, z } = s.view;
      g.translate(tx, ty); g.scale(z, z);
      const P = s.palette;
      const { selected: sel, showNodeText: nt, showEdgeText: et } = propsRef.current;
      const selNode = sel ? s.byId.get(sel) : null;
      const hot = new Set();
      if (selNode) { hot.add(selNode); s.links.forEach((l) => { if (l.a === selNode) hot.add(l.b); if (l.b === selNode) hot.add(l.a); }); }
      // links
      g.lineWidth = 1.2 / z;
      s.links.forEach((l) => {
        const on = selNode && (l.a === selNode || l.b === selNode);
        g.strokeStyle = on ? P.accent : l.kind === "then" ? P.accent : P.inkMuted;
        g.globalAlpha = selNode && !on ? 0.25 : on ? 1 : 0.7;
        g.beginPath(); g.moveTo(l.a.x, l.a.y); g.lineTo(l.b.x, l.b.y); g.stroke();
        // arrow head
        const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1;
        const r = (RADIUS[l.b.type] || 8) + 2;
        const ex = l.b.x - (dx / d) * r, ey = l.b.y - (dy / d) * r;
        const ah = 6 / Math.sqrt(z);
        g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - (dx / d) * ah - (dy / d) * ah * 0.5, ey - (dy / d) * ah + (dx / d) * ah * 0.5); g.lineTo(ex - (dx / d) * ah + (dy / d) * ah * 0.5, ey - (dy / d) * ah - (dx / d) * ah * 0.5); g.closePath(); g.fillStyle = g.strokeStyle; g.fill();
        if ((et || on) && l.label && z > 0.5) {
          g.globalAlpha = on ? 1 : 0.8;
          g.font = `${11 / z}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
          const mx = (l.a.x + l.b.x) / 2, my = (l.a.y + l.b.y) / 2;
          g.fillStyle = P.bg; const tw = g.measureText(l.label).width; g.fillRect(mx - tw / 2 - 2 / z, my - 7 / z, tw + 4 / z, 14 / z);
          g.fillStyle = P.inkSoft; g.fillText(l.label, mx, my);
        }
      });
      g.globalAlpha = 1;
      // nodes
      s.nodes.forEach((d) => {
        const r = RADIUS[d.type] || 8;
        const isSel = selNode === d, isHot = hot.has(d), isHover = s.hover === d;
        g.globalAlpha = selNode && !isHot ? 0.35 : 1;
        g.beginPath();
        if (d.type === "fact") g.rect(d.x - r, d.y - r, r * 2, r * 2);
        else if (d.type === "snippet") g.rect(d.x - r * 1.2, d.y - r * 0.8, r * 2.4, r * 1.6);
        else if (d.type === "thread") { g.moveTo(d.x, d.y - r * 1.2); g.lineTo(d.x + r * 1.2, d.y); g.lineTo(d.x, d.y + r * 1.2); g.lineTo(d.x - r * 1.2, d.y); g.closePath(); }
        else g.arc(d.x, d.y, r, 0, Math.PI * 2);
        g.fillStyle = P.bgRaised; g.fill();
        g.lineWidth = (isSel ? 3 : isHover ? 2 : 1.2) / z;
        g.strokeStyle = isSel || isHover ? P.accent : P[TYPE_COLOR[d.type]] || P.line;
        g.stroke();
        if (nt || isHot || isHover || z > 1.4) {
          g.font = `${(isSel ? 13 : 12) / z}px sans-serif`; g.textAlign = "center"; g.textBaseline = "top";
          const label = (d.icon ? d.icon + " " : "") + (d.name.length > 44 && !isSel ? d.name.slice(0, 42).replace(/\s+\S*$/, "") + "…" : d.name);
          g.lineWidth = 3 / z; g.strokeStyle = P.bg; g.strokeText(label, d.x, d.y + r + 3 / z);
          g.fillStyle = isSel ? P.ink : P.inkSoft; g.fillText(label, d.x, d.y + r + 3 / z);
        }
      });
      g.globalAlpha = 1;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── pointer ── */
  const toWorld = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const { x, y, z } = sim.current.view;
    return { x: (e.clientX - r.left - x) / z, y: (e.clientY - r.top - y) / z };
  };
  const nodeAt = (p) => {
    const s = sim.current;
    let best = null, bd = Infinity;
    const slop = 14 / s.view.z;
    s.nodes.forEach((d) => { const dd = Math.hypot(d.x - p.x, d.y - p.y); if (dd < (RADIUS[d.type] || 8) + slop && dd < bd) { best = d; bd = dd; } });
    return best;
  };
  const onDown = (e) => {
    const s = sim.current;
    s.autoFit = false;
    const p = toWorld(e);
    const d = nodeAt(p);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (d) { s.drag = { node: d, moved: false, sx: e.clientX, sy: e.clientY }; d.fx = d.x; d.fy = d.y; s.alpha = Math.max(s.alpha, 0.6); }
    else s.drag = { pan: true, sx: e.clientX, sy: e.clientY, vx: s.view.x, vy: s.view.y, moved: false };
  };
  const onMove = (e) => {
    const s = sim.current;
    if (!s.drag) { s.hover = nodeAt(toWorld(e)); canvasRef.current.style.cursor = s.hover ? "pointer" : "grab"; return; }
    const dx = e.clientX - s.drag.sx, dy = e.clientY - s.drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) s.drag.moved = true;
    if (s.drag.pan) { s.view.x = s.drag.vx + dx; s.view.y = s.drag.vy + dy; }
    else { const p = toWorld(e); s.drag.node.fx = p.x; s.drag.node.fy = p.y; s.alpha = Math.max(s.alpha, 0.4); }
  };
  const onUp = (e) => {
    const s = sim.current;
    const d = s.drag;
    s.drag = null;
    if (!d) return;
    if (d.node) { d.node.fx = null; d.node.fy = null; if (!d.moved) propsRef.current.onSelect && propsRef.current.onSelect(d.node.id); }
    else if (!d.moved) propsRef.current.onSelect && propsRef.current.onSelect(null);
  };
  const onDouble = (e) => { const d = nodeAt(toWorld(e)); if (d && propsRef.current.onOpen) propsRef.current.onOpen(d.id); };
  const onWheel = (e) => {
    e.preventDefault();
    const s = sim.current;
    s.autoFit = false;
    const r = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const z = Math.min(4, Math.max(0.05, s.view.z * f));
    s.view = { z, x: cx - (cx - s.view.x) * (z / s.view.z), y: cy - (cy - s.view.y) * (z / s.view.z) };
  };
  useEffect(() => {
    const c = canvasRef.current;
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="forceGraph" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onDoubleClick={onDouble} />;
});

export default ForceGraph;
