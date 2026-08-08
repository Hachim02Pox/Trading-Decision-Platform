// Hand-drawn SVG chart primitives: histogram and horizontal boxplot.
// No canvas, no external library — plain DOM/SVG element construction.

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }
  return el;
}

function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function formatNum(v, decimals) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const d = decimals === undefined ? 3 : decimals;
  return Number(v.toFixed(d)).toString();
}

/**
 * Renders one or two overlaid histograms into `container`.
 * opts:
 *   series: [{ values, label, color, outliers? }] (1 or 2 entries)
 *   p1, p99: visual framing bounds (all data still included in the bins)
 *   binCount
 *   markOutliers: boolean — draw a rug of outlier ticks below the axis
 *     (only meaningful/used for a single-series distribution chart)
 */
function renderHistogram(container, opts) {
  clearElement(container);

  const width = 640;
  const height = 260;
  const margin = { top: 16, right: 20, bottom: 40, left: 44 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const binCount = opts.binCount || 28;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg",
    role: "img",
    "aria-label": "Histogramme",
  });

  const p1 = opts.p1;
  const p99 = opts.p99;
  const validFrame = p1 !== null && p99 !== null && p1 !== p99;

  if (!validFrame) {
    const msg = svgEl("text", { x: width / 2, y: height / 2, class: "chart-empty-text", "text-anchor": "middle" });
    msg.textContent = "Données insuffisantes pour tracer un histogramme.";
    svg.appendChild(msg);
    container.appendChild(svg);
    return;
  }

  const binned = opts.series.map((s) => histogramBins(s.values, p1, p99, binCount));
  let maxCount = 1;
  binned.forEach((b) => {
    b.bins.forEach((c) => {
      if (c > maxCount) maxCount = c;
    });
  });

  const xScale = (v) => margin.left + ((v - p1) / (p99 - p1)) * plotW;
  const yScale = (c) => margin.top + plotH - (c / maxCount) * plotH;

  // optional highlight band (e.g. best-score interval), drawn behind everything
  if (opts.highlightRange) {
    let [hlLo, hlHi] = opts.highlightRange;
    if (hlLo < p1) hlLo = p1;
    if (hlHi > p99) hlHi = p99;
    if (hlHi > hlLo) {
      const xLo = xScale(hlLo);
      const xHi = xScale(hlHi);
      svg.appendChild(svgEl("rect", {
        x: xLo, y: margin.top, width: xHi - xLo, height: plotH,
        class: "chart-highlight-band",
      }));
    }
  }

  // gridlines + y-axis ticks
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const c = (maxCount / yTicks) * i;
    const y = yScale(c);
    svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + plotW, y1: y, y2: y, class: "chart-gridline" }));
    const t = svgEl("text", { x: margin.left - 8, y: y + 3, class: "chart-axis-text", "text-anchor": "end" });
    t.textContent = Math.round(c).toString();
    svg.appendChild(t);
  }

  // x-axis ticks
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const v = p1 + ((p99 - p1) / xTicks) * i;
    const x = xScale(v);
    const t = svgEl("text", { x: x, y: margin.top + plotH + 18, class: "chart-axis-text", "text-anchor": "middle" });
    t.textContent = formatNum(v, 2);
    svg.appendChild(t);
  }

  // bars
  const barGap = 1;
  binned.forEach((b, seriesIdx) => {
    const s = opts.series[seriesIdx];
    const group = svgEl("g", { class: "chart-series" });
    for (let i = 0; i < b.bins.length; i++) {
      const count = b.bins[i];
      if (count === 0) continue;
      const x0 = xScale(b.edges[i]);
      const x1 = xScale(b.edges[i + 1]);
      const y = yScale(count);
      const rect = svgEl("rect", {
        x: x0 + barGap / 2,
        y: y,
        width: Math.max(0, x1 - x0 - barGap),
        height: margin.top + plotH - y,
        fill: s.color,
        "fill-opacity": opts.series.length > 1 ? 0.55 : 0.85,
        stroke: s.color,
        "stroke-width": 0.5,
      });
      const title = svgEl("title");
      title.textContent = `${s.label}: ${count} setup(s) dans [${formatNum(b.edges[i], 3)}, ${formatNum(b.edges[i + 1], 3)}[`;
      rect.appendChild(title);
      group.appendChild(rect);
    }
    svg.appendChild(group);
  });

  // axis lines
  svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + plotW, y1: margin.top + plotH, y2: margin.top + plotH, class: "chart-axis-line" }));

  // outlier rug (single series only)
  if (opts.markOutliers && opts.series.length === 1) {
    const info = iqrOutliers(opts.series[0].values);
    const rugY = margin.top + plotH + 30;
    info.outliers.forEach((v) => {
      let clamped = v;
      if (clamped < p1) clamped = p1;
      if (clamped > p99) clamped = p99;
      const x = xScale(clamped);
      const mark = svgEl("path", {
        d: `M ${x} ${rugY - 4} L ${x - 3.5} ${rugY + 3} L ${x + 3.5} ${rugY + 3} Z`,
        class: "chart-outlier-mark",
      });
      const title = svgEl("title");
      title.textContent = `Outlier : ${formatNum(v, 4)}`;
      mark.appendChild(title);
      svg.appendChild(mark);
    });
  }

  container.appendChild(svg);
}

/**
 * Renders one horizontal boxplot per group, stacked vertically, all
 * sharing the same x-axis domain so they line up for comparison.
 * opts:
 *   groups: [{ label, values, color }]
 *   domain: [min, max]
 */
function renderBoxplot(container, opts) {
  clearElement(container);

  const width = 640;
  const rowHeight = 64;
  const margin = { top: 12, right: 24, bottom: 30, left: 90 };
  const groups = opts.groups;
  const plotW = width - margin.left - margin.right;
  const height = margin.top + margin.bottom + rowHeight * groups.length;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg",
    role: "img",
    "aria-label": "Boxplot horizontal",
  });

  const [domMin, domMax] = opts.domain;
  const validDomain = domMin !== null && domMax !== null && domMin !== domMax;

  if (!validDomain) {
    const msg = svgEl("text", { x: width / 2, y: height / 2, class: "chart-empty-text", "text-anchor": "middle" });
    msg.textContent = "Données insuffisantes pour tracer un boxplot.";
    svg.appendChild(msg);
    container.appendChild(svg);
    return;
  }

  const xScale = (v) => margin.left + ((v - domMin) / (domMax - domMin)) * plotW;

  groups.forEach((g, i) => {
    const rowY = margin.top + i * rowHeight;
    const centerY = rowY + rowHeight / 2;
    const boxHalf = 14;

    const label = svgEl("text", { x: margin.left - 10, y: centerY + 4, class: "chart-axis-text", "text-anchor": "end" });
    label.textContent = `${g.label} (n=${toValidNumbers(g.values).length})`;
    svg.appendChild(label);

    const v = toValidNumbers(g.values);
    if (v.length === 0) {
      const noData = svgEl("text", { x: margin.left + 4, y: centerY + 4, class: "chart-empty-text" });
      noData.textContent = "n=0 — aucune donnée";
      svg.appendChild(noData);
      return;
    }

    const q1 = percentile(v, 0.25);
    const q3 = percentile(v, 0.75);
    const med = median(v);
    const outlierInfo = iqrOutliers(v);
    const inRange = v.filter((x) => x >= outlierInfo.lowerBound && x <= outlierInfo.upperBound);
    const whiskerLow = Math.min.apply(null, inRange.length ? inRange : v);
    const whiskerHigh = Math.max.apply(null, inRange.length ? inRange : v);

    const xWhiskerLow = xScale(whiskerLow);
    const xWhiskerHigh = xScale(whiskerHigh);
    const xQ1 = xScale(q1);
    const xQ3 = xScale(q3);
    const xMed = xScale(med);

    const g_ = svgEl("g", { class: "chart-series" });

    // whisker line
    g_.appendChild(svgEl("line", { x1: xWhiskerLow, x2: xWhiskerHigh, y1: centerY, y2: centerY, class: "chart-whisker", stroke: g.color }));
    g_.appendChild(svgEl("line", { x1: xWhiskerLow, x2: xWhiskerLow, y1: centerY - 7, y2: centerY + 7, class: "chart-whisker", stroke: g.color }));
    g_.appendChild(svgEl("line", { x1: xWhiskerHigh, x2: xWhiskerHigh, y1: centerY - 7, y2: centerY + 7, class: "chart-whisker", stroke: g.color }));

    // box
    const box = svgEl("rect", {
      x: Math.min(xQ1, xQ3),
      y: centerY - boxHalf,
      width: Math.max(1, Math.abs(xQ3 - xQ1)),
      height: boxHalf * 2,
      fill: g.color,
      "fill-opacity": 0.35,
      stroke: g.color,
      "stroke-width": 1.5,
    });
    const boxTitle = svgEl("title");
    boxTitle.textContent = `${g.label} — Q1: ${formatNum(q1)}, médiane: ${formatNum(med)}, Q3: ${formatNum(q3)}`;
    box.appendChild(boxTitle);
    g_.appendChild(box);

    // median line
    g_.appendChild(svgEl("line", { x1: xMed, x2: xMed, y1: centerY - boxHalf, y2: centerY + boxHalf, class: "chart-median", stroke: g.color }));

    // outlier points
    outlierInfo.outliers.forEach((ov) => {
      const cx = xScale(ov);
      const dot = svgEl("circle", { cx, cy: centerY, r: 3, class: "chart-outlier-dot", fill: g.color });
      const t = svgEl("title");
      t.textContent = `Outlier : ${formatNum(ov, 4)}`;
      dot.appendChild(t);
      g_.appendChild(dot);
    });

    svg.appendChild(g_);
  });

  // shared x-axis
  const axisY = margin.top + rowHeight * groups.length + 6;
  svg.appendChild(svgEl("line", { x1: margin.left, x2: margin.left + plotW, y1: axisY, y2: axisY, class: "chart-axis-line" }));
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const v = domMin + ((domMax - domMin) / xTicks) * i;
    const x = xScale(v);
    const t = svgEl("text", { x, y: axisY + 16, class: "chart-axis-text", "text-anchor": "middle" });
    t.textContent = formatNum(v, 2);
    svg.appendChild(t);
  }

  container.appendChild(svg);
}
