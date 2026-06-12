import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hlkesynzmmveajbwmgwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_gG5lVePrVMobnK24_O-u3A_ajuRlMPV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    // Save to Supabase
    if (user) {
      const { week: w, ...rest } = entry;
      supabase.from("checkins").insert({ user_id: user.id, week: w, data: rest }).then(() => {});
    }
    setScores({}); setWeek(""); setNotes(""); setObjective({}); setMacros({}); setGut({});
    setHormonal({}); setUsesHormones(null); setAnchors([{exercise:"",weight:"",reps:""}]); setPhoto(null);
    setModal({suggestions, report:entry.report, score:entry.score, week:entry.week, hormonalScore});
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
    <div style={{minHeight:"100vh",background:"#0c0c0f",color:"#e8e6e1",fontFamily:"'DM Mono','Courier New',monospace",fontSize:"14px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0c0c0f} ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:2px}
        .opt-btn{background:transparent;border:1px solid #2a2a30;color:#aaa;padding:9px 14px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:13px;transition:all .15s;white-space:nowrap}
        .opt-btn:hover{border-color:#444;color:#ccc} .opt-btn.selected{font-weight:500;color:#0c0c0f}
        .tab-btn{background:transparent;border:none;color:#777;font-family:inherit;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;padding:10px 16px;border-bottom:2px solid transparent;transition:all .15s}
        .tab-btn.active{color:#ffffff;border-bottom-color:#e8e6e1} .tab-btn:hover:not(.active){color:#999}
        .save-btn{background:#e8e6e1;color:#0c0c0f;border:none;padding:14px 32px;font-family:inherit;font-size:13px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border-radius:3px;font-weight:500;transition:opacity .15s}
        .save-btn:disabled{opacity:.25;cursor:not-allowed} .save-btn:hover:not(:disabled){opacity:.85}
        .ghost-btn{background:transparent;border:1px solid #3a3a40;color:#888;padding:8px 16px;font-family:inherit;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:3px;transition:all .15s}
        .ghost-btn:hover{border-color:#555;color:#aaa}
        input,textarea,select{background:#15151a;border:1px solid #3a3a40;color:#e8e6e1;font-family:inherit;font-size:13px;padding:10px 14px;border-radius:4px;outline:none;transition:border-color .15s}
        input:focus,textarea:focus,select:focus{border-color:#555}
        .weight-input{background:#15151a;border:1px solid #2a2a30;color:#e8e6e1;font-family:inherit;font-size:12px;padding:4px 8px;border-radius:3px;outline:none;width:52px;text-align:center}
        .del-btn{background:transparent;border:none;color:#2a2a30;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:3px;transition:color .15s}
        .del-btn:hover{color:#ef4444}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal-box{background:#12121a;border:1px solid #2a2a35;border-radius:10px;max-width:540px;width:100%;max-height:88vh;overflow-y:auto;padding:28px 24px}
        .close-btn{background:transparent;border:1px solid #3a3a40;color:#888;padding:10px 24px;font-family:inherit;font-size:13px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:3px;transition:all .15s;margin-top:20px}
        .close-btn:hover{border-color:#555;color:#aaa}
        .card{background:#10101a;border:1px solid #1a1a20;border-radius:6px;padding:14px 16px;margin-bottom:8px}
        .section-title{font-size:12px;color:#666;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
        .horm-btn{background:transparent;border:1px solid #2a2a30;color:#888;padding:8px 16px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;transition:all .15s}
        .horm-btn.yes{background:#7c3aed;border-color:#7c3aed;color:#fff}
        .horm-btn.no{background:#2a2a30;border-color:#2a2a30;color:#aaa}
        .anchor-row{display:grid;grid-template-columns:1fr 80px 70px 32px;gap:6px;margin-bottom:6px}
      `}</style>

      {/* ── Auth loading ── */}
      {authLoading && (
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:13,color:"#444",letterSpacing:".1em"}}>CARREGANDO...</div>
        </div>
      )}

      {/* ── Auth screen ── */}
      {!authLoading && !user && (
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{width:"100%",maxWidth:380,background:"#10101a",border:"1px solid #1e1e25",borderRadius:10,padding:"32px 28px"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:".1em",color:"#e8e6e1"}}>CALIBRA</div>
              <div style={{fontSize:11,color:"#444",letterSpacing:".12em",textTransform:"uppercase",marginTop:4}}>Monitoramento de adaptação ao treino</div>
            </div>

            <div style={{display:"flex",marginBottom:20,background:"#0c0c0f",borderRadius:4,padding:3}}>
              {[["login","Entrar"],["register","Criar conta"]].map(([v,l])=>(
                <button key={v} onClick={()=>{setAuthView(v);setAuthError("");setAuthMsg("");}}
                  style={{flex:1,padding:"8px",border:"none",borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:12,letterSpacing:".06em",transition:"all .15s",
                    background:authView===v?"#1e1e2e":"transparent",
                    color:authView===v?"#e8e6e1":"#555"}}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:12,color:"#666"}}>E-mail</label>
                <input type="email" placeholder="seu@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleRegister())}
                  style={{width:"100%"}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <label style={{fontSize:12,color:"#666"}}>Senha</label>
                <input type="password" placeholder={authView==="register"?"mínimo 6 caracteres":""} value={authPassword} onChange={e=>setAuthPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(authView==="login"?handleLogin():handleRegister())}
                  style={{width:"100%"}}/>
              </div>
            </div>

            {authError && <div style={{fontSize:12,color:"#ef4444",marginBottom:12,padding:"8px 12px",background:"rgba(239,68,68,0.08)",borderRadius:4}}>{authError}</div>}
            {authMsg && <div style={{fontSize:12,color:"#22c55e",marginBottom:12,padding:"8px 12px",background:"rgba(34,197,94,0.08)",borderRadius:4}}>{authMsg}</div>}

            <button className="save-btn" style={{width:"100%"}}
              onClick={authView==="login"?handleLogin:handleRegister}>
              {authView==="login"?"Entrar":"Criar conta"}
            </button>

            <div style={{fontSize:11,color:"#333",textAlign:"center",marginTop:16,lineHeight:1.6}}>
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
            <div style={{fontSize:13,color:"#666",marginBottom:18}}>{modal.week}</div>

            {/* Score biofeedback */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:"14px 16px",background:"#0c0c0f",borderRadius:6}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:getScoreInfo(modal.score).color,lineHeight:1}}>{modal.score}</div>
              <div>
                <div style={{fontSize:14,color:getScoreInfo(modal.score).color,marginBottom:6}}>{getScoreInfo(modal.score).label}</div>
                <div style={{fontSize:13,color:"#777"}}>{getScoreInfo(modal.score).readinessDesc}</div>
              </div>
            </div>

            {/* Score hormonal */}
            {modal.hormonalScore && (
              <div style={{padding:"12px 16px",background:"#0c0c0f",borderRadius:6,marginBottom:16,borderLeft:`3px solid ${modal.hormonalScore.color}`}}>
                <div style={{fontSize:10,color:"#555",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Score Hormonal</div>
                <div style={{fontSize:15,color:modal.hormonalScore.color,marginBottom:8}}>{modal.hormonalScore.label}</div>
                <div style={{fontSize:13,color:"#888",lineHeight:1.7}}>{modal.hormonalScore.suggestion}</div>
                <div style={{display:"flex",gap:16,marginTop:10}}>
                  <div style={{fontSize:10,color:"#ef4444"}}>E2 alto: {modal.hormonalScore.highScore}%</div>
                  <div style={{fontSize:10,color:"#f97316"}}>E2 baixo: {modal.hormonalScore.lowScore}%</div>
                </div>
              </div>
            )}

            <div style={{fontSize:13,color:"#777",fontStyle:"italic",marginBottom:16,paddingLeft:12,borderLeft:"2px solid #2a2a35"}}>{modal.report}</div>

            {modal.suggestions.length > 0 ? (
              <>
                <div style={{fontSize:10,color:"#444",letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}>Sugestões para as próximas semanas</div>
                {modal.suggestions.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:12,marginBottom:10,padding:"12px 14px",background:"#0c0c0f",borderRadius:6,borderLeft:`2px solid ${s.priority?"#ef4444":"#2a2a45"}`}}>
                    <span style={{fontSize:16,flexShrink:0}}>{s.icon}</span>
                    <div>
                      <div style={{fontSize:11,color:s.priority?"#ef4444":"#777",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{s.area}</div>
                      <div style={{fontSize:13,color:"#bbb",lineHeight:1.7}}>{s.text}</div>
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
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:".1em",color:"#e8e6e1"}}>CALIBRA</div>
          <div style={{fontSize:10,color:"#444",letterSpacing:".1em",textTransform:"uppercase",marginTop:2}}>Monitoramento de adaptação ao treino</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex"}}>
            {[["form","Avaliação"],["history",`Histórico${history.length>0?` (${history.length})`:""}`,],["compare","Comparar"],["profile","Perfil"],["about","Escala"]].map(([v,l])=>(
              <button key={v} className={`tab-btn ${view===v?"active":""}`} onClick={()=>setView(v)}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:11,color:"#333",display:"none"}}>{user?.email}</span>
            <button className="ghost-btn" onClick={handleExport}>⬇ Backup</button>
            <label className="ghost-btn" style={{cursor:"pointer"}}>⬆ Importar<input type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/></label>
            <button className="ghost-btn" style={{borderColor:"#2a1a1a",color:"#664444"}} onClick={handleLogout}>Sair</button>
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
                    <div style={{fontSize:14,color:scoreInfo.readiness==="verde"?"#22c55e":scoreInfo.readiness==="amarelo"?"#eab308":"#ef4444"}}>{scoreInfo.readinessLabel}</div>
                  </div>
                  <div style={{fontSize:13,color:"#777",marginBottom:8}}>{scoreInfo.readinessDesc}</div>
                  {bottlenecks.map((b,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:10,color:"#444"}}>{i+1}.</span>
                      <span style={{fontSize:13,color:b.cat.options.find(o=>o.value===scores[b.cat.id])?.color||"#888"}}>{b.cat.icon} {b.cat.label}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{color:"#333",fontSize:14}}>Preencha os critérios para calcular o score.<br/><span style={{fontSize:11,color:"#252530"}}>{totalAnswered}/7 preenchidos</span></div>
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
                    <span style={{fontSize:13,color:"#aaa"}}>{cat.icon} {cat.label}</span>
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
                  <div style={{fontSize:13,letterSpacing:".06em",textTransform:"uppercase",color:scores[cat.id]?cat.options.find(o=>o.value===scores[cat.id])?.color:"#ddd",fontWeight:500}}>
                    {cat.label}<span style={{fontSize:9,color:"#2a2a35",marginLeft:8,textTransform:"none",letterSpacing:0,fontWeight:400}}>peso {weights[cat.id]}%</span>
                  </div>
                  <div style={{fontSize:12,color:"#666",marginTop:4}}>{cat.description}</div>
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
            <div style={{fontSize:12,color:"#555",marginBottom:12}}>Registre exercício principal + carga + reps para comparar semana a semana</div>
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
                  <div style={{fontSize:12,color:"#666",letterSpacing:".06em",textTransform:"uppercase",marginBottom:8}}>vs semana anterior</div>
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
                  <label style={{fontSize:12,color:"#777"}}>{f.label} ({f.unit})</label>
                  <input type="number" step="1" placeholder={f.placeholder} value={macros[f.id]||""} onChange={e=>setMacros(m=>({...m,[f.id]:e.target.value}))} style={{width:"100%"}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Saúde intestinal */}
          <div className="card">
            <div className="section-title">🫙 Saúde intestinal</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:13,color:"#777",marginBottom:8}}>Frequência diária</div>
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
              <div style={{fontSize:13,color:"#777",marginBottom:8}}>Consistência das fezes</div>
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
                  <label style={{fontSize:12,color:"#777"}}>{f.label} ({f.unit})</label>
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
            <div style={{fontSize:13,color:"#777",marginBottom:12}}>Você usa Esteroides Anabolizantes (EAs) — incluindo TRT, testosterona, derivados ou outros compostos que possam afetar o balanço hormonal?</div>
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
                    <div style={{fontSize:13,color:"#888",marginBottom:8}}>{field.label}</div>
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
                  <div style={{fontSize:12,color:"#666",marginBottom:8}}>Frequência semanal</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                    {[{v:"daily",l:"Diária"},{v:"frequent",l:"3–5x/semana"},{v:"rare",l:"1–2x/semana"},{v:"absent",l:"Ausente"}].map(opt=>(
                      <button key={opt.v} className={`opt-btn ${hormonal.morningErectionFreq===opt.v?"selected":""}`}
                        style={hormonal.morningErectionFreq===opt.v?{background:"#7c3aed",borderColor:"#7c3aed",color:"#fff"}:{}}
                        onClick={()=>setHormonal(h=>({...h,morningErectionFreq:opt.v}))}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:"#666",marginBottom:8}}>Qualidade</div>
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
                  <div style={{fontSize:13,color:"#888",marginBottom:8}}>Sensibilidade no Mamilo</div>
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
                  <div style={{fontSize:13,color:"#888",marginBottom:8}}>Oleosidade da Pele</div>
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
                        <div style={{fontSize:15,color:"#ddd"}}>{entry.week}</div>
                        <div style={{fontSize:11,color:"#555",marginTop:2}}>{entry.date}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {info && (
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:info.color,lineHeight:1}}>{entry.score}</div>
                            {diff!==null&&<div style={{fontSize:9,color:diff>0?"#22c55e":diff<0?"#ef4444":"#555"}}>{diff>0?`+${diff}`:diff} pts</div>}
                          </div>
                        )}
                        {entry.hormonalScore && (
                          <div style={{padding:"3px 8px",borderRadius:3,background:`${entry.hormonalScore.color}15`,border:`1px solid ${entry.hormonalScore.color}40`,fontSize:11,color:entry.hormonalScore.color}}>
                            💊 {entry.hormonalScore.status==="high"?"E2↑":entry.hormonalScore.status==="low"?"E2↓":"E2✓"}
                          </div>
                        )}
                        <button className="del-btn" onClick={()=>handleDeleteEntry(i)}>✕</button>
                      </div>
                    </div>

                    {info && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><div style={{width:6,height:6,borderRadius:"50%",background:info.readiness==="verde"?"#22c55e":info.readiness==="amarelo"?"#eab308":"#ef4444"}}/><div style={{fontSize:12,color:"#888"}}>{info.readinessLabel}</div></div>}

                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                      {CATEGORIES.map(cat=>{const val=entry.scores[cat.id];if(!val) return null;const opt=cat.options.find(o=>o.value===val);return <div key={cat.id} style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:`${opt.color}18`,color:opt.color,border:`1px solid ${opt.color}35`}}>{cat.icon} {cat.label.split(" ")[0]}</div>;})}
                    </div>

                    {/* Anchors no histórico */}
                    {entry.anchors && entry.anchors.length > 0 && (
                      <div style={{marginBottom:8,padding:"8px 10px",background:"#0c0c0f",borderRadius:4}}>
                        {entry.anchors.map((a,j)=><div key={j} style={{fontSize:13,color:"#777"}}>{a.exercise}: <span style={{color:"#bbb"}}>{a.weight}kg × {a.reps} reps</span></div>)}
                      </div>
                    )}

                    {entry.macros && Object.values(entry.macros).some(v=>v) && (
                      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8,padding:"6px 10px",background:"#0c0c0f",borderRadius:4}}>
                        {MACRO_FIELDS.map(f=>{const v=entry.macros[f.id];if(!v) return null;return <div key={f.id} style={{fontSize:12,color:"#666"}}>{f.label}: <span style={{color:"#aaa"}}>{v}{f.unit}</span></div>;})}
                      </div>
                    )}

                    {entry.photo && <img src={entry.photo} style={{maxWidth:"100%",maxHeight:160,borderRadius:4,border:"1px solid #2a2a30",marginBottom:8,display:"block"}} alt="foto"/>}

                    {entry.report && <div style={{fontSize:12,color:"#666",borderTop:"1px solid #1e1e25",paddingTop:10,marginTop:6,fontStyle:"italic"}}>{entry.report}</div>}
                    {entry.notes && <div style={{fontSize:13,color:"#666",borderTop:"1px solid #1e1e25",paddingTop:10,marginTop:6}}>{entry.notes}</div>}
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
          <div className="section-title" style={{fontSize:14,color:"#888"}}>Comparador de semanas</div>
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
                        <span style={{fontSize:13,color:diff>0?"#22c55e":diff<0?"#ef4444":"#888"}}>{va||"—"} vs {vb||"—"} {diff!==0?`(${diff>0?"+":""}${diff})`:""}</span>
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
                        <span style={{fontSize:13,color:"#aaa"}}>{ex}</span>
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
            <div style={{textAlign:"center",color:"#333",fontSize:14,marginTop:40}}>Selecione duas semanas diferentes para comparar.</div>
          )}
          {history.length < 2 && (
            <div style={{textAlign:"center",color:"#333",fontSize:14,marginTop:40}}>Você precisa de pelo menos 2 semanas salvas para comparar.</div>
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
                  <label style={{fontSize:12,color:"#777"}}>{f.label}</label>
                  <input type={f.type||"text"} placeholder={f.placeholder} value={profile[f.key]||""} onChange={e=>setProfile(p=>({...p,[f.key]:e.target.value}))} style={{width:"100%"}}/>
                </div>
              ))}
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"#777",marginBottom:6}}>Nível de treinamento</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {["Iniciante","Intermediário","Avançado"].map(l=>(
                  <button key={l} className={`opt-btn ${profile.level===l?"selected":""}`}
                    style={profile.level===l?{background:"#22c55e",borderColor:"#22c55e",color:"#0c0c0f"}:{}}
                    onClick={()=>setProfile(p=>({...p,level:l}))}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"#777",marginBottom:6}}>Objetivo principal</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {["Cutting","Bulking","Recomposição","Saúde / Qualidade de vida"].map(g=>(
                  <button key={g} className={`opt-btn ${profile.goal===g?"selected":""}`}
                    style={profile.goal===g?{background:"#84cc16",borderColor:"#84cc16",color:"#0c0c0f"}:{}}
                    onClick={()=>setProfile(p=>({...p,goal:g}))}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"#777",marginBottom:6}}>Protocolo de treino</div>
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
              <label style={{fontSize:12,color:"#777"}}>Condições de saúde relevantes</label>
              <textarea placeholder="ex: hipertensão controlada, hipotireoidismo..." value={profile.health||""} onChange={e=>setProfile(p=>({...p,health:e.target.value}))} style={{width:"100%",minHeight:56,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
              <label style={{fontSize:12,color:"#777"}}>Medicamentos em uso (além de EAs)</label>
              <textarea placeholder="ex: levotiroxina 50mcg, losartana 50mg..." value={profile.meds||""} onChange={e=>setProfile(p=>({...p,meds:e.target.value}))} style={{width:"100%",minHeight:56,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
              <label style={{fontSize:12,color:"#777"}}>Meta (opcional — não obrigatório)</label>
              <input type="text" placeholder="ex: chegar a 82kg mantendo performance" value={profile.goal_notes||""} onChange={e=>setProfile(p=>({...p,goal_notes:e.target.value}))} style={{width:"100%"}}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:12,color:"#777"}}>Coach / Médico responsável</label>
              <input type="text" placeholder="ex: Dr. João Silva" value={profile.coach||""} onChange={e=>setProfile(p=>({...p,coach:e.target.value}))} style={{width:"100%"}}/>
            </div>
          </div>

          {/* Fotos de poses */}
          <div className="card">
            <div className="section-title">📸 Fotos de Referência (Poses Básicas)</div>
            <div style={{fontSize:12,color:"#555",marginBottom:14}}>Atualize sempre que quiser registrar evolução visual.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[
                {key:"front",label:"Frente"},
                {key:"back",label:"Costas"},
                {key:"side",label:"Lateral"},
              ].map(pose=>(
                <div key={pose.key} style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:6}}>{pose.label}</div>
                  {posePhotos[pose.key] ? (
                    <div style={{position:"relative"}}>
                      <img src={posePhotos[pose.key]} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:4,border:"1px solid #2a2a30"}} alt={pose.label}/>
                      <button className="del-btn" style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.75)",color:"#ccc"}} onClick={()=>setPosePhotos(p=>({...p,[pose.key]:null}))}>✕</button>
                    </div>
                  ) : (
                    <label style={{display:"flex",alignItems:"center",justifyContent:"center",aspectRatio:"3/4",border:"1px dashed #2a2a30",borderRadius:4,cursor:"pointer",color:"#333",fontSize:11,flexDirection:"column",gap:4}}>
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
            <div className="section-title">🫁 Capacidade Aeróbica — Score VO2 estimado</div>
            <div style={{fontSize:12,color:"#555",marginBottom:14,lineHeight:1.6}}>
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
                <div style={{fontSize:13,color:"#888",marginBottom:8}}>{field.label}</div>
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
                <div style={{fontSize:12,color:"#333",fontStyle:"italic"}}>Responda pelo menos 3 perguntas para ver o resultado.</div>
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
                <div style={{marginTop:16,padding:"14px 16px",background:"#0c0c0f",borderRadius:6,borderLeft:`3px solid ${color}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontSize:14,color:color}}>{level}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:color,lineHeight:1}}>{pct}</div>
                  </div>
                  <div style={{fontSize:12,color:"#777",marginBottom:8,lineHeight:1.6}}><span style={{color:"#555"}}>Recomendação: </span>{rec}</div>
                  <div style={{fontSize:11,color:"#555",fontStyle:"italic"}}>{zone}</div>
                  <div style={{fontSize:10,color:"#333",marginTop:8}}>Score baseado na Escala MRC adaptada. Não substitui teste ergoespirométrico.</div>
                </div>
              );
            })()}
          </div>
          {/* Composição Corporal — US Navy + TDEE */}
          <div className="card">
            <div className="section-title">🔬 Composição Corporal — Método US Navy</div>
            <div style={{fontSize:12,color:"#555",marginBottom:14,lineHeight:1.6}}>
              Estimativa de % de gordura corporal por circunferências. Preencha os campos abaixo — o cálculo é atualizado automaticamente a cada check-in com novas medidas.
            </div>

            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"#777",marginBottom:6}}>Sexo biológico</div>
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
                  <label style={{fontSize:12,color:"#777"}}>{f.label}</label>
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
                <div style={{padding:"14px 16px",background:"#0c0c0f",borderRadius:6,borderLeft:`3px solid ${bfColor}`,marginTop:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:bfColor,lineHeight:1}}>{bf}%</div>
                      <div style={{fontSize:11,color:bfColor}}>{bfLabel}</div>
                    </div>
                    {w && (
                      <div style={{display:"flex",gap:20}}>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#aaa",lineHeight:1}}>{lbm}kg</div>
                          <div style={{fontSize:11,color:"#555"}}>Massa magra</div>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#888",lineHeight:1}}>{fatMass}kg</div>
                          <div style={{fontSize:11,color:"#555"}}>Massa gorda</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:11,color:"#444"}}>Método US Navy — estimativa. Margem de erro ±3–4%. Não substitui DEXA ou hidrostática.</div>
                </div>
              );
            })()}
          </div>

          {/* TDEE — Gasto Calórico Estimado */}
          <div className="card">
            <div className="section-title">🔥 Gasto Calórico Estimado (TDEE)</div>
            <div style={{fontSize:12,color:"#555",marginBottom:14,lineHeight:1.6}}>
              Baseado em Mifflin-St Jeor para TMB + multiplicador de atividade personalizado.
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[
                {key:"tdee_age",label:"Idade",placeholder:"ex: 34",type:"number"},
                {key:"tdee_weight",label:"Peso atual (kg)",placeholder:"ex: 84",type:"number"},
              ].map(f=>(
                <div key={f.key} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <label style={{fontSize:12,color:"#777"}}>{f.label}</label>
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
                <div style={{fontSize:13,color:"#888",marginBottom:8}}>{field.label}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {field.opts.map(opt=>(
                    <button key={opt.v} className={`opt-btn ${profile[field.key]===opt.v?"selected":""}`}
                      style={profile[field.key]===opt.v?{background:"#f97316",borderColor:"#f97316",color:"#0c0c0f"}:{}}
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
                <div style={{fontSize:12,color:"#333",fontStyle:"italic",marginTop:8}}>Preencha peso, altura, idade e sexo para calcular.</div>
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
                <div style={{marginTop:12,padding:"16px",background:"#0c0c0f",borderRadius:6}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                    <div style={{textAlign:"center",padding:"10px",background:"#12121a",borderRadius:4}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#888",lineHeight:1}}>{tmb}</div>
                      <div style={{fontSize:11,color:"#555",marginTop:2}}>TMB (kcal)</div>
                    </div>
                    <div style={{textAlign:"center",padding:"10px",background:"#12121a",borderRadius:4}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#f97316",lineHeight:1}}>{tdee}</div>
                      <div style={{fontSize:11,color:"#555",marginTop:2}}>TDEE estimado</div>
                      <div style={{fontSize:10,color:"#333",marginTop:1}}>{factorLabel} (×{factor.toFixed(2)})</div>
                    </div>
                  </div>

                  <div style={{fontSize:11,color:"#555",marginBottom:10,letterSpacing:".06em",textTransform:"uppercase"}}>Metas calóricas sugeridas</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {[
                      {label:"Cutting (−18%)",value:cutting,color:"#22c55e"},
                      {label:"Cutting leve (−10%)",value:mild,color:"#84cc16"},
                      {label:"Bulk (+10%)",value:bulk,color:"#3b82f6"},
                    ].map(c=>(
                      <div key={c.label} style={{textAlign:"center",padding:"10px 6px",background:"#12121a",borderRadius:4}}>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:c.color,lineHeight:1}}>{c.value}</div>
                        <div style={{fontSize:10,color:"#444",marginTop:2}}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"#333",marginTop:12}}>Mifflin-St Jeor + fator de atividade personalizado. Margem de erro ±10–15%. Ajuste conforme resposta do corpo nas semanas.</div>
                </div>
              );
            })()}
          </div>

          {/* Tabela de medidas */}
          <div className="card">
            <div className="section-title">📐 Tabela de Medidas</div>

            {/* Nova medição */}
            <div style={{background:"#0c0c0f",borderRadius:6,padding:"14px",marginBottom:16}}>
              <div style={{fontSize:12,color:"#666",marginBottom:10}}>Nova medição</div>
              <div style={{marginBottom:8}}>
                <label style={{fontSize:11,color:"#555",display:"block",marginBottom:4}}>Data</label>
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
                    <label style={{fontSize:10,color:"#555"}}>{f.label}</label>
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
                        <th key={h} style={{fontSize:10,color:"#555",padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #1e1e25",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measures.map((m,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #1a1a20"}}>
                        {["date","weight","waist","hip","chest","shoulders","armR","armL","thighR","thighL","calf","bodyfat_navy","lbm"].map(k=>(
                          <td key={k} style={{fontSize:12,color:"#888",padding:"7px 8px",whiteSpace:"nowrap"}}>{m[k]||"—"}</td>
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
              <div style={{textAlign:"center",color:"#333",fontSize:12,padding:"20px 0"}}>Nenhuma medição registrada ainda.</div>
            )}
          </div>

        </div>
      )}

      {/* ══ ESCALA ══ */}
      {view === "about" && (
        <div style={{maxWidth:620,margin:"0 auto",padding:"24px 20px 60px"}}>
          <div className="section-title">Interpretação do score</div>
          {SCORE_SCALE.map((s,i)=>(
            <div key={i} style={{background:"#10101a",borderLeft:`3px solid ${s.color}`,borderRadius:4,padding:"12px 16px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:s.color}}>{s.range}</div>
                <div style={{fontSize:13,color:s.color}}>{s.label}</div>
              </div>
              <div style={{fontSize:13,color:"#777"}}>{s.desc}</div>
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
      </>
    )}
    </div>
  );
}
