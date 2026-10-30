import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Clock, 
  Plus, 
  Check, 
  Trash2, 
  History, 
  ShieldCheck, 
  Calendar, 
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { CashierProfile, CashierDutyLog, CashierShiftType } from '../types';

interface GreenMartCashierDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCashier: CashierProfile;
  roster: CashierProfile[];
  dutyLogs: CashierDutyLog[];
  onSelectActiveCashier: (cashier: CashierProfile) => void;
  onAddNewCashier: (newCashier: Omit<CashierProfile, 'id' | 'addedAt'>) => void;
  onDeleteCashier?: (cashierId: string) => void;
}

export const GreenMartCashierDutyModal: React.FC<GreenMartCashierDutyModalProps> = ({
  isOpen,
  onClose,
  activeCashier,
  roster,
  dutyLogs,
  onSelectActiveCashier,
  onAddNewCashier,
  onDeleteCashier
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'add' | 'logs'>('roster');
  
  // New cashier form state
  const [newName, setNewName] = useState('');
  const [newNis, setNewNis] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [newShift, setNewShift] = useState<CashierShiftType>('Pagi');
  const [newPhone, setNewPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateCashier = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = newName.trim();
    const cleanNis = newNis.trim();
    const cleanClass = newStudentClass.trim();

    if (!cleanName || cleanName.length < 2) {
      setFormError('Nama kasir wajib diisi (minimal 2 karakter).');
      return;
    }

    if (!cleanNis || cleanNis.length < 3) {
      setFormError('NIS kasir wajib diisi (minimal 3 digit).');
      return;
    }

    if (!cleanClass || cleanClass.length < 2) {
      setFormError('Kelas kasir wajib diisi (minimal 2 karakter, contoh: XII BDP 1).');
      return;
    }

    // Check duplicate NIS
    const duplicate = roster.find(c => c.nis === cleanNis);
    if (duplicate) {
      setFormError(`Kasir dengan NIS ${cleanNis} sudah terdaftar (${duplicate.name}).`);
      return;
    }

    onAddNewCashier({
      name: cleanName,
      nis: cleanNis,
      studentClass: cleanClass,
      shift: newShift,
      phone: newPhone.trim() || undefined,
      isActiveDuty: true
    });

    setNewName('');
    setNewNis('');
    setNewStudentClass('');
    setNewPhone('');
    setActiveTab('roster');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Kasir yang Bertugas Hari Ini &amp; Seterusnya
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur siapa kasir yang berjaga, ganti shift harian, atau tambah data kasir baru
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Cashier Highlight Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">
                Kasir Aktif Saat Ini (On Duty)
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black flex flex-wrap items-center gap-2">
              <span>{activeCashier.name}</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-white/20 text-white">
                NIS: {activeCashier.nis}
              </span>
              {activeCashier.studentClass && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-400/40">
                  Kelas: {activeCashier.studentClass}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100">
              Shift: <strong>{activeCashier.shift}</strong> &bull; Setiap transaksi yang dilakukan akan dicatat atas nama kasir ini.
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between text-xs text-emerald-100 font-mono">
            <span>Hari Ini: {new Date().toISOString().split('T')[0]}</span>
            <span className="bg-emerald-800/60 px-2.5 py-1 rounded-lg mt-1 font-bold text-white">
              Status: Siap Melayani
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50/50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roster'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pilih Kasir ({roster.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'add'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kasir Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Shift ({dutyLogs.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: ROSTER / PILIH KASIR */}
          {activeTab === 'roster' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Pilih salah satu kasir di bawah ini untuk bertugas:</span>
                <span className="font-mono">{roster.length} Kasir Terdaftar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roster.map((cashier) => {
                  const isCurrent = cashier.id === activeCashier.id || (cashier.nis === activeCashier.nis && cashier.name === activeCashier.name);

                  return (
                    <div
                      key={cashier.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {cashier.name}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider shrink-0 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Bertugas</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300">
                            NIS: {cashier.nis}
                          </span>
                          {cashier.studentClass && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800/60">
                              {cashier.studentClass}
                            </span>
                          )}
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Shift {cashier.shift}
                          </span>
                        </div>

                        {cashier.phone && (
                          <p className="text-[11px] text-slate-400">
                            HP: {cashier.phone}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        {isCurrent ? (
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Kasir Aktif Sekarang</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectActiveCashier(cashier);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-900 hover:text-white dark:hover:text-white font-bold text-xs transition cursor-pointer text-center"
                          >
                            Pilih Kasir Ini
                          </button>
                        )}

                        {onDeleteCashier && !isCurrent && roster.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteCashier(cashier.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                            title="Hapus kasir ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TAMBAH KASIR BARU */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateCashier} className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block">Tambah Petugas / Kasir Baru:</span>
                Kasir baru yang didaftarkan akan tersimpan permanen di sistem untuk hari ini dan hari-hari seterusnya.
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Nama Lengkap Kasir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  NIS (Nomor Induk Siswa) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNis}
                  onChange={(e) => setNewNis(e.target.value)}
                  placeholder="Masukkan NIS anda"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Kelas Petugas Kasir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  placeholder="Masukkan kelas"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Shift Jaga
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Pagi', 'Siang', 'Sore', 'Full Day'] as CashierShiftType[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewShift(s)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                        newShift === s
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Nomor HP / WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="masukkan nomor anda"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Kasir Baru &amp; Langsung Jadikan Aktif</span>
              </button>
            </form>
          )}

          {/* TAB 3: RIWAYAT SHIFT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Daftar log pergantian kasir yang bertugas tercatat otomatis di sistem:
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-800/50">
                {dutyLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Belum ada catatan riwayat shift.
                  </div>
                ) : (
                  dutyLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5">
                          <span>{log.cashierName}</span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            (NIS: {log.cashierNis})
                          </span>
                          {log.studentClass && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                              {log.studentClass}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                            Shift {log.shift}
                          </span>
                          <span>Tanggal: {log.date}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        <div>Mulai: {log.startedAt} WIB</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tersimpan di sistem GreenMart (Local &amp; MySQL Compatible)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Selesai &amp; Tutup
          </button>
        </div>

      </div>

    </div>
  );
};
