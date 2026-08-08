// Statistical helper functions used across the dashboard.
// All functions are defensive: non-finite / non-numeric values are silently
// excluded from the relevant computation rather than propagating NaN or
// throwing (see cahier des charges §4.4).

/**
 * Keep only finite numeric values from an array of raw values.
 */
function toValidNumbers(values) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      out.push(v);
    }
  }
  return out;
}

function mean(values) {
  const v = toValidNumbers(values);
  if (v.length === 0) return null;
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i];
  return sum / v.length;
}

function median(values) {
  const v = toValidNumbers(values).slice().sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  if (v.length % 2 === 0) {
    return (v[mid - 1] + v[mid]) / 2;
  }
  return v[mid];
}

/**
 * Percentile via linear interpolation on rank (numpy default / Excel
 * PERCENTILE.INC). p is a fraction between 0 and 1.
 */
function percentile(values, p) {
  const v = toValidNumbers(values).slice().sort((a, b) => a - b);
  if (v.length === 0) return null;
  if (v.length === 1) return v[0];
  const rank = p * (v.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return v[lower];
  const frac = rank - lower;
  return v[lower] + (v[upper] - v[lower]) * frac;
}

function percentiles(values, ps) {
  const v = toValidNumbers(values).slice().sort((a, b) => a - b);
  const result = {};
  for (let i = 0; i < ps.length; i++) {
    result[ps[i]] = percentile(v, ps[i]);
  }
  return result;
}

/**
 * Sample standard deviation (denominator n - 1).
 */
function stdDev(values) {
  const v = toValidNumbers(values);
  if (v.length < 2) return null;
  const m = mean(v);
  let sumSq = 0;
  for (let i = 0; i < v.length; i++) {
    const d = v[i] - m;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / (v.length - 1));
}

function min(values) {
  const v = toValidNumbers(values);
  if (v.length === 0) return null;
  return Math.min.apply(null, v);
}

function max(values) {
  const v = toValidNumbers(values);
  if (v.length === 0) return null;
  return Math.max.apply(null, v);
}

/**
 * IQR outlier detection (1.5x rule). Returns bounds and the list of
 * outlier values found. Outliers are NOT removed from any other
 * calculation — they are only flagged here.
 */
function iqrOutliers(values) {
  const v = toValidNumbers(values);
  const p25 = percentile(v, 0.25);
  const p75 = percentile(v, 0.75);
  if (p25 === null || p75 === null) {
    return { iqr: null, lowerBound: null, upperBound: null, outliers: [], count: 0 };
  }
  const iqr = p75 - p25;
  const lowerBound = p25 - 1.5 * iqr;
  const upperBound = p75 + 1.5 * iqr;
  const outliers = v.filter((x) => x < lowerBound || x > upperBound);
  return { iqr, lowerBound, upperBound, outliers, count: outliers.length };
}

/**
 * Full descriptive summary for a set of values, used to populate KPIs
 * and comparison tables.
 */
function describe(values) {
  const v = toValidNumbers(values);
  const outlierInfo = iqrOutliers(v);
  return {
    n: v.length,
    mean: mean(v),
    median: median(v),
    stdDev: stdDev(v),
    min: min(v),
    max: max(v),
    percentiles: percentiles(v, [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]),
    outlierCount: outlierInfo.count,
    outlierBounds: { lower: outlierInfo.lowerBound, upper: outlierInfo.upperBound },
  };
}

/**
 * Bin edges/counts for a histogram, framed visually on [p1, p99] but
 * built from the full valid value set. Values outside [p1, p99] are
 * clamped into the first/last bin so nothing is dropped from the render.
 */
function histogramBins(values, p1, p99, binCount) {
  const v = toValidNumbers(values);
  const bins = new Array(binCount).fill(0);
  if (v.length === 0 || p1 === null || p99 === null || p1 === p99) {
    return { bins, edges: [], binWidth: 0 };
  }
  const binWidth = (p99 - p1) / binCount;
  const edges = [];
  for (let i = 0; i <= binCount; i++) edges.push(p1 + i * binWidth);

  for (let i = 0; i < v.length; i++) {
    let idx = Math.floor((v[i] - p1) / binWidth);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    bins[idx]++;
  }
  return { bins, edges, binWidth };
}

/**
 * Mann-Whitney-style probability of superiority: probability that a value
 * drawn at random from `valuesA` exceeds one drawn at random from
 * `valuesB` (ties count as 0.5). 0.5 = the two groups are indistinguishable
 * on this variable; near 0 or near 1 = they are almost fully separated.
 * Purely descriptive, computed once per feature — no search, no threshold.
 */
function probabilityOfSuperiority(valuesA, valuesB) {
  const a = toValidNumbers(valuesA);
  const b = toValidNumbers(valuesB);
  const nA = a.length;
  const nB = b.length;
  if (nA === 0 || nB === 0) return null;

  const combined = a.map((v) => ({ v, group: "A" })).concat(b.map((v) => ({ v, group: "B" })));
  combined.sort((x, y) => x.v - y.v);

  const n = combined.length;
  const ranks = new Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && combined[j + 1].v === combined[i].v) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = avgRank;
    i = j + 1;
  }

  let rankSumA = 0;
  for (let k = 0; k < n; k++) {
    if (combined[k].group === "A") rankSumA += ranks[k];
  }
  const uA = rankSumA - (nA * (nA + 1)) / 2;
  return uA / (nA * nB);
}
