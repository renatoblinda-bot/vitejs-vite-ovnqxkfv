import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hlkesynzmmveajbwmgwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_gG5lVePrVMobnK24_O-u3A_ajuRlMPV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  performance:25, recovery:20, sleep:20, energy:15, hunger:5,
  joints:10, pump:5,
};

const CATEGORIES = [
  { id:"joints", label:"Dor Articular", icon:"🦴", description:"Ombros, cotovelos, joelhos, lombar",
    options:[{value:5,label:"Sem dores",color:"var(--green)"},{value:4,label:"Leve desconforto ocasional",color:"#84cc16"},{value:3,label:"Desconforto frequente",color:"var(--amber)"},{value:2,label:"Dor presente no treino",color:"var(--orange)"},{value:1,label:"Dor limitante",color:"var(--red)"}]},
  { id:"pump", label:"Pump e Conexão Muscular", icon:"💪", description:"Sente o músculo? Pump presente?",
    options:[{value:5,label:"Pump excelente",color:"var(--green)"},{value:4,label:"Bom pump",color:"#84cc16"},{value:3,label:"Pump moderado",color:"var(--amber)"},{value:2,label:"Pump fraco",color:"var(--orange)"},{value:1,label:"Sem pump",color:"var(--red)"}]},
];

const J3U_TO_CALIBRA = {0:1, 1:3, 2:5};

const buildFullScores = (j3u, calibraScores) => {
  const mapped = {};
  const shared = {
    j3u_performance:"performance", j3u_recovery:"recovery",
    j3u_sleep:"sleep", j3u_energy:"energy", j3u_hunger:"hunger"
  };
  Object.entries(shared).forEach(([jid, cid]) => {
    if (j3u[jid] !== undefined) mapped[cid] = J3U_TO_CALIBRA[j3u[jid]];
  });
  return {...mapped, ...calibraScores};
};

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

const HORMONAL_FIELDS = {
  aiDose: { label:"Dose do Inibidor de Aromatase (semana)", placeholder:"ex: Anastrozol 0.5mg 2x" },
  libido: { label:"Vontade e Iniciativa Sexual", options:[{value:4,label:"Ótima"},{value:3,label:"Boa"},{value:2,label:"Ruim"},{value:1,label:"Inexistente"}] },
  erection: { label:"Ereção / Sensibilidade / Orgasmo", options:[{value:4,label:"Ótima"},{value:3,label:"Boa"},{value:2,label:"Ruim"},{value:1,label:"Inexistente"}] },
  morningErection: { label:"Ereção Matinal / Madrugada", subLabel:"Frequência semanal + qualidade",
    freq: [{value:"daily",label:"Diária"},{value:"frequent",label:"Frequente (3-5x)"},{value:"rare",label:"Rara (1-2x)"},{value:"absent",label:"Ausente"}],
    quality: [{value:3,label:"Forte"},{value:2,label:"Fraca"},{value:1,label:"Inexistente"}] },
  joint: { label:"Articulações", options:[{value:2,label:"Ok"},{value:1,label:"Fraca ou estalando"}] },
  mood: { label:"Humor", options:[{value:"sensitive",label:"Sensível / irritável"},{value:"normal",label:"Normal"},{value:"apathetic",label:"Apático"}] },
  nipple: { label:"Sensibilidade no Mamilo", options:[{value:"yes",label:"Sim — sensível / dolorido"},{value:"no",label:"Não"}] },
  skin: { label:"Oleosidade da Pele", options:[
    {value:"acne",label:"Alta com acne",e2:"high"},
    {value:"oily",label:"Alta",e2:"high"},
    {value:"normal",label:"Normal",e2:"ok"},
    {value:"dry",label:"Seca",e2:"low"},
  ]},
};

// Helper functions (paste all your original helper functions here: computeHormonalScore, getScoreInfo, computeScore, getBottlenecks, generateSuggestions, generateReport, J3U functions, etc.)

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function BiofeedbackScore() {
  // All your original useState and useEffect here (copy from your original file)
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
  const [authView, setAuthView] = useState("login");
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

  // Your original functions (animateScore, auth handlers, save handlers, etc.)

  const fullScoresLive = buildFullScores(j3u, scores);
  const totalAnswered = Object.keys(fullScoresLive).length;
  const score = computeScore(fullScoresLive, weights);
  const scoreInfo = score !== null ? getScoreInfo(score) : null;
  const historyWithScore = history.filter(h => h.score !== null);
  const delta = historyWithScore.length > 0 && score !== null ? score - historyWithScore[0].score : null;

  // Improved Hero
  const renderHero = () => (
    <div className="card-hero" style={{padding:"20px 24px 18px", marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".2em",textTransform:"uppercase"}}>PRONTIDÃO</div>
        {delta !== null && (
          <div style={{fontSize:11,color:delta>=0?"var(--green)":"var(--red)"}}>
            {delta >= 0 ? `▲ +${delta}` : `▼ ${delta}`} pts
          </div>
        )}
      </div>
      {/* Keep your original hero body here, but make it compact */}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--surface-0)",color:"var(--text-1)"}}>
      {/* Your original <style> tag with enhancements */}
      <style>{`/* paste your original styles here */`}</style>

      {/* Auth screen and main app (your original logic) */}

      {view === "form" && (
        <div style={{maxWidth:740,margin:"0 auto",padding:"20px 16px 80px"}}>
          {renderHero()}
          {/* Your original form content */}
        </div>
      )}
    </div>
  );
}
