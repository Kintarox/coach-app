"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEdit, FaArrowLeft, FaClock, FaUsers, FaLayerGroup } from 'react-icons/fa';

// UNSER NEUER BAUSTEIN
import ExerciseMaterialDisplay from '@/components/ExerciseMaterialDisplay';

export default function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [exercise, setExercise] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercise = async () => {
            const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
            if (!error && data) setExercise(data);
            setLoading(false);
        };
        fetchExercise();
    }, [id]);

    if (loading) return <div className="p-10 text-center text-gray-400">Lade Übung...</div>;
    if (!exercise) return <div className="p-10 text-center">Nicht gefunden.</div>;

    return (
        <div className="bg-[#F5F5F7] min-h-screen ml-64 p-8">
            <div className="max-w-5xl mx-auto">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-black transition-colors"><FaArrowLeft /> Zurück</button>
                    <Link href={`/uebungen/${id}/edit`} className="bg-black text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"><FaEdit /> Bearbeiten</Link>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* LINKS */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        {/* BILD */}
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            {exercise.image_url ? (
                                <img src={exercise.image_url} alt={exercise.title} className="w-full h-auto object-contain rounded-[2rem] bg-gray-50 aspect-video" />
                            ) : (
                                <div className="aspect-video bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest flex-col gap-2"><span className="text-4xl">📷</span><span>Kein Bild</span></div>
                            )}
                        </div>
                        {/* TITEL */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <h1 className="text-4xl font-black italic tracking-tighter text-gray-900 mb-2">{exercise.title}</h1>
                                <span className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest self-start">{exercise.category}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-8">{exercise.age_groups?.map((age: string) => (<span key={age} className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md text-[10px] font-bold">{age}</span>))}</div>
                            <div className="space-y-6"><div><h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Ablauf</h3><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{exercise.description}</p></div></div>
                        </div>
                        {/* COACHING */}
                        {exercise.coaching_points && (
                            <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-[2.5rem]">
                                <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest mb-3 flex items-center gap-2"><span className="text-lg">📢</span> Coaching Fokus</h3>
                                <p className="text-blue-900 font-medium italic leading-relaxed whitespace-pre-wrap">"{exercise.coaching_points}"</p>
                            </div>
                        )}
                    </div>

                    {/* RECHTS */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* STATS */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl text-gray-400"><FaClock /></div><div><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dauer</span><span className="text-xl font-black">{exercise.duration} Min.</span></div></div>
                            <div className="w-full h-px bg-gray-50"></div>
                            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl text-gray-400"><FaUsers /></div><div><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spieler</span><span className="text-xl font-black">{exercise.min_players} - {exercise.max_players}</span></div></div>
                            <div className="w-full h-px bg-gray-50"></div>
                            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl text-gray-400"><FaLayerGroup /></div><div><span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kategorie</span><span className="text-sm font-bold truncate max-w-[150px]">{exercise.category}</span></div></div>
                        </div>

                        {/* --- HIER IST DER NEUE EQUIPMENT BAUSTEIN --- */}
                        <ExerciseMaterialDisplay 
                            materials={exercise.materials} 
                            material={exercise.material} 
                        />

                    </div>
                </div>
            </div>
        </div>
    );
}