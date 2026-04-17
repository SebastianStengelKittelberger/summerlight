import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { loadFilterConfig, loadFilterLabels, saveFilterLabels } from '../api/client';
import type { FilterConfigEntry } from '../types';

export default function FilterLabelEditor() {
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const showToast = useAppStore((s) => s.showToast);

  const [entries, setEntries] = useState<FilterConfigEntry[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!country || !language) return;
    setLoading(true);
    Promise.all([
      loadFilterConfig(country, language),
      loadFilterLabels(country, language),
    ])
      .then(([configs, savedLabels]) => {
        setEntries(configs);
        // Merge saved labels over defaults (ukey as fallback)
        const merged: Record<string, string> = {};
        configs.forEach((e) => {
          merged[e.ukey] = savedLabels[e.ukey] ?? e.label ?? e.ukey;
        });
        setLabels(merged);
      })
      .catch(() => showToast('Fehler beim Laden der Filter-Labels', 'error'))
      .finally(() => setLoading(false));
  }, [country, language]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFilterLabels(country, language, labels);
      showToast('Filter-Labels gespeichert');
    } catch {
      showToast('Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 text-sm">Lade Filter-Konfiguration…</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-slate-500 text-sm">
        Keine aktiven Filter konfiguriert. Filter im MapConfig-Editor aktivieren.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Filter-Labels</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Anzeigebezeichnungen für die aktiven Filter ({country.toUpperCase()}/{language})
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 w-1/3">UKey</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 w-1/4">Typ</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.ukey} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs font-semibold text-slate-800">{entry.ukey}</span>
                    <span className="text-[10px] text-slate-400">{entry.targetField}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                    ${entry.filterConfig.filterType === 'PREDICATE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'}`}>
                    {entry.filterConfig.filterType}
                  </span>
                  {entry.filterConfig.group && (
                    <span className="ml-1.5 text-[10px] text-slate-400">{entry.filterConfig.group}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={labels[entry.ukey] ?? ''}
                    onChange={(e) => setLabels({ ...labels, [entry.ukey]: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder={entry.ukey}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
