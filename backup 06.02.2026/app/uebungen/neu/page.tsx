"use client";

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Icons für die Page-UI
import { FaUpload, FaPencilAlt, FaTrash, FaCheck } from 'react-icons/fa';

// Dein neues Board
import FootballBoard from '@/components/FootballBoard'; 

export default function NewExercisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FORM STATES ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coachingPoints, setCoachingPoints] = useState('');
  const [duration, setDuration] = useState(15);
  const [minPlayers, setMinPlayers] = useState(8);
  const [maxPlayers, setMaxPlayers] = useState(12);
  
  // --- KATEGORIE & ALTER ---
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAges, setSelectedAges] = useState<string[]>([]);

  // --- BILD & ZEICHNUNG STATES ---
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);
  const [drawingData, setDrawingData] = useState<string | null>(null); // JSON für Re-Edit
  const [isDrawing, setIsDrawing] = useState(false); // Modal State

  // --- KONFIGURATIONEN ---
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

  // --- 1. BILD VERARBEITUNG (UPLOAD VOM PC) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Wenn ein echtes Foto hochgeladen wird, löschen wir die Zeichnungsdaten,
    // da diese nicht mehr zum Bild passen.
    setDrawingData(null); 

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Canvas erstellen zum Resizen (Optimierung)
        const canvas = document.createElement('canvas');
        const maxWidth = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            setProcessedImage(blob);
            setImagePreview(URL.createObjectURL(blob));
          }
        }, 'image/webp', 0.85);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- 2. BILD VERARBEITUNG (VOM TAKTIK BOARD) ---
  const handleDrawingSave = (file: File, jsonData: string) => {
    setProcessedImage(file);           // Das PNG Bild für die Anzeige/Upload
    setDrawingData(jsonData);          // Die JSON "Bauanleitung" für späteres Bearbeiten
    setImagePreview(URL.createObjectURL(file)); 
    setIsDrawing(false);               // Modal schließen
  };

  // --- 3. HELPER: ALTERSWAL ---
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

  // --- 4. SPEICHERN (SUBMIT) ---
  const handleSubmit = async () => {
    if (!title) return alert("Bitte Titel eingeben!");
    if (!selectedCategory) return alert("Bitte eine Kategorie wählen!");

    setLoading(true);

    try {
      // A) Bild hochladen (falls vorhanden)
      let imageUrl = null;
      if (processedImage) {
        // Wenn drawingData existiert, ist es ein PNG, sonst ein optimiertes WebP vom Upload
        const fileExt = drawingData ? 'png' : 'webp'; 
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('exercise-images')
            .upload(fileName, processedImage);
            
        if (!uploadError) {
          const { data } = supabase.storage
            .from('exercise-images')
            .getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        } else {
            console.error("Bild Upload Fehler:", uploadError);
            alert("Das Bild konnte nicht hochgeladen werden, Übung wird trotzdem gespeichert.");
        }
      }

      // B) Materialliste formatieren
      const matList = materialConfig
        .filter(m => (materials as any)[m.id] > 0)
        .map(m => ({
            id: m.id,
            label: m.label,
            amount: (materials as any)[m.id]
        }));

      // C) Datenbank Eintrag erstellen
      const payload = {
        title, 
        description, 
        coaching_points: coachingPoints, 
        duration,
        min_players: minPlayers, 
        max_players: maxPlayers,
        category: selectedCategory,
        tags: [selectedCategory], 
        age_groups: selectedAges,
        
        // WICHTIG: Korrekter Spaltenname (Mehrzahl)
        materials: matList, 
        
        image_url: imageUrl,
        
        // WICHTIG: JSON Daten für das Board (oder null)
        drawing_data: drawingData 
      };

      const { error } = await supabase.from('exercises').insert(payload);

      if (error) {
          console.error("DB Error Detail:", error);
          alert(`Datenbank Fehler: ${error.message}`);
      } else {
          // Erfolg! Zurück zur Übersicht
          router.push('/uebungen');
      }

    } catch (err: any) { 
        console.error("Critical Error:", err);
        alert(`Unerwarteter Fehler: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  const isAllSelected = teamOptions.length > 0 && teamOptions.every(t => selectedAges.includes(t));

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 p-6 pb-20">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black italic uppercase tracking-tight">Drill erstellen</h1>
            <button onClick={() => router.back()} className="text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-black transition">Abbrechen</button>
        </div>

        <div className="grid grid-cols-12 gap-6">
            
            {/* --- LINKE SPALTE --- */}
            <div className="col-span-4 space-y-4">
                
                {/* 1. BILD / ZEICHNUNG */}
                <div className="space-y-4">
                    
                    {/* Label */}
                    {!isDrawing && !imagePreview && (
                        <div className="flex gap-2 justify-center mb-2">
                             <span className="text-[9px] uppercase font-bold text-gray-400">Quelle wählen:</span>
                        </div>
                    )}

                    {isDrawing ? (
                        /* --- MODUS A: ZEICHNEN (MODAL) --- */
                        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="w-full max-w-7xl h-full max-h-[90vh]">
                                <FootballBoard 
                                    onSave={handleDrawingSave} 
                                    onClose={() => setIsDrawing(false)}
                                    // Falls wir schon was gezeichnet hatten, übergeben wir es zum Weiterbearbeiten
                                    initialData={drawingData || undefined}
                                />
                            </div>
                        </div>
                    ) : (
                        /* --- MODUS B: VORSCHAU / AUSWAHL --- */
                        <div className="bg-white rounded-[2rem] aspect-video flex flex-col items-center justify-center text-gray-400 overflow-hidden group shadow-sm hover:shadow-md transition-all relative border border-gray-100">
                            {imagePreview ? (
                                <>
                                    {/* Das Vorschaubild */}
                                    <img src={imagePreview} className="w-full h-full object-contain bg-gray-50" alt="Vorschau" />
                                    
                                    {/* Overlay Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        {/* Bearbeiten Button (nur wenn es eine Zeichnung ist) */}
                                        {drawingData && (
                                            <button 
                                                onClick={() => setIsDrawing(true)} 
                                                className="bg-white text-blue-600 p-2.5 rounded-full shadow-md hover:scale-110 transition-all border border-gray-100"
                                                title="Zeichnung bearbeiten"
                                            >
                                               <FaPencilAlt />
                                            </button>
                                        )}
                                        {/* Löschen Button */}
                                        <button 
                                            onClick={() => { setImagePreview(null); setProcessedImage(null); setDrawingData(null); }}
                                            className="bg-white text-red-500 p-2.5 rounded-full shadow-md hover:scale-110 transition-all border border-gray-100"
                                            title="Bild entfernen"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-6 items-center w-full">
                                    
                                    {/* Upload Button */}
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer text-center group-hover:scale-105 transition-transform"
                                    >
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                        <div className="flex justify-center mb-2 text-gray-300">
                                            <FaUpload className="text-3xl" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest block">Bild hochladen</span>
                                    </div>

                                    <div className="text-[8px] font-bold text-gray-200 uppercase">- ODER -</div>

                                    {/* Zeichnen Button */}
                                    <button 
                                        onClick={() => setIsDrawing(true)}
                                        className="bg-black text-white px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <FaPencilAlt />
                                        Taktik zeichnen
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. SLIDER (Dauer & Spieler) */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="text-center w-1/3">
                        <span className="text-2xl font-black italic">{duration}'</span>
                        <input type="range" min="5" max="90" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full accent-black mt-2" />
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center space-y-1">
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Spieler</span>
                        <div className="flex items-center bg-gray-50 rounded-lg p-1">
                            <button onClick={() => setMinPlayers(Math.max(1, minPlayers - 1))} className="w-6 h-6 bg-white rounded shadow-sm text-xs font-bold text-gray-400 hover:text-black">-</button>
                            <span className="w-8 font-black text-xs">{minPlayers}</span>
                            <button onClick={() => setMinPlayers(minPlayers + 1)} className="w-6 h-6 bg-black text-white rounded shadow-sm text-xs font-bold hover:bg-gray-800">+</button>
                        </div>
                    </div>
                </div>

                {/* 3. TEAMS */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-300 block mb-3 uppercase tracking-widest text-center">Geeignet für Teams</span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        <button 
                            onClick={() => toggleAge('Alle')} 
                            className={`px-3 py-1 rounded-lg font-black text-[9px] transition-all border ${isAllSelected ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                        >
                            ALLE
                        </button>
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

            {/* --- RECHTE SPALTE --- */}
            <div className="col-span-8 space-y-4">
                
                {/* 1. TITEL */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="w-full text-2xl font-black border-none p-0 focus:ring-0 placeholder-gray-200 italic bg-transparent outline-none" 
                        placeholder="Titel der Übung..." 
                    />
                </div>

                {/* 2. KATEGORIEN */}
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

                {/* 3. BESCHREIBUNG */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-2 bg-gray-50 border-b border-gray-100"><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ablauf & Aufbau</span></div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border-none p-6 font-medium text-gray-600 focus:ring-0 h-32 resize-none text-sm leading-relaxed bg-transparent outline-none" placeholder="Beschreibe den Ablauf..." />
                </div>

                {/* 4. COACHING */}
                <div className="bg-blue-50/30 rounded-[2rem] border border-blue-100 overflow-hidden">
                    <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Coaching Fokus</span>
                    </div>
                    <textarea value={coachingPoints} onChange={e => setCoachingPoints(e.target.value)} className="w-full border-none bg-transparent p-6 font-medium text-blue-900 focus:ring-0 h-24 resize-none italic text-sm outline-none" placeholder="Worauf müssen die Spieler achten?" />
                </div>

                {/* 5. EQUIPMENT */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <span className="text-[9px] font-black text-gray-300 block mb-6 uppercase tracking-widest text-center">Equipment</span>
                    <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
                        {materialConfig.map((item) => (
                            <div key={item.id} className="text-center group">
                                <div className="text-xl mb-1">{item.icon}</div>
                                <div className="flex flex-col items-center bg-gray-50 rounded-lg p-1 border border-gray-100 gap-1 transition-all group-hover:border-gray-300">
                                    <button onClick={() => setMaterials(prev => ({ ...prev, [item.id]: (prev as any)[item.id] + 1 }))} className="w-5 h-5 bg-black text-white rounded shadow-sm text-[10px] font-bold hover:bg-gray-800 transition-colors">+</button>
                                    <span className="font-black text-[10px] text-gray-700">{(materials as any)[item.id]}</span>
                                    <button onClick={() => setMaterials(prev => ({ ...prev, [item.id]: Math.max(0, (prev as any)[item.id] - 1) }))} className="w-5 h-5 bg-white rounded shadow-sm text-[10px] font-bold text-gray-400 hover:text-black border border-gray-100">-</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="w-full bg-black text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all text-xs flex justify-center items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                >
                    {loading ? (
                        'Drill wird gespeichert...'
                    ) : (
                        <>
                            <FaCheck /> In Academy sichern
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}