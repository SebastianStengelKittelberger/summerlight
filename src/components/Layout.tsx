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
    isActive
      ? 'bg-slate-100 text-slate-900 rounded-md px-3 py-1.5 text-sm font-medium'
      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md px-3 py-1.5 text-sm';

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top shell */}
      <header className="flex items-center gap-1 px-4 h-12 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <span className="font-bold text-slate-800 text-sm mr-4">Illusion</span>

        <nav className="flex items-center gap-1">
          <NavLink to="/ukeys" className={navClass}>🔍 Ukeys</NavLink>
          <NavLink to="/configs" className={navClass}>📋 Configs</NavLink>
          <NavLink to="/categories" className={navClass}>🗂 Kategorien</NavLink>
          <NavLink to="/templates" className={navClass}>🎨 Templates</NavLink>
          <NavLink to="/routing" className={navClass}>🗺 Routing</NavLink>
          <NavLink to="/filter-labels" className={navClass}>🔎 Filter-Labels</NavLink>
          <NavLink to="/quality" className={navClass}>📊 Qualität</NavLink>
        </nav>

        <div className="flex-1" />

        <CountryLangSelector />

        <button
          onClick={() => setReindexOpen(true)}
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white text-sm font-medium transition-colors">
          🔄 Reindex
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

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
