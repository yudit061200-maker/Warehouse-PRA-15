import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  RefreshCw,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  title?: string;
}

function playScanBeep() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.debug('Audio beep unavailable:', e);
  }
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  onClose,
  title = 'Pemindai Barcode & QR Code',
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'interactive-barcode-scanner-box';

  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          playScanBeep();
          setLastScanned(buffer);
          onScanSuccess(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScanSuccess]);

  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        setErrorMessage(null);
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('belakang') ||
              d.label.toLowerCase().includes('environment')
          );
          const chosen = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosen);
        } else {
          setErrorMessage(
            'Kamera tidak terdeteksi. Anda tetap dapat menggunakan input manual atau scanner USB.'
          );
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage(
          'Izin akses kamera ditolak atau tidak tersedia di browser ini.'
        );
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
        scannerRef.current.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    let isSubscribed = true;

    const startScan = async () => {
      try {
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        }

        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          selectedCameraId,
          {
            fps: 15,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.33,
          },
          (decodedText) => {
            if (!isSubscribed) return;
            playScanBeep();
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
          },
          () => {}
        );

        if (isSubscribed) {
          setIsScanning(true);
          setErrorMessage(null);
        }
      } catch (err: any) {
        if (isSubscribed) {
          setIsScanning(false);
          setErrorMessage(
            'Gagal membuka feed kamera. Pastikan izin kamera aktif.'
          );
        }
      }
    };

    startScan();

    return () => {
      isSubscribed = false;
    };
  }, [selectedCameraId, onScanSuccess]);

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    playScanBeep();
    setLastScanned(manualInput.trim());
    onScanSuccess(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4.5 py-3.5 bg-slate-800/80 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-slate-100 text-xs md:text-sm">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={handleSwitchCamera}
              className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Ganti Kamera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti Kamera</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative bg-black min-h-[260px] flex items-center justify-center">
        <div id={containerId} className="w-full max-w-md mx-auto" />

        {isScanning && !errorMessage && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-60 h-32 border-2 border-dashed border-emerald-400/80 rounded-xl relative animate-pulse flex items-center justify-center">
              <div className="w-full h-0.5 bg-rose-500/80 absolute shadow-[0_0_8px_#f43f5e]" />
            </div>
            <p className="mt-3 text-[11px] font-medium text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-xs">
              Arahkan barcode / QR code ke dalam kotak
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-6 text-center max-w-sm">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300 mb-2">{errorMessage}</p>
            <p className="text-[11px] text-slate-400">
              Gunakan form manual di bawah atau sambungkan pemindai barcode USB.
            </p>
          </div>
        )}
      </div>

      {/* Last Scanned Feedback */}
      {lastScanned && (
        <div className="px-4 py-2 bg-emerald-950/80 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Terdeteksi:{' '}
              <strong className="font-mono text-emerald-300">
                {lastScanned}
              </strong>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
            Berhasil Scan
          </span>
        </div>
      )}

      {/* Manual Input Form */}
      <div className="p-3 bg-slate-800/80 border-t border-slate-700/60">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Ketik Barcode / SKU manual (atau enter scanner)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Cari / Input
          </button>
        </form>
      </div>
    </div>
  );
};
