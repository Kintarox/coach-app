"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { createNewUser } from '@/app/actions/createUser';
import { deleteUserAction } from '@/app/actions/deleteUser';
import { toggleUserStatusAction } from '@/app/actions/toggleUserStatus';

// Helper für "vor X Minuten" Anzeige
function timeAgo(dateString: string | null) {
  if (!dateString) return 'Nie';
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

export default function AdminUsersPage() {
  const router = useRouter();
  
  // Daten State
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState('');
  
  // Filter & Suche State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [tempRoles, setTempRoles] = useState<{[key: string]: string}>({});

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    
    setCurrentAdminId(user.id);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return router.push('/');
    
    await fetchUsers();
    setLoading(false);
  };

  const fetchUsers = async () => {
    // Sortiert nach user_number absteigend (Höchste Nummer zuerst)
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('user_number', { ascending: false }); 
    if (data) setUsers(data);
  };

  // --- ACTIONS ---
  
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    const res = await createNewUser(formData);
    if (res.success) {
        alert("User erfolgreich angelegt! 🎉");
        setShowCreateModal(false);
        fetchUsers();
    } else {
        alert("Fehler: " + res.error);
    }
    setIsCreating(false);
  };

const toggleBlockUser = async (user: any) => {
    if (user.id === currentAdminId) return alert("Du kannst dich nicht selbst sperren!");
    
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    const actionText = newStatus === 'banned' ? "sperren" : "entsperren";

    if (!confirm(`User wirklich ${actionText}?`)) return;
    
    // 1. Optimistic Update (Sofort anzeigen)
    const previousUsers = [...users];
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    
    // 2. Server Action aufrufen
    const result = await toggleUserStatusAction(user.id, newStatus);

    if (!result.success) {
        alert("Fehler beim Ändern des Status: " + result.error);
        // Rollback bei Fehler (Alten Zustand wiederherstellen)
        setUsers(previousUsers);
    }
  };

  const deleteUser = async (id: string) => {
      if (id === currentAdminId) return alert("Du kannst dich nicht selbst löschen!");
      if(!confirm("ACHTUNG: User endgültig löschen?")) return;
      
      const previousUsers = [...users];
      setUsers(users.filter(u => u.id !== id)); 
      
      const result = await deleteUserAction(id);
      if (!result.success) {
          alert("Fehler beim Löschen: " + result.error);
          setUsers(previousUsers);
      }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
      setTempRoles(prev => ({ ...prev, [userId]: newRole }));
  };

  const cancelRoleChange = (userId: string) => {
      const newTemp = { ...tempRoles };
      delete newTemp[userId];
      setTempRoles(newTemp);
  };

  const saveRole = async (userId: string) => {
      if (userId === currentAdminId) return alert("Du kannst dich nicht selbst degradieren!");
      const newRole = tempRoles[userId];
      if (!newRole) return;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      cancelRoleChange(userId);

      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) {
          alert("Fehler beim Speichern!");
          fetchUsers();
      }
  };

  // --- MODAL FUNCTIONS ---

  const openEditModal = (user: any) => {
      setEditingUser(user);
      setEditForm({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: user.phone || ''
      });
  };

  const sendPasswordReset = async () => {
      if (!editingUser?.email) return alert("User hat keine E-Mail Adresse.");
      if (!confirm(`Passwort-Reset E-Mail an ${editingUser.email} senden?`)) return;

      const { error } = await supabase.auth.resetPasswordForEmail(editingUser.email, {
          redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) alert("Fehler: " + error.message);
      else alert("E-Mail wurde versendet! 📧");
  };

  const saveUserChanges = async () => {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            phone: editForm.phone
        })
        .eq('id', editingUser.id);

      if (error) {
          alert("Fehler beim Speichern: " + error.message);
      } else {
          setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
          setEditingUser(null);
      }
      setIsSaving(false);
  };

  // --- FILTER LOGIK ---
  const filteredUsers = users.filter(u => {
    // 1. Suche: Name, E-Mail oder USER NUMMER
    const searchString = searchTerm.toLowerCase();
    const userNumString = u.user_number ? u.user_number.toString() : ''; // Nummer in Text wandeln
    
    const matchesSearch = 
        (u.first_name + ' ' + u.last_name + ' ' + (u.email || '')).toLowerCase().includes(searchString) ||
        userNumString.includes(searchString);

    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'banned' ? u.status === 'banned' : u.status !== 'banned');

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) return <div className="p-20 text-center ml-64 font-bold text-gray-400">Lade User...</div>;

  return (
    <div className="p-8 bg-[#F5F5F7] min-h-screen ml-64 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-4xl font-black text-[#1D1D1F] italic uppercase tracking-tight">Benutzerverwaltung</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{filteredUsers.length} User angezeigt</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-black text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-xl flex items-center gap-2">
                <i className="ph-bold ph-plus"></i> User anlegen
            </button>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 mb-8 flex flex-wrap items-center gap-4">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl">
                <i className="ph-bold ph-magnifying-glass text-lg text-gray-400"></i>
                <input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Suche nach Name, E-Mail oder Nummer (z.B. 42)..." 
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold outline-none"
                />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-black uppercase border-none focus:ring-2 focus:ring-black cursor-pointer">
                <option value="ALL">Alle Rollen</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admins</option>
                <option value="co-trainer">Co-Trainer</option>
                <option value="player">Spieler</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-50 px-4 py-2 rounded-xl text-xs font-black uppercase border-none focus:ring-2 focus:ring-black cursor-pointer">
                <option value="ALL">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="banned">Gesperrt</option>
            </select>
        </div>

        {/* TABELLE */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        {/* NEU: Nummer statt langer ID */}
                        <th className="p-5 text-[9px] font-black uppercase text-gray-400 tracking-widest w-16 text-center">Nr.</th>
                        <th className="p-5 text-[9px] font-black uppercase text-gray-400 tracking-widest w-1/3">User / Login</th>
                        <th className="p-5 text-[9px] font-black uppercase text-gray-400 tracking-widest w-1/4">Kontakt</th>
                        <th className="p-5 text-[9px] font-black uppercase text-gray-400 tracking-widest w-1/6">Rolle</th>
                        <th className="p-5 text-[9px] font-black uppercase text-gray-400 tracking-widest text-right">Aktionen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(u => {
                        const isMe = u.id === currentAdminId;
                        const hasPendingChange = tempRoles[u.id] && tempRoles[u.id] !== u.role;
                        
                        return (
                        <tr key={u.id} className={`group transition ${u.status === 'banned' ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                            
                            {/* NUMMER ANZEIGE */}
                            <td className="p-5 text-center">
                                <span className="bg-gray-100 text-gray-500 font-black text-[10px] px-2 py-1 rounded-lg">
                                    #{u.user_number}
                                </span>
                            </td>

                            {/* USER INFO */}
                            <td className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100 flex-shrink-0">
                                        {u.avatar_url ? (
                                            <img src={u.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">{u.first_name?.[0]}</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                            {u.first_name} {u.last_name}
                                            {isMe && <span className="bg-blue-100 text-blue-600 text-[9px] px-2 py-0.5 rounded uppercase font-black">Ich</span>}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.last_sign_in_at ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                Online: {timeAgo(u.last_sign_in_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* KONTAKT */}
                            <td className="p-5">
                                <div className="text-xs font-bold text-gray-500 mb-1">{u.email || 'Keine E-Mail'}</div>
                                {u.phone && <div className="text-[10px] font-bold text-gray-400">{u.phone}</div>}
                            </td>
                            
                            {/* ROLLE */}
                            <td className="p-5">
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={tempRoles[u.id] || u.role || 'trainer'} 
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        disabled={isMe} 
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-none focus:ring-2 focus:ring-black cursor-pointer shadow-sm w-32
                                            ${isMe ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-900'}
                                            ${hasPendingChange ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                                        `}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="trainer">Trainer</option>
                                        <option value="co-trainer">Co-Trainer</option>
                                        <option value="player">Spieler</option>
                                    </select>
                                    {hasPendingChange && !isMe && (
                                        <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                                            <button onClick={() => saveRole(u.id)} className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition shadow-md"><i className="ph-bold ph-check"></i></button>
                                            <button onClick={() => cancelRoleChange(u.id)} className="w-8 h-8 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-300 transition shadow-sm"><i className="ph-bold ph-x"></i></button>
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* AKTIONEN */}
                            <td className="p-5 text-right flex justify-end gap-2 items-center h-full">
                                {!isMe && (
                                    <>
                                        <button onClick={() => openEditModal(u)} className="w-9 h-9 rounded-xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-black hover:text-white transition shadow-sm" title="Bearbeiten">
                                            <i className="ph-bold ph-pencil-simple"></i>
                                        </button>
                                        <button onClick={() => toggleBlockUser(u)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm border ${u.status === 'banned' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`} title="Sperren/Entsperren">
                                            <i className={`ph-bold ${u.status === 'banned' ? 'ph-check' : 'ph-prohibit'}`}></i>
                                        </button>
                                        <button onClick={() => deleteUser(u.id)} className="w-9 h-9 rounded-xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition shadow-sm" title="Löschen">
                                            <i className="ph-bold ph-trash"></i>
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>

        {/* MODAL 1: CREATE USER */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                    <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"><i className="ph-bold ph-x"></i></button>
                    <h2 className="text-2xl font-black text-[#1D1D1F] mb-6">Neuen User anlegen</h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input name="firstName" required className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none" placeholder="Vorname" />
                            <input name="lastName" required className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none" placeholder="Nachname" />
                        </div>
                        <input name="email" type="email" required className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none" placeholder="E-Mail" />
                        <input name="password" type="password" required minLength={6} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none" placeholder="Passwort" />
                        <select name="role" className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none">
                            <option value="trainer">Trainer</option>
                            <option value="co-trainer">Co-Trainer</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" disabled={isCreating} className="w-full bg-black text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition shadow-lg mt-4 disabled:opacity-50">User anlegen</button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL 2: EDIT USER */}
        {editingUser && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"><i className="ph-bold ph-x"></i></button>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-lg">
                             <img src={editingUser.avatar_url || 'https://placehold.co/100'} className="w-full h-full object-cover"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1D1D1F] leading-none mb-1">{editingUser.first_name} {editingUser.last_name}</h2>
                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2">#{editingUser.user_number}</span>
                            <span className="text-xs font-bold text-gray-400">{editingUser.email}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                             <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Daten bearbeiten</h3>
                             <div className="grid grid-cols-2 gap-4 mb-3">
                                <input value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-black" placeholder="Vorname" />
                                <input value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-black" placeholder="Nachname" />
                             </div>
                             <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-black" placeholder="Telefonnummer" />
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
                            <div>
                                <div className="text-xs font-black text-red-500 uppercase mb-0.5">Sicherheit</div>
                                <div className="text-[10px] text-red-400 font-bold">Passwort vergessen?</div>
                            </div>
                            <button onClick={sendPasswordReset} className="bg-white text-red-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition">Reset Mail senden</button>
                        </div>
                        <button onClick={saveUserChanges} disabled={isSaving} className="w-full bg-black text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition shadow-lg disabled:opacity-50">{isSaving ? 'Speichere...' : 'Änderungen speichern'}</button>
                    </div>
                </div>
             </div>
        )}

      </div>
    </div>
  );
}