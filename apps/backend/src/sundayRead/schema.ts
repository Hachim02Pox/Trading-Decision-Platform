export const SUNDAY_JOBS = [
  "weekly_recap",
  "family_1_fed",
  "family_2_rates",
  "family_3_usd",
  "family_4_macro",
  "family_5_flows",
  "family_6_structural",
] as const;
export type SundayJob = (typeof SUNDAY_JOBS)[number];
export type EvidenceStatus = "ANSWERED" | "PARTIAL" | "UNKNOWN";
export type NodeStatus =
  "CONFIRMED" | "WATCH" | "PENDING" | "UNKNOWN" | "CONTRADICTED";
export type TerminalOutcome = "BULLISH" | "BEARISH" | "NO_EDGE" | "UNRESOLVED";

export interface Source {
  source_id: string;
  title: string;
  publisher: string | null;
  author: string | null;
  published_at: string | null;
  url: string;
  ultimate_origin: string | null;
  syndication_notes: string | null;
  retrieved_at: string;
  provider: string;
}
export interface Evidence {
  id: string;
  family: SundayJob;
  owner: string;
  statement: string;
  value: string | number | null;
  unit: string | null;
  as_of: string | null;
  measurement_window: string | null;
  status: EvidenceStatus;
  type: "EVENT_FACT" | "STATE" | "REPORTED_LINK";
  epistemic_status:
    | "OBSERVED"
    | "DECLARED"
    | "PUBLISHED"
    | "ESTIMATED"
    | "INFERRED"
    | "CALCULATED"
    | "QUALITATIVE"
    | "UNKNOWN";
  change_status: string;
  source_refs: string[];
  reported_link_type:
    "REACTION_TO_EVENT" | "ANTICIPATION_AHEAD_OF_EVENT" | "OTHER" | "UNCLEAR";
  notes: string;
}
export interface EvidenceDocument {
  job: SundayJob;
  status: "SUCCEEDED" | "PARTIAL" | "FAILED";
  evidence: Evidence[];
  sources: Source[];
  provider_metadata?: Record<string, unknown>;
}
export interface ScenarioNode {
  id: string;
  label: string;
  description: string;
  type:
    | "FACT"
    | "STATE"
    | "DRIVER"
    | "TRANSMISSION"
    | "CATALYST"
    | "CONDITION"
    | "POSITIONING"
    | "FUNDING"
    | "OPTIONS"
    | "ASYMMETRY_GATE"
    | "TERMINAL";
  status: NodeStatus;
  evidence_refs: string[];
  terminal_outcome?: TerminalOutcome;
  primary_value?: string;
  as_of?: string;
  measurement_window?: string;
  family_refs?: SundayJob[];
  owner?: string;
  change?: string;
  role_in_story?: string;
  contradictions?: string[];
  trigger_condition?: string;
  evidence_gap?: string;
}
export interface ScenarioExplanation {
  id: string;
  title: string;
  summary: string;
  meaning: string;
  waits_for: string[];
  invalidations: string[];
  branch_node_ids: string[];
}
export interface FinalRead {
  meta: {
    run_id: string;
    week_of: string;
    generated_at: string;
    data_mode: "FIXTURE" | "REAL";
    status: "COMPLETE" | "PARTIAL";
    as_of?: string;
    gold_price_change?: string;
  };
  executive_narrative: string;
  what_changed_this_week?: string[];
  qualitative_confidence?:
    | "CLEAR"
    | "LIKELY"
    | "PLAUSIBLE"
    | "MIXED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNKNOWN";
  competing_hypotheses?: {
    id: string;
    thesis: string;
    evidence_for: string[];
    evidence_against: string[];
    status: string;
  }[];
  cross_asset_reality_test?: {
    summary: string;
    matching_hypothesis_ids: string[];
    conflicting_observations: string[];
  };
  dominant_driver?: string;
  transmission_chains?: string[];
  late?: {
    status: "EARLY" | "BALANCED" | "CROWDED" | "LATE" | "UNKNOWN";
    reason: string;
  };
  event_expiry?: { expires_at: string | null; reason: string | null };
  contexts: Record<
    "tactical" | "medium" | "structural",
    {
      orientation: "BULLISH" | "BEARISH" | "MIXED" | "UNCLEAR";
      why: string;
      evidence_refs: string[];
      competing_thesis: string;
      invalidation: string;
    }
  >;
  priced_in: {
    already_priced: string[];
    surprise_candidates: {
      baseline: string;
      surprise_condition: string;
      first_channel: string;
      branch_refs: string[];
    }[];
    status: "KNOWN" | "PARTIAL" | "UNKNOWN";
  };
  scenario_tree: {
    nodes: ScenarioNode[];
    edges: {
      id?: string;
      from: string;
      to: string;
      label?: string;
      status?: NodeStatus;
    }[];
  };
  scenario_explanations: ScenarioExplanation[];
  asymmetry: {
    summary: string;
    opportunity: "EARLY" | "BALANCED" | "CROWDED" | "LATE" | "UNKNOWN";
    edge: "BULLISH" | "BEARISH" | "NO_EDGE" | "UNKNOWN";
  };
  catalysts: {
    event: string;
    date_time: string | null;
    expectation: string;
    question: string;
    branch_refs: string[];
    tier: "TIER_1" | "TIER_2";
  }[];
  invalidations: string[];
  contradictions: string[];
  anomalies: string[];
  unknowns: string[];
  weekly_timeline: {
    date: string;
    price_fact: string;
    events: string[];
    cross_asset_move: string;
    reported_attribution: string;
  }[];
  evidence: Evidence[];
  sources: Source[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
export function validateEvidenceDocument(value: unknown): string[] {
  if (!isObject(value)) return ["Evidence document must be an object."];
  const errors: string[] = [];
  if (!SUNDAY_JOBS.includes(value.job as SundayJob))
    errors.push("Invalid evidence job.");
  if (!Array.isArray(value.evidence)) errors.push("evidence must be an array.");
  else
    value.evidence.forEach((item, index) => {
      if (
        !isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.statement !== "string" ||
        !["ANSWERED", "PARTIAL", "UNKNOWN"].includes(String(item.status))
      )
        errors.push(`Invalid evidence item ${index}.`);
    });
  if (!Array.isArray(value.sources)) errors.push("sources must be an array.");
  return errors;
}
export function validateFinalRead(value: unknown): string[] {
  if (!isObject(value)) return ["Final output must be an object."];
  const errors: string[] = [];
  for (const key of [
    "meta",
    "executive_narrative",
    "contexts",
    "priced_in",
    "scenario_tree",
    "scenario_explanations",
    "asymmetry",
    "catalysts",
    "invalidations",
    "contradictions",
    "anomalies",
    "unknowns",
    "weekly_timeline",
    "evidence",
    "sources",
  ])
    if (!(key in value)) errors.push(`Missing ${key}.`);
  const explanations = value.scenario_explanations;
  if (!Array.isArray(explanations))
    errors.push("scenario_explanations must be an array.");
  else
    explanations.forEach((item, index) => {
      if (
        !isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.title !== "string" ||
        typeof item.summary !== "string" ||
        typeof item.meaning !== "string" ||
        !Array.isArray(item.waits_for) ||
        !Array.isArray(item.invalidations) ||
        !Array.isArray(item.branch_node_ids)
      )
        errors.push(`Invalid scenario explanation ${index}.`);
    });
  const tree = value.scenario_tree;
  if (
    !isObject(tree) ||
    !Array.isArray(tree.nodes) ||
    !Array.isArray(tree.edges)
  )
    return [...errors, "scenario_tree must contain nodes and edges."];
  const nodes = tree.nodes as Record<string, unknown>[];
  const edges = tree.edges as Record<string, unknown>[];
  const byId = new Map(
    nodes
      .filter((node) => typeof node.id === "string")
      .map((node) => [node.id as string, node]),
  );
  for (const node of nodes) {
    if (
      node.type === "TERMINAL" &&
      ["BULLISH", "BEARISH"].includes(String(node.terminal_outcome))
    ) {
      let cursor = node.id as string;
      const seen = new Set<string>();
      let gated = false;
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor);
        const parent = edges.find((edge) => edge.to === cursor)?.from;
        if (typeof parent !== "string") break;
        if (byId.get(parent)?.type === "ASYMMETRY_GATE") {
          gated = true;
          break;
        }
        cursor = parent;
      }
      if (!gated)
        errors.push(
          `Directional terminal ${String(node.id)} must follow an asymmetry gate.`,
        );
    }
  }
  return errors;
}

export function createFixtureFinalRead(): FinalRead {
  const now = new Date().toISOString();
  const source: Source = {
    source_id: "fixture-wgc",
    title: "Fixture-only evidence",
    publisher: "Fixture",
    author: null,
    published_at: now,
    url: "https://example.invalid/fixture",
    ultimate_origin: null,
    syndication_notes: "DEMO only.",
    retrieved_at: now,
    provider: "fixture",
  };
  const evidence: Evidence = {
    id: "fixture-weekly",
    family: "weekly_recap",
    owner: "fixture",
    statement: "DEMO evidence only — no real market fact.",
    value: null,
    unit: null,
    as_of: now,
    measurement_window: "fixture",
    status: "PARTIAL",
    type: "STATE",
    epistemic_status: "QUALITATIVE",
    change_status: "FIXTURE",
    source_refs: [source.source_id],
    reported_link_type: "UNCLEAR",
    notes: "End-to-end visual test only.",
  };
  const node = (
    id: string,
    label: string,
    type: ScenarioNode["type"],
    status: NodeStatus,
    description: string,
    extras: Partial<ScenarioNode> = {},
  ): ScenarioNode => ({
    id,
    label,
    type,
    status,
    description,
    evidence_refs: [evidence.id],
    owner: "fixture",
    family_refs: ["weekly_recap"],
    ...extras,
  });
  return {
    meta: {
      run_id: "fixture-2026-09-12",
      week_of: "2026-09-07",
      generated_at: now,
      data_mode: "FIXTURE",
      status: "PARTIAL",
      as_of: "DEMO / no market timestamp",
    },
    executive_narrative:
      "DEMO / FIXTURE — Cette narration multi-paragraphe vérifie le rendu pédagogique sans constituer une analyse réelle. Les chemins ne représentent ni prix ni causalité observée.\n\nLe lecteur voit une souche commune, deux conditions alternatives et les portes d’asymétrie qui empêchent toute conclusion automatique.",
    what_changed_this_week: [
      "DEMO: branchement dynamique activé",
      "DEMO: preuves volontairement inconnues",
    ],
    qualitative_confidence: "INSUFFICIENT_EVIDENCE",
    dominant_driver: "DEMO: aucune lecture de marché réelle",
    transmission_chains: [
      "Fixture state → catalyst → conditional transmission → asymmetry",
    ],
    competing_hypotheses: [
      {
        id: "soft",
        thesis: "DEMO: condition A",
        evidence_for: [evidence.id],
        evidence_against: ["Aucune donnée réelle"],
        status: "PENDING",
      },
      {
        id: "hot",
        thesis: "DEMO: condition B",
        evidence_for: [evidence.id],
        evidence_against: ["Aucune donnée réelle"],
        status: "PENDING",
      },
    ],
    cross_asset_reality_test: {
      summary: "DEMO: aucun cross-asset observé.",
      matching_hypothesis_ids: [],
      conflicting_observations: ["Données absentes par conception."],
    },
    late: { status: "UNKNOWN", reason: "Fixture sans positionnement réel." },
    event_expiry: { expires_at: null, reason: "DEMO" },
    contexts: {
      tactical: {
        orientation: "UNCLEAR",
        why: "Fixture sans conclusion réelle.",
        evidence_refs: [evidence.id],
        competing_thesis: "Aucune thèse réelle.",
        invalidation: "Recherche réelle validée.",
      },
      medium: {
        orientation: "MIXED",
        why: "Démonstration du rendu.",
        evidence_refs: [evidence.id],
        competing_thesis: "Données insuffisantes.",
        invalidation: "Recherche réelle validée.",
      },
      structural: {
        orientation: "UNCLEAR",
        why: "Démonstration du rendu.",
        evidence_refs: [evidence.id],
        competing_thesis: "Aucune donnée structurelle.",
        invalidation: "Recherche réelle validée.",
      },
    },
    priced_in: {
      already_priced: ["UNKNOWN / DEMO"],
      surprise_candidates: [
        {
          baseline: "DEMO",
          surprise_condition: "Condition A ou B",
          first_channel: "Transmission explicitement libellée",
          branch_refs: ["soft-condition", "hot-condition"],
        },
      ],
      status: "UNKNOWN",
    },
    scenario_tree: {
      nodes: [
        node(
          "state",
          "CURRENT STATE / DEMO",
          "STATE",
          "CONFIRMED",
          "Souche commune de démonstration.",
          { primary_value: "FIXTURE ONLY", as_of: "DEMO" },
        ),
        node(
          "driver",
          "UNRESOLVED DRIVER",
          "DRIVER",
          "WATCH",
          "Le facteur dominant n’est pas établi.",
          { primary_value: "UNKNOWN" },
        ),
        node(
          "catalyst",
          "NEXT CATALYST",
          "CATALYST",
          "PENDING",
          "L’événement futur sépare les branches.",
          { trigger_condition: "DEMO condition only" },
        ),
        node(
          "soft-condition",
          "CONDITION A",
          "CONDITION",
          "PENDING",
          "Première branche de démonstration.",
        ),
        node(
          "soft-flow",
          "POSITIONING INPUT",
          "POSITIONING",
          "UNKNOWN",
          "Les données de positionnement manquent volontairement.",
          { evidence_gap: "DEMO: no COT / ETF evidence" },
        ),
        node(
          "soft-gate",
          "ASYMMETRY / EDGE",
          "ASYMMETRY_GATE",
          "WATCH",
          "La direction ne suffit pas à établir une opportunité.",
        ),
        node(
          "soft-terminal",
          "NO EDGE",
          "TERMINAL",
          "CONFIRMED",
          "Démonstration d’une sortie neutre.",
          { terminal_outcome: "NO_EDGE" },
        ),
        node(
          "hot-condition",
          "CONDITION B",
          "CONDITION",
          "PENDING",
          "Seconde branche de démonstration.",
        ),
        node(
          "hot-funding",
          "FUNDING / OPTIONS",
          "FUNDING",
          "UNKNOWN",
          "Le financement et les options ne sont pas renseignés.",
        ),
        node(
          "hot-gate",
          "ASYMMETRY / EDGE",
          "ASYMMETRY_GATE",
          "WATCH",
          "Porte obligatoire avant toute conclusion directionnelle.",
        ),
        node(
          "hot-terminal",
          "BEARISH",
          "TERMINAL",
          "WATCH",
          "Terminal conditionnel de démonstration.",
          { terminal_outcome: "BEARISH" },
        ),
        node(
          "bull-gate",
          "ASYMMETRY / EDGE",
          "ASYMMETRY_GATE",
          "PENDING",
          "Branche supplémentaire pour tester un terminal bullish.",
        ),
        node(
          "bull-terminal",
          "BULLISH",
          "TERMINAL",
          "PENDING",
          "Terminal conditionnel de démonstration.",
          { terminal_outcome: "BULLISH" },
        ),
      ],
      edges: [
        { id: "e1", from: "state", to: "driver", label: "sets context" },
        {
          id: "e2",
          from: "driver",
          to: "catalyst",
          label: "awaits resolution",
        },
        {
          id: "e3",
          from: "catalyst",
          to: "soft-condition",
          label: "condition A",
        },
        {
          id: "e4",
          from: "soft-condition",
          to: "soft-flow",
          label: "requires flows",
        },
        { id: "e5", from: "soft-flow", to: "soft-gate", label: "tests edge" },
        {
          id: "e6",
          from: "soft-gate",
          to: "soft-terminal",
          label: "no asymmetry",
        },
        {
          id: "e7",
          from: "catalyst",
          to: "hot-condition",
          label: "condition B",
        },
        {
          id: "e8",
          from: "hot-condition",
          to: "hot-funding",
          label: "transmits through",
        },
        { id: "e9", from: "hot-funding", to: "hot-gate", label: "tests edge" },
        {
          id: "e10",
          from: "hot-gate",
          to: "hot-terminal",
          label: "conditional outcome",
        },
        {
          id: "e11",
          from: "soft-condition",
          to: "bull-gate",
          label: "alternative confirmation",
        },
        {
          id: "e12",
          from: "bull-gate",
          to: "bull-terminal",
          label: "conditional outcome",
        },
      ],
    },
    scenario_explanations: [
      {
        id: "demo-no-edge",
        title: "CONDITION A / NO EDGE",
        summary: "DEMO: la branche se termine sans asymétrie exploitable.",
        meaning:
          "DEMO: une direction possible ne constitue pas à elle seule une décision.",
        waits_for: ["Données réelles de flux et de positionnement."],
        invalidations: ["Preuve réelle d’une asymétrie mesurable."],
        branch_node_ids: [
          "soft-condition",
          "soft-flow",
          "soft-gate",
          "soft-terminal",
        ],
      },
      {
        id: "demo-bearish",
        title: "CONDITION B / BEARISH",
        summary: "DEMO: la branche baissière reste entièrement conditionnelle.",
        meaning:
          "DEMO: le terminal ne devient lisible qu’après la porte d’asymétrie.",
        waits_for: ["Données réelles de financement et d’options."],
        invalidations: [
          "Échec de la condition B ou porte d’asymétrie non validée.",
        ],
        branch_node_ids: [
          "hot-condition",
          "hot-funding",
          "hot-gate",
          "hot-terminal",
        ],
      },
      {
        id: "demo-bullish",
        title: "CONDITION A / BULLISH",
        summary:
          "DEMO: l’alternative haussière exige une confirmation distincte.",
        meaning:
          "DEMO: un terminal haussier est une fin de branche, pas une prédiction automatique.",
        waits_for: ["Confirmation alternative et porte d’asymétrie."],
        invalidations: ["Absence de confirmation ou asymétrie défavorable."],
        branch_node_ids: ["soft-condition", "bull-gate", "bull-terminal"],
      },
    ],
    asymmetry: {
      summary:
        "DEMO: les portes d’asymétrie restent visibles avant chaque terminal.",
      opportunity: "UNKNOWN",
      edge: "NO_EDGE",
    },
    catalysts: [
      {
        event: "Fixture validation",
        date_time: null,
        expectation: "UNKNOWN",
        question: "Le renderer dynamique reste-t-il lisible ?",
        branch_refs: ["catalyst"],
        tier: "TIER_1",
      },
    ],
    invalidations: ["Fixture non utilisable comme analyse."],
    contradictions: ["Preuves réelles absentes."],
    anomalies: ["Aucune."],
    unknowns: ["Données de marché, COT, ETF, options et funding."],
    weekly_timeline: [
      {
        date: "FIXTURE",
        price_fact: "Aucun prix réel.",
        events: ["Fixture pipeline"],
        cross_asset_move: "UNKNOWN",
        reported_attribution: "Fixture uniquement.",
      },
    ],
    evidence: [evidence],
    sources: [source],
  };
}
