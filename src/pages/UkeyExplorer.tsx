import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadUkeys } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import type { DTOType, InformationResponse } from '../types';

interface MergedUkey {
  ukey: string;
  inSku: boolean;
  inProduct: boolean;
}

function buildGroup(skuUkeys: string[], productUkeys: string[], filter: string): MergedUkey[] {
  const skuSet = new Set(skuUkeys);
  const productSet = new Set(productUkeys);
  const all = new Set([...skuSet, ...productSet]);
  return [...all]
    .sort((a, b) => a.localeCompare(b))
    .filter(u => !filter || u.toLowerCase().includes(filter.toLowerCase()))
    .map(ukey => ({ ukey, inSku: skuSet.has(ukey), inProduct: productSet.has(ukey) }));
}

function UkeyTable({
  rows,
  onUkeyClick,
}: {
  rows: MergedUkey[];
  onUkeyClick: (ukey: string, dtoType: DTOType) => void;
}) {
  if (rows.length === 0) return (
    <p className="text-sm text-slate-400 italic py-2 px-4">Keine Ukeys in dieser Gruppe</p>
  );
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(({ ukey, inSku, inProduct }, i) => (
          <tr key={ukey} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
            <td className="px-4 py-1.5 font-mono text-slate-800">{ukey}</td>
            <td className="px-3 py-1.5 text-center w-20">
              {inSku && (
                <button onClick={() => onUkeyClick(ukey, 'SKU')}
                  className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs px-2.5 py-0.5 rounded-full transition-colors">
                  SKU
                </button>
              )}
            </td>
            <td className="px-3 py-1.5 text-center w-24">
              {inProduct && (
                <button onClick={() => onUkeyClick(ukey, 'PRODUCT')}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs px-2.5 py-0.5 rounded-full transition-colors">
                  PRODUCT
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function UkeyExplorer() {
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const navigate = useNavigate();

  const [sku, setSku] = useState('');
  const [result, setResult] = useState<InformationResponse | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadUkeys(country, language, sku || undefined);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const handleUkeyClick = (ukey: string, dtoType: DTOType) => {
    navigate(`/editor?ukey=${encodeURIComponent(ukey)}&dtoType=${dtoType}`);
  };

  const mappedRows    = result ? buildGroup(result.mappedSkuUkeys ?? [], result.mappedProductUkeys ?? [], filter) : [];
  const unmappedRows  = result ? buildGroup(result.unmappedSkuUkeys ?? [], result.unmappedProductUkeys ?? [], filter) : [];
  const totalMapped   = mappedRows.length;
  const totalUnmapped = unmappedRows.length;

  return (
    <div className="p-6 max-w-4xl mx-auto overflow-auto h-full">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Ukey Explorer</h2>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-slate-700 mb-1">SKU (optional)</label>
          <input type="text" value={sku}
            onChange={(e) => setSku(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="z.B. 12345678"
            className="border border-slate-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <button onClick={handleLoad} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm disabled:opacity-50">
          {loading ? 'Laden…' : 'Ukeys laden'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {result && (
        <>
          <div className="mb-4 flex items-center gap-4">
            <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
              placeholder="Ukeys filtern…"
              className="border border-slate-300 rounded px-3 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <span className="text-sm text-slate-500 whitespace-nowrap">
              {totalMapped} gemappt · {totalUnmapped} nicht gemappt
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Mapped */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="font-semibold text-sm text-green-800">Gemappt</span>
                <span className="ml-auto text-xs text-green-600 font-medium">{totalMapped}</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <UkeyTable rows={mappedRows} onUkeyClick={handleUkeyClick} />
              </div>
            </div>

            {/* Unmapped */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="font-semibold text-sm text-amber-800">Nicht gemappt</span>
                <span className="ml-auto text-xs text-amber-600 font-medium">{totalUnmapped}</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <UkeyTable rows={unmappedRows} onUkeyClick={handleUkeyClick} />
              </div>
            </div>
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🔑</p>
          <p className="text-sm">Klicke „Ukeys laden" um Ukeys abzurufen</p>
        </div>
      )}
    </div>
  );
}

