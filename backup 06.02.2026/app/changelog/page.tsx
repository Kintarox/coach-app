"use client";

import Link from "next/link";

export default function ChangelogPage() {
  const updates = [
    {
      version: "v1.0.2",
      date: "Heute",
      title: "UI Polishing & Footer",
      type: "improvement", // 'new', 'fix', 'improvement'
      changes: [
        "NEU: Globaler Footer mit Links zu Rechtstexten hinzugefügt.",
        "FIX: Footer-Darstellung auf Login-Seiten (Full-Width) korrigiert.",
        "DESIGN: Übungskatalog kompakter gestaltet (Tags & Spieleranzahl).",
        "LAYOUT: Trainingsphasen werden auf großen Bildschirmen jetzt 2-spaltig angezeigt."
      ]
    },
    {
      version: "v1.0.1",
      date: "Gestern",
      title: "Server & Taktik",
      type: "new",
      changes: [
        "INFRASTRUKTUR: Umzug auf Hetzner Cloud Server.",
        "NEU: Taktik-Board Update mit verschiedenen Spielfeld-Hintergründen.",
        "FEATURE: Drag & Drop Validierung (Max. 1 Übung pro Phase).",
        "DESIGN: Gestrichelte Eingabefelder für Titel und Zeit im Planer."
      ]
    },
    {
      version: "v1.0.0",
      date: "Initial Release",
      title: "Core Features",
      type: "major",
      changes: [
        "RELEASE: Trainingsplaner mit Drag & Drop System.",
        "DATABASE: Anbindung an Supabase (Übungen & Pläne).",
        "FEATURE: Filterung nach Kategorien und Suche.",
        "AUTH: Benutzer-Login System."
      ]
    }
  ];

  return (
    <div className="ml-64 p-10 min-h-screen text-[#1D1D1F]">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Changelog</h1>
            <p className="text-gray-400 font-medium">Was gibt es Neues in der Coach App?</p>
          </div>
          <Link href="/training" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition">
            Zurück zur App
          </Link>
        </div>

        {/* Timeline */}
        <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-[2px] before:bg-gray-100">
          
          {updates.map((update, idx) => (
            <div key={idx} className="relative pl-16">
              
              {/* Timeline Dot */}
              <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center border-[3px] bg-white z-10 ${update.type === 'major' ? 'border-black text-black' : update.type === 'new' ? 'border-emerald-500 text-emerald-500' : 'border-gray-200 text-gray-400'}`}>
                {update.type === 'major' ? <i className="ph-fill ph-star"></i> : <i className="ph-bold ph-git-commit"></i>}
              </div>

              {/* Content Card */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl font-black tracking-tight">{update.version}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${update.type === 'major' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {update.type === 'improvement' ? 'Optimierung' : update.title}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{update.date}</p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {update.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-sm font-medium text-gray-600 flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
                      <span className="leading-relaxed">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

        </div>

        <div className="mt-20 text-center">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Ende des Verlaufs</p>
        </div>

      </div>
    </div>
  );
}