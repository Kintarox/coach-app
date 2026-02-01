"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrainingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [training, setTraining] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // VIEW STATE (Für das Übungs-Detail-Modal)
  const [viewExercise, setViewExercise] = useState<any>(null);

  // EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('Rasenplatz');
  const [editFocus, setEditFocus] = useState('');
  const [editAgeGroups, setEditAgeGroups] = useState<string[]>([]);
  
  // 4 PHASEN STATE
  const [plan, setPlan] = useState<{ [key: string]: any[] }>({ 
    warmup: [], 
    main1: [], 
    main2: [], 
    end: [] 
  });

  const sections = [
    { key: 'warmup', label: '1. Einstimmen / Aufwärmen', info: 'ca. 10-15 Min • Spielerisch, Ballkontakte', color: 'bg-orange-500' },
    { key: 'main1', label: '2. Hauptteil I - Technik', info: 'ca. 15-20 Min • Dribbling, Passformen', color: 'bg-blue-500' },
    { key: 'main2', label: '3. Hauptteil II - Spielform', info: 'ca. 25-30 Min • 3-gegen-3, Funino', color: 'bg-purple-500' },
    { key: 'end', label: '4. Schluss / Abschlussspiel', info: 'ca. 20 Min • Freies Spiel', color: 'bg-green-500' },
  ];

  const focusGroups = [
      { name: 'Technik', color: 'blue', items: ['Ballführung & Kontrolle', 'Dribbling', 'Passspiel', 'Torschuss'] },
      { name: 'Taktik', color: 'purple', items: ['Taktiktraining', 'Spielintelligenz', 'Umschalten', 'Kombinationsspiel', 'Positionsspezifisch'] },
      { name: 'Physis & Athletik', color: 'red', items: ['Koordination', 'Kraft & Ausdauer', 'Zirkeltraining / Athletik'] },
      { name: 'Spiel & Sonstiges', color: 'green', items: ['Spielformen', 'Torwarttraining'] }
  ];

  const ageOptions = ['Bambini', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U21', 'Erwachsene'];
  
  const locationOptions = [
      { label: 'Rasenplatz', icon: 'ph-plant' },
      { label: 'Hallentraining', icon: 'ph-house' } 
  ];

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const { data: tData } = await supabase.from('trainings').select('*').eq('id', id).single();
    if (tData) {
        setTraining(tData);
        setEditTitle(tData.title);
        const dt = new Date(tData.date);
        setEditDate(dt.toISOString().split('T')[0]);
        setEditTime(dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
        setEditLocation(tData.location || 'Rasenplatz');
        setEditFocus(tData.focus || '');
        setEditAgeGroups(tData.age_groups || []);
    }

    const { data: allEx } = await supabase.from('exercises').select('*').order('title');
    if (allEx) setCatalog(allEx);

    const { data: planData } = await supabase
        .from('training_exercises')
        .select('*, exercises(*)')
        .eq('training_id', id)
        .order('created_at', { ascending: true });
    
    if (planData) {
      const newPlan: any = { warmup: [], main1: [], main2: [], end: [] };
      planData.forEach((item: any) => {
        const sectionKey = newPlan[item.section] ? item.section : 'warmup';
        if (item.exercises) {
            newPlan[sectionKey].push({ ...item.exercises, link_id: item.id });
        }
      });
      setPlan(newPlan);
    }
    setLoading(false);
  };

  const handleUpdateDetails = async () => {
      const { error } = await supabase.from('trainings').update({
          title: editTitle,
          date: `${editDate} ${editTime}`,
          location: editLocation,
          focus: editFocus,
          age_groups: editAgeGroups
      }).eq('id', id);

      if (!error) {
          setIsEditing(false);
          fetchData(); 
      } else {
          alert("Fehler beim Speichern.");
      }
  };

  const toggleEditAgeGroup = (group: string) => {
    if (editAgeGroups.includes(group)) setEditAgeGroups(editAgeGroups.filter(g => g !== group));
    else setEditAgeGroups([...editAgeGroups, group]);
  };

  const toggleAllEditAges = () => {
      if (editAgeGroups.length === ageOptions.length) setEditAgeGroups([]);
      else setEditAgeGroups(ageOptions);
  };
  
  const getAgeDisplay = (groups: string[]) => {
      if (!groups || groups.length === 0) return 'Allgemein';
      if (groups.length === ageOptions.length) return 'FÜR ALLE GEEIGNET';
      return groups.join(', ');
  };

  const isAllSelected = editAgeGroups.length === ageOptions.length;

  // --- DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, type: 'CATALOG' | 'PLAN', itemId: string, currentSection?: string) => {
    const data = JSON.stringify({ type, itemId, currentSection });
    e.dataTransfer.setData("application/json", data);
    e.dataTransfer.effectAllowed = "copyMove";
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };
  const handleDrop = async (e: React.DragEvent, targetSection: string) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData("application/json");
    if (!rawData) return;
    const { type, itemId, currentSection } = JSON.parse(rawData);

    if (type === 'CATALOG') {
        const exerciseDetails = catalog.find(ex => ex.id === itemId);
        if (!exerciseDetails) return;
        const tempId = "temp-" + Math.random();
        setPlan(prev => ({ ...prev, [targetSection]: [...prev[targetSection], { ...exerciseDetails, link_id: tempId }] }));
        const { data, error } = await supabase.from('training_exercises').insert({ training_id: id, exercise_id: itemId, section: targetSection }).select('*, exercises(*)').single();
        if (!error) setPlan(prev => ({ ...prev, [targetSection]: prev[targetSection].map(ex => ex.link_id === tempId ? { ...ex, link_id: data.id } : ex) }));
    } else if (type === 'PLAN') {
        if (currentSection === targetSection) return;
        const itemToMove = plan[currentSection!].find(ex => ex.link_id === itemId);
        if (!itemToMove) return;
        setPlan(prev => ({ ...prev, [currentSection!]: prev[currentSection!].filter(ex => ex.link_id !== itemId), [targetSection]: [...prev[targetSection], itemToMove] }));
        await supabase.from('training_exercises').update({ section: targetSection }).eq('id', itemId);
    }
  };
  const removeExercise = async (linkId: string, section: string) => {
      setPlan(prev => ({ ...prev, [section]: prev[section].filter(ex => ex.link_id !== linkId) }));
      await supabase.from('training_exercises').delete().eq('id', linkId);
  };
  
  const filteredCatalog = catalog.filter(ex => ex.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // HILFSFUNKTION FÜR MATERIAL LISTE (String vs Array Fix)
  const getMaterialsList = (matData: any) => {
      if (!matData) return [];
      if (Array.isArray(matData)) return matData;
      if (typeof matData === 'string' && matData.trim() !== '') return matData.split(',');
      return [];
  };

  if (loading || !training) return <div className="p-20 text-center ml-64 font-bold text-gray-400">Lade Plan...</div>;

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 pb-40 transition-all duration-300 relative">
      
      {/* HEADER */}
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex justify-between items-center mb-8 relative group">
            
            <button 
                onClick={() => setIsEditing(true)} 
                className="absolute top-6 right-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition shadow-sm border border-gray-100"
                title="Details bearbeiten"
            >
                <i className="ph-bold ph-pencil-simple"></i>
            </button>

            <div>
                <h1 className="text-4xl font-black text-[#1D1D1F] mb-2">{training.title}</h1>
                <div className="flex items-center gap-4 text-gray-500 font-bold text-sm">
                    <span className="flex items-center gap-2">
                        <i className="ph-bold ph-calendar"></i> {new Date(training.date).toLocaleDateString('de-DE')} • {new Date(training.date).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    
                    <span className="flex items-center gap-1 uppercase tracking-wide">
                        <i className={`ph-bold ${training.location === 'Hallentraining' ? 'ph-house' : 'ph-plant'}`}></i>
                        {training.location || 'Rasenplatz'}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>

                    <span className="uppercase tracking-widest text-black bg-gray-100 px-2 py-0.5 rounded text-xs font-black">
                        {getAgeDisplay(training.age_groups)}
                    </span>
                </div>
            </div>

            <div className="hidden xl:flex flex-col items-end gap-2 mt-8 mr-12">
                 <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Schwerpunkt</span>
                 <span className="text-lg font-black bg-black text-white px-4 py-2 rounded-xl shadow-lg">
                    {training.focus}
                 </span>
            </div>
        </div>

        {/* --- VIEW EXERCISE MODAL --- */}
        {viewExercise && (
             <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                        <div>
                             <h2 className="text-2xl font-black text-gray-900">{viewExercise.title}</h2>
                             <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] bg-black text-white px-2 py-1 rounded font-bold uppercase tracking-wider">
                                    {viewExercise.duration} Min
                                </span>
                                <span className="text-[10px] border border-gray-300 text-gray-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                    {viewExercise.category || 'Allgemein'}
                                </span>
                             </div>
                        </div>
                        <button onClick={() => setViewExercise(null)} className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center shadow-sm">
                            <i className="ph-bold ph-x text-lg"></i>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            
                            {/* LINKE SEITE: BILD */}
                            <div className="bg-gray-100 p-8 flex items-center justify-center min-h-[300px]">
                                {viewExercise.image_url ? (
                                    <img src={viewExercise.image_url} className="rounded-2xl shadow-lg max-h-[400px] object-cover" />
                                ) : (
                                    <div className="text-6xl text-gray-300"><i className="ph-fill ph-soccer-ball"></i></div>
                                )}
                            </div>

                            {/* RECHTE SEITE: TEXT */}
                            <div className="p-8 space-y-8">
                                
                                {/* Beschreibung */}
                                <div>
                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
                                        <i className="ph-bold ph-text-align-left"></i> Beschreibung & Aufbau
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                                        {viewExercise.description || "Keine Beschreibung vorhanden."}
                                    </p>
                                </div>

                                {/* Coaching Punkte */}
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest mb-3 flex items-center gap-2">
                                        <i className="ph-bold ph-megaphone"></i> Coaching Punkte
                                    </h3>
                                    {viewExercise.coaching_points ? (
                                        <ul className="space-y-2">
                                            {viewExercise.coaching_points.split('\n').map((point: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                                                    <span className="text-blue-400 mt-1">•</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-blue-300 italic">Keine speziellen Coaching-Punkte.</p>
                                    )}
                                </div>

                                {/* Material */}
                                <div>
                                     <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 flex items-center gap-2">
                                        <i className="ph-bold ph-cone"></i> Material
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {getMaterialsList(viewExercise.materials).length > 0 ? (
                                            getMaterialsList(viewExercise.materials).map((mat: string, idx: number) => (
                                                <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200">
                                                    {mat.trim()}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-300 italic">Standard / Kein Material</span>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* --- EDIT MODAL OVERLAY --- */}
        {isEditing && (
            <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                    
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-black">Details bearbeiten</h2>
                        <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-200 flex items-center justify-center">
                            <i className="ph-bold ph-x"></i>
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto space-y-8">
                        
                        {/* 1. Titel der Einheit */}
                        <div>
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Titel der Einheit</label>
                             <div className="relative">
                                <input 
                                    value={editTitle} 
                                    onChange={e => setEditTitle(e.target.value)} 
                                    className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-2 border-transparent focus:border-black rounded-2xl p-4 text-xl font-black text-gray-900 transition-all outline-none placeholder-gray-300"
                                    placeholder="Titel eingeben..."
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <i className="ph-bold ph-pencil-simple"></i>
                                </div>
                             </div>
                        </div>

                        {/* Datum & Uhrzeit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Datum</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={editDate} 
                                        onChange={e => setEditDate(e.target.value)} 
                                        className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-2 border-transparent focus:border-black rounded-xl p-3 font-bold text-gray-900 transition-all outline-none" 
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <i className="ph-bold ph-calendar-blank"></i>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Uhrzeit</label>
                                <div className="relative">
                                    <input 
                                        type="time" 
                                        value={editTime} 
                                        onChange={e => setEditTime(e.target.value)} 
                                        className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-2 border-transparent focus:border-black rounded-xl p-3 font-bold text-gray-900 transition-all outline-none" 
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <i className="ph-bold ph-clock"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 w-full"></div>

                        {/* Ort & Altersklassen */}
                        <div>
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block">Ort</label>
                             <div className="flex gap-2 mb-8">
                                {locationOptions.map(opt => (
                                    <button key={opt.label} onClick={() => setEditLocation(opt.label)} className={`px-5 py-3 rounded-xl text-xs font-bold border-2 transition flex items-center gap-2 ${editLocation === opt.label ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                                        <i className={`ph-bold ${opt.icon} text-lg`}></i> {opt.label}
                                    </button>
                                ))}
                             </div>

                             <div className="flex items-center justify-between mb-3">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Geeignet für</label>
                                 <button 
                                     onClick={toggleAllEditAges} 
                                     className={`text-[10px] font-black uppercase px-3 py-1 rounded-full transition border ${isAllSelected ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                 >
                                     {isAllSelected ? 'Alle abwählen' : 'Alle auswählen'}
                                 </button>
                             </div>
                             
                             <div className="flex flex-wrap gap-2">
                                {ageOptions.map(age => (
                                    <button key={age} onClick={() => toggleEditAgeGroup(age)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${editAgeGroups.includes(age) ? 'bg-black text-white border-black' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}>
                                        {age}
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Schwerpunkt */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Schwerpunkt ändern</label>
                            <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                {focusGroups.map((group) => (
                                    <div key={group.name}>
                                        <h3 className="text-[9px] font-bold uppercase text-gray-400 mb-2 tracking-wider pl-1">{group.name}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {group.items.map((item) => {
                                                const isSelected = editFocus === item;
                                                let activeClass = '';
                                                if (group.color === 'blue') activeClass = 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200';
                                                if (group.color === 'purple') activeClass = 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-200';
                                                if (group.color === 'red') activeClass = 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200';
                                                if (group.color === 'green') activeClass = 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200';

                                                return (
                                                    <button key={item} onClick={() => setEditFocus(item)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${isSelected ? activeClass : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white shadow-sm'}`}>
                                                        {item}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[2rem] flex justify-end gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-full font-bold text-xs uppercase text-gray-500 hover:bg-gray-200">Abbrechen</button>
                        <button onClick={handleUpdateDetails} className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg text-xs uppercase tracking-widest hover:scale-105 transition">Speichern</button>
                    </div>
                </div>
            </div>
        )}

        {/* LAYOUT: 2 SPALTEN */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* SPALTE 1: KATALOG */}
            <div className="xl:col-span-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 h-[calc(100vh-300px)] sticky top-6 overflow-hidden flex flex-col">
                 <div className="mb-4">
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                        <i className="ph-bold ph-magnifying-glass text-gray-400 text-lg"></i>
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Übung suchen..." className="bg-transparent border-none text-sm font-bold w-full focus:ring-0 placeholder-gray-400" />
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {filteredCatalog.map(ex => (
                        <div 
                            key={ex.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, 'CATALOG', ex.id)}
                            className="bg-white border border-gray-100 p-4 rounded-2xl hover:border-black hover:shadow-lg cursor-grab active:cursor-grabbing transition group relative select-none"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl shadow-sm overflow-hidden flex-shrink-0">
                                     {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-cover"/> : '⚽'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 leading-tight mb-1">{ex.title}</h4>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-50 px-1.5 py-0.5 rounded">{ex.duration || 15} Min</span>
                                        {/* VIEW BUTTON IM KATALOG */}
                                        <button onClick={() => setViewExercise(ex)} className="ml-2 text-gray-400 hover:text-blue-500 cursor-pointer" title="Details">
                                            <i className="ph-bold ph-info"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Link href="/uebungen/neu" className="border-2 border-dashed border-gray-200 p-4 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold text-xs hover:border-black hover:text-black transition uppercase tracking-widest mt-4">
                        + Neue Übung erstellen
                    </Link>
                 </div>
            </div>

            {/* SPALTE 2: PLAN */}
            <div className="xl:col-span-8 space-y-8">
                {sections.map((sec, index) => (
                    <div key={sec.key} onDrop={(e) => handleDrop(e, sec.key)} onDragOver={handleDragOver} className="relative">
                        <div className="flex items-center gap-4 mb-4 pl-2">
                             <div className={`w-8 h-8 rounded-lg ${sec.color} text-white flex items-center justify-center font-black shadow-lg`}>{index + 1}</div>
                             <div>
                                <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">{sec.label}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">{sec.info}</p>
                             </div>
                        </div>

                        <div className={`bg-white rounded-[2rem] p-4 min-h-[180px] border-2 transition-all ${plan[sec.key].length === 0 ? 'border-dashed border-gray-200' : 'border-transparent shadow-sm border-gray-100'}`}>
                             {plan[sec.key].length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 min-h-[140px]">
                                    <span className="text-xs font-bold uppercase tracking-widest">Hier Übung reinziehen</span>
                                </div>
                             ) : (
                                <div className="space-y-3">
                                    {plan[sec.key].map((ex: any) => (
                                        <div 
                                            key={ex.link_id} 
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(e, 'PLAN', ex.link_id, sec.key)}
                                            // HIER IST DAS RUNDE "KASTL" DESIGN (rounded-[1.5rem])
                                            className="bg-white p-4 rounded-[1.5rem] flex items-center gap-5 group hover:shadow-lg transition border border-gray-100 hover:border-gray-200 relative cursor-grab active:cursor-grabbing mb-3"
                                        >
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner overflow-hidden flex-shrink-0">
                                                {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-cover"/> : '⚽'}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-base text-gray-900 mb-1">{ex.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-1 rounded-md text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <i className="ph-bold ph-clock"></i> {ex.duration || 15} Min
                                                    </span>
                                                    {ex.description && (
                                                        <span className="text-xs text-gray-400 truncate max-w-[200px] hidden sm:block">
                                                            {ex.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* BUTTONS RECHTS - RUNDES DESIGN */}
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition shadow-sm z-10 bg-white p-1 rounded-full border border-gray-100 absolute right-4">
                                                {/* VIEW BUTTON */}
                                                <button onClick={() => setViewExercise(ex)} className="w-9 h-9 rounded-full text-blue-500 hover:bg-blue-50 flex items-center justify-center transition" title="Details ansehen">
                                                    <i className="ph-bold ph-eye text-lg"></i>
                                                </button>
                                                
                                                <div className="w-px h-4 bg-gray-200"></div>

                                                {/* DELETE BUTTON */}
                                                <button onClick={() => removeExercise(ex.link_id, sec.key)} className="w-9 h-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition">
                                                    <i className="ph-bold ph-trash text-lg"></i>
                                                </button>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
      </div>
      
      {/* Footer */}
      <div className="fixed bottom-0 right-0 left-64 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-[999] flex justify-center gap-4 shadow-[0_-5px_30px_rgba(0,0,0,0.08)]">
            <button onClick={() => router.push('/training')} className="px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100">Abbrechen</button>
            <button onClick={() => router.push('/training')} className="bg-black text-white px-10 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition flex items-center gap-3 text-xs uppercase tracking-widest">
                <i className="ph-bold ph-check text-lg"></i><span>Fertig</span>
            </button>
      </div>

    </div>
  );
}