import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Receipt, 
  BarChart3, 
  Download, 
  Moon, 
  Sun, 
  HelpCircle,
  UserCheck,
  LogOut,
  User
} from 'lucide-react';
import { CashierProfile, GreenMartUser } from '../types';
import { LiveClock } from './LiveClock';

export type GreenMartTab = 'cashier' | 'inventory' | 'history' | 'statistics';

interface GreenMartNavbarProps {
  activeTab: GreenMartTab;
  onSelectTab: (tab: GreenMartTab) => void;
  lowStockCount: number;
  totalTransactionsToday: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenDeployModal: () => void;
  onOpenShortcuts: () => void;
  activeCashier?: CashierProfile;
  currentUser?: GreenMartUser | null;
  onOpenCashierDutyModal?: () => void;
  onLogout?: () => void;
}

export const GreenMartNavbar: React.FC<GreenMartNavbarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  totalTransactionsToday,
  isDarkMode,
  onToggleTheme,
  onOpenDeployModal,
  onOpenShortcuts,
  activeCashier,
  currentUser,
  onOpenCashierDutyModal,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 w-full">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => onSelectTab('cashier')} 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
              <img 
                src="/assets/aistudio/GM_Logo-ai_f89efb6e.png" 
                alt="GreenMart Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                  GreenMart
                </h1>
                <span className="px-2 py-0.5 rounded-md text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  POS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium hidden sm:block">
                Sistem Kasir Barcode &amp; Statistik Harian
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            
            <button
              type="button"
              onClick={() => onSelectTab('cashier')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cashier'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Kasir POS</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('inventory')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Stok</span>
              {lowStockCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'inventory' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Riwayat</span>
              {totalTransactionsToday > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'history' ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {totalTransactionsToday}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('statistics')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'statistics'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik</span>
            </button>

          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2">
            
            {/* Active Cashier Shift Badge (Desktop / Tablet) */}
            {activeCashier && onOpenCashierDutyModal && (
              <button
                type="button"
                onClick={onOpenCashierDutyModal}
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/80 text-slate-800 dark:text-emerald-100 text-xs transition cursor-pointer shadow-xs group"
                title={`Kasir yang bertugas: ${activeCashier.name} (${activeCashier.studentClass || 'Siswa'}) - Shift ${activeCashier.shift}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Kasir:</span>
                <strong className="font-extrabold text-emerald-800 dark:text-emerald-300 group-hover:underline max-w-[130px] truncate">
                  {activeCashier.name}
                </strong>
                {activeCashier.studentClass && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                    {activeCashier.studentClass}
                  </span>
                )}
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">
                  {activeCashier.shift}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline ml-0.5">
                  Ganti
                </span>
              </button>
            )}

            {/* Deploy XAMPP / VirtualBox Button */}
            <button
              type="button"
              onClick={onOpenDeployModal}
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
              title="Download Source Code PHP & Database SQL untuk XAMPP / VirtualBox"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Download ZIP</span>
              <span className="lg:hidden">ZIP</span>
            </button>

            {/* Shortcuts Guide Button */}
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Shortcut Keyboard"
            >
              <HelpCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* User Session & Logout */}
            {currentUser && onLogout && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onOpenCashierDutyModal}
                  className="hidden sm:flex flex-col text-left px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title={`Petugas login: ${currentUser.name} - Kelas: ${currentUser.studentClass || '-'} (NIS: ${currentUser.nis})`}
                >
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name} {currentUser.studentClass ? `(${currentUser.studentClass})` : ''}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 leading-tight">
                    NIS: {currentUser.nis}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer"
                  title="Keluar / Logout Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile & Tablet Subheader: Active Cashier & Live Moving Clock */}
        <div className="flex lg:hidden items-center justify-between py-1.5 px-1 border-t border-slate-100 dark:border-slate-800/60 text-xs gap-2">
          {activeCashier && onOpenCashierDutyModal ? (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <strong className="font-extrabold text-slate-900 dark:text-white text-xs truncate max-w-[110px] sm:max-w-[180px]">
                {activeCashier.name}
              </strong>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                {activeCashier.shift}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>GreenMart POS</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <LiveClock variant="compact" />
            {activeCashier && onOpenCashierDutyModal && (
              <button
                type="button"
                onClick={onOpenCashierDutyModal}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                title="Ganti Kasir"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ganti</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold">
          <button
            onClick={() => onSelectTab('cashier')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl ${
              activeTab === 'cashier' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-500'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Kasir</span>
          </button>

          <button
            onClick={() => onSelectTab('inventory')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl relative ${
              activeTab === 'inventory' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-500'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Stok</span>
            {lowStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-3" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl ${
              activeTab === 'history' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-500'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span>Riwayat</span>
          </button>

          <button
            onClick={() => onSelectTab('statistics')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl ${
              activeTab === 'statistics' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistik</span>
          </button>
        </div>

      </div>
    </header>
  );
};
