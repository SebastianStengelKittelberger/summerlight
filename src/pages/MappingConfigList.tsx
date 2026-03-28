import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { loadMappingConfig, saveMappingConfig, applyMappingConfig } from '../api/client';
import type { MapConfig } from '../types';

export default function MappingConfigList() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevContext = useRef({ country, language });

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

  const handleApply = async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      await applyMappingConfig(country, language, configs);
      setApplyResult('✅ Erfolgreich angewendet');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Anwenden';
      setApplyResult(`❌ ${msg}`);
    } finally {
      setApplying(false);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(configs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapping-config-${country}-${language}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as MapConfig[];
        setConfigs(parsed);
      } catch {
        setError('Ungültiges JSON-Format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveAll = async () => {
    try {
      await saveMappingConfig(country, language, configs);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Speichern fehlgeschlagen';
      setError(msg);
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-semibold text-slate-800">Mapping Configs</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/editor')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Neue Config
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm font-medium"
          >
            📥 Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={handleExport}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm font-medium"
          >
            📤 Export JSON
          </button>
          <button
            onClick={handleSaveAll}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm font-medium"
          >
            💾 Speichern
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {applying ? 'Anwenden…' : '🚀 Alle anwenden'}
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

      {configs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p>Keine Konfigurationen vorhanden</p>
          <button
            onClick={() => navigate('/editor')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Erste Config anlegen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="border-collapse w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Ukey</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">DTO Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Mapping Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Target Field</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Field Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Target</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Fallback</th>
                <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config, index) => (
                <tr
                  key={`${config.ukey}-${index}`}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                >
                  <td className="px-4 py-2.5 border-b border-slate-100 font-mono text-xs text-slate-700">
                    {config.ukey}
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-100">
                    <Badge type={config.dtoType} />
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
                  <td className="px-4 py-2.5 border-b border-slate-100 text-slate-500 text-xs">
                    {config.target ?? '—'}
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
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded"
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

      <p className="text-xs text-slate-400 mt-3">{configs.length} Konfiguration(en)</p>
    </div>
  );
}

function Badge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    PRODUCT: 'bg-blue-100 text-blue-700',
    SKU: 'bg-orange-100 text-orange-700',
    CATEGORY: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  );
}
