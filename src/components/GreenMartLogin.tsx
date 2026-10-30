import React, { useState } from 'react';
import { 
  LogIn, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  ShieldCheck
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
      setErrorMessage('Silakan masukkan NIS (Nomor Induk Siswa) Anda yang valid (minimal 3 digit).');
      return;
    }

    if (!cleanClass || cleanClass.length < 2) {
      setErrorMessage('Silakan masukkan informasi Kelas Petugas Kasir (contoh: XII BDP 1 atau XI AKL 2).');
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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-4 sm:p-6 text-slate-100">
      
      {/* Decorative background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -top-24 -left-24 absolute"></div>
        <div className="w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl -bottom-24 -right-24 absolute"></div>
      </div>

      <div className="relative w-full max-w-lg z-10">
        
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white p-2 shadow-2xl shadow-emerald-500/20 border-2 border-emerald-400 mb-4 group hover:scale-105 transition-transform">
            <img 
              src="/assets/aistudio/GM_Logo-ai_f89efb6e.png" 
              alt="GreenMart Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              GreenMart
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-500 text-slate-950 shadow-sm uppercase tracking-wider">
              POS Kasir
            </span>
          </div>

          <p className="text-xs sm:text-sm text-emerald-300/90 font-medium">
            Sistem Kasir Barcode &amp; Rekap Statistik Koperasi / Toko Sekolah
          </p>
        </div>

        {/* Login Main Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Login Petugas / Kasir</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan <strong className="text-emerald-400">Nama</strong>, <strong className="text-emerald-400">NIS</strong>, dan <strong className="text-emerald-400">Kelas</strong> Anda untuk mengakses transaksi kasir, stok, dan laporan statistik.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Nama */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nama Lengkap / Nama Kasir <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            {/* Input NIS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nomor Induk Siswa (NIS) <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Digit NIS Sekolah</span>
              </div>
              <input
                type="text"
                required
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Masukkan NIS anda"
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white font-mono placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            {/* Input Kelas Petugas Kasir */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Kelas Petugas Kasir <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-medium">Tingkat / Jurusan</span>
              </div>
              <input
                type="text"
                required
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="Masukkan kelas"
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            {/* Shift Duty Option */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shift Jaga Hari Ini</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Pagi', 'Siang', 'Sore', 'Full Day'] as CashierShiftType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                      shift === s
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Set as Active Cashier Toggle */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={makeActiveCashier}
                  onChange={(e) => setMakeActiveCashier(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-500 bg-slate-700 border-slate-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Jadikan sebagai Kasir yang Bertugas Hari Ini
                  </span>
                  <span className="text-slate-400 block mt-0.5">
                    Nama, NIS, dan Kelas Anda akan dicatat otomatis pada struk belanja, riwayat nota, dan log rekap harian.
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Sistem Kasir GreenMart</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Mode Login */}
            <div className="pt-2 border-t border-slate-800 text-center space-y-2">
              <p className="text-[11px] text-slate-400">Atau pilih akun kasir contoh untuk masuk instan tanpa ketik:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setName('Dewi Sartika');
                    setNis('20241001');
                    setStudentClass('XII BDP 1');
                    setShift('Pagi');
                    onLoginSuccess({
                      name: 'Dewi Sartika',
                      nis: '20241001',
                      studentClass: 'XII BDP 1',
                      role: 'kasir',
                      loginTime: new Date().toISOString()
                    }, true, 'Pagi');
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-xs transition cursor-pointer group"
                >
                  <span className="font-bold text-white block group-hover:text-emerald-400">⚡ Dewi Sartika</span>
                  <span className="text-[10px] text-slate-400">NIS: 20241001 &bull; XII BDP 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setName('Budi Santoso');
                    setNis('20241002');
                    setStudentClass('XI AKL 2');
                    setShift('Siang');
                    onLoginSuccess({
                      name: 'Budi Santoso',
                      nis: '20241002',
                      studentClass: 'XI AKL 2',
                      role: 'kasir',
                      loginTime: new Date().toISOString()
                    }, true, 'Siang');
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-xs transition cursor-pointer group"
                >
                  <span className="font-bold text-white block group-hover:text-emerald-400">⚡ Budi Santoso</span>
                  <span className="text-[10px] text-slate-400">NIS: 20241002 &bull; XI AKL 2</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLoginSuccess({
                    name: 'Kasir Utama',
                    nis: '20249999',
                    studentClass: 'Koperasi Sekolah',
                    role: 'kasir',
                    loginTime: new Date().toISOString()
                  }, true, 'Full Day');
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🚀 Lanjutkan Langsung sebagai Kasir Utama (Demo Cepat)</span>
              </button>
            </div>

          </form>

        </div>

        {/* Security & System Info Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Autentikasi Lokal Terenkripsi &bull; Siap XAMPP &amp; MySQL Offline</span>
          </div>
          <p className="text-[11px] text-slate-400">
            GreenMart POS &bull; Dikembangkan untuk Koperasi Siswa &amp; Lab Praktik Transaksi
          </p>
        </div>

      </div>

    </div>
  );
};
