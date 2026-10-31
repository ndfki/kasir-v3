import React, { useState } from 'react';
import { 
  LogIn, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  User,
  Hash,
  GraduationCap
} from 'lucide-react';
import { GreenMartUser, CashierShiftType } from '../types';

interface GreenMartLoginProps {
  onLoginSuccess: (user: GreenMartUser, makeActiveCashier: boolean, shift: CashierShiftType) => void;
}

export const GreenMartLogin: React.FC<GreenMartLoginProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [shift, setShift] = useState<CashierShiftType>('Pagi');
  const [makeActiveCashier, setMakeActiveCashier] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanNis = nis.trim();
    const cleanClass = studentClass.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Silakan masukkan Nama Lengkap Anda (minimal 2 karakter).');
      return;
    }

    if (!cleanNis || cleanNis.length < 3) {
      setErrorMessage('Silakan masukkan NIS (Nomor Induk Siswa) yang valid.');
      return;
    }

    if (!cleanClass || cleanClass.length < 2) {
      setErrorMessage('Silakan masukkan Kelas Petugas Kasir (contoh: XII BDP 1 atau XI AKL 2).');
      return;
    }

    const newUser: GreenMartUser = {
      name: cleanName,
      nis: cleanNis,
      studentClass: cleanClass,
      role: 'kasir',
      loginTime: new Date().toISOString()
    };

    onLoginSuccess(newUser, makeActiveCashier, shift);
  };

  const handleQuickLogin = (demoName: string, demoNis: string, demoClass: string, demoShift: CashierShiftType) => {
    onLoginSuccess({
      name: demoName,
      nis: demoNis,
      studentClass: demoClass,
      role: 'kasir',
      loginTime: new Date().toISOString()
    }, true, demoShift);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-3 sm:p-4 text-slate-100">
      
      {/* Decorative background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[380px] h-[380px] bg-emerald-500/10 rounded-full blur-3xl -top-16 -left-16 absolute"></div>
        <div className="w-[380px] h-[380px] bg-teal-500/10 rounded-full blur-3xl -bottom-16 -right-16 absolute"></div>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md z-10">
        
        {/* Brand Card Header - Compact */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1.5 shadow-lg shadow-emerald-500/20 border-2 border-emerald-400 mb-2 group hover:scale-105 transition-transform">
            <img 
              src="/assets/aistudio/GM_Logo-ai_f89efb6e.png" 
              alt="GreenMart Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              GreenMart
            </h1>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
              POS Kasir
            </span>
          </div>

          <p className="text-[11px] text-emerald-300/80 font-medium mt-0.5">
            Sistem Kasir Barcode &amp; Rekap Statistik Koperasi
          </p>
        </div>

        {/* Login Main Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Login Petugas Kasir</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
              Sesi Aktif
            </span>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Input Nama */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-400" />
                <span>Nama Lengkap Kasir</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dewi Sartika"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            {/* 2-Column Grid: NIS & Kelas */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* Input NIS */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 truncate">
                  <Hash className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>NIS</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="20241001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              {/* Input Kelas */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 truncate">
                  <GraduationCap className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Kelas</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="XII BDP 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

            </div>

            {/* Shift Duty Option */}
            <div className="space-y-1 pt-0.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Shift Jaga Hari Ini</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Pagi', 'Siang', 'Sore', 'Full Day'] as CashierShiftType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition border cursor-pointer text-center ${
                      shift === s
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Set as Active Cashier Toggle */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={makeActiveCashier}
                  onChange={(e) => setMakeActiveCashier(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-700 border-slate-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-medium text-slate-200">
                  Tugaskan sebagai kasir aktif pada struk &amp; laporan
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Sistem Kasir</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Streamlined Quick Demo Login Row */}
            <div className="pt-2 border-t border-slate-800 text-center space-y-1">
              <p className="text-[10px] text-slate-400">Pilih akun kasir cepat:</p>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Kasir Utama', '20249999', 'Koperasi', 'Full Day')}
                  className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-[10.5px] font-bold transition cursor-pointer"
                >
                  ⚡ Kasir Utama
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Dewi Sartika', '20241001', 'XII BDP 1', 'Pagi')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10.5px] font-medium transition cursor-pointer"
                >
                  Dewi S. (XII BDP)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Budi Santoso', '20241002', 'XI AKL 2', 'Siang')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10.5px] font-medium transition cursor-pointer"
                >
                  Budi S. (XI AKL)
                </button>
              </div>
            </div>

          </form>

        </div>

        {/* System Info Footer */}
        <div className="mt-3 text-center text-xs text-slate-400 space-y-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-slate-400 text-[11px]">Sistem Kasir Mandiri &amp; Terenkripsi</span>
          </div>
          <p className="text-[10px] text-slate-500">
            GreenMart POS &bull; Koperasi Siswa &bull; Kab. Batang
          </p>
        </div>

      </div>

    </div>
  );
};
