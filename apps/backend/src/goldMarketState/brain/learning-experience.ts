// @ts-nocheck
// Pinned Brain da8eb64959b6c026128bde254c8d1703e419f19c: unchanged semantics; only local import suffixes adapted.
// A structured explanation is not a new market-state or an eligibility engine.
export const LEARNING_VERSION = '1.0';
const readerDate=value=>value===null?'non disponible':/^\d{4}-\d{2}-\d{2}$/.test(value)?new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(value)):new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/New_York'}).format(new Date(value))+' (New York)';
export function learningSections(l) {
  const sections=[];
  const add=(title,paragraphs)=>sections.push({title,paragraphs:paragraphs.filter(x=>typeof x==='string'&&x.trim())});
  add(l.headline.title_fr,[l.headline.summary_fr,l.headline.next_question_fr,l.context.scope_fr,l.context.limitation_fr]);
  for(const f of l.facts)add(f.title_fr,[f.observation_fr,`Date de l’observation : ${readerDate(f.measurement_as_of)}. ${f.measurement_window_fr} Vérification : ${readerDate(f.checked_at)}.`,f.status==='UNVERIFIED'?'Cette observation n’est pas vérifiée.':f.status==='NOT_APPLICABLE'?'Cette observation ne s’applique pas à ce contrôle.':'Observation étayée par les preuves référencées.',f.limits_fr]);
  for(const m of l.mechanisms){add(m.title_fr,[m.summary_fr,m.first_principle_fr,m.actor_fr,m.incentive_fr,m.transmission_fr,m.current_application_fr,m.alternative_fr,m.confirmation_fr,m.invalidation_fr,m.horizon_fr,m.limits_fr]);for(const e of m.examples)add(e.kind==='ILLUSTRATIVE'?'Exemple pédagogique fictif':'Exemple observé',[e.text_fr]);}
  for(const link of l.causal_links)add('Pourquoi ces mécanismes sont liés',[link.explanation_fr]);
  for(const p of l.synthesis.pieces)add(p.title_fr,[p.summary_fr,p.role_fr,p.coverage==='INHERITED_NOT_RECHECKED'?'Lecture héritée, non revérifiée par ce contrôle.':p.coverage==='PARTIALLY_REVIEWED'?'Cette famille n’a été revue que partiellement.':'Cette famille a été revue dans cette analyse; ses limites de preuve restent applicables.']);
  for(const c of l.synthesis.connections)add('Comment les pièces se relient',[c.why_fr,c.limit_fr]);
  add('Si l’on lit les pièces ensemble',[l.synthesis.joint_reading_fr,l.synthesis.dominant_driver_fr,l.synthesis.counter_case_fr,l.synthesis.why_preferred_or_mixed_fr,l.synthesis.priced_in_fr,l.synthesis.conditional_outlook_fr,l.synthesis.unresolved_fr,l.synthesis.next_checks_fr]);
  add('Ce qui a changé',[l.changes.summary_fr,l.changes.comparison_limit_fr]);
  for(const c of l.changes.items)add(c.title_fr,[`Avant : ${c.before_fr}`,`Maintenant : ${c.after_fr}`,c.why_fr,c.consequence_fr]);
  for(const n of l.scenario_explanations)add(n.title_fr,[n.summary_fr,n.first_principle_fr,n.actor_fr,n.why_now_fr,n.limits_fr]);
  for(const c of l.concepts)add(c.term_fr,[c.definition_fr,c.why_it_matters_fr,c.current_application_fr,`${c.example_kind==='ILLUSTRATIVE'?'Exemple pédagogique fictif':'Exemple observé'} : ${c.example_fr}`,c.misconception_fr,c.limits_fr]);
  for(const q of l.lessons)add(q.question_fr,[q.answer_fr,q.reasoning_fr,q.limit_fr]);
  return sections;
}

export function learningProblems(d) {
  const l=d.learning_experience;if(!l)return [];
  const errors=[];const check=(ok,msg)=>{if(!ok)errors.push(`learning: ${msg}`);};
  const unique=(xs,label)=>check(new Set(xs).size===xs.length,`duplicate ${label}`);
  const facts=new Map(l.facts.map(x=>[x.id,x]));const mechanisms=new Map(l.mechanisms.map(x=>[x.id,x]));const concepts=new Set(l.concepts.map(x=>x.id));
  unique(l.facts.map(x=>x.id),'facts');unique(l.mechanisms.map(x=>x.id),'mechanisms');unique(l.concepts.map(x=>x.id),'concepts');unique(l.causal_links.map(x=>x.id),'links');unique(l.lessons.map(x=>x.id),'lessons');
  const manual=l.context.mode==='MANUAL_DELTA';
  check(manual ? d.document_type==='GOLD_MANUAL_THESIS_CHECK_RESULT' : d.document_type==='GOLD_MARKET_STATE','document/mode mismatch');
  const cutoff=Date.parse(manual?d.research_cutoff:d.meta.evidence_cutoff_end);const generated=Date.parse(manual?d.completed_at:d.meta.generated_at);
  check(Number.isFinite(cutoff)&&Number.isFinite(generated),'valid document clock required');
  const sources=new Set((d.sources??[]).map(x=>x.id));
  const walk=(v,key='')=>{if(Array.isArray(v)&&key==='evidence_refs')for(const id of v)check(sources.has(id),`unresolved source ${id}`);else if(Array.isArray(v)&&key==='fact_refs')for(const id of v)check(facts.has(id),`unresolved fact ${id}`);else if(Array.isArray(v)&&key==='mechanism_refs')for(const id of v)check(mechanisms.has(id),`unresolved mechanism ${id}`);else if(Array.isArray(v)&&key==='concept_refs')for(const id of v)check(concepts.has(id),`unresolved concept ${id}`);else if(Array.isArray(v))v.forEach(x=>walk(x));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>walk(x,k));};walk(l);
  for(const f of facts.values()){
    const measured=Date.parse(f.measurement_as_of);
    check(f.measurement_as_of===null||measured<=cutoff,`fact after cutoff ${f.id}`);
    check(Date.parse(f.checked_at)<=generated&&(f.measurement_as_of===null||Date.parse(f.checked_at)>=measured),`fact clock ${f.id}`);
    check(f.status!=='OBSERVED'||(f.evidence_refs.length>0&&Number.isFinite(measured)&&f.measurement_precision!=='UNAVAILABLE'),`observed fact lacks dated source ${f.id}`);
    check(f.measurement_precision==='UNAVAILABLE'?f.measurement_as_of===null:f.measurement_as_of!==null,'measurement precision mismatch');
  }
  for(const m of mechanisms.values()){check(m.evidence_refs.length>0,'mechanism requires sourced explanation');for(const e of m.examples)check(e.kind!=='OBSERVED'||e.evidence_refs.length>0,'observed example lacks source');}
  for(const c of l.concepts){check(c.evidence_refs.length>0,'concept requires sourced explanation');check(c.example_kind!=='OBSERVED'||c.evidence_refs.length>0,'observed concept example lacks source');}
  const links=l.causal_links;unique(links.map(x=>`${x.from_id}/${x.to_id}/${x.relation}`),'link relations');
  for(const e of links){check(mechanisms.has(e.from_id)&&mechanisms.has(e.to_id),'orphan causal link');check(e.from_id!==e.to_id,'self causal link');}
  const active=new Set(),seen=new Set();const visit=id=>{if(active.has(id)){check(false,'causal cycle');return;}if(seen.has(id))return;active.add(id);for(const e of links.filter(x=>x.from_id===id))visit(e.to_id);active.delete(id);seen.add(id);};for(const id of mechanisms.keys())visit(id);
  const families=new Set(['F1','F2','F3','F4','F5','F6']);for(const f of facts.values())check(families.has(f.family_id),'unknown family');
  unique(l.synthesis.pieces.map(x=>x.family_id),'puzzle family');check(l.synthesis.pieces.length===6&&l.synthesis.pieces.every(x=>families.has(x.family_id)),'six canonical puzzle families');
  if(!manual)check(l.synthesis.pieces.every(x=>x.coverage!=='INHERITED_NOT_RECHECKED'),'full recap must review every family');
  for(const c of l.synthesis.connections)check(families.has(c.from_family_id)&&families.has(c.to_family_id)&&c.from_family_id!==c.to_family_id,'invalid family connection');
  const nodes=new Map((d.scenario_tree?.nodes??[]).map(x=>[x.id,x]));
  if(!manual){unique(l.scenario_explanations.map(x=>x.node_id),'scenario explanations');check(l.scenario_explanations.length===nodes.size&&l.scenario_explanations.every(x=>nodes.has(x.node_id)),'every canonical scenario needs one explanation');for(const x of l.scenario_explanations)check(nodes.get(x.node_id)?.title_fr===x.title_fr,'scenario title drift');}
  else check(l.scenario_explanations.length===0,'manual delta cannot replace published scenarios');
  const baseline=manual?d.source_state?.run_id:d.meta.run_type==='INTERMEDIATE'?d.meta.parent_run_id:d.weekly_bridge?.prior_run_id??null;
  check(l.changes.baseline_run_id===baseline,'comparison baseline mismatch');
  check(manual||l.context.inherited_run_id===null,'full recap cannot be inherited manual view');
  if(manual)check(l.context.inherited_run_id===baseline,'manual source mismatch');
  const prose=JSON.stringify(learningSections(l));check(!/https?:\/\/|www\.|<\/?[a-z][^>]*>|```|\[[^\]]+\]\([^)]*\)/i.test(prose),'reader copy contains URL, HTML or code');
  return [...new Set(errors)];
}
