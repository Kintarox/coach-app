"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // WICHTIG: Link importieren

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Falsche E-Mail oder Passwort.");
      setLoading(false);
    } else {
      router.push('/'); // Weiterleitung zum Dashboard
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
            FC
          </div>
          <h1 className="text-2xl font-black text-gray-900">Coach App</h1>
          <p className="text-gray-400 font-medium text-sm mt-1">Bitte melde dich an.</p>
        </div>

        {/* Formular */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 pl-2">E-Mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition"
              placeholder="coach@verein.de"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 pl-2">Passwort</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-xl flex items-center gap-2">
              <i className="ph-bold ph-warning-circle text-lg"></i>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-full font-bold shadow-lg hover:scale-105 transition mt-4 disabled:bg-gray-400"
          >
            {loading ? "Wird angemeldet..." : "Einloggen"}
          </button>
        </form>

        {/* FOOTER MIT REGISTRIER-LINK */}
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Noch keinen Account?{' '}
              <Link href="/register" className="text-black font-bold cursor-pointer hover:underline">
                Registrieren
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}