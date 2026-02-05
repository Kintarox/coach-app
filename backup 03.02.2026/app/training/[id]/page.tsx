"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';

export default function TrainingPreviewPage() {
  const { id } = useParams();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      const { data, error } = await supabase.from('plans').select('*').eq('id', id).single();
      if (!error) setPlan(data);
      setLoading(false);
    };
    fetchPlan();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-black text-gray-400 animate-pulse uppercase tracking-widest">Lade Daten...</div>;
  if (!plan) return <div className="p-20 text-center font-black text-red-400 uppercase">Keine Daten gefunden</div>;

  const phases = [
    { id: 'warmup', title: '01 Aufwärmen' },
    { id: 'main1', title: '02 Hauptteil I' },
    { id: 'main2', title: '03 Hauptteil II' },
    { id: 'coolDown', title: '04 Schluss' }
  ];

  return (
    <div className="bg-[#525659] min-h-screen py-10 print:bg-white print:py-0 font-sans">
      
      {/* BUTTONS */}
      <div className="fixed top-6 right-6 flex gap-4 print:hidden z-50">
        <button onClick={() => window.print()} className="bg-[#007AFF] text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
          <i className="ph-bold ph-printer"></i> Drucken
        </button>
        <button onClick={() => window.close()} className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-gray-100 transition-all">
          Schließen
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto space-y-8 print:space-y-0">
        
        {phases.map((phase) => (
          (plan.content?.[phase.id] || []).map((ex: any, index: number) => {
            
            // 1. Spieler
            let playerText = ex.players || "Beliebig"; 
            if (ex.min_players && ex.max_players) {
                playerText = ex.min_players === ex.max_players 
                  ? `${ex.min_players}` 
                  : `${ex.min_players} - ${ex.max_players}`;
            }

            // 2. Material Parsing (Robust für String und Array)
            const rawMaterial = ex.materials || ex.material; 
            let materialList: any[] = [];

            if (rawMaterial) {
                if (Array.isArray(rawMaterial)) {
                    // ARRAY (Neu)
                    materialList = rawMaterial.map((item: any) => {
                        if (typeof item === 'string') return { name: item, amount: '' };
                        const label = item.label || item.name || item.id;
                        return { name: label, amount: item.amount };
                    });
                } else if (typeof rawMaterial === 'string') {
                    // STRING (Alt: "10 Bälle, 5 Hütchen")
                    materialList = rawMaterial.split(',').map((str: string) => {
                        const clean = str.trim();
                        if (!clean) return null;
                        const match = clean.match(/^(\d+)(?:x|\s)?\s*(.*)/);
                        if (match) {
                            return { amount: match[1], name: match[2] };
                        } else {
                            return { amount: '', name: clean };
                        }
                    }).filter(Boolean);
                }
            }

            return (
              <div key={`${phase.id}-${index}`} className="bg-white w-[210mm] h-[297mm] p-12 shadow-2xl print:shadow-none mx-auto flex flex-col page-break relative border-l-[12px] border-black">
                
                {/* HEADER */}
                <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-gray-100">
                  <div className="flex-1">
                    <div className="text-[#007AFF] font-black text-[10px] uppercase tracking-[0.2em] mb-1">{phase.title}</div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{ex.title}</h2>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="text-center bg-gray-50 px-5 py-2 rounded-xl border border-gray-100 min-w-[90px]">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Dauer</p>
                      <p className="text-xl font-black italic text-[#1D1D1F]">{ex.duration || '0'}'</p>
                    </div>
                    <div className="text-center bg-gray-50 px-5 py-2 rounded-xl border border-gray-100 min-w-[90px]">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Spieler</p>
                      <p className="text-xl font-black italic text-[#1D1D1F]">{playerText}</p>
                    </div>
                  </div>
                </div>

{/* GRAFIK CONTAINER */}
<div className="w-full h-[400px] bg-white rounded-[2rem] mb-8 border-2 border-gray-100 flex items-center justify-center relative p-4">
  {ex.image_url ? (
    <img 
      src={ex.image_url} 
      className="w-full h-full object-contain" 
      alt={ex.title} 
    />
  ) : (
    <div className="flex flex-col items-center gap-2 text-gray-300">
        <i className="ph-duotone ph-image text-4xl"></i>
        <span className="font-black text-xs uppercase tracking-widest">Keine Skizze</span>
    </div>
  )}
  
  {/* Label oben links */}
  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-md">
    Abbildung 0{index + 1}
  </div>
</div>

                {/* CONTENT */}
                <div className="grid grid-cols-3 gap-10 flex-1 overflow-hidden">
                  
                  {/* TEXT (Links) */}
                  <div className="col-span-2 space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
                        <span className="w-4 h-[2px] bg-[#007AFF]"></span> Beschreibung
                      </h3>
                      <div className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap font-medium">
                        {ex.description || "Keine Beschreibung verfügbar."}
                      </div>
                    </div>

                    {ex.coaching_points && (
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#007AFF] mb-3 flex items-center gap-2">
                            <span className="w-4 h-[2px] bg-[#007AFF]"></span> Coaching Punkte
                            </h3>
                            <div className="text-sm leading-relaxed text-gray-700 font-bold italic bg-blue-50/50 p-6 rounded-3xl border border-blue-50">
                            {ex.coaching_points}
                            </div>
                        </div>
                    )}
                  </div>

                  {/* MATERIAL (RECHTS - KOMPAKT) */}
                  <div className="col-span-1 border-l-2 border-gray-50 pl-8 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
                      <i className="ph-bold ph-package text-base"></i> Material
                    </h3>
                    
                    {materialList.length > 0 ? (
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                          {materialList.map((mat: any, idx: number) => (
                              <div key={idx} className="flex items-baseline py-1.5 border-b border-gray-200 last:border-0">
                                  {mat.amount && (
                                    <span className="font-black text-sm w-8 shrink-0 text-[#1D1D1F]">
                                      {mat.amount}x
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-gray-600 uppercase tracking-tight">
                                    {mat.name}
                                  </span>
                              </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-300 italic">
                        Kein Material nötig.
                      </div>
                    )}
                  </div>
                </div>

                {/* FOOTER */}
                <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-[9px] font-black text-gray-300 uppercase tracking-widest mt-auto">
                  <span>Coach: {plan.author || "Kevin Schneider"}</span>
                  <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full italic">
                    {phase.title} — Übung {index + 1}
                  </span>
                </div>
              </div>
            );
          })
        ))}
      </div>

      <style jsx global>{`
        @media screen {
          body { background-color: #525659; }
        }
        @media print {
          @page { size: A4; margin: 0; }
          .page-break { page-break-after: always; display: block !important; }
          body { background-color: white !important; margin: 0 !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}