import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  X
} from 'lucide-react';
import { 
  GreenMartProduct, 
  GreenMartTransaction,
  GreenMartUser,
  CashierProfile,
  CashierDutyLog,
  CashierShiftType
} from './types';
import { 
  initialGreenMartProducts, 
  initialGreenMartTransactions 
} from './data/greenmartData';
import { GreenMartNavbar, GreenMartTab } from './components/GreenMartNavbar';
import { GreenMartCashier } from './components/GreenMartCashier';
import { GreenMartInventory } from './components/GreenMartInventory';
import { GreenMartTransactionHistory } from './components/GreenMartTransactionHistory';
import { GreenMartStatisticsDashboard } from './components/GreenMartStatisticsDashboard';
import { GreenMartDeployModal } from './components/GreenMartDeployModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GreenMartLogin } from './components/GreenMartLogin';
import { GreenMartCashierDutyModal } from './components/GreenMartCashierDutyModal';
import { GreenMartConfirmModal } from './components/GreenMartConfirmModal';
import { 
  loadAuthUser, 
  saveAuthUser, 
  clearAuthUser, 
  loadCashiersRoster, 
  saveCashiersRoster, 
  loadActiveCashier, 
  setActiveCashier, 
  loadDutyHistory, 
  ensureUserInRoster 
} from './utils/cashierManager';

const PRODUCTS_STORAGE_KEY = 'greenmart_products_v2';
const TRANSACTIONS_STORAGE_KEY = 'greenmart_transactions_v2';

export default function App() {
  // Load products from localStorage or use rich initial supermarket catalog
  const [products, setProducts] = useState<GreenMartProduct[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load products from storage:', e);
    }
    return initialGreenMartProducts;
  });

  // Load transactions from localStorage or use initial transactions
  const [transactions, setTransactions] = useState<GreenMartTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load transactions from storage:', e);
    }
    return initialGreenMartTransactions;
  });

  // Persist products
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save products:', e);
    }
  }, [products]);

  // Persist transactions
  useEffect(() => {
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Failed to save transactions:', e);
    }
  }, [transactions]);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<GreenMartTab>('cashier');

  // Modals
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCashierDutyModalOpen, setIsCashierDutyModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // User Authentication & Cashier Shift State
  const [currentUser, setCurrentUser] = useState<GreenMartUser | null>(loadAuthUser);
  const [activeCashier, setActiveCashierState] = useState<CashierProfile>(loadActiveCashier);
  const [roster, setRoster] = useState<CashierProfile[]>(loadCashiersRoster);
  const [dutyLogs, setDutyLogs] = useState<CashierDutyLog[]>(loadDutyHistory);

  // Login handler
  const handleLoginSuccess = (user: GreenMartUser, makeActiveCashier: boolean, shift: CashierShiftType) => {
    saveAuthUser(user);
    setCurrentUser(user);

    if (makeActiveCashier) {
      const cashierProfile = ensureUserInRoster(user, shift);
      setActiveCashier(cashierProfile);
      setActiveCashierState(cashierProfile);
      setRoster(loadCashiersRoster());
      setDutyLogs(loadDutyHistory());
      showToast(`Selamat bertugas, ${user.name} (NIS: ${user.nis})! Shift ${shift} aktif.`, 'success');
    } else {
      showToast(`Selamat datang, ${user.name} (NIS: ${user.nis})!`, 'success');
    }
  };

  // Switch active on-duty cashier
  const handleSelectActiveCashier = (cashier: CashierProfile) => {
    setActiveCashier(cashier);
    setActiveCashierState(cashier);
    setRoster(loadCashiersRoster());
    setDutyLogs(loadDutyHistory());
    showToast(`Kasir bertugas diubah menjadi: ${cashier.name} (Shift ${cashier.shift})`, 'success');
  };

  // Add new cashier to roster
  const handleAddNewCashier = (newCashierData: Omit<CashierProfile, 'id' | 'addedAt'>) => {
    const newCashier: CashierProfile = {
      ...newCashierData,
      id: `csh-${Date.now()}`,
      addedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newCashier, ...roster];
    setRoster(updated);
    saveCashiersRoster(updated);

    if (newCashierData.isActiveDuty) {
      setActiveCashier(newCashier);
      setActiveCashierState(newCashier);
      setDutyLogs(loadDutyHistory());
    }
    showToast(`Kasir ${newCashier.name} (NIS: ${newCashier.nis}) berhasil ditambahkan ke sistem!`, 'success');
  };

  // Delete cashier from roster
  const handleDeleteCashier = (cashierId: string) => {
    const updated = roster.filter(c => c.id !== cashierId);
    setRoster(updated);
    saveCashiersRoster(updated);
    showToast('Data kasir telah dihapus dari sistem', 'info');
  };

  // Logout handler
  const handleLogout = () => {
    clearAuthUser();
    setCurrentUser(null);
    setIsLogoutConfirmOpen(false);
    showToast('Anda telah berhasil keluar dari sistem kasir.', 'info');
  };

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('greenmart_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('greenmart_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('greenmart_theme', 'light');
      }
    } catch (e) {
      console.warn('Failed to toggle dark mode:', e);
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      showToast(next ? 'Mode Gelap diaktifkan' : 'Mode Terang diaktifkan', 'info');
      return next;
    });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (isModifier && key === 'k') {
        e.preventDefault();
        setActiveTab('cashier');
        showToast('Beralih ke Layar Kasir POS (Ctrl+K)', 'info');
        return;
      }
      if (isModifier && key === '1') {
        e.preventDefault();
        setActiveTab('cashier');
        return;
      }
      if (isModifier && key === '2') {
        e.preventDefault();
        setActiveTab('inventory');
        return;
      }
      if (isModifier && key === '3') {
        e.preventDefault();
        setActiveTab('history');
        return;
      }
      if (isModifier && key === '4') {
        e.preventDefault();
        setActiveTab('statistics');
        return;
      }
      if (isModifier && key === 'd') {
        e.preventDefault();
        handleToggleTheme();
        return;
      }
      if (isModifier && (key === '/' || key === '?')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }
      if (e.key === 'Escape') {
        setIsDeployModalOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Transaction Completion Handler (Cuts product stock atomicity)
  const handleCompleteTransaction = (newTrx: GreenMartTransaction) => {
    // 1. Cut stock for each item in the transaction
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const itemSold = newTrx.items.find(i => i.productId === prod.id || i.barcode === prod.barcode);
        if (itemSold) {
          const nextStock = Math.max(0, prod.stock - itemSold.qty);
          return {
            ...prod,
            stock: nextStock,
            updatedAt: new Date().toISOString()
          };
        }
        return prod;
      });
    });

    // 2. Prepend transaction to transaction history
    setTransactions(prev => [newTrx, ...prev]);

    showToast(`Transaksi ${newTrx.invoiceNumber} berhasil! Stok telah dipotong.`, 'success');
  };

  // Cancel Transaction Handler (Restores product stock)
  const handleCancelTransaction = (trxId: string) => {
    const trxToCancel = transactions.find(t => t.id === trxId);
    if (!trxToCancel) return;

    // Restore stock
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const itemRestored = trxToCancel.items.find(i => i.productId === prod.id || i.barcode === prod.barcode);
        if (itemRestored) {
          return {
            ...prod,
            stock: prod.stock + itemRestored.qty,
            updatedAt: new Date().toISOString()
          };
        }
        return prod;
      });
    });

    // Remove from transactions
    setTransactions(prev => prev.filter(t => t.id !== trxId));
    showToast(`Transaksi ${trxToCancel.invoiceNumber} dibatalkan & stok dikembalikan`, 'info');
  };

  // Bulk Delete Transactions Handler
  const handleBulkDeleteTransactions = (transactionIds: string[], restoreStock: boolean) => {
    if (transactionIds.length === 0) return;
    const count = transactionIds.length;
    const idSet = new Set(transactionIds);
    const trxsToDelete = transactions.filter(t => idSet.has(t.id));

    if (restoreStock) {
      // Calculate item quantities to restore
      const stockRestoreMap = new Map<string, number>();
      trxsToDelete.forEach(trx => {
        trx.items.forEach(item => {
          const key = item.productId || item.barcode;
          stockRestoreMap.set(key, (stockRestoreMap.get(key) || 0) + item.qty);
        });
      });

      setProducts(prev => prev.map(prod => {
        const restoreQty = (stockRestoreMap.get(prod.id) || 0) + (stockRestoreMap.get(prod.barcode) || 0);
        if (restoreQty > 0) {
          return {
            ...prod,
            stock: prod.stock + restoreQty,
            updatedAt: new Date().toISOString()
          };
        }
        return prod;
      }));
    }

    setTransactions(prev => prev.filter(t => !idSet.has(t.id)));
    showToast(`${count} transaksi terpilih berhasil dihapus${restoreStock ? ' & stok produk dikembalikan' : ''}`, 'info');
  };

  // Settle Receivable Transaction Handler (Pelunasan Piutang)
  const handleSettleTransaction = (
    transactionId: string, 
    settlement: {
      method: 'tunai' | 'qris' | 'transfer';
      amount: number;
      notes?: string;
      cashierName?: string;
    }
  ) => {
    const target = transactions.find(t => t.id === transactionId);
    if (!target) return;

    const now = new Date();
    const settledTimeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          paymentStatus: 'Lunas',
          settledAt: settledTimeStr,
          settledMethod: settlement.method,
          settledAmount: settlement.amount,
          settledNotes: settlement.notes || `Lunas via ${settlement.method.toUpperCase()}`,
          settledByCashier: settlement.cashierName || 'Kasir Utama',
          cashGiven: Math.max(t.grandTotal, settlement.amount),
          changeAmount: Math.max(0, settlement.amount - t.grandTotal)
        };
      }
      return t;
    }));

    showToast(`Pelunasan Piutang nota ${target.invoiceNumber} (${target.customerName}) BERHASIL! Status & struk resmi otomatis diperbarui menjadi LUNAS.`, 'success');
  };

  // Product CRUD
  const handleAddProduct = (newProduct: Omit<GreenMartProduct, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const product: GreenMartProduct = {
      ...newProduct,
      id
    };
    setProducts(prev => [product, ...prev]);
    showToast(`Produk "${product.name}" berhasil ditambahkan ke database`, 'success');
  };

  const handleUpdateProduct = (updated: GreenMartProduct) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    showToast(`Produk "${updated.name}" berhasil diperbarui`, 'success');
  };

  const handleDeleteProduct = (productId: string) => {
    const found = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    showToast(`Produk "${found?.name || ''}" telah dihapus`, 'info');
  };

  // Bulk Delete Products Handler
  const handleBulkDeleteProducts = (productIds: string[]) => {
    if (productIds.length === 0) return;
    const count = productIds.length;
    const idSet = new Set(productIds);
    setProducts(prev => prev.filter(p => !idSet.has(p.id)));
    showToast(`${count} produk berhasil dihapus dari inventori stok`, 'info');
  };

  const handleRestock = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stock: p.stock + quantity,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    const found = products.find(p => p.id === productId);
    showToast(`Stok ${found?.name || ''} ditambah +${quantity} unit`, 'success');
  };

  // Count low stock items
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  
  // Count today's transactions
  const todayStr = new Date().toISOString().split('T')[0];
  const totalTransactionsToday = transactions.filter(t => t.date === todayStr).length;

  // Check login authentication
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900">
        {toast && (
          <div className="fixed top-4 right-4 z-60 animate-in slide-in-from-top-3 duration-200">
            <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white shadow-rose-600/30'
                : 'bg-slate-800 text-white dark:bg-slate-700'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="p-0.5 opacity-80 hover:opacity-100 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <GreenMartLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors overflow-x-hidden w-full max-w-full">
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-4 right-4 z-60 animate-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-600/30'
              : 'bg-slate-800 text-white dark:bg-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-0.5 opacity-80 hover:opacity-100 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navbar */}
      <GreenMartNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lowStockCount={lowStockCount}
        totalTransactionsToday={totalTransactionsToday}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        activeCashier={activeCashier}
        currentUser={currentUser}
        onOpenCashierDutyModal={() => setIsCashierDutyModalOpen(true)}
        onLogout={() => setIsLogoutConfirmOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 w-full min-w-0 overflow-x-hidden">
        
        {activeTab === 'cashier' && (
          <GreenMartCashier
            products={products}
            onCompleteTransaction={handleCompleteTransaction}
            onOpenDeployModal={() => setIsDeployModalOpen(true)}
            onDeleteProduct={handleDeleteProduct}
            onAddProduct={handleAddProduct}
            activeCashier={activeCashier}
            onOpenCashierModal={() => setIsCashierDutyModalOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <GreenMartInventory
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onBulkDeleteProducts={handleBulkDeleteProducts}
            onRestock={handleRestock}
          />
        )}

        {activeTab === 'history' && (
          <GreenMartTransactionHistory
            transactions={transactions}
            onCancelTransaction={handleCancelTransaction}
            onBulkDeleteTransactions={handleBulkDeleteTransactions}
            onSettleTransaction={handleSettleTransaction}
          />
        )}

        {activeTab === 'statistics' && (
          <GreenMartStatisticsDashboard
            products={products}
            transactions={transactions}
            onShowToast={showToast}
          />
        )}

      </main>

      {/* Cashier Duty & Shift Modal */}
      <GreenMartCashierDutyModal
        isOpen={isCashierDutyModalOpen}
        onClose={() => setIsCashierDutyModalOpen(false)}
        activeCashier={activeCashier}
        roster={roster}
        dutyLogs={dutyLogs}
        onSelectActiveCashier={handleSelectActiveCashier}
        onAddNewCashier={handleAddNewCashier}
        onDeleteCashier={handleDeleteCashier}
      />

      {/* Logout Confirm Modal */}
      <GreenMartConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="Keluar dari Sistem Kasir?"
        message={`Apakah Anda yakin ingin logout sebagai ${currentUser?.name} (NIS: ${currentUser?.nis})? Sesi login akan ditutup.`}
        confirmLabel="Ya, Logout"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      {/* Deploy XAMPP & VirtualBox Modal */}
      <GreenMartDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        products={products}
        transactions={transactions}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/aistudio/GM_Logo-ai_f89efb6e.png" 
              alt="GreenMart Logo" 
              className="w-5 h-5 object-contain" 
            />
            <span className="font-bold text-slate-900 dark:text-white">GreenMart</span>
            <span>&bull; Sistem Kasir POS &amp; Rekap Statistik Harian PHP &amp; MySQL</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <button 
              type="button" 
              onClick={() => setIsDeployModalOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Download Source Code XAMPP/VirtualBox (.ZIP)
            </button>
            <span>&bull;</span>
            <button 
              type="button" 
              onClick={() => setIsShortcutsOpen(true)}
              className="hover:underline"
            >
              Shortcuts (Ctrl+/)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
