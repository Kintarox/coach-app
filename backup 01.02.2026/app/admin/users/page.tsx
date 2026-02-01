"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return router.push('/');
    
    fetchUsers();
  };

  const fetchUsers = async () => {
    // Hole User UND deren Team-Mitgliedschaften
    const { data } = await supabase
        .from('profiles')
        .select(`*, team_members(teams(name))`) // Nested Select für Team-Namen
        .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const toggleBlockUser = async (user: any) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    if (!confirm(newStatus === 'banned' ? "User wirklich sperren?" : "User entsperren?")) return;

    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (!error) {
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    }
  };

  const deleteUser = async (id: string) => {
      if(!confirm("User endgültig löschen? Er kann sich dann nicht mehr einloggen.")) return;
      await supabase.from('profiles').delete().eq('id', id);
      setUsers(users.filter(u => u.id !== id));
  };

  const filteredUsers = users.filter(u => 
    (u.first_name + ' ' + u.last_name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center ml-64 font-bold text-gray-400">Lade User...</div>;

  return (
    <div className="p-8 bg-[#F5F5F7] min-h-screen ml-64 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
            <div>
                <h1 className="text-3xl font-black text-[#1D1D1F]">User Verwaltung</h1>
                <p className="text-gray-500">Bearbeiten, Sperren und Löschen.</p>
            </div>
            {/* Hinweis zum Anlegen */}
            <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-2xl text-xs font-bold border border-blue-100 max-w-sm">
                ℹ️ Um einen neuen User anzulegen: Logge dich aus und nutze "Registrieren", oder öffne ein Inkognito-Fenster.
            </div>
        </div>

        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
            <i className="ph-bold ph-magnifying-glass text-xl text-gray-400 ml-2"></i>
            <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Namen suchen..." 
                className="w-full border-none focus:ring-0 text-sm font-bold"
            />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Name / Status</th>
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Teams</th>
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Rolle</th>
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Aktionen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(u => (
                        <tr key={u.id} className={u.status === 'banned' ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}>
                            <td className="p-6">
                                <div className="font-bold text-gray-900">{u.first_name} {u.last_name}</div>
                                {u.status === 'banned' && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">GESPERRT</span>}
                            </td>
                            <td className="p-6">
                                <div className="flex flex-wrap gap-1">
                                    {u.team_members && u.team_members.length > 0 ? (
                                        u.team_members.map((tm: any, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600">
                                                {tm.teams?.name}
                                            </span>
                                        ))
                                    ) : <span className="text-gray-300 text-xs italic">-</span>}
                                </div>
                            </td>
                            <td className="p-6">
                                <span className="bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{u.role}</span>
                            </td>
                            <td className="p-6 text-right flex justify-end gap-2">
                                {/* SPERREN BUTTON */}
                                <button 
                                    onClick={() => toggleBlockUser(u)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${u.status === 'banned' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`}
                                    title={u.status === 'banned' ? "Entsperren" : "Sperren"}
                                >
                                    <i className={`ph-bold ${u.status === 'banned' ? 'ph-check' : 'ph-prohibit'} text-lg`}></i>
                                </button>
                                
                                {/* LÖSCHEN BUTTON */}
                                <button onClick={() => deleteUser(u.id)} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition">
                                    <i className="ph-bold ph-trash text-lg"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}