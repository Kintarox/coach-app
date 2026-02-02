"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrainingOverviewPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (!error) setPlans(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // --- FUNKTIONEN ---
  const duplicatePlan = async (plan: any) => {
    const { id, created_at, ...rest } = plan;
    const { data, error } = await supabase.from('plans').insert([{
      ...rest,
      title: `${plan.title} Kopie`,
      scheduled_at: new Date().toISOString()
    }]).select();
    
    if (!error && data) {
      setPlans([data[0], ...plans]);
      router.push(`/training/${data[0].id}/edit`);
    }
  };

  const deletePlan = async (id: string) => {
    if (confirm("Einheit wirklich löschen?")) {
      await supabase.from('plans').delete().eq('id', id);
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  const now = new Date();
  const upcomingPlans = plans.filter(p => new Date(p.scheduled_at) >= now);
  const pastPlans = plans.filter(p => new Date(p.scheduled_at) < now);

  if (loading) return <div className="p-20 text-center ml-64 font-black text-gray-300 animate-pulse">Lade Saisonplanung...</div>;

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 p-10 font-sans text-[#1D1D1F]">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Saisonplanung</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {plans.length} Einheiten Gesamt
          </p>
        </div>
        <Link href="/training/neu" className="bg-black text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
          + Neue Einheit
        </Link>
      </div>

      {/* SEKTION: ANSTEHEND */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">Anstehende Einheiten</h2>
          <span className="bg-gray-200 text-gray-500 text-[9px] px-2 py-0.5 rounded-md font-bold">{upcomingPlans.length}</span>
        </div>
        <PlanTable plans={upcomingPlans} onDuplicate={duplicatePlan} onDelete={deletePlan} />
      </div>

      {/* SEKTION: VERGANGEN */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Vergangene Einheiten</h2>
        </div>
        <PlanTable plans={pastPlans} onDuplicate={duplicatePlan} onDelete={deletePlan} isPast />
      </div>
    </div>
  );
}

function PlanTable({ plans, onDuplicate, onDelete, isPast }: any) {
  return (
    <div className="w-full space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_1.2fr] px-8 text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
        <div>Datum / Einheit</div>
        <div className="text-center">Umfang</div>
        <div className="text-center">Erstellt am</div>
        <div className="text-center">Zeit</div>
        <div className="text-left">Trainer</div>
        <div className="text-right px-4">Aktionen</div>
      </div>

      {/* Table Rows */}
      {plans.map((plan: any) => (
        <div key={plan.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-white hover:border-gray-200 transition-all grid grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_1.2fr] items-center">
          
          {/* Datum & Titel */}
          <div>
            <div className="font-black text-sm">{new Date(plan.scheduled_at).toLocaleDateString('de-DE')}</div>
            <div className="text-[10px] font-bold text-gray-400 truncate">{plan.title}</div>
          </div>

          {/* Umfang */}
          <div className="flex justify-center">
            <span className="bg-gray-50 border border-gray-100 text-[9px] font-black px-3 py-1 rounded-lg uppercase text-gray-500">
              {Object.values(plan.content || {}).flat().length} Übungen
            </span>
          </div>

          {/* Erstellt am */}
          <div className="text-[11px] font-bold text-gray-400 text-center">
            {new Date(plan.created_at).toLocaleDateString('de-DE')}
          </div>

          {/* Zeit */}
          <div className="text-[11px] font-black text-gray-900 text-center">
            {new Date(plan.scheduled_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Trainer */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0">KS</div>
            <div className="text-[11px] font-black truncate">Kevin Schneider</div>
          </div>

          {/* Aktionen */}
          <div className="flex justify-end gap-2 px-2">
            <ActionButton icon="ph-copy" onClick={() => onDuplicate(plan)} />
            <ActionButton icon="ph-file-pdf" onClick={() => window.open(`/training/${plan.id}?print=true`)} />
            <Link href={`/training/${plan.id}/edit`}>
              <ActionButton icon="ph-pencil-simple" />
            </Link>
            <ActionButton icon="ph-trash" onClick={() => onDelete(plan.id)} danger />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionButton({ icon, onClick, danger }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-gray-50 text-gray-600'}`}
    >
      <i className={`ph-bold ${icon} text-base`}></i>
    </button>
  );
}