"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// Config für Icons (damit wir wissen, welches Icon zu welcher ID gehört)
const materialIcons: Record<string, string> = {
    balls: '⚽',
    cones: '📍',
    bibs: '🎽',
    goals: '🥅',
    poles: '🦯',
    hurdles: '🚧',
    ladder: '🪜',
    dummies: '👤',
    rings: '⭕',
};

export default function ExerciseCatalog() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewExercise, setViewExercise] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');

  const categoriesList = [
    'Schnelligkeit', 'Athletiktraining', 'Abschlussspiele', 'Torwarttraining',
    'Passspiel', 'Torschuss', 'Ballannahme', 'Dribbling', 'Koordination',
    'XvsX', 'Spielaufbau', 'Umschalten', 'Pressing', 'Überzahlspiel',
    'Chancen herausspielen', 'Kombinationsspiel'
  ];

  useEffect(() => { fetchExercises(); }, []);

  // FILTER LOGIK
  useEffect(() => {
    let result = exercises;

    if (activeCategory !== 'Alle') {
      result = result.filter(ex => 
        ex.tags?.includes(activeCategory) || 
        ex.category === activeCategory
      );
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(ex => 
        ex.title.toLowerCase().includes(lowerTerm) ||
        ex.tags?.some((t: string) => t.toLowerCase().includes(lowerTerm))
      );
    }

    setFilteredExercises(result);
  }, [searchTerm, activeCategory, exercises]);

  const fetchExercises = async () => {
    const { data } = await supabase.from('exercises').select('*').order('created_at', { ascending: false });
    if (data) {
        setExercises(data);
        setFilteredExercises(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Diese Übung wirklich löschen?")) return;
    await supabase.from('exercises').delete().eq('id', id);
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  // --- DIE WICHTIGE NEUE FUNKTION ---
  // Wandelt DB-Daten in lesbare Strings um (mit Icons!)
  const parseMaterials = (materials: any, oldMaterialString?: string) => {
    const result: string[] = [];
    
    // 1. Neues JSON Format prüfen
    if (Array.isArray(materials)) {
        materials.forEach((m: any) => {
            if (m.amount > 0) {
                const icon = materialIcons[m.id] || '';
                result.push(`${icon} ${m.amount} ${m.label}`);
            }
        });
    } 
    // 2. Fallback: Altes String Format
    else if (typeof oldMaterialString === 'string') {
        const parts = oldMaterialString.split(',');
        parts.forEach(p => {
            const clean = p.trim();
            if (clean) result.push(clean);
        });
    }
    
    // Wenn gar nichts gefunden wurde, aber materials ein String ist (Migrationsphase)
    if (result.length === 0 && typeof materials === 'string') {
         // Versuch es als JSON zu parsen
         try {
             const json = JSON.parse(materials);
             if (Array.isArray(json)) {
                 json.forEach((m: any) => {
                    if (m.amount > 0) {
                        const icon = materialIcons[m.id] || '';
                        result.push(`${icon} ${m.amount} ${m.label}`);
                    }
                 });
             }
         } catch(e) {
             // Wenn JSON fehlschlägt, ist es wohl ein normaler String
             const parts = materials.split(',');
             parts.forEach(p => {
                if(p.trim()) result.push(p.trim());
             });
         }
    }

    return result;
  };

  if (loading) return <div className="p-20 text-center ml-64 font-black text-gray-300 animate-pulse uppercase tracking-widest">Lade Academy...</div>;

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 p-6 pb-40">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-black text-[#1D1D1F] italic tracking-tight">Academy</h1>
                <p className="text-gray-400 font-bold uppercase text-[8px] tracking-[0.2em]">{filteredExercises.length} Drills</p>
            </div>
            <Link href="/uebungen/neu" className="bg-black text-white px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-lg">
                + Neu
            </Link>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 mb-8 space-y-5">
            <div className="relative w-full">
                <i className="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input 
                    type="text" placeholder="Suche nach Titel oder Tag..." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-1 focus:ring-black transition-all"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setActiveCategory('Alle')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === 'Alle' ? 'bg-black border-black text-white shadow-md' : 'bg-gray-100 border-gray-100 text-gray-500 hover:bg-gray-200'}`}>ALLE</button>
                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                {categoriesList.map((cat) => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-black border-black text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}>{cat}</button>
                ))}
            </div>
        </div>

        {/* GRID AREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExercises.map((ex) => (
                <div key={ex.id} onClick={() => setViewExercise(ex)} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col relative">
                    
                    {/* Hover Actions */}
                    <div className="absolute top-3 right-3 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                        <Link href={`/uebungen/${ex.id}/edit`} onClick={e => e.stopPropagation()} className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-md hover:bg-black hover:text-white transition"><i className="ph-bold ph-pencil-simple text-xs"></i></Link>
                        <button onClick={e => handleDelete(ex.id, e)} className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 shadow-md hover:bg-red-500 hover:text-white transition"><i className="ph-bold ph-trash text-xs"></i></button>
                    </div>

                    {/* Bild */}
                    <div className="aspect-video bg-gray-50 relative overflow-hidden">
                        {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-2xl opacity-10 font-black italic">DRILL</div>}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                            {ex.age_groups?.map((age: string) => (
                                <span key={age} className="bg-blue-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase">{age}</span>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-black text-base text-gray-900 mb-1.5 line-clamp-1 italic">{ex.title}</h3>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-red-500 font-black text-[8px] uppercase tracking-wider">{ex.duration}' MIN</span>
                            <span className="text-blue-500 font-black text-[8px] uppercase tracking-wider">{ex.min_players}-{ex.max_players} SPIELER</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                             {ex.tags?.map((tag: string, i: number) => (
                                <span key={i} className="bg-gray-50 text-gray-400 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase border border-gray-100 tracking-widest">{tag}</span>
                             ))}
                        </div>

                        <p className="text-gray-400 text-[10px] leading-relaxed line-clamp-2 mb-4">{ex.description || "Keine Beschreibung."}</p>

                        <div className="mt-auto pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                            {/* HIER NUTZEN WIR UNSERE NEUE FUNKTION */}
                            {parseMaterials(ex.materials, ex.material).map((mat, i) => (
                                <span key={i} className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md text-[8px] font-bold text-gray-500 border border-gray-100">
                                    {mat}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Detail Modal */}
      {viewExercise && (
          <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                  <div className="p-10 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                      <div>
                          <h2 className="text-4xl font-black text-gray-900 mb-3 italic">{viewExercise.title}</h2>
                          <div className="flex flex-wrap gap-2">
                            {viewExercise.tags?.map((tag: string) => (
                                <span key={tag} className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{tag}</span>
                            ))}
                          </div>
                      </div>
                      <button onClick={() => setViewExercise(null)} className="w-14 h-14 rounded-full bg-white hover:bg-black hover:text-white flex items-center justify-center transition-all shadow-md group"><i className="ph-bold ph-x text-2xl group-hover:rotate-90 transition-transform"></i></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                          <div className="rounded-[3rem] overflow-hidden bg-gray-50 aspect-video flex items-center justify-center shadow-inner">
                              {viewExercise.image_url ? <img src={viewExercise.image_url} className="w-full h-full object-cover" /> : <i className="ph-fill ph-soccer-ball text-9xl text-gray-100"></i>}
                          </div>
                          <div className="space-y-12">
                              <div>
                                  <label className="text-[11px] font-black uppercase text-gray-300 tracking-[0.3em] block mb-5">Aufbau & Ablauf</label>
                                  <p className="text-gray-600 leading-relaxed text-xl whitespace-pre-wrap font-medium">{viewExercise.description || "Keine Beschreibung verfügbar."}</p>
                              </div>
                              <div className="bg-blue-50/40 p-10 rounded-[3.5rem] border border-blue-100">
                                  <label className="text-[11px] font-black uppercase text-blue-500 tracking-[0.3em] block mb-5">Coaching Fokus</label>
                                  <p className="text-blue-900 font-bold leading-relaxed italic text-xl">{viewExercise.coaching_points || "Keine Coaching-Punkte vorhanden."}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-10">
                                  <div>
                                      <label className="text-[11px] font-black uppercase text-gray-300 tracking-[0.3em] block mb-5">Equipment</label>
                                      <div className="flex flex-wrap gap-3">
                                          {/* AUCH HIER DIE NEUE FUNKTION NUTZEN */}
                                          {parseMaterials(viewExercise.materials, viewExercise.material).map((m, i) => (
                                              <span key={i} className="bg-white px-5 py-2.5 rounded-2xl text-[11px] font-black border border-gray-100 shadow-sm">{m}</span>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[11px] font-black uppercase text-gray-300 tracking-[0.3em] block mb-5">Teams</label>
                                      <div className="flex flex-wrap gap-2">
                                          {viewExercise.age_groups?.map((age: string) => (
                                              <span key={age} className="bg-gray-100 px-5 py-2.5 rounded-2xl text-[11px] font-black text-gray-600 border border-gray-200">{age}</span>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}