import React from 'react';
import { 
  Camera, Code2, Images, Settings, Maximize2, Minimize2, 
  X, Minus, Volume2, VolumeX, Monitor, Calendar, Layers 
} from 'lucide-react';
import { AppTab } from '../types';

interface WindowsTitleBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  eventTitle: string;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  activeTab,
  setActiveTab,
  isFullscreen,
  toggleFullscreen,
  soundEnabled,
  setSoundEnabled,
  eventTitle,
}) => {
  return (
    <header className="bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 text-neutral-300 select-none sticky top-0 z-50">
      {/* Windows 11 Chrome Bar */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-neutral-800/60 text-xs">
        {/* Left: Window Brand */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
            LB
          </div>
          <span className="font-semibold text-neutral-200 tracking-tight">
            LumaBooth Studio (Windows 11)
          </span>
          <span className="text-neutral-500 hidden sm:inline">·</span>
          <span className="text-neutral-400 font-mono text-[11px] truncate max-w-xs hidden sm:inline">
            {eventTitle}
          </span>
        </div>

        {/* Center: System navigation tabs */}
        <nav className="flex items-center gap-1 bg-neutral-950/60 p-0.5 rounded-lg border border-neutral-800/80">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-neutral-800 text-pink-400 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
            <span>Saved Events</span>
          </button>

          <button
            onClick={() => setActiveTab('layout-editor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'layout-editor'
                ? 'bg-neutral-800 text-pink-400 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-pink-500" />
            <span>Layout Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'kiosk'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-rose-500" />
            <span>Live Booth</span>
          </button>

          <button
            onClick={() => setActiveTab('python-source')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'python-source'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Python Windows App</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Images className="w-3.5 h-3.5 text-amber-400" />
            <span>Gallery</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Config</span>
          </button>
        </nav>

        {/* Right: Quick toggles + Windows window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Toggle Fullscreen Kiosk Mode (F11)"
            aria-label="Toggle Kiosk Mode"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Windows Minimize / Maximize / Close Buttons */}
          <button
            className="px-2.5 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            title={isFullscreen ? 'Restore' : 'Maximize'}
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Close PhotoBooth Studio?')) {
                setActiveTab('events');
              }
            }}
            className="px-2.5 py-1 text-neutral-400 hover:bg-rose-600 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
