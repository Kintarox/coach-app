"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Dashboard() {
  // NEU: State für den Vornamen
  const [userName, setUserName] = useState('Coach'); 
  
  const [stats, setStats] = useState({
    players: 0,
    trainings: 0,
    nextTraining: null as any
  });
  const [recentExercises, setRecentExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      
      // 1. User Namen holen (NEU)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
        if (profile?.first_name) {
          setUserName(profile.first_name);
        }
      }

      // 2. Zähler holen
      const { count: pCount } = await supabase.from('players').select('*', { count: 'exact', head: true });
      const { count: tCount } = await supabase.from('trainings').select('*', { count: 'exact', head: true });
      
      // 3. Nächstes Training finden
      const today = new Date().toISOString().split('T')[0];
      const { data: nextT } = await supabase
        .from('trainings')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1)
        .single();

      // 4. Zuletzt erstellte Übungen
      const { data: recentEx } = await supabase
        .from('exercises')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        players: pCount || 0,
        trainings: tCount || 0,
        nextTraining: nextT
      });
      
      if (recentEx) setRecentExercises(recentEx);
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long' });
  };

  if (loading) return <div className="p-20 text-center text-gray-400 font-bold ml-64">Lade Dashboard...</div>;

  return (
    <div className="p-8 bg-[#F5F5F7] min-h-screen pb-32 ml-64 transition-all duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] flex items-center gap-2">
            {/* Hier wird jetzt dein echter Name angezeigt */}
            Hallo, {userName}! <span className="text-2xl animate-wave">👋</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Hier ist dein persönlicher Überblick.</p>
        </div>
        <div className="flex items-center gap-4">
            <button className="bg-white px-5 py-2.5 rounded-full font-bold text-xs text-gray-600 shadow-sm border border-gray-100 hover:scale-105 transition flex items-center gap-2">
                <i className="ph-bold ph-pencil-simple"></i> Layout anpassen
            </button>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition relative">
                <i className="ph-bold ph-bell text-lg"></i>
                <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
        </div>
      </div>

      {/* ... Restlicher Code bleibt exakt gleich ... */}
      {/* (Kopiere hier einfach den restlichen Teil deines alten Dashboard-Codes rein, ab "TOP STATS GRID") */}
      
      {/* TOP STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-40 hover:shadow-md transition">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500"><i className="ph-fill ph-shield text-xl"></i></div>
            <div><span className="text-4xl font-black text-gray-900 block leading-none mb-1">1</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Betreute Teams</span></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-40 hover:shadow-md transition relative overflow-hidden">
            <div className="flex justify-between items-start"><div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500"><i className="ph-fill ph-users text-xl"></i></div><span className="bg-red-50 text-red-500 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">2 Verletzt</span></div>
            <div><span className="text-4xl font-black text-gray-900 block leading-none mb-1">{stats.players}</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spieler im Pool</span></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between h-40 hover:shadow-md transition">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-500"><i className="ph-fill ph-clipboard-text text-xl"></i></div>
            <div><span className="text-4xl font-black text-gray-900 block leading-none mb-1">{stats.trainings}</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Erstellte Pläne</span></div>
        </div>
        <Link href={stats.nextTraining ? `/training/${stats.nextTraining.id}` : '/training/neu'} className="block h-full group">
            <div className="bg-[#EF4444] p-6 rounded-[2rem] shadow-xl shadow-red-500/20 flex flex-col justify-between h-40 text-white relative overflow-hidden group-hover:scale-[1.02] transition duration-300">
                <i className="ph-fill ph-soccer-ball absolute -bottom-6 -right-6 text-9xl text-white opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-500"></i>
                <div className="flex justify-between items-start relative z-10"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><i className="ph-fill ph-clock text-xl"></i></div>{stats.nextTraining && (<span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">In 3 Std.</span>)}</div>
                <div className="relative z-10"><h3 className="text-xl font-bold truncate">{stats.nextTraining ? stats.nextTraining.title : "Kein Training"}</h3><p className="text-xs font-medium opacity-80 mt-1">{stats.nextTraining ? `${formatDate(stats.nextTraining.date)} • 19:00 Uhr` : "Jetzt Einheit planen ->"}</p></div>
            </div>
        </Link>
      </div>

      {/* MITTE: CHART & FAVORITEN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
            <h3 className="font-bold text-gray-900 mb-8 text-sm">Belastungssteuerung</h3>
            <div className="flex items-end gap-3 h-40 w-full mt-auto">
                <div className="flex-1 bg-red-100 rounded-t-xl h-[30%] relative group"><div className="absolute bottom-0 w-full bg-[#FFA5A5] h-full rounded-t-xl opacity-80 group-hover:opacity-100 transition"></div></div>
                <div className="flex-1 bg-red-100 rounded-t-xl h-[45%] relative group"><div className="absolute bottom-0 w-full bg-[#FFA5A5] h-full rounded-t-xl opacity-80 group-hover:opacity-100 transition"></div></div>
                <div className="flex-1 bg-red-100 rounded-t-xl h-[35%] relative group"><div className="absolute bottom-0 w-full bg-[#FF8B8B] h-full rounded-t-xl opacity-80 group-hover:opacity-100 transition"></div></div>
                <div className="flex-1 bg-red-100 rounded-t-xl h-[60%] relative group"><div className="absolute bottom-0 w-full bg-[#FF8B8B] h-full rounded-t-xl opacity-80 group-hover:opacity-100 transition"></div></div>
                <div className="flex-1 bg-red-100 rounded-t-xl h-[85%] relative group"><div className="absolute bottom-0 w-full bg-[#FF7171] h-full rounded-t-xl opacity-80 group-hover:opacity-100 transition"></div></div>
                <div className="flex-1 bg-red-100 rounded-t-xl h-[55%] relative group"><div className="absolute bottom-0 w-full bg-[#FFA5A5] h-full rounded-t-xl opacity-80 group-hover:opacity-100 transition"></div></div>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8"><h3 className="font-bold text-gray-900 text-sm">Favoriten</h3><i className="ph-fill ph-trophy text-yellow-400 text-xl"></i></div>
            <div className="space-y-6">
                <div className="flex items-center gap-4 group cursor-pointer"><span className="w-8 h-8 rounded-full bg-[#FEF9C3] text-[#CA8A04] text-xs font-black flex items-center justify-center group-hover:scale-110 transition">1</span><div className="flex-1"><p className="font-bold text-sm text-gray-900">Eckchen (5 gegen 2)</p><p className="text-[10px] text-gray-400 font-bold uppercase">42x genutzt</p></div></div>
                <div className="flex items-center gap-4 group cursor-pointer"><span className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 text-xs font-black flex items-center justify-center group-hover:scale-110 transition">2</span><div className="flex-1"><p className="font-bold text-sm text-gray-900">Torschuss Y</p><p className="text-[10px] text-gray-400 font-bold uppercase">28x genutzt</p></div></div>
                <div className="flex items-center gap-4 group cursor-pointer"><span className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 text-xs font-black flex items-center justify-center group-hover:scale-110 transition">3</span><div className="flex-1"><p className="font-bold text-sm text-gray-900">Rondo 5vs2</p><p className="text-[10px] text-gray-400 font-bold uppercase">15x genutzt</p></div></div>
            </div>
        </div>
      </div>

      {/* UNTEN: Zuletzt erstellte Übungen */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-6 text-sm">Zuletzt erstellte Übungen</h3>
        <div className="flex flex-wrap gap-3">
            {recentExercises.length === 0 ? (
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2">Noch keine Übungen erstellt.</p>
            ) : (
                recentExercises.map((ex) => (
                    <Link href={`/uebungen/${ex.id}`} key={ex.id} className="bg-gray-50 hover:bg-black hover:text-white transition px-6 py-3 rounded-2xl flex items-center gap-3 group">
                         <span className="text-lg group-hover:scale-110 transition">⚽</span>
                         <span className="font-bold text-xs uppercase tracking-wide">{ex.title}</span>
                    </Link>
                ))
            )}
            <Link href="/uebungen/neu" className="border-2 border-dashed border-gray-200 px-6 py-3 rounded-2xl flex items-center gap-2 text-gray-400 hover:border-black hover:text-black transition font-bold text-xs uppercase tracking-wide">
                <i className="ph-bold ph-plus"></i> Neu
            </Link>
        </div>
      </div>
    </div>
  );
}