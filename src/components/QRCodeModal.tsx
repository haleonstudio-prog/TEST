import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Download, Check } from 'lucide-react';

interface QRCodeModalProps {
  dataUrl: string;
  onClose: () => void;
  eventTitle: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  dataUrl,
  onClose,
  eventTitle,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    // Generate QR code pointing to data or session link
    QRCode.toDataURL(dataUrl.length > 2000 ? window.location.href : dataUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#18181B',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR generation failed:', err));
  }, [dataUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          Scan to Download on Phone
        </h3>
        <p className="text-xs text-neutral-400 mt-1 mb-6">
          Open your iPhone or Android camera app and scan the QR code to save your {eventTitle} photostrip!
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mx-auto mb-6">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="Scan QR Code"
              className="w-56 h-56 object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-neutral-400 font-mono text-xs">
              Generating QR Code...
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors border border-neutral-700"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Kiosk Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
