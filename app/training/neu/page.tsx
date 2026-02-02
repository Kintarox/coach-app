"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Typen für Drag & Drop
type DragItem = {
  type: 'NEW' | 'MOVE';
  exercise: any;
  sourcePhase?: string;
  sourceIndex?: number;
};

export default function NewTrainingSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // TRAININGSDATEN
  const [planTitle, setPlanTitle] = useState('Trainingseinheit');
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [planTime, setPlanTime] = useState('19:00'); // NEU: Zeit-State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // PHASEN STATE
  const [phases, setPhases] = useState<{ [key: string]: any[] }>({
    warmup: [],
    main1: [],
    main2: [],
    coolDown: []
  });

  // KATALOG & FILTER
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [isDragging, setIsDragging] = useState(false);

  const filterCategories = [
    'Schnelligkeit', 'Athletiktraining', 'Abschlussspiele', 'Torwarttraining',
    'Passspiel', 'Torschuss', 'Ballannahme', 'Dribbling', 'Koordination',
    'XvsX', 'Spielaufbau', 'Umschalten', 'Pressing', 'Überzahlspiel',
    'Chancen herausspielen', 'Kombinationsspiel'
  ];

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      const { data } = await supabase.from('exercises').select('*').order('title');
      if (data) {
        setExercises(data);
        setFilteredExercises(data);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    let result = exercises;
    if (activeCategory !== 'Alle') {
      result = result.filter(ex => ex.tags?.includes(activeCategory) || ex.category === activeCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(ex => 
        ex.title.toLowerCase().includes(term) || ex.tags?.some((t: string) => t.toLowerCase().includes(term))
      );
    }
    setFilteredExercises(result);
  }, [searchTerm, activeCategory, exercises]);

  const handleDragStartNew = (e: React.DragEvent, exercise: any) => {
    const item: DragItem = { type: 'NEW', exercise };
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    setIsDragging(true);
  };

  const handleDragStartMove = (e: React.DragEvent, exercise: any, sourcePhase: string, index: number) => {
    const item: DragItem = { type: 'MOVE', exercise, sourcePhase, sourceIndex: index };
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, targetPhase: string) => {
    e.preventDefault();
    setIsDragging(false);
    const dataString = e.dataTransfer.getData("application/json");
    if (!dataString) return;
    try {
      const item: DragItem = JSON.parse(dataString);
      setPhases(prev => {
        const newPhases = { ...prev };
        if (item.type === 'MOVE' && item.sourcePhase !== undefined && item.sourceIndex !== undefined) {
          newPhases[item.sourcePhase] = newPhases[item.sourcePhase].filter((_, i) => i !== item.sourceIndex);
        }
        newPhases[targetPhase] = [...newPhases[targetPhase], item.exercise];
        return newPhases;
      });
    } catch (err) { console.error("Drop Error:", err); }
  };

  const removeExercise = (phaseKey: string, indexToRemove: number) => {
    setPhases(prev => ({
      ...prev,
      [phaseKey]: prev[phaseKey].filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSave = async () => {
    if (!planTitle) return alert("Bitte Titel eingeben");
    if (!currentUserId) return alert("Fehler: Benutzer nicht identifiziert.");

    setLoading(true);

    // NEU: Kombiniere Datum und Zeit zu einem Timestamp für scheduled_at
    const scheduledAt = new Date(`${planDate}T${planTime}`).toISOString();

    const { error } = await supabase.from('plans').insert({
        title: planTitle,
        date: planDate, // Abwärtskompatibilität
        time: planTime, // Abwärtskompatibilität
        scheduled_at: scheduledAt, // NEU: Das kombinierte Feld
        focus: '',
        content: phases,
        user_id: currentUserId 
    });

    if (!error) {
        alert("Training gespeichert!");
        router.push('/training');
    } else {
        alert("Fehler: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 p-6 pb-40 flex flex-col h-screen overflow-hidden">
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-6 shrink-0">
         <input 
            value={planTitle} onChange={e => setPlanTitle(e.target.value)}
            className="text-3xl font-black text-[#1D1D1F] border-none focus:ring-0 p-0 placeholder-gray-300 w-full bg-transparent" 
            placeholder="Name der Einheit..."
         />
         <div className="flex items-center gap-4 mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            {/* DATUMSFELD */}
            <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 text-gray-500 uppercase font-black" />
            <span>•</span>
            {/* NEU: ZEITFELD */}
            <input type="time" value={planTime} onChange={e => setPlanTime(e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 text-gray-500 uppercase font-black w-20" />
            <span>•</span>
            <span>Rasenplatz</span>
         </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className="w-1/3 flex flex-col bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 shrink-0 flex flex-col gap-5 bg-white z-10">
                <div className="relative">
                    <i className="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Übung suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-1 focus:ring-black"/>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                    <button onClick={() => setActiveCategory('Alle')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === 'Alle' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>Alle</button>
                    {filterCategories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>{cat}</button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredExercises.length === 0 && <div className="text-center py-10 text-gray-300 text-[10px] font-black uppercase tracking-widest">Keine Übungen gefunden</div>}
                {filteredExercises.map(ex => (
                    <div 
                        key={ex.id} draggable onDragStart={(e) => handleDragStartNew(e, ex)} onDragEnd={handleDragEnd}
                        className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group bg-white hover:border-gray-300"
                    >
                        <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0 relative flex items-center justify-center">
                            {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-cover" alt={ex.title} /> : <span className="text-lg opacity-50">⚽</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-xs text-gray-900 truncate mb-1">{ex.title}</h4>
                            <div className="flex gap-2"><span className="bg-gray-50 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">{ex.duration}'</span><span className="bg-gray-50 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase truncate max-w-[80px]">{ex.category}</span></div>
                        </div>
                        <i className="ph-bold ph-dots-six-vertical text-gray-300 group-hover:text-black"></i>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-20">
            <PhaseDropZone phaseKey="warmup" title="Einstimmen / Aufwärmen" meta="ca. 10-15 Min • Spielerisch" color="orange" number="1" exercises={phases.warmup} onDrop={handleDrop} onDragOver={handleDragOver} onDragStartMove={handleDragStartMove} onRemove={removeExercise} isDragging={isDragging} />
            <PhaseDropZone phaseKey="main1" title="Hauptteil I - Technik" meta="ca. 15-20 Min • Intensiv" color="blue" number="2" exercises={phases.main1} onDrop={handleDrop} onDragOver={handleDragOver} onDragStartMove={handleDragStartMove} onRemove={removeExercise} isDragging={isDragging} />
            <PhaseDropZone phaseKey="main2" title="Hauptteil II - Spielform" meta="ca. 25-30 Min • Anwendung" color="purple" number="3" exercises={phases.main2} onDrop={handleDrop} onDragOver={handleDragOver} onDragStartMove={handleDragStartMove} onRemove={removeExercise} isDragging={isDragging} />
            <PhaseDropZone phaseKey="coolDown" title="Ausklang" meta="ca. 5-10 Min • Cool Down" color="green" number="4" exercises={phases.coolDown} onDrop={handleDrop} onDragOver={handleDragOver} onDragStartMove={handleDragStartMove} onRemove={removeExercise} isDragging={isDragging} />
        </div>
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-100 p-4 flex justify-between items-center z-50">
        <button onClick={() => router.back()} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition ml-6">Abbrechen</button>
        <button onClick={handleSave} disabled={loading} className="bg-black text-white px-10 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition mr-6">
            {loading ? 'Speichere...' : 'Plan Fertigstellen'}
        </button>
      </div>
    </div>
  );
}

function PhaseDropZone({ phaseKey, title, meta, color, number, exercises, onDrop, onDragOver, onRemove, isDragging, onDragStartMove }: any) {
    const colorClasses: any = { orange: 'bg-orange-500 shadow-orange-100', blue: 'bg-blue-600 shadow-blue-100', purple: 'bg-purple-600 shadow-purple-100', green: 'bg-emerald-500 shadow-emerald-100' };
    const borderClasses: any = { orange: 'hover:border-orange-200', blue: 'hover:border-blue-200', purple: 'hover:border-purple-200', green: 'hover:border-emerald-200' };

    return (
        <div 
            onDrop={(e) => onDrop(e, phaseKey)} onDragOver={onDragOver} 
            className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-all min-h-[180px] flex flex-col ${borderClasses[color]} ${isDragging ? 'border-gray-300 bg-gray-50/50' : 'border-gray-100'}`}
        >
            <div className="flex items-center gap-3 mb-4">
                <span className={`${colorClasses[color]} text-white w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-lg text-sm`}>{number}</span>
                <div><h3 className="font-black text-sm uppercase tracking-widest text-gray-900">{title}</h3><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{meta}</p></div>
            </div>
            <div className="flex-1 space-y-3">
                {exercises.length === 0 && <div className="h-full border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 text-[9px] font-bold uppercase tracking-widest min-h-[80px] pointer-events-none">Hierhin ziehen</div>}
                {exercises.map((ex: any, idx: number) => (
                    <div key={`${ex.id}-${idx}`} draggable onDragStart={(e) => onDragStartMove(e, ex, phaseKey, idx)} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 group relative cursor-grab active:cursor-grabbing hover:shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shrink-0 flex items-center justify-center">{ex.image_url ? <img src={ex.image_url} className="w-full h-full object-cover"/> : <span>⚽</span>}</div>
                        <div><h4 className="font-bold text-xs">{ex.title}</h4><span className="text-[9px] text-gray-400">{ex.duration} MIN</span></div>
                        <button onClick={() => onRemove(phaseKey, idx)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-50"><i className="ph-bold ph-trash"></i></button>
                    </div>
                ))}
            </div>
        </div>
    );
}