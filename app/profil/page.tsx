"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // State für Profil-Daten inklusive Bilder & Kontakt
  const [profile, setProfile] = useState({
    id: '',
    first_name: '',
    last_name: '',
    club_name: '',
    role: '',
    email: '', // Email kommt aus Auth User
    phone: '',
    avatar_url: '',
    club_logo_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
          setProfile({
              ...data,
              email: user.email || '', // Email fix vom User holen
              id: user.id
          });
      }
    }
    setLoading(false);
  };

  // Hilfsfunktion: Bild hochladen
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'club-logos', field: 'avatar_url' | 'club_logo_url') => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Bitte ein Bild auswählen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Public URL holen
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // State updaten
      setProfile(prev => ({ ...prev, [field]: publicUrl }));
      setMessage('Bild hochgeladen! Speichern nicht vergessen.');

    } catch (error: any) {
      alert('Fehler beim Upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);

    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      club_name: profile.club_name,
      phone: profile.phone,
      role: profile.role || 'trainer',
      avatar_url: profile.avatar_url,
      club_logo_url: profile.club_logo_url,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error(error);
      setMessage('Fehler beim Speichern.');
    } else {
      setMessage('Profil erfolgreich aktualisiert! ✅');
      // Seite neu laden (optional), damit Sidebar das Bild übernimmt
      window.location.reload(); 
    }
    
    setLoading(false);
  };

  if (loading) return <div className="p-20 text-center ml-64 font-black text-gray-300 uppercase animate-pulse">Lade Profil...</div>;

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 p-10 pb-40">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-10">
            <div>
                <h1 className="text-4xl font-black text-[#1D1D1F] italic tracking-tight uppercase">Trainer Profil</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Verwalte deine Daten & Vereinsinfos</p>
            </div>
            
            <button 
                onClick={handleUpdate}
                disabled={loading || uploading}
                className="bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-xl disabled:opacity-50 flex items-center gap-2"
            >
                {loading ? 'Speichert...' : <>
                    <i className="ph-bold ph-floppy-disk text-lg"></i> Speichern
                </>}
            </button>
        </div>

        {message && (
            <div className="bg-green-100 text-green-700 p-4 rounded-2xl mb-8 font-bold text-center border border-green-200">
                {message}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LINKER BEREICH: PERSÖNLICHES */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
                    <div className="relative group">
                        {/* AVATAR BILD */}
                        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-100">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                    <i className="ph-fill ph-user text-3xl"></i>
                                </div>
                            )}
                        </div>
                        {/* UPLOAD BUTTON OVERLAY */}
                        <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white">
                            <i className="ph-bold ph-camera"></i>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => uploadImage(e, 'avatars', 'avatar_url')}
                                className="hidden" 
                            />
                        </label>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Persönliche Daten</h2>
                        <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {profile.role || 'TRAINER'}
                        </span>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-2">Vorname</label>
                            <input 
                                value={profile.first_name || ''} 
                                onChange={e => setProfile({...profile, first_name: e.target.value})}
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-2">Nachname</label>
                            <input 
                                value={profile.last_name || ''} 
                                onChange={e => setProfile({...profile, last_name: e.target.value})}
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-2">E-Mail (Login)</label>
                        <input 
                            value={profile.email || ''} 
                            disabled
                            className="w-full p-4 bg-gray-100 text-gray-500 border-none rounded-2xl font-bold cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-2">Telefon / Handy</label>
                        <input 
                            value={profile.phone || ''} 
                            onChange={e => setProfile({...profile, phone: e.target.value})}
                            placeholder="+49 123 456789"
                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* RECHTER BEREICH: VEREIN */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 z-0"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <i className="ph-bold ph-shield-check text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Vereins-Infos</h2>
                            <p className="text-xs text-gray-400">Erscheint auf deinen PDFs</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-2">Vereinsname</label>
                            <input 
                                value={profile.club_name || ''} 
                                onChange={e => setProfile({...profile, club_name: e.target.value})}
                                placeholder="z.B. FC Musterstadt"
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition outline-none"
                            />
                        </div>

                        {/* WAPPEN UPLOAD */}
                        <div>
                            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-2">Vereinswappen</label>
                            
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition relative group">
                                {profile.club_logo_url ? (
                                    <div className="relative w-24 h-24">
                                        <img src={profile.club_logo_url} alt="Wappen" className="w-full h-full object-contain" />
                                        <button 
                                            onClick={() => setProfile({...profile, club_logo_url: ''})}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition"
                                        >
                                            <i className="ph-bold ph-x text-xs"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                                            <i className="ph-duotone ph-image text-2xl text-gray-400"></i>
                                        </div>
                                        <p className="text-xs font-bold text-gray-400">Wappen hochladen</p>
                                    </>
                                )}
                                
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => uploadImage(e, 'club-logos', 'club_logo_url')}
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}