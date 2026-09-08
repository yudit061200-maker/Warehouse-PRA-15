import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PRALogo } from './PRALogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with App Branding */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-black text-white p-6 relative border-b border-red-900/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <PRALogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white leading-tight">Install PRA Inventory</h3>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-bold">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Aplikasi Gudang & Pemindai QR di Layar Utama HP
              </p>
            </div>
          </div>

          {/* Quick value badges */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-200">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Buka Instan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Layar Penuh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Kamera Cepat</span>
            </div>
          </div>
        </div>

        {/* Device Switcher (Android vs iOS) */}
        <div className="p-6 space-y-5">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">PRA Inventory Sudah Terinstall!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Aplikasi ini sudah terpasang di perangkat Anda dan dapat diakses langsung dari layar utama.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* If browser supports native install prompt */}
              {isInstallable && (
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-red-600" />
                      Instalasi Otomatis Tersedia
                    </span>
                    <span className="text-[11px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full">1-Klik</span>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-yellow-300" />
                    {isInstalling ? 'Memproses Instalasi...' : 'Pasang Aplikasi Sekarang di Smartphone'}
                  </button>
                </div>
              )}

              {/* OS Tabs Guide */}
              <div className="space-y-3">
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'android'
                        ? 'bg-white text-slate-900 shadow-xs border-b-2 border-red-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Android (Chrome / Browser)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'ios'
                        ? 'bg-white text-slate-900 shadow-xs border-b-2 border-red-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>iPhone / iPad (Safari)</span>
                  </button>
                </div>

                {/* Android Steps */}
                {activeTab === 'android' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-700">
                        <strong className="text-slate-900 block font-semibold mb-0.5">
                          Buka di Browser Google Chrome
                        </strong>
                        Pastikan link aplikasi dibuka langsung di Google Chrome atau browser bawaan smartphone Anda.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-700">
                        <strong className="text-slate-900 block font-semibold mb-0.5">
                          Ketuk Menu Titik Tiga (⋮) di Pojok Kanan Atas
                        </strong>
                        Klik menu opsi browser di bar atas Chrome.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-700">
                        <strong className="text-slate-900 block font-semibold mb-0.5">
                          Pilih "Install Aplikasi" atau "Tambahkan ke Layar Utama"
                        </strong>
                        Ikon PRA akan otomatis muncul di menu aplikasi/layar utama HP Anda seperti aplikasi Play Store.
                      </div>
                    </div>
                  </div>
                )}

                {/* iOS Safari Steps */}
                {activeTab === 'ios' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-700">
                        <strong className="text-slate-900 block font-semibold mb-0.5">
                          Buka di Browser Safari iPhone / iPad
                        </strong>
                        Apple mewajibkan penggunaan browser Safari untuk proses penambahan ke layar utama.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-700 flex-1">
                        <strong className="text-slate-900 block font-semibold mb-0.5 flex items-center gap-1.5">
                          Ketuk Tombol Share <Share className="w-3.5 h-3.5 text-red-600 inline" /> di Toolbar Bawah
                        </strong>
                        Tombol kotak dengan tanda panah ke atas di bagian tengah bawah layar Safari.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-700 flex-1">
                        <strong className="text-slate-900 block font-semibold mb-0.5 flex items-center gap-1.5">
                          Pilih "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-red-600 inline" /> lalu ketuk "Add"
                        </strong>
                        Gulir menu ke bawah dan pilih Tambah ke Layar Utama. Ikon PRA akan siap digunakan di Home Screen!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Mendukung Android, iOS, Windows & Mac
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
