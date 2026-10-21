import React, { useState } from 'react';
import { 
  Plus, Copy, Trash2, Edit2, Zap, Search, Camera, 
  Film, Sparkles, Sliders, Mail, MessageSquare, Printer, 
  Layers, Check, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { EventItem, LayoutTemplate } from '../types';

interface SavedEventsViewProps {
  events: EventItem[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
  onCreateEvent: () => void;
  onRenameEvent: (id: string, newName: string) => void;
  onDeleteEvent: (id: string) => void;
  onDuplicateEvent: (id: string) => void;
  onOpenLayoutEditor: (eventId: string, templateId?: string) => void;
  onLaunchEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updates: Partial<EventItem>) => void;
}

export const SavedEventsView: React.FC<SavedEventsViewProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onCreateEvent,
  onRenameEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onOpenLayoutEditor,
  onLaunchEvent,
  onUpdateEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const filteredEvents = events
    .filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });

  const getRelativeTime = (timestamp: number) => {
    const diffHours = Math.round((Date.now() - timestamp) / (1000 * 3600));
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const handleStartRename = (event: EventItem) => {
    setRenamingId(event.id);
    setRenameValue(event.name);
  };

  const handleFinishRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameEvent(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#141416] text-[#F3F4F6] min-h-[calc(100vh-2.5rem)]">
      {/* Top Action Ribbon - Styled after LumaBooth Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-neutral-800/80 bg-[#18181B]/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-200">Your events</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectEvent(events[0]?.id)}
            className="px-3.5 py-1.5 rounded-full border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors"
          >
            Select All
          </button>

          <button
            onClick={() => activeEvent && handleStartRename(activeEvent)}
            className="px-3.5 py-1.5 rounded-full border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-3 h-3 text-neutral-400" />
            <span>Rename event</span>
          </button>

          <button
            onClick={() => {
              if (activeEvent && window.confirm(`Delete event "${activeEvent.name}"?`)) {
                onDeleteEvent(activeEvent.id);
              }
            }}
            className="px-3.5 py-1.5 rounded-full border border-neutral-700 bg-neutral-900/80 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800 text-xs font-medium text-neutral-300 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3 text-neutral-400" />
            <span>Delete</span>
          </button>

          <button
            onClick={() => activeEvent && onDuplicateEvent(activeEvent.id)}
            className="px-3.5 py-1.5 rounded-full border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors flex items-center gap-1.5"
          >
            <Copy className="w-3 h-3 text-neutral-400" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={onCreateEvent}
            className="px-4 py-1.5 rounded-full border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New event</span>
          </button>

          {/* Launch Event CTA */}
          <button
            onClick={() => activeEvent && onLaunchEvent(activeEvent.id)}
            className="ml-2 px-5 py-2 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-pink-600/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Launch event</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto">
        {/* COLUMN 1: EVENT LIST (Left Sidebar) */}
        <div className="md:col-span-3 border-r border-neutral-800/80 p-4 flex flex-col gap-3 bg-[#121214]">
          {/* Filter Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'name' ? 'recent' : 'name')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-900 text-xs text-neutral-300 hover:text-white"
            >
              <span>{sortOrder === 'name' ? 'Sort by date' : 'Sort by name'}</span>
            </button>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-900 text-xs text-neutral-300">
              <span>All time</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Find your event"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-neutral-700/80 pb-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-pink-500 pl-1 pr-7"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute right-1.5 top-1.5" />
          </div>

          {/* Event Cards */}
          <div className="flex flex-col gap-2 mt-2 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
            {filteredEvents.map((evt) => {
              const isSelected = evt.id === activeEvent?.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt.id)}
                  className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-pink-500 bg-[#1F1820] shadow-sm'
                      : 'border-neutral-800 bg-[#161618] hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  {/* Selection Radio / Check Circle */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500 text-white'
                        : 'border-neutral-600 bg-neutral-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    {renamingId === evt.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                        className="bg-neutral-900 border border-pink-500 rounded px-2 py-0.5 text-xs text-white w-full focus:outline-none"
                      />
                    ) : (
                      <div className="font-semibold text-xs sm:text-sm text-neutral-200 truncate">
                        {evt.name}
                      </div>
                    )}
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {getRelativeTime(evt.updatedAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: CAPTURE SETTINGS (Center Column) */}
        <div className="md:col-span-5 p-6 border-r border-neutral-800/80 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-base font-bold text-neutral-100 mb-3">Capture</h2>

            {/* Live Camera Viewfinder Simulation Card */}
            <div className="w-full aspect-16/10 rounded-2xl bg-[#09090B] border border-neutral-800 p-4 relative flex flex-col justify-between overflow-hidden shadow-xl">
              <div className="w-12 h-12 rounded-xl border border-pink-500/30 bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Camera className="w-6 h-6" />
              </div>

              {/* Start Button Overlay */}
              <div className="self-end flex flex-col items-center gap-1">
                <button
                  onClick={() => onLaunchEvent(activeEvent.id)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <span className="text-[10px] text-pink-400 font-medium">Start</span>
              </div>
            </div>

            {/* Mode Selectors (Photo, GIF, 360/Slow-mo, Video) */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { id: 'photo', label: 'Photo', icon: Camera, color: 'text-pink-400' },
                { id: 'gif', label: 'GIF', icon: Film, color: 'text-cyan-400' },
                { id: 'boomerang', label: '360/Slow-mo', icon: Sparkles, color: 'text-amber-400' },
                { id: 'video', label: 'Video', icon: Film, color: 'text-emerald-400' },
              ].map((m) => {
                const Icon = m.icon;
                const active = activeEvent.captureModes[m.id as keyof typeof activeEvent.captureModes];
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      onUpdateEvent(activeEvent.id, {
                        captureModes: {
                          ...activeEvent.captureModes,
                          [m.id]: !active,
                        },
                      })
                    }
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${
                      active
                        ? 'border-pink-500/60 bg-pink-500/10 text-white'
                        : 'border-neutral-800 bg-[#161618] text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${active ? m.color : 'text-neutral-500'}`} />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features List & Sharing Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-neutral-800/80">
            {/* Features Checklist */}
            <div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                Features
              </h3>
              <div className="space-y-1.5 text-xs text-neutral-300">
                {[
                  { key: 'aiPortraits', label: 'AI Portraits' },
                  { key: 'effects', label: 'Effects & Filters' },
                  { key: 'digitalProps', label: 'Digital Props' },
                  { key: 'beautyFilter', label: 'Beauty Filter' },
                  { key: 'watermark', label: 'Watermark' },
                  { key: 'postProcessing', label: 'Post Processing' },
                  { key: 'backgroundRemoval', label: 'Background Removal' },
                  { key: 'survey', label: 'Survey' },
                ].map((feat) => {
                  const isChecked = activeEvent.features[feat.key as keyof typeof activeEvent.features];
                  return (
                    <label key={feat.key} className="flex items-center gap-2 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onUpdateEvent(activeEvent.id, {
                            features: {
                              ...activeEvent.features,
                              [feat.key]: e.target.checked,
                            },
                          })
                        }
                        className="w-3.5 h-3.5 rounded text-pink-600 bg-neutral-900 border-neutral-700"
                      />
                      <span>{feat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sharing Configuration */}
            <div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                Sharing Configuration
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-neutral-400 font-semibold block mb-1">Email Delivery</span>
                  <input
                    type="text"
                    value={activeEvent.sharing.replyTo}
                    onChange={(e) =>
                      onUpdateEvent(activeEvent.id, {
                        sharing: { ...activeEvent.sharing, replyTo: e.target.value },
                      })
                    }
                    placeholder="Reply to: no-reply@..."
                    className="w-full bg-[#161618] border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200"
                  />
                </div>

                <div>
                  <span className="text-neutral-400 font-semibold block mb-1">SMS Texting</span>
                  <input
                    type="text"
                    value={activeEvent.sharing.smsMessage}
                    onChange={(e) =>
                      onUpdateEvent(activeEvent.id, {
                        sharing: { ...activeEvent.sharing, smsMessage: e.target.value },
                      })
                    }
                    placeholder="Message: Here is your photo"
                    className="w-full bg-[#161618] border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: PRINTING & LAYOUT TEMPLATES (Right Column) */}
        <div className="md:col-span-4 p-6 flex flex-col gap-6 bg-[#121214] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-100">Printing</h2>
            <button
              onClick={() => onOpenLayoutEditor(activeEvent.id, activeEvent.selectedTemplateId)}
              className="text-xs text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Open Layout Editor</span>
            </button>
          </div>

          {/* Photo Layout Strip Thumbnails - Clickable to open Layout Editor! */}
          <div className="flex items-start gap-4 p-4 bg-[#18181B] border border-neutral-800/80 rounded-2xl shadow-inner overflow-x-auto">
            {activeEvent.templates.map((tpl) => {
              const isSelected = tpl.id === activeEvent.selectedTemplateId;
              return (
                <div
                  key={tpl.id}
                  onClick={() => onOpenLayoutEditor(activeEvent.id, tpl.id)}
                  className={`group relative flex flex-col items-center cursor-pointer transition-all ${
                    isSelected ? 'scale-105' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Visual Strip Miniature */}
                  <div
                    className={`w-24 sm:w-28 h-64 sm:h-72 rounded-lg border-2 p-1.5 flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                      isSelected
                        ? 'border-pink-500 ring-2 ring-pink-500/40 bg-white'
                        : 'border-neutral-700 bg-neutral-900 group-hover:border-neutral-500'
                    }`}
                  >
                    {/* Top Branding mockup */}
                    <div className="text-center py-1">
                      <div className="text-[7px] font-bold text-sky-800 leading-tight">CARELON</div>
                      <div className="text-[5px] text-sky-600 font-semibold">5 BROKER SERVICES</div>
                    </div>

                    {/* Photo Slots 1, 2, 3 */}
                    <div className="flex flex-col gap-1 my-auto">
                      <div className="h-14 bg-lime-300 border-2 border-purple-600 rounded flex items-center justify-center font-bold text-sm text-neutral-900">
                        1
                      </div>
                      <div className="h-14 bg-sky-200 border-2 border-cyan-500 rounded flex items-center justify-center font-bold text-sm text-neutral-900">
                        2
                      </div>
                      <div className="h-14 bg-amber-200 border-2 border-cyan-500 rounded flex items-center justify-center font-bold text-sm text-neutral-900">
                        3
                      </div>
                    </div>

                    {/* Bottom QR & Credit mockup */}
                    <div className="text-center py-1 bg-neutral-100 rounded">
                      <div className="w-5 h-5 bg-neutral-900 mx-auto rounded-xs" />
                      <div className="text-[5px] text-neutral-600 font-mono mt-0.5">SCAN QR</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-neutral-300 mt-2 truncate max-w-[120px]">
                    {tpl.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {tpl.paperSize} ({tpl.layers.filter((l) => l.type === 'photo_slot').length} poses)
                  </span>

                  {/* Edit Badge overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                    ✏️ Edit Layout
                  </div>
                </div>
              );
            })}
          </div>

          {/* Printing Options (Matches Screenshot 1) */}
          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={activeEvent.printing.printAutomatically}
                onChange={(e) =>
                  onUpdateEvent(activeEvent.id, {
                    printing: {
                      ...activeEvent.printing,
                      printAutomatically: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-pink-600 bg-neutral-900 border-neutral-700"
              />
              <span>Print Automatically</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={activeEvent.printing.displayPrintButton}
                onChange={(e) =>
                  onUpdateEvent(activeEvent.id, {
                    printing: {
                      ...activeEvent.printing,
                      displayPrintButton: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-pink-600 bg-neutral-900 border-neutral-700"
              />
              <span className="font-semibold text-pink-400">Display Print Button</span>
            </label>

            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div>
                <span className="text-neutral-400 block mb-1">Main Printer:</span>
                <input
                  type="text"
                  value={activeEvent.printing.mainPrinter}
                  onChange={(e) =>
                    onUpdateEvent(activeEvent.id, {
                      printing: {
                        ...activeEvent.printing,
                        mainPrinter: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-[#161618] border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono"
                  placeholder="e.g. EPSON L8050 Series or DNP DS620"
                />
              </div>

              <div>
                <span className="text-neutral-400 block mb-1">Secondary Printer:</span>
                <input
                  type="text"
                  value={activeEvent.printing.secondaryPrinter}
                  onChange={(e) =>
                    onUpdateEvent(activeEvent.id, {
                      printing: {
                        ...activeEvent.printing,
                        secondaryPrinter: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-[#161618] border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-400 font-mono"
                  placeholder="Optional backup printer"
                />
              </div>
            </div>

            {/* Launch Big Button */}
            <div className="pt-4">
              <button
                onClick={() => onLaunchEvent(activeEvent.id)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Launch Booth for "{activeEvent.name}"</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
