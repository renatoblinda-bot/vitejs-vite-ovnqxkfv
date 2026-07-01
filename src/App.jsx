import { useState, useEffect, useRef } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hlkesynzmmveajbwmgwm.supabase.co";
const SUPABASE_KEY = "sb_publishable_gG5lVePrVMobnK24_O-u3A_ajuRlMPV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Constants (same as original)
const DEFAULT_WEIGHTS = { /* ... */ };
const CATEGORIES = [ /* ... */ ];
const ALL_CATEGORIES = [ /* ... */ ];
const OBJECTIVE_FIELDS = [ /* ... */ ];
const MACRO_FIELDS = [ /* ... */ ];
const GUT_FREQ = [ /* ... */ ];
const GUT_CONSISTENCY = [ /* ... */ ];
const HORMONAL_FIELDS = { /* ... */ };

// Helper functions (computeHormonalScore, getScoreInfo, computeScore, generateSuggestions, generateJ3UAnalysis, etc.) remain the same as your original.

export default function BiofeedbackScore() {
  // All states (same as original)

  const delta = historyWithScore.length > 0 && score !== null ? score - (historyWithScore[0]?.score || 0) : null;

  // Improved Hero (compact + trend)
  const renderHero = () => (
    <div className="card-hero" style={{padding: "20px 24px 18px", marginBottom: 16}}>
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
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:82,lineHeight:1,color:score!==null?scoreInfo.color:"var(--text-4)",transition:"color 0.4s ease"}}>
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
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--surface-0)",color:"var(--text-1)",fontFamily:"'DM Mono',monospace",fontSize:"14px"}}>
      <style>{`/* Your original styles + enhancements for glow, grid, etc. */`}</style>

      {/* Auth and Header (same) */}

      {view === "form" && (
        <div style={{maxWidth:740,margin:"0 auto",padding:"20px 16px 80px"}}>
          {renderHero()}

          {/* Improved Status Atual */}
          {totalAnswered >= 3 && (
            <div style={{background:"linear-gradient(180deg,#101827,#0c1423)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"var(--radius)",padding:"14px 18px",marginBottom:16}}>
              <div style={{fontSize:9,color:"var(--text-4)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:10}}>Feedback do Coach</div>
              {/* Add logic for strong / attention points here */}
            </div>
          )}

          {/* Rest of the form (cards with glow when answered, macros larger, hormonal conditional, etc.) */}
        </div>
      )}

      {/* Other views (history, compare, profile, about) remain the same as your original */}
    </div>
  );
}
