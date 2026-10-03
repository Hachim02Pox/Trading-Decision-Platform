// @ts-nocheck
// Pinned Brain da8eb64959b6c026128bde254c8d1703e419f19c: unchanged semantics; only local import suffixes adapted.
import { learningProblems, learningSections } from './learning-experience';
import { withinIntermediateWindow, weeklyDeadlineReached, authorizedLateIntermediate } from './weekly-cycle';
import { createHash } from 'node:crypto';
import { FAMILY_QUESTIONS } from './family-readout';
import { PHASE_ORDER, PREREQUISITES, REQUIRED_QUESTIONS, EXOGENOUS_CATEGORIES, canonicalSha256 } from './procedural-audit';
export const EDITORIAL_EFFECTIVE_AT = '2026-09-28T17:08:35Z';
export const JUDGMENTS = ['macro_direction', 'directional_asymmetry', 'positioning_asymmetry', 'evidence_quality', 'analysis_scope', 'fundamental_conclusion'];
export const sha256 = text => createHash('sha256').update(text).digest('hex');
const date = x => Date.parse(x);
const same = (a, b) => a === undefined || b === undefined ? a === b : canonicalSha256(a) === canonicalSha256(b);
const nyDay = iso => new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
const addDays = (d,n) => new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);

// Reader/API whitelist: never recursively expose the research document.
export function readerSections(d) {
  const sections = [];
  const add = (title, paragraphs) => sections.push({title, paragraphs: paragraphs.filter(x => typeof x === 'string' && x.trim())});
  for (const x of d.opening_thesis) add(x.title_fr, [x.body_fr]);
  add(d.decision_panel.title_fr, [`Lecture au ${d.decision_panel.as_of}. Horizon : ${d.decision_panel.horizon}.`, d.decision_panel.scope]);
  for (const x of d.decision_panel.instruments) add(x.instrument, [x.answer_fr, x.mechanism_fr, x.strongest_contradiction_fr, x.flip_fr]);
  add('Quand réexaminer cette lecture ?', [d.decision_panel.recheck_fr, `À réexaminer au plus tard le ${d.decision_panel.scheduled_expiry}.`, d.decision_panel.earlier_expiry, d.decision_panel.separate_choices_fr, d.decision_panel.limit_fr]);
  if (d.evolution_review) {
    const e=d.evolution_review; add('Depuis le dernier récap', [e.summary_fr]);
    for (const key of ['still_true','new_observations','strengthened','weakened','invalidated','exogenous_factors','unresolved','next_checks']) for (const x of e[key]) add(x.title_fr,[x.body_fr]);
    for (const x of e.judgment_changes) add('Ce qui change dans le jugement',[x.reason_fr,x.consequence_fr]);
    for (const x of e.scenario_transitions) add('Évolution du scénario',[x.explanation_fr]);
  }
  for (const x of d.six_judgments) add(x.title, [x.display,x.body]);
  add('Les horizons', Object.values(d.horizons));
  for (const x of d.calendar) add(x.event, [x.at,x.expected,x.watch]);
  for (const x of d.scenario_tree.nodes) add(x.title_fr,[x.condition_fr,x.causal_path_fr,x.observable_confirmation_fr,x.time_window_fr,x.opposing_evidence_fr,x.invalidation_fr,x.practical_interpretation_fr]);
  for (const x of d.scenario_tree.edges) add('Comment le scénario se transmet',[x.observable_condition_fr,x.causal_explanation_fr]);
  for (const f of d.family_readouts) {
    add(f.title_fr,[f.local_interpretation_fr]);
    for (const q of f.questions) add(q.question_fr,[q.answer_fr, `Observation : ${q.as_of}.`,q.missing_observation?.obstacle,q.missing_observation?.consequence_fr,q.missing_observation?.next_recovery_action_fr]);
  }
  if (d.weekly_bridge) add('Par rapport à la semaine précédente',[d.weekly_bridge.comparison_limit_fr,...d.weekly_bridge.changes,...d.weekly_bridge.surviving_conclusions,...d.weekly_bridge.resolved_expectations,...d.weekly_bridge.failed_expectations]);
  for (const x of d.chronology) add(x.date_label_fr,[x.event_fr]);
  for (const x of d.exogenous_review) add(x.category,[x.finding]);
  for (const [word,meaning] of Object.entries(d.glossary_fr)) add(word,[meaning]);
  if (d.learning_experience) sections.push(...learningSections(d.learning_experience));
  return sections;
}
export function renderEditorialMarkdown(d) {return `# ${d.title_fr}\n\n` + readerSections(d).map(s => `## ${s.title}\n\n${s.paragraphs.join('\n\n')}`).join('\n\n') + '\n';}
export function expectedEligibility(d) {
  const v=Object.fromEntries(d.six_judgments.map(x=>[x.id,x.state])),p=d.decision_panel;
  const macro=p.macro_is_clear_and_supported && p.macro_is_current ? ({BULLISH:'LONG',BEARISH:'SHORT'}[v.macro_direction]??'NEITHER') : 'NEITHER';
  return [macro, macro!=='NEITHER' && p.positioning_is_current && v.positioning_asymmetry===v.macro_direction ? macro:'NEITHER'];
}
export function editorialProblems(d, parent) {
  const p=[]; const fail=(ok,msg)=>{if(!ok)p.push(msg);};const m=d.meta,t=d.time_scope;
  fail(m.generated_at===t.generated_at && date(m.evidence_cutoff_end)===date(t.evidence_cutoff_utc) && date(t.evidence_cutoff_ny)===date(t.evidence_cutoff_utc),'metadata/cutoff parity');
  fail(date(m.evidence_cutoff_start)<=date(m.evidence_cutoff_end) && date(m.evidence_cutoff_end)<=date(m.generated_at),'cutoff chronology');
  fail(m.week_of===t.upcoming_week_start && new Date(t.upcoming_week_start).getUTCDay()===1 && t.upcoming_week_end===addDays(t.upcoming_week_start,4),'upcoming week Monday–Friday');
  fail(t.reviewed_week_start===addDays(t.upcoming_week_start,-7) && t.reviewed_week_end===addDays(t.reviewed_week_start,4) && t.market_session_cutoff===t.reviewed_week_end,'reviewed week / Friday market cutoff');
  fail(date(d.decision_panel.as_of)===date(m.evidence_cutoff_end),'decision cutoff parity');
  const unique=(xs,label)=>fail(new Set(xs).size===xs.length,`duplicate ${label}`);
  const sourceIds=d.sources.map(x=>x.id);unique(sourceIds,'sources');const sources=new Set(sourceIds);
  const requests=new Map(d.research_audit.request_log.map(x=>[x.id,x]));unique(d.research_audit.request_log.map(x=>x.id),'requests');
  for(const request of requests.values())fail(date(request.at)<=date(m.generated_at),'request after generation');
  const walk=(v,k='')=>{if(['evidence_refs','refs','current_evidence_refs'].includes(k)&&Array.isArray(v)){for(const ref of v)fail(sources.has(ref),`unresolved evidence ${ref}`);}else if(Array.isArray(v))v.forEach(x=>walk(x));else if(v&&typeof v==='object')Object.entries(v).forEach(([key,x])=>walk(x,key));};walk(d);
  for(const s of d.sources)for(const r of s.retrievals)fail(requests.has(r.request_id)&&date(r.retrieved_at_utc)<=date(m.generated_at),`source retrieval ${s.id}`);
  unique(d.family_readouts.map(f=>f.id),'families');const coverage=new Map(d.procedural_audit.question_coverage.map(q=>[q.question_id,q]));
  unique(d.procedural_audit.question_coverage.map(q=>q.question_id),'question traces');fail(coverage.size===Object.values(FAMILY_QUESTIONS).flat().length,'32 question traces required');
  for(const [id,wanted] of Object.entries(FAMILY_QUESTIONS)){
    const f=d.family_readouts.find(f=>f.id===id);fail(!!f,`missing ${id}`);if(!f)continue;
    fail(same(f.questions.map(q=>q.id).sort(),[...wanted].sort()),`${id} canonical question coverage`);
    for(const q of f.questions){
      fail(q.family===id,`question family ${q.id}`);fail(q.status==='ANSWERED'?q.missing_observation===null&&q.evidence_refs.length>0:!!q.missing_observation,`missing evidence diagnosis ${q.id}`);
      const c=coverage.get(q.id);const phase=d.procedural_audit.phases[id];fail(date(c?.checked_at)>=date(phase.started_at)&&date(c?.checked_at)<=date(phase.completed_at),`question checked outside phase ${q.id}`);fail(c?.outcome===q.status&&date(c?.checked_at)<=date(m.generated_at),`question trace ${q.id}`);
      for(const ref of c?.request_refs??[])fail(requests.has(ref),`question request ${ref}`);
      if(q.status==='ANSWERED')fail((c?.request_refs.length??0)>0,`answered question needs retrieval ${q.id}`);
      for(const a of q.missing_observation?.provider_attempts??[])fail(requests.has(a.request_id)&&date(a.retrieved_at_utc)<=date(m.generated_at),`recovery attempt ${q.id}`);
      for(const ref of q.missing_observation?.attempt_refs??[])fail(requests.has(ref),`recovery request ${ref}`);
      if(m.run_type==='INTERMEDIATE')fail(!!q.refresh_status&&!!q.checked_at&&date(q.checked_at)>date(m.evidence_cutoff_start)&&date(q.checked_at)<=date(m.generated_at),`intermediate refresh ${q.id}`);
    }
  }
  fail(same(d.six_judgments.map(x=>x.id).sort(),[...JUDGMENTS].sort()),'six distinct judgments');
  const j=Object.fromEntries(d.six_judgments.map(x=>[x.id,x.state]));
  fail(['BULLISH','BEARISH','MIXED','UNCLEAR'].includes(j.macro_direction),'macro enum');fail(['BULLISH','BEARISH','BALANCED','UNESTABLISHED','UNKNOWN'].includes(j.positioning_asymmetry),'positioning enum');fail(j.analysis_scope==='FUNDAMENTALS_ONLY','no execution-readiness grade');
  const covered=new Set(d.exogenous_review.flatMap(x=>x.category_codes));for(const category of EXOGENOUS_CATEGORIES)fail(covered.has(category),`exogenous scan omitted ${category}`);
  const expected=expectedEligibility(d);
  for(const [i,name] of ['GC/MGC futures','CFD'].entries()){
    const x=d.decision_panel.instruments.find(x=>x.instrument===name);
    fail(!!x&&x.eligible_direction===expected[i]&&x.long_eligible===(expected[i]==='LONG')&&x.short_eligible===(expected[i]==='SHORT'),`${name} fundamental gate`);
    fail(x?.gate===(i===0?'clear_evidence_supported_macro_direction_only':'clear_macro_and_same_direction_positioning_asymmetry'),`${name} gate identity`);
  }
  fail(j.fundamental_conclusion===`FUTURES_${expected[0]}_CFD_${expected[1]}`,'final judgment/panel parity');
  const nodes=new Map(d.scenario_tree.nodes.map(n=>[n.id,n]));unique(d.scenario_tree.nodes.map(n=>n.id),'scenario nodes');fail(nodes.has(d.scenario_tree.root_id)&&nodes.get(d.scenario_tree.root_id)?.parent_id===null,'scenario root');
  const edges=d.scenario_tree.edges;unique(edges.map(e=>`${e.from_id}\0${e.to_id}`),'scenario edges');for(const e of edges)fail(nodes.has(e.from_id)&&nodes.has(e.to_id),'orphan scenario edge');
  for(const n of nodes.values())if(n.id!==d.scenario_tree.root_id)fail(nodes.has(n.parent_id)&&edges.some(e=>e.from_id===n.parent_id&&e.to_id===n.id),'scenario parent edge');
  const active=new Set(),seen=new Set();const visit=id=>{if(active.has(id)){p.push('scenario cycle');return;}if(seen.has(id))return;seen.add(id);active.add(id);for(const e of edges.filter(e=>e.from_id===id))visit(e.to_id);active.delete(id);};visit(d.scenario_tree.root_id);fail(seen.size===nodes.size,'unreachable scenario node');
  for(const c of d.calendar)fail(date(c.at)>date(m.evidence_cutoff_end),'calendar event is no longer future');
  for(const id of PHASE_ORDER){const phase=d.procedural_audit.phases[id];fail(date(phase.started_at)<=date(phase.completed_at)&&date(phase.completed_at)<=date(m.generated_at),`phase chronology ${id}`);
    if(phase.status==='NOT_APPLICABLE')fail(id==='weekly_recap'&&m.run_type==='INTERMEDIATE'&&phase.limitations.length>0,'only intermediate weekly recap may be inherited');
    if(['PARTIAL','FAILED'].includes(phase.status))fail(phase.limitations.length>0&&d.procedural_audit.gaps.some(g=>g.phase===id),`phase limitation ${id}`);
    if(m.status==='COMPLETE')fail(['COMPLETE','NOT_APPLICABLE'].includes(phase.status),`incomplete phase ${id}`);
    for(const pre of PREREQUISITES[id]){const before=d.procedural_audit.phases[pre];fail(date(before.completed_at)<=date(phase.started_at),`phase order ${pre}/${id}`);if(phase.status==='COMPLETE')fail(before.status!=='FAILED',`failed prerequisite ${pre}`);}
  }
  fail(same(d.procedural_audit.weekly_recap_coverage.map(x=>x.question_id).sort(),[...REQUIRED_QUESTIONS.weekly_recap].sort()),'weekly recap coverage');if(m.status==='COMPLETE')fail(d.procedural_audit.gaps.length===0,'complete state has procedural gaps');
  fail(date(d.decision_panel.scheduled_expiry)>date(m.evidence_cutoff_end),'eligibility expires before cutoff');
  const order=['opening_thesis','decision_panel',...(m.run_type==='INTERMEDIATE'?['evolution_review']:[]),'six_judgments','horizons','calendar','scenario_tree','family_readouts',...(m.run_type==='SUNDAY'?['weekly_bridge']:[]),'chronology','exogenous_review','glossary_fr'];fail(same(d.reading_order,order),'reader order mismatch');
  const cycle=d.weekly_cycle;fail(cycle.origin_run_id===m.origin_sunday_run_id,'weekly origin');
  if(m.run_type==='SUNDAY'){
    fail(m.parent_run_id===null&&m.origin_sunday_run_id===m.run_id&&cycle.intermediate_index===0,'Sunday origin');fail(d.weekly_bridge&&date(d.weekly_bridge.independent_freeze_at)<=date(d.weekly_bridge.prior_read_at)&&date(d.weekly_bridge.prior_read_at)<=date(m.generated_at),'independent reasoning before prior-week comparison');
  }else{
    fail(Number.isInteger(cycle.intermediate_index)&&cycle.intermediate_index>=1,'positive intermediate index');fail(withinIntermediateWindow(m.evidence_cutoff_end,m.week_of)||authorizedLateIntermediate(d,m.evidence_cutoff_end),'intermediate cutoff no later than Friday 10:00 in origin week');fail(withinIntermediateWindow(m.generated_at,m.week_of)||authorizedLateIntermediate(d,m.generated_at),'intermediate generation no later than Friday 10:00 in origin week');
    fail(!!m.parent_run_id&&m.parent_run_id!==m.run_id&&d.evolution_review?.parent_run_id===m.parent_run_id&&date(d.evolution_review?.parent_cutoff)===date(m.evidence_cutoff_start),'immediate-parent identity');if(m.data_mode==='REAL')fail(!!parent,'REAL intermediate requires supplied parent');
    const transitionIds=d.evolution_review.scenario_transitions.map(x=>x.scenario_id);unique(transitionIds,'scenario transitions');const possible=new Set([...nodes.keys(),...(parent?.scenario_tree?.nodes??[]).map(x=>x.id)]);for(const id of transitionIds)fail(possible.has(id),'unknown transition scenario');
    if(parent){fail(parent.meta.run_id===m.parent_run_id&&parent.meta.origin_sunday_run_id===m.origin_sunday_run_id&&date(parent.meta.evidence_cutoff_end)===date(m.evidence_cutoff_start),'parent lineage/cutoff');fail(cycle.intermediate_index===(parent.weekly_cycle?.intermediate_index??NaN)+1,'parent cycle index');
      if(parent.format_version==='6.0'){fail(d.evolution_review.weekly_history_sha256===canonicalSha256(parent.chronology),'inherited history identity');fail(same(d.chronology,parent.chronology)||!!d.evolution_review.correction_fr,'history changed without correction');for(const old of parent.six_judgments){const now=j[old.id];if(now!==old.state)fail(d.evolution_review.judgment_changes.some(c=>c.judgment_id===old.id&&c.previous_state===old.state&&c.current_state===now&&c.evidence_refs.length>0),`unexplained judgment change ${old.id}`);}}else fail(!!d.evolution_review.correction_fr,'legacy parent needs explicit migration comparison');
    }
  }
  p.push(...learningProblems(d));
  const markdown=renderEditorialMarkdown(d);fail(d.content_preview.markdown===markdown&&d.content_preview.sha256===sha256(markdown),'Markdown/JSON exact parity');fail(!/https?:\/\/|www\.|\[[^\]]+\]\([^)]*\)|\[\[|<\/?[a-z][^>]*>/i.test(markdown),'reader copy contains links, markup or technical tokens');
  for(const id of [...sourceIds,...nodes.keys()].filter(x=>x.length>=3))fail(!markdown.includes('`'+id+'`'),`raw reader identifier ${id}`);
  return [...new Set(p)];
}

export function editorialHandoffProblems(h,state) {
  const problems=[];const check=(ok,msg)=>{if(!ok)problems.push(msg);};
  check(!!state,'v6 handoff requires its source state');if(!state)return problems;
  check(state.format_version==='6.0','handoff state format');if(state.format_version!=='6.0')return problems;
  check(h.created_by_run_id===state.meta.run_id&&h.parent_state_run_id===state.meta.run_id&&h.origin_sunday_run_id===state.meta.origin_sunday_run_id,'handoff lineage');
  check(same(h.weekly_cycle,state.weekly_cycle),'handoff weekly cycle');
  check(date(h.prior_cutoff.as_of)===date(state.meta.evidence_cutoff_end)&&date(h.new_information_policy.new_information_after)===date(state.meta.evidence_cutoff_end),'handoff cutoff');
  const c=h.continuity_checkpoint;
  check(c?.source_run_id===state.meta.run_id&&date(c?.evidence_cutoff_end)===date(state.meta.evidence_cutoff_end),'checkpoint source');
  const values=Object.fromEntries(state.six_judgments.map(x=>[x.id,x.state]));
  for(const key of JUDGMENTS)check(c?.six_verdicts?.[key]===values[key],`checkpoint judgment ${key}`);
  check(same(h.inherited_state.fundamental_eligibility,expectedEligibility(state)),'handoff eligibility');
  for(const key of ['macro_direction','directional_asymmetry','positioning_asymmetry'])check(h.inherited_state[key]===values[key],`inherited ${key}`);
  const mustClose=weeklyDeadlineReached(state.meta.evidence_cutoff_end,state.meta.week_of)||weeklyDeadlineReached(h.created_at,state.meta.week_of);
  check(['ACTIVE','CLOSED'].includes(h.handoff_status),'handoff status');
  if(mustClose)check(h.handoff_status==='CLOSED'&&h.next_execution===null,'Friday 10:00 deadline must close handoff');
  if(h.handoff_status==='CLOSED')check(h.next_execution===null,'closed handoff cannot schedule');
  if(h.handoff_status==='ACTIVE'){
    const at=h.next_execution?.requested_at;
    check(!!at,'active handoff requires next execution');
    if(at){check(withinIntermediateWindow(at,state.meta.week_of)&&date(at)>date(state.meta.evidence_cutoff_end),'next recap outside origin week / Friday 10:00 window');check(date(h.expiry.expires_at)>date(at),'handoff expires before next execution');}
    check(h.next_execution?.timezone==='America/New_York','schedule timezone');
  }
  const nodes=new Set(state.scenario_tree.nodes.map(x=>x.id));
  for(const s of h.scenario_checks)for(const id of s.scenario_refs)check(nodes.has(id),'handoff scenario reference');
  return problems;
}
