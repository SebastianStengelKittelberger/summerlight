import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { loadMappingConfig, saveMappingConfig, applyCategoryMappingConfig } from '../api/client';
import type { MapConfig } from '../types';

export default function CategoryMappingList() {
  const navigate = useNavigate();
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const configs = useAppStore((s) => s.configs);
  const setConfigs = useAppStore((s) => s.setConfigs);
  const deleteConfig = useAppStore((s) => s.deleteConfig);
  const duplicateConfig = useAppStore((s) => s.duplicateConfig);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  const prevContext = useRef({ country, language });

  // Category configs are the subset of the shared store with target === 'CATEGORY'
  const categoryConfigs = configs
    .map((c, i) => ({ config: c, index: i }))
    .filter(({ config }) => config.target === 'CATEGORY');

  useEffect(() => {
    const changed =
      prevContext.current.country !== country || prevContext.current.language !== language;
    prevContext.current = { country, language };

    if (!changed && configs.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    loadMappingConfig(country, language)
      .then((data) => setConfigs(data))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Ladefehler';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [country, language]);

  const handleApplyCategories = async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      await saveMappingConfig(country, language, configs);
      await applyCategoryMappingConfig(country, language, categoryConfigs.map((e) => e.config));
      setApplyResult('✅ Kategorien erfolgreich indexiert');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Indexieren';
      setApplyResult(`❌ ${msg}`);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">⏳ Lade Konfigurationen…</div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">🗂 Kategorie-Mapping</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configs mit <code className="bg-purple-50 text-purple-700 px-1 rounded">target: CATEGORY</code> — werden separat indexiert
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/editor?target=CATEGORY&dtoType=CATEGORY')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Neue Config
          </button>
          <button
            onClick={handleApplyCategories}
            disabled={applying || categoryConfigs.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {applying ? 'Indexiert…' : '🚀 Kategorien indexieren'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}
      {applyResult && (
        <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-3 mb-4 text-sm">
          {applyResult}
        </div>
      )}

      {/* Info box */}
      <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 mb-5 text-xs text-purple-800 space-y-1">
        <p><strong>Datenfluss:</strong></p>
        <p>
          bosch.adapter <code className="bg-white px-1 rounded">POST /index/categories</code>
          {' → '}<em>bosch-categories-{'{c}-{l}'}</em>
          {' → '}Illusion indexiert
          {' → '}<em>illusion-categories-{'{c}-{l}'}</em>
          {' → '}Moonlight rendert <code className="bg-white px-1 rounded">/category-{'{ukey}'}</code>
        </p>
        <p className="text-purple-600 mt-1">
          Zuerst bosch.adapter Kategorie-Index anstoßen, dann hier „Kategorien indexieren" klicken.
        </p>
      </div>

      {categoryConfigs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">🗂</p>
          <p>Noch keine Kategorie-Configs vorhanden</p>
          <button
            onClick={() => navigate('/editor?target=CATEGORY&dtoType=CATEGORY')}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Erste Kategorie-Config anlegen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="border-collapse w-full text-sm">
            <thead>
              <tr className="bg-purple-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-purple-100">Ukey</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-purple-100">DTO Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-purple-100">Mapping Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-purple-100">Target Field</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-purple-100">Field Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-purple-100">Fallback</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-purple-100">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {categoryConfigs.map(({ config, index }, rowIdx) => (
                <tr
                  key={`${config.ukey}-${index}`}
                  className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'}
                >
                  <td className="px-4 py-2.5 border-b border-slate-100 font-mono text-xs text-slate-700">
                    {config.ukey}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {config.dtoType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100 text-slate-600">
                    {config.mappingType}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100 text-slate-600">
                    {config.targetField}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100 text-slate-500 text-xs">
                    {config.targetFieldType ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100 text-center">
                    {config.isFallback ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/editor?index=${index}`)}
                        className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => duplicateConfig(index)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded"
                      >
                        Duplizieren
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Config "${config.ukey}" wirklich löschen?`)) {
                            deleteConfig(index);
                          }
                        }}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-3">{categoryConfigs.length} Kategorie-Config(s)</p>
    </div>
  );
}
