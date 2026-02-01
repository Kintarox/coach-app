"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pdf } from '@react-pdf/renderer';
import { TrainingPlanPDF } from '@/components/TrainingPlanPDF';

export default function TrainingOverview() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase.from('plans').select('*');
    if (error) console.error("Fehler:", error);
    if (data) setPlans(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Möchtest du diesen Plan wirklich löschen?")) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (!error) setPlans(plans.filter(p => p.id !== id));
  };

  // --- NEU: PLAN DUPLIZIEREN ---
  const handleDuplicate = async (plan: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Wir fragen sicherheitshalber nach
    if (!confirm(`Möchtest du "${plan.title}" duplizieren?`)) return;

    // 1. Wir nehmen den alten Plan und entfernen ID und Erstellungsdatum
    // Damit Supabase eine neue ID vergibt
    const { id, created_at, ...planData } = plan;

    // 2. Wir setzen das Datum auf "Heute" und hängen "(Kopie)" an den Titel
    const newPlanData = {
        ...planData,
        title: `${planData.title} (Kopie)`,
        date: new Date().toISOString(), // Setzt es auf heute
    };

    // 3. In Datenbank speichern
    const { data, error } = await supabase
        .from('plans')
        .insert([newPlanData])
        .select()
        .single();

    if (error) {
        console.error("Fehler beim Duplizieren:", error);
        alert("Fehler beim Kopieren.");
    } else if (data) {
        // 4. State aktualisieren (damit der neue Plan sofort erscheint)
        setPlans([data, ...plans]);
        // Optional: Direkt zur Bearbeitung springen?
        // router.push(`/training/${data.id}/edit`);
    }
  };

  const countExercises = (content: any) => {
    if (!content) return 0;
    let count = 0;
    ['warmup', 'main1', 'main2', 'coolDown'].forEach(key => {
        if (content[key]) count += content[key].length;
    });
    return count;
  };

  // --- HELPER: BILD ZU PNG KONVERTIEREN ---
  const convertUrlToPngBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject('Canvas Context Failed');
                return;
            }
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = (error) => reject(error);
    });
  };

  // --- PDF VORBEREITUNG ---
  const preparePlanForPdf = async (originalPlan: any) => {
    const planCopy = JSON.parse(JSON.stringify(originalPlan));
    const phases = ['warmup', 'main1', 'main2', 'coolDown'];
    for (const phase of phases) {
        if (!planCopy.content[phase]) continue;
        for (let i = 0; i < planCopy.content[phase].length; i++) {
            const exercise = planCopy.content[phase][i];
            if (exercise.image_url) {
                try {
                    const pngBase64 = await convertUrlToPngBase64(exercise.image_url);
                    exercise.image_url = pngBase64;
                } catch (err) {
                    console.error(`Fehler bei Bild für ${exercise.title}:`, err);
                    exercise.image_url = null;
                }
            }
        }
    }
    return planCopy;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingPlans = plans.filter(p => new Date(p.date) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastPlans = plans.filter(p => new Date(p.date) < today).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ROW KOMPONENTE
  const PlanRow = ({ plan }: { plan: any }) => (
    <div 
        onClick={() => router.push(`/training/${plan.id}/edit`)}
        className="grid grid-cols-12 gap-4 items-center bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-pointer group mb-3"
    >
        <div className="col-span-3">
            <div className="font-black text-sm text-gray-900">{new Date(plan.date).toLocaleDateString('de-DE')}</div>
            <div className="text-xs font-bold text-gray-400 truncate">{plan.title}</div>
        </div>
        <div className="col-span-1 text-xs font-bold text-gray-500">{plan.time || '19:00'}</div>
        <div className="col-span-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black">IC</div>
            <span className="text-xs font-bold text-gray-600">Ich</span>
        </div>
        <div className="col-span-2 text-xs font-bold text-gray-400">{new Date(plan.created_at).toLocaleDateString('de-DE')}</div>
        <div className="col-span-2">
            <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200">
                {countExercises(plan.content)} Drills
            </span>
        </div>

        <div className="col-span-2 flex justify-end gap-2">
            
            {/* DUPLIZIEREN BUTTON (NEU) */}
            <button 
                onClick={(e) => handleDuplicate(plan, e)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                title="Plan duplizieren (Kopie erstellen)"
            >
                <i className="ph-bold ph-copy"></i>
            </button>

            {/* PDF BUTTON */}
            <button 
                onClick={async (e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'wait';
                    try {
                        const enrichedPlan = await preparePlanForPdf(plan);
                        const blob = await pdf(<TrainingPlanPDF plan={enrichedPlan} />).toBlob();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        const safeTitle = plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        link.download = `${safeTitle}_${plan.date}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (err) {
                        console.error('PDF Fehler:', err);
                        alert('Fehler beim Erstellen des PDFs.');
                    } finally {
                        document.body.style.cursor = 'default';
                    }
                }} 
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                title="Als PDF exportieren"
            >
                <i className="ph-bold ph-file-pdf"></i>
            </button>

            <Link href={`/training/${plan.id}/edit`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-black hover:text-white flex items-center justify-center transition-colors shadow-sm">
                <i className="ph-bold ph-pencil-simple"></i>
            </Link>
            <button onClick={(e) => handleDelete(plan.id, e)} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                <i className="ph-bold ph-trash"></i>
            </button>
        </div>
    </div>
  );

  const TableHeader = () => (
    <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
        <div className="col-span-3">Datum / Einheit</div>
        <div className="col-span-1">Zeit</div>
        <div className="col-span-2">Autor</div>
        <div className="col-span-2">Erstellt am</div>
        <div className="col-span-2">Umfang</div>
        <div className="col-span-2 text-right">Aktionen</div>
    </div>
  );

  if (loading) return <div className="p-20 text-center ml-64 font-black text-gray-300 uppercase animate-pulse">Lade Pläne...</div>;

  return (
    <div className="bg-[#F5F5F7] min-h-screen ml-64 p-10 pb-40">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-12">
            <div>
                <h1 className="text-4xl font-black text-[#1D1D1F] italic tracking-tight uppercase">Saisonplanung</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{plans.length} Einheiten Gesamt</p>
            </div>
            <Link href="/training/neu" className="bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition shadow-xl">
                + Neue Einheit
            </Link>
        </div>

        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Anstehende Einheiten</h2>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[9px] font-bold">{upcomingPlans.length}</span>
            </div>
            {upcomingPlans.length > 0 ? (<><TableHeader />{upcomingPlans.map(plan => <PlanRow key={plan.id} plan={plan} />)}</>) : (<div className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-100 text-center"><p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Keine anstehenden Trainings geplant</p></div>)}
        </div>

        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Vergangene Einheiten</h2>
            </div>
            {pastPlans.length > 0 ? (<><TableHeader />{pastPlans.map(plan => <PlanRow key={plan.id} plan={plan} />)}</>) : (<p className="text-gray-300 font-bold text-xs uppercase tracking-widest ml-5">Noch keine Historie vorhanden</p>)}
        </div>
      </div>
    </div>
  );
}