import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import CountryLangSelector from './CountryLangSelector';
import ReindexModal from './ReindexModal';
import { useAppStore } from '../store/useAppStore';

export default function Layout() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);
  const [reindexOpen, setReindexOpen] = useState(false);
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded text-sm font-medium transition-colors ${
      isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white tracking-tight">Illusion UI</h1>
          <p className="text-xs text-slate-400 mt-0.5">Data Mapping System</p>
        </div>
        <div className="border-b border-slate-700">
          <CountryLangSelector />
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          <NavLink to="/ukeys" className={navClass}>
            🔍 Ukey Explorer
          </NavLink>
          <NavLink to="/configs" className={navClass}>
            📋 Mapping Configs
          </NavLink>
          <NavLink to="/templates" className={navClass}>
            🎨 Templates
          </NavLink>
        </nav>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={() => setReindexOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-blue-700 text-slate-300 hover:text-white text-sm font-medium transition-colors mb-3">
            🔄 Re-Indexieren
          </button>
          <p className="text-xs text-slate-500">Illusion v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>

      {/* Toast */}
      {toast && (
        <div
          onClick={clearToast}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-white text-sm cursor-pointer transition-all
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {reindexOpen && <ReindexModal onClose={() => setReindexOpen(false)} />}
    </div>
  );
}
