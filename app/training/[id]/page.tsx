"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import { FaPrint, FaTimes, FaRegClock, FaUser, FaFutbol } from 'react-icons/fa';

// --- HELPER: Material Parser ---
const parseMaterials = (rawMaterial: any) => {
  let materialList: any[] = [];
  if (rawMaterial) {
    if (Array.isArray(rawMaterial)) {
      materialList = rawMaterial.map((item: any) => {
        if (typeof item === 'string') return { name: item, amount: '' };
        const label = item.label || item.name || item.id;
        return { name: label, amount: item.amount };
      });
    } else if (typeof rawMaterial === 'string') {
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
  return materialList;
};

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

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse uppercase tracking-widest">Lade Daten...</div>;
  if (!plan) return <div className="p-20 text-center font-black text-red-400 uppercase">Keine Daten gefunden</div>;

  const phases = [
    { id: 'warmup', title: 'Aufwärmen', color: 'text-emerald-600' },
    { id: 'main1', title: 'Hauptteil I', color: 'text-blue-600' },
    { id: 'main2', title: 'Hauptteil II', color: 'text-blue-700' },
    { id: 'coolDown', title: 'Schluss', color: 'text-orange-600' }
  ];

  const allExercises: any[] = [];
  phases.forEach(phase => {
    const phaseExercises = plan.content?.[phase.id] || [];
    phaseExercises.forEach((ex: any) => {
      allExercises.push({
        ...ex,
        _phaseTitle: phase.title,
        _phaseColor: phase.color
      });
    });
  });

  const formattedDate = new Date(plan.scheduled_at).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-[#525659] min-h-screen py-10 print:bg-white print:py-0 font-sans print:text-black">
      
      {/* DRUCK BUTTONS */}
      <div className="fixed top-6 right-6 flex gap-4 print:hidden z-50">
        <button onClick={() => window.print()} className="bg-black text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
          <FaPrint /> Drucken
        </button>
        <button onClick={() => window.close()} className="bg-white text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-2xl hover:bg-gray-100 transition-all flex items-center gap-2">
          <FaTimes /> Schließen
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto space-y-8 print:space-y-0">
        
        {allExercises.map((ex, index) => {
            const materials = parseMaterials(ex.materials || ex.material);
            
            return (
                <div 
                    key={index} 
                    className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-2xl print:shadow-none mx-auto flex flex-col page-break relative print:border-0"
                >
                    {/* HEADER */}
                    <header className="flex justify-between items-start mb-6 border-b-2 border-gray-100 pb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span>{plan.author || "Coach"}</span>
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">{plan.title}</h1>
                            
                            <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest ${ex._phaseColor}`}>
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-black">Übung {index + 1}</span>
                                <span>•</span>
                                <span>{ex._phaseTitle}</span>
                            </div>
                        </div>
                        
                        {/* LOGO */}
                        <div className="w-20 h-20 relative shrink-0">
                           <img 
                             src="/img/logo.png" 
                             alt="Vereinslogo" 
                             className="w-full h-full object-contain" 
                           />
                        </div>
                    </header>

                    {/* TITEL & METADATEN */}
                    <div className="flex justify-between items-start mb-4 gap-4">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none flex-1">
                            {ex.title}
                        </h2>
                        <div className="flex gap-2 shrink-0">
                            <div className="text-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 min-w-[70px] print:bg-white print:border-gray-200">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Dauer</p>
                                <p className="text-lg font-black italic text-[#1D1D1F] flex justify-center items-center gap-1">
                                   <FaRegClock className="text-xs text-gray-400"/> {ex.duration || '0'}'
                                </p>
                            </div>
                            <div className="text-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 min-w-[70px] print:bg-white print:border-gray-200">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Spieler</p>
                                <p className="text-lg font-black italic text-[#1D1D1F] flex justify-center items-center gap-1">
                                   <FaUser className="text-xs text-gray-400"/> {ex.min_players ? `${ex.min_players}-${ex.max_players}` : (ex.players || 'Beliebig')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TAKTIK-BILD */}
                    <div className="w-full h-[350px] bg-white rounded-[1.5rem] mb-6 border-2 border-gray-100 flex items-center justify-center relative p-2 print:border-gray-300 page-break-inside-avoid">
                        {ex.image_url ? (
                            <img src={ex.image_url} className="w-full h-full object-contain" alt={ex.title} />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-300">
                                <FaFutbol className="text-4xl opacity-50"/>
                                <span className="font-black text-xs uppercase tracking-widest">Keine Skizze</span>
                            </div>
                        )}
                    </div>

                    {/* CONTENT GRID */}
                    <div className="grid grid-cols-3 gap-8 flex-1 items-start">
                        
                        {/* TEXT (Links - 2/3 Breite) */}
                        <div className="col-span-2 flex flex-col gap-4">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 flex items-center gap-2">
                                    <span className="w-4 h-[2px] bg-black"></span> Beschreibung
                                </h3>
                                <div className="text-[13px] leading-relaxed text-gray-900 whitespace-pre-wrap font-medium text-justify">
                                    {ex.description || "Keine Beschreibung verfügbar."}
                                </div>
                            </div>

                            {ex.coaching_points && (
                                <div className="bg-gray-50 p-3 rounded-xl border-l-4 border-black italic print:bg-white print:border print:border-gray-300 print:border-l-black page-break-inside-avoid mt-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black mb-1">
                                      Coaching Punkte
                                    </h3>
                                    <div className="text-xs leading-relaxed text-gray-700 font-bold">
                                      {ex.coaching_points}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MATERIAL (Rechts - 1/3 Breite - IMMER 2 SPALTEN, ABER KOMPAKT) */}
                        <div className="col-span-1 border-l-2 border-gray-50 pl-6 flex flex-col print:border-gray-200">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
                                Material
                            </h3>
                            
                            {materials.length > 0 ? (
                                // IMMER grid-cols-2, aber kompaktes Design (gap-1, py-1)
                                <div className="grid grid-cols-2 gap-1.5">
                                    {materials.map((mat: any, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className="flex flex-col justify-center items-center text-center bg-gray-50 rounded border border-gray-100 print:bg-white print:border-gray-200 px-1 py-1.5 page-break-inside-avoid"
                                        >
                                            {mat.amount && <span className="font-black block text-xs mb-0.5">{mat.amount}x</span>}
                                            <span className="text-[9px] font-bold text-gray-700 uppercase leading-none w-full break-words">
                                                {mat.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-300 italic">Kein Material nötig.</div>
                            )}
                        </div>
                    </div>

                    {/* PAGE FOOTER */}
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-[8px] font-black text-gray-300 uppercase tracking-widest mt-auto print:border-gray-200 print:mt-6">
                        <span>FC Coach App — Saison 2025/26</span>
                        <span>Seite {index + 1} von {allExercises.length}</span>
                    </div>
                </div>
            );
        })}
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          .page-break { 
            break-after: page !important; 
            display: flex !important; 
            min-height: 297mm !important; 
            height: auto !important; 
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
          }
          body { 
            background-color: white !important; 
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color: black !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}