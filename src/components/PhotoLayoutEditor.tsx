import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Plus, ShoppingBag, Save, Download, Upload, 
  RotateCcw, RotateCw, Printer, Trash2, Camera, Image as ImageIcon, 
  Type, Shapes, Palette, QrCode, User, Eye, EyeOff, Layers, 
  Move, Check, ChevronRight, Sliders, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { LayoutTemplate, TemplateLayer, PaperSize, LayerType } from '../types';
import { PRESET_TEMPLATES } from '../data/defaultTemplates';

interface PhotoLayoutEditorProps {
  template: LayoutTemplate;
  onSaveTemplate: (updated: LayoutTemplate) => void;
  onBackToEvents: () => void;
  eventName: string;
}

export const PhotoLayoutEditor: React.FC<PhotoLayoutEditorProps> = ({
  template: initialTemplate,
  onSaveTemplate,
  onBackToEvents,
  eventName,
}) => {
  const [template, setTemplate] = useState<LayoutTemplate>(initialTemplate);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    template.layers[0]?.id || null
  );
  const [history, setHistory] = useState<LayoutTemplate[]>([initialTemplate]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [dimensionUnit, setDimensionUnit] = useState<'pixels' | 'inches'>('pixels');
  const [showPresetShop, setShowPresetShop] = useState<boolean>(false);
  const [testPrintNotice, setTestPrintNotice] = useState<string | null>(null);

  // Dragging & Resizing state on the canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialLayerRect, setInitialLayerRect] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });

  const selectedLayer = template.layers.find((l) => l.id === selectedLayerId) || null;

  // Push to undo/redo history
  const pushHistory = (newTemplate: LayoutTemplate) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setTemplate(newTemplate);
    onSaveTemplate(newTemplate);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
      onSaveTemplate(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
      onSaveTemplate(history[historyIndex + 1]);
    }
  };

  // Add new Layer tools
  const handleAddPhotoSlot = () => {
    const existingPhotoSlots = template.layers.filter((l) => l.type === 'photo_slot');
    const newIndex = existingPhotoSlots.length + 1;
    const newLayer: TemplateLayer = {
      id: `photo-slot-${Date.now()}`,
      name: `Photo ${newIndex}`,
      type: 'photo_slot',
      photoIndex: newIndex,
      x: 50,
      y: 100 + existingPhotoSlots.length * 390,
      width: 500,
      height: 360,
      rotation: 0,
      opacity: 1,
      visible: true,
      borderColor: '#7C3AED',
      borderWidth: 6,
      borderRadius: 12,
    };
    pushHistory({
      ...template,
      layers: [...template.layers, newLayer],
    });
    setSelectedLayerId(newLayer.id);
  };

  const handleAddText = () => {
    const newLayer: TemplateLayer = {
      id: `text-${Date.now()}`,
      name: 'Custom Text',
      type: 'text',
      text: 'Celebration 2026',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#18181B',
      textAlign: 'center',
      x: 50,
      y: 1400,
      width: 500,
      height: 44,
      rotation: 0,
      opacity: 1,
      visible: true,
    };
    pushHistory({
      ...template,
      layers: [...template.layers, newLayer],
    });
    setSelectedLayerId(newLayer.id);
  };

  const handleAddShape = () => {
    const newLayer: TemplateLayer = {
      id: `shape-${Date.now()}`,
      name: 'Banner Box',
      type: 'shape',
      shapeType: 'rectangle',
      x: 40,
      y: 1350,
      width: 520,
      height: 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      fillColor: '#E0E7FF',
      strokeColor: '#6366F1',
      strokeWidth: 2,
    };
    pushHistory({
      ...template,
      layers: [...template.layers, newLayer],
    });
    setSelectedLayerId(newLayer.id);
  };

  const handleAddQRCode = () => {
    const newLayer: TemplateLayer = {
      id: `qr-${Date.now()}`,
      name: 'Guest QR Code',
      type: 'qr_code',
      qrValue: 'https://fotoshare.co/sample-gallery',
      x: 220,
      y: 1480,
      width: 160,
      height: 160,
      rotation: 0,
      opacity: 1,
      visible: true,
    };
    pushHistory({
      ...template,
      layers: [...template.layers, newLayer],
    });
    setSelectedLayerId(newLayer.id);
  };

  const handleAddSessionData = (field: 'date' | 'time' | 'filename' | 'event_name') => {
    const newLayer: TemplateLayer = {
      id: `data-${Date.now()}`,
      name: `<<${field}>>`,
      type: 'session_data',
      dataField: field,
      x: 50,
      y: 1680,
      width: 500,
      height: 30,
      rotation: 0,
      opacity: 1,
      visible: true,
      fill: '#64748B',
      fontSize: 14,
      textAlign: 'center',
    };
    pushHistory({
      ...template,
      layers: [...template.layers, newLayer],
    });
    setSelectedLayerId(newLayer.id);
  };

  // Layer Property Updates
  const updateSelectedLayer = (updates: Partial<TemplateLayer>) => {
    if (!selectedLayerId) return;
    const updatedLayers = template.layers.map((l) =>
      l.id === selectedLayerId ? { ...l, ...updates } : l
    );
    pushHistory({ ...template, layers: updatedLayers });
  };

  // Reordering / Layers Stack
  const handleBringForward = () => {
    if (!selectedLayerId) return;
    const idx = template.layers.findIndex((l) => l.id === selectedLayerId);
    if (idx < template.layers.length - 1) {
      const layers = [...template.layers];
      const temp = layers[idx];
      layers[idx] = layers[idx + 1];
      layers[idx + 1] = temp;
      pushHistory({ ...template, layers });
    }
  };

  const handleSendBackward = () => {
    if (!selectedLayerId) return;
    const idx = template.layers.findIndex((l) => l.id === selectedLayerId);
    if (idx > 0) {
      const layers = [...template.layers];
      const temp = layers[idx];
      layers[idx] = layers[idx - 1];
      layers[idx - 1] = temp;
      pushHistory({ ...template, layers });
    }
  };

  const handleDeleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    const layers = template.layers.filter((l) => l.id !== selectedLayerId);
    pushHistory({ ...template, layers });
    setSelectedLayerId(layers[layers.length - 1]?.id || null);
  };

  // Alignment Helpers
  const handleAlign = (type: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => {
    if (!selectedLayer) return;
    let newX = selectedLayer.x;
    let newY = selectedLayer.y;

    if (type === 'left') newX = 20;
    if (type === 'centerH') newX = (template.width - selectedLayer.width) / 2;
    if (type === 'right') newX = template.width - selectedLayer.width - 20;
    if (type === 'top') newY = 20;
    if (type === 'centerV') newY = (template.height - selectedLayer.height) / 2;
    if (type === 'bottom') newY = template.height - selectedLayer.height - 20;

    updateSelectedLayer({ x: Math.round(newX), y: Math.round(newY) });
  };

  // Print Test Copy
  const handlePrintTest = () => {
    setTestPrintNotice('Sent test copy to Windows Print Spooler (2x6 Cut)');
    setTimeout(() => setTestPrintNotice(null), 3500);
    window.print();
  };

  // Scale factor for rendering logical 600x1800 canvas into viewport
  const scale = 0.38;

  return (
    <div className="w-full flex-1 flex flex-col bg-[#141416] text-[#F3F4F6] min-h-[calc(100vh-2.5rem)] select-none">
      {/* 1. TOP BREADCRUMB / TITLE BAR (Matches Screenshot 2) */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-neutral-800 bg-[#18181B] text-xs">
        {/* Back Link */}
        <button
          onClick={onBackToEvents}
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Screen Editor</span>
        </button>

        {/* Center: Template Title & Status */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-200 text-sm">Photo Layout</span>
          <span className="text-neutral-500">·</span>
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-md px-2.5 py-1 text-neutral-300 font-mono text-[11px]">
            <span>{template.name}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </div>
          <span className="text-[11px] text-neutral-500">- Saved</span>
        </div>

        {/* Right: General */}
        <div className="flex items-center gap-3">
          <span className="text-neutral-400 hover:text-white cursor-pointer font-medium">
            General &gt;
          </span>
          <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            v
          </div>
        </div>
      </div>

      {/* 2. SECONDARY ACTION TOOLBAR (Matches Screenshot 2) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2 border-b border-neutral-800 bg-[#161618] text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAddPhotoSlot()}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white"
          >
            <Plus className="w-3.5 h-3.5 text-pink-500" />
            <span>Add layout</span>
          </button>

          <button
            onClick={() => setShowPresetShop(!showPresetShop)}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Shop Templates</span>
          </button>

          <button
            onClick={() => onSaveTemplate(template)}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save as New</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="text-neutral-400 hover:text-white disabled:opacity-30"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="text-neutral-400 hover:text-white disabled:opacity-30"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={handlePrintTest}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print Test Copy</span>
          </button>

          <button
            onClick={handleDeleteSelectedLayer}
            disabled={!selectedLayerId}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-rose-400 disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Layer</span>
          </button>
        </div>

        {/* LumaBooth Dashboard banner badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-950 to-neutral-900 border border-pink-800/60 px-3 py-1 rounded-lg text-[11px] text-pink-300">
          <span className="font-semibold">LumaBooth Layout Engine</span>
          <span className="text-neutral-500">·</span>
          <span>820+ templates compatible</span>
        </div>
      </div>

      {/* 3. MAIN EDITOR WORKSPACE (3-COLUMN SPLIT) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN: ADD TOOLS & LAYOUT PROPERTIES (Matches Screenshot 2) */}
        <div className="md:col-span-3 border-r border-neutral-800 bg-[#121214] p-4 flex flex-col gap-6 overflow-y-auto">
          {/* Section: Add Elements */}
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
              Add
            </h3>

            <div className="space-y-1 text-xs">
              <button
                onClick={handleAddPhotoSlot}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors text-left"
              >
                <Camera className="w-4 h-4 text-pink-400" />
                <span className="font-medium">Photo From Booth</span>
              </button>

              <button
                onClick={() => {
                  const url = prompt('Enter Image / Sponsor Logo URL (or data URL):');
                  if (url) {
                    const newLayer: TemplateLayer = {
                      id: `img-${Date.now()}`,
                      name: 'Sponsor Logo',
                      type: 'image',
                      imageUrl: url,
                      x: 100,
                      y: 50,
                      width: 400,
                      height: 120,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                    };
                    pushHistory({ ...template, layers: [...template.layers, newLayer] });
                    setSelectedLayerId(newLayer.id);
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors text-left"
              >
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span className="font-medium">Image / Logo</span>
              </button>

              <button
                onClick={handleAddText}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors text-left"
              >
                <Type className="w-4 h-4 text-amber-400" />
                <span className="font-medium">Text</span>
              </button>

              <button
                onClick={handleAddShape}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Shapes className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">Shape</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">Background Color</span>
                </div>
                <input
                  type="color"
                  value={template.backgroundColor}
                  onChange={(e) => pushHistory({ ...template, backgroundColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>

              <button
                onClick={handleAddQRCode}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors text-left"
              >
                <QrCode className="w-4 h-4 text-rose-400" />
                <span className="font-medium">QR Code</span>
              </button>

              <div className="pt-1">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-neutral-400 text-xs">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-sky-400" />
                    <span className="font-medium">Session Data</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-3 pt-1">
                  {(['date', 'time', 'filename', 'event_name'] as const).map((field) => (
                    <button
                      key={field}
                      onClick={() => handleAddSessionData(field)}
                      className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[11px] text-neutral-300 font-mono capitalize"
                    >
                      +{field}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Layout Dimensions */}
          <div className="pt-4 border-t border-neutral-800 space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Layout
            </h3>

            <div>
              <span className="text-neutral-400 text-xs block mb-1">View Dimension In</span>
              <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setDimensionUnit('pixels')}
                  className={`py-1 text-xs rounded font-medium ${
                    dimensionUnit === 'pixels' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-400'
                  }`}
                >
                  Pixels
                </button>
                <button
                  onClick={() => setDimensionUnit('inches')}
                  className={`py-1 text-xs rounded font-medium ${
                    dimensionUnit === 'inches' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-400'
                  }`}
                >
                  Inches
                </button>
              </div>
            </div>

            <div>
              <span className="text-neutral-400 text-xs block mb-1">Paper Size</span>
              <select
                value={template.paperSize}
                onChange={(e) => {
                  const size = e.target.value as PaperSize;
                  let w = 600;
                  let h = 1800;
                  if (size === '4x6') {
                    w = 1200;
                    h = 1800;
                  } else if (size === 'square') {
                    w = 1200;
                    h = 1200;
                  }
                  pushHistory({
                    ...template,
                    paperSize: size,
                    width: w,
                    height: h,
                  });
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono"
              >
                <option value="2x6">2 x 6 (Standard Strip)</option>
                <option value="4x6">4 x 6 (Postcard Grid)</option>
                <option value="5x7">5 x 7 (Portrait)</option>
                <option value="square">Square 6 x 6</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={template.print2PerPage}
                onChange={(e) => pushHistory({ ...template, print2PerPage: e.target.checked })}
                className="w-4 h-4 rounded text-pink-600 bg-neutral-900 border-neutral-700"
              />
              <span className="font-semibold text-pink-400">Print 2 per page</span>
            </label>
          </div>
        </div>

        {/* CENTER COLUMN: WYSIWYG CANVAS WORKSPACE (Matches Screenshot 2) */}
        <div className="md:col-span-6 bg-[#1F1F24] p-6 flex flex-col items-center justify-between relative overflow-auto">
          {/* Floating Bring Forward / Send Backward toolbar */}
          <div className="absolute top-4 left-6 z-20 flex items-center gap-2 bg-[#18181B]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 shadow-xl text-xs">
            <button
              onClick={handleBringForward}
              disabled={!selectedLayerId}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs disabled:opacity-40"
            >
              Bring Forward
            </button>
            <button
              onClick={handleSendBackward}
              disabled={!selectedLayerId}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs disabled:opacity-40"
            >
              Send Backward
            </button>
          </div>

          {/* Test print feedback notice */}
          {testPrintNotice && (
            <div className="absolute top-4 right-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{testPrintNotice}</span>
            </div>
          )}

          {/* The Actual Scaled Physical Canvas (2x6 or 4x6) */}
          <div className="my-auto relative flex items-center justify-center p-6">
            <div
              ref={canvasRef}
              style={{
                width: `${template.width * scale}px`,
                height: `${template.height * scale}px`,
                backgroundColor: template.backgroundColor,
              }}
              onClick={() => setSelectedLayerId(null)}
              className="relative shadow-2xl rounded-sm overflow-hidden border border-neutral-700 transition-all select-none"
            >
              {/* Render all Layers */}
              {template.layers.map((layer) => {
                if (!layer.visible) return null;
                const isSelected = layer.id === selectedLayerId;

                const lx = layer.x * scale;
                const ly = layer.y * scale;
                const lw = layer.width * scale;
                const lh = layer.height * scale;

                return (
                  <div
                    key={layer.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${lx}px`,
                      top: `${ly}px`,
                      width: `${lw}px`,
                      height: `${lh}px`,
                      transform: `rotate(${layer.rotation}deg)`,
                      opacity: layer.opacity,
                    }}
                    className={`cursor-pointer transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-pink-500 ring-offset-1 z-30 shadow-lg'
                        : 'hover:ring-1 hover:ring-pink-300/60 z-10'
                    }`}
                  >
                    {/* Layer Render Specifics */}
                    {layer.type === 'photo_slot' && (
                      <div
                        style={{
                          borderColor: layer.borderColor || '#7C3AED',
                          borderWidth: `${(layer.borderWidth || 4) * scale}px`,
                          borderRadius: `${(layer.borderRadius || 8) * scale}px`,
                        }}
                        className="w-full h-full border-solid flex flex-col items-center justify-center relative overflow-hidden bg-lime-400/90 text-neutral-900"
                      >
                        {/* Silhouette & Photo Slot Number (Exact style as LumaBooth screenshot!) */}
                        <div className="flex flex-col items-center justify-center">
                          {/* Silhouette Icon */}
                          <div className="w-10 h-10 rounded-full bg-neutral-900/80 mx-auto mb-1" />
                          <span className="text-3xl font-black text-neutral-950 font-mono tracking-tighter">
                            {layer.photoIndex || 1}
                          </span>
                        </div>
                        <span className="absolute bottom-1 right-2 text-[8px] font-mono text-neutral-800">
                          BOOTH PHOTO #{layer.photoIndex}
                        </span>
                      </div>
                    )}

                    {layer.type === 'text' && (
                      <div
                        style={{
                          color: layer.fill || '#18181B',
                          fontSize: `${(layer.fontSize || 24) * scale}px`,
                          fontFamily: layer.fontFamily || 'Plus Jakarta Sans',
                          fontWeight: layer.fontWeight || 'bold',
                          textAlign: layer.textAlign || 'center',
                        }}
                        className="w-full h-full flex items-center justify-center leading-tight truncate px-1"
                      >
                        {layer.text}
                      </div>
                    )}

                    {layer.type === 'image' && (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded overflow-hidden">
                        {layer.imageUrl ? (
                          <img
                            src={layer.imageUrl}
                            alt="Custom Layer"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>
                    )}

                    {layer.type === 'shape' && (
                      <div
                        style={{
                          backgroundColor: layer.fillColor || '#E0E7FF',
                          borderColor: layer.strokeColor || '#6366F1',
                          borderWidth: `${(layer.strokeWidth || 1) * scale}px`,
                        }}
                        className="w-full h-full border-solid rounded"
                      />
                    )}

                    {layer.type === 'qr_code' && (
                      <div className="w-full h-full bg-white p-1.5 rounded flex flex-col items-center justify-center border border-neutral-300 shadow-sm">
                        <QrCode className="w-full h-full text-neutral-900" />
                      </div>
                    )}

                    {layer.type === 'session_data' && (
                      <div
                        style={{
                          color: layer.fill || '#64748B',
                          fontSize: `${(layer.fontSize || 14) * scale}px`,
                          textAlign: layer.textAlign || 'center',
                        }}
                        className="w-full h-full flex items-center justify-center font-mono"
                      >
                        {layer.dataField === 'date'
                          ? new Date().toLocaleDateString()
                          : `<<${layer.dataField}>>`}
                      </div>
                    )}

                    {/* Resize handles when selected */}
                    {isSelected && (
                      <>
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-pink-500 rounded-full border border-white cursor-nwse-resize" />
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-pink-500 rounded-full border border-white cursor-nesw-resize" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-pink-500 rounded-full border border-white cursor-nesw-resize" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-pink-500 rounded-full border border-white cursor-nwse-resize" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] font-mono text-neutral-500 text-center pb-2">
            Canvas: {template.width}px × {template.height}px (300 DPI Dye-Sub Ready)
          </div>
        </div>

        {/* RIGHT COLUMN: INSPECTOR & LAYERS (Matches Screenshot 2) */}
        <div className="md:col-span-3 border-l border-neutral-800 bg-[#121214] p-4 flex flex-col gap-6 overflow-y-auto">
          {/* Section: Selected Layer Inspector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Selected
              </h3>
              {selectedLayer && (
                <span className="text-[11px] font-mono text-pink-400 truncate max-w-[120px]">
                  {selectedLayer.name}
                </span>
              )}
            </div>

            {selectedLayer ? (
              <div className="space-y-3 text-xs">
                {/* Coordinates X, Y, W, H */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5">
                    <span className="text-neutral-500 font-mono text-[11px] w-3">X</span>
                    <input
                      type="number"
                      value={selectedLayer.x}
                      onChange={(e) => updateSelectedLayer({ x: Number(e.target.value) })}
                      className="w-full bg-transparent text-neutral-200 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5">
                    <span className="text-neutral-500 font-mono text-[11px] w-3">Y</span>
                    <input
                      type="number"
                      value={selectedLayer.y}
                      onChange={(e) => updateSelectedLayer({ y: Number(e.target.value) })}
                      className="w-full bg-transparent text-neutral-200 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5">
                    <span className="text-neutral-500 font-mono text-[11px] w-3">W</span>
                    <input
                      type="number"
                      value={selectedLayer.width}
                      onChange={(e) => updateSelectedLayer({ width: Number(e.target.value) })}
                      className="w-full bg-transparent text-neutral-200 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5">
                    <span className="text-neutral-500 font-mono text-[11px] w-3">H</span>
                    <input
                      type="number"
                      value={selectedLayer.height}
                      onChange={(e) => updateSelectedLayer({ height: Number(e.target.value) })}
                      className="w-full bg-transparent text-neutral-200 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Rotate & Aspect Ratio */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-400">Rotate</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={selectedLayer.rotation}
                      onChange={(e) => updateSelectedLayer({ rotation: Number(e.target.value) })}
                      className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-right font-mono"
                    />
                    <span className="text-neutral-500">°</span>
                  </div>
                </div>

                {/* Specific options for text */}
                {selectedLayer.type === 'text' && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                    <span className="text-neutral-400 block mb-1">Text Content</span>
                    <input
                      type="text"
                      value={selectedLayer.text || ''}
                      onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Color</span>
                      <input
                        type="color"
                        value={selectedLayer.fill || '#000000'}
                        onChange={(e) => updateSelectedLayer({ fill: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                )}

                {/* Specific options for photo slot */}
                {selectedLayer.type === 'photo_slot' && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Border Color</span>
                      <input
                        type="color"
                        value={selectedLayer.borderColor || '#7C3AED'}
                        onChange={(e) => updateSelectedLayer({ borderColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Border Width</span>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={selectedLayer.borderWidth || 4}
                        onChange={(e) => updateSelectedLayer({ borderWidth: Number(e.target.value) })}
                        className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-right font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-neutral-500 italic p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/60">
                Click any layer on the canvas to edit its properties.
              </div>
            )}
          </div>

          {/* Section: Alignment Buttons (Matches Screenshot 2) */}
          <div className="pt-2 border-t border-neutral-800">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
              Alignment
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleAlign('left')}
                className="py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-xs font-mono"
                title="Align Left"
              >
                Left
              </button>
              <button
                onClick={() => handleAlign('centerH')}
                className="py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-xs font-mono"
                title="Align Center H"
              >
                Center
              </button>
              <button
                onClick={() => handleAlign('right')}
                className="py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-xs font-mono"
                title="Align Right"
              >
                Right
              </button>
              <button
                onClick={() => handleAlign('top')}
                className="py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-xs font-mono"
                title="Align Top"
              >
                Top
              </button>
            </div>
          </div>

          {/* Section: Layers Inspector (Matches Screenshot 2) */}
          <div className="pt-2 border-t border-neutral-800 flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
              Layers ({template.layers.length})
            </h3>

            <div className="space-y-1 overflow-y-auto max-h-56 pr-1">
              {[...template.layers].reverse().map((layer) => {
                const isSelected = layer.id === selectedLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-pink-500/15 border-pink-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = template.layers.map((l) =>
                            l.id === layer.id ? { ...l, visible: !l.visible } : l
                          );
                          pushHistory({ ...template, layers: updated });
                        }}
                        className="text-neutral-500 hover:text-white"
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <span className="font-medium truncate">{layer.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = template.layers.filter((l) => l.id !== layer.id);
                        pushHistory({ ...template, layers: updated });
                      }}
                      className="text-neutral-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Templates Modal (Shop Templates) */}
      {showPresetShop && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-neutral-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-white">Template Library</h3>
                <p className="text-xs text-neutral-400">Choose a pre-designed layout to load into the editor</p>
              </div>
              <button
                onClick={() => setShowPresetShop(false)}
                className="text-neutral-400 hover:text-white text-xs px-3 py-1 bg-neutral-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PRESET_TEMPLATES.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    pushHistory({ ...preset, id: `tpl-${Date.now()}` });
                    setShowPresetShop(false);
                  }}
                  className="p-3 bg-neutral-900 border border-neutral-800 hover:border-pink-500 rounded-xl cursor-pointer text-left transition-all hover:scale-105"
                >
                  <div className="h-40 bg-white/10 rounded mb-2 flex items-center justify-center font-bold text-xs text-neutral-300">
                    {preset.paperSize} ({preset.layers.filter((l) => l.type === 'photo_slot').length} poses)
                  </div>
                  <div className="font-semibold text-xs text-neutral-200 truncate">{preset.name}</div>
                  <div className="text-[11px] text-pink-400 mt-1">Click to Load Template</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
