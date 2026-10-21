import React, { useState } from 'react';
import { 
  FileCode, Download, Copy, Check, Terminal, Cpu, Printer, 
  ExternalLink, Play, HelpCircle, Layers, FolderDown 
} from 'lucide-react';
import JSZip from 'jszip';
import { PYTHON_PHOTOBOOTH_FILES, PythonFile } from '../data/pythonProject';

export const PythonWindowsHub: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'terminal' | 'hardware'>('code');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Microsoft Windows [Version 10.0.22631.3296]',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
    'C:\\PhotoboothApp> python --version',
    'Python 3.11.4',
    'C:\\PhotoboothApp> _'
  ]);
  const [isSimulatingRun, setIsSimulatingRun] = useState<boolean>(false);

  const currentFile: PythonFile = PYTHON_PHOTOBOOTH_FILES[selectedFileIndex] || PYTHON_PHOTOBOOTH_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder('photobooth_windows_python');

      PYTHON_PHOTOBOOTH_FILES.forEach((file) => {
        folder?.file(file.name, file.content);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photobooth_windows_python_app.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const runTerminalSimulation = () => {
    if (isSimulatingRun) return;
    setIsSimulatingRun(true);
    setActiveSubTab('terminal');

    const steps = [
      'C:\\PhotoboothApp> pip install -r requirements.txt',
      'Requirement already satisfied: opencv-python>=4.8.0',
      'Requirement already satisfied: PyQt6>=6.5.0',
      'Requirement already satisfied: Pillow>=10.0.0',
      'Requirement already satisfied: pywin32>=306',
      '',
      'C:\\PhotoboothApp> python photobooth_pro.py',
      '[INIT] Loading config.json...',
      '[CAMERA] Initializing cv2.VideoCapture(0, cv2.CAP_DSHOW)...',
      '[CAMERA] Camera opened: 1920x1080 @ 30fps [DirectShow OK]',
      '[PRINTER] Win32Print detected default: "DNP DS620 (2x6 Cut)"',
      '[GUI] PyQt6 Touch Window mounted in Fullscreen Kiosk Mode.',
      '[READY] Photobooth is ready for guests. Press Space or Touch to begin.',
    ];

    setTerminalLogs([
      'Microsoft Windows [Version 10.0.22631.3296]',
      '(c) Microsoft Corporation. All rights reserved.',
      '',
    ]);

    steps.forEach((line, index) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, line]);
        if (index === steps.length - 1) {
          setIsSimulatingRun(false);
        }
      }, (index + 1) * 350);
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              Native Windows Desktop App
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-xs text-neutral-400">Python 3.10+ / PyQt6 / OpenCV</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Windows Python Photobooth Software Center
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            A production-ready Python desktop application with DirectShow webcam capture, touch UI, countdown overlay, customizable photostrips, and native Windows print spooler integration.
          </p>
        </div>

        {/* Global Download Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg text-sm cursor-pointer active:scale-95"
          >
            <FolderDown className="w-4 h-4" />
            <span>{isZipping ? 'Packaging ZIP...' : 'Download Project (.ZIP)'}</span>
          </button>

          <button
            onClick={runTerminalSimulation}
            disabled={isSimulatingRun}
            className="flex items-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl transition-all border border-neutral-700 text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Test Run Script</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveSubTab('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeSubTab === 'code'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileCode className="w-4 h-4 text-blue-400" />
          <span>Source Code Viewer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('terminal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeSubTab === 'terminal'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Windows Command Prompt</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hardware')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeSubTab === 'hardware'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Windows Hardware Setup Guide</span>
        </button>
      </div>

      {/* SUB-TAB 1: SOURCE CODE VIEWER */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File list sidebar */}
          <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-lg flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-2 py-1">
              Project Files
            </span>
            {PYTHON_PHOTOBOOTH_FILES.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full flex flex-col items-start p-2.5 rounded-xl text-left transition-all ${
                  selectedFileIndex === idx
                    ? 'bg-blue-600/10 border border-blue-500 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-medium font-mono text-neutral-200">
                  <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                  {file.description}
                </div>
              </button>
            ))}

            <div className="mt-4 pt-3 border-t border-neutral-800 px-2">
              <span className="text-[11px] text-neutral-400 leading-relaxed block">
                Compile to native Windows executable:
              </span>
              <code className="text-[11px] font-mono text-amber-400 bg-neutral-950 px-2 py-1 rounded block mt-1">
                double click build_exe.bat
              </code>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-9 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="font-mono font-semibold text-neutral-200">{currentFile.name}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-400 hidden sm:inline">{currentFile.description}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadSingleFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-mono"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Body with Line Numbers */}
            <div className="p-4 overflow-x-auto max-h-[640px] font-mono text-xs leading-relaxed text-neutral-300">
              <pre className="whitespace-pre">
                <code>
                  {currentFile.content.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row">
                      <span className="table-cell text-neutral-600 select-none pr-4 text-right w-10">
                        {idx + 1}
                      </span>
                      <span className="table-cell">{line || ' '}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WINDOWS TERMINAL SIMULATION */}
      {activeSubTab === 'terminal' && (
        <div className="bg-black border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-neutral-200 font-semibold">
                Windows Command Prompt (cmd.exe)
              </span>
            </div>
            <button
              onClick={runTerminalSimulation}
              disabled={isSimulatingRun}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded text-xs font-mono font-medium"
            >
              <Play className="w-3 h-3" />
              <span>{isSimulatingRun ? 'Running...' : 'Re-run python photobooth_pro.py'}</span>
            </button>
          </div>

          <div className="p-6 font-mono text-xs sm:text-sm text-neutral-300 leading-relaxed min-h-[380px] space-y-1">
            {terminalLogs.map((log, index) => (
              <div
                key={index}
                className={
                  log.startsWith('[SUCCESS]')
                    ? 'text-emerald-400 font-bold'
                    : log.startsWith('[ERROR]')
                    ? 'text-rose-400 font-bold'
                    : log.startsWith('C:\\')
                    ? 'text-neutral-100 font-semibold'
                    : log.includes('OK') || log.includes('ready')
                    ? 'text-emerald-300'
                    : 'text-neutral-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: HARDWARE SETUP GUIDE */}
      {activeSubTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">1. Windows DirectShow Cameras</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              The Python app uses <code className="text-amber-400">cv2.CAP_DSHOW</code> for native Windows camera driver acceleration. Tested with:
            </p>
            <ul className="text-xs text-neutral-300 space-y-2 list-disc list-inside">
              <li>Logitech Brio 4K / C920 HD Pro</li>
              <li>Razer Kiyo Pro (Low light HDR)</li>
              <li>Elgato Facecam & Cam Link 4K</li>
              <li>Canon EOS Rebel / R-Series via DigiCamControl virtual driver</li>
            </ul>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">2. Thermal Dye-Sub Photo Printers</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Direct spooling via Windows <code className="text-amber-400">win32print</code>. Prints in ~8 seconds with instant dry protective gloss:
            </p>
            <ul className="text-xs text-neutral-300 space-y-2 list-disc list-inside">
              <li>DNP DS620A (Enable 2-inch auto-cut)</li>
              <li>DNP RX1HS High-Capacity</li>
              <li>HiTi P525L Wireless/USB</li>
              <li>Sinfonia CS2 Compact Booth Printer</li>
            </ul>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">3. Building Standalone Windows .EXE</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Package into an executable so your venue booth boots without needing Python installed on the host PC:
            </p>
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[11px] text-neutral-300">
              pyinstaller --noconfirm --windowed photobooth_pro.py
            </div>
            <p className="text-[11px] text-neutral-500 mt-3">
              Included batch script <code className="text-blue-400">build_exe.bat</code> does this automatically!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
