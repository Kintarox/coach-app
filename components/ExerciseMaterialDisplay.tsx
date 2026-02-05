"use client";

import { FaClock, FaUsers, FaLayerGroup } from 'react-icons/fa';

// Config für Icons
const materialIcons: Record<string, string> = {
    balls: '⚽',
    cones: '📍',
    bibs: '🎽',
    goals: '🥅',
    poles: '🦯',
    hurdles: '🚧',
    ladder: '🪜',
    dummies: '👤',
    rings: '⭕',
};

interface Props {
    materials: any; // Das neue JSON Array
    material: any;  // Der alte String (Fallback)
}

export default function ExerciseMaterialDisplay({ materials, material }: Props) {
    
    // --- INTELLIGENTE LOGIK ---
    const parsedList: { label: string; amount: number; icon: string }[] = [];
    
    // 1. Quelle bestimmen (Neu vor Alt)
    let sourceData = materials;
    if (!sourceData || (Array.isArray(sourceData) && sourceData.length === 0)) {
        sourceData = material;
    }

    // 2. Daten verarbeiten
    if (sourceData) {
        // FALL A: Neues JSON Array
        if (Array.isArray(sourceData)) {
            sourceData.forEach((m: any) => {
                if (m.amount > 0) {
                    parsedList.push({
                        label: m.label,
                        amount: m.amount,
                        icon: materialIcons[m.id] || '📦' 
                    });
                }
            });
        } 
        // FALL B: Alter String ("2 Bälle, ...")
        else if (typeof sourceData === 'string') {
            try {
                // Ist es vielleicht JSON als String?
                if (sourceData.startsWith('[')) {
                     const json = JSON.parse(sourceData);
                     json.forEach((m: any) => {
                        if (m.amount > 0) parsedList.push({ label: m.label, amount: m.amount, icon: materialIcons[m.id] || '📦' });
                     });
                } else {
                    // Klassischer String Split
                    sourceData.split(',').forEach((item: string) => {
                        const parts = item.trim().split(' ');
                        const amount = parseInt(parts[0]) || 0;
                        const label = parts.slice(1).join(' ');
                        
                        let icon = '📦';
                        const l = label.toLowerCase();
                        if (l.includes('ball')) icon = '⚽';
                        if (l.includes('hütchen')) icon = '📍';
                        if (l.includes('tor')) icon = '🥅';
                        if (l.includes('laibchen')) icon = '🎽';
                        
                        if (amount > 0) parsedList.push({ label, amount, icon });
                    });
                }
            } catch (e) { console.warn("Material Parse Error", e); }
        }
    }

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-xs font-black uppercase text-gray-300 tracking-widest mb-6 text-center">Equipment</h3>
            
            {parsedList.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    {parsedList.map((item, index) => (
                        <div key={index} className="flex flex-col items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-2xl mb-1">{item.icon}</span>
                            <span className="text-lg font-black text-gray-800">{item.amount}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center truncate w-full">{item.label}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 flex flex-col items-center gap-2">
                    <span className="text-3xl opacity-20">📦</span>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Kein Material</span>
                </div>
            )}
        </div>
    );
}