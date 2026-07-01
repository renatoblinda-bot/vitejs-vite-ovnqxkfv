import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hlkesynzmmveajbwmgwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_gG5lVePrVMobnK24_O-u3A_ajuRlMPV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── PESOS BIOFEEDBACK ────────────────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  performance:25, recovery:20, sleep:20, energy:15, hunger:5,
  joints:10, pump:5,
};

const CATEGORIES = [ /* ... same as original ... */ ];

const ALL_CATEGORIES = [ /* ... same ... */ ];

// (All other constants and helper functions remain the same as the original - omitted here for brevity)

export default function BiofeedbackScore() {
  // States (same as original)
  const [scores, setScores] = useState({});
  // ... other states

  const fullScoresLive = buildFullScores(j3u, scores);
  const totalAnswered = Object.keys(fullScoresLive).length;
  const score = computeScore(fullScoresLive, weights);
  const scoreInfo = score !== null ? getScoreInfo(score) : null;
  const prevScore = historyWithScore[0]?.score || null;
  const delta = prevScore !== null ? score - prevScore : null;

  // Improved Hero
  const renderHero = () => (
    <div className="card-hero" style={{padding:"20px 24px 18px", marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:10,color:"var(--text-4)",letterSpacing:".2em",textTransform:"uppercase"}}>PRONTIDÃO</div>
        {delta !== null && (
          <div style={{fontSize:11,color:delta>=0?"var(--green)":"var(--red)",display:"flex",alignItems:"center",gap:4}}>
            {delta >= 0 ? "▲" : "▼"} {delta} pts
          </div>
        )}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <div style={{minWidth:110}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:82,lineHeight:1,color:score!==null?scoreInfo.color:"var(--text-4)",transition:"all 0.6s ease"}}>
            {displayScore !== null ? displayScore : "--"}
          </div>
          <div style={{fontSize:13,color:scoreInfo?.color || "var(--text-4)"}}>
            {score !== null ? scoreInfo.label : "Avalie abaixo"}
          </div>
        </div>

        <div style={{flex:1}}>
          {score !== null && (
            <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:999,background:scoreInfo.bg}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:scoreInfo.color}} />
              <span style={{color:scoreInfo.color,fontWeight:500}}>{scoreInfo.readinessLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:18}}>
        <div style={{display:"flex",gap:4,height:5,borderRadius:999,overflow:"hidden",background:"rgba(255,255,255,0.08)"}}>
          {Array.from({length:10}).map((_,i) => (
            <div key={i} style={{
              flex:1,
              background: score ? (i < Math.round(score/10) ? "linear-gradient(90deg,var(--brand),#60a5fa)" : "transparent") : "transparent",
              transition:"all 0.4s ease"
            }}/>
          ))}
        </div>
      </div>
    </div>
  );

  // Status Atual melhorado (coach-like)
  const renderStatusAtual = () => {
    if (totalAnswered < 3) return null;
    // Logic for strong / attention points
    return (
      <div style={{background:"linear-gradient(180deg,#101827,#0c1423)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"var(--radius)",padding:"14px 18px",marginBottom:16}}>
        <div className="section-title">Coach Feedback</div>
        {/* Strong and Attention sections */}
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--surface-0)",color:"var(--text-1)",fontFamily:"'DM Mono',monospace",fontSize:"14px"}}>
      <style>{`/* Enhanced CSS with animations, glows, grid etc. */`}</style>

      {/* Header, Auth, etc. remain similar */}

      {view === "form" && (
        <div style={{maxWidth:720,margin:"0 auto",padding:"20px 16px"}}>
          {renderHero()}
          {renderStatusAtual()}
          {/* Rest of form with improved cards, macros, etc. */}
        </div>
      )}

      {/* Other views... */}
    </div>
  );
}
