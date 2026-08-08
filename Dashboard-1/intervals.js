// Addendum: per-feature "best observed WIN/LOSS ratio interval" search
// (Wilson score lower bound), and the isolated, high-risk cross-feature
// intersection ("Croisement des intervalles"). See Prompt2.md.
//
// This module only computes numbers; DOM rendering happens in app.js.

const WILSON_Z = 1.96;
const MIN_INTERVAL_N = 10;

/**
 * Wilson score 95% confidence lower bound for a WIN ratio.
 * Same formula, same z, for every feature — nothing is tuned per feature.
 */
function wilsonLowerBound(nWin, nTotal) {
  if (nTotal === 0) return null;
  const z = WILSON_Z;
  const phat = nWin / nTotal;
  const denom = 1 + (z * z) / nTotal;
  const center = phat + (z * z) / (2 * nTotal);
  const margin = z * Math.sqrt((phat * (1 - phat)) / nTotal + (z * z) / (4 * nTotal * nTotal));
  return (center - margin) / denom;
}

/**
 * 101 candidate cut points (percentiles 0..100 step 1), deduplicated.
 */
function candidateBreakpoints(values) {
  const set = new Set();
  for (let i = 0; i <= 100; i++) {
    const p = percentile(values, i / 100);
    if (p !== null) set.add(p);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Finds the [lo, hi] interval (from candidate breakpoints) maximizing the
 * Wilson lower-bound score, among intervals with n_total >= MIN_INTERVAL_N.
 * values/outcomes are parallel arrays; only WIN/LOSS rows count.
 * Returns null if no interval reaches MIN_INTERVAL_N.
 */
function findBestInterval(values, outcomes) {
  const pairs = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const o = outcomes[i];
    if (Number.isFinite(v) && (o === "WIN" || o === "LOSS")) {
      pairs.push({ v, isWin: o === "WIN" });
    }
  }
  pairs.sort((a, b) => a.v - b.v);

  const n = pairs.length;
  const sortedValues = pairs.map((p) => p.v);
  const prefixWin = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefixWin[i + 1] = prefixWin[i] + (pairs[i].isWin ? 1 : 0);

  // first index with sortedValues[idx] >= target
  function countBelow(target) {
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedValues[mid] < target) lo = mid + 1; else hi = mid;
    }
    return lo;
  }
  // count of elements <= target
  function countAtMost(target) {
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedValues[mid] <= target) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  const breakpoints = candidateBreakpoints(sortedValues);
  let best = null;

  for (let i = 0; i < breakpoints.length; i++) {
    const lo = breakpoints[i];
    const startIdx = countBelow(lo);
    for (let j = i + 1; j < breakpoints.length; j++) {
      const hi = breakpoints[j];
      const endIdx = countAtMost(hi);
      const nTotal = endIdx - startIdx;
      if (nTotal < MIN_INTERVAL_N) continue;
      const nWin = prefixWin[endIdx] - prefixWin[startIdx];
      const nLoss = nTotal - nWin;
      const score = wilsonLowerBound(nWin, nTotal);
      if (best === null || score > best.score) {
        best = { lo, hi, nWin, nLoss, nTotal, ratio: nWin / nTotal, score };
      }
    }
  }
  return best;
}

function extractFeatureOutcomePairs(feature) {
  const values = [];
  const outcomes = [];
  for (let i = 0; i < setupsData.length; i++) {
    const v = setupsData[i][feature];
    if (Number.isFinite(v)) {
      values.push(v);
      outcomes.push(setupsData[i].Outcome);
    }
  }
  return { values, outcomes };
}

const bestIntervalCache = {};
function getBestIntervalForFeature(feature) {
  if (!(feature in bestIntervalCache)) {
    const { values, outcomes } = extractFeatureOutcomePairs(feature);
    bestIntervalCache[feature] = findBestInterval(values, outcomes);
  }
  return bestIntervalCache[feature];
}

/**
 * Cross-feature intersection (section 7): applies each feature's own best
 * interval cumulatively, in Wilson-score-descending order, and reports the
 * shrinking sample at every step. Deliberately isolated from per-feature
 * exploration — this stacks 16 already-optimized filters.
 */
function computeCrossing(features) {
  const perFeature = features.map((f) => ({ feature: f, interval: getBestIntervalForFeature(f) }));
  const usable = perFeature.filter((x) => x.interval !== null);
  const excluded = perFeature.filter((x) => x.interval === null).map((x) => x.feature);
  const ordered = usable.slice().sort((a, b) => b.interval.score - a.interval.score);

  function countOutcomes(indices) {
    let nWin = 0, nLoss = 0;
    for (let k = 0; k < indices.length; k++) {
      const o = setupsData[indices[k]].Outcome;
      if (o === "WIN") nWin++;
      else if (o === "LOSS") nLoss++;
    }
    return { nWin, nLoss, nTotal: indices.length };
  }

  let currentIndices = setupsData.map((_, i) => i);
  const funnel = [{ step: 0, feature: null, interval: null, ...countOutcomes(currentIndices) }];

  ordered.forEach((item, idx) => {
    const { feature, interval } = item;
    currentIndices = currentIndices.filter((i) => {
      const v = setupsData[i][feature];
      return Number.isFinite(v) && v >= interval.lo && v <= interval.hi;
    });
    funnel.push({ step: idx + 1, feature, interval, ...countOutcomes(currentIndices) });
  });

  return { perFeature, ordered, excluded, funnel, final: funnel[funnel.length - 1] };
}

// ---------------------------------------------------------------------
// Addendum 2: "best observed combination" — a joint, greedy search across
// features, as opposed to computeCrossing() above which simply intersects
// each feature's own already-optimal interval (and can collapse to 0).
// Here, a feature's interval is chosen to fit the sample already narrowed
// by previously-added features, not in isolation. See Prompt3 request.
// ---------------------------------------------------------------------

function countOutcomesForIndices(indices) {
  let nWin = 0, nLoss = 0;
  for (let k = 0; k < indices.length; k++) {
    const o = setupsData[indices[k]].Outcome;
    if (o === "WIN") nWin++;
    else if (o === "LOSS") nLoss++;
  }
  return { nWin, nLoss, nTotal: indices.length };
}

function extractFeatureOutcomePairsForIndices(feature, indices) {
  const values = [];
  const outcomes = [];
  for (let k = 0; k < indices.length; k++) {
    const row = setupsData[indices[k]];
    const v = row[feature];
    if (Number.isFinite(v)) {
      values.push(v);
      outcomes.push(row.Outcome);
    }
  }
  return { values, outcomes };
}

/**
 * Best interval for `feature`, restricted to a given subsample of row
 * indices (rather than the whole dataset). Reuses the exact same
 * breakpoint/Wilson-score logic as findBestInterval.
 */
function bestIntervalOnIndices(feature, indices) {
  const { values, outcomes } = extractFeatureOutcomePairsForIndices(feature, indices);
  return findBestInterval(values, outcomes);
}

/**
 * Greedy forward search: at each step, tries every not-yet-used feature's
 * best interval *on the sample already narrowed by prior steps*, keeps
 * whichever single addition raises the Wilson score the most, and stops
 * as soon as no remaining feature can improve it (or none reaches
 * MIN_INTERVAL_N). This is a heuristic, not an exhaustive search over all
 * combinations — that search space is computationally intractable.
 */
function computeGreedyBestCombination(features) {
  let currentIndices = setupsData.map((_, i) => i);
  let remaining = features.slice();

  const initCounts = countOutcomesForIndices(currentIndices);
  let currentScore = wilsonLowerBound(initCounts.nWin, initCounts.nTotal);
  const steps = [{ step: 0, feature: null, interval: null, score: currentScore, ...initCounts }];

  while (remaining.length > 0) {
    let bestCandidate = null;
    for (let i = 0; i < remaining.length; i++) {
      const f = remaining[i];
      const candidateBest = bestIntervalOnIndices(f, currentIndices);
      if (!candidateBest) continue;
      if (!bestCandidate || candidateBest.score > bestCandidate.interval.score) {
        bestCandidate = { feature: f, interval: candidateBest };
      }
    }

    if (!bestCandidate || bestCandidate.interval.score <= currentScore) break;

    const { feature, interval } = bestCandidate;
    currentIndices = currentIndices.filter((i) => {
      const v = setupsData[i][feature];
      return Number.isFinite(v) && v >= interval.lo && v <= interval.hi;
    });
    currentScore = interval.score;
    remaining = remaining.filter((f) => f !== feature);

    const counts = countOutcomesForIndices(currentIndices);
    steps.push({ step: steps.length, feature, interval, score: currentScore, ...counts });
  }

  return {
    steps,
    finalIndices: currentIndices,
    final: steps[steps.length - 1],
    featuresUsed: steps.length - 1,
    featuresUnused: remaining,
  };
}
