"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Sidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  
  const [profile, setProfile] = useState({ first_name: '', last_name: '', role: '', club_name: '' });

  useEffect(() => {
    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (data) setProfile(data);
        }
    };
    loadProfile();
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isExactActive = (path: string) => {
      return pathname === path;
  };

  // --- HAUPTMENÜ ---
  const mainMenuItems = [
    { 
        name: 'Dashboard', 
        path: '/dashboard', 
        icon: 'ph-squares-four' 
    },
    { 
        name: 'Trainer', 
        path: '/coaches', 
        icon: 'ph-users' 
    },
    { 
        name: 'Übungen', 
        path: '/uebungen', 
        icon: 'ph-soccer-ball',
        subItems: [
            { name: 'Übung anlegen', path: '/uebungen/neu' }
        ]
    },
    { 
        name: 'Trainingspläne', 
        path: '/training', 
        icon: 'ph-calendar-check',
        subItems: [
            { name: 'Plan erstellen', path: '/training/neu' }
        ]
    },
  ];

  // --- ADMIN MENÜ ---
  const adminMenuItems = [
      { name: 'User Verwaltung', path: '/admin/users', icon: 'ph-user-gear' }
  ];

  // Helper zum Rendern von Links
  const renderLink = (item: any) => (
    <div key={item.path} className="mb-1">
        <Link 
        href={item.path}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
            isActive(item.path) && !item.subItems?.some((sub:any) => isExactActive(sub.path))
            ? 'bg-black text-white shadow-lg shadow-black/10' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
        }`}
        >
        <i className={`text-xl ${isActive(item.path) ? 'ph-fill' : 'ph-bold'} ${item.icon}`}></i>
        <span className="font-bold text-sm">{item.name}</span>
        {isActive(item.path) && !item.subItems && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
        </Link>

        {item.subItems && (
            <div className="ml-12 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                {item.subItems.map((sub: any) => (
                    <Link 
                    key={sub.path}
                    href={sub.path}
                    className={`block py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        isExactActive(sub.path)
                        ? 'text-black bg-gray-100'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    >
                        {sub.name}
                    </Link>
                ))}
            </div>
        )}
    </div>
  );

  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col z-50 overflow-y-auto">
      
      {/* LOGO */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 text-[#1D1D1F]">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white text-xl font-bold">FC</div>
          <span className="font-bold text-lg tracking-tight">Coach App</span>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-4">
        
        {/* SEKTION: MAIN MENU */}
        <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Menu</p>
        <div className="space-y-1">
            {mainMenuItems.map(renderLink)}
        </div>

        {/* SEKTION: ADMIN (Nur sichtbar für Admins) */}
        {profile.role === 'admin' && (
            <div className="mt-8">
                <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Admin</p>
                <div className="space-y-1">
                    {adminMenuItems.map(renderLink)}
                </div>
            </div>
        )}

      </nav>

      {/* USER INFO */}
      <div className="p-4 mt-auto">
        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 hover:border-black transition group">
          
          {/* Link zum Profil (Linker Bereich) */}
          <Link href="/profil" className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                {profile.first_name ? profile.first_name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-xs truncate text-gray-900 group-hover:text-black">
                    {profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'Profil bearbeiten'}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                    {profile.club_name || profile.role || 'Coach'}
                </p>
            </div>
          </Link>

          {/* Logout Button (Rechter Bereich via Form) */}
          <form 
            action="/auth/signout" 
            method="post" 
            onSubmit={() => setLoggingOut(true)}
          >
            <button 
                type="submit" 
                disabled={loggingOut} 
                className="text-gray-300 hover:text-red-500 transition px-2 flex items-center justify-center"
                title="Abmelden"
            >
                {loggingOut ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-sign-out"></i>}
            </button>
          </form>

        </div>
      </div>
    </aside>
  );
}