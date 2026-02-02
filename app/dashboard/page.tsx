"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Dashboard() {
  const [userName, setUserName] = useState('Coach');
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    coaches: 0,
    plans: 0,
    exercises: 0
  });

  // Listen State
  const [upcomingPlans, setUpcomingPlans] = useState<any[]>([]);
  const [recentExercises, setRecentExercises] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    
    // 1. User Namen holen
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
      if (profile?.first_name) setUserName(profile.first_name);
    }

    // 2. STATISTIKEN (Counts)
    const { count: coachesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: plansCount } = await supabase.from('plans').select('*', { count: 'exact', head: true });
    const { count: exCount } = await supabase.from('exercises').select('*', { count: 'exact', head: true });

    setStats({
        coaches: coachesCount || 0,
        plans: plansCount || 0,
        exercises: exCount || 0
    });

    // 3. NÄCHSTE 5 TRAININGSPLÄNE
    const today = new Date().toISOString().split('T')[0];
    const { data: nextPlans } = await supabase
        .from('plans')
        .select('*, profiles(first_name, last_name)') 
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5);

    if (nextPlans) setUpcomingPlans(nextPlans);

    // 4. ZULETZT ERSTELLTE ÜBUNGEN (Max 5)
    const { data: recentEx } = await supabase
        .from('exercises')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (recentEx) setRecentExercises(recentEx);
    
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  if (loading) return <div className="p-20 text-center ml-64 font-black text-gray-300 uppercase animate-pulse">Lade Dashboard...</div>;

  return (
    <div className="p-8 bg-[#F5F5F7] min-h-screen pb-32 ml-64 transition-all duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-[#1D1D1F] flex items-center gap-3 italic tracking-tight uppercase">
            {getGreeting()}, {userName}! <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Hier ist dein aktueller Statusbericht.</p>
        </div>
        <Link href="/training/neu" className="bg-black text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-xl flex items-center gap-2">
            <i className="ph-bold ph-plus"></i> Schnelles Training
        </Link>
      </div>

      {/* TOP GRID: STATS + TIPP (JETZT 4 SPALTEN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        {/* KARTE 1: TRAINER */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition group cursor-default">
            <div>
                <span className="text-4xl font-black text-gray-900 block leading-none mb-2 group-hover:scale-110 transition origin-left">{stats.coaches}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trainer</span>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-900 group-hover:bg-black group-hover:text-white transition">
                <i className="ph-bold ph-users text-xl"></i>
            </div>
        </div>

        {/* KARTE 2: PLÄNE */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition group cursor-default">
            <div>
                <span className="text-4xl font-black text-gray-900 block leading-none mb-2 group-hover:scale-110 transition origin-left">{stats.plans}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pläne</span>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <i className="ph-bold ph-clipboard-text text-xl"></i>
            </div>
        </div>

        {/* KARTE 3: ÜBUNGEN */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition group cursor-default">
            <div>
                <span className="text-4xl font-black text-gray-900 block leading-none mb-2 group-hover:scale-110 transition origin-left">{stats.exercises}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Übungen</span>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
                <i className="ph-bold ph-soccer-ball text-xl"></i>
            </div>
        </div>

        {/* NEU: COACH TIPP (HIER OBEN) */}
        <div className="bg-[#1D1D1F] p-6 rounded-[2rem] shadow-xl relative overflow-hidden group flex flex-col justify-center h-full">
             {/* Deko Hintergrund Icon */}
             <i className="ph-fill ph-lightbulb absolute -right-4 -bottom-4 text-8xl text-white opacity-10 rotate-12 group-hover:rotate-0 transition duration-500"></i>
             
             <div className="relative z-10">
                 <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <i className="ph-fill ph-sparkle text-yellow-400"></i> Coach Tipp
                 </h4>
                 <p className="text-xs text-gray-300 leading-relaxed font-medium">
                     Planung ist alles. Erstelle deine Einheiten mind. 2 Tage im Voraus.
                 </p>
             </div>
        </div>

      </div>

      {/* HAUPT GRID */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* LINKS: NÄCHSTE TRAININGS */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-900 text-lg italic tracking-tight uppercase">Der Fahrplan</h3>
                <Link href="/training" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition">Alle anzeigen</Link>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 min-h-[400px]">
                {upcomingPlans.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                        <i className="ph-duotone ph-calendar-slash text-4xl mb-2"></i>
                        <p className="font-bold text-sm">Keine anstehenden Termine</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* LIST HEADER */}
                        <div className="grid grid-cols-12 px-4 text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">
                            <div className="col-span-3">Datum</div>
                            <div className="col-span-5">Einheit</div>
                            <div className="col-span-3">Trainer</div>
                            <div className="col-span-1 text-right"></div>
                        </div>

                        {/* ROWS */}
                        {upcomingPlans.map((plan) => {
                             const author = plan.profiles;
                             const authObj = Array.isArray(author) ? author[0] : author;
                             const initials = authObj ? (authObj.first_name[0] + (authObj.last_name?.[0] || '')) : '?';

                             return (
                                <Link href={`/training/${plan.id}/edit`} key={plan.id} className="grid grid-cols-12 items-center bg-gray-50 p-4 rounded-2xl hover:bg-black hover:text-white transition group cursor-pointer border border-transparent hover:border-black hover:shadow-lg">
                                    <div className="col-span-3 font-bold text-xs">{new Date(plan.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} <span className="opacity-50 mx-1">|</span> {plan.time || '19:00'}</div>
                                    <div className="col-span-5 font-black text-sm truncate pr-4">{plan.title}</div>
                                    <div className="col-span-3 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center uppercase">{initials}</div>
                                        <span className="text-xs font-bold opacity-60 truncate">{authObj?.first_name || 'Unbekannt'}</span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <i className="ph-bold ph-caret-right text-gray-300 group-hover:text-white"></i>
                                    </div>
                                </Link>
                             )
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* RECHTS: NEUESTE ÜBUNGEN */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-900 text-lg italic tracking-tight uppercase">Frisch im Katalog</h3>
                <Link href="/uebungen" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition">Alle</Link>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                <div className="space-y-3">
                    {recentExercises.length === 0 ? (
                         <div className="text-center py-10 text-gray-300 text-[10px] font-black uppercase tracking-widest">Leer</div>
                    ) : (
                        recentExercises.map((ex) => (
                            <Link href={`/uebungen/${ex.id}`} key={ex.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition group border border-transparent hover:border-gray-200">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 group-hover:scale-105 transition">
                                     {ex.image_url ? <img src={ex.image_url} className="w-full h-full object-cover"/> : <span className="text-xl">⚽</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-xs text-gray-900 truncate mb-0.5 group-hover:text-black">{ex.title}</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{ex.category || 'Allgemein'}</p>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:border-black group-hover:text-black transition">
                                    <i className="ph-bold ph-arrow-right text-[10px]"></i>
                                </div>
                            </Link>
                        ))
                    )}
                    
                    <Link href="/uebungen/neu" className="mt-4 flex items-center justify-center gap-2 w-full p-4 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 hover:border-black hover:text-black transition font-bold text-xs uppercase tracking-widest group">
                        <i className="ph-bold ph-plus group-hover:scale-125 transition"></i> Übung anlegen
                    </Link>
                </div>
            </div>
            
        </div>

      </div>
    </div>
  );
}