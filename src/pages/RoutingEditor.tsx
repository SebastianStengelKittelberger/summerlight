import { useEffect, useState } from 'react';
import { loadRoutes, saveRoutes, listPages } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import type { RouteConfig, PageType } from '../types';

const PAGE_TYPES: { value: PageType; label: string }[] = [
  { value: 'CMS_PAGE', label: '📄 CMS-Seite' },
  { value: 'PRODUCT_PAGE', label: '🛒 Produktseite' },
  { value: 'CATEGORY_PAGE', label: '🗂 Kategorieseite' },
];

const emptyRoute = (): RouteConfig => ({
  url: '',
  pageType: 'CMS_PAGE',
  pageName: '',
  label: '',
});

export default function RoutingEditor() {
  const { country, language } = useAppStore();
  const showToast = useAppStore(s => s.showToast);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<RouteConfig>(emptyRoute());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadRoutes(country, language),
      listPages(country, language),
    ])
      .then(([r, p]) => { setRoutes(r); setPages(p); })
      .catch(() => showToast('Fehler beim Laden der Routen', 'error'))
      .finally(() => setLoading(false));
  }, [country, language]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveRoutes(country, language, routes);
      showToast('Routen gespeichert');
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditDraft({ ...routes[index] });
  }

  function startAdd() {
    setEditingIndex(routes.length);
    setEditDraft(emptyRoute());
  }

  function commitEdit() {
    if (!editDraft.url || !editDraft.pageName) {
      showToast('URL und Seitenname sind Pflichtfelder', 'error');
      return;
    }
    const updated = [...routes];
    updated[editingIndex!] = editDraft;
    setRoutes(updated);
    setEditingIndex(null);
  }

  function deleteRoute(index: number) {
    setRoutes(routes.filter((_, i) => i !== index));
  }

  const moonlightBase = `http://localhost:8078/moonlight/${country}/${language}`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">🗺 URL-Routing</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pfade auf Seiten mappen — pflegbar ohne Code-Änderung
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startAdd}
            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
            + Route hinzufügen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium disabled:opacity-50">
            {saving ? 'Speichert…' : '💾 Speichern'}
          </button>
        </div>
      </div>

      {/* Base URL hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-500 font-mono">
        Basis-URL: <span className="text-slate-700">{moonlightBase}</span><span className="text-violet-600">/&lt;url&gt;</span>
      </div>

      {/* Route table */}
      {loading ? (
        <p className="text-sm text-slate-400 italic py-8 text-center">Lädt…</p>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Label</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">URL-Pfad</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Typ</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Seite</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 italic text-xs">
                    Noch keine Routen konfiguriert
                  </td>
                </tr>
              )}
              {routes.map((route, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 text-slate-700">{route.label || <span className="text-slate-300 italic">–</span>}</td>
                  <td className="px-4 py-2.5 font-mono text-violet-700">
                    <a
                      href={`${moonlightBase}${route.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline">
                      {route.url}
                    </a>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      route.pageType === 'CMS_PAGE'
                        ? 'bg-blue-100 text-blue-700'
                        : route.pageType === 'CATEGORY_PAGE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {PAGE_TYPES.find(t => t.value === route.pageType)?.label ?? route.pageType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{route.pageName}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => startEdit(i)}
                      className="text-xs text-violet-600 hover:text-violet-800 mr-3">
                      ✏ Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteRoute(i)}
                      className="text-xs text-red-400 hover:text-red-600">
                      🗑 Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Add modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">
              {editingIndex < routes.length ? 'Route bearbeiten' : 'Neue Route'}
            </h2>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Label (Anzeigename)</span>
                <input
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="z.B. Über uns"
                  value={editDraft.label}
                  onChange={e => setEditDraft({ ...editDraft, label: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-600">URL-Pfad *</span>
                <input
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="z.B. /ueber-uns oder /products/{sku}"
                  value={editDraft.url}
                  onChange={e => setEditDraft({ ...editDraft, url: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Platzhalter in geschweifte Klammern, z.B. <code>/products/&#123;sku&#125;</code>
                </p>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-600">Typ *</span>
                <select
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  value={editDraft.pageType}
                  onChange={e => setEditDraft({ ...editDraft, pageType: e.target.value as PageType })}>
                  {PAGE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {editDraft.pageType === 'PRODUCT_PAGE' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Der URL-Pfad muss <code>&#123;sku&#125;</code> enthalten, z.B. <code>/products/&#123;sku&#125;</code>
                  </p>
                )}
                {editDraft.pageType === 'CATEGORY_PAGE' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Der URL-Pfad muss <code>&#123;categoryUkey&#125;</code> enthalten, z.B. <code>/kategorien/&#123;categoryUkey&#125;</code>
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-600">Seite (Page) *</span>
                <select
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  value={editDraft.pageName}
                  onChange={e => setEditDraft({ ...editDraft, pageName: e.target.value })}>
                  <option value="">– Seite wählen –</option>
                  {pages.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingIndex(null)}
                className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-700">
                Abbrechen
              </button>
              <button
                onClick={commitEdit}
                className="px-4 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white font-medium">
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
