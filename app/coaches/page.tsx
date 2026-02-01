"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Helper für "Zuletzt online"
function timeAgo(dateString: string | null) {
  if (!dateString) return 'Lange her';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " Jahre";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " Monate";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " Tage";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " Std.";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " Min.";
  return "Gerade eben";
}

export default function CoachesPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCoaches();
  }, []);

const fetchCoaches = async () => {
    // ÄNDERUNG: 'plans(count)' statt 'training_plans(count)'
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        plans(count), 
        exercises(count)
      `)
      .order('last_sign_in_at', { ascending: false });

    if (error) {
        console.error("Fehler Details:", JSON.stringify(error, null, 2));
    } else {
        setCoaches(data || []);
    }
    setLoading(false);
  };

  // Filter Logik
  const filteredCoaches = coaches.filter(c => {
    const search = searchTerm.toLowerCase();
    const fullName = (c.first_name + ' ' + c.last_name).toLowerCase();
    const club = (c.club_name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    
    return fullName.includes(search) || club.includes(search) || email.includes(search);
  });

  if (loading) return <div className="p-20 text-center ml-64 font-bold text-gray-400">Lade Trainer...</div>;

  return (
    <div className="p-8 bg-[#F5F5F7] min-h-screen ml-64 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
            <h1 className="text-3xl font-black text-[#1D1D1F] italic uppercase tracking-tight">Trainer Community</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{filteredCoaches.length} aktive Coaches</p>
        </div>

        {/* SUCHE */}
        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
            <i className="ph-bold ph-magnifying-glass text-xl text-gray-400 ml-2"></i>
            <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Suche nach Name, Verein oder E-Mail..." 
                className="w-full border-none focus:ring-0 text-sm font-bold outline-none"
            />
        </div>

        {/* LISTE / GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCoaches.map((coach) => (
                <div key={coach.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    
                    {/* HINTERGRUND DEKO (Optional) */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[4rem] -mr-4 -mt-4 z-0"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        
                        {/* AVATAR */}
                        <div className="relative mb-4">
                            <div className="w-20 h-20 rounded-full bg-gray-200 p-1 border-2 border-white shadow-lg overflow-hidden">
                                {coach.avatar_url ? (
                                    <img src={coach.avatar_url} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-bold text-xl">
                                        {coach.first_name?.[0]}
                                    </div>
                                )}
                            </div>
                            {/* ONLINE STATUS PUNKT */}
                            <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${coach.last_sign_in_at && (new Date().getTime() - new Date(coach.last_sign_in_at).getTime() < 3600000) ? 'bg-green-500' : 'bg-gray-300'}`} title="Online Status"></div>
                        </div>

                        {/* NAME & ROLLE */}
                        <h2 className="text-lg font-black text-gray-900 mb-1">
                            {coach.first_name} {coach.last_name}
                        </h2>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                            {coach.role || 'Trainer'}
                        </div>

                        {/* VEREIN */}
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl mb-6 w-full justify-center">
                             {coach.club_logo_url ? (
                                 <img src={coach.club_logo_url} className="w-6 h-6 object-contain" />
                             ) : (
                                 <i className="ph-bold ph-shield text-gray-300 text-lg"></i>
                             )}
                             <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">
                                 {coach.club_name || 'Kein Verein'}
                             </span>
                        </div>

                        {/* STATS */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex flex-col items-center">
                                <span className="text-xl font-black text-blue-600">{coach.plans?.[0]?.count || 0}</span>
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Pläne</span>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex flex-col items-center">
                                <span className="text-xl font-black text-orange-600">{coach.exercises?.[0]?.count || 0}</span>
                                <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Übungen</span>
                            </div>
                        </div>

                        {/* KONTAKT & FOOTER */}
                        <div className="mt-6 pt-4 border-t border-gray-50 w-full flex justify-between items-center text-[10px] font-bold text-gray-400">
                             <div className="flex items-center gap-1 truncate max-w-[120px]" title={coach.email}>
                                 <i className="ph-bold ph-envelope-simple"></i>
                                 <span className="truncate">{coach.email}</span>
                             </div>
                             <div>
                                 Online: {timeAgo(coach.last_sign_in_at)}
                             </div>
                        </div>

                    </div>
                </div>
            ))}

            {filteredCoaches.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-400 font-bold">
                    Keine Trainer gefunden.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}