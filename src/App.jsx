import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hlkesynzmmveajbwmgwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_gG5lVePrVMobnK24_O-u3A_ajuRlMPV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── PESOS BIOFEEDBACK ────────────────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  // Shared domains weighted via J3U mapping
  performance:25, recovery:20, sleep:20, energy:15, hunger:5,
  // Calibra-exclusive
  joints:10, pump:5,
};

// CATEGORIES: only Calibra-exclusive domains (joints + pump)
// Shared domains (performance, recovery, sleep, energy, hunger) answered via J3U_DOMAINS
const CATEGORIES = [
  { id:"joints", label:"Dor Articular", icon:"🦴", description:"Ombros, cotovelos, joelhos, lombar",
    options:[{value:5,label:"Sem dores",color:"var(--green)"},{value:4,label:"Leve desconforto ocasional",color:"#84cc16"},{value:3,label:"Desconforto frequente",color:"var(--amber)"},{value:2,label:"Dor presente no treino",color:"var(--orange)"},{value:1,label:"Dor limitante",color:"var(--red)"}]},
  { id:"pump", label:"Pump e Conexão Muscular", icon:"💪", description:"Sente o músculo? Pump presente?",
    options:[{value:5,label:"Pump excelente",color:"var(--green)"},{value:4,label:"Bom pump",color:"#84cc16"},{value:3,label:"Pump moderado",color:"var(--amber)"},{value:2,label:"Pump fraco",color:"var(--orange)"},{value:1,label:"Sem pump",color:"var(--red)"}]},
];

// Map J3U domain values (0/1/2) to Calibra score scale (1/3/5) for shared domains
const J3U_TO_CALIBRA = {0:1, 1:3, 2:5};

// Build full score map combining J3U shared domains + Calibra exclusive domains
const buildFullScores = (j3u, calibraScores) => {
  const mapped = {};
  // Map shared J3U domains to Calibra IDs
  const shared = {
    j3u_performance:"performance", j3u_recovery:"recovery",
    j3u_sleep:"sleep", j3u_energy:"energy", j3u_hunger:"hunger"
  };
  Object.entries(shared).forEach(([jid, cid]) => {
    if (j3u[jid] !== undefined) mapped[cid] = J3U_TO_CALIBRA[j3u[jid]];
  });
  return {...mapped, ...calibraScores};
};

// Full categories list (for display/analysis only — not form)
const ALL_CATEGORIES = [
  { id:"performance", label:"Performance", icon:"⚡" },
  { id:"recovery",    label:"Recuperação", icon:"🔄" },
  { id:"sleep",       label:"Sono",        icon:"🌙" },
  { id:"energy",      label:"Energia",     icon:"🔋" },
  { id:"hunger",      label:"Fome",        icon:"🍽️" },
  { id:"joints",      label:"Dor Articular",icon:"🦴" },
  { id:"pump",        label:"Pump",        icon:"💪" },
];

const OBJECTIVE_FIELDS = [
  {id:"weight",label:"Peso corporal",unit:"kg",placeholder:"ex: 83.4"},
  {id:"waist",label:"Cintura",unit:"cm",placeholder:"ex: 84"},
  {id:"rhr",label:"FC de repouso",unit:"bpm",placeholder:"ex: 58"},
  {id:"steps",label:"Passos/dia",unit:"k",placeholder:"ex: 7.2"},
];

const MACRO_FIELDS = [
  {id:"calories",label:"Calorias",unit:"kcal",placeholder:"ex: 2400"},
  {id:"protein",label:"Proteína",unit:"g",placeholder:"ex: 180"},
  {id:"carbs",label:"Carboidrato",unit:"g",placeholder:"ex: 250"},
  {id:"fat",label:"Gordura",unit:"g",placeholder:"ex: 70"},
];

const GUT_FREQ = [{value:"0",label:"0x"},{value:"1",label:"1x"},{value:"2",label:"2x"},{value:"3",label:"3x+"}];
const GUT_CONSISTENCY = [
  {value:5,label:"Ideal (formada, fácil)",color:"var(--green)"},
  {value:4,label:"Boa, leve variação",color:"#84cc16"},
  {value:3,label:"Pastosa / irregular",color:"var(--amber)"},
  {value:2,label:"Diarreia / constipação leve",color:"var(--orange)"},
  {value:1,label:"Diarreia / constipação severa",color:"var(--red)"},
];

// ─── MÓDULO HORMONAL ─────────────────────────────────────────────────────────
// Sinais de E2 ALTO (AI insuficiente): libido ruim, mamilo sensível, pele oleosa, humor sensível
// Sinais de E2 BAIXO (AI em excesso): libido ruim, articulação fraca, pele seca, humor apático, ereção ruim
const HORMONAL_FIELDS = {
  aiDose: { label:"Dose do Inibidor de Aromatase (semana)", placeholder:"ex: Anastrozol 0.5mg 2x" },
  libido: { label:"Vontade e Iniciativa Sexual", options:[{value:4,label:"Ótima"},{value:3,label:"Boa"},{value:2,label:"Ruim"},{value:1,label:"Inexistente"}] },
  erection: { label:"Ereção / Sensibilidade / Orgasmo", options:[{value:4,label:"Ótima"},{value:3,label:"Boa"},{value:2,label:"Ruim"},{value:1,label:"Inexistente"}] },
  morningErection: { label:"Ereção Matinal / Madrugada", subLabel:"Frequência semanal + qualidade",
    freq: [{value:"daily",label:"Diária"},{value:"frequent",label:"Frequente (3-5x)"},{value:"rare",label:"Rara (1-2x)"},{value:"absent",label:"Ausente"}],
    quality: [{value:3,label:"Forte"},{value:2,label:"Fraca"},{value:1,label:"Inexistente"}] },
  joint: { label:"Articulações", options:[{value:2,label:"Ok"},{value:1,label:"Fraca ou estalando"}] },
  mood: { label:"Humor", options:[{value:1,label:"Sensível (choro fácil, irritável)"},{value:3,label:"Normal"},{value:1,label:"Apático (sem motivação)"}],
    opts:[{value:"sensitive",label:"Sensível",e2:"high"},{value:"normal",label:"Normal",e2:"ok"},{value:"apathetic",label:"Apático",e2:"low"}] },
  nipple: { label:"Sensibilidade no Mamilo", options:[{value:"yes",label:"Sim — sensível / dolorido"},{value:"no",label:"Não"}] },
  skin: { label:"Oleosidade da Pele", options:[
    {value:"acne",label:"Alta com acne",e2:"high"},
    {value:"oily",label:"Alta",e2:"high"},
    {value:"normal",label:"Normal",e2:"ok"},
    {value:"dry",label:"Seca",e2:"low"},
  ]},
};

// ─── SCORE HORMONAL ───────────────────────────────────────────────────────────
const computeHormonalScore = (h) => {
  if (!h || Object.keys(h).length < 3) return null;
  let highSignals = 0, lowSignals = 0, total = 0;

  // Libido — peso 25%
  if (h.libido) { total++; if (h.libido <= 2) { highSignals += 0.5; lowSignals += 0.5; } }
  // Ereção — peso 25%
  if (h.erection) { total++; if (h.erection <= 2) { highSignals += 0.3; lowSignals += 0.7; } }
  // Ereção matinal — peso 20%
  if (h.morningErectionFreq && h.morningErectionQuality) {
    total++;
    const absent = h.morningErectionFreq === "absent" || h.morningErectionQuality === 1;
    if (absent) { highSignals += 0.2; lowSignals += 0.8; }
  }
  // Articulação fraca → E2 baixo — peso 10%
  if (h.joint !== undefined) { total++; if (h.joint === 1) lowSignals += 1.5; }
  // Humor — peso 10%
  if (h.mood) { total++; if (h.mood === "sensitive") highSignals += 1.5; if (h.mood === "apathetic") lowSignals += 1.5; }
  // Mamilo sensível → E2 alto — peso crítico
  if (h.nipple) { total++; if (h.nipple === "yes") highSignals += 2.5; }
  // Pele — peso 10%
  if (h.skin) { total++; if (h.skin === "acne" || h.skin === "oily") highSignals += 1.0; if (h.skin === "dry") lowSignals += 1.0; }

  if (total < 3) return null;

  const highScore = Math.min(100, Math.round((highSignals / (total * 1.2)) * 100));
  const lowScore = Math.min(100, Math.round((lowSignals / (total * 1.2)) * 100));

  if (highScore >= 35) return { status:"high", label:"E2 possivelmente ELEVADO", color:"var(--red)", suggestion:"Revisar dose do AI. Considerar exame de estradiol (LC-MS/MS). Sinais: mamilo sensível, pele oleosa, humor sensível.", highScore, lowScore };
  if (lowScore >= 35) return { status:"low", label:"E2 possivelmente BAIXO", color:"var(--orange)", suggestion:"AI pode estar em excesso. Articulações secas e ereção matinal ausente são sinais clássicos de E2 suprimido. Solicitar exame.", highScore, lowScore };
  return { status:"ok", label:"Quadro hormonal equilibrado", color:"var(--green)", suggestion:"Manter protocolo atual. Reavaliar em 2 semanas.", highScore, lowScore };
};

// ─── SCORE BIOFEEDBACK ────────────────────────────────────────────────────────
const getScoreInfo = (score) => {
  if (score >= 85) return { color:"var(--green)", label:"Adaptando bem", bg:"rgba(34,197,94,0.12)", readiness:"verde", readinessLabel:"Treine normalmente", readinessDesc:"Biofeedback positivo. Mantenha o plano." };
  if (score >= 70) return { color:"#84cc16", label:"No caminho certo", bg:"rgba(132,204,22,0.12)", readiness:"verde", readinessLabel:"Treine normalmente", readinessDesc:"Boa adaptação. Monitore de perto." };
  if (score >= 55) return { color:"var(--amber)", label:"Atenção necessária", bg:"rgba(234,179,8,0.12)", readiness:"amarelo", readinessLabel:"Mantenha as cargas", readinessDesc:"Primeiros sinais de fadiga. Não progrida agora." };
  if (score >= 40) return { color:"var(--orange)", label:"Sinal de alerta", bg:"rgba(249,115,22,0.12)", readiness:"amarelo", readinessLabel:"Reduza o volume", readinessDesc:"Recuperação comprometida. Considere deload parcial." };
  return { color:"var(--red)", label:"Fadiga acumulada", bg:"rgba(239,68,68,0.12)", readiness:"vermelho", readinessLabel:"Deload imediato", readinessDesc:"Alto risco de estagnação ou lesão." };
};

const SCORE_SCALE = [
  {range:"85–100",color:"var(--green)",label:"Adaptando bem",desc:"Manter o plano. Pode progredir."},
  {range:"70–84",color:"#84cc16",label:"No caminho certo",desc:"Boa adaptação. Monitorar."},
  {range:"55–69",color:"var(--amber)",label:"Atenção necessária",desc:"Primeiros sinais de fadiga acumulada."},
  {range:"40–54",color:"var(--orange)",label:"Sinal de alerta",desc:"Recuperação comprometida. Deload parcial."},
  {range:"0–39",color:"var(--red)",label:"Fadiga acumulada",desc:"Alto risco de estagnação ou lesão."},
];

const computeScore = (scoreMap, weights) => {
  if (Object.keys(scoreMap).length === 0) return null;
  let weighted = 0, totalWeight = 0;
  // Use ALL_CATEGORIES for scoring (includes shared J3U-mapped domains)
  const cats = ALL_CATEGORIES || Object.keys(weights).map(id=>({id}));
  cats.forEach((cat) => {
    if (scoreMap[cat.id] !== undefined && weights[cat.id] !== undefined) {
      weighted += (scoreMap[cat.id] / 5) * weights[cat.id];
      totalWeight += weights[cat.id];
    }
  });
  return totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : null;
};

const getBottlenecks = (scoreMap, weights) => {
  return ALL_CATEGORIES
    .filter(cat => scoreMap[cat.id] !== undefined && weights[cat.id] !== undefined)
    .map(cat => ({ cat, impact:((5-scoreMap[cat.id])/5)*weights[cat.id], value:scoreMap[cat.id] }))
    .filter(x => x.impact > 0)
    .sort((a,b) => b.impact - a.impact)
    .slice(0, 3);
};

// ─── SUGESTÕES ────────────────────────────────────────────────────────────────
const generateSuggestions = (entry, recentHistory, weights) => {
  const suggestions = [];
  const s = entry.scores;
  const gut = entry.gut || {};
  const macros = entry.macros || {};

  if (s.performance <= 2) suggestions.push({icon:"⚡",area:"Performance",text:"Cargas caindo: evite aumentar volume ou carga por 1–2 semanas. Priorize qualidade de execução."});
  if (s.recovery <= 2) suggestions.push({icon:"🔄",area:"Recuperação",text:"Recuperação comprometida: considere reduzir frequência semanal ou inserir dia extra de descanso ativo."});
  if (s.sleep <= 2) suggestions.push({icon:"🌙",area:"Sono",text:"Sono ruim impacta cortisol e síntese proteica. Evite treinos após 20h e estimulantes após 14h."});
  if (s.energy <= 2) suggestions.push({icon:"🔋",area:"Energia",text:"Energia baixa: concentre maior parte dos carboidratos no pré e pós-treino."});
  if (s.hunger <= 2) suggestions.push({icon:"🍽️",area:"Fome",text:"Fome elevada sugere déficit agressivo. Considere refeed de 1–2 dias nas calorias de manutenção."});
  if (s.joints <= 2) suggestions.push({icon:"🦴",area:"Articulações",text:"Dor articular: substitua exercícios com carga axial por variações de menor stress articular."});
  if (s.pump <= 2 && (s.energy <= 3 || s.recovery <= 3)) suggestions.push({icon:"💪",area:"Pump",text:"Pump fraco + energia/recuperação baixas sugerem glicogênio depletado. Aumente carboidratos pré-treino."});

  if (macros.protein && macros.weight) {
    const ratio = parseFloat(macros.protein) / parseFloat(macros.weight);
    if (ratio < 1.8) suggestions.push({icon:"🥩",area:"Proteína",text:`Proteína em ${ratio.toFixed(1)}g/kg. Em cutting, mire 2.0–2.4g/kg para preservar massa muscular.`});
  }
  if (macros.calories && parseFloat(macros.calories) < 1400) suggestions.push({icon:"🔢",area:"Calorias",text:"Ingestão muito baixa. Déficits acima de 25% do TDEE aumentam risco de catabolismo e supressão hormonal."});
  if (gut.consistency <= 2) suggestions.push({icon:"🫙",area:"Saúde intestinal",text:"Consistência irregular: revise fibras (25–35g/dia), hidratação e fontes proteicas."});
  if (gut.frequency === "0") suggestions.push({icon:"🫙",area:"Trânsito intestinal",text:"Ausência de evacuação diária: priorize vegetais, psyllium e 35ml/kg de água."});

  const recent = recentHistory.filter(h => h.score !== null).slice(0, 4);
  if (recent.length >= 3) {
    const declining = recent[0].score < recent[1].score && recent[1].score < recent[2].score;
    const rising = recent[0].score > recent[1].score && recent[1].score > recent[2].score;
    const volatile = Math.max(...recent.map(h=>h.score)) - Math.min(...recent.map(h=>h.score)) > 20;
    if (declining) suggestions.push({icon:"📉",area:"Deload necessário",text:"Score em queda por 3 semanas consecutivas. Deload de 5–7 dias: reduza volume em 40–50%, mantenha intensidade.",priority:true});
    if (rising) suggestions.push({icon:"📈",area:"Progressão",text:"Três semanas de melhora. Momento favorável para progressão de carga ou adição de volume nos exercícios principais."});
    if (volatile) suggestions.push({icon:"〰️",area:"Consistência",text:"Score muito oscilante. Revise: sono, estresse, adesão alimentar. Consistência supera intensidade."});
  }

  return suggestions;
};

const generateReport = (entry, prev, weights) => {
  const info = getScoreInfo(entry.score);
  const diff = prev ? entry.score - prev.score : null;
  const vs = diff !== null ? ` (${diff>0?"+":""}${diff} pts vs semana anterior)` : "";
  const bottlenecks = getBottlenecks(entry.scores, weights);
  const bn = bottlenecks.length > 0 ? ` Limitadores: ${bottlenecks.map(b=>b.cat.label.toLowerCase()).join(", ")}.` : "";
  const trend = prev && diff > 0 ? " Melhora." : prev && diff < -3 ? " Queda relevante." : "";
  return `${entry.week}: Score ${entry.score}${vs}.${trend}${bn} ${info.readinessDesc}`;
};

// ─── J3U METHODOLOGY ─────────────────────────────────────────────────────────
const J3U_DOMAINS = [
  { id:"j3u_hunger",    label:"Fome",         icon:"🍽️",
    opts:[{v:2,l:"Controlável"},{v:1,l:"Alta parte do dia"},{v:0,l:"Constante / interferindo"}] },
  { id:"j3u_energy",    label:"Energia",       icon:"🔋",
    opts:[{v:2,l:"Boa"},{v:1,l:"Oscila"},{v:0,l:"Baixa diariamente"}] },
  { id:"j3u_sleep",     label:"Sono",          icon:"🌙",
    opts:[{v:2,l:"Reparador"},{v:1,l:"Levemente pior"},{v:0,l:"Insônia / não reparador"}] },
  { id:"j3u_performance",label:"Performance",  icon:"⚡",
    opts:[{v:2,l:"Estável nos âncoras"},{v:1,l:"Pequena queda"},{v:0,l:"Queda consistente"}] },
  { id:"j3u_recovery",  label:"Recuperação",   icon:"🔄",
    opts:[{v:2,l:"Normal entre treinos"},{v:1,l:"Dor prolongada"},{v:0,l:"Incapaz de recuperar"}] },
  { id:"j3u_mood",      label:"Humor",         icon:"🧠",
    opts:[{v:2,l:"Estável"},{v:1,l:"Irritabilidade"},{v:0,l:"Irritabilidade persistente / apatia"}] },
  { id:"j3u_libido",    label:"Libido",        icon:"❤️",
    opts:[{v:2,l:"Preservada"},{v:1,l:"Redução discreta"},{v:0,l:"Queda importante"}] },
];

const computeJ3UScore = (j) => {
  if (!j || Object.keys(j).length === 0) return null;
  const answered = J3U_DOMAINS.filter(d => j[d.id] !== undefined);
  if (answered.length < 4) return null;
  return answered.reduce((sum, d) => sum + j[d.id], 0);
};

const getJ3UClassification = (score, answered) => {
  const max = answered * 2;
  const pct = score / max;
  if (score >= 12) return { label:"Excelente", color:"#22c55e", action:"Manter protocolo. Déficit está sendo bem tolerado." };
  if (score >= 9)  return { label:"Aceitável",  color:"#84cc16", action:"Monitorar. Sem intervenção imediata necessária." };
  if (score >= 6)  return { label:"Atenção",    color:"#eab308", action:"Identificar domínios críticos. Avaliar ajuste leve." };
  return             { label:"Intervenção", color:"#ef4444", action:"Score baixo. Seguir ordem de intervenção J3U." };
};

const estimateJ3UPhase = (entry, recentHistory) => {
  // Heurística operacional — não declarada explicitamente pela J3U
  const recent = recentHistory.filter(h => h.score !== null).slice(0, 8);
  const weeks = recent.length;
  const j = entry.j3u || {};
  const score = computeJ3UScore(j);
  const answeredCount = J3U_DOMAINS.filter(d => j[d.id] !== undefined).length;

  if (weeks < 2) return { phase: null, label: "Dados insuficientes para estimar fase", note: "Necessário ao menos 2 check-ins anteriores." };

  const avgScore = score !== null ? score : null;
  const weightTrend = (() => {
    const ws = recent.filter(h => h.objective?.weight).map(h => parseFloat(h.objective.weight));
    if (ws.length < 2) return null;
    return ws[0] - ws[ws.length - 1];
  })();

  if (weeks <= 6) return { phase: 1, label: "Fase 1 — Get Ahead", color: "#3b82f6", note: "Agressividade inicial é segura. Taxa alvo: 1–1,5%/semana. (J3U Ep. 221)" };
  if (weeks <= 21) return { phase: 2, label: "Fase 2 — Grind It Out", color: "#eab308", note: "Reduzir taxa para 0,5–0,75%/semana. Volume de treino começa a cair. Flatness visual é esperada. (J3U Ep. 221)" };
  if (weeks <= 25) return { phase: 3, label: "Fase 3 — Hold the Look", color: "#f97316", note: "Foco em fullness vs hardness. Iniciar refeeds estruturados. (J3U Ep. 221)" };
  return { phase: 4, label: "Fase 4 — Peak Week", color: "#ef4444", note: "Apenas repetir o que foi testado na Fase 3. Sem manipulações extremas. (J3U Ep. 221)" };
};

const generateJ3UAnalysis = (entry, recentHistory, weights) => {
  const j = entry.j3u || {};
  const obj = entry.objective || {};
  const anchors = entry.anchors || [];
  const j3uScore = computeJ3UScore(j);
  const answeredDomains = J3U_DOMAINS.filter(d => j[d.id] !== undefined);
  const answeredCount = answeredDomains.length;

  if (answeredCount < 4) return null;

  const classification = getJ3UClassification(j3uScore, answeredCount);
  const phase = estimateJ3UPhase(entry, recentHistory);

  // ── Leitura integrada e detecção de conflitos ──
  const conflicts = [];
  const insights = [];

  // Peso + cintura
  const prevWithObj = recentHistory.find(h => h.objective?.weight && h.objective?.waist);
  const currWeight = parseFloat(obj.weight);
  const currWaist = parseFloat(obj.waist);
  const prevWeight = prevWithObj ? parseFloat(prevWithObj.objective.weight) : null;
  const prevWaist = prevWithObj ? parseFloat(prevWithObj.objective.waist) : null;

  const weightDelta = (currWeight && prevWeight) ? currWeight - prevWeight : null;
  const waistDelta = (currWaist && prevWaist) ? currWaist - prevWaist : null;

  if (weightDelta !== null && waistDelta !== null) {
    if (Math.abs(weightDelta) < 0.3 && waistDelta < -0.5)
      conflicts.push({ type:"info", text:"Peso estável + cintura caindo → possível recomposição ou retenção hídrica. Não mexer no plano. (inferência operacional)" });
    else if (weightDelta > 0 && waistDelta < 0)
      conflicts.push({ type:"info", text:"Peso subindo + cintura caindo → provável retenção hídrica. Investigar sódio, carboidratos, estresse. (inferência operacional)" });
    else if (weightDelta > 0.5 && waistDelta > 0.5)
      conflicts.push({ type:"warn", text:"Peso e cintura subindo → verificar aderência antes de qualquer ajuste. (inferência operacional)" });
    else if (weightDelta < -0.5 && j3uScore !== null && j3uScore <= 5)
      conflicts.push({ type:"warn", text:"Peso caindo rápido + biofeedback ruim → déficit possivelmente excessivo. Avaliar performance nos âncoras. (inferência operacional)" });
    else if (Math.abs(weightDelta) < 0.3 && j3uScore !== null && j3uScore >= 9)
      insights.push("Peso estável + biofeedback bom → possível ruído. Aguardar próximo check-in antes de qualquer ajuste. (inferência operacional)");
  }

  // Performance âncoras
  if (entry.scores?.performance <= 2)
    conflicts.push({ type:"warn", text:"Performance caindo nos âncoras — sinal crítico para a J3U. Prioridade: identificar causa antes de cortar mais calorias." });

  // Biofeedback vs fase
  if (phase.phase === 2 && j3uScore !== null && j3uScore <= 5)
    conflicts.push({ type:"warn", text:"Fase 2 com biofeedback ruim — risco de catabolismo muscular. Considerar diet break antes de continuar. (proposta operacional)" });

  // ── Ordem de intervenção J3U ──
  const interventions = [];
  if (j3uScore !== null && j3uScore <= 8) {
    if (j[`j3u_energy`] <= 1 || j[`j3u_mood`] <= 1)
      interventions.push({ priority:1, action:"Aumentar NEAT: +1.000–2.000 passos/dia antes de mexer em calorias.", type:"documentado — J3U Ep. 6" });
    if (j[`j3u_hunger`] === 0)
      interventions.push({ priority:2, action:"Fome constante: avaliar +50–100g carboidratos (+200–400 kcal) com os mesmos alimentos da dieta base. Evitar alimentos palatáveis atípicos.", type:"documentado — J3U Ep. 6" });
    if (j[`j3u_sleep`] === 0 || j[`j3u_recovery`] === 0)
      interventions.push({ priority:3, action:"Sono/recuperação ruins persistentes: considerar deload — elevar calorias à manutenção OU reduzir cardio para aproximar passivamente. Escolha depende se o atleta está mais estressado pela fome ou pelo cansaço físico.", type:"documentado — J3U Ep. 6" });
    if (j[`j3u_libido`] === 0)
      interventions.push({ priority:4, action:"Libido zerada: sinal de déficit energético importante ou supressão hormonal. Não aumentar déficit. Avaliar exames se persistir.", type:"inferência operacional — coerente com filosofia J3U" });
  }

  if (interventions.length === 0 && j3uScore >= 9)
    interventions.push({ priority:1, action:"Biofeedback adequado. Manter protocolo atual. Monitorar tendência de peso e cintura no próximo check-in.", type:"princípio J3U — não reagir a ruído" });

  // ── Sugestão de carboidratos J3U ──
  const carbSuggestion = (() => {
    const energy = j["j3u_energy"];
    const hunger = j["j3u_hunger"];
    const performance = j["j3u_performance"];
    const sleep = j["j3u_sleep"];

    const prevWeights = recentHistory.filter(h=>h.objective?.weight).slice(0,3).map(h=>parseFloat(h.objective.weight));
    const currW = parseFloat(entry.objective?.weight);
    const weeklyLoss = (prevWeights.length>0 && currW) ? (prevWeights[0]-currW) : null;

    // Losing too fast + bad biofeedback → increase carbs
    if (weeklyLoss !== null && weeklyLoss > 1.5 && j3uScore <= 8)
      return { dir:"↑", amount:"+75–100g carboidratos/dia (~300–400 kcal)", reason:"Perda acelerada (>1,5%/sem) + biofeedback comprometido. Aumentar base calórica via carboidratos, mantendo os mesmos alimentos da dieta.", type:"documentado — J3U Ep. 6" };

    if (energy === 0 || (energy === 1 && performance <= 1))
      return { dir:"↑", amount:"+50–75g carboidratos no pré-treino", reason:"Energia baixa + queda de performance. Concentrar carboidratos no pré-treino antes de mexer na base total.", type:"inferência operacional — coerente com J3U" };

    if (hunger === 0 && j3uScore <= 8)
      return { dir:"↑", amount:"+50–100g carboidratos/dia (~200–400 kcal)", reason:"Fome constante interferindo na rotina. Preferir aumento sutil com alimentos já usados na dieta. Evitar alimentos palatáveis atípicos.", type:"documentado — J3U Ep. 6" };

    if (j3uScore >= 11 && weeklyLoss !== null && weeklyLoss < 0.2 && phase.phase === 2)
      return { dir:"↓", amount:"−25–50g carboidratos/dia (−100–200 kcal)", reason:"Biofeedback bom + peso estagnado na Fase 2. Redução leve antes de aumentar cardio. Confirmar aderência primeiro.", type:"inferência operacional — coerente com J3U" };

    if (j3uScore >= 12 && weeklyLoss !== null && weeklyLoss > 0.5 && weeklyLoss <= 1.2)
      return { dir:"→", amount:"Manter carboidratos atuais", reason:"Biofeedback excelente + perda dentro da faixa. Sem alteração necessária.", type:"princípio J3U — não reagir a ruído" };

    return null;
  })();

  return { j3uScore, answeredCount, classification, phase, conflicts, insights, interventions, carbSuggestion, confidence, confidenceNote };

  // ── Confiança ──
  const dataPoints = [
    obj.weight, obj.waist, anchors.length > 0,
    answeredCount >= 7, recentHistory.length >= 2
  ].filter(Boolean).length;

  const confidence = dataPoints >= 4 ? "Alta" : dataPoints >= 2 ? "Moderada" : "Baixa";
  const confidenceNote = dataPoints >= 4
    ? "Múltiplos pilares disponíveis (peso, cintura, âncoras, biofeedback J3U, histórico)."
    : dataPoints >= 2
    ? "Dados parciais — recomendações com maior margem de incerteza."
    : "Dados insuficientes para recomendação confiável. Preencher mais pilares no próximo check-in.";


};


// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function BiofeedbackScore() {
  const [scores, setScores] = useState({});
  const [week, setWeek] = useState("");
  const [notes, setNotes] = useState("");
  const [objective, setObjective] = useState({});
  const [macros, setMacros] = useState({});
  const [gut, setGut] = useState({});
  const [hormonal, setHormonal] = useState({});
  const [usesHormones, setUsesHormones] = useState(null);
  const [anchors, setAnchors] = useState([{exercise:"",weight:"",reps:""}]);
  const [photo, setPhoto] = useState(null);
  const [j3u, setJ3u] = useState({});
  const [history, setHistory] = useState([]);
  const [weights, setWeights] = useState({...DEFAULT_WEIGHTS});
  const [view, setView] = useState("form");
  const [showWeights, setShowWeights] = useState(false);
  const [modal, setModal] = useState(null);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState("login"); // login | register
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [profile, setProfile] = useState({});
  const [measures, setMeasures] = useState([]);
  const [newMeasure, setNewMeasure] = useState({});
  const [posePhotos, setPosePhotos] = useState({});
  const [measureDate, setMeasureDate] = useState(new Date().toLocaleDateString("pt-BR"));
  const loaded = useRef(false);
  const [displayScore, setDisplayScore] = useState(null);
  const animRef = useRef(null);

  // Animate score counter
  const animateScore = (target) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (target === null) { setDisplayScore(null); return; }
    const start = displayScore || 0;
    const duration = 800;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + (target - start) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data when user logs in ──
  useEffect(() => {
    if (!user) return;
    const loadAll = async () => {
      try {
        const { data: p } = await supabase.from("profiles").select("data").eq("id", user.id).single();
        if (p?.data) {
          const pd = p.data;
          if (pd.profile) setProfile(pd.profile);
          if (pd.posePhotos) setPosePhotos(pd.posePhotos);
        }
      } catch(_) {}
      try {
        const { data: w } = await supabase.from("user_weights").select("weights").eq("id", user.id).single();
        if (w?.weights) setWeights(w.weights);
      } catch(_) {}
      try {
        const { data: c } = await supabase.from("checkins").select("week,data").eq("user_id", user.id).order("created_at", { ascending: false });
        if (c) setHistory(c.map(r => ({ week: r.week, ...r.data })));
      } catch(_) {}
      try {
        const { data: m } = await supabase.from("measures").select("data").eq("user_id", user.id).order("created_at", { ascending: false });
        if (m) setMeasures(m.map(r => r.data));
      } catch(_) {}
      loaded.current = true;
    };
    loadAll();
  }, [user]);

  // ── Auth handlers ──
  const handleLogin = async () => {
    setAuthError(""); setAuthMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
  };

  const handleRegister = async () => {
    setAuthError(""); setAuthMsg("");
    if (authPassword.length < 6) { setAuthError("Senha deve ter pelo menos 6 caracteres."); return; }
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else setAuthMsg("Conta criada! Verifique seu e-mail para confirmar.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setHistory([]); setProfile({}); setMeasures([]); setPosePhotos({}); setWeights({...DEFAULT_WEIGHTS});
    loaded.current = false;
  };

  // ── Save to Supabase ──
  const saveProfile = async (newProfile, newPosePhotos) => {
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, data: { profile: newProfile, posePhotos: newPosePhotos || posePhotos } });
  };

  const saveWeights = async (newWeights) => {
    if (!user) return;
    await supabase.from("user_weights").upsert({ id: user.id, weights: newWeights });
  };

const fullScoresLive = buildFullScores(j3u, scores);
const totalAnswered = Object.keys(fullScoresLive).length;
const score = computeScore(fullScoresLive, weights);
const scoreInfo = score !== null ? getScoreInfo(score) : null;

// Delta para o Hero
const historyWithScore = history.filter(h => h.score !== null);
const delta = historyWithScore.length > 0 && score !== null ? score - historyWithScore[0].score : null;
  const bottlenecks = getBottlenecks(fullScoresLive, weights);

  // Animate score on change
  useEffect(() => { animateScore(score); }, [score]);
  const historyWithScore = history.filter(h => h.score !== null);
  const last4 = historyWithScore.slice(0,4);
  const avg4 = last4.length > 0 ? Math.round(last4.reduce((a,b)=>a+b.score,0)/last4.length) : null;
  const best = historyWithScore.length > 0 ? Math.max(...historyWithScore.map(h=>h.score)) : null;
  const worst = historyWithScore.length > 0 ? Math.min(...historyWithScore.map(h=>h.score)) : null;
  const trend4 = last4.length >= 2 ? last4[0].score - last4[last4.length-1].score : null;
  const totalWeightSum = Object.values(weights).reduce((a,b)=>a+b,0);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!week.trim() || totalAnswered === 0) return;
    const prev = historyWithScore[0] || null;
    const hormonalScore = usesHormones ? computeHormonalScore(hormonal) : null;
    const fullScores = buildFullScores(j3u, scores);
    const entry = {
      week, scores: fullScores, objective:{...objective},
      macros:{...macros}, gut:{...gut},
      hormonal: usesHormones ? {...hormonal} : null,
      hormonalScore,
      usesHormones: !!usesHormones,
      j3u:{...j3u},
      anchors: anchors.filter(a => a.exercise.trim()),
      photo,
      score: computeScore(fullScores, weights),
      notes, date: new Date().toLocaleDateString("pt-BR"), report:"",
    };
    entry.report = generateReport(entry, prev, weights);
    const suggestions = generateSuggestions(entry, historyWithScore, weights);
    const j3uAnalysis = generateJ3UAnalysis(entry, historyWithScore, weights);
    setHistory(h => [entry, ...h]);
    // Save to Supabase
    if (user) {
      const { week: w, ...rest } = entry;
      supabase.from("checkins").insert({ user_id: user.id, week: w, data: rest }).then(() => {});
    }
    setScores({}); setWeek(""); setNotes(""); setObjective({}); setMacros({}); setGut({});
    setHormonal({}); setUsesHormones(null); setAnchors([{exercise:"",weight:"",reps:""}]); setPhoto(null); setJ3u({});
    setModal({suggestions, report:entry.report, score:entry.score, week:entry.week, hormonalScore, j3uAnalysis, scores:entry.scores, prevScores:prev?.scores||{}});
  };

  const handleDeleteEntry = async (idx) => {
    if (!window.confirm("Excluir este registro?")) return;
    const entry = history[idx];
    setHistory(h => h.filter((_,i)=>i!==idx));
    if (user && entry.week) {
      await supabase.from("checkins").delete().eq("user_id", user.id).eq("week", entry.week);
    }
  };
  const handleWeightChange = (id, val) => { const n = Math.max(0,Math.min(50,parseInt(val)||0)); setWeights(w=>({...w,[id]:n})); };
  const resetWeights = () => setWeights({...DEFAULT_WEIGHTS});

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),user:user?.email,history,weights,profile,measures},null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`biofeedback-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const handleSendEmail = () => {
    const name = profile.name || "Atleta";
    const lines = [];
    lines.push("BIOFEEDBACK SCORE — HISTÓRICO COMPLETO");
    lines.push("========================================");
    lines.push("");
    lines.push("PERFIL");
    lines.push(`Nome: ${profile.name||"—"} | Idade: ${profile.age||"—"} | Altura: ${profile.height||"—"}cm`);
    lines.push(`Objetivo: ${profile.goal||"—"} | Nível: ${profile.level||"—"}`);
    if (profile.health) lines.push(`Condições de saúde: ${profile.health}`);
    if (profile.meds) lines.push(`Medicamentos: ${profile.meds}`);
    lines.push("");
    if (measures.length > 0) {
      lines.push("MEDIDAS");
      lines.push("Data | Peso | Cintura | Quadril | Peito | Ombros | Braço D | Braço E | Coxa D | Coxa E | Panturrilha | %Gord");
      measures.forEach(m => {
        lines.push(`${m.date} | ${m.weight||"—"}kg | ${m.waist||"—"}cm | ${m.hip||"—"}cm | ${m.chest||"—"}cm | ${m.shoulders||"—"}cm | ${m.armR||"—"}cm | ${m.armL||"—"}cm | ${m.thighR||"—"}cm | ${m.thighL||"—"}cm | ${m.calf||"—"}cm | ${m.bodyfat||"—"}%`);
      });
      lines.push("");
    }
    if (history.length > 0) {
      lines.push("CHECK-INS SEMANAIS");
      history.forEach(e => {
        lines.push(`${e.week} (${e.date}) — Score: ${e.score||"—"}`);
        if (e.report) lines.push(`  ${e.report}`);
        if (e.anchors?.length > 0) lines.push(`  Performance: ${e.anchors.map(a=>`${a.exercise} ${a.weight}kg×${a.reps}`).join(" | ")}`);
        if (e.macros && Object.values(e.macros).some(v=>v)) lines.push(`  Macros: ${e.macros.calories||"—"}kcal | P:${e.macros.protein||"—"}g | C:${e.macros.carbs||"—"}g | G:${e.macros.fat||"—"}g`);
        if (e.notes) lines.push(`  Obs: ${e.notes}`);
      });
    }
    const body = encodeURIComponent(lines.join("\n"));
    const subject = encodeURIComponent(`Biofeedback Score — ${name} — ${new Date().toLocaleDateString("pt-BR")}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePosePhoto = (pose, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPosePhotos(p=>({...p,[pose]:ev.target.result}));
    reader.readAsDataURL(file);
    e.target.value="";
  };

  const calcNavy = (w, neck, abd, hip, height, sex) => {
    if (!height || !neck || !abd) return null;
    let bf;
    if (sex === "Feminino") {
      if (!hip) return null;
      bf = 163.205 * Math.log10(abd + hip - neck) - 97.684 * Math.log10(height) - 78.387;
    } else {
      bf = 86.010 * Math.log10(abd - neck) - 70.041 * Math.log10(height) + 36.76;
    }
    return Math.max(3, Math.min(60, parseFloat(bf.toFixed(1))));
  };

  const handleSaveMeasure = () => {
    if (Object.values(newMeasure).every(v=>!v)) return;
    // Auto-calculate US Navy if possible
    const neck = parseFloat(newMeasure.neck_cm || profile.neck_cm);
    const abd = parseFloat(newMeasure.waist || newMeasure.abdomen_cm);
    const hip = parseFloat(newMeasure.hip || profile.hip_navy);
    const h = parseFloat(profile.height);
    const w = parseFloat(newMeasure.weight);
    const sex = profile.sex;
    const bf = calcNavy(w, neck, abd, hip, h, sex);
    const entry = {
      ...newMeasure,
      date: measureDate,
      bodyfat_navy: bf !== null ? bf : undefined,
      lbm: (bf !== null && w) ? parseFloat((w*(1-bf/100)).toFixed(1)) : undefined,
    };
    setMeasures(m=>[entry,...m]);
    if (user) {
      supabase.from("measures").insert({ user_id: user.id, data: entry }).then(() => {});
    }
    setNewMeasure({});
  };

  const handleDeleteMeasure = async (idx) => {
    if (!window.confirm("Excluir esta medição?")) return;
    const entry = measures[idx];
    setMeasures(m=>m.filter((_,i)=>i!==idx));
    if (user) {
      await supabase.from("measures").delete().eq("user_id", user.id).eq("data->>date", entry.date);
    }
  };
  const handleImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data=JSON.parse(ev.target.result); if(data.history) setHistory(data.history); if(data.weights) setWeights(data.weights); setView("history"); } catch(_) { alert("Arquivo inválido."); } };
    reader.readAsText(file); e.target.value="";
  };

  // Comparador
  const entryA = history.find(h=>h.week===compareA);
  const entryB = history.find(h=>h.week===compareB);

  const H = ({id,children}) => <div id={id}>{children}</div>;

  return (
    <div style={{minHeight:"100vh",background:"var(--surface-0)",color:"var(--text-1)",fontFamily:"'DM Mono','Courier New',monospace",fontSize:"14px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        :root{
          --brand:#3b82f6;
          --brand-dim:rgba(59,130,246,0.15);
          --brand-glow:rgba(59,130,246,0.25);
          --surface-0:#070c14;
          --surface-1:#0c1220;
          --surface-2:#101827;
          --surface-3:#141e2e;
          --surface-4:#1a2538;
          --border:rgba(255,255,255,0.06);
          --border-strong:rgba(255,255,255,0.12);
          --text-1:#f0eee9;
          --text-2:#b4bed0;
          --text-3:#8a94aa;
          --text-4:#3a4460;
          --green:#22c55e;
          --amber:#eab308;
          --red:#ef4444;
          --orange:#f97316;
          --purple:#7c3aed;
          --radius:12px;
        }
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--surface-0)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--surface-4);border-radius:99px}

        /* ── Option buttons ── */
        .opt-btn{
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08);
          color:var(--text-2);
          padding:9px 16px;
          border-radius:8px;
          cursor:pointer;
          font-family:inherit;
          font-size:13px;
          transition:background .2s, border-color .2s, transform .2s, box-shadow .2s;
          white-space:nowrap;
        }
        .opt-btn:hover{
          background:rgba(255,255,255,0.08);
          border-color:rgba(255,255,255,0.18);
          color:var(--text-1);
          transform:translateY(-1px);
        }
        .opt-btn.selected{
          background:rgba(59,130,246,0.18);
          border-color:#3b82f6;
          color:#fff;
          font-weight:500;
          box-shadow:0 0 0 1px rgba(59,130,246,0.35), 0 0 24px rgba(59,130,246,0.18);
        }

        /* ── Tabs — pill style ── */
        .tab-btn{
          background:transparent;
          border:none;
          color:#94a3b8;
          font-family:inherit;
          font-size:11px;
          letter-spacing:.1em;
          text-transform:uppercase;
          cursor:pointer;
          padding:7px 14px;
          border-radius:999px;
          transition:background .18s, color .18s;
        }
        .tab-btn.active{
          background:rgba(255,255,255,0.08);
          color:#fff;
        }
        .tab-btn:hover:not(.active){
          background:rgba(255,255,255,0.04);
          color:var(--text-2);
        }

        /* ── Primary button ── */
        .save-btn{
          background:linear-gradient(135deg,#3b82f6,#2563eb);
          color:#fff;
          border:none;
          padding:14px 32px;
          font-family:inherit;
          font-size:13px;
          letter-spacing:.1em;
          text-transform:uppercase;
          cursor:pointer;
          border-radius:8px;
          font-weight:500;
          transition:all .2s;
          box-shadow:0 4px 20px rgba(59,130,246,0.35);
        }
        .save-btn:disabled{opacity:.25;cursor:not-allowed;box-shadow:none;transform:none}
        .save-btn:hover:not(:disabled){
          background:linear-gradient(135deg,#60a5fa,#3b82f6);
          box-shadow:0 6px 28px rgba(59,130,246,0.55);
          transform:translateY(-2px);
        }

        /* ── Ghost button ── */
        .ghost-btn{
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08);
          color:var(--text-3);
          padding:7px 14px;
          font-family:inherit;
          font-size:11px;
          letter-spacing:.08em;
          text-transform:uppercase;
          cursor:pointer;
          border-radius:8px;
          transition:all .2s;
        }
        .ghost-btn:hover{
          background:rgba(255,255,255,0.07);
          border-color:rgba(255,255,255,0.15);
          color:var(--text-2);
        }

        /* ── Inputs ── */
        input,textarea,select{
          background:var(--surface-2);
          border:1px solid rgba(255,255,255,0.07);
          color:var(--text-1);
          font-family:inherit;
          font-size:13px;
          padding:10px 14px;
          border-radius:8px;
          outline:none;
          transition:all .2s;
          width:100%;
        }
        input:focus,textarea:focus,select:focus{
          border-color:var(--brand);
          background:var(--surface-3);
          box-shadow:0 0 0 3px var(--brand-dim);
        }
        input::placeholder,textarea::placeholder{color:var(--text-4)}

        .weight-input{
          background:var(--surface-2);
          border:1px solid rgba(255,255,255,0.07);
          color:var(--text-1);
          font-family:inherit;
          font-size:12px;
          padding:5px 8px;
          border-radius:6px;
          outline:none;
          width:52px;
          text-align:center;
        }

        /* ── Delete button ── */
        .del-btn{
          background:transparent;
          border:none;
          color:var(--text-4);
          cursor:pointer;
          font-size:14px;
          padding:4px 8px;
          border-radius:6px;
          transition:all .15s;
          font-family:inherit;
        }
        .del-btn:hover{color:var(--red);background:rgba(239,68,68,0.1)}

        /* ── Modal ── */
        .modal-overlay{
          position:fixed;inset:0;
          background:rgba(0,0,0,0.88);
          backdrop-filter:blur(8px);
          z-index:100;
          display:flex;align-items:center;justify-content:center;padding:20px;
        }
        .modal-box{
          background:linear-gradient(180deg,#101827,#0c1220);
          border:1px solid var(--border-strong);
          border-radius:16px;
          max-width:540px;width:100%;max-height:88vh;overflow-y:auto;
          padding:28px 24px;
          box-shadow:0 32px 80px rgba(0,0,0,0.7);
        }
        .close-btn{
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08);
          color:var(--text-3);
          padding:10px 24px;
          font-family:inherit;font-size:12px;
          letter-spacing:.08em;text-transform:uppercase;
          cursor:pointer;border-radius:8px;
          transition:all .2s;margin-top:20px;
        }
        .close-btn:hover{background:rgba(255,255,255,0.07);color:var(--text-2)}

        /* ── Cards ── */
        .card{
          background:linear-gradient(180deg,#101827,#0c1423);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:var(--radius);
          padding:16px 18px;
          margin-bottom:8px;
          box-shadow:0 8px 24px rgba(0,0,0,0.3);
          transition:transform .2s, box-shadow .2s;
        }
        @media(hover:hover){
          .card:hover{
            transform:translateY(-2px);
            box-shadow:0 16px 40px rgba(0,0,0,0.45);
          }
        }
        .card-hero{
          background:linear-gradient(145deg,#0f1e35 0%,#0a1525 50%,#070c14 100%);
          border:1px solid rgba(59,130,246,0.18);
          border-radius:var(--radius);
          padding:28px 24px;
          margin-bottom:16px;
          box-shadow:0 0 60px rgba(59,130,246,0.06), 0 20px 40px rgba(0,0,0,0.4);
        }

        /* ── Section title ── */
        .section-title{
          font-size:11px;
          color:var(--text-3);
          letter-spacing:.16em;
          text-transform:uppercase;
          margin-bottom:16px;
          display:flex;align-items:center;gap:10px;
        }
        .section-title::after{
          content:'';flex:1;
          height:1px;
          background:linear-gradient(90deg,rgba(255,255,255,0.06),transparent);
        }

        /* ── Hormonal buttons ── */
        .horm-btn{
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08);
          color:var(--text-3);
          padding:10px 20px;
          border-radius:8px;
          cursor:pointer;
          font-family:inherit;font-size:13px;
          transition:all .2s;
        }
        .horm-btn.yes{
          background:rgba(124,58,237,0.18);
          border-color:rgba(124,58,237,0.6);
          color:#a78bfa;
          box-shadow:0 0 20px rgba(124,58,237,0.2);
        }
        .horm-btn.no{
          background:rgba(255,255,255,0.05);
          border-color:rgba(255,255,255,0.12);
          color:var(--text-2);
        }

        /* ── Anchor row ── */
        .anchor-row{display:grid;grid-template-columns:1fr 80px 70px 32px;gap:6px;margin-bottom:8px}
        @media(max-width:480px){
          .anchor-row{grid-template-columns:1fr 64px 56px 28px}
        }

        /* ── Progress bar ── */
        .progress-bar{
          height:3px;
          background:rgba(255,255,255,0.05);
          border-radius:99px;
          overflow:hidden;
          margin-top:16px;
        }
        .progress-fill{
          height:100%;
          border-radius:99px;
          background:linear-gradient(90deg,var(--brand),#60a5fa);
          transition:width .5s cubic-bezier(0.4,0,0.2,1);
          box-shadow:0 0 8px rgba(59,130,246,0.5);
        }

        /* ── Category icons ── */
        .cat-icon{
          width:36px;height:36px;
          border-radius:10px;
          display:flex;align-items:center;justify-content:center;
          font-size:17px;flex-shrink:0;
        }
        .cat-label{line-height:1.2;word-break:keep-all;hyphens:none}

        /* ── Macro cards ── */
        .macro-card{
          background:#101827;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:14px;
          padding:14px 16px;
          display:flex;flex-direction:column;gap:6px;
          transition:border-color .2s;
        }
        .macro-card:focus-within{
          border-color:rgba(59,130,246,0.4);
        }
        .macro-card label{
          font-size:11px;
          color:var(--text-3);
          letter-spacing:.08em;
          text-transform:uppercase;
          display:flex;align-items:center;gap:6px;
        }
        .macro-card input{
          background:transparent;
          border:none;
          padding:0;
          font-size:20px;
          font-family:'Bebas Neue',sans-serif;
          color:var(--text-1);
          letter-spacing:.04em;
          box-shadow:none;
        }
        .macro-card input:focus{
          box-shadow:none;
          background:transparent;
        }
        .macro-card .unit{
          font-size:11px;
          color:var(--text-3);
        }

        /* ── Responsive ── */
        @media(max-width:600px){
          .tab-btn{padding:6px 10px;font-size:10px}
          .hide-mobile{display:none}
        }

        /* ── Desktop 2-col improvements ── */
        @media(min-width:720px){
          .form-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
          .card-hero{padding:32px 28px}
        }

        /* ── Accordion ── */
        details summary::-webkit-details-marker{display:none}
        details[open] summary span:first-child{transform:rotate(90deg);display:inline-block;transition:transform .2s}

        /* ── Score glow animation ── */
        @keyframes scoreGlow{
          0%,100%{text-shadow:0 0 40px currentColor}
          50%{text-shadow:0 0 80px currentColor, 0 0 120px currentColor}
        }
        .score-glow{animation:scoreGlow 3s ease-in-out infinite}
      `}</style>

      {/* ── Auth loading ── */}
      {authLoading && (
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--surface-0)"}}>
          <div style={{fontSize:12,color:"var(--text-4)",letterSpacing:".2em",textTransform:"uppercase"}}>CALIBRA</div>
        </div>
      )}

      {/* ── Auth screen ── */}
      {!authLoading && !user && (
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, var(--surface-0) 60%)"}}>
          <div style={{width:"100%",maxWidth:380,background:"linear-gradient(180deg,var(--surface-3),var(--surface-1))",border:"1px solid var(--border-strong)",borderRadius:12,padding:"36px 32px",boxShadow:"0 24px 64px rgba(0,0,0,0.5)"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,letterSpacing:".15em",color:"var(--text-1)",background:"linear-gradient(135deg,#fff,#9aa0b4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CALIBRA</div>
              <div style={{fontSize:11,color:"var(--text-4)",letterSpacing:".14em",textTransform:"uppercase",marginTop:6}}>Monitoramento de adaptação ao treino</div>
            </div>

            <div style={{display:"flex",marginBottom:24,background:"var(--surface-0)",borderRadius:8,padding:4}}>
              {[["login","Entrar"],["register","Criar conta"]].map(([v,l])=>(
                <button key={v} onClick={()=>{setAuthView(v);setAuthError("");setAuthMsg("");}}
                  style={{flex:1,padding:"9px",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12,letterSpacing:".08em",textTransform:"uppercase",transition:"all .2s",
                    background:authView===v?"rgba(59,130,246,0.15)":"transparent",
                    color:authView===v?"#60a5fa":"var(--text-4)",
                    boxShadow:authView===v?"0 0 0 1px rgba(59,130,246,0.3)":"none"}}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:12,color:"var(--text-3)"}}>E-mail</label>
                <input type="email" placeholder="seu@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleRegister())}
                  style={{width:"100%"}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:12,color:"var(--text-3)"}}>Senha</label>
                <input type="password" placeholder={authView==="register"?"mínimo 6 caracteres":""} value={authPassword} onChange={e=>setAuthPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleRegister())}
                  style={{width:"100%"}}/>
              </div>
            </div>

            {authError && <div style={{fontSize:12,color:"var(--red)",marginBottom:12,padding:"8px 12px",background:"rgba(239,68,68,0.08)",borderRadius:4}}>{authError}</div>}
            {authMsg && <div style={{fontSize:12,color:"var(--green)",marginBottom:12,padding:"8px 12px",background:"rgba(34,197,94,0.08)",borderRadius:4}}>{authMsg}</div>}

            <button className="save-btn" style={{width:"100%"}}
              onClick={authView==="login"?handleLogin:handleRegister}>
              {authView==="login"?"Entrar":"Criar conta"}
            </button>

            <div style={{fontSize:11,color:"var(--text-4)",textAlign:"center",marginTop:16,lineHeight:1.6}}>
              Seus dados ficam salvos na nuvem e acessíveis de qualquer dispositivo.
            </div>
          </div>
        </div>
      )}

      {/* ── App (autenticado) ── */}
      {!authLoading && user && (<>

      {/* ── Modal pós-salvar ── */}
      {modal && (
        <div className="modal-overlay" onClick={()=>{setModal(null);setView("history");}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:".08em",marginBottom:6}}>RESUMO DA SEMANA</div>
            <div style={{fontSize:13,color:"var(--text-3)",marginBottom:18}}>{modal.week}</div>

            {/* Score biofeedback */}
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16,padding:"16px",background:"var(--surface-0)",borderRadius:8,border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:getScoreInfo(modal.score).color,lineHeight:1}}>{modal.score}</div>
              <div>
                <div style={{fontSize:14,color:getScoreInfo(modal.score).color,marginBottom:6}}>{getScoreInfo(modal.score).label}</div>
                <div style={{fontSize:13,color:"var(--text-2)"}}>{getScoreInfo(modal.score).readinessDesc}</div>
              </div>
            </div>

            {/* Score hormonal */}
            {modal.hormonalScore && (
              <div style={{padding:"12px 16px",background:"var(--surface-0)",borderRadius:6,marginBottom:16,borderLeft:`3px solid ${modal.hormonalScore.color}`}}>
                <div style={{fontSize:10,color:"var(--text-3)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Score Hormonal</div>
                <div style={{fontSize:15,color:modal.hormonalScore.color,marginBottom:8}}>{modal.hormonalScore.label}</div>
                <div style={{fontSize:13,color:"var(--text-2)",lineHeight:1.7}}>{modal.hormonalScore.suggestion}</div>
                <div style={{display:"flex",gap:16,marginTop:10}}>
                  <div style={{fontSize:10,color:"var(--red)"}}>E2 alto: {modal.hormonalScore.highScore}%</div>
                  <div style={{fontSize:10,color:"var(--orange)"}}>E2 baixo: {modal.hormonalScore.lowScore}%</div>
                </div>
              </div>
            )}

            <div style={{fontSize:13,color:"var(--text-3)",fontStyle:"italic",marginBottom:16,paddingLeft:14,borderLeft:"2px solid var(--brand)"}}>{modal.report}</div>

            {modal.suggestions.length > 0 ? (
              <>
                {/* Conversational summary */}
                <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"14px 16px",marginBottom:12,border:"1px solid rgba(255,255,255,0.05)"}}>
                  <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Resumo da semana</div>
                  {Object.entries(modal.scores||{}).slice(0,5).map(([id,v])=>{
                    const cat = ALL_CATEGORIES.find(c=>c.id===id);
                    if (!cat) return null;
                    const prev = (modal.prevScores||{})[id];
                    const dir = prev!==undefined?(v>prev?"melhorou":v<prev?"caiu":null):null;
                    const col = v>=4?"var(--green)":v===3?"var(--amber)":"var(--red)";
                    if (!dir && v>=4) return <div key={id} style={{fontSize:13,color:"var(--text-2)",marginBottom:5,display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--green)"}}>✓</span> {cat.label} adequado.</div>;
                    if (dir==="melhorou") return <div key={id} style={{fontSize:13,color:"var(--text-2)",marginBottom:5,display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--green)"}}>↑</span> {cat.label} melhorou.</div>;
                    if (dir==="caiu") return <div key={id} style={{fontSize:13,color:"var(--text-2)",marginBottom:5,display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--red)"}}>↓</span> {cat.label} caiu.</div>;
                    if (v<=2) return <div key={id} style={{fontSize:13,color:"var(--text-2)",marginBottom:5,display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--red)"}}>⚠</span> {cat.label} precisa de atenção.</div>;
                    return null;
                  })}
                </div>

                <div style={{fontSize:10,color:"var(--text-3)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Recomendações</div>
                {modal.suggestions.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:8,padding:"12px 14px",background:"var(--surface-0)",borderRadius:8,borderLeft:`3px solid ${s.priority?"var(--red)":"var(--brand)"}`,border:`1px solid ${s.priority?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.04)"}`,borderLeftWidth:3}}>
                    <span style={{fontSize:15,flexShrink:0}}>{s.icon}</span>
                    <div>
                      <div style={{fontSize:10,color:s.priority?"var(--red)":"var(--text-3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>{s.area}</div>
                      <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.6}}>{s.text}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{fontSize:12,color:"var(--text-3)",padding:"12px 14px",background:"var(--surface-0)",borderRadius:6}}>✅ Biofeedback positivo — mantenha o protocolo.</div>
            )}

            {/* ── J3U Analysis ── */}
            {modal.j3uAnalysis && (()=>{
              const a = modal.j3uAnalysis;
              return (
                <div style={{marginTop:16,borderTop:"1px solid rgba(59,130,246,0.15)",paddingTop:16}}>
                  <div style={{fontSize:10,color:"#60a5fa",letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>🎓 Análise J3U</div>

                  {/* Score J3U */}
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12,padding:"12px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:`1px solid ${a.classification.color}30`}}>
                    <div style={{textAlign:"center",minWidth:56}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:a.classification.color,lineHeight:1}}>{a.j3uScore}</div>
                      <div style={{fontSize:9,color:"var(--text-4)",letterSpacing:".08em"}}>/{a.answeredCount*2}</div>
                    </div>
                    <div>
                      <div style={{fontSize:13,color:a.classification.color,fontWeight:500,marginBottom:3}}>{a.classification.label}</div>
                      <div style={{fontSize:12,color:"var(--text-3)"}}>{a.classification.action}</div>
                    </div>
                  </div>

                  {/* Fase estimada */}
                  {a.phase.phase && (
                    <div style={{marginBottom:10,padding:"10px 14px",background:"rgba(0,0,0,0.2)",borderRadius:6,borderLeft:`3px solid ${a.phase.color||"#3b82f6"}`}}>
                      <div style={{fontSize:11,color:a.phase.color||"#3b82f6",fontWeight:500,marginBottom:3}}>{a.phase.label}</div>
                      <div style={{fontSize:11,color:"var(--text-3)",lineHeight:1.5}}>{a.phase.note}</div>
                    </div>
                  )}
                  {!a.phase.phase && (
                    <div style={{marginBottom:10,fontSize:11,color:"var(--text-4)",fontStyle:"italic"}}>{a.phase.label}</div>
                  )}

                  {/* Conflitos e insights */}
                  {(a.conflicts.length>0||a.insights.length>0) && (
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Leitura integrada</div>
                      {a.conflicts.map((c,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:6,padding:"8px 12px",background:c.type==="warn"?"rgba(239,68,68,0.06)":"rgba(59,130,246,0.06)",borderRadius:6,borderLeft:`2px solid ${c.type==="warn"?"var(--red)":"var(--brand)"}`}}>
                          <span style={{fontSize:13,flexShrink:0}}>{c.type==="warn"?"⚠":"ℹ"}</span>
                          <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.5}}>{c.text}</div>
                        </div>
                      ))}
                      {a.insights.map((ins,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:6,padding:"8px 12px",background:"rgba(34,197,94,0.06)",borderRadius:6,borderLeft:"2px solid var(--green)"}}>
                          <span style={{fontSize:13,flexShrink:0}}>✓</span>
                          <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.5}}>{ins}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Intervenções */}
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Ordem de intervenção</div>
                    {a.interventions.map((int,i)=>(
                      <div key={i} style={{marginBottom:8,padding:"10px 12px",background:"rgba(0,0,0,0.2)",borderRadius:6,border:"1px solid rgba(255,255,255,0.05)"}}>
                        <div style={{fontSize:12,color:"var(--text-1)",lineHeight:1.5,marginBottom:4}}>{int.action}</div>
                        <div style={{fontSize:10,color:"var(--text-4)",fontStyle:"italic"}}>{int.type}</div>
                      </div>
                    ))}
                  </div>

                  {/* Carboidratos */}
                  {a.carbSuggestion && (
                    <div style={{marginBottom:10,padding:"12px 14px",background:a.carbSuggestion.dir==="↑"?"rgba(34,197,94,0.06)":a.carbSuggestion.dir==="↓"?"rgba(239,68,68,0.06)":"rgba(59,130,246,0.06)",borderRadius:8,borderLeft:`3px solid ${a.carbSuggestion.dir==="↑"?"var(--green)":a.carbSuggestion.dir==="↓"?"var(--red)":"var(--brand)"}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:a.carbSuggestion.dir==="↑"?"var(--green)":a.carbSuggestion.dir==="↓"?"var(--red)":"var(--brand)"}}>{a.carbSuggestion.dir}</span>
                        <div style={{fontSize:13,color:"var(--text-1)",fontWeight:500}}>Carboidratos: {a.carbSuggestion.amount}</div>
                      </div>
                      <div style={{fontSize:12,color:"var(--text-2)",lineHeight:1.5,marginBottom:4}}>{a.carbSuggestion.reason}</div>
                      <div style={{fontSize:10,color:"var(--text-4)",fontStyle:"italic"}}>{a.carbSuggestion.type}</div>
                    </div>
                  )}

                  {/* Confiança */}
                  <div style={{padding:"8px 12px",background:"rgba(0,0,0,0.2)",borderRadius:6,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:11,color:a.confidence==="Alta"?"var(--green)":a.confidence==="Moderada"?"var(--amber)":"var(--red)",fontWeight:500,minWidth:70}}>Confiança: {a.confidence}</div>
                    <div style={{fontSize:11,color:"var(--text-3)",lineHeight:1.4}}>{a.confidenceNote}</div>
                  </div>
                </div>
              );
            })()}

            <div style={{display:"flex",justifyContent:"center"}}>
              <button className="close-btn" onClick={()=>{setModal(null);setView("history");}}>Ver histórico</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"rgba(7,12,20,0.95)",backdropFilter:"blur(16px)",zIndex:10,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#3b82f6,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,boxShadow:"0 0 16px rgba(59,130,246,0.45)"}}>⚡</div>
          <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".15em",color:"var(--text-1)"}}>CALIBRA</div>
          <div style={{fontSize:9,color:"var(--text-4)",letterSpacing:".12em",textTransform:"uppercase",marginTop:1}}>Performance Intelligence</div>
        </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:999,padding:3,gap:2}}>
            {[["form","Avaliação"],["history",`Histórico${history.length>0?` (${history.length})`:""}`,],["compare","Comparar"],["profile","Perfil"],["about","Escala"]].map(([v,l])=>(
              <button key={v} className={`tab-btn ${view===v?"active":""}`} onClick={()=>setView(v)}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            <button className="ghost-btn" onClick={handleExport} title="Backup JSON" style={{padding:"5px 10px"}}>⬇</button>
            <label className="ghost-btn" style={{cursor:"pointer",padding:"5px 10px"}} title="Importar backup">⬆<input type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/></label>
            <button className="ghost-btn" style={{borderColor:"rgba(100,40,40,0.4)",color:"#885555",padding:"5px 10px"}} onClick={handleLogout} title="Sair">⏻</button>
          </div>
        </div>
      </div>

      {/* Sparkline comentado temporariamente */}
{/* {historyWithScore.length >= 2 && ( ... )} */}
          {/* Score hero card */}
          {/* ── HERO CARD — Whoop/Oura style ── */}
         {/* HERO MELHORADO - COMPACT + TREND */}
<div className="card-hero" style={{padding:"20px 24px 18px", marginBottom:16}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
    <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".2em",textTransform:"uppercase"}}>PRONTIDÃO</div>
    {delta !== null && (
      <div style={{fontSize:11,color:delta>=0?"var(--green)":"var(--red)"}}>
        {delta >= 0 ? `▲ +${delta}` : `▼ ${delta}`} pts
      </div>
    )}
  </div>

  <div style={{display:"flex",alignItems:"center",gap:24}}>
    <div style={{minWidth:110}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:82,lineHeight:1,color:score!==null?scoreInfo.color:"var(--text-4)"}}>
        {displayScore !== null ? displayScore : "--"}
      </div>
      <div style={{fontSize:13,color:scoreInfo?.color || "var(--text-4)"}}>
        {score !== null ? scoreInfo.label : "Avalie abaixo"}
      </div>
    </div>

    {score !== null && (
      <div style={{flex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:999,background:scoreInfo.bg}}>
          <span style={{color:scoreInfo.color}}>●</span>
          <span style={{color:scoreInfo.color,fontWeight:500}}>{scoreInfo.readinessLabel}</span>
        </div>
      </div>
    )}
  </div>

  <div style={{marginTop:18}}>
    <div style={{display:"flex",gap:3,height:5,borderRadius:999,overflow:"hidden",background:"rgba(255,255,255,0.08)"}}>
      {Array.from({length:10}).map((_,i) => (
        <div key={i} style={{flex:1,background:score && i < Math.round(score/10) ? "linear-gradient(90deg,var(--brand),#60a5fa)" : "transparent",transition:"all 0.5s ease"}} />
      ))}
    </div>
  </div>
</div>

            <div style={{display:"flex",alignItems:"center",gap:24}}>
              {/* Score number */}
              <div style={{minWidth:120}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:96,lineHeight:1,color:score!==null?scoreInfo.color:"var(--text-4)",textShadow:score!==null?`0 0 80px ${scoreInfo.color}35`:"none",letterSpacing:".01em"}}>
                  {displayScore!==null?displayScore:"--"}
                </div>
                <div style={{fontSize:12,letterSpacing:".15em",textTransform:"uppercase",color:score!==null?scoreInfo.color:"var(--text-4)",marginTop:2,fontWeight:600}}>
                  {score!==null?scoreInfo.label:"Avaliar"}
                </div>
              </div>

              {/* Right side: readiness + indicators */}
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                {score!==null ? (
                  <>
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:999,width:"fit-content",background:scoreInfo.readiness==="verde"?"rgba(34,197,94,0.1)":scoreInfo.readiness==="amarelo"?"rgba(234,179,8,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${scoreInfo.readiness==="verde"?"rgba(34,197,94,0.25)":scoreInfo.readiness==="amarelo"?"rgba(234,179,8,0.25)":"rgba(239,68,68,0.25)"}`}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:scoreInfo.readiness==="verde"?"var(--green)":scoreInfo.readiness==="amarelo"?"var(--amber)":"var(--red)"}}/>
                      <span style={{fontSize:11,color:scoreInfo.readiness==="verde"?"var(--green)":scoreInfo.readiness==="amarelo"?"var(--amber)":"var(--red)",letterSpacing:".06em"}}>{scoreInfo.readinessLabel}</span>
                    </div>
                    {/* Category indicators */}
                    {totalAnswered>=3 && (()=>{
                      const indicators = Object.entries(fullScoresLive)
                        .filter(([,v])=>v!==undefined)
                        .map(([id,v])=>{
                          const cat = ALL_CATEGORIES.find(c=>c.id===id);
                          if(!cat) return null;
                          const prev = historyWithScore[0]?.scores?.[id];
                          const dir = prev!==undefined ? (v>prev?'↑':v<prev?'↓':'→') : null;
                          return {cat, v, dir};
                        })
                        .filter(Boolean)
                        .sort((a,b)=>a.v-b.v)
                        .slice(0,4);
                      return (
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {indicators.map(({cat,v,dir})=>{
                            const col = v>=4?"var(--green)":v===3?"var(--amber)":"var(--red)";
                            return (
                              <div key={cat.id} style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:`${col}12`,color:col,border:`1px solid ${col}25`,display:"flex",alignItems:"center",gap:3}}>
                                {cat.icon} {cat.label.split(" ")[0]} {dir&&<span style={{opacity:.7}}>{dir}</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div style={{fontSize:12,color:"var(--text-4)",lineHeight:1.6}}>Responda os critérios abaixo para ver seu score de prontidão</div>
                )}
              </div>
            </div>

            {/* Segmented progress bar */}
            <div style={{marginTop:16}}>
              <div style={{display:"flex",gap:3,marginBottom:6}}>
                {Array.from({length:9}).map((_,i)=>{
                  const filled = score!==null ? Math.round((score/100)*9) : totalAnswered;
                  return <div key={i} style={{flex:1,height:3,borderRadius:99,background:i<filled?"linear-gradient(90deg,var(--brand),#60a5fa)":"rgba(255,255,255,0.05)",boxShadow:i<filled?"0 0 4px rgba(59,130,246,0.35)":"none",transition:`all .3s ${i*0.04}s`}}/>;
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".08em"}}>{totalAnswered} de {7+J3U_DOMAINS.length} respondidos</div>
                {score!==null && <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".06em"}}>{score}% prontidão</div>}
              </div>
            </div>
          </div>

{/* ── Tendência histórica mini sparkline ── */}
{historyWithScore.length >= 2 && (
  <div style={{marginTop:12,padding:"8px 0",borderTop:"1px solid var(--border)"}}>
    <div style={{fontSize:10,color:"var(--text-4)",marginBottom:6}}>Tendência últimas 6 semanas</div>
    <div style={{fontSize:11,color:"var(--text-2)"}}>
      Último: <strong>{historyWithScore[0].score}</strong> pts 
      {historyWithScore.length >= 2 && ` (Δ ${historyWithScore[0].score - historyWithScore[1].score} pts)`}
    </div>
  </div>
)}

          {/* ── Status atual baseado nas respostas ── */}
          {totalAnswered >= 3 && (()=>{
            const items = CATEGORIES
              .filter(c => scores[c.id] !== undefined)
              .map(c => ({
                cat: c,
                val: scores[c.id],
                ok: scores[c.id] >= 4,
                warn: scores[c.id] === 3,
                bad: scores[c.id] <= 2,
              }));
            const good = items.filter(i=>i.ok);
            const warn = items.filter(i=>i.warn);
            const bad = items.filter(i=>i.bad);
            if (good.length===0 && warn.length===0 && bad.length===0) return null;
            return (
              <div style={{background:"linear-gradient(180deg,#101827,#0c1423)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"var(--radius)",padding:"12px 16px",marginBottom:8}}>
                <div style={{fontSize:9,color:"var(--text-4)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:10}}>Status Atual</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {bad.map(i=>(
                    <div key={i.cat.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--text-2)"}}>
                      <span style={{fontSize:10}}>🔴</span>
                      <span style={{color:"var(--red)"}}>{i.cat.label}</span>
                      <span style={{color:"var(--text-4)",fontSize:11}}>— atenção necessária</span>
                    </div>
                  ))}
                  {warn.map(i=>(
                    <div key={i.cat.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--text-2)"}}>
                      <span style={{fontSize:10}}>🟡</span>
                      <span style={{color:"var(--amber)"}}>{i.cat.label}</span>
                      <span style={{color:"var(--text-4)",fontSize:11}}>— pode melhorar</span>
                    </div>
                  ))}
                  {good.map(i=>(
                    <div key={i.cat.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--text-2)"}}>
                      <span style={{fontSize:10}}>🟢</span>
                      <span style={{color:"var(--green)"}}>{i.cat.label}</span>
                      <span style={{color:"var(--text-4)",fontSize:11}}>— positivo</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Semana */}
          <div style={{display:"flex",gap:10,margin:"16px 0 20px",alignItems:"center"}}>
            <input type="text" placeholder="Semana (ex: S23 · 02–08 jun)" value={week} onChange={e=>setWeek(e.target.value)} style={{flex:1}}/>
            <button className="ghost-btn" onClick={()=>setShowWeights(v=>!v)}>{showWeights?"Fechar":"⚙ Pesos"}</button>
          </div>

          {/* Pesos */}
          {showWeights && (
            <div className="card" style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div className="section-title" style={{margin:0}}>Pesos (%)</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:10,color:totalWeightSum===100?"#22c55e":"#ef4444"}}>Soma: {totalWeightSum}%</span>
                  <button className="ghost-btn" onClick={resetWeights}>Resetar</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {CATEGORIES.map(cat=>(
                  <div key={cat.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <span style={{fontSize:13,color:"var(--text-2)"}}>{cat.icon} {cat.label}</span>
                    <input type="number" className="weight-input" min={0} max={50} value={weights[cat.id]} onChange={e=>handleWeightChange(cat.id,e.target.value)}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Calibra-exclusive: Dor Articular + Pump ── */}
          <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:8,marginTop:4,display:"flex",alignItems:"center",gap:8}}>
            Critérios exclusivos Calibra
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,0.05),transparent)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8,marginBottom:8}}>
          {CATEGORIES.map(cat=>{
            const catColors={"joints":"#f97316","pump":"#06b6d4"};
            const cc=catColors[cat.id]||"var(--brand)";
            const selected=scores[cat.id];
            const selectedOpt=selected?cat.options.find(o=>o.value===selected):null;
            return (
              <div key={cat.id} style={{
                background:"linear-gradient(180deg,#101827,#0c1423)",
                border:`1px solid ${selected?`${selectedOpt?.color}30`:"rgba(255,255,255,0.06)"}`,
                borderLeft:`3px solid ${selected?selectedOpt?.color:cc}`,
                borderRadius:"var(--radius)",padding:"14px 16px",
                transition:"all .2s",
                boxShadow:"0 6px 20px rgba(0,0,0,0.25)",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div className="cat-icon" style={{background:`${cc}18`,border:`1px solid ${cc}30`,width:32,height:32}}>
                    {cat.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,letterSpacing:".08em",textTransform:"uppercase",color:selected?selectedOpt?.color:"var(--text-1)",fontWeight:700,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span>{cat.label}</span>
                      <span style={{fontSize:9,color:"var(--text-4)",textTransform:"none",letterSpacing:0,fontWeight:400,background:"rgba(255,255,255,0.05)",padding:"1px 5px",borderRadius:3}}>×{weights[cat.id]}%</span>
                      {selected && <span style={{fontSize:9,color:"var(--green)",marginLeft:"auto",background:"rgba(34,197,94,0.1)",padding:"1px 7px",borderRadius:999,border:"1px solid rgba(34,197,94,0.2)"}}>✓</span>}
                    </div>
                    <div style={{fontSize:12,color:"var(--text-3)",marginTop:2,lineHeight:1.4}}>{cat.description}</div>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {cat.options.map(opt=>(
                    <button key={opt.value} className={`opt-btn ${scores[cat.id]===opt.value?"selected":""}`}
                      style={scores[cat.id]===opt.value?{borderColor:opt.color,color:"#fff",background:`${opt.color}22`,boxShadow:`0 0 0 1px ${opt.color}55, 0 0 20px ${opt.color}25`,transform:"translateY(-1px)"}:{}}
                      onClick={()=>setScores(s=>({...s,[cat.id]:opt.value}))}>
                      {scores[cat.id]===opt.value?"✓ ":""}{opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          </div>

          {/* Performance Anchor Sets */}
          <div className="card">
            <div className="section-title">⚡ Performance Anchor Sets</div>
            {/* Table header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 72px 64px 64px 32px",gap:6,marginBottom:6,padding:"0 4px"}}>
              {["Exercício","Peso","Reps","Δ Vol",""].map(h=>(
                <div key={h} style={{fontSize:9,color:"var(--text-4)",letterSpacing:".1em",textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
            {anchors.map((a,i)=>{
              const prevAnchor = historyWithScore[0]?.anchors?.find(p=>p.exercise?.toLowerCase()===a.exercise?.toLowerCase());
              const volCurr = a.weight && a.reps ? parseFloat(a.weight)*parseFloat(a.reps) : null;
              const volPrev = prevAnchor?.weight && prevAnchor?.reps ? parseFloat(prevAnchor.weight)*parseFloat(prevAnchor.reps) : null;
              const delta = volCurr!==null && volPrev!==null ? volCurr - volPrev : null;
              return (
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 72px 64px 64px 32px",gap:6,marginBottom:6,alignItems:"center"}}>
                  <input type="text" placeholder="ex: Supino" value={a.exercise} onChange={e=>{const n=[...anchors];n[i]={...n[i],exercise:e.target.value};setAnchors(n);}} style={{fontSize:13}}/>
                  <input type="number" placeholder="kg" value={a.weight} onChange={e=>{const n=[...anchors];n[i]={...n[i],weight:e.target.value};setAnchors(n);}} style={{textAlign:"center"}}/>
                  <input type="number" placeholder="reps" value={a.reps} onChange={e=>{const n=[...anchors];n[i]={...n[i],reps:e.target.value};setAnchors(n);}} style={{textAlign:"center"}}/>
                  <div style={{textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:delta===null?"var(--text-4)":delta>0?"var(--green)":delta<0?"var(--red)":"var(--text-3)"}}>
                    {delta===null?"—":delta>0?`+${delta}`:delta}
                  </div>
                  <button className="del-btn" onClick={()=>setAnchors(anchors.filter((_,j)=>j!==i))}>✕</button>
                </div>
              );
            })}
            <button className="ghost-btn" style={{marginTop:6}} onClick={()=>setAnchors([...anchors,{exercise:"",weight:"",reps:""}])}>+ Exercício</button>

            {/* Comparação automática com semana anterior */}
            {historyWithScore.length > 0 && anchors.some(a=>a.exercise.trim()) && (() => {
              const prev = historyWithScore[0];
              const prevAnchors = prev.anchors || [];
              const comparisons = anchors
                .filter(a=>a.exercise.trim() && a.weight && a.reps)
                .map(a=>{
                  const match = prevAnchors.find(p=>p.exercise.toLowerCase()===a.exercise.toLowerCase());
                  if (!match) return null;
                  const volumeDiff = (parseFloat(a.weight)*parseFloat(a.reps)) - (parseFloat(match.weight)*parseFloat(match.reps));
                  return {exercise:a.exercise, curr:`${a.weight}kg × ${a.reps}`, prev:`${match.weight}kg × ${match.reps}`, diff:volumeDiff};
                }).filter(Boolean);
              if (comparisons.length === 0) return null;
              return (
                <div style={{marginTop:12,padding:"10px 12px",background:"var(--surface-0)",borderRadius:4}}>
                  <div style={{fontSize:12,color:"var(--text-3)",letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>vs semana anterior</div>
                  {comparisons.map((c,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,color:"var(--text-3)",flex:1}}>{c.exercise}</span>
                      <span style={{fontSize:10,color:"var(--text-3)"}}>{c.prev}</span>
                      <span style={{fontSize:10,color:"var(--text-4)"}}>→</span>
                      <span style={{fontSize:11,color:c.diff>0?"#22c55e":c.diff<0?"#ef4444":"var(--text-2)"}}>{c.curr}</span>
                      {c.diff!==0 && <span style={{fontSize:10,color:c.diff>0?"#22c55e":"#ef4444"}}>{c.diff>0?"+":""}{c.diff.toFixed(0)}vol</span>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Macros */}
          <div className="card">
            <div className="section-title">🔢 Macros (média diária)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {id:"calories",label:"KCAL",icon:"🔥",color:"#f97316"},
                {id:"protein",label:"PROTEÍNA",icon:"🥩",color:"#22c55e"},
                {id:"carbs",label:"CARBS",icon:"🍚",color:"#3b82f6"},
                {id:"fat",label:"GORDURA",icon:"🥑",color:"#eab308"},
              ].map(f=>(
                <div key={f.id} style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${f.color}20`,borderRadius:10,padding:"12px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:8,right:10,fontSize:20,opacity:.15}}>{f.icon}</div>
                  <div style={{fontSize:9,color:"var(--text-4)",letterSpacing:".12em",marginBottom:6}}>{f.icon} {f.label}</div>
                  <input
                    type="number" step="1" placeholder="—"
                    value={macros[f.id]||""}
                    onChange={e=>setMacros(m=>({...m,[f.id]:e.target.value}))}
                    style={{background:"transparent",border:"none",padding:0,fontSize:28,fontFamily:"'Bebas Neue',sans-serif",color:macros[f.id]?f.color:"var(--text-4)",letterSpacing:".02em",width:"100%",boxShadow:"none"}}
                  />
                  {macros[f.id] && <div style={{fontSize:10,color:"var(--text-4)",marginTop:2,letterSpacing:".1em"}}>{f.label==="KCAL"?"kcal":"g"}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Saúde intestinal */}
          <div className="card">
            <div className="section-title">🫙 Saúde intestinal</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:13,color:"var(--text-2)",marginBottom:8}}>Frequência diária</div>
              <div style={{display:"flex",gap:6}}>
                {GUT_FREQ.map(f=>(
                  <button key={f.value} className={`opt-btn ${gut.frequency===f.value?"selected":""}`}
                    style={gut.frequency===f.value?{borderColor:"#84cc16",color:"#fff",background:"rgba(132,204,22,0.15)",boxShadow:"0 0 0 1px rgba(132,204,22,0.4), 0 0 16px rgba(132,204,22,0.15)"}:{}}
                    onClick={()=>setGut(g=>({...g,frequency:f.value}))}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:13,color:"var(--text-2)",marginBottom:8}}>Consistência das fezes</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {GUT_CONSISTENCY.map(opt=>(
                  <button key={opt.value} className={`opt-btn ${gut.consistency===opt.value?"selected":""}`}
                    style={gut.consistency===opt.value?{borderColor:opt.color,color:"#fff",background:`${opt.color}22`,boxShadow:`0 0 0 1px ${opt.color}55, 0 0 16px ${opt.color}18`}:{}}
                    onClick={()=>setGut(g=>({...g,consistency:opt.value}))}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Medidas objetivas */}
          <div className="card">
            <div className="section-title">📐 Medidas objetivas (opcional)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {OBJECTIVE_FIELDS.map(f=>(
                <div key={f.id} style={{display:"flex",flexDirection:"column",gap:3}}>
                  <label style={{fontSize:12,color:"var(--text-2)"}}>{f.label} ({f.unit})</label>
                  <input type="number" step="0.1" placeholder={f.placeholder} value={objective[f.id]||""} onChange={e=>setObjective(o=>({...o,[f.id]:e.target.value}))} style={{width:"100%"}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Foto da semana */}
          <div className="card">
            <div className="section-title">📸 Foto da semana (opcional)</div>
            {photo ? (
              <div style={{position:"relative",display:"inline-block"}}>
                <img src={photo} style={{maxWidth:"100%",maxHeight:200,borderRadius:4,border:"1px solid var(--border)"}} alt="foto semana"/>
                <button className="del-btn" style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.7)"}} onClick={()=>setPhoto(null)}>✕</button>
              </div>
            ) : (
              <label className="ghost-btn" style={{cursor:"pointer",display:"inline-block"}}>
                + Adicionar foto
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
              </label>
            )}
          </div>

          {/* Módulo Hormonal */}
          <div className="card" style={{border:"1px solid #2a1a4a"}}>
            <div className="section-title" style={{color:"#7c3aed"}}>💊 Uso de Esteroides Anabolizantes (EAs)</div>
            <div style={{fontSize:13,color:"var(--text-2)",marginBottom:12}}>Você usa Esteroides Anabolizantes (EAs) — incluindo TRT, testosterona, derivados ou outros compostos que possam afetar o balanço hormonal?</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <button className={`horm-btn ${usesHormones===true?"yes":""}`} onClick={()=>setUsesHormones(true)}>Sim</button>
              <button className={`horm-btn ${usesHormones===false?"no":""}`} onClick={()=>setUsesHormones(false)}>Não</button>
            </div>

            {usesHormones && (
              <div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:13,color:"#9d6aff",display:"block",marginBottom:6}}>Dose do Inibidor de Aromatase (AI) usado na semana</label>
                  <input type="text" placeholder="ex: Anastrozol 0.5mg 2x/semana ou Exemestane 12.5mg 2x/semana" value={hormonal.aiDose||""} onChange={e=>setHormonal(h=>({...h,aiDose:e.target.value}))} style={{width:"100%",borderColor:"#2a1a4a"}}/>
                </div>

                {[
                  { key:"libido", label:"Vontade e Iniciativa Sexual", opts:[{v:4,l:"Ótima"},{v:3,l:"Boa"},{v:2,l:"Ruim"},{v:1,l:"Inexistente"}] },
                  { key:"erection", label:"Ereção / Sensibilidade / Orgasmo", opts:[{v:4,l:"Ótima"},{v:3,l:"Boa"},{v:2,l:"Ruim"},{v:1,l:"Inexistente"}] },
                  { key:"joint", label:"Articulações", opts:[{v:2,l:"Ok"},{v:1,l:"Fraca ou estalando"}] },
                  { key:"mood", label:"Humor", opts:[{v:"sensitive",l:"Sensível / irritável"},{v:"normal",l:"Normal"},{v:"apathetic",l:"Apático"}] },
                ].map(field=>(
                  <div key={field.key} style={{marginBottom:12}}>
                    <div style={{fontSize:13,color:"var(--text-2)",marginBottom:8}}>{field.label}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {field.opts.map(opt=>(
                        <button key={opt.v} className={`opt-btn ${hormonal[field.key]===opt.v?"selected":""}`}
                          style={hormonal[field.key]===opt.v?{background:"#7c3aed",borderColor:"#7c3aed",color:"#fff"}:{}}
                          onClick={()=>setHormonal(h=>({...h,[field.key]:opt.v}))}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Ereção matinal */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"var(--text-3)",marginBottom:6}}>Ereção Matinal / Madrugada</div>
                  <div style={{fontSize:12,color:"var(--text-3)",marginBottom:8}}>Frequência semanal</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                    {[{v:"daily",l:"Diária"},{v:"frequent",l:"3–5x/semana"},{v:"rare",l:"1–2x/semana"},{v:"absent",l:"Ausente"}].map(opt=>(
                      <button key={opt.v} className={`opt-btn ${hormonal.morningErectionFreq===opt.v?"selected":""}`}
                        style={hormonal.morningErectionFreq===opt.v?{background:"#7c3aed",borderColor:"#7c3aed",color:"#fff"}:{}}
                        onClick={()=>setHormonal(h=>({...h,morningErectionFreq:opt.v}))}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:"var(--text-3)",marginBottom:8}}>Qualidade</div>
                  <div style={{display:"flex",gap:5}}>
                    {[{v:3,l:"Forte"},{v:2,l:"Fraca"},{v:1,l:"Inexistente"}].map(opt=>(
                      <button key={opt.v} className={`opt-btn ${hormonal.morningErectionQuality===opt.v?"selected":""}`}
                        style={hormonal.morningErectionQuality===opt.v?{background:"#7c3aed",borderColor:"#7c3aed",color:"#fff"}:{}}
                        onClick={()=>setHormonal(h=>({...h,morningErectionQuality:opt.v}))}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mamilo */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:13,color:"var(--text-2)",marginBottom:8}}>Sensibilidade no Mamilo</div>
                  <div style={{display:"flex",gap:5}}>
                    {[{v:"yes",l:"Sim — sensível / dolorido"},{v:"no",l:"Não"}].map(opt=>(
                      <button key={opt.v} className={`opt-btn ${hormonal.nipple===opt.v?"selected":""}`}
                        style={hormonal.nipple===opt.v?{background:opt.v==="yes"?"#ef4444":"#7c3aed",borderColor:opt.v==="yes"?"#ef4444":"#7c3aed",color:"#fff"}:{}}
                        onClick={()=>setHormonal(h=>({...h,nipple:opt.v}))}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  {hormonal.nipple === "yes" && (
                    <div style={{marginTop:8,fontSize:11,color:"var(--red)",padding:"8px 10px",background:"rgba(239,68,68,0.08)",borderRadius:4}}>
                      ⚠ Sensibilidade mamilar persistente (2+ dias) em usuários de EAs é sinal clássico de E2 elevado / início de ginecomastia. Não espere o check-in quinzenal — reavalie a dose do AI imediatamente.
                    </div>
                  )}
                </div>

                {/* Pele */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:13,color:"var(--text-2)",marginBottom:8}}>Oleosidade da Pele</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {[{v:"acne",l:"Alta com acne"},{v:"oily",l:"Alta"},{v:"normal",l:"Normal"},{v:"dry",l:"Seca"}].map(opt=>(
                      <button key={opt.v} className={`opt-btn ${hormonal.skin===opt.v?"selected":""}`}
                        style={hormonal.skin===opt.v?{background:"#7c3aed",borderColor:"#7c3aed",color:"#fff"}:{}}
                        onClick={()=>setHormonal(h=>({...h,skin:opt.v}))}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview score hormonal */}
                {computeHormonalScore(hormonal) && (() => {
                  const hs = computeHormonalScore(hormonal);
                  return (
                    <div style={{padding:"10px 14px",background:"var(--surface-0)",borderRadius:4,borderLeft:`3px solid ${hs.color}`}}>
                      <div style={{fontSize:10,color:"var(--text-3)",marginBottom:4}}>Score Hormonal Atual</div>
                      <div style={{fontSize:12,color:hs.color}}>{hs.label}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── J3U Score Block ── */}
          <div style={{background:"linear-gradient(180deg,#080f20,#050a16)",border:"1px solid rgba(96,165,250,0.18)",borderRadius:"var(--radius)",padding:"16px 18px",marginBottom:8,boxShadow:"0 0 40px rgba(59,130,246,0.05), 0 8px 24px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,rgba(96,165,250,0.2),rgba(59,130,246,0.1))",border:"1px solid rgba(96,165,250,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🎓</div>
              <div>
                <div style={{fontSize:12,letterSpacing:".1em",textTransform:"uppercase",color:"#60a5fa",fontWeight:600}}>Score J3U</div>
                <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".06em"}}>Metodologia Jewett · Miller</div>
              </div>
            </div>
            <details style={{marginBottom:14,cursor:"pointer"}}>
              <summary style={{fontSize:11,color:"var(--brand)",letterSpacing:".06em",listStyle:"none",display:"flex",alignItems:"center",gap:6,userSelect:"none"}}>
                <span style={{fontSize:12}}>ⓘ</span> Sobre a metodologia J3U
              </summary>
              <div style={{fontSize:12,color:"var(--text-3)",lineHeight:1.6,marginTop:8,padding:"10px 12px",background:"rgba(59,130,246,0.05)",borderRadius:6,borderLeft:"2px solid rgba(59,130,246,0.2)"}}>
                7 domínios · escala 0–14 · J3U University (Jewett &amp; Miller, J3U Ep. 221/224). As respostas aqui alimentam tanto o Score J3U quanto o Score Calibra — sem repetição. Limiares numéricos exatos não foram publicados formalmente pela J3U — os utilizados aqui são propostas operacionais.
              </div>
            </details>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10,marginBottom:4}}>
            {J3U_DOMAINS.map(domain=>(
              <div key={domain.id} style={{marginBottom:8,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:13,color:"var(--text-2)",marginBottom:7,display:"flex",alignItems:"center",gap:6}}>
                  <span>{domain.icon}</span> {domain.label}
                  {j3u[domain.id]!==undefined && (
                    <span style={{marginLeft:"auto",fontSize:10,color:j3u[domain.id]===2?"var(--green)":j3u[domain.id]===1?"var(--amber)":"var(--red)",background:j3u[domain.id]===2?"rgba(34,197,94,0.1)":j3u[domain.id]===1?"rgba(234,179,8,0.1)":"rgba(239,68,68,0.1)",padding:"1px 8px",borderRadius:999,border:`1px solid ${j3u[domain.id]===2?"rgba(34,197,94,0.25)":j3u[domain.id]===1?"rgba(234,179,8,0.25)":"rgba(239,68,68,0.25)"}`}}>
                      {j3u[domain.id]===2?"✓ Adequado":j3u[domain.id]===1?"⚠ Atenção":"✗ Ruim"}
                    </span>
                  )}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {domain.opts.map(opt=>(
                    <button key={opt.v} className={`opt-btn ${j3u[domain.id]===opt.v?"selected":""}`}
                      style={j3u[domain.id]===opt.v?{
                        borderColor:opt.v===2?"#22c55e":opt.v===1?"#eab308":"#ef4444",
                        color:"#fff",
                        background:opt.v===2?"rgba(34,197,94,0.18)":opt.v===1?"rgba(234,179,8,0.18)":"rgba(239,68,68,0.18)",
                        boxShadow:opt.v===2?"0 0 0 1px rgba(34,197,94,0.4),0 0 16px rgba(34,197,94,0.15)":opt.v===1?"0 0 0 1px rgba(234,179,8,0.4),0 0 16px rgba(234,179,8,0.15)":"0 0 0 1px rgba(239,68,68,0.4),0 0 16px rgba(239,68,68,0.15)",
                        transform:"translateY(-1px)"
                      }:{}}
                      onClick={()=>setJ3u(s=>({...s,[domain.id]:opt.v}))}>
                      {j3u[domain.id]===opt.v?"✓ ":""}{opt.l}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            </div>

            {/* J3U Score preview */}
            {(()=>{
              const s = computeJ3UScore(j3u);
              const answered = J3U_DOMAINS.filter(d=>j3u[d.id]!==undefined).length;
              if (answered < 4) return (
                <div style={{fontSize:12,color:"var(--text-4)",fontStyle:"italic",marginTop:8}}>Responda pelo menos 4 domínios para ver o score J3U.</div>
              );
              const cls = getJ3UClassification(s, answered);
              return (
                <div style={{marginTop:12,padding:"14px 16px",background:"rgba(0,0,0,0.3)",borderRadius:8,borderLeft:`3px solid ${cls.color}`,display:"flex",alignItems:"center",gap:16}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,color:cls.color,lineHeight:1,textShadow:`0 0 24px ${cls.color}50`}}>{s}</div>
                    <div style={{fontSize:9,color:"var(--text-4)",letterSpacing:".1em",marginTop:2}}>/ {answered*2}</div>
                  </div>
                  <div>
                    <div style={{fontSize:13,color:cls.color,fontWeight:500,marginBottom:4}}>{cls.label}</div>
                    <div style={{fontSize:12,color:"var(--text-3)",lineHeight:1.5}}>{cls.action}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Observações */}
          <textarea placeholder="Observações: ajuste de calorias, intercorrências, deload..." value={notes} onChange={e=>setNotes(e.target.value)} style={{width:"100%",marginTop:4,minHeight:64,resize:"vertical"}}/>

          <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}>
            <button className="save-btn" onClick={handleSave} disabled={!week.trim()||totalAnswered===0}>Salvar semana</button>
          </div>
        </div>
      )}

      {/* ══ HISTÓRICO ══ */}
      {view === "history" && (
        <div style={{maxWidth:680,margin:"0 auto",padding:"24px 20px 60px"}}>
          {history.length === 0 ? (
            <div style={{textAlign:"center",color:"var(--text-3)",fontSize:13,marginTop:60}}>Nenhum check-in salvo ainda.</div>
          ) : (
            <>
              {historyWithScore.length >= 2 && (
                <div style={{background:"linear-gradient(180deg,var(--surface-2),var(--surface-1))",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"16px 18px",marginBottom:16}}>
                  <div className="section-title">Últimas {Math.min(4,last4.length)} semanas</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                    {[{label:"Média",value:avg4,suffix:""},{label:"Melhor",value:best,suffix:""},{label:"Pior",value:worst,suffix:""},{label:"Tendência",value:trend4!==null?(trend4>0?`+${trend4}`:trend4):null,suffix:"pts",color:trend4>0?"#22c55e":trend4<0?"#ef4444":"var(--text-2)"}].map(s=>(
                      <div key={s.label} style={{textAlign:"center"}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:s.color||(s.value!==null?getScoreInfo(s.value).color:"var(--text-4)"),lineHeight:1}}>{s.value!==null?`${s.value}${s.suffix}`:"—"}</div>
                        <div style={{fontSize:9,color:"var(--text-3)",marginTop:3,letterSpacing:".08em",textTransform:"uppercase"}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {(()=>{
                    const pts=[...historyWithScore].reverse();
                    if(pts.length<2) return null;
                    const vals=pts.map(p=>p.score),min=Math.min(...vals)-8,max=Math.max(...vals)+8;
                    const toX=i=>(i/(pts.length-1))*100,toY=s=>44-((s-min)/(max-min))*44;
                    const pathD=pts.map((p,i)=>`${i===0?"M":"L"} ${toX(i)} ${toY(p.score)}`).join(" ");
                    return (
                      <>
                        <svg width="100%" viewBox="-2 -6 104 56" preserveAspectRatio="none" style={{height:52}}>
                          <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">{pts.map((p,i)=><stop key={i} offset={`${(i/(pts.length-1))*100}%`} stopColor={getScoreInfo(p.score).color}/>)}</linearGradient></defs>
                          <path d={pathD} fill="none" stroke="url(#lg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          {pts.map((p,i)=><circle key={i} cx={toX(i)} cy={toY(p.score)} r="3" fill={getScoreInfo(p.score).color}/>)}
                        </svg>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                          {pts.map((p,i)=><div key={i} style={{fontSize:9,color:"var(--text-4)",textAlign:"center"}}>{p.week.split("·")[0]?.trim()||p.week}</div>)}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:10}}>
              {history.map((entry,i)=>{
                const info=entry.score!==null?getScoreInfo(entry.score):null;
                const prevEntry=historyWithScore[historyWithScore.indexOf(entry)+1]||null;
                const diff=prevEntry&&entry.score!==null?entry.score-prevEntry.score:null;
                return (
                  <div key={i} style={{background:"linear-gradient(180deg,var(--surface-2),var(--surface-1))",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"16px 20px",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:15,color:"var(--text-1)",fontWeight:500}}>{entry.week}</div>
                        <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>{entry.date}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {info && (
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:info.color,lineHeight:1,textShadow:`0 0 20px ${info.color}50`}}>{entry.score}</div>
                            {diff!==null&&<div style={{fontSize:9,color:diff>0?"var(--green)":diff<0?"var(--red)":"var(--text-3)"}}>{diff>0?`+${diff}`:diff} pts</div>}
                          </div>
                        )}
                        {entry.hormonalScore && (
                          <div style={{padding:"3px 8px",borderRadius:3,background:`${entry.hormonalScore.color}15`,border:`1px solid ${entry.hormonalScore.color}40`,fontSize:11,color:entry.hormonalScore.color}}>
                            💊 {entry.hormonalScore.status==="high"?"E2↑":entry.hormonalScore.status==="low"?"E2↓":"E2✓"}
                          </div>
                        )}
                        {entry.j3u && computeJ3UScore(entry.j3u) !== null && (()=>{
                          const s = computeJ3UScore(entry.j3u);
                          const ans = J3U_DOMAINS.filter(d=>entry.j3u[d.id]!==undefined).length;
                          const cls = getJ3UClassification(s, ans);
                          return (
                            <div style={{padding:"3px 8px",borderRadius:3,background:`${cls.color}15`,border:`1px solid ${cls.color}40`,fontSize:11,color:cls.color}}>
                              🎓 J3U {s}/{ans*2}
                            </div>
                          );
                        })()}
                        <button className="del-btn" onClick={()=>handleDeleteEntry(i)}>✕</button>
                      </div>
                    </div>

                    {info && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><div style={{width:6,height:6,borderRadius:"50%",background:info.readiness==="verde"?"#22c55e":info.readiness==="amarelo"?"#eab308":"#ef4444"}}/><div style={{fontSize:12,color:"var(--text-2)"}}>{info.readinessLabel}</div></div>}

                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                      {CATEGORIES.map(cat=>{const val=entry.scores[cat.id];if(!val) return null;const opt=cat.options.find(o=>o.value===val);return <div key={cat.id} style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:`${opt.color}18`,color:opt.color,border:`1px solid ${opt.color}35`}}>{cat.icon} {cat.label.split(" ")[0]}</div>;})}
                    </div>

                    {/* Anchors no histórico */}
                    {entry.anchors && entry.anchors.length > 0 && (
                      <div style={{marginBottom:8,padding:"8px 10px",background:"var(--surface-0)",borderRadius:4}}>
                        {entry.anchors.map((a,j)=><div key={j} style={{fontSize:13,color:"var(--text-2)"}}>{a.exercise}: <span style={{color:"#bbb"}}>{a.weight}kg × {a.reps} reps</span></div>)}
                      </div>
                    )}

                    {entry.macros && Object.values(entry.macros).some(v=>v) && (
                      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8,padding:"6px 10px",background:"var(--surface-0)",borderRadius:4}}>
                        {MACRO_FIELDS.map(f=>{const v=entry.macros[f.id];if(!v) return null;return <div key={f.id} style={{fontSize:12,color:"var(--text-3)"}}>{f.label}: <span style={{color:"var(--text-2)"}}>{v}{f.unit}</span></div>;})}
                      </div>
                    )}

                    {entry.photo && <img src={entry.photo} style={{maxWidth:"100%",maxHeight:160,borderRadius:4,border:"1px solid var(--border)",marginBottom:8,display:"block"}} alt="foto"/>}

                    {entry.report && <div style={{fontSize:12,color:"var(--text-3)",borderTop:"1px solid var(--border)",paddingTop:10,marginTop:6,fontStyle:"italic"}}>{entry.report}</div>}
                    {entry.notes && <div style={{fontSize:13,color:"var(--text-3)",borderTop:"1px solid var(--border)",paddingTop:10,marginTop:6}}>{entry.notes}</div>}
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ COMPARADOR ══ */}
      {view === "compare" && (
        <div style={{maxWidth:680,margin:"0 auto",padding:"24px 20px 60px"}}>
          <div className="section-title" style={{fontSize:14,color:"var(--text-2)"}}>Comparador de semanas</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
            {[["A",compareA,setCompareA],["B",compareB,setCompareB]].map(([label,val,setter])=>(
              <div key={label}>
                <div style={{fontSize:10,color:"var(--text-3)",marginBottom:6}}>Semana {label}</div>
                <select value={val} onChange={e=>setter(e.target.value)} style={{width:"100%"}}>
                  <option value="">Selecionar...</option>
                  {history.map((h,i)=><option key={i} value={h.week}>{h.week}</option>)}
                </select>
              </div>
            ))}
          </div>

          {entryA && entryB && (
            <div>
              {/* Score geral */}
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,marginBottom:20,alignItems:"center",textAlign:"center"}}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:entryA.score?getScoreInfo(entryA.score).color:"var(--text-4)"}}>{entryA.score||"—"}</div>
                  <div style={{fontSize:11,color:"var(--text-3)"}}>{entryA.week}</div>
                </div>
                <div style={{fontSize:20,color:"var(--text-4)"}}>vs</div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:entryB.score?getScoreInfo(entryB.score).color:"var(--text-4)"}}>{entryB.score||"—"}</div>
                  <div style={{fontSize:11,color:"var(--text-3)"}}>{entryB.week}</div>
                </div>
              </div>

              {/* Delta por critério */}
              <div className="card">
                <div className="section-title">Delta por critério</div>
                {CATEGORIES.map(cat=>{
                  const va=entryA.scores[cat.id], vb=entryB.scores[cat.id];
                  if(!va&&!vb) return null;
                  const diff=(va||0)-(vb||0);
                  const maxW=80;
                  return (
                    <div key={cat.id} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,color:"var(--text-2)"}}>{cat.icon} {cat.label}</span>
                        <span style={{fontSize:13,color:diff>0?"#22c55e":diff<0?"#ef4444":"var(--text-2)"}}>{va||"—"} vs {vb||"—"} {diff!==0?`(${diff>0?"+":""}${diff})`:""}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                        {[{v:va,c:entryA.week},{v:vb,c:entryB.week}].map((x,i)=>(
                          <div key={i} style={{height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                            <div style={{width:`${((x.v||0)/5)*100}%`,height:"100%",background:x.v?cat.options.find(o=>o.value===x.v)?.color||"var(--text-3)":"transparent",borderRadius:2,transition:"width .3s"}}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anchors comparação */}
              {(entryA.anchors?.length > 0 || entryB.anchors?.length > 0) && (
                <div className="card">
                  <div className="section-title">⚡ Performance Anchors</div>
                  {[...new Set([...(entryA.anchors||[]).map(a=>a.exercise),...(entryB.anchors||[]).map(a=>a.exercise)])].map(ex=>{
                    const a=entryA.anchors?.find(x=>x.exercise===ex);
                    const b=entryB.anchors?.find(x=>x.exercise===ex);
                    const volA=a?parseFloat(a.weight)*parseFloat(a.reps):null;
                    const volB=b?parseFloat(b.weight)*parseFloat(b.reps):null;
                    const diff=volA!==null&&volB!==null?volA-volB:null;
                    return (
                      <div key={ex} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"8px 10px",background:"var(--surface-0)",borderRadius:4}}>
                        <span style={{fontSize:13,color:"var(--text-2)"}}>{ex}</span>
                        <div style={{display:"flex",gap:12,alignItems:"center"}}>
                          <span style={{fontSize:11,color:"var(--text-3)"}}>{a?`${a.weight}kg×${a.reps}`:"—"}</span>
                          <span style={{fontSize:10,color:"var(--text-4)"}}>vs</span>
                          <span style={{fontSize:11,color:"var(--text-3)"}}>{b?`${b.weight}kg×${b.reps}`:"—"}</span>
                          {diff!==null&&<span style={{fontSize:11,color:diff>0?"#22c55e":diff<0?"#ef4444":"var(--text-2)"}}>{diff>0?"+":""}{diff}vol</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fotos lado a lado */}
              {(entryA.photo || entryB.photo) && (
                <div className="card">
                  <div className="section-title">📸 Fotos</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[entryA,entryB].map((e,i)=>(
                      <div key={i} style={{textAlign:"center"}}>
                        {e.photo ? <img src={e.photo} style={{width:"100%",borderRadius:4,border:"1px solid var(--border)"}} alt="foto"/> : <div style={{height:120,border:"1px dashed var(--border)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-4)",fontSize:11}}>Sem foto</div>}
                        <div style={{fontSize:10,color:"var(--text-3)",marginTop:4}}>{e.week}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(!entryA || !entryB) && compareA && compareB && (
            <div style={{textAlign:"center",color:"var(--text-4)",fontSize:14,marginTop:40}}>Selecione duas semanas diferentes para comparar.</div>
          )}
          {history.length < 2 && (
            <div style={{textAlign:"center",color:"var(--text-4)",fontSize:14,marginTop:40}}>Você precisa de pelo menos 2 semanas salvas para comparar.</div>
          )}
        </div>
      )}

      {/* ══ PERFIL ══ */}
      {view === "profile" && (
        <div style={{maxWidth:680,margin:"0 auto",padding:"24px 20px 60px"}}>

          {/* Ações do topo */}
          <div style={{display:"flex",gap:8,marginBottom:20,justifyContent:"flex-end"}}>
            <button className="ghost-btn" onClick={handleSendEmail}>✉ Enviar por e-mail</button>
            <button className="ghost-btn" onClick={handleExport}>⬇ Backup completo</button>
          </div>

          {/* Anamnese */}
          <div className="card">
            <div className="section-title">👤 Anamnese e Objetivo</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              {[
                {key:"name",label:"Nome",placeholder:"Seu nome"},
                {key:"age",label:"Idade",placeholder:"ex: 34",type:"number"},
                {key:"height",label:"Altura (cm)",placeholder:"ex: 178",type:"number"},
                {key:"startWeight",label:"Peso inicial (kg)",placeholder:"ex: 88.0",type:"number"},
              ].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:12,color:"var(--text-2)"}}>{f.label}</label>
                  <input type={f.type||"text"} placeholder={f.placeholder} value={profile[f.key]||""} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%"}}/>
                </div>
              ))}
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"var(--text-2)",marginBottom:6}}>Nível de treinamento</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {["Iniciante","Intermediário","Avançado"].map(l=>(
                  <button key={l} className={`opt-btn ${profile.level===l?"selected":""}`}
                    style={profile.level===l?{background:"#22c55e",borderColor:"#22c55e",color:"var(--surface-0)"}:{}}
                    onClick={()=>setProfile(p=>({...p,level:l}))}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"var(--text-2)",marginBottom:6}}>Objetivo principal</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {["Cutting","Bulking","Recomposição","Saúde / Qualidade de vida"].map(g=>(
                  <button key={g} className={`opt-btn ${profile.goal===g?"selected":""}`}
                    style={profile.goal===g?{background:"#84cc16",borderColor:"#84cc16",color:"var(--surface-0)"}:{}}
                    onClick={()=>setProfile(p=>({...p,goal:g}))}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"var(--text-2)",marginBottom:6}}>Protocolo de treino</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {["PPL","ABC","ABCD","Full Body","Upper/Lower","Outro"].map(t=>(
                  <button key={t} className={`opt-btn ${profile.split===t?"selected":""}`}
                    style={profile.split===t?{background:"#3b82f6",borderColor:"#3b82f6",color:"#fff"}:{}}
                    onClick={()=>setProfile(p=>({...p,split:t}))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
              <label style={{fontSize:12,color:"var(--text-2)"}}>Condições de saúde relevantes</label>
              <textarea placeholder="ex: hipertensão controlada, hipotireoidismo..." value={profile.health||""} onChange={e=>setProfile(p=>({...p,health:e.target.value}))} style={{width:"100%",minHeight:56,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
              <label style={{fontSize:12,color:"var(--text-2)"}}>Medicamentos em uso (além de EAs)</label>
              <textarea placeholder="ex: levotiroxina 50mcg, losartana 50mg..." value={profile.meds||""} onChange={e=>setProfile(p=>({...p,meds:e.target.value}))} style={{width:"100%",minHeight:56,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
              <label style={{fontSize:12,color:"var(--text-2)"}}>Meta (opcional — não obrigatório)</label>
              <input type="text" placeholder="ex: chegar a 82kg mantendo performance" value={profile.goal_notes||""} onChange={e=>setProfile(p=>({...p,goal_notes:e.target.value}))} style={{width:"100%"}}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:12,color:"var(--text-2)"}}>Coach / Médico responsável</label>
              <input type="text" placeholder="ex: Dr. João Silva" value={profile.coach||""} onChange={e=>setProfile(p=>({...p,coach:e.target.value}))} style={{width:"100%"}}/>
            </div>
          </div>

          {/* Fotos de poses */}
          <div className="card">
            <div className="section-title">📸 Fotos de Referência (Poses Básicas)</div>
            <div style={{fontSize:12,color:"var(--text-3)",marginBottom:14}}>Atualize sempre que quiser registrar evolução visual.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[
                {key:"front",label:"Frente"},
                {key:"back",label:"Costas"},
                {key:"side",label:"Lateral"},
              ].map(pose=>(
                <div key={pose.key} style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:"var(--text-3)",marginBottom:6}}>{pose.label}</div>
                  {posePhotos[pose.key] ? (
                    <div style={{position:"relative"}}>
                      <img src={posePhotos[pose.key]} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:4,border:"1px solid var(--border)"}} alt={pose.label}/>
                      <button className="del-btn" style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.75)",color:"var(--text-1)"}} onClick={()=>setPosePhotos(p=>({...p,[pose.key]:null}))}>✕</button>
                    </div>
                  ) : (
                    <label style={{display:"flex",alignItems:"center",justifyContent:"center",aspectRatio:"3/4",border:"1px dashed var(--border)",borderRadius:4,cursor:"pointer",color:"var(--text-4)",fontSize:11,flexDirection:"column",gap:4}}>
                      <span style={{fontSize:20}}>+</span>
                      <span>Adicionar</span>
                      <input type="file" accept="image/*" onChange={e=>handlePosePhoto(pose.key,e)} style={{display:"none"}}/>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>


          {/* Score VO2 */}
          <div className="card">
            <div className="section-title" style={{borderLeft:"3px solid #3b82f6",paddingLeft:10,marginLeft:-2}}>🫁 VO2 — Capacidade Aeróbica</div>
            <div style={{fontSize:12,color:"var(--text-3)",marginBottom:14,lineHeight:1.6}}>
              Baseado na escala MRC (Medical Research Council) adaptada. Responda com honestidade — sem julgamento.
            </div>

            {[
              { key:"vo2_stairs", label:"Subir escadas ou uma ladeira moderada",
                opts:[{v:4,l:"Sem dificuldade"},{v:3,l:"Fico um pouco ofegante"},{v:2,l:"Preciso parar no meio"},{v:1,l:"Evito por causa do cansaço"}] },
              { key:"vo2_walk", label:"Caminhar no mesmo ritmo que pessoas da minha idade",
                opts:[{v:4,l:"Sem dificuldade"},{v:3,l:"Fico para trás às vezes"},{v:2,l:"Fico para trás sempre"},{v:1,l:"Não consigo caminhar por mais de 100m"}] },
              { key:"vo2_daily", label:"Atividades cotidianas (varrer, carregar compras, jogar com criança)",
                opts:[{v:4,l:"Sem limitação"},{v:3,l:"Fico cansado, mas concluo"},{v:2,l:"Preciso parar e descansar"},{v:1,l:"Fico ofegante em repouso ou mínimo esforço"}] },
              { key:"vo2_cardio", label:"Treino de cardio atual (se faz)",
                opts:[{v:4,l:"Faço 30+ min contínuos sem dificuldade"},{v:3,l:"Consigo 20–30 min com esforço"},{v:2,l:"Menos de 15 min já é difícil"},{v:1,l:"Não faço / não consigo"}] },
              { key:"vo2_recovery", label:"Recuperação após esforço intenso",
                opts:[{v:4,l:"Normalizo em 1–2 min"},{v:3,l:"Levo 3–5 min"},{v:2,l:"Levo mais de 5 min"},{v:1,l:"Demoro muito / fico mal-estar"}] },
            ].map(field=>(
              <div key={field.key} style={{marginBottom:14}}>
                <div style={{fontSize:13,color:"var(--text-2)",marginBottom:8}}>{field.label}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {field.opts.map(opt=>(
                    <button key={opt.v} className={`opt-btn ${profile[field.key]===opt.v?"selected":""}`}
                      style={profile[field.key]===opt.v?{background:"#3b82f6",borderColor:"#3b82f6",color:"#fff"}:{}}
                      onClick={()=>setProfile(p=>({...p,[field.key]:opt.v}))}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Resultado do score VO2 */}
            {(()=>{
              const keys = ["vo2_stairs","vo2_walk","vo2_daily","vo2_cardio","vo2_recovery"];
              const answered = keys.filter(k=>profile[k]!==undefined);
              if (answered.length < 3) return (
                <div style={{fontSize:12,color:"var(--text-4)",fontStyle:"italic"}}>Responda pelo menos 3 perguntas para ver o resultado.</div>
              );
              const total = answered.reduce((sum,k)=>sum+profile[k],0);
              const max = answered.length * 4;
              const pct = Math.round((total/max)*100);

              let level, color, rec, zone;
              if (pct >= 80) {
                level="Capacidade aeróbica boa"; color="#22c55e";
                rec="LISS (30–45 min, 60–70% FCmax) 2–3x/semana como base. Pode incluir 1 sessão de HIIT 20 min por semana para manter VO2max.";
                zone="Zona 2 dominante. 1 sessão Zona 4 opcional.";
              } else if (pct >= 60) {
                level="Capacidade aeróbica moderada"; color="#84cc16";
                rec="LISS progressivo (20–35 min, 60–70% FCmax) 3x/semana. Evite HIIT por enquanto — construa base aeróbica primeiro.";
                zone="Zona 2 exclusiva por 4–6 semanas antes de introduzir intensidade.";
              } else if (pct >= 40) {
                level="Capacidade aeróbica baixa"; color="#eab308";
                rec="Caminhada em ritmo moderado (20–30 min, 50–60% FCmax) 3–4x/semana. Priorize consistência antes de intensidade.";
                zone="Zona 1–2. Sem HIIT até capacidade melhorar.";
              } else {
                level="Capacidade aeróbica muito baixa"; color="#ef4444";
                rec="Caminhada leve diária (15–20 min). Consulte médico antes de iniciar protocolo aeróbico estruturado.";
                zone="Zona 1 apenas. Avaliação clínica recomendada.";
              }

              return (
                <div style={{marginTop:16,padding:"14px 16px",background:"var(--surface-0)",borderRadius:6,borderLeft:`3px solid ${color}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontSize:14,color:color}}>{level}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:color,lineHeight:1}}>{pct}</div>
                  </div>
                  <div style={{fontSize:12,color:"var(--text-2)",marginBottom:8,lineHeight:1.6}}><span style={{color:"var(--text-3)"}}>Recomendação: </span>{rec}</div>
                  <div style={{fontSize:11,color:"var(--text-3)",fontStyle:"italic"}}>{zone}</div>
                  <div style={{fontSize:10,color:"var(--text-4)",marginTop:8}}>Score baseado na Escala MRC adaptada. Não substitui teste ergoespirométrico.</div>
                </div>
              );
            })()}
          </div>
          {/* Composição Corporal — US Navy + TDEE */}
          <div className="card">
            <div className="section-title" style={{borderLeft:"3px solid #22c55e",paddingLeft:10,marginLeft:-2}}>📏 Composição Corporal — US Navy</div>
            <div style={{fontSize:12,color:"var(--text-3)",marginBottom:14,lineHeight:1.6}}>
              Estimativa de % de gordura corporal por circunferências. Preencha os campos abaixo — o cálculo é atualizado automaticamente a cada check-in com novas medidas.
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"var(--text-2)",marginBottom:6}}>Sexo biológico</div>
              <div style={{display:"flex",gap:8}}>
                {["Masculino","Feminino"].map(s=>(
                  <button key={s} className={`opt-btn ${profile.sex===s?"selected":""}`}
                    style={profile.sex===s?{background:"#3b82f6",borderColor:"#3b82f6",color:"#fff"}:{}}
                    onClick={()=>setProfile(p=>({...p,sex:s}))}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {[
                {key:"neck_cm",label:"Circunferência do pescoço (cm)",placeholder:"ex: 39"},
                {key:"abdomen_cm",label:"Circunferência abdominal (cm)",placeholder:"ex: 84"},
                ...(profile.sex==="Feminino"?[{key:"hip_navy",label:"Circunferência do quadril (cm)",placeholder:"ex: 98"}]:[]),
              ].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:12,color:"var(--text-2)"}}>{f.label}</label>
                  <input type="number" step="0.1" placeholder={f.placeholder} value={profile[f.key]||""} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%"}}/>
                </div>
              ))}
            </div>

            {/* Resultado US Navy */}
            {(()=>{
              const h = parseFloat(profile.height);
              const neck = parseFloat(profile.neck_cm);
              const abd = parseFloat(profile.abdomen_cm);
              const hip = parseFloat(profile.hip_navy);
              const w = parseFloat(profile.startWeight);
              if (!h || !neck || !abd) return null;
              let bf = null;
              if (profile.sex === "Feminino") {
                if (!hip) return null;
                bf = 163.205 * Math.log10(abd + hip - neck) - 97.684 * Math.log10(h) - 78.387;
              } else {
                bf = 86.010 * Math.log10(abd - neck) - 70.041 * Math.log10(h) + 36.76;
              }
              bf = Math.max(3, Math.min(60, parseFloat(bf.toFixed(1))));
              const lbm = w ? parseFloat((w * (1 - bf/100)).toFixed(1)) : null;
              const fatMass = w ? parseFloat((w * bf/100).toFixed(1)) : null;

              let bfColor = "#22c55e", bfLabel = "Atlético";
              if (profile.sex === "Feminino") {
                if (bf > 32) { bfColor="#ef4444"; bfLabel="Acima do ideal"; }
                else if (bf > 25) { bfColor="#f97316"; bfLabel="Média alta"; }
                else if (bf > 20) { bfColor="#eab308"; bfLabel="Aceitável"; }
                else if (bf > 14) { bfColor="#84cc16"; bfLabel="Fitness"; }
                else { bfColor="#22c55e"; bfLabel="Atlético"; }
              } else {
                if (bf > 25) { bfColor="#ef4444"; bfLabel="Acima do ideal"; }
                else if (bf > 20) { bfColor="#f97316"; bfLabel="Média alta"; }
                else if (bf > 15) { bfColor="#eab308"; bfLabel="Aceitável"; }
                else if (bf > 10) { bfColor="#84cc16"; bfLabel="Fitness"; }
                else { bfColor="#22c55e"; bfLabel="Atlético"; }
              }

              return (
                <div style={{padding:"14px 16px",background:"var(--surface-0)",borderRadius:6,borderLeft:`3px solid ${bfColor}`,marginTop:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:bfColor,lineHeight:1}}>{bf}%</div>
                      <div style={{fontSize:11,color:bfColor}}>{bfLabel}</div>
                    </div>
                    {w && (
                      <div style={{display:"flex",gap:20}}>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"var(--text-2)",lineHeight:1}}>{lbm}kg</div>
                          <div style={{fontSize:11,color:"var(--text-3)"}}>Massa magra</div>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"var(--text-2)",lineHeight:1}}>{fatMass}kg</div>
                          <div style={{fontSize:11,color:"var(--text-3)"}}>Massa gorda</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:11,color:"var(--text-3)"}}>Método US Navy — estimativa. Margem de erro ±3–4%. Não substitui DEXA ou hidrostática.</div>
                </div>
              );
            })()}
          </div>

          {/* TDEE — Gasto Calórico Estimado */}
          <div className="card">
            <div className="section-title" style={{borderLeft:"3px solid #f97316",paddingLeft:10,marginLeft:-2}}>🔥 TDEE — Gasto Calórico Estimado</div>
            <div style={{fontSize:12,color:"var(--text-3)",marginBottom:14,lineHeight:1.6}}>
              Baseado em Mifflin-St Jeor para TMB + multiplicador de atividade personalizado.
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[
                {key:"tdee_age",label:"Idade",placeholder:"ex: 34",type:"number"},
                {key:"tdee_weight",label:"Peso atual (kg)",placeholder:"ex: 84",type:"number"},
              ].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:12,color:"var(--text-2)"}}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={profile[f.key]||""} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%"}}/>
                </div>
              ))}
            </div>

            {[
              { key:"tdee_workouts", label:"Treinos de musculação por semana",
                opts:[{v:0,l:"Nenhum"},{v:1,l:"1–2x"},{v:2,l:"3–4x"},{v:3,l:"5–6x"},{v:4,l:"7x ou mais"}] },
              { key:"tdee_duration", label:"Duração média do treino",
                opts:[{v:0,l:"Não treino"},{v:1,l:"< 45 min"},{v:2,l:"45–75 min"},{v:3,l:"> 75 min"}] },
              { key:"tdee_cardio", label:"Cardio adicional por semana",
                opts:[{v:0,l:"Nenhum"},{v:1,l:"1–2x leve"},{v:2,l:"3–4x moderado"},{v:3,l:"5x+ intenso"}] },
              { key:"tdee_job", label:"Tipo de trabalho",
                opts:[{v:0,l:"Sentado (escritório)"},{v:1,l:"Em pé (balcão/loja)"},{v:2,l:"Andando (campo/obra)"},{v:3,l:"Trabalho pesado físico"}] },
              { key:"tdee_neat", label:"Atividade fora do treino (NEAT)",
                opts:[{v:0,l:"Muito sedentário"},{v:1,l:"Pouco ativo"},{v:2,l:"Moderadamente ativo"},{v:3,l:"Muito ativo"}] },
            ].map(field=>(
              <div key={field.key} style={{marginBottom:12}}>
                <div style={{fontSize:13,color:"var(--text-2)",marginBottom:8}}>{field.label}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {field.opts.map(opt=>(
                    <button key={opt.v} className={`opt-btn ${profile[field.key]===opt.v?"selected":""}`}
                      style={profile[field.key]===opt.v?{background:"#f97316",borderColor:"#f97316",color:"var(--surface-0)"}:{}}
                      onClick={()=>setProfile(p=>({...p,[field.key]:opt.v}))}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Resultado TDEE */}
            {(()=>{
              const w = parseFloat(profile.tdee_weight || profile.startWeight);
              const h2 = parseFloat(profile.height);
              const age = parseFloat(profile.tdee_age || profile.age);
              const sex = profile.sex;
              if (!w || !h2 || !age || !sex) return (
                <div style={{fontSize:12,color:"var(--text-4)",fontStyle:"italic",marginTop:8}}>Preencha peso, altura, idade e sexo para calcular.</div>
              );

              // TMB Mifflin-St Jeor
              let tmb = sex === "Feminino"
                ? (10 * w) + (6.25 * h2) - (5 * age) - 161
                : (10 * w) + (6.25 * h2) - (5 * age) + 5;

              // Multiplicador baseado nas respostas
              const wo = profile.tdee_workouts || 0;
              const dur = profile.tdee_duration || 0;
              const card = profile.tdee_cardio || 0;
              const job = profile.tdee_job || 0;
              const neat = profile.tdee_neat || 0;

              // Score total 0–16 mapeado para fator 1.2–2.0
              const actScore = wo + dur + card + job + neat;
              const factor = 1.2 + (actScore / 16) * 0.8;
              const tdee = Math.round(tmb * factor);
              tmb = Math.round(tmb);

              const cutting = Math.round(tdee * 0.82);
              const mild = Math.round(tdee * 0.90);
              const bulk = Math.round(tdee * 1.10);

              const factorLabel = factor < 1.375 ? "Sedentário" : factor < 1.55 ? "Levemente ativo" : factor < 1.725 ? "Moderadamente ativo" : factor < 1.9 ? "Muito ativo" : "Extremamente ativo";

              return (
                <div style={{marginTop:12,padding:"16px",background:"var(--surface-0)",borderRadius:6}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                    <div style={{textAlign:"center",padding:"10px",background:"var(--surface-1)",borderRadius:4}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"var(--text-2)",lineHeight:1}}>{tmb}</div>
                      <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>TMB (kcal)</div>
                    </div>
                    <div style={{textAlign:"center",padding:"10px",background:"var(--surface-1)",borderRadius:4}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"var(--orange)",lineHeight:1}}>{tdee}</div>
                      <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>TDEE estimado</div>
                      <div style={{fontSize:10,color:"var(--text-4)",marginTop:1}}>{factorLabel} (×{factor.toFixed(2)})</div>
                    </div>
                  </div>

                  <div style={{fontSize:11,color:"var(--text-3)",marginBottom:10,letterSpacing:".06em",textTransform:"uppercase"}}>Metas calóricas sugeridas</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {[
                      {label:"Cutting (−18%)",value:cutting,color:"var(--green)"},
                      {label:"Cutting leve (−10%)",value:mild,color:"#84cc16"},
                      {label:"Bulk (+10%)",value:bulk,color:"#3b82f6"},
                    ].map(c=>(
                      <div key={c.label} style={{textAlign:"center",padding:"10px 6px",background:"var(--surface-1)",borderRadius:4}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:c.color,lineHeight:1}}>{c.value}</div>
                        <div style={{fontSize:10,color:"var(--text-3)",marginTop:2}}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"var(--text-4)",marginTop:12}}>Mifflin-St Jeor + fator de atividade personalizado. Margem de erro ±10–15%. Ajuste conforme resposta do corpo nas semanas.</div>
                </div>
              );
            })()}
          </div>

          {/* Tabela de medidas */}
          <div className="card">
            <div className="section-title">📐 Tabela de Medidas</div>

            {/* Nova medição */}
            <div style={{background:"var(--surface-0)",borderRadius:6,padding:"14px",marginBottom:16}}>
              <div style={{fontSize:12,color:"var(--text-3)",marginBottom:10}}>Nova medição</div>
              <div style={{marginBottom:8}}>
                <label style={{fontSize:11,color:"var(--text-3)",display:"block",marginBottom:4}}>Data</label>
                <input type="text" value={measureDate} onChange={e=>setMeasureDate(e.target.value)} style={{width:"100%"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                {[
                  {key:"weight",label:"Peso (kg)"},
                  {key:"waist",label:"Cintura / Abdômen (cm)"},
                  {key:"neck_cm",label:"Pescoço (cm)"},
                  {key:"hip",label:"Quadril (cm)"},
                  {key:"chest",label:"Peito (cm)"},
                  {key:"shoulders",label:"Ombros (cm)"},
                  {key:"armR",label:"Braço D (cm)"},
                  {key:"armL",label:"Braço E (cm)"},
                  {key:"thighR",label:"Coxa D (cm)"},
                  {key:"thighL",label:"Coxa E (cm)"},
                  {key:"calf",label:"Panturrilha (cm)"},
                ].map(f=>(
                  <div key={f.key} style={{display:"flex",flexDirection:"column",gap:3}}>
                    <label style={{fontSize:10,color:"var(--text-3)"}}>{f.label}</label>
                    <input type="number" step="0.1" placeholder="—" value={newMeasure[f.key]||""} onChange={e=>setNewMeasure(m=>({...m,[f.key]:e.target.value}))} style={{width:"100%"}}/>
                  </div>
                ))}
              </div>
              <button className="save-btn" style={{width:"100%"}} onClick={handleSaveMeasure}>Salvar medição</button>
            </div>

            {/* Histórico de medidas */}
            {measures.length > 0 && (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr>
                      {["Data","Peso","Cintura","Quadril","Peito","Ombros","Br.D","Br.E","Cx.D","Cx.E","Pant.","%G Navy","M.Magra",""].map(h=>(
                        <th key={h} style={{fontSize:10,color:"var(--text-3)",padding:"6px 8px",textAlign:"left",borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measures.map((m,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid var(--border)"}}>
                        {["date","weight","waist","hip","chest","shoulders","armR","armL","thighR","thighL","calf","bodyfat_navy","lbm"].map(k=>(
                          <td key={k} style={{fontSize:12,color:"var(--text-2)",padding:"7px 8px",whiteSpace:"nowrap"}}>{m[k]||"—"}</td>
                        ))}
                        <td style={{padding:"7px 8px"}}>
                          <button className="del-btn" onClick={()=>handleDeleteMeasure(i)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {measures.length === 0 && (
              <div style={{textAlign:"center",color:"var(--text-3)",fontSize:12,padding:"20px 0"}}>Nenhuma medição registrada ainda.</div>
            )}
          </div>

        </div>
      )}

      {/* ══ ESCALA ══ */}
      {view === "about" && (
        <div style={{maxWidth:620,margin:"0 auto",padding:"24px 20px 60px"}}>
          <div className="section-title">Interpretação do score</div>
          {SCORE_SCALE.map((s,i)=>(
            <div key={i} style={{background:"linear-gradient(180deg,var(--surface-2),var(--surface-1))",borderLeft:`3px solid ${s.color}`,borderRadius:"var(--radius)",padding:"14px 18px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:s.color}}>{s.range}</div>
                <div style={{fontSize:13,color:s.color}}>{s.label}</div>
              </div>
              <div style={{fontSize:13,color:"var(--text-2)"}}>{s.desc}</div>
            </div>
          ))}

          <div style={{background:"var(--surface-2)",border:"1px solid #2a1a4a",borderRadius:6,padding:"16px 18px",marginTop:16}}>
            <div className="section-title" style={{color:"#7c3aed"}}>Score Hormonal — Controle de Estrogênio em usuários de EAs</div>
            {[{color:"var(--red)",label:"E2 possivelmente ELEVADO",desc:"Sinais predominantes: mamilo sensível, oleosidade/acne, humor sensível. Ação: revisar dose do AI, solicitar exame de estradiol (preferencialmente LC-MS/MS)."},{color:"var(--orange)",label:"E2 possivelmente BAIXO",desc:"Sinais predominantes: articulação seca, ausência de ereção matinal, humor apático, pele seca. Ação: AI pode estar em excesso — reduzir dose ou aumentar intervalo. Solicitar exame."},{color:"var(--green)",label:"Quadro equilibrado",desc:"Sinais dentro do esperado. Manter protocolo e reavaliar em 2 semanas."}].map((s,i)=>(
              <div key={i} style={{borderLeft:`3px solid ${s.color}`,padding:"10px 14px",marginBottom:8,background:"var(--surface-0)",borderRadius:4}}>
                <div style={{fontSize:12,color:s.color,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:11,color:"var(--text-3)",lineHeight:1.6}}>{s.desc}</div>
              </div>
            ))}
            <div style={{fontSize:10,color:"var(--text-4)",marginTop:8}}>O score hormonal não substitui exames laboratoriais. Use como auxiliar de monitoramento entre exames.</div>
          </div>

          <div style={{background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:6,padding:"16px 18px",marginTop:12}}>
            <div className="section-title">Fundamentação</div>
            <div style={{fontSize:11,color:"var(--text-3)",lineHeight:1.7}}>Modelo baseado em conceitos de John Jewett, Mike Israetel (RP), Eric Helms e James Krieger. Score hormonal baseado em marcadores clínicos de desequilíbrio androgênio/estrogênio em usuários de EAs. O uso de compostos anabolizantes pode causar aromatização excessiva (E2 elevado) ou, com uso inadequado de AI, supressão de estrogênio (E2 baixo) — ambos com consequências para saúde e performance.</div>
          </div>
        </div>
      )}
      </>
    )}
    </div>
  );
}
