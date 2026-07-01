import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hlkesynzmmveajbwmgwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_gG5lVePrVMobnK24_O-u3A_ajuRlMPV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Constants (from your part1) ─────────────────────────────────────────────
const DEFAULT_WEIGHTS = {
  performance:25, recovery:20, sleep:20, energy:15, hunger:5,
  joints:10, pump:5,
};

const CATEGORIES = [ /* paste your CATEGORIES array here from part1 */ ];

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

const ALL_CATEGORIES = [ /* paste from part1 */ ];

const OBJECTIVE_FIELDS = [ /* paste */ ];
const MACRO_FIELDS = [ /* paste */ ];
const GUT_FREQ = [ /* paste */ ];
const GUT_CONSISTENCY = [ /* paste */ ];

const HORMONAL_FIELDS = { /* paste from part1 */ };

// Paste all helper functions from your original file (computeHormonalScore, getScoreInfo, computeScore, getBottlenecks, generateSuggestions, generateReport, J3U functions, etc.)

// ─── COMPONENTE PRINCIPAL (com melhorias) ───────────────────────────────────
export default function BiofeedbackScore() {
  // All useState from your original file (copy them exactly)
  const [scores, setScores] = useState({});
  const [week, setWeek] = useState("");
  // ... copy all other states ...

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
      {/* Score number and readiness - keep your original logic but make compact */}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--surface-0)"}}>
      {/* Your original style tag + extra CSS for glow */}
      <style>{`/* original styles */`}</style>

      {/* Auth screen (your original) */}

      {!authLoading && user && (
        <>
          {modal && ( /* your original modal */ )}

          {/* Header (your original) */}

          {view === "form" && (
            <div style={{maxWidth:740,margin:"0 auto",padding:"20px 16px 80px"}}>
              {renderHero()}
              {/* Continue with your original form content, adding glows to cards when answered */}
            </div>
          )}

          {/* Other views (history, compare, profile, about) - keep your original */}
        </>
      )}
    </div>
  );
}
