"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function TrainingDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      const { data, error } = await supabase.from('plans').select('*').eq('id', id).single();
      if (!error) setPlan(data);
      setLoading(false);
      
      // Wenn der URL-Parameter ?print=true gesetzt ist, öffne sofort den Druckdialog
      if (searchParams.get('print') === 'true') {
        setTimeout(() => window.print(), 1000);
      }
    };
    fetchPlan();
  }, [id, searchParams]);

  if (loading) return <div className="p-20 text-center ml-64 font-black text-gray-300 animate-pulse">Lade Einheit...</div>;
  if (!plan) return <div className="p-20 text-center ml-64 font-black text-red-400">Einheit nicht gefunden.</div>;

  const phases = plan.content || {};

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-0 md:ml-64 p-4 md:p-10 font-sans print:m-0 print:bg-white print:p-0">
      
      {/* ACTION BAR - Verschwindet beim Drucken */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <button onClick={() => router.back()} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition">
          ← Zurück
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-white border border-gray-200 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-gray-50">
            PDF Export
          </button>
          <button onClick={() => router.push(`/training/${id}/edit`)} className="bg-black text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
            Bearbeiten
          </button>
        </div>
      </div>

      {/* DER TRAININGSPLAN */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        {/* Print Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-10">
          <div>
            <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Trainingsprotokoll</div>
            <h1 className="text-4xl font-black text-[#1D1D1F] uppercase italic tracking-tighter">{plan.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-gray-400 uppercase">
              <span>{new Date(plan.scheduled_at).toLocaleDateString('de-DE')}</span>
              <span>•</span>
              <span>{new Date(plan.scheduled_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
              <span>•</span>
              <span>Rasenplatz</span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Trainer</div>
             <div className="font-black text-sm">Kevin Schneider</div>
          </div>
        </div>

        {/* PHASEN GRID */}
        <div className="space-y-12">
          {Object.entries({
            warmup: "01 Einstimmen / Aufwärmen",
            main1: "02 Hauptteil I - Technik",
            main2: "03 Hauptteil II - Spielform",
            coolDown: "04 Ausklang"
          }).map(([key, title]) => (
            <div key={key} className="print:break-inside-avoid">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-[10px]">{key === 'warmup' ? 'A' : key === 'main1' ? 'B' : key === 'main2' ? 'C' : 'D'}</span>
                {title}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {(phases[key] || []).length === 0 ? (
                  <p className="text-xs italic text-gray-300">Keine Übungen geplant.</p>
                ) : (
                  phases[key].map((ex: any, idx: number) => (
                    <div key={idx} className="flex gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-100 print:bg-white print:border-gray-200">
                      <div className="w-24 h-24 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100">
                        {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-2xl">⚽</div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-black text-sm uppercase tracking-tight">{ex.title}</h4>
                          <span className="text-[10px] font-black bg-white px-2 py-1 rounded border border-gray-200">{ex.duration} MIN</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 print:line-clamp-none">
                          {ex.description || "Keine Beschreibung verfügbar."}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER FÜR DRUCK */}
        <div className="hidden print:block mt-12 pt-8 border-t border-gray-100 text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
          Erstellt mit deinem Coaching Tool • Seite 1 von 1
        </div>
      </div>

      {/* SPEZIELLES PRINT-STYLE-TAG */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .ml-64 {
            margin-left: 0 !important;
          }
          /* Versteckt die Sidebar (falls sie globaler Bestandteil des Layouts ist) */
          aside, nav, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}