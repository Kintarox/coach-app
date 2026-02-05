"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Canvas, PencilBrush, FabricImage, Line, Circle, Rect, Triangle, Group, Point, Shadow, Path, ActiveSelection } from 'fabric';

// UI Icons
import { 
    FaPencilAlt, FaMinus, FaArrowRight, FaRegCircle, FaRegSquare, 
    FaUndo, FaTrash, FaCheck, FaMousePointer,
    FaTshirt, FaUser, FaGripLines, FaEllipsisH, FaMap
} from 'react-icons/fa';

// =====================================================================
// 🛠 BILDER KONFIGURATION (ICONS)
// =====================================================================
const CUSTOM_ICONS = {
    ball:       '/img/soccer-ball.png', 
    cone:       '/img/pylon.png',     
    disc:       '/img/scheibe.png',
    goal:       '/img/goal.png',      
    ladder:     '/img/ladder.png',    
    pole:       '/img/slalom.png',    
    flag:       '/img/flag.png',      
    coach:      '/img/coach.png',     
    hurdle:     '/img/hurdle.png',
    ring:       '/img/ring.png',
    dummy:      '/img/equipment.png',
    player:     '/img/player.png',
};

// =====================================================================
// 🏟️ SPIELFELD HINTERGRÜNDE
// feld1.png ist Standard (Index 0)
// =====================================================================
const PITCH_OPTIONS = [
    { name: 'Standard (Feld 1)', url: '/img/feld1.png' },
    { name: 'Feld 2',            url: '/img/feld2.png' },
    { name: 'Feld 3',            url: '/img/feld3.png' },
    { name: 'Halle',             url: '/img/halle.png' }
];

// Vektoren
const PATHS = {
    JERSEY: "M37.5,18.5l-9.8-6.2l-3-7.5c-0.6-1.5-2.2-2.3-3.8-1.9l-8.5,2.1l-8.5-2.1c-1.6-0.4-3.2,0.4-3.8,1.9l-3,7.5L-12.5,18.5 c-1.2,0.8-1.6,2.4-0.8,3.6l3.5,5.2c0.6,0.9,1.6,1.4,2.6,1.4c0.4,0,0.8-0.1,1.2-0.3l5.5-3.1v22.4c0,1.7,1.3,3,3,3h20c1.7,0,3-1.3,3-3 V25.3l5.5,3.1c0.4,0.2,0.8,0.3,1.2,0.3c1,0,2-0.5,2.6-1.4l3.5-5.2C39.1,20.9,38.7,19.3,37.5,18.5z",
};

const WIDTH = 1000;
const HEIGHT = 640;

type ToolType = 'select' | 'pencil' | 'line' | 'arrow' | 'circle' | 'rect';

interface FootballBoardProps {
  onSave: (file: File, jsonData: string) => void; 
  onClose: () => void;
  initialData?: string; 
}

export default function FootballBoard({ onSave, onClose, initialData }: FootballBoardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
    
    // STATES
    const [color, setColor] = useState('#1d1d1d');
    const [activeTool, setActiveTool] = useState<ToolType>('pencil');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [isDashed, setIsDashed] = useState(false);
    const [pitchIndex, setPitchIndex] = useState(0); 
    const [saving, setSaving] = useState(false);
    
    // Undo
    const historyRef = useRef<string[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const isLockedRef = useRef(false);
    const clipboardRef = useRef<any>(null);

    // Refs
    const colorRef = useRef(color);
    const activeToolRef = useRef(activeTool);
    const strokeWidthRef = useRef(strokeWidth);
    const isDashedRef = useRef(isDashed);

    // Drawing Refs
    const isDrawingRef = useRef(false);
    const startPointRef = useRef<Point | null>(null);
    const activeShapeRef = useRef<fabric.Object | null>(null);

    // Sync Refs
    useEffect(() => {
        colorRef.current = color;
        activeToolRef.current = activeTool;
        strokeWidthRef.current = strokeWidth;
        isDashedRef.current = isDashed;
    }, [color, activeTool, strokeWidth, isDashed]);

    // --- HELPER: HISTORY ---
    const saveHistory = useCallback(() => {
        if (!fabricCanvas || isLockedRef.current || fabricCanvas.disposed) return;
        try {
            const json = JSON.stringify(fabricCanvas.toJSON());
            historyRef.current.push(json);
            if (historyRef.current.length > 50) historyRef.current.shift();
            setCanUndo(historyRef.current.length > 1);
        } catch (e) { console.error(e); }
    }, [fabricCanvas]);

    // --- INIT ---
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: WIDTH,
            height: HEIGHT,
            selection: true,
            preserveObjectStacking: true, 
        });

        const brush = new PencilBrush(canvas);
        canvas.freeDrawingBrush = brush;

        setFabricCanvas(canvas);

        // Hintergrund initial laden (Standard = feld1.png)
        const loadInitialBackground = () => {
            const bgUrl = PITCH_OPTIONS[0].url; 
            FabricImage.fromURL(bgUrl).then((img) => {
                if (!canvas || canvas.disposed) return;
                const scaleX = WIDTH / img.width!;
                const scaleY = HEIGHT / img.height!;
                img.set({ scaleX, scaleY, originX: 'left', originY: 'top', selectable: false, evented: false, excludeFromExport: true });
                canvas.backgroundImage = img;
                canvas.requestRenderAll();
                
                const json = JSON.stringify(canvas.toJSON());
                historyRef.current.push(json);
            }).catch(err => console.error("Fehler beim Laden von feld1.png:", err));
        };

        if (initialData) {
            isLockedRef.current = true;
            canvas.loadFromJSON(JSON.parse(initialData), () => {
                if (canvas.disposed) return;
                if (!canvas.backgroundImage) loadInitialBackground();
                isLockedRef.current = false;
                const json = JSON.stringify(canvas.toJSON());
                historyRef.current.push(json);
            });
        } else {
            loadInitialBackground();
        }

        const onObjectChange = () => { if (!isLockedRef.current) saveHistory(); };
        
        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);
        canvas.on('object:added', onObjectChange);
        canvas.on('object:modified', onObjectChange);
        canvas.on('object:removed', onObjectChange);

        return () => {
            canvas.dispose();
            setFabricCanvas(null);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- UPDATE BACKGROUND (Bei Auswahl) ---
    useEffect(() => {
        if (!fabricCanvas || fabricCanvas.disposed) return;

        const bgUrl = PITCH_OPTIONS[pitchIndex].url;

        FabricImage.fromURL(bgUrl).then((img) => {
            if (!img || !fabricCanvas) return;
            
            const scaleX = WIDTH / img.width!;
            const scaleY = HEIGHT / img.height!;
            
            img.set({
                scaleX: scaleX,
                scaleY: scaleY,
                originX: 'left',
                originY: 'top',
                selectable: false,
                evented: false,
                excludeFromExport: true
            });

            fabricCanvas.backgroundImage = img;
            fabricCanvas.requestRenderAll();
        }).catch(err => {
            console.error("Konnte Hintergrund nicht laden:", bgUrl);
        });

    }, [pitchIndex, fabricCanvas]);


    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        if (!fabricCanvas) return;
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = fabricCanvas.getActiveObjects();
                if (activeObjects.length) {
                    activeObjects.forEach((obj) => fabricCanvas.remove(obj));
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.requestRenderAll();
                    saveHistory();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const activeObj = fabricCanvas.getActiveObject();
                if (activeObj) {
                    const cloned = await activeObj.clone();
                    clipboardRef.current = cloned;
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (clipboardRef.current) {
                    const clonedObj = await clipboardRef.current.clone();
                    fabricCanvas.discardActiveObject();
                    clonedObj.set({ left: clonedObj.left + 20, top: clonedObj.top + 20, evented: true });
                    if (clonedObj instanceof ActiveSelection) {
                        clonedObj.canvas = fabricCanvas;
                        clonedObj.forEachObject((obj: any) => fabricCanvas.add(obj));
                        clonedObj.setCoords();
                    } else {
                        fabricCanvas.add(clonedObj);
                    }
                    fabricCanvas.setActiveObject(clonedObj);
                    fabricCanvas.requestRenderAll();
                    saveHistory();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fabricCanvas, saveHistory]);

    // --- UPDATE BRUSH & SELECTION SETTINGS ---
    useEffect(() => {
        if (!fabricCanvas || fabricCanvas.disposed) return;
        
        fabricCanvas.isDrawingMode = activeTool === 'pencil';
        
        if (fabricCanvas.freeDrawingBrush) {
            const brush = fabricCanvas.freeDrawingBrush;
            brush.color = color;
            brush.width = strokeWidth;
            // @ts-ignore
            brush.strokeDashArray = isDashed ? [strokeWidth * 3, strokeWidth * 2] : null;
        }
        
        fabricCanvas.forEachObject((obj) => {
            if (obj === fabricCanvas.backgroundImage) return;
            obj.selectable = (activeTool === 'select');
            obj.evented = (activeTool === 'select');
        });

        if (activeTool !== 'select') fabricCanvas.discardActiveObject();

        const activeObj = fabricCanvas.getActiveObject();
        if (activeObj) {
            if (!(activeObj instanceof FabricImage)) {
                if (['path', 'line', 'rect', 'circle', 'triangle', 'group'].includes(activeObj.type || '')) {
                    activeObj.set({ 
                        stroke: color, 
                        fill: (activeObj.type === 'line' || activeObj instanceof Group) ? color : 'transparent', 
                        strokeWidth: strokeWidth,
                        strokeDashArray: isDashed ? [strokeWidth * 3, strokeWidth * 2] : undefined
                    });
                    if (activeObj.type === 'path' && activeObj.fill !== 'transparent' && activeObj.fill !== null) {
                         activeObj.set({ fill: color, stroke: '#fff', strokeWidth: 1.5, strokeDashArray: undefined });
                    }
                }
            } 
            else if (activeObj instanceof FabricImage) {
                // @ts-ignore
                const BlendColor = fabric.filters ? fabric.filters.BlendColor : fabric.Image.filters.BlendColor;
                activeObj.filters = [];
                const filter = new BlendColor({ color: color, mode: 'tint', alpha: 0.6 });
                activeObj.applyFilters([filter]);
            }
        }
        fabricCanvas.requestRenderAll();
    }, [activeTool, color, strokeWidth, isDashed, fabricCanvas]);

    // --- DRAWING HANDLERS ---
    const handleMouseDown = (opt: any) => {
        const currentTool = activeToolRef.current;
        const currentColor = colorRef.current;
        const currentWidth = strokeWidthRef.current;
        const currentDashed = isDashedRef.current;

        const canvas = opt.target?.canvas; 
        if (!canvas || currentTool === 'select' || currentTool === 'pencil' || !opt.pointer) return;
        
        isDrawingRef.current = true;
        startPointRef.current = opt.pointer;
        const { x, y } = startPointRef.current!;
        
        const common = { 
            stroke: currentColor, 
            strokeWidth: currentWidth, 
            strokeDashArray: currentDashed ? [currentWidth * 3, currentWidth * 2] : undefined,
            selectable: false, 
            evented: false, 
            fill: 'transparent' 
        };

        let shape: fabric.Object | null = null;

        switch (currentTool) {
            case 'line':
            case 'arrow': 
                shape = new Line([x, y, x, y], { ...common, fill: currentColor }); 
                break;
            case 'circle': 
                shape = new Circle({ left: x, top: y, radius: 1, originX: 'center', originY: 'center', ...common }); 
                break;
            case 'rect': 
                shape = new Rect({ left: x, top: y, width: 1, height: 1, ...common }); 
                break;
        }
        if (shape) {
            activeShapeRef.current = shape;
            canvas.add(shape);
        }
    };

    const handleMouseMove = (opt: any) => {
        const currentTool = activeToolRef.current;
        const canvas = opt.target?.canvas;
        if (!canvas || !isDrawingRef.current || !activeShapeRef.current || !startPointRef.current || !opt.pointer) return;
        const { x: startX, y: startY } = startPointRef.current;
        const { x: currentX, y: currentY } = opt.pointer;
        const shape = activeShapeRef.current;

        switch (currentTool) {
            case 'line': case 'arrow': (shape as Line).set({ x2: currentX, y2: currentY }); break;
            case 'circle': (shape as Circle).set({ radius: Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)) }); break;
            case 'rect': (shape as Rect).set({ left: Math.min(startX, currentX), top: Math.min(startY, currentY), width: Math.abs(currentX - startX), height: Math.abs(currentY - startY) }); break;
        }
        canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
        const currentTool = activeToolRef.current;
        const currentColor = colorRef.current;
        if (!isDrawingRef.current || !activeShapeRef.current || !fabricCanvas) return;
        isDrawingRef.current = false;
        const shape = activeShapeRef.current;

        if (currentTool === 'arrow' && shape instanceof Line) {
            const line = shape;
            fabricCanvas.remove(line);
            
            const angle = Math.atan2(line.y2! - line.y1!, line.x2! - line.x1!) * 180 / Math.PI + 90;
            const arrowHead = new Triangle({ 
                width: strokeWidthRef.current * 4,
                height: strokeWidthRef.current * 4, 
                fill: currentColor, 
                left: line.x2, 
                top: line.y2, 
                angle: angle, 
                originX: 'center', 
                originY: 'center', 
                selectable: false 
            });
            
            const arrowGroup = new Group([line, arrowHead], { selectable: true, evented: true });
            fabricCanvas.add(arrowGroup);
        } else {
            shape.set({ selectable: true, evented: true });
        }
        activeShapeRef.current = null;
        startPointRef.current = null;
        fabricCanvas.requestRenderAll();
        saveHistory();
    };

    const addSymbol = (type: string) => {
        if (!fabricCanvas || fabricCanvas.disposed) return;
        const center = { left: WIDTH / 2, top: HEIGHT / 2 };
        const shadow = new Shadow({ color: 'rgba(0,0,0,0.3)', blur: 5, offsetX: 3, offsetY: 3 });

        const addImage = (url: string, width: number) => {
            FabricImage.fromURL(url).then(img => {
                if (!img) return; 
                img.scaleToWidth(width);
                img.set({ left: center.left, top: center.top, originX: 'center', originY: 'center', shadow: shadow, selectable: true, evented: true });
                fabricCanvas.add(img);
                fabricCanvas.setActiveObject(img);
                setActiveTool('select');
            }).catch(err => {
                console.error("Bild-Fehler:", url);
                alert(`Bild nicht gefunden: ${url}\n\nBitte verschiebe den Ordner 'img' in den Ordner 'public'!`);
            });
        };

        if (type === 'ball') return addImage(CUSTOM_ICONS.ball, 30);
        if (type === 'cone') return addImage(CUSTOM_ICONS.cone, 35);
        if (type === 'disc') return addImage(CUSTOM_ICONS.disc, 25);
        if (type === 'flag') return addImage(CUSTOM_ICONS.flag, 35);
        if (type === 'goal') return addImage(CUSTOM_ICONS.goal, 120); 
        if (type === 'mini_goal') return addImage(CUSTOM_ICONS.goal, 60); 
        if (type === 'ladder') return addImage(CUSTOM_ICONS.ladder, 80);
        if (type === 'hurdle') return addImage(CUSTOM_ICONS.hurdle, 50);
        if (type === 'pole') return addImage(CUSTOM_ICONS.pole, 35); 
        if (type === 'ring') return addImage(CUSTOM_ICONS.ring, 30);
        if (type === 'coach') return addImage(CUSTOM_ICONS.coach, 40);
        if (type === 'dummy') return addImage(CUSTOM_ICONS.dummy, 45);
        if (type === 'player') return addImage(CUSTOM_ICONS.player, 45); 

        let shape: fabric.Object | null = null;
        if (type === 'jersey') shape = new Path(PATHS.JERSEY, { fill: color, stroke: '#fff', strokeWidth: 1.5, scaleX: 1.0, scaleY: 1.0 });

        if (shape) {
            shape.set({ left: center.left, top: center.top, originX: 'center', originY: 'center', shadow: shadow, selectable: true, evented: true });
            fabricCanvas.add(shape);
            fabricCanvas.setActiveObject(shape);
            setActiveTool('select');
        }
    };

    const handleUndo = () => {
        if (!fabricCanvas || fabricCanvas.disposed || historyRef.current.length <= 1) return;
        isLockedRef.current = true;
        historyRef.current.pop(); 
        const prevState = historyRef.current[historyRef.current.length - 1];
        fabricCanvas.loadFromJSON(JSON.parse(prevState), () => {
            if (fabricCanvas.disposed) return;
            // BG neu setzen, da es in loadFromJSON überschrieben werden könnte
            const bgUrl = PITCH_OPTIONS[pitchIndex].url;
            FabricImage.fromURL(bgUrl).then(img => {
                if (img) {
                    const scaleX = WIDTH / img.width!;
                    const scaleY = HEIGHT / img.height!;
                    img.set({ scaleX, scaleY, originX: 'left', originY: 'top', selectable: false, evented: false, excludeFromExport: true });
                    fabricCanvas.backgroundImage = img;
                    fabricCanvas.requestRenderAll();
                }
            });
            isLockedRef.current = false;
            setCanUndo(historyRef.current.length > 1);
        });
    };

    const handleClear = () => {
        if (!fabricCanvas || fabricCanvas.disposed) return;
        const objects = fabricCanvas.getObjects();
        [...objects].forEach((obj) => { if (obj !== fabricCanvas.backgroundImage) fabricCanvas.remove(obj); });
        fabricCanvas.requestRenderAll();
    };

    const handleSave = () => {
        if (!fabricCanvas || fabricCanvas.disposed) return;
        setSaving(true);
        try {
            fabricCanvas.discardActiveObject();
            fabricCanvas.requestRenderAll();
            const jsonOutput = JSON.stringify(fabricCanvas.toJSON());
            const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: mimeString });
            const file = new File([blob], "tactics.png", { type: "image/png", lastModified: Date.now() });
            onSave(file, jsonOutput);
            onClose();
        } catch (e: any) {
            console.error(e);
            alert("Fehler: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    const ToolBtn = ({ tool, icon: Icon, label }: { tool: ToolType, icon: any, label: string }) => (
        <button onClick={() => setActiveTool(tool)} className={`p-2 rounded-lg transition-colors ${activeTool === tool ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`} title={label}>
            <Icon className="text-lg" />
        </button>
    );

    const SymbolBtn = ({ onClick, icon: Icon, imageSrc, color, label, customIcon }: { onClick: () => void, icon?: any, imageSrc?: string, color?: string, label: string, customIcon?: string }) => (
        <button onClick={onClick} className="p-2 hover:bg-gray-100 rounded-lg flex flex-col items-center gap-1 min-w-[50px] transition-colors group" title={label}>
             <div className="h-8 flex items-center justify-center transition-transform group-hover:scale-110">
                {imageSrc ? (
                    <img src={imageSrc} className="max-h-full max-w-full object-contain drop-shadow-sm" alt={label} />
                ) : customIcon ? (
                    <span className="text-2xl">{customIcon}</span>
                ) : (
                    <Icon className="text-2xl" style={{ color: color }} />
                )}
             </div>
             <span className="text-[9px] font-bold text-gray-500 uppercase">{label}</span>
        </button>
    );

    return (
        <div className="w-full h-[85vh] max-h-[900px] relative bg-white rounded-[2rem] overflow-hidden border-2 border-black shadow-2xl flex flex-col">
            
            {/* TOOLBAR */}
            <div className="bg-white p-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 z-50">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 shadow-inner">
                        <ToolBtn tool="select" icon={FaMousePointer} label="Auswahl" />
                        <div className="w-[1px] h-6 bg-gray-200 mx-1 self-center"></div>
                        <ToolBtn tool="pencil" icon={FaPencilAlt} label="Freihand" />
                        <ToolBtn tool="arrow" icon={FaArrowRight} label="Pfeil" />
                        <ToolBtn tool="line" icon={FaMinus} label="Linie" />
                        <ToolBtn tool="circle" icon={FaRegCircle} label="Kreis" />
                        <ToolBtn tool="rect" icon={FaRegSquare} label="Rechteck" />
                    </div>
                </div>

                {/* EINSTELLUNGEN FÜR STIFT/LINIEN (Nur sichtbar bei Zeichen-Tools) */}
                {['pencil', 'arrow', 'line', 'circle', 'rect'].includes(activeTool) && (
                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                        <button onClick={() => setIsDashed(!isDashed)} className={`p-1 rounded flex items-center gap-1 text-xs font-bold uppercase ${isDashed ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'}`} title="Linienart">
                            {isDashed ? <><FaEllipsisH/> Gestrichelt</> : <><FaGripLines/> Durchgezogen</>}
                        </button>
                        <div className="w-[1px] h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Dicke:</span>
                            <input 
                                type="range" min="2" max="10" step="1" 
                                value={strokeWidth} 
                                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                                className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                            <span className="text-xs font-mono w-4">{strokeWidth}</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {/* HINTERGRUND WAHL */}
                    <div className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-2">
                        <FaMap className="text-gray-400"/>
                        <select 
                            value={pitchIndex} 
                            onChange={(e) => setPitchIndex(parseInt(e.target.value))}
                            className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                        >
                            {PITCH_OPTIONS.map((opt, i) => (
                                <option key={i} value={i}>{opt.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-[1px] h-6 bg-gray-200"></div>

                    <div className="flex gap-1 items-center bg-gray-50 p-1 rounded-full border border-gray-100">
                        {['#1d1d1d', '#d32f2f', '#1976d2', '#fbc02d', '#ffffff'].map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110 ${color===c ? 'ring-2 ring-offset-1 ring-black scale-110':''}`} style={{backgroundColor: c}} />
                        ))}
                    </div>
                    
                    <div className="flex gap-1">
                        <button onClick={handleUndo} disabled={!canUndo} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed" title="Rückgängig"><FaUndo/></button>
                        <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Alles löschen"><FaTrash/></button>
                    </div>
                </div>
            </div>

            {/* SYMBOLS */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 overflow-x-auto flex gap-6 no-scrollbar items-center shadow-inner">
                <div className="flex gap-2 border-r border-gray-200 pr-4">
                    <SymbolBtn onClick={() => addSymbol('jersey')} icon={FaTshirt} color={color} label="Trikot" />
                    <SymbolBtn onClick={() => addSymbol('player')} imageSrc={CUSTOM_ICONS.player} label="Spieler" />
                    <SymbolBtn onClick={() => addSymbol('dummy')} imageSrc={CUSTOM_ICONS.dummy} label="Dummy" />
                    <SymbolBtn onClick={() => addSymbol('coach')} imageSrc={CUSTOM_ICONS.coach} label="Trainer" />
                </div>
                <div className="flex gap-2 border-r border-gray-200 pr-4">
                    <SymbolBtn onClick={() => addSymbol('ball')} imageSrc={CUSTOM_ICONS.ball} label="Ball" />
                    <SymbolBtn onClick={() => addSymbol('goal')} imageSrc={CUSTOM_ICONS.goal} label="Tor" />
                    <SymbolBtn onClick={() => addSymbol('mini_goal')} imageSrc={CUSTOM_ICONS.goal} label="Minitor" />
                    <SymbolBtn onClick={() => addSymbol('flag')} imageSrc={CUSTOM_ICONS.flag} label="Fahne" />
                </div>
                <div className="flex gap-2">
                    <SymbolBtn onClick={() => addSymbol('cone')} imageSrc={CUSTOM_ICONS.cone} label="Hütchen" />
                    <SymbolBtn onClick={() => addSymbol('disc')} imageSrc={CUSTOM_ICONS.disc} label="Teller" />
                    <SymbolBtn onClick={() => addSymbol('pole')} imageSrc={CUSTOM_ICONS.pole} label="Stange" />
                    <SymbolBtn onClick={() => addSymbol('ladder')} imageSrc={CUSTOM_ICONS.ladder} label="Leiter" />
                    <SymbolBtn onClick={() => addSymbol('hurdle')} imageSrc={CUSTOM_ICONS.hurdle} label="Hürde" />
                    <SymbolBtn onClick={() => addSymbol('ring')} imageSrc={CUSTOM_ICONS.ring} label="Ring" />
                </div>
            </div>

            <div className="flex-1 relative bg-gray-200/50 flex justify-center items-center overflow-auto p-4 touch-none">
                <div className="border border-gray-300 shadow-2xl bg-white">
                    <canvas ref={canvasRef} />
                </div>
            </div>

            <div className="bg-white p-3 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Abbrechen</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black rounded-xl hover:bg-gray-800 disabled:opacity-50 shadow-lg flex items-center gap-2 transition-all hover:scale-105">
                    {saving ? 'Speichert...' : <><FaCheck/> Speichern</>}
                </button>
            </div>
        </div>
    );
}