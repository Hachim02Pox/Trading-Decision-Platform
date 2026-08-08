// UI orchestration: reads setupsData (data.js), computes stats (stats.js),
// draws charts (charts.js), and wires the sidebar/tabs interaction.
// No file import, no network call, no page reload.

const FEATURES = [
  "volume_ratio",
  "delta_intensity_ratio",
  "delta_direction_ratio",
  "delta_slope_ratio",
  "delta_acceleration",
  "poc_volume_ratio",
  "poc_migration_ratio",
  "poc_delta_ratio",
  "poc_bid_ask_imbalance",
  "poc_position_migration",
  "recent_max_buy_stack",
  "recent_buy_stack_position",
  "recent_max_sell_stack",
  "recent_sell_stack_position",
  "baseline_volume_med",
  "baseline_abs_delta_med",
];

const FEATURE_LABELS = {
  volume_ratio: "Volume ratio",
  delta_intensity_ratio: "Delta intensity ratio",
  delta_direction_ratio: "Delta direction ratio",
  delta_slope_ratio: "Delta slope ratio",
  delta_acceleration: "Delta acceleration",
  poc_volume_ratio: "POC volume ratio",
  poc_migration_ratio: "POC migration ratio",
  poc_delta_ratio: "POC delta ratio",
  poc_bid_ask_imbalance: "POC bid/ask imbalance",
  poc_position_migration: "POC position migration",
  recent_max_buy_stack: "Recent max buy stack",
  recent_buy_stack_position: "Recent buy stack position",
  recent_max_sell_stack: "Recent max sell stack",
  recent_sell_stack_position: "Recent sell stack position",
  baseline_volume_med: "Baseline volume (médiane)",
  baseline_abs_delta_med: "Baseline |delta| (médiane)",
};

const GLOSSARY = {
  median: "Valeur qui sépare l'échantillon trié en deux moitiés égales.",
  percentile: "Valeur en dessous de laquelle se situe un pourcentage donné des observations.",
  stddev: "Mesure de la dispersion des valeurs autour de la moyenne (écart-type d'échantillon).",
  iqr: "Écart interquartile (P75 − P25), utilisé pour repérer les valeurs atypiques.",
  outlier: "Valeur atypique : en dehors de [P25 − 1,5×IQR, P75 + 1,5×IQR]. Reste incluse dans tous les calculs.",
  wilson: "Borne basse de l'intervalle de confiance de Wilson à 95 %. Pénalise mathématiquement les petits échantillons, contrairement au ratio brut.",
};

const COLORS = {
  base: "#38bdf8",
  WIN: "#4ade80",
  LOSS: "#f87171",
  LONG: "#60a5fa",
  SHORT: "#fbbf24",
};

const COMPARISONS = {
  outcome: { key: "Outcome", groups: ["WIN", "LOSS"], tabLabel: "WIN vs LOSS" },
  direction: { key: "Direction", groups: ["LONG", "SHORT"], tabLabel: "LONG vs SHORT" },
};

const state = {
  feature: FEATURES[0],
  tab: "distribution",
  view: "explorer",
};

// Cache of per-feature global (all groups) valid values / range, computed once.
const featureCache = {};

function getFeatureValues(feature) {
  if (!featureCache[feature]) {
    const raw = setupsData.map((d) => d[feature]);
    const valid = toValidNumbers(raw);
    featureCache[feature] = {
      raw,
      valid,
      min: min(valid),
      max: max(valid),
    };
  }
  return featureCache[feature];
}

function getGroupValues(feature, groupKey, groupValue) {
  const raw = setupsData
    .filter((d) => d[groupKey] === groupValue)
    .map((d) => d[feature]);
  return toValidNumbers(raw);
}

function term(label, glossaryKey) {
  const def = GLOSSARY[glossaryKey] || "";
  return `<span class="term" title="${def.replace(/"/g, "&quot;")}">${label}</span>`;
}

function init() {
  renderSidebar();
  renderTabs();
  document.getElementById("tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    selectTab(btn.dataset.tab);
  });
  document.getElementById("app-view-switch").addEventListener("click", (e) => {
    const btn = e.target.closest(".view-btn");
    if (!btn) return;
    selectView(btn.dataset.view);
  });
  renderAll();
}

function selectView(view) {
  state.view = view;
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  document.getElementById("view-explorer").hidden = view !== "explorer";
  document.getElementById("view-crossing").hidden = view !== "crossing";
  document.getElementById("view-combo").hidden = view !== "combo";
  document.getElementById("view-signal").hidden = view !== "signal";
  if (view === "crossing") {
    renderCrossingView();
  } else if (view === "combo") {
    renderComboView();
  } else if (view === "signal") {
    renderSignalOverviewView();
  }
}

function renderSidebar() {
  const list = document.getElementById("feature-list");
  list.innerHTML = "";
  FEATURES.forEach((feature) => {
    const info = getFeatureValues(feature);
    const li = document.createElement("li");
    li.className = "feature-item";
    li.dataset.feature = feature;
    li.innerHTML = `
      <div class="feature-item-name">${FEATURE_LABELS[feature] || feature}</div>
      <div class="feature-item-range">min ${formatNum(info.min, 3)} · max ${formatNum(info.max, 3)}</div>
    `;
    li.addEventListener("click", () => selectFeature(feature));
    list.appendChild(li);
  });
}

function renderTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.tab);
  });
}

function selectFeature(feature) {
  state.feature = feature;
  renderAll();
}

function selectTab(tab) {
  state.tab = tab;
  renderTabs();
  renderTabContent();
}

function renderAll() {
  document.querySelectorAll(".feature-item").forEach((li) => {
    li.classList.toggle("selected", li.dataset.feature === state.feature);
  });
  document.getElementById("feature-title").textContent = FEATURE_LABELS[state.feature] || state.feature;
  renderKpis();
  renderTabs();
  renderTabContent();
}

function renderKpis() {
  const info = getFeatureValues(state.feature);
  const stats = describe(info.valid);
  const container = document.getElementById("kpi-row");
  container.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">n</div>
      <div class="kpi-value">${stats.n}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${term("Médiane", "median")}</div>
      <div class="kpi-value">${formatNum(stats.median)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Moyenne</div>
      <div class="kpi-value">${formatNum(stats.mean)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">${term("Outliers", "outlier")}</div>
      <div class="kpi-value">${stats.outlierCount}</div>
    </div>
  `;
}

function renderTabContent() {
  const container = document.getElementById("tab-content");
  container.innerHTML = "";
  if (state.tab === "distribution") {
    renderDistributionTab(container);
  } else {
    renderComparisonTab(container, COMPARISONS[state.tab]);
  }
}

function renderDistributionTab(container) {
  const info = getFeatureValues(state.feature);
  const stats = describe(info.valid);
  const p1 = stats.percentiles[0.01];
  const p99 = stats.percentiles[0.99];

  container.innerHTML = `
    <div class="panel">
      <div class="chart-container" id="dist-chart"></div>
      <p class="chart-note">Axe visuel cadré sur P1–P99 ; 100 % des données sont utilisées dans les calculs et incluses dans le graphique.</p>
      <p class="explain-text">Cet histogramme montre comment les valeurs de cette feature sont réparties sur l'ensemble des ${stats.n} observations valides. Chaque barre représente le nombre de setups dont la valeur tombe dans un petit intervalle.</p>
    </div>

    <div class="panel">
      <h3>Percentiles</h3>
      <p class="explain-text">Un ${term("percentile", "percentile")} Px est la valeur en dessous de laquelle se trouvent x % des observations de cet échantillon.</p>
      <table class="stat-table">
        <thead><tr><th>P1</th><th>P10</th><th>P25</th><th>P50 (médiane)</th><th>P75</th><th>P90</th><th>P99</th></tr></thead>
        <tbody>
          <tr>
            <td>${formatNum(stats.percentiles[0.01])}</td>
            <td>${formatNum(stats.percentiles[0.1])}</td>
            <td>${formatNum(stats.percentiles[0.25])}</td>
            <td>${formatNum(stats.percentiles[0.5])}</td>
            <td>${formatNum(stats.percentiles[0.75])}</td>
            <td>${formatNum(stats.percentiles[0.9])}</td>
            <td>${formatNum(stats.percentiles[0.99])}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="panel">
      <h3>Statistiques descriptives</h3>
      <table class="stat-table">
        <thead>
          <tr>
            <th>n</th><th>Moyenne</th><th>${term("Médiane", "median")}</th>
            <th>${term("Écart-type", "stddev")}</th><th>Min</th><th>Max</th>
            <th>${term("Outliers", "outlier")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${stats.n}</td>
            <td>${formatNum(stats.mean)}</td>
            <td>${formatNum(stats.median)}</td>
            <td>${formatNum(stats.stdDev)}</td>
            <td>${formatNum(stats.min)}</td>
            <td>${formatNum(stats.max)}</td>
            <td>${stats.outlierCount}</td>
          </tr>
        </tbody>
      </table>
      ${renderOutlierList(info.valid)}
    </div>
  `;

  renderHistogram(document.getElementById("dist-chart"), {
    series: [{ values: info.valid, label: FEATURE_LABELS[state.feature] || state.feature, color: COLORS.base }],
    p1,
    p99,
    markOutliers: true,
  });
}

function renderOutlierList(values) {
  const info = iqrOutliers(values);
  if (info.count === 0) return `<p class="explain-text">Aucun outlier détecté (méthode IQR × 1,5) sur cet échantillon.</p>`;
  if (info.count > 12) {
    return `<p class="explain-text">${info.count} ${term("outliers", "outlier")} détectés (méthode IQR × 1,5). Voir les marques sous l'histogramme ci-dessus.</p>`;
  }
  const sorted = info.outliers.slice().sort((a, b) => a - b);
  return `<p class="explain-text">${term("Outliers", "outlier")} détectés (méthode IQR × 1,5) : ${sorted.map((v) => formatNum(v, 4)).join(", ")}.</p>`;
}

function renderComparisonTab(container, config) {
  const feature = state.feature;
  const info = getFeatureValues(feature);
  const groupA = config.groups[0];
  const groupB = config.groups[1];
  const valuesA = getGroupValues(feature, config.key, groupA);
  const valuesB = getGroupValues(feature, config.key, groupB);
  const statsA = describe(valuesA);
  const statsB = describe(valuesB);
  const colorA = COLORS[groupA];
  const colorB = COLORS[groupB];
  const isOutcomeTab = config.key === "Outcome";
  const bestInterval = isOutcomeTab ? getBestIntervalForFeature(feature) : null;

  container.innerHTML = `
    <div class="panel">
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-swatch" style="background:${colorA}"></span>${groupA} (n=${statsA.n})</span>
        <span class="legend-item"><span class="legend-swatch" style="background:${colorB}"></span>${groupB} (n=${statsB.n})</span>
      </div>
      <div class="chart-container" id="cmp-hist-chart"></div>
      <p class="chart-note">Axe visuel cadré sur P1–P99 de l'ensemble des données ; 100 % des données de chaque groupe sont utilisées dans les calculs.</p>
      <p class="explain-text">Histogrammes superposés (transparence) de la feature pour les deux groupes, afin de comparer visuellement leur répartition.</p>
    </div>

    <div class="panel">
      <h3>Boxplots</h3>
      <p class="explain-text">Chaque boîte va du premier au troisième quartile (${term("IQR", "iqr")} = étendue de la boîte), la ligne centrale est la ${term("médiane", "median")}. Les points isolés sont des ${term("outliers", "outlier")}.</p>
      <div class="chart-container" id="cmp-box-chart"></div>
    </div>

    <div class="panel">
      <h3>Tableau comparatif</h3>
      <table class="stat-table">
        <thead>
          <tr><th>Groupe</th><th>n</th><th>Moyenne</th><th>${term("Médiane", "median")}</th><th>${term("Écart-type", "stddev")}</th><th>${term("Outliers", "outlier")}</th></tr>
        </thead>
        <tbody>
          <tr><td>${groupA}</td><td>${statsA.n}</td><td>${formatNum(statsA.mean)}</td><td>${formatNum(statsA.median)}</td><td>${formatNum(statsA.stdDev)}</td><td>${statsA.outlierCount}</td></tr>
          <tr><td>${groupB}</td><td>${statsB.n}</td><td>${formatNum(statsB.mean)}</td><td>${formatNum(statsB.median)}</td><td>${formatNum(statsB.stdDev)}</td><td>${statsB.outlierCount}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="panel">
      <p class="synthesis-text">${buildSynthesisSentence(groupA, statsA, groupB, statsB)}</p>
    </div>

    ${isOutcomeTab ? `<div class="panel"><h3>Intervalle au meilleur ratio observé</h3>${renderBestIntervalContent(bestInterval)}</div>` : ""}
  `;

  const p1 = describe(info.valid).percentiles[0.01];
  const p99 = describe(info.valid).percentiles[0.99];

  renderHistogram(document.getElementById("cmp-hist-chart"), {
    series: [
      { values: valuesA, label: groupA, color: colorA },
      { values: valuesB, label: groupB, color: colorB },
    ],
    p1,
    p99,
    markOutliers: false,
    highlightRange: bestInterval ? [bestInterval.lo, bestInterval.hi] : null,
  });

  renderBoxplot(document.getElementById("cmp-box-chart"), {
    groups: [
      { label: groupA, values: valuesA, color: colorA },
      { label: groupB, values: valuesB, color: colorB },
    ],
    domain: [info.min, info.max],
  });
}

function buildSynthesisSentence(groupA, statsA, groupB, statsB) {
  if (statsA.n === 0 && statsB.n === 0) {
    return `Aucune donnée valide disponible pour ${groupA} ou ${groupB} sur cette feature (n=0 des deux côtés) ; aucune comparaison possible.`;
  }
  if (statsA.n === 0 || statsB.n === 0) {
    const empty = statsA.n === 0 ? groupA : groupB;
    return `Le groupe ${empty} ne contient aucune observation valide pour cette feature (n=0) ; aucune comparaison n'est possible.`;
  }
  return `Dans cet échantillon, la médiane du groupe ${groupA} est de ${formatNum(statsA.median)} contre ${formatNum(statsB.median)} pour ${groupB} (n=${statsA.n} vs n=${statsB.n}).`;
}

function renderBestIntervalContent(best) {
  if (!best) {
    return `<p class="explain-text">Aucun intervalle suffisamment représenté n'a pu être identifié pour cette feature.</p>`;
  }
  return `
    <div class="interval-summary">
      <div class="interval-stat"><span class="interval-stat-label">Plage</span><span class="interval-stat-value">[${formatNum(best.lo, 4)} — ${formatNum(best.hi, 4)}]</span></div>
      <div class="interval-stat"><span class="interval-stat-label">n_WIN</span><span class="interval-stat-value">${best.nWin}</span></div>
      <div class="interval-stat"><span class="interval-stat-label">n_LOSS</span><span class="interval-stat-value">${best.nLoss}</span></div>
      <div class="interval-stat"><span class="interval-stat-label">n_total</span><span class="interval-stat-value">${best.nTotal}</span></div>
      <div class="interval-stat"><span class="interval-stat-label">Ratio WIN</span><span class="interval-stat-value">${formatNum(best.ratio * 100, 1)} %</span></div>
      <div class="interval-stat"><span class="interval-stat-label">${term("Score de Wilson", "wilson")}</span><span class="interval-stat-value">${formatNum(best.score, 3)}</span></div>
    </div>
    <p class="explain-text">C'est ce score (indice de confiance), et non le ratio brut, qui a servi à choisir cet intervalle : il tient compte du nombre d'observations. La bande surlignée sur l'histogramme ci-dessus repère cet intervalle.</p>
    <p class="warning-text">Cet intervalle est celui qui présente le meilleur score observé sur cet échantillon historique (ratio ajusté au nombre d'observations). Il ne s'agit pas d'un signal validé ni d'une garantie pour de futures observations — de nombreuses combinaisons d'intervalles ont été testées, ce qui augmente le risque de tomber sur un résultat favorable par hasard.</p>
  `;
}

function renderCrossingView() {
  const container = document.getElementById("view-crossing");
  const result = computeCrossing(FEATURES);
  const final = result.final;

  const excludedNote = result.excluded.length
    ? `<p class="crossing-empty-note">Feature(s) exclue(s) du croisement, faute d'intervalle atteignant n_total ≥ 10 : ${result.excluded.map((f) => FEATURE_LABELS[f] || f).join(", ")}.</p>`
    : "";

  const finalResultHtml = final.nTotal === 0
    ? `<p class="crossing-empty-note">Aucun setup ne satisfait les ${result.ordered.length} conditions simultanément (n_total = 0).</p>`
    : `
      <div class="crossing-result-row">
        <div class="interval-stat"><span class="interval-stat-label">n_total</span><span class="interval-stat-value">${final.nTotal}</span></div>
        <div class="interval-stat"><span class="interval-stat-label">n_WIN</span><span class="interval-stat-value">${final.nWin}</span></div>
        <div class="interval-stat"><span class="interval-stat-label">n_LOSS</span><span class="interval-stat-value">${final.nLoss}</span></div>
        <div class="interval-stat"><span class="interval-stat-label">Ratio WIN</span><span class="interval-stat-value">${formatNum((final.nWin / final.nTotal) * 100, 1)} %</span></div>
      </div>
    `;

  const funnelRows = result.funnel.map((row) => {
    const featureLabel = row.feature === null
      ? "(aucune — échantillon complet)"
      : `${FEATURE_LABELS[row.feature] || row.feature}`;
    const intervalLabel = row.interval ? `[${formatNum(row.interval.lo, 4)} — ${formatNum(row.interval.hi, 4)}]` : "—";
    return `
      <tr>
        <td>${row.step}</td>
        <td>${featureLabel}</td>
        <td>${intervalLabel}</td>
        <td>${row.nTotal}</td>
        <td>${row.nWin}</td>
        <td>${row.nLoss}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="crossing-header">
      <h2>Croisement des intervalles</h2>
      <p>Combine les 16 intervalles individuellement optimisés (section précédente) — analyse séparée du reste, à haut risque de sur-ajustement. Aucune stratégie, aucune règle d'entrée.</p>
    </div>

    <div class="warning-box-strong">
      Ce résultat croise 16 intervalles déjà individuellement optimisés sur le même échantillon de 1 295 setups. Le risque de sur-ajustement est très élevé : ce chiffre reflète très probablement des coïncidences statistiques plutôt qu'un phénomène réel et reproductible. Le tableau ci-dessous montre comment l'échantillon rétrécit à mesure que les conditions s'accumulent — plus il devient petit, moins le résultat est fiable. Ceci n'est en aucun cas une stratégie, une règle d'entrée ou une recommandation.
    </div>

    <div class="panel">
      <h3>Résultat final (les ${result.ordered.length} conditions appliquées simultanément)</h3>
      ${finalResultHtml}
      ${excludedNote}
    </div>

    <div class="panel">
      <h3>Tableau entonnoir</h3>
      <p class="explain-text">Features ajoutées une par une, triées par score de Wilson décroissant (convention arbitraire parmi d'autres possibles — voir README). Chaque ligne applique en plus l'intervalle au meilleur score de la feature indiquée.</p>
      <div style="overflow-x:auto">
        <table class="funnel-table">
          <thead>
            <tr><th>Étape</th><th>Feature ajoutée</th><th>Intervalle appliqué</th><th>n restant</th><th>n_WIN</th><th>n_LOSS</th></tr>
          </thead>
          <tbody>${funnelRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderComboView() {
  const container = document.getElementById("view-combo");
  const combo = computeGreedyBestCombination(FEATURES);
  const naive = computeCrossing(FEATURES);
  const final = combo.final;
  const usedRows = combo.steps.slice(1);

  const unusedNote = combo.featuresUnused.length
    ? `<p class="crossing-empty-note">Features non retenues dans cette combinaison (aucune n'a amélioré le score au moment où elle a été testée) : ${combo.featuresUnused.map((f) => FEATURE_LABELS[f] || f).join(", ")}.</p>`
    : `<p class="crossing-empty-note">Les 16 features ont toutes été retenues par cette recherche.</p>`;

  const finalResultHtml = final.nTotal === 0
    ? `<p class="crossing-empty-note">Aucune combinaison exploitable n'a été trouvée.</p>`
    : `
      <div class="crossing-result-row">
        <div class="interval-stat"><span class="interval-stat-label">Features retenues</span><span class="interval-stat-value">${usedRows.length} / ${FEATURES.length}</span></div>
        <div class="interval-stat"><span class="interval-stat-label">n_total</span><span class="interval-stat-value">${final.nTotal}</span></div>
        <div class="interval-stat"><span class="interval-stat-label">n_WIN</span><span class="interval-stat-value">${final.nWin}</span></div>
        <div class="interval-stat"><span class="interval-stat-label">n_LOSS</span><span class="interval-stat-value">${final.nLoss}</span></div>
        <div class="interval-stat"><span class="interval-stat-label">Ratio WIN</span><span class="interval-stat-value">${formatNum((final.nWin / final.nTotal) * 100, 1)} %</span></div>
        <div class="interval-stat"><span class="interval-stat-label">${term("Score de Wilson", "wilson")}</span><span class="interval-stat-value">${formatNum(final.score, 3)}</span></div>
      </div>
    `;

  const stepsRows = combo.steps.map((row) => {
    const featureLabel = row.feature === null ? "(aucune — échantillon complet)" : (FEATURE_LABELS[row.feature] || row.feature);
    const intervalLabel = row.interval ? `[${formatNum(row.interval.lo, 4)} — ${formatNum(row.interval.hi, 4)}]` : "—";
    return `
      <tr>
        <td>${row.step}</td>
        <td>${featureLabel}</td>
        <td>${intervalLabel}</td>
        <td>${row.nTotal}</td>
        <td>${row.nWin}</td>
        <td>${row.nLoss}</td>
        <td>${formatNum(row.score, 3)}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="crossing-header">
      <h2>Meilleure combinaison observée</h2>
      <p>Cherche, parmi les 16 features, une combinaison conjointe d'intervalles qui maximise le score de Wilson de l'échantillon résultant — sans imposer que chaque feature soit prise à son propre intervalle individuellement optimal (celui affiché dans l'onglet WIN vs LOSS).</p>
    </div>

    <div class="panel">
      <h3>Méthode — recherche gloutonne, pas exhaustive</h3>
      <p class="explain-text">
        À chaque étape, pour chaque feature pas encore retenue, l'algorithme teste tous ses intervalles candidats (101 percentiles) <strong>sur l'échantillon déjà filtré par les étapes précédentes</strong> — pas sur l'échantillon complet — et retient la feature (avec son intervalle) qui améliore le plus le score de Wilson obtenu. Il s'arrête dès qu'aucune feature restante n'améliore ce score, ou si le plancher n_total ≥ 10 n'est plus atteignable pour aucune d'elles.
      </p>
      <p class="explain-text">
        C'est une recherche <strong>gloutonne</strong> (à chaque étape, le meilleur choix immédiat est retenu, sans jamais revenir en arrière), pas une recherche exhaustive : tester toutes les combinaisons possibles des intervalles des 16 features représenterait un nombre de combinaisons bien trop élevé pour être calculé. Cette méthode ne garantit donc pas de trouver LA meilleure combinaison possible parmi toutes celles imaginables — seulement une bonne combinaison trouvée par cette exploration progressive. Une autre méthode de recherche pourrait aboutir à un résultat différent.
      </p>
      <p class="explain-text">
        Pour comparaison : le croisement direct des 16 intervalles déjà individuellement optimisés (section "Croisement des intervalles") donne n_total = ${naive.final.nTotal} sur cet échantillon. La combinaison ci-dessous est différente : les intervalles retenus par feature ne sont pas forcément ceux qui sont individuellement optimaux pour cette feature prise isolément.
      </p>
    </div>

    <div class="warning-box-strong">
      Cette recherche teste un nombre de combinaisons encore plus élevé que le simple croisement des 16 intervalles individuels de la section précédente. Le risque de sur-ajustement est donc au moins aussi élevé, probablement plus : ce résultat reflète très probablement des coïncidences statistiques propres à cet échantillon historique de 1 295 setups, et non un phénomène réel ou reproductible sur de futures observations. Ceci n'est en aucun cas une stratégie, une règle d'entrée ou une recommandation — c'est le résultat d'une recherche automatique poussée à son maximum sur des données déjà observées.
    </div>

    <div class="panel">
      <h3>Résultat de la combinaison trouvée</h3>
      ${finalResultHtml}
      ${unusedNote}
    </div>

    <div class="panel">
      <h3>Construction étape par étape</h3>
      <p class="explain-text">Chaque étape ajoute la feature (et son intervalle) qui améliore le plus le score de Wilson à ce moment-là, en repartant de l'échantillon déjà filtré par les étapes précédentes — contrairement au tableau entonnoir de la section "Croisement des intervalles", l'ordre ici n'est pas fixé à l'avance, il résulte de la recherche elle-même.</p>
      <div style="overflow-x:auto">
        <table class="funnel-table">
          <thead>
            <tr><th>Étape</th><th>Feature ajoutée</th><th>Intervalle appliqué</th><th>n restant</th><th>n_WIN</th><th>n_LOSS</th><th>Score de Wilson</th></tr>
          </thead>
          <tbody>${stepsRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSignalOverviewView() {
  const container = document.getElementById("view-signal");

  const rows = FEATURES.map((feature) => {
    const valuesWin = getGroupValues(feature, "Outcome", "WIN");
    const valuesLoss = getGroupValues(feature, "Outcome", "LOSS");
    const auc = probabilityOfSuperiority(valuesWin, valuesLoss);
    const strength = auc === null ? null : Math.abs(auc - 0.5) * 2;
    return {
      feature,
      auc,
      strength,
      medianWin: median(valuesWin),
      medianLoss: median(valuesLoss),
      nWin: valuesWin.length,
      nLoss: valuesLoss.length,
    };
  });

  const ranked = rows.slice().sort((a, b) => {
    const sa = a.strength === null ? -1 : a.strength;
    const sb = b.strength === null ? -1 : b.strength;
    return sb - sa;
  });
  const top = ranked[0];

  let verdict;
  if (!top || top.strength === null) {
    verdict = "Impossible de calculer une séparation exploitable sur cet échantillon.";
  } else if (top.strength < 0.10) {
    verdict = `Sur cet échantillon, aucune feature prise isolément ne sépare les groupes WIN et LOSS de façon notable — la séparation la plus marquée observée est de ${formatNum(top.strength * 100, 1)} % (0 % = mélange total, 100 % = séparation quasi totale). C'est très proche du mélange total : à elle seule, aucune feature ne distingue clairement un WIN d'un LOSS dans cet échantillon.`;
  } else if (top.strength < 0.25) {
    verdict = `La séparation la plus marquée observée entre WIN et LOSS, feature par feature, reste faible : ${formatNum(top.strength * 100, 1)} % pour ${FEATURE_LABELS[top.feature] || top.feature} (0 % = mélange total, 100 % = séparation quasi totale).`;
  } else if (top.strength < 0.45) {
    verdict = `Une séparation modérée est observée pour ${FEATURE_LABELS[top.feature] || top.feature} (${formatNum(top.strength * 100, 1)} %), la plus marquée des 16 features prises individuellement.`;
  } else if (top.strength < 0.70) {
    verdict = `Une séparation nette est observée pour ${FEATURE_LABELS[top.feature] || top.feature} (${formatNum(top.strength * 100, 1)} %) entre les groupes WIN et LOSS de cet échantillon.`;
  } else {
    verdict = `Une séparation quasi totale est observée pour ${FEATURE_LABELS[top.feature] || top.feature} (${formatNum(top.strength * 100, 1)} %) : les valeurs WIN et LOSS de cette feature se chevauchent très peu dans cet échantillon.`;
  }

  const rowsHtml = ranked.map((r) => {
    const aucLabel = r.auc === null ? "—" : `${formatNum(r.auc * 100, 1)} %`;
    const strengthLabel = r.strength === null ? "—" : `${formatNum(r.strength * 100, 1)} %`;
    return `
      <tr>
        <td>${FEATURE_LABELS[r.feature] || r.feature}</td>
        <td>${strengthLabel}</td>
        <td>${aucLabel}</td>
        <td>${formatNum(r.medianWin)}</td>
        <td>${formatNum(r.medianLoss)}</td>
        <td>${r.nWin}</td>
        <td>${r.nLoss}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="crossing-header">
      <h2>Y a-t-il un signal dans ce dataset ?</h2>
      <p>Pour chacune des 16 features, prise isolément : à quel point les valeurs WIN et LOSS sont-elles séparées (plutôt que mélangées) dans cet échantillon ? Contrairement aux sections précédentes, il n'y a ici ni recherche d'intervalle ni combinaison testée — un seul indicateur descriptif par feature, calculé une fois.</p>
    </div>

    <div class="panel">
      <h3>Indicateur utilisé : probabilité de supériorité (statistique de Mann-Whitney)</h3>
      <p class="explain-text">
        Pour une feature donnée, on tire au hasard une valeur du groupe WIN et une valeur du groupe LOSS : dans quel pourcentage des cas la valeur WIN est-elle la plus grande ? Ce pourcentage vaut 50 % si les deux groupes sont indiscernables (mélange total), et s'approche de 0 % ou 100 % si les deux groupes sont presque totalement séparés sur cette feature (quasi-unanimité). La "force de séparation" ci-dessous est l'écart à 50 %, ramené sur une échelle de 0 % (aucune séparation) à 100 % (séparation totale), pour classer les features sans se soucier du sens de l'écart.
      </p>
      <p class="explain-text">
        C'est un indicateur purement descriptif calculé une seule fois par feature sur l'échantillon complet — il ne recherche ni seuil ni combinaison, contrairement aux sections "Croisement des intervalles" et "Meilleure combinaison observée", et il est donc beaucoup moins exposé au risque de sur-ajustement que ces dernières.
      </p>
    </div>

    <div class="panel">
      <h3>Constat sur cet échantillon</h3>
      <p class="synthesis-text">${verdict}</p>
      <p class="explain-text">Un chevauchement important entre WIN et LOSS sur une feature isolée ne signifie pas que cette feature est sans utilité en combinaison avec d'autres (voir la section "Meilleure combinaison observée") — seulement qu'elle ne sépare pas fortement les deux groupes à elle seule.</p>
    </div>

    <div class="panel">
      <h3>Détail par feature</h3>
      <p class="explain-text">Triées par force de séparation décroissante (ordre de lecture, pas un classement de "meilleure feature").</p>
      <div style="overflow-x:auto">
        <table class="funnel-table">
          <thead>
            <tr><th>Feature</th><th>Force de séparation</th><th>Probabilité de supériorité (WIN &gt; LOSS)</th><th>Médiane WIN</th><th>Médiane LOSS</th><th>n WIN</th><th>n LOSS</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", init);
