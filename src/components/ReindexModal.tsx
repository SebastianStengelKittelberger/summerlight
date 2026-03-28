import { useState } from 'react';
import { loadMappingConfig, applyMappingConfig } from '../api/client';
import { useAppStore } from '../store/useAppStore';

const KNOWN_COUNTRIES = ['de', 'us', 'gb', 'fr', 'es', 'it', 'pl', 'nl', 'at', 'ch'];
const KNOWN_LANGUAGES = ['de', 'en', 'fr', 'es', 'it', 'pl', 'nl'];

interface Props {
  onClose: () => void;
}

type Status = 'idle' | 'loading-config' | 'indexing' | 'done' | 'error';

export default function ReindexModal({ onClose }: Props) {
  const { country: storeCountry, language: storeLanguage, showToast } = useAppStore();

  const [country, setCountry] = useState(storeCountry);
  const [language, setLanguage] = useState(storeLanguage);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resultCount, setResultCount] = useState<number | null>(null);

  async function handleReindex() {
    setStatus('loading-config');
    setErrorMsg('');
    setResultCount(null);
    try {
      const configs = await loadMappingConfig(country, language);
      if (!configs || configs.length === 0) {
        setErrorMsg(`Keine MappingConfig für ${country.toUpperCase()}/${language} gefunden.`);
        setStatus('error');
        return;
      }
      setStatus('indexing');
      const result = await applyMappingConfig(country, language, configs);
      const count = result && typeof result === 'object' ? Object.keys(result).length : null;
      setResultCount(count);
      setStatus('done');
      showToast(`Re-Index ${country.toUpperCase()}/${language} abgeschlossen${count != null ? ` (${count} Produkte)` : ''}`);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Unbekannter Fehler');
      setStatus('error');
    }
  }

  const isRunning = status === 'loading-config' || status === 'indexing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={!isRunning ? onClose : undefined}>
      <div className="bg-white rounded-xl shadow-2xl w-[420px] p-6" onClick={e => e.stopPropagation()}>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">🔄</span>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Re-Indexieren</h2>
            <p className="text-xs text-slate-500">Mapping anwenden und Elasticsearch-Index aktualisieren</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)} disabled={isRunning}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {KNOWN_COUNTRIES.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} disabled={isRunning}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {KNOWN_LANGUAGES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          {status === 'loading-config' && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3">
              <Spinner /> MappingConfig wird geladen…
            </div>
          )}
          {status === 'indexing' && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
              <Spinner className="text-blue-600" />
              <div>
                <p className="font-medium">Indexierung läuft…</p>
                <p className="text-xs text-blue-500 mt-0.5">Das kann bei vielen Produkten einige Minuten dauern.</p>
              </div>
            </div>
          )}
          {status === 'done' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
              <span className="text-green-500 text-lg">✓</span>
              <p>
                Fertig{resultCount != null ? ` – ${resultCount.toLocaleString()} Produkte indexiert` : ''}.
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
              <span className="text-red-400 text-lg mt-0.5">✕</span>
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} disabled={isRunning}
            className="px-4 py-2 rounded text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50">
            {status === 'done' ? 'Schließen' : 'Abbrechen'}
          </button>
          {status !== 'done' && (
            <button onClick={handleReindex} disabled={isRunning}
              className="px-4 py-2 rounded text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center gap-2">
              {isRunning && <Spinner className="text-white" />}
              {isRunning ? 'Läuft…' : '🔄 Jetzt indexieren'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner({ className = 'text-slate-500' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
