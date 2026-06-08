import { useState, useEffect, useRef } from "react";

// ─── PESOS BIOFEEDBACK ────────────────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  performance:25, recovery:20, sleep:20, energy:15, joints:10, hunger:5, pump:5,
};

const CATEGORIES = [
  { id:"performance", label:"Performance", icon:"⚡", description:"Cargas e repetições estão subindo ou se mantendo?",
    options:[{value:5,label:"Subindo claramente",color:"#22c55e"},{value:4,label:"Estável / leve progresso",color:"#84cc16"},{value:3,label:"Estável sem progresso",color:"#eab308"},{value:2,label:"Leve queda",color:"#f97316"},{value:1,label:"Queda significativa",color:"#ef4444"}]},
  { id:"recovery", label:"Recuperação", icon:"🔄", description:"Chega recuperado ao próximo treino? DOMS excessiva?",
    options:[{value:5,label:"Totalmente recuperado",color:"#22c55e"},{value:4,label:"Bem recuperado",color:"#84cc16"},{value:3,label:"Recuperação parcial",color:"#eab308"},{value:2,label:"Ainda dolorido / pesado",color:"#f97316"},{value:1,label:"Fadiga acumulada clara",color:"#ef4444"}]},
  { id:"sleep", label:"Sono", icon:"🌙", description:"Qualidade do sono e sensação ao acordar",
    options:[{value:5,label:"Profundo, descansado",color:"#22c55e"},{value:4,label:"Bom, poucos despertares",color:"#84cc16"},{value:3,label:"Fragmentado, ok",color:"#eab308"},{value:2,label:"Ruim, cansado ao acordar",color:"#f97316"},{value:1,label:"Muito ruim / insônia",color:"#ef4444"}]},
  { id:"energy", label:"Energia e Disposição", icon:"🔋", description:"Energia ao longo do dia e motivação para treinar",
    options:[{value:5,label:"Alta energia, motivado",color:"#22c55e"},{value:4,label:"Boa energia geral",color:"#84cc16"},{value:3,label:"Energia oscilante",color:"#eab308"},{value:2,label:"Cansado, mas funcional",color:"#f97316"},{value:1,label:"Arrastando o corpo",color:"#ef4444"}]},
  { id:"joints", label:"Dor Articular", icon:"🦴", description:"Ombros, cotovelos, joelhos, lombar",
    options:[{value:5,label:"Sem dores",color:"#22c55e"},{value:4,label:"Leve desconforto ocasional",color:"#84cc16"},{value:3,label:"Desconforto frequente",color:"#eab308"},{value:2,label:"Dor presente no treino",color:"#f97316"},{value:1,label:"Dor limitante",color:"#ef4444"}]},
  { id:"hunger", label:"Fome", icon:"🍽️", description:"Controle da fome e ausência de compulsões",
    options:[{value:5,label:"Controlada, sem compulsão",color:"#22c55e"},{value:4,label:"Controlável",color:"#84cc16"},{value:3,label:"Fome moderada",color:"#eab308"},{value:2,label:"Fome alta",color:"#f97316"},{value:1,label:"Fome extrema / compulsão",color:"#ef4444"}]},
  { id:"pump", label:"Pump e Conexão Muscular", icon:"💪", description:"Sente o músculo? Pump presente?",
    options:[{value:5,label:"Pump excelente",color:"#22c55e"},{value:4,label:"Bom pump",color:"#84cc16"},{value:3,label:"Pump moderado",color:"#eab308"},{value:2,label:"Pump fraco",color:"#f97316"},{value:1,label:"Sem pump",color:"#ef4444"}]},
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
  {value:5,label:"Ideal (formada, fácil)",color:"#22c55e"},
  {value:4,label:"Boa, leve variação",color:"#84cc16"},
  {value:3,label:"Pastosa / irregular",color:"#eab308"},
  {value:2,label:"Diarreia / constipação leve",color:"#f97316"},
  {value:1,label:"Diarreia / constipação severa",color:"#ef4444"},
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

  if (highScore >= 35) return { status:"high", label:"E2 possivelmente ELEVADO", color:"#ef4444", suggestion:"Revisar dose do AI. Considerar exame de estradiol (LC-MS/MS). Sinais: mamilo sensível, pele oleosa, humor sensível.", highScore, lowScore };
  if (lowScore >= 35) return { status:"low", label:"E2 possivelmente BAIXO", color:"#f97316", suggestion:"AI pode estar em excesso. Articulações secas e ereção matinal ausente são sinais clássicos de E2 suprimido. Solicitar exame.", highScore, lowScore };
  return { status:"ok", label:"Quadro hormonal equilibrado", color:"#22c55e", suggestion:"Manter protocolo atual. Reavaliar em 2 semanas.", highScore, lowScore };
};

// ─── SCORE BIOFEEDBACK ────────────────────────────────────────────────────────
const getScoreInfo = (score) => {
  if (score >= 85) return { color:"#22c55e", label:"Adaptando bem", bg:"rgba(34,197,94,0.12)", readiness:"verde", readinessLabel:"Treine normalmente", readinessDesc:"Biofeedback positivo. Mantenha o plano." };
  if (score >= 70) return { color:"#84cc16", label:"No caminho certo", bg:"rgba(132,204,22,0.12)", readiness:"verde", readinessLabel:"Treine normalmente", readinessDesc:"Boa adaptação. Monitore de perto." };
  if (score >= 55) return { color:"#eab308", label:"Atenção necessária", bg:"rgba(234,179,8,0.12)", readiness:"amarelo", readinessLabel:"Mantenha as cargas", readinessDesc:"Primeiros sinais de fadiga. Não progrida agora." };
  if (score >= 40) return { color:"#f97316", label:"Sinal de alerta", bg:"rgba(249,115,22,0.12)", readiness:"amarelo", readinessLabel:"Reduza o volume", readinessDesc:"Recuperação comprometida. Considere deload parcial." };
  return { color:"#ef4444", label:"Fadiga acumulada", bg:"rgba(239,68,68,0.12)", readiness:"vermelho", readinessLabel:"Deload imediato", readinessDesc:"Alto risco de estagnação ou lesão." };
};

const SCORE_SCALE = [
  {range:"85–100",color:"#22c55e",label:"Adaptando bem",desc:"Manter o plano. Pode progredir."},
  {range:"70–84",color:"#84cc16",label:"No caminho certo",desc:"Boa adaptação. Monitorar."},
  {range:"55–69",color:"#eab308",label:"Atenção necessária",desc:"Primeiros sinais de fadiga acumulada."},
  {range:"40–54",color:"#f97316",label:"Sinal de alerta",desc:"Recuperação comprometida. Deload parcial."},
  {range:"0–39",color:"#ef4444",label:"Fadiga acumulada",desc:"Alto risco de estagnação ou lesão."},
];

const computeScore = (scoreMap, weights) => {
  if (Object.keys(scoreMap).length === 0) return null;
  let weighted = 0, totalWeight = 0;
  CATEGORIES.forEach((cat) => {
    if (scoreMap[cat.id] !== undefined) {
      weighted += (scoreMap[cat.id] / 5) * weights[cat.id];
      totalWeight += weights[cat.id];
    }
  });
  return totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : null;
};

const getBottlenecks = (scoreMap, weights) => {
  return CATEGORIES
    .filter(cat => scoreMap[cat.id] !== undefined)
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
  const [history, setHistory] = useState([]);
  const [weights, setWeights] = useState({...DEFAULT_WEIGHTS});
  const [view, setView] = useState("form");
  const [showWeights, setShowWeights] = useState(false);
  const [modal, setModal] = useState(null);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const loaded = useRef(false);

  const store = {
    get: async (key) => {
      if (typeof window.storage?.get === "function") { const r = await window.storage.get(key); return r?.value ?? null; }
      return localStorage.getItem(key);
    },
    set: async (key, value) => {
      if (typeof window.storage?.set === "function") await window.storage.set(key, value);
      else localStorage.setItem(key, value);
    },
  };

  useEffect(() => {
    const load = async () => {
      try { const h = await store.get("bf-history"); if (h) setHistory(JSON.parse(h)); } catch(_) {}
      try { const w = await store.get("bf-weights"); if (w) setWeights(JSON.parse(w)); } catch(_) {}
      loaded.current = true;
    };
    load();
  }, []);
  useEffect(() => { if (!loaded.current) return; store.set("bf-history", JSON.stringify(history)); }, [history]);
  useEffect(() => { if (!loaded.current) return; store.set("bf-weights", JSON.stringify(weights)); }, [weights]);

  const totalAnswered = Object.keys(scores).length;
  const score = computeScore(scores, weights);
  const scoreInfo = score !== null ? getScoreInfo(score) : null;
  const bottlenecks = getBottlenecks(scores, weights);
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
    const entry = {
      week, scores:{...scores}, objective:{...objective},
      macros:{...macros}, gut:{...gut},
      hormonal: usesHormones ? {...hormonal} : null,
      hormonalScore,
      usesHormones: !!usesHormones,
      anchors: anchors.filter(a => a.exercise.trim()),
      photo,
      score: computeScore(scores, weights),
      notes, date: new Date().toLocaleDateString("pt-BR"), report:"",
    };
    entry.report = generateReport(entry, prev, weights);
    const suggestions = generateSuggestions(entry, historyWithScore, weights);
    setHistory(h => [entry, ...h]);
    setScores({}); setWeek(""); setNotes(""); setObjective({}); setMacros({}); setGut({});
    setHormonal({}); setUsesHormones(null); setAnchors([{exercise:"",weight:"",reps:""}]); setPhoto(null);
    setModal({suggestions, report:entry.report, score:entry.score, week:entry.week, hormonalScore});
  };

  const handleDeleteEntry = (idx) => {
    if (window.confirm("Excluir este registro?")) setHistory(h => h.filter((_,i)=>i!==idx));
  };
  const handleWeightChange = (id, val) => { const n = Math.max(0,Math.min(50,parseInt(val)||0)); setWeights(w=>({...w,[id]:n})); };
  const resetWeights = () => setWeights({...DEFAULT_WEIGHTS});

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),history,weights},null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`biofeedback-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
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
    <div style={{minHeight:"100vh",background:"#0c0c0f",color:"#e8e6e1",fontFamily:"'DM Mono','Courier New',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0c0c0f} ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:2px}
        .opt-btn{background:transparent;border:1px solid #2a2a30;color:#888;padding:7px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;transition:all .15s;white-space:nowrap}
        .opt-btn:hover{border-color:#444;color:#ccc} .opt-btn.selected{font-weight:500;color:#0c0c0f}
        .tab-btn{background:transparent;border:none;color:#555;font-family:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;padding:10px 16px;border-bottom:2px solid transparent;transition:all .15s}
        .tab-btn.active{color:#e8e6e1;border-bottom-color:#e8e6e1} .tab-btn:hover:not(.active){color:#999}
        .save-btn{background:#e8e6e1;color:#0c0c0f;border:none;padding:12px 28px;font-family:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border-radius:3px;font-weight:500;transition:opacity .15s}
        .save-btn:disabled{opacity:.25;cursor:not-allowed} .save-btn:hover:not(:disabled){opacity:.85}
        .ghost-btn{background:transparent;border:1px solid #2a2a30;color:#666;padding:6px 14px;font-family:inherit;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:3px;transition:all .15s}
        .ghost-btn:hover{border-color:#555;color:#aaa}
        input,textarea,select{background:#15151a;border:1px solid #2a2a30;color:#e8e6e1;font-family:inherit;font-size:12px;padding:9px 12px;border-radius:4px;outline:none;transition:border-color .15s}
        input:focus,textarea:focus,select:focus{border-color:#555}
        .weight-input{background:#15151a;border:1px solid #2a2a30;color:#e8e6e1;font-family:inherit;font-size:12px;padding:4px 8px;border-radius:3px;outline:none;width:52px;text-align:center}
        .del-btn{background:transparent;border:none;color:#2a2a30;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:3px;transition:color .15s}
        .del-btn:hover{color:#ef4444}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal-box{background:#12121a;border:1px solid #2a2a35;border-radius:10px;max-width:540px;width:100%;max-height:88vh;overflow-y:auto;padding:28px 24px}
        .close-btn{background:transparent;border:1px solid #2a2a30;color:#666;padding:8px 20px;font-family:inherit;font-size:11px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:3px;transition:all .15s;margin-top:20px}
        .close-btn:hover{border-color:#555;color:#aaa}
        .card{background:#10101a;border:1px solid #1a1a20;border-radius:6px;padding:14px 16px;margin-bottom:8px}
        .section-title{font-size:10px;color:#444;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
        .horm-btn{background:transparent;border:1px solid #2a2a30;color:#888;padding:8px 16px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;transition:all .15s}
        .horm-btn.yes{background:#7c3aed;border-color:#7c3aed;color:#fff}
        .horm-btn.no{background:#2a2a30;border-color:#2a2a30;color:#aaa}
        .anchor-row{display:grid;grid-template-columns:1fr 80px 70px 32px;gap:6px;margin-bottom:6px}
      `}</style>

      {/* ── Modal pós-salvar ── */}
      {modal && (
        <div className="modal-overlay" onClick={()=>{setModal(null);setView("history");}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:".08em",marginBottom:4}}>RESUMO DA SEMANA</div>
            <div style={{fontSize:10,color:"#444",marginBottom:16}}>{modal.week}</div>

            {/* Score biofeedback */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:"14px 16px",background:"#0c0c0f",borderRadius:6}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:getScoreInfo(modal.score).color,lineHeight:1}}>{modal.score}</div>
              <div>
                <div style={{fontSize:12,color:getScoreInfo(modal.score).color,marginBottom:4}}>{getScoreInfo(modal.score).label}</div>
                <div style={{fontSize:11,color:"#555"}}>{getScoreInfo(modal.score).readinessDesc}</div>
              </div>
            </div>

            {/* Score hormonal */}
            {modal.hormonalScore && (
              <div style={{padding:"12px 16px",background:"#0c0c0f",borderRadius:6,marginBottom:16,borderLeft:`3px solid ${modal.hormonalScore.color}`}}>
                <div style={{fontSize:10,color:"#555",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Score Hormonal</div>
                <div style={{fontSize:13,color:modal.hormonalScore.color,marginBottom:6}}>{modal.hormonalScore.label}</div>
                <div style={{fontSize:11,color:"#666",lineHeight:1.6}}>{modal.hormonalScore.suggestion}</div>
                <div style={{display:"flex",gap:16,marginTop:10}}>
                  <div style={{fontSize:10,color:"#ef4444"}}>E2 alto: {modal.hormonalScore.highScore}%</div>
                  <div style={{fontSize:10,color:"#f97316"}}>E2 baixo: {modal.hormonalScore.lowScore}%</div>
                </div>
              </div>
            )}

            <div style={{fontSize:11,color:"#555",fontStyle:"italic",marginBottom:16,paddingLeft:12,borderLeft:"2px solid #1e1e25"}}>{modal.report}</div>

            {modal.suggestions.length > 0 ? (
              <>
                <div style={{fontSize:10,color:"#444",letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}>Sugestões para as próximas semanas</div>
                {modal.suggestions.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:12,marginBottom:10,padding:"12px 14px",background:"#0c0c0f",borderRadius:6,borderLeft:`2px solid ${s.priority?"#ef4444":"#2a2a45"}`}}>
                    <span style={{fontSize:16,flexShrink:0}}>{s.icon}</span>
                    <div>
                      <div style={{fontSize:10,color:s.priority?"#ef4444":"#555",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>{s.area}</div>
                      <div style={{fontSize:12,color:"#aaa",lineHeight:1.6}}>{s.text}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{fontSize:12,color:"#555",padding:"12px 14px",background:"#0c0c0f",borderRadius:6}}>✅ Biofeedback positivo — mantenha o protocolo.</div>
            )}

            <div style={{display:"flex",justifyContent:"center"}}>
              <button className="close-btn" onClick={()=>{setModal(null);setView("history");}}>Ver histórico</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{borderBottom:"1px solid #1e1e25",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#0c0c0f",zIndex:10,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:".08em"}}>BIOFEEDBACK SCORE</div>
          <div style={{fontSize:9,color:"#333",letterSpacing:".1em",textTransform:"uppercase"}}>Jewett · Israetel · Helms · Krieger</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex"}}>
            {[["form","Avaliação"],["history",`Histórico${history.length>0?` (${history.length})`:""}`,],["compare","Comparar"],["about","Escala"]].map(([v,l])=>(
              <button key={v} className={`tab-btn ${view===v?"active":""}`} onClick={()=>setView(v)}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:6}}>
            <button className="ghost-btn" onClick={handleExport}>⬇ Backup</button>
            <label className="ghost-btn" style={{cursor:"pointer"}}>⬆ Importar<input type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/></label>
          </div>
        </div>
      </div>

      {/* ══ FORM ══ */}
      {view === "form" && (
        <div style={{maxWidth:680,margin:"0 auto",padding:"24px 20px 60px"}}>

          {/* Score gauge */}
          <div className="card" style={{display:"flex",alignItems:"center",gap:24,border:"1px solid #1e1e25"}}>
            <div style={{position:"relative",flexShrink:0}}>
              <svg width={110} height={65} viewBox="0 0 120 70">
                <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#1e1e25" strokeWidth="12"/>
                {score !== null && (()=>{ const c=Math.PI*50,d=(score/100)*c; return <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke={scoreInfo.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${d} ${c}`}/>; })()}
              </svg>
              <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",textAlign:"center"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:score!==null?30:22,color:score!==null?scoreInfo.color:"#2a2a30",lineHeight:1}}>{score!==null?score:"--"}</div>
              </div>
            </div>
            <div style={{flex:1}}>
              {score !== null ? (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:scoreInfo.readiness==="verde"?"#22c55e":scoreInfo.readiness==="amarelo"?"#eab308":"#ef4444"}}/>
                    <div style={{fontSize:12,color:scoreInfo.readiness==="verde"?"#22c55e":scoreInfo.readiness==="amarelo"?"#eab308":"#ef4444"}}>{scoreInfo.readinessLabel}</div>
                  </div>
                  <div style={{fontSize:11,color:"#555",marginBottom:8}}>{scoreInfo.readinessDesc}</div>
                  {bottlenecks.map((b,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:10,color:"#444"}}>{i+1}.</span>
                      <span style={{fontSize:11,color:b.cat.options.find(o=>o.value===scores[b.cat.id])?.color||"#888"}}>{b.cat.icon} {b.cat.label}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{color:"#333",fontSize:12}}>Preencha os critérios para calcular o score.<br/><span style={{fontSize:11,color:"#252530"}}>{totalAnswered}/7 preenchidos</span></div>
              )}
            </div>
          </div>

          {/* Semana */}
          <div style={{display:"flex",gap:10,margin:"16px 0",alignItems:"center"}}>
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
                    <span style={{fontSize:11,color:"#888"}}>{cat.icon} {cat.label}</span>
                    <input type="number" className="weight-input" min={0} max={50} value={weights[cat.id]} onChange={e=>handleWeightChange(cat.id,e.target.value)}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critérios */}
          {CATEGORIES.map(cat=>(
            <div key={cat.id} className="card" style={{border:`1px solid ${scores[cat.id]?"#1e1e30":"#1a1a20"}`}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:8}}>
                <span style={{fontSize:15}}>{cat.icon}</span>
                <div>
                  <div style={{fontSize:11,letterSpacing:".08em",textTransform:"uppercase",color:scores[cat.id]?cat.options.find(o=>o.value===scores[cat.id])?.color:"#ccc",fontWeight:500}}>
                    {cat.label}<span style={{fontSize:9,color:"#2a2a35",marginLeft:8,textTransform:"none",letterSpacing:0,fontWeight:400}}>peso {weights[cat.id]}%</span>
                  </div>
                  <div style={{fontSize:10,color:"#444",marginTop:2}}>{cat.description}</div>
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {cat.options.map(opt=>(
                  <button key={opt.value} className={`opt-btn ${scores[cat.id]===opt.value?"selected":""}`}
                    style={scores[cat.id]===opt.value?{background:opt.color,borderColor:opt.color,color:"#0c0c0f"}:{}}
                    onClick={()=>setScores(s=>({...s,[cat.id]:opt.value}))}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Performance Anchor Sets */}
          <div className="card">
            <div className="section-title">⚡ Performance Anchor Sets</div>
            <div style={{fontSize:10,color:"#333",marginBottom:10}}>Registre exercício principal + carga + reps para comparar semana a semana</div>
            {anchors.map((a,i)=>(
              <div key={i} className="anchor-row">
                <input type="text" placeholder="Exercício (ex: Supino)" value={a.exercise} onChange={e=>{const n=[...anchors];n[i]={...n[i],exercise:e.target.value};setAnchors(n);}}/>
                <input type="number" placeholder="kg" value={a.weight} onChange={e=>{const n=[...anchors];n[i]={...n[i],weight:e.target.value};setAnchors(n);}}/>
                <input type="number" placeholder="reps" value={a.reps} onChange={e=>{const n=[...anchors];n[i]={...n[i],reps:e.target.value};setAnchors(n);}}/>
                <button className="del-btn" onClick={()=>setAnchors(anchors.filter((_,j)=>j!==i))}>✕</button>
              </div>
            ))}
            <button className="ghost-btn" style={{marginTop:4}} onClick={()=>setAnchors([...anchors,{exercise:"",weight:"",reps:""}])}>+ Exercício</button>

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
                <div style={{marginTop:12,padding:"10px 12px",background:"#0c0c0f",borderRadius:4}}>
                  <div style={{fontSize:10,color:"#444",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>vs semana anterior</div>
                  {comparisons.map((c,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,color:"#666",flex:1}}>{c.exercise}</span>
                      <span style={{fontSize:10,color:"#444"}}>{c.prev}</span>
                      <span style={{fontSize:10,color:"#333"}}>→</span>
                      <span style={{fontSize:11,color:c.diff>0?"#22c55e":c.diff<0?"#ef4444":"#888"}}>{c.curr}</span>
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
              {MACRO_FIELDS.map(f=>(
                <div key={f.id} style={{display:"flex",flexDirection:"column",gap:3}}>
                  <label style={{fontSize:10,color:"#555"}}>{f.label} ({f.unit})</label>
                  <input type="number" step="1" placeholder={f.placeholder} value={macros[f.id]||""} onChange={e=>setMacros(m=>({...m,[f.id]:e.target.value}))} style={{width:"100%"}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Saúde intestinal */}
          <div className="card">
            <div className="section-title">🫙 Saúde intestinal</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#555",marginBottom:6}}>Frequência diária</div>
              <div style={{display:"flex",gap:6}}>
                {GUT_FREQ.map(f=>(
                  <button key={f.value} className={`opt-btn ${gut.frequency===f.value?"selected":""}`}
                    style={gut.frequency===f.value?{background:"#84cc16",borderColor:"#84cc16",color:"#0c0c0f"}:{}}
                    onClick={()=>setGut(g=>({...g,frequency:f.value}))}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:10,color:"#555",marginBottom:6}}>Consistência das fezes</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {GUT_CONSISTENCY.map(opt=>(
                  <button key={opt.value} className={`opt-btn ${gut.consistency===opt.value?"selected":""}`}
                    style={gut.consistency===opt.value?{background:opt.color,borderColor:opt.color,color:"#0c0c0f"}:{}}
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
                  <label style={{fontSize:10,color:"#555"}}>{f.label} ({f.unit})</label>
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
                <img src={photo} style={{maxWidth:"100%",maxHeight:200,borderRadius:4,border:"1px solid #2a2a30"}} alt="foto semana"/>
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
            <div style={{fontSize:11,color:"#555",marginBottom:12}}>Você usa Esteroides Anabolizantes (EAs) — incluindo TRT, testosterona, derivados ou outros compostos que possam afetar o balanço hormonal?</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <button className={`horm-btn ${usesHormones===true?"yes":""}`} onClick={()=>setUsesHormones(true)}>Sim</button>
              <button className={`horm-btn ${usesHormones===false?"no":""}`} onClick={()=>setUsesHormones(false)}>Não</button>
            </div>

            {usesHormones && (
              <div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:10,color:"#7c3aed",display:"block",marginBottom:4}}>Dose do Inibidor de Aromatase (AI) usado na semana</label>
                  <input type="text" placeholder="ex: Anastrozol 0.5mg 2x/semana ou Exemestane 12.5mg 2x/semana" value={hormonal.aiDose||""} onChange={e=>setHormonal(h=>({...h,aiDose:e.target.value}))} style={{width:"100%",borderColor:"#2a1a4a"}}/>
                </div>

                {[
                  { key:"libido", label:"Vontade e Iniciativa Sexual", opts:[{v:4,l:"Ótima"},{v:3,l:"Boa"},{v:2,l:"Ruim"},{v:1,l:"Inexistente"}] },
                  { key:"erection", label:"Ereção / Sensibilidade / Orgasmo", opts:[{v:4,l:"Ótima"},{v:3,l:"Boa"},{v:2,l:"Ruim"},{v:1,l:"Inexistente"}] },
                  { key:"joint", label:"Articulações", opts:[{v:2,l:"Ok"},{v:1,l:"Fraca ou estalando"}] },
                  { key:"mood", label:"Humor", opts:[{v:"sensitive",l:"Sensível / irritável"},{v:"normal",l:"Normal"},{v:"apathetic",l:"Apático"}] },
                ].map(field=>(
                  <div key={field.key} style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:"#666",marginBottom:6}}>{field.label}</div>
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
                  <div style={{fontSize:10,color:"#666",marginBottom:6}}>Ereção Matinal / Madrugada</div>
                  <div style={{fontSize:10,color:"#444",marginBottom:6}}>Frequência semanal</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                    {[{v:"daily",l:"Diária"},{v:"frequent",l:"3–5x/semana"},{v:"rare",l:"1–2x/semana"},{v:"absent",l:"Ausente"}].map(opt=>(
                      <button key={opt.v} className={`opt-btn ${hormonal.morningErectionFreq===opt.v?"selected":""}`}
                        style={hormonal.morningErectionFreq===opt.v?{background:"#7c3aed",borderColor:"#7c3aed",color:"#fff"}:{}}
                        onClick={()=>setHormonal(h=>({...h,morningErectionFreq:opt.v}))}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"#444",marginBottom:6}}>Qualidade</div>
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
                  <div style={{fontSize:10,color:"#666",marginBottom:6}}>Sensibilidade no Mamilo</div>
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
                    <div style={{marginTop:8,fontSize:11,color:"#ef4444",padding:"8px 10px",background:"rgba(239,68,68,0.08)",borderRadius:4}}>
                      ⚠ Sensibilidade mamilar persistente (2+ dias) em usuários de EAs é sinal clássico de E2 elevado / início de ginecomastia. Não espere o check-in quinzenal — reavalie a dose do AI imediatamente.
                    </div>
                  )}
                </div>

                {/* Pele */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:"#666",marginBottom:6}}>Oleosidade da Pele</div>
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
                    <div style={{padding:"10px 14px",background:"#0c0c0f",borderRadius:4,borderLeft:`3px solid ${hs.color}`}}>
                      <div style={{fontSize:10,color:"#555",marginBottom:4}}>Score Hormonal Atual</div>
                      <div style={{fontSize:12,color:hs.color}}>{hs.label}</div>
                    </div>
                  );
                })()}
              </div>
            )}
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
            <div style={{textAlign:"center",color:"#333",fontSize:13,marginTop:60}}>Nenhum check-in salvo ainda.</div>
          ) : (
            <>
              {historyWithScore.length >= 2 && (
                <div style={{background:"#10101a",border:"1px solid #1e1e25",borderRadius:6,padding:"16px 20px",marginBottom:16}}>
                  <div className="section-title">Últimas {Math.min(4,last4.length)} semanas</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                    {[{label:"Média",value:avg4,suffix:""},{label:"Melhor",value:best,suffix:""},{label:"Pior",value:worst,suffix:""},{label:"Tendência",value:trend4!==null?(trend4>0?`+${trend4}`:trend4):null,suffix:"pts",color:trend4>0?"#22c55e":trend4<0?"#ef4444":"#888"}].map(s=>(
                      <div key={s.label} style={{textAlign:"center"}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:s.color||(s.value!==null?getScoreInfo(s.value).color:"#333"),lineHeight:1}}>{s.value!==null?`${s.value}${s.suffix}`:"—"}</div>
                        <div style={{fontSize:9,color:"#444",marginTop:3,letterSpacing:".08em",textTransform:"uppercase"}}>{s.label}</div>
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
                          {pts.map((p,i)=><div key={i} style={{fontSize:9,color:"#333",textAlign:"center"}}>{p.week.split("·")[0]?.trim()||p.week}</div>)}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {history.map((entry,i)=>{
                const info=entry.score!==null?getScoreInfo(entry.score):null;
                const prevEntry=historyWithScore[historyWithScore.indexOf(entry)+1]||null;
                const diff=prevEntry&&entry.score!==null?entry.score-prevEntry.score:null;
                return (
                  <div key={i} style={{background:"#10101a",border:"1px solid #1e1e25",borderRadius:6,padding:"14px 18px",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:13,color:"#ccc"}}>{entry.week}</div>
                        <div style={{fontSize:9,color:"#333",marginTop:1}}>{entry.date}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {info && (
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:info.color,lineHeight:1}}>{entry.score}</div>
                            {diff!==null&&<div style={{fontSize:9,color:diff>0?"#22c55e":diff<0?"#ef4444":"#555"}}>{diff>0?`+${diff}`:diff} pts</div>}
                          </div>
                        )}
                        {entry.hormonalScore && (
                          <div style={{padding:"3px 8px",borderRadius:3,background:`${entry.hormonalScore.color}15`,border:`1px solid ${entry.hormonalScore.color}40`,fontSize:9,color:entry.hormonalScore.color}}>
                            💊 {entry.hormonalScore.status==="high"?"E2↑":entry.hormonalScore.status==="low"?"E2↓":"E2✓"}
                          </div>
                        )}
                        <button className="del-btn" onClick={()=>handleDeleteEntry(i)}>✕</button>
                      </div>
                    </div>

                    {info && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><div style={{width:6,height:6,borderRadius:"50%",background:info.readiness==="verde"?"#22c55e":info.readiness==="amarelo"?"#eab308":"#ef4444"}}/><div style={{fontSize:10,color:"#666"}}>{info.readinessLabel}</div></div>}

                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                      {CATEGORIES.map(cat=>{const val=entry.scores[cat.id];if(!val) return null;const opt=cat.options.find(o=>o.value===val);return <div key={cat.id} style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:`${opt.color}18`,color:opt.color,border:`1px solid ${opt.color}35`}}>{cat.icon} {cat.label.split(" ")[0]}</div>;})}
                    </div>

                    {/* Anchors no histórico */}
                    {entry.anchors && entry.anchors.length > 0 && (
                      <div style={{marginBottom:8,padding:"8px 10px",background:"#0c0c0f",borderRadius:4}}>
                        {entry.anchors.map((a,j)=><div key={j} style={{fontSize:11,color:"#666"}}>{a.exercise}: <span style={{color:"#aaa"}}>{a.weight}kg × {a.reps} reps</span></div>)}
                      </div>
                    )}

                    {entry.macros && Object.values(entry.macros).some(v=>v) && (
                      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8,padding:"6px 10px",background:"#0c0c0f",borderRadius:4}}>
                        {MACRO_FIELDS.map(f=>{const v=entry.macros[f.id];if(!v) return null;return <div key={f.id} style={{fontSize:10,color:"#555"}}>{f.label}: <span style={{color:"#888"}}>{v}{f.unit}</span></div>;})}
                      </div>
                    )}

                    {entry.photo && <img src={entry.photo} style={{maxWidth:"100%",maxHeight:160,borderRadius:4,border:"1px solid #2a2a30",marginBottom:8,display:"block"}} alt="foto"/>}

                    {entry.report && <div style={{fontSize:11,color:"#555",borderTop:"1px solid #1a1a22",paddingTop:8,marginTop:4,fontStyle:"italic"}}>{entry.report}</div>}
                    {entry.notes && <div style={{fontSize:11,color:"#444",borderTop:"1px solid #1a1a22",paddingTop:8,marginTop:4}}>{entry.notes}</div>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ══ COMPARADOR ══ */}
      {view === "compare" && (
        <div style={{maxWidth:680,margin:"0 auto",padding:"24px 20px 60px"}}>
          <div className="section-title">Comparador de semanas</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
            {[["A",compareA,setCompareA],["B",compareB,setCompareB]].map(([label,val,setter])=>(
              <div key={label}>
                <div style={{fontSize:10,color:"#444",marginBottom:6}}>Semana {label}</div>
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
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:entryA.score?getScoreInfo(entryA.score).color:"#333"}}>{entryA.score||"—"}</div>
                  <div style={{fontSize:11,color:"#555"}}>{entryA.week}</div>
                </div>
                <div style={{fontSize:20,color:"#333"}}>vs</div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:entryB.score?getScoreInfo(entryB.score).color:"#333"}}>{entryB.score||"—"}</div>
                  <div style={{fontSize:11,color:"#555"}}>{entryB.week}</div>
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
                        <span style={{fontSize:11,color:"#888"}}>{cat.icon} {cat.label}</span>
                        <span style={{fontSize:11,color:diff>0?"#22c55e":diff<0?"#ef4444":"#888"}}>{va||"—"} vs {vb||"—"} {diff!==0?`(${diff>0?"+":""}${diff})`:""}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                        {[{v:va,c:entryA.week},{v:vb,c:entryB.week}].map((x,i)=>(
                          <div key={i} style={{height:4,background:"#1a1a20",borderRadius:2,overflow:"hidden"}}>
                            <div style={{width:`${((x.v||0)/5)*100}%`,height:"100%",background:x.v?cat.options.find(o=>o.value===x.v)?.color||"#555":"transparent",borderRadius:2,transition:"width .3s"}}/>
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
                      <div key={ex} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"8px 10px",background:"#0c0c0f",borderRadius:4}}>
                        <span style={{fontSize:11,color:"#888"}}>{ex}</span>
                        <div style={{display:"flex",gap:12,alignItems:"center"}}>
                          <span style={{fontSize:11,color:"#555"}}>{a?`${a.weight}kg×${a.reps}`:"—"}</span>
                          <span style={{fontSize:10,color:"#333"}}>vs</span>
                          <span style={{fontSize:11,color:"#555"}}>{b?`${b.weight}kg×${b.reps}`:"—"}</span>
                          {diff!==null&&<span style={{fontSize:11,color:diff>0?"#22c55e":diff<0?"#ef4444":"#888"}}>{diff>0?"+":""}{diff}vol</span>}
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
                        {e.photo ? <img src={e.photo} style={{width:"100%",borderRadius:4,border:"1px solid #2a2a30"}} alt="foto"/> : <div style={{height:120,border:"1px dashed #2a2a30",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",color:"#333",fontSize:11}}>Sem foto</div>}
                        <div style={{fontSize:10,color:"#444",marginTop:4}}>{e.week}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(!entryA || !entryB) && compareA && compareB && (
            <div style={{textAlign:"center",color:"#333",fontSize:12,marginTop:40}}>Selecione duas semanas diferentes para comparar.</div>
          )}
          {history.length < 2 && (
            <div style={{textAlign:"center",color:"#333",fontSize:12,marginTop:40}}>Você precisa de pelo menos 2 semanas salvas para comparar.</div>
          )}
        </div>
      )}

      {/* ══ ESCALA ══ */}
      {view === "about" && (
        <div style={{maxWidth:620,margin:"0 auto",padding:"24px 20px 60px"}}>
          <div className="section-title">Interpretação do score</div>
          {SCORE_SCALE.map((s,i)=>(
            <div key={i} style={{background:"#10101a",borderLeft:`3px solid ${s.color}`,borderRadius:4,padding:"12px 16px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:s.color}}>{s.range}</div>
                <div style={{fontSize:11,color:s.color}}>{s.label}</div>
              </div>
              <div style={{fontSize:11,color:"#555"}}>{s.desc}</div>
            </div>
          ))}

          <div style={{background:"#10101a",border:"1px solid #2a1a4a",borderRadius:6,padding:"16px 18px",marginTop:16}}>
            <div className="section-title" style={{color:"#7c3aed"}}>Score Hormonal — Controle de Estrogênio em usuários de EAs</div>
            {[{color:"#ef4444",label:"E2 possivelmente ELEVADO",desc:"Sinais predominantes: mamilo sensível, oleosidade/acne, humor sensível. Ação: revisar dose do AI, solicitar exame de estradiol (preferencialmente LC-MS/MS)."},{color:"#f97316",label:"E2 possivelmente BAIXO",desc:"Sinais predominantes: articulação seca, ausência de ereção matinal, humor apático, pele seca. Ação: AI pode estar em excesso — reduzir dose ou aumentar intervalo. Solicitar exame."},{color:"#22c55e",label:"Quadro equilibrado",desc:"Sinais dentro do esperado. Manter protocolo e reavaliar em 2 semanas."}].map((s,i)=>(
              <div key={i} style={{borderLeft:`3px solid ${s.color}`,padding:"10px 14px",marginBottom:8,background:"#0c0c0f",borderRadius:4}}>
                <div style={{fontSize:12,color:s.color,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:11,color:"#555",lineHeight:1.6}}>{s.desc}</div>
              </div>
            ))}
            <div style={{fontSize:10,color:"#333",marginTop:8}}>O score hormonal não substitui exames laboratoriais. Use como auxiliar de monitoramento entre exames.</div>
          </div>

          <div style={{background:"#10101a",border:"1px solid #1e1e25",borderRadius:6,padding:"16px 18px",marginTop:12}}>
            <div className="section-title">Fundamentação</div>
            <div style={{fontSize:11,color:"#555",lineHeight:1.7}}>Modelo baseado em conceitos de John Jewett, Mike Israetel (RP), Eric Helms e James Krieger. Score hormonal baseado em marcadores clínicos de desequilíbrio androgênio/estrogênio em usuários de EAs. O uso de compostos anabolizantes pode causar aromatização excessiva (E2 elevado) ou, com uso inadequado de AI, supressão de estrogênio (E2 baixo) — ambos com consequências para saúde e performance.</div>
          </div>
        </div>
      )}
    </div>
  );
}
