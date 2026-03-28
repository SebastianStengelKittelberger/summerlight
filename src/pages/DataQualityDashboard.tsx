import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { loadMappingConfig, loadDataQuality, loadSkuValues } from '../api/client';
import type { SkuValue } from '../api/client';
import type { DataQuality, MapConfig } from '../types';

interface DQResult extends DataQuality {
  percent: number;   // parsed numeric value 0–100
  loading: boolean;
  error: boolean;
}

function parsePercent(raw: string): number {
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*%/);
  return match ? Math.round(parseFloat(match[1])) : 0;
}

function colorForPercent(p: number): string {
  if (p >= 80) return 'bg-emerald-500';
  if (p >= 50) return 'bg-amber-400';
  return 'bg-red-500';
}

function badgeForPercent(p: number): string {
  if (p >= 80) return 'bg-emerald-100 text-emerald-700';
  if (p >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function DataQualityDashboard() {
  const { country, language } = useAppStore();
  const navigate = useNavigate();
  const [results, setResults] = useState<DQResult[]>([]);
  const [mappingConfigs, setMappingConfigs] = useState<MapConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [ukeyFilter, setUkeyFilter] = useState('');
  const [activeTab, setActiveTab] = useState<Record<string, 'missing' | 'values'>>({});
  const [skuValues, setSkuValues] = useState<Record<string, SkuValue[]>>({});
  const [valuesLoading, setValuesLoading] = useState<Record<string, boolean>>({});
  const [valueFilter, setValueFilter] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    setResults([]);
    setExpanded(new Set());

    loadMappingConfig(country, language)
      .then(configs => {
        setMappingConfigs(configs);
        const ukeys = [...new Set(configs.map(c => c.ukey))];
        const placeholders: DQResult[] = ukeys.map(ukey => ({
          ukey,
          percentage: '',
          skusWithoutUkey: [],
          percent: -1,
          loading: true,
          error: false,
        }));
        setResults(placeholders);
        setLoading(false);

        // Fetch data quality for each ukey in parallel
        ukeys.forEach(ukey => {
          loadDataQuality(country, language, ukey)
            .then(dq => {
              setResults(prev => prev.map(r =>
                r.ukey === ukey
                  ? { ...dq, percent: parsePercent(dq.percentage), loading: false, error: false }
                  : r
              ));
            })
            .catch(() => {
              setResults(prev => prev.map(r =>
                r.ukey === ukey ? { ...r, loading: false, error: true } : r
              ));
            });
        });
      })
      .catch(() => setLoading(false));
  }, [country, language]);

  const sorted = [...results]
    .filter(r => !ukeyFilter || r.ukey.toLowerCase().includes(ukeyFilter.toLowerCase()))
    .sort((a, b) => {
      if (a.loading !== b.loading) return a.loading ? 1 : -1;
      return a.percent - b.percent;
    });

  const done = results.filter(r => !r.loading && !r.error).length;
  const total = results.length;
  const avgPercent = total > 0
    ? Math.round(results.filter(r => !r.loading).reduce((s, r) => s + r.percent, 0) / Math.max(done, 1))
    : 0;

  function toggleExpanded(ukey: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(ukey) ? next.delete(ukey) : next.add(ukey);
      return next;
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Datenqualität</h1>
        <p className="text-sm text-slate-500 mt-1">
          {country.toUpperCase()} / {language} — Vollständigkeit je gemapptem UKEY
        </p>
      </div>

      {/* Summary cards */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">UKEYs geprüft</p>
            <p className="text-3xl font-bold text-slate-800">{done}<span className="text-base font-normal text-slate-400"> / {total}</span></p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Ø Vollständigkeit</p>
            <p className={`text-3xl font-bold ${avgPercent >= 80 ? 'text-emerald-600' : avgPercent >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
              {done > 0 ? `${avgPercent}%` : '…'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Kritisch (&lt; 50%)</p>
            <p className="text-3xl font-bold text-red-600">
              {results.filter(r => !r.loading && r.percent < 50).length}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      {total > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={ukeyFilter}
            onChange={e => setUkeyFilter(e.target.value)}
            placeholder="UKEY suchen…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">MappingConfig wird geladen…</p>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-3">
        {sorted.map(row => {
          const isOpen = expanded.has(row.ukey);
          const filteredSkus = row.skusWithoutUkey;

          return (
            <div key={row.ukey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Row header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => !row.loading && !row.error && toggleExpanded(row.ukey)}
              >
                {/* UKEY name + edit button */}
                <div className="flex items-center gap-1.5 w-44 shrink-0">
                  <span className="font-mono text-sm font-semibold text-slate-700 truncate">{row.ukey}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const cfg = mappingConfigs.find(c => c.ukey === row.ukey);
                      navigate(`/editor?ukey=${encodeURIComponent(row.ukey)}&dtoType=${cfg?.dtoType ?? 'SKU'}`);
                    }}
                    title="Mapping bearbeiten"
                    className="shrink-0 text-slate-300 hover:text-indigo-500 transition-colors text-xs"
                  >✏</button>
                </div>

                {/* Progress bar */}
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  {row.loading ? (
                    <div className="h-full bg-slate-200 animate-pulse w-full" />
                  ) : row.error ? (
                    <div className="h-full bg-slate-200 w-full" />
                  ) : (
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colorForPercent(row.percent)}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  )}
                </div>

                {/* Badge */}
                <div className="w-20 text-right shrink-0">
                  {row.loading ? (
                    <span className="text-xs text-slate-300">…</span>
                  ) : row.error ? (
                    <span className="text-xs text-red-400">Fehler</span>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeForPercent(row.percent)}`}>
                      {row.percent}%
                    </span>
                  )}
                </div>

                {/* Missing count + chevron */}
                {!row.loading && !row.error && row.skusWithoutUkey.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0 text-slate-400">
                    <span className="text-xs">{row.skusWithoutUkey.length} fehlend</span>
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
                {!row.loading && !row.error && row.skusWithoutUkey.length === 0 && (
                  <span className="text-xs text-emerald-500 shrink-0">✓ vollständig</span>
                )}
              </div>

              {/* Expandable section with tabs */}
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50">
                  {/* Tab buttons */}
                  <div className="flex gap-1 px-5 pt-3 pb-0">
                    <button
                      onClick={() => setActiveTab(prev => ({ ...prev, [row.ukey]: 'missing' }))}
                      className={`px-3 py-1 rounded-t text-xs font-medium border-b-2 transition-colors ${
                        (activeTab[row.ukey] ?? 'missing') === 'missing'
                          ? 'border-red-400 text-red-700 bg-red-50'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ❌ Fehlend ({row.skusWithoutUkey.length})
                    </button>
                    <button
                      onClick={async () => {
                        setActiveTab(prev => ({ ...prev, [row.ukey]: 'values' }));
                        if (!skuValues[row.ukey] && !valuesLoading[row.ukey]) {
                          setValuesLoading(prev => ({ ...prev, [row.ukey]: true }));
                          try {
                            const vals = await loadSkuValues(country, language, row.ukey);
                            setSkuValues(prev => ({ ...prev, [row.ukey]: vals }));
                          } catch {
                            setSkuValues(prev => ({ ...prev, [row.ukey]: [] }));
                          } finally {
                            setValuesLoading(prev => ({ ...prev, [row.ukey]: false }));
                          }
                        }
                      }}
                      className={`px-3 py-1 rounded-t text-xs font-medium border-b-2 transition-colors ${
                        activeTab[row.ukey] === 'values'
                          ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ✅ Vorhanden ({skuValues[row.ukey]?.length ?? '…'})
                    </button>
                  </div>

                  <div className="px-5 py-3">
                    {(activeTab[row.ukey] ?? 'missing') === 'missing' ? (
                      <>
                        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                          SKUs ohne „{row.ukey}"
                        </p>
                        {filteredSkus.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Alle SKUs haben diesen UKEY</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                            {filteredSkus.map(sku => (
                              <span
                                key={sku}
                                className="font-mono text-xs bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                                onClick={() => navigator.clipboard.writeText(sku)}
                                title="Klicken zum Kopieren"
                              >
                                {sku}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {valuesLoading[row.ukey] ? (
                          <div className="flex items-center justify-center h-16">
                            <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                SKUs mit „{row.ukey}"
                              </p>
                              <input
                                type="text"
                                placeholder="Wert filtern…"
                                value={valueFilter[row.ukey] ?? ''}
                                onChange={e => setValueFilter(prev => ({ ...prev, [row.ukey]: e.target.value }))}
                                className="ml-auto border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              />
                            </div>
                            {(() => {
                              const vals = (skuValues[row.ukey] ?? [])
                                .filter(sv => !valueFilter[row.ukey] || sv.value.toLowerCase().includes(valueFilter[row.ukey].toLowerCase()))
                                .sort((a, b) => a.value.localeCompare(b.value));
                              return vals.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Keine Treffer</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                                  {vals.map(sv => (
                                    <span
                                      key={sv.sku}
                                      className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded px-2 py-0.5 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                                      onClick={() => navigator.clipboard.writeText(sv.sku)}
                                      title="Klicken zum Kopieren"
                                    >
                                      <span className="font-mono text-slate-600">{sv.sku}</span>
                                      <span className="text-slate-400">·</span>
                                      <span className="text-slate-700">{sv.value}</span>
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!loading && total === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">Keine MappingConfig für {country.toUpperCase()}/{language} gefunden.</p>
        </div>
      )}
    </div>
  );
}
