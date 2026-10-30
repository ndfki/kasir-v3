import React from 'react';
import { Plus, Settings, Layers } from 'lucide-react';
import { Sheet } from '../types';

interface SheetNavProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSelectSheet: (sheetId: string) => void;
  onOpenNewSheetModal: () => void;
  onOpenEditSheetModal: () => void;
}

export const SheetNav: React.FC<SheetNavProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
  onOpenNewSheetModal,
  onOpenEditSheetModal,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
      {/* Sheet Tabs */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto py-1 max-w-full">
        <div className="flex items-center text-slate-400 pl-1 pr-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <Layers className="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sheet:</span>
        </div>

        {sheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          return (
            <button
              key={sheet.id}
              onClick={() => onSelectSheet(sheet.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span>{sheet.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-blue-700/60 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {sheet.rows.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sheet Action Buttons */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={onOpenNewSheetModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Sheet</span>
        </button>

        <button
          onClick={onOpenEditSheetModal}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200/60 dark:border-slate-800 cursor-pointer"
          title="Pengaturan & Edit Nama Sheet"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
