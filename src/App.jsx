import { useState, useEffect, useRef } from "react";

// ─── METODOLOGIA ─────────────────────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  performance: 25, recovery: 20, sleep: 20,
  energy: 15, joints: 10, hunger: 5, pump: 5,
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
  { id:"joints", label:"Dor Articular", icon:"🦴", description:"Ombros, cotovelos, joelhos, lombar — sem dores?",
    options:[{value:5,label:"Sem dores",color:"#22c55e"},{value:4,label:"Leve desconforto ocasional",color:"#84cc16"},{value:3,label:"Desconforto frequente",color:"#eab308"},{value:2,label:"Dor presente no treino",color:"#f97316"},{value:1,label:"Dor limitante",color:"#ef4444"}]},
  { id:"hunger", label:"Fome", icon:"🍽️", description:"Controle da fome e ausência de compulsões",
    options:[{value:5,label:"Controlada, sem compulsão",color:"#22c55e"},{value:4,label:"Controlável",color:"#84cc16"},{value:3,label:"Fome moderada",color:"#eab308"},{value:2,label:"Fome alta",color:"#f97316"},{value:1,label:"Fome extrema / compulsão",color:"#ef4444"}]},
  { id:"pump", label:"Pump e Conexão Muscular", icon:"💪", description:"Sente o músculo? Pump presente durante o treino?",
    options:[{value:5,label:"Pump excelente, conexão total",color:"#22c55e"},{value:4,label:"Bom pump",color:"#84cc16"},{value:3,label:"Pump moderado",color:"#eab308"},{value:2,label:"Pump fraco",color:"#f97316"},{value:1,label:"Sem pump, músculo vazio",color:"#ef4444"}]},
];

const OBJECTIVE_FIELDS = [
  { id:"weight", label:"Peso corporal", unit:"kg", placeholder:"ex: 83.4" },
  { id:"waist", label:"Cintura", unit:"cm", placeholder:"ex: 84" },
  { id:"rhr", label:"FC de repouso", unit:"bpm", placeholder:"ex: 58" },
  { id:"steps", label:"Passos/dia (média)", unit:"k", placeholder:"ex: 7.2" },
];

const MACRO_FIELDS = [
  { id:"calories", label:"Calorias", unit:"kcal", placeholder:"ex: 2400" },
  { id:"protein", label:"Proteína", unit:"g", placeholder:"ex: 180" },
  { id:"carbs", label:"Carboidrato", unit:"g", placeholder:"ex: 250" },
  { id:"fat", label:"Gordura", unit:"g", placeholder:"ex: 70" },
];

const GUT_FREQ = [
  { value:"0", label:"0x" },
  { value:"1", label:"1x" },
  { value:"2", label:"2x" },
  { value:"3", label:"3x+" },
];

const GUT_CONSISTENCY = [
  { value:5, label:"Ideal (formada, fácil)", color:"#22c55e" },
  { value:4, label:"Boa, leve variação", color:"#84cc16" },
  { value:3, label:"Pastosa / irregular", color:"#eab308" },
  { value:2, label:"Diarreia / constipação leve", color:"#f97316" },
  { value:1, label:"Diarreia / constipação severa", color:"#ef4444" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getScoreInfo = (score) => {
  if (score >= 85) return { color:"#22c55e", label:"Adaptando bem", bg:"rgba(34,197,94,0.12)", readiness:"verde", readinessLabel:"Treine normalmente", readinessDesc:"Biofeedback positivo. Mantenha o plano." };
  if (score >= 70) return { color:"#84cc16", label:"No caminho certo", bg:"rgba(132,204,22,0.12)", readiness:"verde", readinessLabel:"Treine normalmente", readinessDesc:"Boa adaptação. Monitore de perto." };
  if (score >= 55) return { color:"#eab308", label:"Atenção necessária", bg:"rgba(234,179,8,0.12)", readiness:"amarelo", readinessLabel:"Mantenha as cargas", readinessDesc:"Primeiros sinais de fadiga. Não progrida agora." };
  if (score >= 40) return { color:"#f97316", label:"Sinal de alerta", bg:"rgba(249,115,22,0.12)", readiness:"amarelo", readinessLabel:"Reduza o volume", readinessDesc:"Recuperação comprometida. Considere deload parcial." };
  return { color:"#ef4444", label:"Fadiga acumulada", bg:"rgba(239,68,68,0.12)", readiness:"vermelho", readinessLabel:"Deload imediato", readinessDesc:"Alto risco de estagnação ou lesão." };
};

const SCORE_SCALE = [
  { range:"85–100", color:"#22c55e", label:"Adaptando bem", desc:"Manter o plano. Pode progredir." },
  { range:"70–84", color:"#84cc16", label:"No caminho certo", desc:"Boa adaptação. Monitorar." },
  { range:"55–69", color:"#eab308", label:"Atenção necessária", desc:"Primeiros sinais de fadiga acumulada." },
  { range:"40–54", color:"#f97316", label:"Sinal de alerta", desc:"Recuperação comprometida. Deload parcial." },
  { range:"0–39", color:"#ef4444", label:"Fadiga acumulada", desc:"Alto risco de estagnação ou lesão." },
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
    .filter((cat) => scoreMap[cat.id] !== undefined)
    .map((cat) => ({ cat, impact: ((5 - scoreMap[cat.id]) / 5) * weights[cat.id], value: scoreMap[cat.id] }))
    .filter((x) => x.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);
};

// ─── GERADOR DE SUGESTÕES ─────────────────────────────────────────────────────
const generateSuggestions = (entry, recentHistory, weights) => {
  const suggestions = [];
  const s = entry.scores;
  const gut = entry.gut || {};
  const macros = entry.macros || {};

  // ── Sugestões por critério individual ──
  if (s.performance <= 2) suggestions.push({ icon:"⚡", area:"Performance", text:"Cargas caindo: evite aumentar volume ou carga nas próximas 1–2 semanas. Priorize execução e qualidade de repetições." });
  if (s.recovery <= 2) suggestions.push({ icon:"🔄", area:"Recuperação", text:"Recuperação comprometida: considere reduzir frequência semanal ou inserir um dia extra de descanso ativo." });
  if (s.sleep <= 2) suggestions.push({ icon:"🌙", area:"Sono", text:"Sono ruim impacta diretamente o cortisol e a síntese proteica. Evite treinos após 20h e reduza estimulantes após 14h." });
  if (s.energy <= 2) suggestions.push({ icon:"🔋", area:"Energia", text:"Energia baixa: revise distribuição de carboidratos — concentre maior parte no pré e pós-treino." });
  if (s.hunger <= 2) suggestions.push({ icon:"🍽️", area:"Fome", text:"Fome elevada pode indicar déficit agressivo demais. Considere um refeed de 1–2 dias com calorias na manutenção." });
  if (s.joints <= 2) suggestions.push({ icon:"🦴", area:"Articulações", text:"Dor articular: substitua exercícios com carga axial por variações com menor stress articular. Avalie deload de intensidade." });
  if (s.pump <= 2 && (s.energy <= 3 || s.recovery <= 3)) suggestions.push({ icon:"💪", area:"Pump", text:"Pump fraco associado a baixa energia/recuperação sugere glicogênio depletado. Aumente carboidratos no pré-treino." });

  // ── Sugestões baseadas em macros ──
  if (macros.protein && macros.weight) {
    const ratio = parseFloat(macros.protein) / parseFloat(macros.weight);
    if (ratio < 1.8) suggestions.push({ icon:"🥩", area:"Proteína", text:`Ingestão de proteína abaixo do ideal (${ratio.toFixed(1)}g/kg). Em cutting, mire 2.0–2.4g/kg para preservar massa muscular.` });
  }
  if (macros.calories && entry.objective?.weight) {
    // sem cálculo de TDEE — apenas alerta genérico se calorias muito baixas
    if (parseFloat(macros.calories) < 1400) suggestions.push({ icon:"🔢", area:"Calorias", text:"Ingestão calórica muito baixa. Déficits acima de 25% do TDEE aumentam risco de catabolismo muscular e supressão hormonal." });
  }

  // ── Sugestões de saúde intestinal ──
  if (gut.consistency <= 2) suggestions.push({ icon:"🫙", area:"Saúde intestinal", text:"Consistência das fezes irregular sugere má absorção ou estresse digestivo. Revise fibras (25–35g/dia), hidratação e fontes proteicas." });
  if (gut.frequency === "0") suggestions.push({ icon:"🫙", area:"Trânsito intestinal", text:"Ausência de evacuação diária pode indicar desidratação ou fibras insuficientes. Priorize vegetais, psyllium e 35ml/kg de água." });
  if (gut.frequency === "3" && gut.consistency <= 3) suggestions.push({ icon:"🫙", area:"Trânsito intestinal", text:"Alta frequência com consistência ruim pode indicar intolerância alimentar ou excesso de adoçantes. Avalie fontes de carboidrato." });

  // ── Sugestões baseadas em padrão histórico (últimas semanas) ──
  const recent = recentHistory.filter(h => h.score !== null).slice(0, 4);
  if (recent.length >= 3) {
    const declining = recent[0].score < recent[1].score && recent[1].score < recent[2].score;
    const rising = recent[0].score > recent[1].score && recent[1].score > recent[2].score;
    const volatile = Math.max(...recent.map(h=>h.score)) - Math.min(...recent.map(h=>h.score)) > 20;

    if (declining) suggestions.push({ icon:"📉", area:"Tendência", text:"Score em queda por 3 semanas consecutivas. Deload programado de 5–7 dias recomendado: reduza volume em 40–50% e mantenha intensidade." });
    if (rising) suggestions.push({ icon:"📈", area:"Tendência", text:"Três semanas de melhora consistente. Momento favorável para progressão de carga ou adição de volume nos exercícios principais." });
    if (volatile) suggestions.push({ icon:"〰️", area:"Consistência", text:"Score muito oscilante entre semanas. Revise variáveis externas: sono, estresse, adesão alimentar. Consistência supera intensidade." });
  }

  return suggestions;
};

const generateReport = (entry, prev, weights) => {
  const info = getScoreInfo(entry.score);
  const diff = prev ? entry.score - prev.score : null;
  const vs = diff !== null ? ` (${diff > 0 ? "+" : ""}${diff} pts vs semana anterior)` : "";
  const bottlenecks = getBottlenecks(entry.scores, weights);
  const bottleneckStr = bottlenecks.length > 0 ? ` Limitadores: ${bottlenecks.map(b => b.cat.label.toLowerCase()).join(", ")}.` : "";
  const improvStr = prev && diff > 0 ? " Melhora vs semana anterior." : prev && diff < -3 ? " Queda relevante — revisar protocolo." : "";
  return `${entry.week}: Score ${entry.score}${vs}.${improvStr}${bottleneckStr} ${info.readinessDesc}`;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function BiofeedbackScore() {
  const [scores, setScores] = useState({});
  const [week, setWeek] = useState("");
  const [notes, setNotes] = useState("");
  const [objective, setObjective] = useState({});
  const [macros, setMacros] = useState({});
  const [gut, setGut] = useState({});
  const [history, setHistory] = useState([]);
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [view, setView] = useState("form");
  const [showWeights, setShowWeights] = useState(false);
  const [modal, setModal] = useState(null); // { suggestions, report, score }
  const loaded = useRef(false);

  const store = {
    get: async (key) => {
      if (typeof window.storage?.get === "function") { const r = await window.storage.get(key); return r?.value ?? null; }
      return localStorage.getItem(key);
    },
    set: async (key, value) => {
      if (typeof window.storage?.set === "function") { await window.storage.set(key, value); }
      else localStorage.setItem(key, value);
    },
  };

  useEffect(() => {
    const load = async () => {
      try { const h = await store.get("bf-history"); if (h) setHistory(JSON.parse(h)); } catch (_) {}
      try { const w = await store.get("bf-weights"); if (w) setWeights(JSON.parse(w)); } catch (_) {}
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
  const historyWithScore = history.filter((h) => h.score !== null);
  const last4 = historyWithScore.slice(0, 4);
  const avg4 = last4.length > 0 ? Math.round(last4.reduce((a, b) => a + b.score, 0) / last4.length) : null;
  const best = historyWithScore.length > 0 ? Math.max(...historyWithScore.map(h => h.score)) : null;
  const worst = historyWithScore.length > 0 ? Math.min(...historyWithScore.map(h => h.score)) : null;
  const trend4 = last4.length >= 2 ? last4[0].score - last4[last4.length - 1].score : null;
  const totalWeightSum = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    if (!week.trim() || totalAnswered === 0) return;
    const prev = historyWithScore[0] || null;
    const entry = {
      week, scores: { ...scores }, objective: { ...objective },
      macros: { ...macros }, gut: { ...gut },
      score: computeScore(scores, weights),
      notes, date: new Date().toLocaleDateString("pt-BR"), report: "",
    };
    entry.report = generateReport(entry, prev, weights);
    const suggestions = generateSuggestions(entry, historyWithScore, weights);
    setHistory((h) => [entry, ...h]);
    setScores({}); setWeek(""); setNotes(""); setObjective({}); setMacros({}); setGut({});
    setModal({ suggestions, report: entry.report, score: entry.score, week: entry.week });
  };

  const handleDeleteEntry = (idx) => {
    if (window.confirm("Excluir este registro?")) setHistory((h) => h.filter((_, i) => i !== idx));
  };
  const handleWeightChange = (id, val) => { const n = Math.max(0, Math.min(50, parseInt(val) || 0)); setWeights((w) => ({ ...w, [id]: n })); };
  const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ version:1, exportedAt:new Date().toISOString(), history, weights }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `biofeedback-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); if (data.history) setHistory(data.history); if (data.weights) setWeights(data.weights); setView("history"); } catch (_) { alert("Arquivo inválido."); } };
    reader.readAsText(file); e.target.value = "";
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0c0c0f", color:"#e8e6e1", fontFamily:"'DM Mono','Courier New',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0c0c0f} ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:2px}
        .opt-btn{background:transparent;border:1px solid #2a2a30;color:#888;padding:7px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;transition:all .15s;white-space:nowrap}
        .opt-btn:hover{border-color:#444;color:#ccc} .opt-btn.selected{font-weight:500;color:#0c0c0f}
        .tab-btn{background:transparent;border:none;color:#555;font-family:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;padding:10px 18px;border-bottom:2px solid transparent;transition:all .15s}
        .tab-btn.active{color:#e8e6e1;border-bottom-color:#e8e6e1} .tab-btn:hover:not(.active){color:#999}
        .save-btn{background:#e8e6e1;color:#0c0c0f;border:none;padding:12px 28px;font-family:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border-radius:3px;font-weight:500;transition:opacity .15s}
        .save-btn:disabled{opacity:.25;cursor:not-allowed} .save-btn:hover:not(:disabled){opacity:.85}
        .ghost-btn{background:transparent;border:1px solid #2a2a30;color:#666;padding:6px 14px;font-family:inherit;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:3px;transition:all .15s}
        .ghost-btn:hover{border-color:#555;color:#aaa}
        input,textarea{background:#15151a;border:1px solid #2a2a30;color:#e8e6e1;font-family:inherit;font-size:12px;padding:9px 12px;border-radius:4px;outline:none;transition:border-color .15s}
        input:focus,textarea:focus{border-color:#555}
        .weight-input{background:#15151a;border:1px solid #2a2a30;color:#e8e6e1;font-family:inherit;font-size:12px;padding:4px 8px;border-radius:3px;outline:none;width:52px;text-align:center}
        .weight-input:focus{border-color:#555}
        .del-btn{background:transparent;border:none;color:#2a2a30;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:3px;transition:color .15s;font-family:inherit}
        .del-btn:hover{color:#ef4444}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal-box{background:#12121a;border:1px solid #2a2a35;border-radius:10px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;padding:28px 24px}
        .close-btn{background:transparent;border:1px solid #2a2a30;color:#666;padding:8px 20px;font-family:inherit;font-size:11px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:3px;transition:all .15s;margin-top:20px}
        .close-btn:hover{border-color:#555;color:#aaa}
      `}</style>

      {/* ── Modal de sugestões ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => { setModal(null); setView("history"); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:".08em", marginBottom:4 }}>RESUMO DA SEMANA</div>
            <div style={{ fontSize:10, color:"#444", marginBottom:16 }}>{modal.week}</div>

            {/* Score */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, padding:"14px 16px", background:"#0c0c0f", borderRadius:6 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, color:getScoreInfo(modal.score).color, lineHeight:1 }}>{modal.score}</div>
              <div>
                <div style={{ fontSize:12, color:getScoreInfo(modal.score).color, marginBottom:4 }}>{getScoreInfo(modal.score).label}</div>
                <div style={{ fontSize:11, color:"#555" }}>{getScoreInfo(modal.score).readinessDesc}</div>
              </div>
            </div>

            {/* Relatório */}
            <div style={{ fontSize:11, color:"#555", fontStyle:"italic", marginBottom:20, paddingLeft:12, borderLeft:"2px solid #1e1e25" }}>
              {modal.report}
            </div>

            {/* Sugestões */}
            {modal.suggestions.length > 0 && (
              <>
                <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>
                  Sugestões para as próximas semanas
                </div>
                {modal.suggestions.map((s, i) => (
                  <div key={i} style={{ display:"flex", gap:12, marginBottom:12, padding:"12px 14px", background:"#0c0c0f", borderRadius:6, borderLeft:"2px solid #2a2a45" }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:".08em", marginBottom:3 }}>{s.area}</div>
                      <div style={{ fontSize:12, color:"#aaa", lineHeight:1.6 }}>{s.text}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {modal.suggestions.length === 0 && (
              <div style={{ fontSize:12, color:"#555", padding:"12px 14px", background:"#0c0c0f", borderRadius:6 }}>
                ✅ Nenhum alerta relevante. Biofeedback positivo — mantenha o protocolo atual.
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"center" }}>
              <button className="close-btn" onClick={() => { setModal(null); setView("history"); }}>Ver histórico</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ borderBottom:"1px solid #1e1e25", padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#0c0c0f", zIndex:10 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:".08em" }}>BIOFEEDBACK SCORE</div>
          <div style={{ fontSize:9, color:"#333", letterSpacing:".12em", textTransform:"uppercase", marginTop:1 }}>Metodologia Jewett · Israetel · Helms · Krieger</div>
          <div style={{ fontSize:9, color:"#555", letterSpacing:".06em", marginTop:3 }}>Ferramenta gratuita de monitoramento de recuperação e adaptação ao treinamento.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", gap:0 }}>
            {[["form","Avaliação"],["history",`Histórico${history.length>0?` (${history.length})`:""}`,],["about","Escala"]].map(([v,l])=>(
              <button key={v} className={`tab-btn ${view===v?"active":""}`} onClick={()=>setView(v)}>{l}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button className="ghost-btn" onClick={handleExport}>⬇ Backup</button>
            <label className="ghost-btn" style={{ cursor:"pointer" }}>
              ⬆ Importar
              <input type="file" accept=".json" onChange={handleImport} style={{ display:"none" }}/>
            </label>
          </div>
        </div>
      </div>

      {/* ══ FORM ══ */}
      {view === "form" && (
        <div style={{ maxWidth:680, margin:"0 auto", padding:"24px 20px 60px" }}>

          {/* Score gauge */}
          <div style={{ background:"#10101a", border:"1px solid #1e1e25", borderRadius:8, padding:"24px", marginBottom:20, display:"flex", alignItems:"center", gap:24 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <svg width={110} height={65} viewBox="0 0 120 70">
                <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#1e1e25" strokeWidth="12"/>
                {score !== null && (() => { const circ = Math.PI*50; const dash = (score/100)*circ; return <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke={scoreInfo.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}/>; })()}
              </svg>
              <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", textAlign:"center" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:score!==null?30:22, color:score!==null?scoreInfo.color:"#2a2a30", lineHeight:1 }}>{score !== null ? score : "--"}</div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              {score !== null ? (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:scoreInfo.readiness==="verde"?"#22c55e":scoreInfo.readiness==="amarelo"?"#eab308":"#ef4444", flexShrink:0 }}/>
                    <div style={{ fontSize:12, color:scoreInfo.readiness==="verde"?"#22c55e":scoreInfo.readiness==="amarelo"?"#eab308":"#ef4444" }}>{scoreInfo.readinessLabel}</div>
                  </div>
                  <div style={{ fontSize:11, color:"#555", marginBottom:8 }}>{scoreInfo.readinessDesc}</div>
                  {bottlenecks.length > 0 && <div style={{ fontSize:10, color:"#444", marginBottom:4, letterSpacing:".08em", textTransform:"uppercase" }}>Gargalos principais</div>}
                  {bottlenecks.map((b, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:11 }}>{i+1}.</span>
                      <span style={{ fontSize:11, color:b.cat.options.find(o=>o.value===scores[b.cat.id])?.color||"#888" }}>{b.cat.icon} {b.cat.label}</span>
                      <span style={{ fontSize:10, color:"#333" }}>— {b.impact.toFixed(1)}pts</span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ color:"#333", fontSize:12 }}>Responda os critérios abaixo para calcular o score.<br/><span style={{ color:"#252530", fontSize:11 }}>{totalAnswered}/7 preenchidos</span></div>
              )}
            </div>
          </div>

          {/* Semana + pesos */}
          <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
            <input type="text" placeholder="Semana (ex: S23 · 02–08 jun)" value={week} onChange={e=>setWeek(e.target.value)} style={{ flex:1 }}/>
            <button className="ghost-btn" onClick={()=>setShowWeights(v=>!v)}>{showWeights ? "Fechar" : "⚙ Pesos"}</button>
          </div>

          {/* Pesos */}
          {showWeights && (
            <div style={{ background:"#10101a", border:"1px solid #1e1e25", borderRadius:6, padding:"16px 18px", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:10, color:"#555", letterSpacing:".1em", textTransform:"uppercase" }}>Pesos (%)</div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:10, color:totalWeightSum===100?"#22c55e":"#ef4444" }}>Soma: {totalWeightSum}%</span>
                  <button className="ghost-btn" onClick={resetWeights}>Resetar</button>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {CATEGORIES.map(cat=>(
                  <div key={cat.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                    <span style={{ fontSize:11, color:"#888" }}>{cat.icon} {cat.label}</span>
                    <input type="number" className="weight-input" min={0} max={50} value={weights[cat.id]} onChange={e=>handleWeightChange(cat.id,e.target.value)}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critérios subjetivos */}
          {CATEGORIES.map((cat) => (
            <div key={cat.id} style={{ background:"#10101a", border:`1px solid ${scores[cat.id]?"#1e1e30":"#1a1a20"}`, borderRadius:6, padding:"14px 16px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:15 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize:11, letterSpacing:".08em", textTransform:"uppercase", color:scores[cat.id]?cat.options.find(o=>o.value===scores[cat.id])?.color:"#ccc", fontWeight:500 }}>
                    {cat.label}<span style={{ fontSize:9, color:"#2a2a35", marginLeft:8, textTransform:"none", letterSpacing:0, fontWeight:400 }}>peso {weights[cat.id]}%</span>
                  </div>
                  <div style={{ fontSize:10, color:"#444", marginTop:2 }}>{cat.description}</div>
                </div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {cat.options.map((opt)=>(
                  <button key={opt.value} className={`opt-btn ${scores[cat.id]===opt.value?"selected":""}`}
                    style={scores[cat.id]===opt.value?{background:opt.color,borderColor:opt.color,color:"#0c0c0f"}:{}}
                    onClick={()=>setScores(s=>({...s,[cat.id]:opt.value}))}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Macros */}
          <div style={{ background:"#10101a", border:"1px solid #1a1a20", borderRadius:6, padding:"14px 16px", marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>🔢 Macros da semana <span style={{ color:"#2a2a35", textTransform:"none", letterSpacing:0 }}>(média diária)</span></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {MACRO_FIELDS.map(f=>(
                <div key={f.id} style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <label style={{ fontSize:10, color:"#555" }}>{f.label} <span style={{ color:"#333" }}>({f.unit})</span></label>
                  <input type="number" step="1" placeholder={f.placeholder} value={macros[f.id]||""} onChange={e=>setMacros(m=>({...m,[f.id]:e.target.value}))} style={{ width:"100%" }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Saúde intestinal */}
          <div style={{ background:"#10101a", border:"1px solid #1a1a20", borderRadius:6, padding:"14px 16px", marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>🫙 Saúde intestinal</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#555", marginBottom:6 }}>Frequência diária de evacuação</div>
              <div style={{ display:"flex", gap:6 }}>
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
              <div style={{ fontSize:10, color:"#555", marginBottom:6 }}>Consistência das fezes</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
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
          <div style={{ background:"#10101a", border:"1px solid #1a1a20", borderRadius:6, padding:"14px 16px", marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>📐 Medidas objetivas <span style={{ color:"#2a2a35", textTransform:"none", letterSpacing:0 }}>(opcional)</span></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {OBJECTIVE_FIELDS.map(f=>(
                <div key={f.id} style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <label style={{ fontSize:10, color:"#555" }}>{f.label} <span style={{ color:"#333" }}>({f.unit})</span></label>
                  <input type="number" step="0.1" placeholder={f.placeholder} value={objective[f.id]||""} onChange={e=>setObjective(o=>({...o,[f.id]:e.target.value}))} style={{ width:"100%" }}/>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <textarea placeholder="Observações: ajuste de calorias, intercorrências, deload, exercícios novos..." value={notes} onChange={e=>setNotes(e.target.value)} style={{ width:"100%", marginTop:4, minHeight:64, resize:"vertical" }}/>

          <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end" }}>
            <button className="save-btn" onClick={handleSave} disabled={!week.trim()||totalAnswered===0}>Salvar semana</button>
          </div>
        </div>
      )}

      {/* ══ HISTÓRICO ══ */}
      {view === "history" && (
        <div style={{ maxWidth:680, margin:"0 auto", padding:"24px 20px 60px" }}>
          {history.length === 0 ? (
            <div style={{ textAlign:"center", color:"#333", fontSize:13, marginTop:60 }}>Nenhum check-in salvo ainda.</div>
          ) : (
            <>
              {historyWithScore.length >= 2 && (
                <div style={{ background:"#10101a", border:"1px solid #1e1e25", borderRadius:6, padding:"16px 20px", marginBottom:16 }}>
                  <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:14 }}>Últimas {Math.min(4, last4.length)} semanas</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
                    {[
                      { label:"Média", value:avg4, suffix:"" },
                      { label:"Melhor", value:best, suffix:"" },
                      { label:"Pior", value:worst, suffix:"" },
                      { label:"Tendência", value:trend4!==null?(trend4>0?`+${trend4}`:trend4):null, suffix:"pts", color:trend4>0?"#22c55e":trend4<0?"#ef4444":"#888" },
                    ].map(s=>(
                      <div key={s.label} style={{ textAlign:"center" }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:s.color||(s.value!==null?getScoreInfo(s.value).color:"#333"), lineHeight:1 }}>{s.value !== null ? `${s.value}${s.suffix}` : "—"}</div>
                        <div style={{ fontSize:9, color:"#444", marginTop:3, letterSpacing:".08em", textTransform:"uppercase" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const pts = [...historyWithScore].reverse();
                    if (pts.length < 2) return null;
                    const vals = pts.map(p=>p.score); const min=Math.min(...vals)-8, max=Math.max(...vals)+8;
                    const W=100, H=44; const toX=i=>(i/(pts.length-1))*W; const toY=s=>H-((s-min)/(max-min))*H;
                    const pathD=pts.map((p,i)=>`${i===0?"M":"L"} ${toX(i)} ${toY(p.score)}`).join(" ");
                    return (
                      <>
                        <svg width="100%" viewBox="-2 -6 104 56" preserveAspectRatio="none" style={{ height:52 }}>
                          <defs><linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">{pts.map((p,i)=><stop key={i} offset={`${(i/(pts.length-1))*100}%`} stopColor={getScoreInfo(p.score).color}/>)}</linearGradient></defs>
                          <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          {pts.map((p,i)=><circle key={i} cx={toX(i)} cy={toY(p.score)} r="3" fill={getScoreInfo(p.score).color}/>)}
                        </svg>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                          {pts.map((p,i)=><div key={i} style={{ fontSize:9, color:"#333", textAlign:"center" }}>{p.week.split("·")[0]?.trim()||p.week}</div>)}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {history.map((entry, i) => {
                const info = entry.score!==null ? getScoreInfo(entry.score) : null;
                const prevEntry = historyWithScore[historyWithScore.indexOf(entry)+1] || null;
                const diff = prevEntry && entry.score!==null ? entry.score - prevEntry.score : null;
                return (
                  <div key={i} style={{ background:"#10101a", border:"1px solid #1e1e25", borderRadius:6, padding:"14px 18px", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:13, color:"#ccc" }}>{entry.week}</div>
                        <div style={{ fontSize:9, color:"#333", marginTop:1 }}>{entry.date}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        {info && (
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:info.color, lineHeight:1 }}>{entry.score}</div>
                            {diff !== null && <div style={{ fontSize:9, color:diff>0?"#22c55e":diff<0?"#ef4444":"#555", marginTop:1 }}>{diff>0?`+${diff}`:diff} pts</div>}
                          </div>
                        )}
                        <button className="del-btn" onClick={()=>handleDeleteEntry(i)}>✕</button>
                      </div>
                    </div>

                    {info && (
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:info.readiness==="verde"?"#22c55e":info.readiness==="amarelo"?"#eab308":"#ef4444" }}/>
                        <div style={{ fontSize:10, color:"#666" }}>{info.readinessLabel}</div>
                      </div>
                    )}

                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                      {CATEGORIES.map((cat)=>{ const val=entry.scores[cat.id]; if(val===undefined) return null; const opt=cat.options.find(o=>o.value===val); return <div key={cat.id} style={{ fontSize:9, padding:"2px 7px", borderRadius:3, background:`${opt.color}18`, color:opt.color, border:`1px solid ${opt.color}35` }}>{cat.icon} {cat.label.split(" ")[0]}</div>; })}
                    </div>

                    {/* Macros no histórico */}
                    {entry.macros && Object.values(entry.macros).some(v=>v) && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8, padding:"8px 10px", background:"#0c0c0f", borderRadius:4 }}>
                        {MACRO_FIELDS.map(f=>{ const v=entry.macros[f.id]; if(!v) return null; return <div key={f.id} style={{ fontSize:10, color:"#555" }}>{f.label}: <span style={{ color:"#888" }}>{v}{f.unit}</span></div>; })}
                      </div>
                    )}

                    {/* Saúde intestinal no histórico */}
                    {entry.gut && (entry.gut.frequency || entry.gut.consistency) && (
                      <div style={{ display:"flex", gap:10, marginBottom:8 }}>
                        {entry.gut.frequency && <div style={{ fontSize:10, color:"#555" }}>🫙 Freq: <span style={{ color:"#888" }}>{GUT_FREQ.find(f=>f.value===entry.gut.frequency)?.label}/dia</span></div>}
                        {entry.gut.consistency && <div style={{ fontSize:10, color:"#555" }}>Consist: <span style={{ color:GUT_CONSISTENCY.find(o=>o.value===entry.gut.consistency)?.color||"#888" }}>{GUT_CONSISTENCY.find(o=>o.value===entry.gut.consistency)?.label}</span></div>}
                      </div>
                    )}

                    {entry.report && <div style={{ fontSize:11, color:"#555", borderTop:"1px solid #1a1a22", paddingTop:8, marginTop:4, fontStyle:"italic" }}>{entry.report}</div>}
                    {entry.notes && <div style={{ fontSize:11, color:"#444", borderTop:"1px solid #1a1a22", paddingTop:8, marginTop:4 }}>{entry.notes}</div>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ══ ESCALA ══ */}
      {view === "about" && (
        <div style={{ maxWidth:620, margin:"0 auto", padding:"24px 20px 60px" }}>
          <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:16 }}>Interpretação do score</div>
          {SCORE_SCALE.map((s,i)=>(
            <div key={i} style={{ background:"#10101a", border:`1px solid ${s.color}25`, borderLeft:`3px solid ${s.color}`, borderRadius:4, padding:"12px 16px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:s.color }}>{s.range}</div>
                <div style={{ fontSize:11, color:s.color }}>{s.label}</div>
              </div>
              <div style={{ fontSize:11, color:"#555" }}>{s.desc}</div>
            </div>
          ))}
          <div style={{ background:"#10101a", border:"1px solid #1e1e25", borderRadius:6, padding:"16px 18px", marginTop:20 }}>
            <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Recovery Readiness</div>
            {[{dot:"#22c55e",label:"Verde",desc:"Treine normalmente. Pode progredir carga."},{dot:"#eab308",label:"Amarelo",desc:"Mantenha as cargas. Não progrida agora."},{dot:"#ef4444",label:"Vermelho",desc:"Reduza volume. Considere deload imediato."}].map((r,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:r.dot, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:r.dot, width:64 }}>{r.label}</span>
                <span style={{ fontSize:11, color:"#555" }}>{r.desc}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"#10101a", border:"1px solid #1e1e25", borderRadius:6, padding:"16px 18px", marginTop:12 }}>
            <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Fundamentação</div>
            <div style={{ fontSize:11, color:"#555", lineHeight:1.7 }}>Modelo baseado em conceitos discutidos por John Jewett, Mike Israetel (Renaissance Periodization), Eric Helms e James Krieger — com foco na relação entre estímulo adaptativo e capacidade de recuperação.</div>
          </div>
          <div style={{ background:"#10101a", border:"1px solid #1e1e25", borderRadius:6, padding:"16px 18px", marginTop:12 }}>
            <div style={{ fontSize:10, color:"#444", letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Pesos atuais</div>
            {CATEGORIES.map(cat=>(
              <div key={cat.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:11, color:"#666" }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize:11, color:"#444" }}>{weights[cat.id]}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
