"use client";

import { useEffect, useState, useRef, use } from 'react'; // 'use' für params
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Icons
import { FaUpload, FaPencilAlt, FaTrash, FaCheck } from 'react-icons/fa';

// Dein FootballBoard Component
import FootballBoard from '@/components/FootballBoard';

export default function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
    // Unpack params (Next.js 15 pattern)
    const { id } = use(params);
    
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    // --- BILD & ZEICHNUNG ---
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<Blob | null>(null); // Neues Bild (falls geändert)
    const [drawingData, setDrawingData] = useState<string | null>(null);     // JSON für Board
    const [isDrawing, setIsDrawing] = useState(false);

    // --- MATERIALIEN ---
    // Initial state map
    const [materials, setMaterials] = useState<Record<string, number>>({
        balls: 0, cones: 0, hurdles: 0, poles: 0, goals: 0, bibs: 0, ladder: 0, dummies: 0, rings: 0
    });

    // Config für UI
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

    const categoryOptions = [
        'Schnelligkeit', 'Athletiktraining', 'Abschlussspiele', 'Torwarttraining',
        'Passspiel', 'Torschuss', 'Ballannahme', 'Dribbling', 'Koordination',
        'XvsX', 'Spielaufbau', 'Umschalten', 'Pressing', 'Überzahlspiel',
        'Chancen herausspielen', 'Kombinationsspiel'
    ];

    const teamOptions = ['KM', 'U19', 'U17', 'U16', 'U15', 'U14', 'U13', 'U12', 'U11', 'U10', 'U9', 'U8', 'U7', 'U6'];

    // --- DATEN LADEN ---
    useEffect(() => {
        const fetchExercise = async () => {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error("Fehler beim Laden:", error);
                alert("Übung konnte nicht geladen werden.");
                router.push('/uebungen');
                return;
            }

            if (data) {
                setTitle(data.title || '');
                setDescription(data.description || '');
                setCoachingPoints(data.coaching_points || '');
                setDuration(data.duration || 15);
                setMinPlayers(data.min_players || 6);
                setMaxPlayers(data.max_players || 14);
                setSelectedCategory(data.category || '');
                setSelectedAges(data.age_groups || []);
                
                // Bild & Zeichnung
                if (data.image_url) setImagePreview(data.image_url);
                if (data.drawing_data) setDrawingData(data.drawing_data);

                // --- MATERIALIEN PARSEN (DER FIX) ---
                const newMats: Record<string, number> = { 
                    balls: 0, cones: 0, hurdles: 0, poles: 0, goals: 0, bibs: 0, ladder: 0, dummies: 0, rings: 0 
                };

                if (Array.isArray(data.materials)) {
                    // NEUES JSON FORMAT: [{ id: 'balls', amount: 5, ... }]
                    data.materials.forEach((m: any) => {
                        if (newMats[m.id] !== undefined) {
                            newMats[m.id] = m.amount;
                        }
                    });
                } else if (typeof data.materials === 'string') {
                    // ALTES STRING FORMAT (Fallback, falls alte Daten existieren)
                    // "2 Bälle, 4 Hütchen"
                    try {
                        data.materials.split(',').forEach((item: string) => {
                            const parts = item.trim().split(' '); 
                            // Einfache Heuristik: Zahl ist vorn
                            const count = parseInt(parts[0]) || 0;
                            // Suche nach dem Namen in unserer Config, um die ID zu finden
                            const label = parts.slice(1).join(' ');
                            const foundConfig = materialConfig.find(c => label.includes(c.label));
                            if (foundConfig) {
                                newMats[foundConfig.id] = count;
                            }
                        });
                    } catch (e) { console.warn("Konnte alte Materialien nicht parsen", e); }
                }

                setMaterials(newMats);
            }
            setLoading(false);
        };

        fetchExercise();
    }, [id, router]);

    // --- BILD UPLOAD ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset drawing data, da neues Foto
        setDrawingData(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
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

    // --- ZEICHNUNG SPEICHERN ---
    const handleDrawingSave = (file: File, jsonData: string) => {
        setProcessedImage(file);
        setDrawingData(jsonData);
        setImagePreview(URL.createObjectURL(file));
        setIsDrawing(false);
    };

    // --- LOGIK ---
    const toggleAge = (age: string) => {
        if (age === 'Alle') {
            const allSelected = teamOptions.every(t => selectedAges.includes(t));
            setSelectedAges(allSelected ? [] : [...teamOptions]);
        } else {
            setSelectedAges(prev => 
                prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]
            );
        }
    };

    // --- UPDATE IN DB ---
    const handleUpdate = async () => {
        if (!title) return alert("Bitte Titel eingeben!");
        setSaving(true);

        try {
            let imageUrl = imagePreview; // Standardmäßig die alte URL behalten

            // Nur hochladen, wenn ein NEUES Bild (Blob) da ist
            if (processedImage) {
                const fileExt = drawingData ? 'png' : 'webp';
                const fileName = `${Date.now()}_edit.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('exercise-images')
                    .upload(fileName, processedImage);
                
                if (!uploadError) {
                    const { data } = supabase.storage.from('exercise-images').getPublicUrl(fileName);
                    imageUrl = data.publicUrl;
                } else {
                    console.error("Upload Error:", uploadError);
                }
            }

            // Materialliste formatieren
            const matList = materialConfig
                .filter(m => materials[m.id] > 0)
                .map(m => ({
                    id: m.id,
                    label: m.label,
                    amount: materials[m.id]
                }));

            // UPDATE Query
            const { error } = await supabase
                .from('exercises')
                .update({
                    title, description, coaching_points: coachingPoints,
                    duration, min_players: minPlayers, max_players: maxPlayers,
                    category: selectedCategory,
                    tags: [selectedCategory],
                    age_groups: selectedAges,
                    materials: matList, // Neue JSON Spalte
                    image_url: imageUrl,
                    drawing_data: drawingData
                })
                .eq('id', id);

            if (error) throw error;
            
            router.push(`/uebungen/${id}`); // Zurück zur Detailansicht
            router.refresh(); // Cache invalidieren

        } catch (err: any) {
            console.error("Update Error:", err);
            alert("Fehler beim Aktualisieren: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Lade Daten...</div>;

    const isAllSelected = teamOptions.length > 0 && teamOptions.every(t => selectedAges.includes(t));

    return (
        <div className="bg-[#F5F5F7] min-h-screen ml-64 p-6 pb-20">
            <div className="max-w-[1200px] mx-auto">
                
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black italic uppercase tracking-tight">Übung bearbeiten</h1>
                    <button onClick={() => router.back()} className="text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-black transition">Abbrechen</button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    
                    {/* LINKS */}
                    <div className="col-span-4 space-y-4">
                        
                        {/* BILD / BOARD */}
                        <div className="space-y-4">
                            {isDrawing ? (
                                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                                    <div className="w-full max-w-7xl h-full max-h-[90vh]">
                                        <FootballBoard 
                                            onSave={handleDrawingSave} 
                                            onClose={() => setIsDrawing(false)}
                                            initialData={drawingData || undefined} // WICHTIG: Alte Daten übergeben
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-[2rem] aspect-video flex flex-col items-center justify-center text-gray-400 overflow-hidden group shadow-sm hover:shadow-md transition-all relative border border-gray-100">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-contain bg-gray-50" alt="Vorschau" />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {/* Bearbeiten Button für Zeichnungen */}
                                                {drawingData && (
                                                    <button 
                                                        onClick={() => setIsDrawing(true)} 
                                                        className="bg-white/90 text-blue-600 p-2.5 rounded-full shadow-md hover:scale-110 transition-all border border-gray-100"
                                                        title="Zeichnung bearbeiten"
                                                    >
                                                    <FaPencilAlt />
                                                    </button>
                                                )}
                                                {/* Löschen */}
                                                <button 
                                                    onClick={() => { setImagePreview(null); setProcessedImage(null); setDrawingData(null); }}
                                                    className="bg-white/90 text-red-500 p-2.5 rounded-full shadow-md hover:scale-110 transition-all border border-gray-100"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-6 items-center w-full">
                                            <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-center hover:scale-105 transition-transform">
                                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                                <div className="flex justify-center mb-2 text-gray-300"><FaUpload className="text-3xl" /></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest block">Bild hochladen</span>
                                            </div>
                                            <div className="text-[8px] font-bold text-gray-200 uppercase">- ODER -</div>
                                            <button onClick={() => setIsDrawing(true)} className="bg-black text-white px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                                                <FaPencilAlt /> Taktik zeichnen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SLIDER */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="text-center w-1/3">
                                <span className="text-2xl font-black italic">{duration}'</span>
                                <input type="range" min="5" max="90" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full accent-black mt-2" />
                            </div>
                            <div className="w-px h-8 bg-gray-100"></div>
                            <div className="text-center space-y-1">
                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Spieler</span>
                                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                    <button onClick={() => setMinPlayers(Math.max(1, minPlayers - 1))} className="w-6 h-6 bg-white rounded shadow-sm text-xs font-bold text-gray-400">-</button>
                                    <span className="w-8 font-black text-xs">{minPlayers}</span>
                                    <button onClick={() => setMinPlayers(minPlayers + 1)} className="w-6 h-6 bg-black text-white rounded shadow-sm text-xs font-bold">+</button>
                                </div>
                            </div>
                        </div>

                        {/* TEAMS */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                            <span className="text-[9px] font-black text-gray-300 block mb-3 uppercase tracking-widest text-center">Teams</span>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                                <button onClick={() => toggleAge('Alle')} className={`px-3 py-1 rounded-lg font-black text-[9px] border ${isAllSelected ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>ALLE</button>
                                {teamOptions.map(age => (
                                    <button key={age} onClick={() => toggleAge(age)} className={`px-2.5 py-1 rounded-lg font-black text-[9px] ${selectedAges.includes(age) ? 'bg-black text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>{age}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RECHTS */}
                    <div className="col-span-8 space-y-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full text-2xl font-black border-none p-0 focus:ring-0 placeholder-gray-200 italic bg-transparent outline-none" placeholder="Titel der Übung..." />
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                            <span className="text-[9px] font-black text-gray-300 block mb-4 uppercase tracking-widest text-center">Kategorie</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {categoryOptions.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider ${selectedCategory === cat ? 'bg-black text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400'}`}>{cat}</button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-2 bg-gray-50 border-b border-gray-100"><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Beschreibung</span></div>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border-none p-6 font-medium text-gray-600 focus:ring-0 h-32 resize-none text-sm outline-none" placeholder="..." />
                        </div>

                        <div className="bg-blue-50/30 rounded-[2rem] border border-blue-100 overflow-hidden">
                            <div className="px-6 py-2 bg-blue-50 border-b border-blue-100"><span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Coaching Fokus</span></div>
                            <textarea value={coachingPoints} onChange={e => setCoachingPoints(e.target.value)} className="w-full border-none bg-transparent p-6 font-medium text-blue-900 focus:ring-0 h-24 resize-none italic text-sm outline-none" placeholder="..." />
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                            <span className="text-[9px] font-black text-gray-300 block mb-6 uppercase tracking-widest text-center">Equipment</span>
                            <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
                                {materialConfig.map((item) => (
                                    <div key={item.id} className="text-center group">
                                        <div className="text-xl mb-1">{item.icon}</div>
                                        <div className="flex flex-col items-center bg-gray-50 rounded-lg p-1 border border-gray-100 gap-1">
                                            <button onClick={() => setMaterials(prev => ({ ...prev, [item.id]: prev[item.id] + 1 }))} className="w-5 h-5 bg-black text-white rounded shadow-sm text-[10px] font-bold">+</button>
                                            <span className="font-black text-[10px] text-gray-700">{materials[item.id]}</span>
                                            <button onClick={() => setMaterials(prev => ({ ...prev, [item.id]: Math.max(0, prev[item.id] - 1) }))} className="w-5 h-5 bg-white rounded shadow-sm text-[10px] font-bold text-gray-400">-</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleUpdate} disabled={saving} className="w-full bg-black text-white py-4 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all text-xs flex justify-center items-center gap-3 disabled:opacity-70">
                            {saving ? 'Speichert...' : <><FaCheck /> Änderungen Speichern</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}