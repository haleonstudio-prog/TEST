import React from 'react';
import { PhotoboothSettings } from '../types';
import { 
  Settings, Monitor, Printer, Camera, ShieldCheck, 
  RotateCcw, Save, Check 
} from 'lucide-react';

interface SettingsTabProps {
  settings: PhotoboothSettings;
  onUpdateSettings: (newSettings: Partial<PhotoboothSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Booth & Hardware Configuration
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Customize event branding, camera preferences, and Windows print spooler behavior.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Reset all settings to factory default?')) {
              onResetDefaults();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 1: EVENT BRANDING & TEXT */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/80">
            <Monitor className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Event Branding
            </h2>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Event Title (Printed on strip footer)
            </label>
            <input
              type="text"
              value={settings.eventTitle}
              onChange={(e) => onUpdateSettings({ eventTitle: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
              placeholder="e.g. Sarah & Alex Wedding"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Event Subtitle / Tagline
            </label>
            <input
              type="text"
              value={settings.eventSubtitle}
              onChange={(e) => onUpdateSettings({ eventSubtitle: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-rose-500"
              placeholder="e.g. Celebration of Love"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Custom Date Stamp
            </label>
            <input
              type="text"
              value={settings.eventDate}
              onChange={(e) => onUpdateSettings({ eventDate: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={settings.showDate}
              onChange={(e) => onUpdateSettings({ showDate: e.target.checked })}
              className="w-4 h-4 rounded text-rose-600 bg-neutral-950 border-neutral-700"
            />
            <span className="text-xs text-neutral-300 font-medium">Display Date on Photostrip Footer</span>
          </label>
        </div>

        {/* SECTION 2: CAMERA & CAPTURE SETTINGS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/80">
            <Camera className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Camera & Countdown
            </h2>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Countdown Seconds per Take
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 8].map((sec) => (
                <button
                  key={sec}
                  onClick={() => onUpdateSettings({ countdownSeconds: sec })}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    settings.countdownSeconds === sec
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {sec} SECONDS
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
              <div>
                <div className="text-xs font-medium text-neutral-200">Mirror Camera View</div>
                <div className="text-[11px] text-neutral-500">Horizontal flip for natural guest mirror reflection</div>
              </div>
              <input
                type="checkbox"
                checked={settings.mirrorCamera}
                onChange={(e) => onUpdateSettings({ mirrorCamera: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
              <div>
                <div className="text-xs font-medium text-neutral-200">Camera Flash Effect</div>
                <div className="text-[11px] text-neutral-500">Full screen whiteout flash at snapshot moment</div>
              </div>
              <input
                type="checkbox"
                checked={settings.flashEnabled}
                onChange={(e) => onUpdateSettings({ flashEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
              <div>
                <div className="text-xs font-medium text-neutral-200">Web Audio Sound FX</div>
                <div className="text-[11px] text-neutral-500">Shutter click, countdown pings, and printer sounds</div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700"
              />
            </label>
          </div>
        </div>

        {/* SECTION 3: WINDOWS PRINTER & SPOOLER */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/80">
            <Printer className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Windows Printer Spooler
            </h2>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Windows Printer Device Name
            </label>
            <input
              type="text"
              value={settings.printerName}
              onChange={(e) => onUpdateSettings({ printerName: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="e.g. DNP DS620 (or leave empty for default)"
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Leave blank to automatically route to the Windows Default Printer.
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Print Copies per Take
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => onUpdateSettings({ copiesPerSession: num })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    settings.copiesPerSession === num
                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {num} {num === 1 ? 'Copy (Single)' : 'Copies (Double Strip)'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
            <div>
              <div className="text-xs font-medium text-neutral-200">Auto-Print on Review</div>
              <div className="text-[11px] text-neutral-500">Automatically trigger print spooling when photos finish</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoPrint}
              onChange={(e) => onUpdateSettings({ autoPrint: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500 bg-neutral-950 border-neutral-700"
            />
          </label>
        </div>

        {/* SECTION 4: KIOSK LOCK SECURITY */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/80">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Kiosk Security & Admin Lock
            </h2>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">
              Admin Exit PIN Code
            </label>
            <input
              type="password"
              maxLength={6}
              value={settings.kioskPin}
              onChange={(e) => onUpdateSettings({ kioskPin: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
              placeholder="e.g. 1234"
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Used in the Python app to prevent guests from closing the fullscreen kiosk.
            </span>
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-300 leading-relaxed">
            💡 <strong>Kiosk Tip:</strong> Press <code className="bg-blue-950 px-1.5 py-0.5 rounded text-white font-mono">F11</code> in Windows to enter native borderless kiosk mode.
          </div>
        </div>
      </div>
    </div>
  );
};
