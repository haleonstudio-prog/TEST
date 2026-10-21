import React from 'react';
import { HistoryStrip } from '../types';
import { Printer, Download, QrCode, Trash2, Camera, Clock } from 'lucide-react';

interface GalleryTabProps {
  gallery: HistoryStrip[];
  onClearGallery: () => void;
  onOpenQR: (dataUrl: string) => void;
  onSelectStrip: (dataUrl: string) => void;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({
  gallery,
  onClearGallery,
  onOpenQR,
}) => {
  const handleDownload = (strip: HistoryStrip) => {
    const a = document.createElement('a');
    a.href = strip.previewUrl;
    a.download = `photobooth_strip_${strip.timestamp}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = (previewUrl: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html>
        <head><title>Photobooth Print</title></head>
        <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;">
          <img src="${previewUrl}" style="max-height:100vh;width:auto;" />
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Session Photo Gallery
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {gallery.length} photostrip(s) captured during this booth runtime.
          </p>
        </div>

        {gallery.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all session photos from local storage?')) {
                onClearGallery();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-neutral-800 rounded-xl text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Gallery History</span>
          </button>
        )}
      </div>

      {/* Gallery Grid */}
      {gallery.length === 0 ? (
        <div className="bg-neutral-900/60 border border-dashed border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-300">
            No session photos yet
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mt-1">
            Switch to the Live Booth tab to take your first photo strip! All finished photos will automatically be saved and viewable here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col transition-all hover:border-neutral-700"
            >
              {/* Thumbnail Container */}
              <div className="bg-black/60 rounded-xl p-2 flex items-center justify-center aspect-1/2 overflow-hidden mb-3">
                <img
                  src={item.previewUrl}
                  alt="Saved Photo Strip"
                  className="max-h-full w-auto object-contain rounded"
                />
              </div>

              {/* Strip Meta */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-3 px-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className="capitalize">{item.filter}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 mt-auto pt-2 border-t border-neutral-800/80">
                <button
                  onClick={() => handlePrint(item.previewUrl)}
                  className="flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs transition-colors"
                  title="Print this strip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Print</span>
                </button>

                <button
                  onClick={() => handleDownload(item)}
                  className="flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs transition-colors"
                  title="Save PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[11px]">PNG</span>
                </button>

                <button
                  onClick={() => onOpenQR(item.previewUrl)}
                  className="flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs transition-colors"
                  title="Mobile QR"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="text-[11px]">QR</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
