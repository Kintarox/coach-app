"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';

export default function EditExercisePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FORM STATES
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coachingPoints, setCoachingPoints] = useState('');
  const [duration, setDuration] = useState(15);
  const [minPlayers, setMinPlayers] = useState(8);
  const [maxPlayers, setMaxPlayers] = useState(12);
  
  // KATEGORIE (Single Choice)
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAges, setSelectedAges] = useState<string[]>([]);

  // KONFIGURATION (Identisch zu NewPage)
  const categoryOptions = [
    'Schnelligkeit', 'Athletiktraining', 'Abschlussspiele', 'Torwarttraining',
    'Passspiel', 'Torschuss', 'Ballannahme', 'Dribbling', 'Koordination',
    'XvsX', 'Spielaufbau', 'Umschalten', 'Pressing', 'Überzahlspiel',
    'Chancen herausspielen', 'Kombinationsspiel'
  ];

  const teamOptions = ['KM', 'U19', 'U17', 'U16', 'U15', 'U14', 'U13', 'U12', 'U11', 'U10', 'U9', 'U8', 'U7', 'U6'];

  const [materials, setMaterials] = useState({
    balls: 0, cones: 0, hurdles: 0, poles: 0, goals: 0, bibs: 0, ladder: 0, dummies: 0, rings: 0
  });

  const materialConfig = [
    { id: 'balls', label: 'Bälle', icon: '⚽' },
    { id: 'cones', label: 'Hütchen', icon: '📍' },
    { id: 'bibs', label: 'Laibchen', icon: '🎽' },
    { id: 'goals', label: 'Tore', icon: '🥅' },
    { id: 'poles', label: 'Stangen', icon: '🦯' },
    { id: 'hurdles', label: 'Hürden', icon: '🚧' },
    { id: 'ladder', label: 'K-Leiter', icon: '🪜' },
    { id: 'dummies', label: 'Dummys', icon: '👤' },
    { id: 'rings', label: 'Ringe', icon: '⭕' },
  ];

  // BILD VERARBEITUNG
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);

  // DATEN LADEN
  useEffect(() => {
    const fetchExercise = async () => {
      const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
      
      if (data && !error) {
        setTitle(data.title);
        setDescription(data.description || '');
        setCoachingPoints(data.coaching_points || '');
        setDuration(data.duration || 15);
        setMinPlayers(data.min_players || 8);
        setMaxPlayers(data.max_players || 12); // Falls vorhanden, sonst Default
        setSelectedCategory(data.category || '');
        setSelectedAges(data.age_groups || []);
        setImagePreview(data.image_url);

        // Material-String parsen ("2 Bälle, 4 Hütchen" -> State Object)
        if (data.materials) {
            const newMaterials = { balls: 0, cones: 0, hurdles: 0, poles: 0, goals: 0, bibs: 0, ladder: 0, dummies: 0, rings: 0 };
            data.materials.split(',').forEach((item: string) => {
                const parts = item.trim().split(' '); // z.B. ["2", "Bälle"]
                const count = parseInt(parts[0]);
                const name = parts.slice(1).join(' '); // "Bälle"

                // Mapping basierend auf Label Namen
                materialConfig.forEach(conf => {
                    if (name.includes(conf.label)) {
                        (newMaterials as any)[conf.id] = count;
                    }
                });
            });
            setMaterials(newMaterials);
        }
      }
      setLoading(false);
    };
    fetchExercise();
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1280; canvas.height = 720;
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
        canvas.toBlob((blob) => {
          if (blob) {
            setProcessedImage(blob);
            setImagePreview(URL.createObjectURL(blob));
          }
        }, 'image/webp', 0.8);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleAge = (age: string) => {
    if (age === 'Alle') {
        const allSelected = teamOptions.every(t => selectedAges.includes(t));
        if (allSelected) {
            setSelectedAges([]);
        } else {
            setSelectedAges([...teamOptions]);
        }
    } else {
        setSelectedAges(prev => 
            prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]
        );
    }
  };

  const handleUpdate = async () => {
    if (!title) return alert("Bitte Titel eingeben!");
    if (!selectedCategory) return alert("Bitte eine Kategorie wählen!");

    setSaving(true);

    try {
      let finalImageUrl = imagePreview;

      // Neues Bild hochladen, falls vorhanden
      if (processedImage) {
        const fileName = `${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from('exercise-images').upload(fileName, processedImage);
        if (!uploadError) {
          const { data } = supabase.storage.from('exercise-images').getPublicUrl(fileName);
          finalImageUrl = data.publicUrl;
        }
      }

      const matList = materialConfig.filter(m => (materials as any)[m.id] > 0).map(m => `${(materials as any)[m.id]} ${m.label}`);

      const { error } = await supabase.from('exercises').update({
        title, description, coaching_points: coachingPoints, duration,
        min_players: minPlayers, max_players: maxPlayers,
        category: selectedCategory,
        tags: [selectedCategory], 
        age_groups: selectedAges,
        materials: matList.join(', '),
        image_url: finalImageUrl
      }).eq('id', id);

      if (!error) router.push('/uebungen');
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  // Helper check ob "Alle" aktiv sein sollte
  const isAllSelected = teamOptions.length > 0 && teamOptions.every(t => selectedAges.includes(t));

  if (loading) return <div className="p-20 text-center ml-64 font-black text-gray-300 uppercase animate-pulse">Lade Drill...</div>;

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 p-6 pb-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black italic uppercase tracking-tight">Drill bearbeiten</h1>
            <button onClick={() => router.back()} className="text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-black transition">Abbrechen</button>
        </div>

        <div className="grid grid-cols-12 gap-6">
            {/* LINKS: EINSTELLUNGEN */}
            <div className="col-span-4 space-y-4">
                
                {/* BILD */}
                <div onClick={() => fileInputRef.current?.click()} className="bg-white rounded-[2rem] aspect-video flex flex-col items-center justify-center text-gray-400 cursor-pointer overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : (
                        <div className="text-center group-hover:scale-105 transition-transform"><i className="ph-bold ph-camera text-2xl mb-1 block opacity-30"></i><span className="text-[8px] font-black uppercase tracking-widest">Bild ändern</span></div>
                    )}
                </div>

                {/* SLIDER */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="text-center w-1/3"><span className="text-2xl font-black italic">{duration}'</span><input type="range" min="5" max="90" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full accent-black mt-2" /></div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center space-y-1"><span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Spieler</span>
                        <div className="flex items-center bg-gray-50 rounded-lg p-1">
                            <button onClick={() => setMinPlayers(Math.max(1, minPlayers - 1))} className="w-6 h-6 bg-white rounded shadow-sm text-xs font-bold text-gray-400">-</button>
                            <span className="w-8 font-black text-xs">{minPlayers}</span>
                            <button onClick={() => setMinPlayers(minPlayers + 1)} className="w-6 h-6 bg-black text-white rounded shadow-sm text-xs font-bold text-white">+</button>
                        </div>
                    </div>
                </div>

                {/* TEAMS */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-300 block mb-3 uppercase tracking-widest text-center">Geeignet für Teams</span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {/* ALLE Button */}
                        <button 
                            onClick={() => toggleAge('Alle')} 
                            className={`px-3 py-1 rounded-lg font-black text-[9px] transition-all border ${isAllSelected ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                        >
                            ALLE
                        </button>
                        
                        {/* Einzelne Teams */}
                        {teamOptions.map(age => (
                            <button 
                                key={age} 
                                onClick={() => toggleAge(age)} 
                                className={`px-2.5 py-1 rounded-lg font-black text-[9px] transition-all ${selectedAges.includes(age) ? 'bg-black text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                {age}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RECHTS: CONTENT */}
            <div className="col-span-8 space-y-4">
                
                {/* TITEL */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="w-full text-2xl font-black border-none p-0 focus:ring-0 placeholder-gray-100 italic bg-transparent outline-none" 
                        placeholder="Titel der Übung..." 
                    />
                </div>

                {/* KATEGORIE */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-300 block mb-4 uppercase tracking-widest text-center">Übungskategorie</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {categoryOptions.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat)} 
                                className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all ${
                                    selectedCategory === cat 
                                    ? 'bg-black text-white shadow-lg scale-105' 
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* BESCHREIBUNG */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-2 bg-gray-50 border-b border-gray-100"><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ablauf & Aufbau</span></div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border-none p-6 font-medium text-gray-600 focus:ring-0 h-32 resize-none text-sm leading-relaxed bg-transparent outline-none" placeholder="Beschreibung..." />
                </div>

                {/* COACHING */}
                <div className="bg-blue-50/30 rounded-[2rem] border border-blue-100 overflow-hidden">
                    <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2"><i className="ph-bold ph-megaphone text-blue-500 text-[10px]"></i><span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Coaching Fokus</span></div>
                    <textarea value={coachingPoints} onChange={e => setCoachingPoints(e.target.value)} className="w-full border-none bg-transparent p-6 font-medium text-blue-900 focus:ring-0 h-24 resize-none italic text-sm outline-none" placeholder="Worauf kommt es an?" />
                </div>

                {/* EQUIPMENT */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-300 block mb-6 uppercase tracking-widest text-center">Equipment</span>
                    <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
                        {materialConfig.map((item) => (
                            <div key={item.id} className="text-center group">
                                <div className="text-xl mb-1">{item.icon}</div>
                                <div className="flex flex-col items-center bg-gray-50 rounded-lg p-1 border border-gray-100 gap-1">
                                    <button onClick={() => setMaterials(prev => ({ ...prev, [item.id]: (prev as any)[item.id] + 1 }))} className="w-5 h-5 bg-black text-white rounded shadow-sm text-[10px] font-bold">+</button>
                                    <span className="font-black text-[10px]">{(materials as any)[item.id]}</span>
                                    <button onClick={() => setMaterials(prev => ({ ...prev, [item.id]: Math.max(0, (prev as any)[item.id] - 1) }))} className="w-5 h-5 bg-white rounded shadow-sm text-[10px] font-bold text-gray-400">-</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleUpdate} disabled={saving} className="w-full bg-blue-600 text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all text-xs">
                    {saving ? 'Drill wird aktualisiert...' : 'Änderungen speichern'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}